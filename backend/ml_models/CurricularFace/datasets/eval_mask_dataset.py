import cv2
from torch.utils.data import Dataset, DataLoader
from Config import Config as conf

class Load_eval_mask_dataset(Dataset):
    """
    First: Load without duplicate images
    Second: Return image (name) and image (Tensor)
    """
    def __init__(self, pair_list, images_clean_dir, images_occ_dir, color=conf.input_shape[0]):
        self.images = self.unique_image(pair_list)
        self.images_clean_dir = images_clean_dir
        self.images_occ_dir = images_occ_dir

        self.color = color

    def __len__(self):
        return len(self.images)

    def __getitem__(self, index):
        img_name = self.images[index]
        if img_name.split('/')[1][:4] == "mask":
            images_dir = self.images_occ_dir
        else:
            images_dir = self.images_clean_dir
        if self.color == 3:
            image = cv2.imread(f"{images_dir}/{img_name}")
        else:
            image = cv2.imread(f"{images_dir}/{img_name}", 0)

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
    test_clean_path = "../../Data/Alignment_data/CASIA_Section/val"
    test_occ_path = "../../Data/Alignment_data/CASIA_Mask/val"
    test_txt = "../eval/mask_pair_txt/visualize_feature_map.txt"
    datasets = Load_eval_mask_dataset(test_txt, test_clean_path, test_occ_path)
    loader = DataLoader(dataset=datasets, batch_size=2, shuffle=False, num_workers=0)
    for data in loader:
        print(data)
        break