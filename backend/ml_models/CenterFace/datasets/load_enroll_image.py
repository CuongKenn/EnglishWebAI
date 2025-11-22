import os
import cv2
import torch
import numpy as np
from torch.utils.data import Dataset, DataLoader
from Config import Config as conf


class Load_enroll_image(Dataset):
    def __init__(self, images_dir):
        self.imgs_path = [f"{images_dir}/{img}" for img in os.listdir(images_dir)]
        self.out_size = 800
    def __len__(self):
        return len(self.imgs_path)

    def __getitem__(self, index):
        img_path = self.imgs_path[index]

        image = cv2.imread(img_path)
        max_wh = max(image.shape[0], image.shape[1])
        newImage = np.zeros((max_wh, max_wh, 3), np.uint8)
        newImage[:image.shape[0], :image.shape[1], :] = image
        newImage = cv2.resize(newImage, (self.out_size, self.out_size))
        scalar = max_wh / self.out_size
        newImage = conf.transforms(newImage)

        return img_path, newImage, scalar



if __name__ == "__main__":
    datasets = Load_enroll_image(f"../Joe")
    loader = DataLoader(dataset=datasets, batch_size=1, shuffle=False, num_workers=0)
    for data in loader:
        print(data[0])
        print(data[1])
        print(data[2])

        break