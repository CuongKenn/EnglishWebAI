"""
根據 data 資料夾中的相片
建立測試用的.txt檔案
"""

import os
import itertools
import random
from tqdm import tqdm
from Config import Config as conf

build_pair_txt = 'train'

if build_pair_txt == 'train':
    path = f"../../{conf.train_path}"
    path_mask = f"../../{conf.train_path}"
else:
    path = f"../../{conf.test_path}"
    path_mask = f"../../{conf.test_path}"

people = os.listdir(path)
people_mask = os.listdir(path_mask)

people = set(people)
people_mask = set(people_mask)

people_set = people & people_mask

same_person = []
different_person = []

for person in tqdm(people_set):
    person_path = f"{path}/{person}"
    person_mask_path = f"{path_mask}/{person}"
    imgs = os.listdir(person_path)
    imgs_mask = os.listdir(person_mask_path)
    if len(imgs) >= 1 and len(imgs_mask) >=1:
        for img1, img2 in itertools.product(imgs, imgs_mask):
            if img1 == img2:
                continue
            img1_path = f"{person_path[2:]}/{img1}"
            img2_path = f"{person_mask_path[2:]}/{img2}"
            same_person.append(f"{person}/{img1} {person}/{img2} 1")

            # same_person.append("Masked/" + person + "/" + img1 + " " + "Masked/" + person + "/" + img2 + " " + str(1))

for person in tqdm(people_set):
    copy_people_set = people_set.copy()
    copy_people_set.remove(person)
    random_select = random.choice(list(copy_people_set))
    while(len(os.listdir(f"{path_mask}/{random_select}"))<1):
        copy_people_set.remove(random_select)
        random_select = random.choice(list(copy_people_set))

    person_path = f"{path}/{person}"
    person_mask_path = f"{path_mask}/{random_select}"

    imgs = os.listdir(person_path)
    imgs_mask = os.listdir(person_mask_path)

    if len(imgs) >= 1 and len(imgs_mask) >=1:
        for img1, img2 in itertools.product(imgs, imgs_mask):
            img1_path = f"{person_path[2:]}/{img1}"
            img2_path = f"{person_mask_path[2:]}/{img2}"
            different_person.append(f"{person}/{img1} {random_select}/{img2} 0")

            # different_person.append("Masked/" + person + "/" + img1 + " " + "Masked/" + random_select + "/" + img2 + " " + str(0))

random.shuffle(same_person)
random.shuffle(different_person)

output_txt = same_person[:20000] + different_person[:20000]
random.shuffle(output_txt)

with open(f"{build_pair_txt}.txt", "w") as f:
    for i in output_txt:
        f.write(i + "\n")