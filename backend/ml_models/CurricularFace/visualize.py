import os
import cv2
import torch
import numpy as np
import matplotlib.pyplot as plt

from config import Config as conf
from models.seesawfacenet import SeesawFaceNet
from models.metric import CurricularFace



def draw_CAM(model, matric, img_path):
    """
    Plot Class Activation Map, visualize heatmap.
    :param model: load the pretrain model
    :param img_path: load the image path
    :param save_path: save the image path
    :param transform: image(numpy) to torch.Tensor --> transform
    :param visual_heatmap: visualize the heatmap on the original image
    :return: None
    """

    # load the image & preprocess
    img = cv2.imread(img_path)
    img = conf.transforms(img)
    img = img.unsqueeze(0)

    embedding, features = model.visualize_hm(img)
    fc_out = matric.visualize(embedding)
    cls = torch.argmax(fc_out).item()
    def extract(g):
        global features_grad
        features_grad = g

    features.register_hook(extract)
    pred_class = fc_out[:, cls]
    pred_class.backward()  # calculate gradient

    grads = features_grad

    pooled_grads = torch.nn.functional.adaptive_avg_pool2d(grads, (1, 1))

    # default dimension=1
    pooled_grads = pooled_grads[0]
    features = features[0]
    # The number of channels in the last feature map is 512
    for i in range(512):
        features[i, ...] *= pooled_grads[i, ...]

    heatmap = features.detach().numpy()
    heatmap = np.mean(heatmap, axis=0)

    heatmap = heatmap - np.min(heatmap)
    heatmap /= np.max(heatmap)

    img = cv2.imread(img_path)  # 用cv2加载原始图像
    heatmap = cv2.resize(heatmap, (img.shape[1], img.shape[0]))  # 将热力图的大小调整为与原始图像相同
    heatmap = np.uint8(255 * heatmap)  # 将热力图转换为RGB格式
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)  # 将热力图应用于原始图像

    superimposed_img = np.uint8(heatmap * 0.4 + img * 0.6)  # 这里的0.4是热力图强度因子
    cv2.imwrite(f"hm_{img_path}", superimposed_img)
    cv2.imshow("hm", superimposed_img)
    cv2.waitKey(0)

def draw_feature(model, img_path):
    # Feature map
    img = cv2.imread(img_path)
    img = cv2.resize(img, (112, 112))
    img_ = img.copy()

    img = conf.transforms(img)
    img = img.unsqueeze(0)

    _, outs = model.visualize_fm(img)

    for i, out in enumerate(outs):
        out = torch.mean(out, dim=1)
        out = out.cpu().detach().numpy()
        out = out.squeeze()
        out = (out - np.min(out)) / (np.max(out) - np.min(out))
        out = np.uint8(out * 255)
        out = cv2.resize(out, (112, 112))
        # cv2.imwrite(f"{i}_fm_map.jpg", out)
        cv2.imshow(f"{i}_fm_map.jpg", out)

        out = cv2.applyColorMap(out, cv2.COLORMAP_JET)  # 将热力图应用于原始图像
        superimposed_img = np.uint8(out * 0.4 + img_ * 0.6)  # 这里的0.4是热力图强度因子
        cv2.imwrite(f"./visualize_img/hm_map_{img_path.split('/')[-1]}", superimposed_img)
        cv2.imshow(f"{i}_hm_map.jpg", superimposed_img)
        cv2.waitKey(0)

        break


if __name__ == "__main__":
    class_num = 360232

    model = SeesawFaceNet().eval()
    matric = CurricularFace(conf.embedding_size, class_num).eval()

    model.load_state_dict(torch.load(f"checkpoints/30.pth"))
    # matric.load_state_dict(torch.load(f"checkpoints/metric.pth"))


    img_path = "./67_KN95.jpg"
    # Draw Heat map
    # draw_CAM(model, matric, img_path)

    #  Draw Feature map
    draw_feature(model, img_path)

