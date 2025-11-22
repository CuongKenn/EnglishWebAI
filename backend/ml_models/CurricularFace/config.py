import torch
import torchvision.transforms as T


class Config:

    # Model Setup
    epoch = 30
    batch_size = 300
    lr = 1e-1
    lr_dict = {7:1e-2, 12:1e-3, 15:5e-4, 19:1e-4, 21:5e-5, 24:1e-5}       # Initial training
    lr_step = 3         # Fine tune
    lr_decay = 0.5      # Fine tune
    weight_decay = 5e-4
    momentum = 0.5
    momentum_dict = {4: 0.6, 8: 0.75, 12: 0.9, 25: 0.95}  # Initial training
    embedding_size = 512
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    pin_memory = True
    num_workers = 4

    input_shape = [3, 112, 112]
    checkpoints = "./checkpoints"
    load_model = "25.pth"

    # datasets path
    ### Windows
    # train_path = "../Data/Alignment_data/CASIA_Section/train"
    # test_path = "../Data/Alignment_data/CASIA_Section/val"
    ### Linux
    train_path = "../Data/Glint360k"

    test_clean_path = "../Data/CASIA_Section/val"
    test_occ_path = "../Data/CASIA_Mask/val"

    train_txt = "./eval/pair_txt/train.txt"
    test_txt = "./eval/pair_txt/test.txt"
    test_mask_txt = "./eval/mask_pair_txt/test.txt"

    # transforms
    mean = [0.5, 0.5, 0.5]
    std = [0.5, 0.5, 0.5]

    transforms = T.Compose([
        T.ToTensor(),
        T.Normalize(mean=mean, std=std),
    ])
