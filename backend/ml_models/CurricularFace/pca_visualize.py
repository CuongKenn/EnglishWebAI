import os
import cv2
import torch
import numpy as np
import matplotlib.pyplot as plt
import collections


from sklearn.decomposition import PCA
from config import Config as conf
from models.seesawfacenet import SeesawFaceNet
from models.metric import CurricularFace
from datasets.enrollment_dataset import Load_Enroll_Dataset
from torch.utils.data import DataLoader

from mpl_toolkits.mplot3d import Axes3D

def l2_norm(input, axis=1):
    norm = torch.norm(input, 2, axis, True)
    output = torch.div(input, norm)
    return output

recog_model = SeesawFaceNet()
recog_model.load_state_dict(torch.load(f"./checkpoints/30.pth"))
recog_model.eval()
recog_model.to('cuda')

enrollment_dict = collections.OrderedDict()
enrollment_dataset = Load_Enroll_Dataset(f"./Member")
enrollment_loader = DataLoader(dataset=enrollment_dataset, batch_size=20, shuffle=False)

for i, (img_paths, imgs) in enumerate(enrollment_loader):
    with torch.no_grad():
        imgs = imgs.to('cuda')
        embeddings = recog_model(imgs)
    res = {img_path: embedding[None, :] for (img_path, embedding) in zip(img_paths, embeddings)}
    enrollment_dict.update(res)

enrollment_label = list(enrollment_dict.keys())

enrollment_vector = torch.cat(list(enrollment_dict.values()))
enrollment_vector = l2_norm(enrollment_vector)
enrollment_vector = (enrollment_vector.to('cpu')).numpy()

pca = PCA(n_components=3)
pca.fit(enrollment_vector)
vector_pca = pca.transform(enrollment_vector)

color = ['#0000C6', '#6A6AFF', '#CECEFF', '#007979', '#006030',
         '#02C874', '#28FF28', '#FFFF37', '#844200', '#6C3365',
         '#AE0000', '#FF79BC', '#9F4D95', '#5151A2', '#A5A552',
         '#000079', '#2828FF', '#D9B3B3']

num = 60

# 3D
fig = plt.figure(figsize=(12, 6))
ax = Axes3D(fig)

for n_c, i in enumerate(range(0, vector_pca.shape[0], num)):
    ax.scatter(vector_pca[i:i+num//2, 0], vector_pca[i:i+num//2, 1], vector_pca[i:i+num//2:, 2], c=color[n_c], alpha=1, \
               label=f'{enrollment_label[i].split("/")[2]}')
    ax.scatter(vector_pca[i+num//2:i+num, 0], vector_pca[i+num//2:i+num, 1], vector_pca[i+num//2:i+num:, 2], c=color[n_c], alpha=1, \
                   marker='x')
# 2D
# for n_c, i in enumerate(range(0, vector_pca.shape[0], num)):
#     plt.scatter(vector_pca[i:i+num//2, 0], vector_pca[i:i+num//2, 1], c=color[n_c], alpha=1, \
#                label=f'{enrollment_label[i].split("/")[2]}')
#     plt.scatter(vector_pca[i+num//2:i+num, 0], vector_pca[i+num//2:i+num, 1], c=color[n_c], alpha=1, \
#                    marker='x')
plt.legend(loc=5)
plt.show()


