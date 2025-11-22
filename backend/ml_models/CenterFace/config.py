import torch
from torchvision import transforms as T


class Config:
    # using datasets
    train_img_path = "../Data/WIDER/WIDER_train/images"
    train_txt_path = "../Data/WIDER/clean_train_label.txt"

    # validation datasets
    val_img_path = "../Data/WIDER/WIDER_val/images"
    val_txt_path = "../Data/WIDER/val_label.txt"
    save_prediction = "./evaluate/prediction"
    gt = "./evaluate/ground_truth"
    # save pth
    checkpoints = "checkpoints"
    # load_model = "500.pth"
    load_path = "500.pth"


    # training parameter
    epoch = 500
    lr = 1e-3
    lr_dict = {50:1e-4, 100:1e-3, 150:1e-4, 200:1e-3, 250:1e-4, 300:5e-5, 400:1e-5, 450:5e-6}
    batch_size = 20
    pin_memory = True
    num_workers = 3
    device = "gpu" if torch.cuda.is_available() else "cpu"
    # device = torch.device('cpu')
    # import pdb
    # pdb.set_trace()

    threshold = 0.4

    # preprocess
    insize = [800, 800]
    channels = 3
    downscale = 4
    mean = [0.408, 0.447, 0.47]
    std = [0.289, 0.274, 0.278]

    transforms = T.Compose([
        T.ToTensor(),
        T.Normalize(mean=mean, std=std)
    ])








