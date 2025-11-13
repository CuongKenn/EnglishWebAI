import os
import numpy as np
import torch
import torch.nn.functional as F
from tqdm import tqdm
from torch.utils.data import DataLoader
from config import Config as conf
from datasets import common
from models.centerface import CenterFace
from datasets.eval_datasets import Load_eval_dataset
from evaluate.evaluation import evaluation

def nms(objs, iou=0.5):
    """
    Use obj.score to sort the items and compare the iou of each obj from high score to low score.
    The high score obj has priority.

    :param objs: models detect result
    :param iou: iou threshold
    :return: after nms obj
    """
    if objs is None or len(objs) <= 1:
        return objs

    objs = sorted(objs, key=lambda obj: obj.score, reverse=True)
    keep = []
    flags = [0] * len(objs)     # if delete flags[i] = 1
    for index, obj in enumerate(objs):
        if flags[index] != 0:
            continue
        keep.append(obj)
        for j in range(index + 1, len(objs)):
            if flags[j] == 0 and obj.iou(objs[j]) > iou:
                flags[j] = 1
    return keep

def detect(model, image, threshold=0.2, nms_iou=0.5):
    # eval loader have made common.pad before to tensor
    with torch.no_grad():
        hm, box, landmark = model(image)
    hm_pool = F.max_pool2d(hm, 3, 1, 1)     # nms of matlab_eval_centernet (filt some obj with high repeatability)
    scores, indices = ((hm == hm_pool).float() * hm).view(2, -1).cpu().topk(1000)

    hm_height, hm_width = hm.shape[2:]

    indices = indices.squeeze()
    ys = (indices // hm_width).data.numpy()
    xs = (indices  % hm_width).data.numpy()
    scores = scores.squeeze().data.numpy()
    box = box.cpu().squeeze().data.numpy()
    landmark = landmark.cpu().squeeze().data.numpy()

    stride = 4
    objs = []

    for cls in range(hm.shape[1]):
        for cx, cy, score in zip(xs[cls], ys[cls], scores[cls]):
            if score < threshold:
                break
            x, y, r, b = box[:, cy, cx]
            xyrb = (np.array([cx, cy, cx, cy]) + [-x, -y, r, b]) * stride
            x5y5 = landmark[:, cy, cx]
            x5y5 = (common.exp(x5y5 * 4) + ([cx] * 5 + [cy] * 5)) * stride
            box_landmark = list(zip(x5y5[:5], x5y5[5:]))
            objs.append(common.BBox(cls, xyrb=xyrb, score=score, landmark=box_landmark))

    return nms(objs, iou=nms_iou)

def evaluate_AP(model, loader):
    for img, img_name in tqdm(loader):
        img = img.to(conf.device)
        dir, name = img_name[0].split('/')
        files = []
        files.append(name)

        if dir not in os.listdir(conf.save_prediction):
            os.mkdir(f"{conf.save_prediction}/{dir}")

        objs = detect(model, img)
        files.append(str(len(objs)))

        for obj in objs:
            files.append(f"{obj.x} {obj.y} {obj.width} {obj.height} {obj.score}")

        with open(f"{conf.save_prediction}/{dir}/{name.split('.')[0]}.txt", "w") as f:
            for line in files:
                f.write(f"{line}\n")

    easy, medium, hard = evaluation(conf.save_prediction, conf.gt)
    return easy, medium, hard

if __name__ == "__main__":

    device = conf.device
    model = CenterFace()
    model.load_state_dict(torch.load(f"{conf.checkpoints}/{conf.load_model}"))
    model.eval()
    model.to(device)

    datasets = Load_eval_dataset(conf.val_txt_path, conf.val_img_path)
    loader = DataLoader(dataset=datasets, batch_size=1, shuffle=False)

    for img, img_name in tqdm(loader):
        img = img.to(device)
        dir, name = img_name[0].split('/')
        files = []
        files.append(name)

        if dir not in os.listdir(conf.save_prediction):
            os.mkdir(f"{conf.save_prediction}/{dir}")

        objs = detect(model, img)
        files.append(str(len(objs)))

        for obj in objs:
            files.append(f"{obj.x} {obj.y} {obj.width} {obj.height} {obj.score}")

        with open(f"{conf.save_prediction}/{dir}/{name.split('.')[0]}.txt", "w") as f:
            for line in files:
                f.write(f"{line}\n")

    easy, medium, hard = evaluation(conf.save_prediction, conf.gt)
