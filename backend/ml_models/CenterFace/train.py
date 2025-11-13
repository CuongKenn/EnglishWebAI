import numpy as np
import math
import torch
import torch.nn as nn
import torch.optim as optim
import matplotlib.pyplot as plt

from tqdm import tqdm
from torch.utils.data import DataLoader

from eval import evaluate_AP
from config import Config as conf
from datasets.common import AverageMeter
from datasets.datasets import Load_Dataset
from datasets.eval_datasets import Load_eval_dataset

from models.losses import *
from models.centerface import CenterFace



# Setup DataLoader
train_dataset = Load_Dataset(conf.train_txt_path, conf.train_img_path, conf.mean, conf.std, conf.insize)
train_loader = DataLoader(dataset=train_dataset, batch_size=conf.batch_size, shuffle=True, \
                        pin_memory=conf.pin_memory, num_workers=conf.num_workers)

eval_dataset = Load_eval_dataset(conf.val_txt_path, conf.val_img_path)
eval_loader = DataLoader(dataset=eval_dataset, batch_size=1, shuffle=False, \
                        pin_memory=False, num_workers=0)

# Setup Model
device = conf.device
model = CenterFace()
model = model.to(device)
optimizer = optim.Adam(model.parameters(), lr=conf.lr)
lr_dict = conf.lr_dict

# Setup Loss
Focal_loss = FocalLoss()
Ciou_loss = CIoULoss()
Landmark_loss = WingLoss(w=2)

Epoch_recoder = []
hm_loss_list = []
ciou_loss_list = []
lm_loss_list = []
total_loss_list = []

hm_losses = AverageMeter()
reg_losses = AverageMeter()
lm_losses = AverageMeter()
total_losses = AverageMeter()

fig, ax = plt.subplots()
fig.subplots_adjust(hspace=0.5, wspace=0.5)  # 設定子圖的間隔

for e in range(conf.epoch):
    hm_losses.reset()
    reg_losses.reset()
    lm_losses.reset()
    total_losses.reset()
    for i, (imgs, hm_gt, hm_posweight, reg_tlrb, reg_mask, lm_gt, lm_mask, num_objs, keep_mask) in \
            tqdm(enumerate(train_loader), desc=f"Epoch {e + 1}/{conf.epoch}", ascii=True, total=len(train_loader)):

        imgs = imgs.to(device)
        hm_gt = hm_gt.to(device)
        hm_posweight = hm_posweight.to(device)
        reg_tlrb = reg_tlrb.to(device)
        reg_mask = reg_mask.to(device)
        lm_gt = lm_gt.to(device)
        lm_mask = lm_mask.to(device)
        keep_mask= keep_mask.to(device)
        batch_objs = sum(num_objs)

        hm, tlrb, lm = model(imgs)


        hm_loss = Focal_loss(hm, hm_gt, hm_posweight, keep_mask=keep_mask) / batch_objs
        reg_loss = Ciou_loss(tlrb, reg_tlrb, reg_mask)
        lm_loss = Landmark_loss(lm, lm_gt, lm_mask)

        hm_losses.update(hm_loss, conf.batch_size)
        reg_losses.update(reg_loss, conf.batch_size)
        lm_losses.update(lm_loss, conf.batch_size)


        if e < 50:
            lambda_hm = 1
            lambda_reg = 5
            lambda_lm = 0.1
        elif e < 100:
            lambda_hm = 10
            lambda_reg = 5
            lambda_lm = 1
        elif e < 150:
            lambda_hm = 1
            lambda_reg = 5
            lambda_lm = 0.1
        elif e < 200:
            lambda_hm = 5
            lambda_reg = 5
            lambda_lm = 2.5
        elif e < 250:
            lambda_hm = 1
            lambda_reg = 5
            lambda_lm = 0.1
        elif e < 300:
            lambda_hm = 5
            lambda_reg = 5
            lambda_lm = 5
        elif e < 350:
            lambda_hm = 1
            lambda_reg = 10
            lambda_lm = 1
        else:
            lambda_hm = 1
            lambda_reg = 1
            lambda_lm = 1


        # lambda_hm = 1
        # lambda_reg = 5
        # lambda_lm = 0.1

        total_loss = hm_loss * lambda_hm + lambda_reg * reg_loss + lambda_lm * lm_loss
        total_losses.update(total_loss, conf.batch_size)


        optimizer.zero_grad()
        total_loss.backward()
        optimizer.step()

    Epoch_recoder.append(e)
    hm_loss_list.append(hm_losses.avg)
    ciou_loss_list.append(reg_losses.avg)
    lm_loss_list.append(lm_losses.avg)
    total_loss_list.append(total_losses.avg)
    print(f"Epoch:{e + 1}/{conf.epoch}, hm:{hm_losses.avg:.5f}, ciou:{reg_losses.avg:.5f}, "
          f"lm:{lm_losses.avg:.5f}, total:{total_losses.avg:.5f}")

    # Record the loss trend
    with open(conf.checkpoints + "/Loss_trend.txt", "a") as f:
        f.write(f"Epoch:{e + 1}/{conf.epoch}, hm:{hm_losses.avg:.5f}, ciou:{reg_losses.avg:.5f}, "
                f"lm:{lm_losses.avg:.5f}, total:{total_losses.avg:.5f}\n")

    # Plot the loss trend
    for i in range(1, 5):
        plt.subplot(2, 2, i)
        if i == 1:
            plt.title("Heatmap")
            plt.plot(Epoch_recoder, hm_loss_list)
        elif i == 2:
            plt.title("CIoU")
            plt.plot(Epoch_recoder, ciou_loss_list)
        elif i == 3:
            plt.title("Landmarks")
            plt.plot(Epoch_recoder, lm_loss_list)
        else:
            plt.title("Total")
            plt.plot(Epoch_recoder, total_loss_list)

        plt.xlabel("Epoch")
        plt.ylabel("Loss")
    plt.savefig(conf.checkpoints + "/Loss_trend.png")
    plt.clf()
    plt.cla()

    if (e + 1) % 10 == 0:
        # Save weight of models
        torch.save(model.state_dict(), f"{conf.checkpoints}/{e + 1}.pth")
        torch.save(optimizer.state_dict(), f"{conf.checkpoints}/optim.pth")

        if (e + 1) >= 50:   # Otherwise the inference time is too long.
            # Compute AP50 (when threshold=0.2)
            model.eval()    # Start to inference
            easy, medium, hard = evaluate_AP(model, eval_loader)

            # Record AP50 (when threshold=0.2)
            with open(conf.checkpoints + "/Loss_trend.txt", "a") as f:
                f.write(f"Epoch:{e + 1}/{conf.epoch}, Easy:{easy:.5f}, Medium:{medium:.5f}, Hard:{hard:.5f}\n")

            model.train()   # End to inference

    # Adjust learning rate
    if e in lr_dict.keys():
        for param_group in optimizer.param_groups:
            param_group['lr'] = lr_dict[e]