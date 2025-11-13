import os
import cv2
import torch
from torch.utils.data import Dataset, DataLoader
from datasets.augmentation import face_augmentation
from Config import Config as conf

class Load_train_dataset(Dataset):
    def __init__(self, images_dir):

        self.total_imgs, self.items = self.load_identities(images_dir)

    def __len__(self):
            return self.total_imgs

    def __getitem__(self, index):
        img_path, label = self.items[index]
        image = cv2.imread(img_path)


        image = face_augmentation(image)

        # Visualize
        # cv2.imshow("image", image)
        # cv2.waitKey(0)

        image = conf.transforms(image)
        label = torch.tensor(label)
        return image, label

    def load_identities(self, images_dir):
        ids = os.listdir(images_dir)
        items = []
        total_imgs = 0
        for label, id in enumerate(ids):
            imgs_clean = os.listdir(f"{images_dir}/{id}")
            total_imgs += len(imgs_clean)
            for img_clean in imgs_clean:
                # img_name, id
                item = [f"{images_dir}/{id}/{img_clean}", label]
                items.append(item)

        return total_imgs, items

if __name__ == "__main__":
    test_clean_path = "../../Data/Alignment_data/Test_G"

    datasets = Load_train_dataset(test_clean_path)
    loader = DataLoader(dataset=datasets, batch_size=1, shuffle=False)
    for data in loader:
        # print(data[0].shape)
        print(data[1])
        # break