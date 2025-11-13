import numpy as np
import cv2
import math
import torchvision.transforms.functional as T
from torch.utils.data import Dataset, DataLoader
from dataset.common import *

from dataset import augmentation
from Config import Config as conf


class Load_Dataset(Dataset):
    def __init__(self, label_txt_path, images_dir, mean, std, insize):
        self.height, self.width = insize
        self.items = self.load_widerface(label_txt_path, images_dir)
        self.mean = mean
        self.std = std
        self.classes_num = 2

    def __len__(self):
        return len(self.items)

    def __getitem__(self, index):
        img_path, objs = self.items[index]
        image = cv2.imread(img_path)

        keepsize = 12
        image, objs = augmentation.webface(image, objs, self.width, self.height, keepsize=0)

        # Visualize image
        # image_ = image.copy()
        # print(img_path)
        # for obj in objs:
        #     if obj.classification == 0:
        #         cv2.rectangle(image_, (int(obj.x), int(obj.y), int(obj.width), int(obj.height)), (255, 0, 0), 2)
        #     else:
        #         cv2.rectangle(image_, (int(obj.x), int(obj.y), int(obj.width), int(obj.height)), (0, 0, 255), 2)
        #
        #     if obj.haslandmark:
        #         for i in range(len(obj.landmark)):
        #             x, y = obj.landmark[i][:2]
        #             cv2.circle(image_, intv(x, y), 3, (0, 0, 255), -1, 2)
        # cv2.imshow("image_", image_)
        # cv2.waitKey(0)

        image = conf.transforms(image)

        posweight_radius = 2
        downsample = 4
        down_width = self.width // downsample
        down_height = self.height // downsample

        heatmap_gt = np.zeros((self.classes_num, down_height, down_width), np.float32)
        heatmap_posweight = np.zeros((self.classes_num, down_height, down_width), np.float32)
        keep_mask = np.ones((self.classes_num, down_height, down_width), np.float32)
        distance_map = np.zeros((self.classes_num, down_height, down_width), np.float32) + 1000

        reg_tlrb = np.zeros((1 * 4, down_height, down_width), np.float32)
        reg_mask = np.zeros((1, down_height, down_width), np.float32)
        landmark_gt = np.zeros((1 * 10, down_height, down_width), np.float32)
        landmark_mask = np.zeros((1, down_height, down_width), np.float32)

        for obj in objs:
            isSmallObj = obj.area < keepsize * keepsize
            classes = obj.classification
            if isSmallObj:
                cx, cy = obj.safe_scale_center(1 / downsample, down_width, down_height)
                keep_mask[classes, cy, cx] = 0
                w, h = obj.width / downsample, obj.height / downsample

                x0 = int(clip_value(cx - w // 2, down_width - 1))
                y0 = int(clip_value(cy - h // 2, down_height - 1))
                x1 = int(clip_value(cx + w // 2, down_width - 1) + 1)
                y1 = int(clip_value(cy + h // 2, down_height - 1) + 1)
                if x1 - x0 > 0 and y1 - y0 > 0:
                    keep_mask[classes, y0:y1, x0:x1] = 0

        for obj in objs:

            classes = obj.classification
            cx, cy = obj.safe_scale_center(1 / downsample, down_width, down_height)
            reg_box = np.array(obj.box) / downsample
            isSmallObj = obj.area < keepsize * keepsize

            if isSmallObj:
                if obj.area >= 5 * 5:
                    distance_map[classes, cy, cx] = 0
                    reg_tlrb[0: 4, cy, cx] = reg_box
                    reg_mask[0, cy, cx] = 1
                continue

            w, h = obj.width / downsample, obj.height / downsample
            x0 = int(clip_value(cx - w // 2, down_width - 1))
            y0 = int(clip_value(cy - h // 2, down_height - 1))
            x1 = int(clip_value(cx + w // 2, down_width - 1) + 1)
            y1 = int(clip_value(cy + h // 2, down_height - 1) + 1)
            if x1 - x0 > 0 and y1 - y0 > 0:
                keep_mask[0, y0:y1, x0:x1] = 1

            w_radius, h_radius = truncate_radius((obj.width, obj.height))
            gaussian_map = draw_truncate_gaussian(heatmap_gt[classes, :, :], (cx, cy), h_radius, w_radius)

            mxface = 300
            miface = 25
            mxline = max(obj.width, obj.height)
            gamma = (mxline - miface) / (mxface - miface) * 10
            gamma = min(max(0, gamma), 10) + 1
            draw_gaussian(heatmap_posweight[classes, :, :], (cx, cy), posweight_radius, k=gamma)

            range_expand_x = math.ceil(w_radius)
            range_expand_y = math.ceil(h_radius)

            min_expand_size = 3
            range_expand_x = max(min_expand_size, range_expand_x)
            range_expand_y = max(min_expand_size, range_expand_y)

            icx, icy = cx, cy
            reg_landmark = None
            fill_threshold = 0.3

            if obj.haslandmark:
                reg_landmark = np.array(obj.x5y5_cat_landmark) / downsample
                x5y5 = [cx] * 5 + [cy] * 5
                rvalue = (reg_landmark - x5y5)
                landmark_gt[0:10, cy, cx] = np.array(log(rvalue)) / 4
                landmark_mask[0, cy, cx] = 1

            if not obj.rotate:
                for cx in range(icx - range_expand_x, icx + range_expand_x + 1):
                    for cy in range(icy - range_expand_y, icy + range_expand_y + 1):
                        if cx < down_width and cy < down_height and cx >= 0 and cy >= 0:

                            my_gaussian_value = 0.9
                            gy, gx = cy - icy + range_expand_y, cx - icx + range_expand_x
                            if gy >= 0 and gy < gaussian_map.shape[0] and gx >= 0 and gx < gaussian_map.shape[1]:
                                my_gaussian_value = gaussian_map[gy, gx]

                            distance = math.sqrt((cx - icx) ** 2 + (cy - icy) ** 2)
                            if my_gaussian_value > fill_threshold or distance <= min_expand_size:
                                already_distance = distance_map[classes, cy, cx]
                                my_mix_distance = (1 - my_gaussian_value) * distance

                                if my_mix_distance > already_distance:
                                    continue

                                distance_map[classes, cy, cx] = my_mix_distance
                                reg_tlrb[0: 4, cy, cx] = reg_box
                                reg_mask[0, cy, cx] = 1

        return image, heatmap_gt, heatmap_posweight, reg_tlrb, reg_mask, landmark_gt, landmark_mask, len(
            objs), keep_mask

    def process_label(self, labels):
        result = []
        for label in labels:
            x, y, w, h = label[:4]
            box = [x, y, x + w - 1, y + h - 1]      # xywh to x1y1x2y2
            cls = int(label[20])
            landmarks = None

            # if w * h < 4 * 4:       # ignore small face
            #     continue

            if len(label) >= 20:
                landmarks = []
                for i in range(4, 19, 3):
                    if label[i+2] == -1:
                        landmarks = None
                        break
                    x, y = label[i:i+2]
                    landmarks.append([x, y])

            result.append(BBox(cls=cls, xyrb=box, landmark=landmarks, rotate=False))
        return result

    def load_widerface(self, label_txt_path, images_dir):
        """
        wider.txt檔案
        回傳檔名、標註項目
        # 0--Parade/0_Parade_marchingband_1_849.jpg
        449 330 122 149 488.906 373.643 0.0 542.089 376.442 0.0 515.031 412.83 0.0 485.174 425.893 0.0 538.357 431.491 0.0 0.82
        """
        with open(label_txt_path, "r", encoding="utf-8") as f:
            lines = f.read()
        data = lines.split("#")[1:]
        data = map(lambda record: record.split('\n'), data)  # map(function list, iteration)
        files = []

        for record in data:
            record = [r.strip() for r in record if r]
            name, labels = record[0], record[1:]
            labels = np.loadtxt(labels).reshape(len(labels), -1)
            files.append([f"{images_dir}/{name}", self.process_label(labels)])

        return files



if __name__ == "__main__":
    label_txt_path = "../../Data/WIDER/clean_train_label.txt"
    images_dir = "../../Data/WIDER/WIDER_train/images"
    mean = [0.408, 0.447, 0.47]
    std = [0.289, 0.274, 0.278]
    datasets = Load_Dataset(label_txt_path, images_dir, mean=mean, std=std, insize=(600, 600))
    train_loader = DataLoader(dataset=datasets, batch_size=1, shuffle=True, num_workers=0)
    for i, data in enumerate(train_loader):
        image = data[-1]
        # print(image)
        # if i > 50:
        #     break