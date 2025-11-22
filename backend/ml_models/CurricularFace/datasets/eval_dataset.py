import cv2
from torch.utils.data import Dataset, DataLoader
from Config import Config as conf

class Load_eval_dataset(Dataset):
    """
    First: Load without duplicate images
    Second: Return image (name) and image (Tensor)
    """
    def __init__(self, pair_list, images_dir, color=conf.input_shape[0]):
        self.images = self.unique_image(pair_list)
        self.images_dir = images_dir
        self.color = color

    def __len__(self):
        return len(self.images)

    def __getitem__(self, index):
        img_name = self.images[index]

        if self.color == 3:
            image = cv2.imread(f"{self.images_dir}/{img_name}")
        else:
            image = cv2.imread(f"{self.images_dir}/{img_name}", 0)
        # cv2.imwrite("image.png", image)
        # cv2.imshow("image", image)
        image = conf.transforms(image)
        return img_name, image

    def unique_image(self, pair_list):
        """
        Returns: Without duplicate images (set)
        """
        with open(pair_list, 'r') as f:
            pairs = f.readlines()
        unique = set()
        for pair in pairs:
            id1, id2, _ = pair.split()
            unique.add(id1)
            unique.add(id2)
        return list(unique)

if __name__ == "__main__":
    test_path = "../../Data/Alignment_data/CASIA_Section/val"
    test_txt = "../eval/pair_txt/visualize_feature_map.txt"
    datasets = Load_eval_dataset(test_txt, test_path)
    loader = DataLoader(dataset=datasets, batch_size=2, shuffle=False, num_workers=0)
    for data in loader:
        print(data)
        break