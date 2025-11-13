import os
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.optim as optim

from tqdm import tqdm
from torch.utils.data import DataLoader

from models.seesawfacenet import SeesawFaceNet, seperate_model_bn
from models.metric import CurricularFace, ArcFace

from datasets.common import *
from datasets.dataset import Load_train_dataset
from datasets.eval_dataset import Load_eval_dataset
from datasets.eval_mask_dataset import Load_eval_mask_dataset
from config import Config as conf
from eval import evaluate_accuracy
from eval_mask import evaluate_mask_accuracy

# Setup DataLoader
train_datasets = Load_train_dataset(images_dir=conf.train_path)
train_loader = DataLoader(dataset=train_datasets, batch_size=conf.batch_size, shuffle=True,
                          num_workers=conf.num_workers, pin_memory=conf.pin_memory)

val_datasets = Load_eval_dataset(pair_list=conf.test_txt, images_dir=conf.test_clean_path)
val_loader = DataLoader(dataset=val_datasets, batch_size=10, shuffle=False,
                        num_workers=4, pin_memory=False)

val_mask_datasets = Load_eval_mask_dataset(pair_list=conf.test_mask_txt,
                                           images_clean_dir=conf.test_clean_path, images_occ_dir=conf.test_occ_path)
val_mask_loader = DataLoader(dataset=val_mask_datasets, batch_size=10, shuffle=False,
                             num_workers=4, pin_memory=False)

# Setup Model
device = conf.device
class_num = len(os.listdir(conf.train_path))
model = SeesawFaceNet().to(device)
modules_wo_bn, modules_bn = seperate_model_bn(model)
metric = CurricularFace(conf.embedding_size, class_num).to(device)
ce_loss = nn.CrossEntropyLoss()
optimizer = optim.SGD([{'params': modules_wo_bn + list(metric.parameters()), 'weight_decay': conf.weight_decay},
                       {'params': modules_bn}], lr=conf.lr, momentum=conf.momentum)
lr_dict = conf.lr_dict
momentum_dict = conf.momentum_dict

# If an accident occurs during training, it can load the parameters.
# model.load_state_dict(torch.load(f"{conf.checkpoints}/2.pth"))
# metric.load_state_dict(torch.load(f"{conf.checkpoints}/matric.pth"))
# optimizer.load_state_dict(torch.load(f"{conf.checkpoints}/optim.pth"))

# Plot Epoch & Loss figure
Loss_recoder = []
Epoch_recoder = []
train_acc_recoder = []

losses = AverageMeter()


for e in range(conf.epoch):
    model.train()
    losses.reset()
    for i, (datas, labels) in enumerate(tqdm(train_loader, desc=f"Epoch {e + 1}/{conf.epoch}", ascii=True,
                                            total=len(train_loader))):
        datas = datas.to(device)
        labels = labels.to(device)

        embeddings = model(datas)
        thetas = metric(embeddings, labels)
        loss = ce_loss(thetas, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        losses.update(loss.data.item(), conf.batch_size)     # record loss
        print(losses.avg)
        if i % 250 == 0:
            Epoch_recoder.append(e + i / len(train_loader))
            Loss_recoder.append(losses.avg)

            # Plot figure
            plt.plot(Epoch_recoder, Loss_recoder)
            plt.xlabel("Epoch")
            plt.ylabel("Loss")
            plt.savefig(conf.checkpoints + "/Loss_trend.png")

    if (e + 1) % 1 == 0:
        torch.save(model.state_dict(), f"{conf.checkpoints}/{e + 1}.pth")
        torch.save(optimizer.state_dict(), f"{conf.checkpoints}/optim.pth")
        torch.save(metric.state_dict(),  f"{conf.checkpoints}/matric.pth")

    # Start to inference
    model.eval()
    test_clean_acc, test_clean_th = evaluate_accuracy(conf.test_txt, model, val_loader)
    test_occ_acc, test_occ_th = evaluate_mask_accuracy(conf.test_mask_txt, model, val_mask_loader)

    print(f"Epoch: {e + 1}\tLoss: {losses.avg}\n"
          f"Validation Clean Acc: {test_clean_acc:.5f}\tValidation Th: {test_clean_th:.5f}\n"
          f"Validation Occ Acc  : {test_occ_acc:.5f}\tValidation Th: {test_occ_th:.5f}\n")

    # Record acc and th
    with open(f"{conf.checkpoints}/Loss_trend.txt", "a") as f:
        f.write(f"Epoch: {e + 1}\tLoss: {losses.avg}\n"
                f"Validation Clean Acc: {test_clean_acc:.5f}\tValidation Th: {test_clean_th:.5f}\n"
                f"Validation Occ Acc  : {test_occ_acc:.5f}\tValidation Th: {test_occ_th:.5f}\n")

    # Modify LR
    if e + 1 in lr_dict.keys():
        for param_group in optimizer.param_groups:
            param_group['lr'] = lr_dict[e + 1]

    # Modify Momentum
    if e + 1 in momentum_dict.keys():
        for param_group in optimizer.param_groups:
            param_group['momentum'] = momentum_dict[e + 1]

