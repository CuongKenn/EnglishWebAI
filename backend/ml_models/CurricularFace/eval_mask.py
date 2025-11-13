import os
import os.path as osp
import torch
import torch.nn as nn
import numpy as np
import cv2
from tqdm import tqdm
from torch.utils.data import DataLoader
from config import Config as conf
from datasets.eval_mask_dataset import Load_eval_mask_dataset
from models.seesawfacenet import SeesawFaceNet
from models.seesawfacenet import SeesawFaceNet

def threshold_search(similarities, labels):
    """
    如何決定一個距離，來判定是不是同個人
    首先先取一對人臉作為初始的距離閾值
    用這個閾值作為分類依據，大於th就是同一張臉，小於則為不同
    計算這樣劃分的準確率
    並接著取下一對人臉作為th，直到所有的人臉隊都取完
    並回傳最佳的acc, th
    """
    similarities = torch.tensor(similarities)
    labels = torch.tensor(labels)

    best_acc = 0
    best_th = 0
    for i in range(len(similarities)):
        th = similarities[i]
        pred_labels = (similarities >= th)
        acc = torch.mean((pred_labels == labels).float())
        if acc > best_acc:
            best_acc = acc
            best_th = th

    return best_acc, best_th


def compute_accuracy(feature_dict, pair_list):

    with open(pair_list, 'r') as f:
        pairs = f.readlines()

    similarities = []
    labels = []
    for pair in pairs:
        img1, img2, label = pair.split()
        feature1 = feature_dict[img1]
        feature2 = feature_dict[img2]
        label = int(label)

        similarity = torch.cosine_similarity(feature1, feature2, dim=0)
        similarities.append(similarity)
        labels.append(label)

    accuracy, threshold = threshold_search(similarities, labels)
    return accuracy, threshold

def evaluate_mask_accuracy(pair_list, model, eval_loader):
    """
    eval_pair_list: face1 face2 label ... (txt)
    model: inference model
    eval_loader: DataLoader(datasets=datasets, batch_size=N, shuffle=False)

    Return: accuracy, threshold
    """
    feature_dict = dict()
    model.eval()
    for img_names, images in tqdm(eval_loader, desc="Calculation Acc"):
        images = images.to(conf.device)
        with torch.no_grad():
            embeddings = model(images)
        for img_name, embedding in zip(img_names, embeddings):
            feature_dict[img_name] = embedding
    accuracy, threshold = compute_accuracy(feature_dict, pair_list)
    return accuracy, threshold

if __name__ == "__main__":
    # Setup model
    device = conf.device
    model = SeesawFaceNet(conf.input_shape[0], conf.embedding_size)
    model.load_state_dict(torch.load(f"{conf.checkpoints}/{conf.load_model}"))
    model.eval()
    model.to(device)

    test_txt = "./eval/mask_pair_txt/visualize_feature_map.txt"
    test_clean_path = "../Data/Alignment_data/CASIA_Section/val"
    test_occ_path = "../Data/Alignment_data/CASIA_Mask/val"
    datasets = Load_eval_mask_dataset(test_txt, test_clean_path, test_occ_path)
    loader = DataLoader(dataset=datasets, batch_size=2, shuffle=False)

    # feature_dict = dict()
    #
    # for img_names, images in tqdm(loader):
    #     images = images.to(device)
    #     with torch.no_grad():
    #         _, embeddings = model(images)
    #     for img_name, embedding in zip(img_names, embeddings):
    #         feature_dict[img_name] = embedding
    #
    # accuracy, threshold = compute_accuracy(feature_dict, conf.test_txt)

    accuracy, threshold = evaluate_mask_accuracy(test_txt, model, loader)
    print(
        f"Verify data: {conf.test_txt}\n"
        f"Accuracy: {accuracy:.3f}\n"
        f"Threshold: {threshold:.3f}\n"
    )