import cv2
import torch
from torch.utils.data import Dataset, DataLoader
from Config import Config as conf
from dataset import common

class Load_eval_dataset(Dataset):
    def __init__(self, label_txt_path, images_dir):
        self.items = self.load_eval_widerface(label_txt_path, images_dir)

    def __len__(self):
        return len(self.items)

    def __getitem__(self, index):
        img_path, img_name = self.items[index]
        image = cv2.imread(img_path)
        image = common.pad(image)
        image = conf.transforms(image)

        return image, img_name

    def load_eval_widerface(self, label_txt_path, images_dir):
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
            name = record[0]
            img_name = name
            files.append([f"{images_dir}/{name}", img_name])

        return files

if __name__ == "__main__":
    datasets = Load_val_dataset(f"../{conf.val_txt_path}", f"../{conf.val_img_path}")
    loader = DataLoader(dataset=datasets, batch_size=1, shuffle=False, num_workers=0)
    for data in loader:
        print(data[0])
        print(data[1][0])
        break