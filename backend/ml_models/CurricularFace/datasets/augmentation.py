import random
import cv2
import numpy as np


def randrf(low, high):
    return random.uniform(0, 1) * (high - low) + low

def grayscale(image):
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def lighting_(image, alphastd, eigval, eigvec):
    alpha = np.random.RandomState().normal(scale=alphastd, size=(3,))
    image += np.dot(eigvec, eigval * alpha)


def blend_(alpha, image1, image2):
    image1 *= alpha
    image2 *= (1 - alpha)
    image1 += image2


def saturation_(image, gs, gs_mean, var):
    alpha = 1. + np.random.RandomState().uniform(low=-var, high=var)
    blend_(alpha, image, gs[:, :, None])


def brightness_(image, gs, gs_mean, var):
    alpha = 1. + np.random.RandomState().uniform(low=-var, high=var)
    image *= alpha


def contrast_(image, gs, gs_mean, var):
    alpha = 1. + np.random.RandomState().uniform(low=-var, high=var)
    blend_(alpha, image, gs_mean)


def augmentWithColorJittering(image):
    eig_val = np.array([0.2141788, 0.01817699, 0.00341571], dtype=np.float32)
    eig_vec = np.array([
        [-0.58752847, -0.69563484, 0.41340352],
        [-0.5832747, 0.00994535, -0.81221408],
        [-0.56089297, 0.71832671, 0.41158938]
    ], dtype=np.float32)

    functions = [brightness_, contrast_, saturation_]
    random.shuffle(functions)
    image = (image.astype(np.float32) / 255.)
    gs = grayscale(image)
    gs_mean = gs.mean()
    for f in functions:
        f(image, gs, gs_mean, 0.5)
    lighting_(image, 0.4, eig_val, eig_vec)
    image = image * 255.
    image = np.uint8(np.clip(image, 0, 255))
    return image

def augmentWithFlip(img):
    img_dst = cv2.flip(img, 1)
    return img_dst

def augmentWithCropFace(image, outw=112, outh=112):
    """
    mode: normal
        scale = 1 ~ 1.02
    """
    width, height = image.shape[1], image.shape[0]
    angle = 0.
    cx = 0.5 * width
    cy = 0.5 * height
    scale = randrf(1, 1.02)
    margin_x = (width * scale - width) / 2
    margin_y = (height * scale - height) / 2

    cx = randrf(-margin_x, margin_x) + cx
    cy = randrf(-margin_y, margin_y) + cy

    M = cv2.getRotationMatrix2D((cx, cy), angle, scale)
    M[0, 2] -= cx - outw * 0.5
    M[1, 2] -= cy - outh * 0.5

    image = cv2.warpAffine(image, M, (outw, outh))

    return image

def generate_mask_rectangle(point):
    """
    image size: 112*112 (boundary)
    point:(center_x, center_y) -- [left eye | right eye | nose | left mouth | right mouth]
    return: mask rectangle (x1, x2, y1, y2)
    """
    c_x, c_y = point
    x1 = max(0, c_x - int(random.uniform(0.2, 1) * 25))
    x2 = min(112, c_x + int(random.uniform(0.2, 1) * 25))
    y1 = max(0, c_y - int(random.uniform(0.2, 1) * 25))
    y2 = min(112, c_y + int(random.uniform(0.2, 1) * 25))
    return x1, x2, y1, y2

def augmentationWithOcclusion(image):
    facial_points = [
        [37, 43],
        [75, 43],
        [56, 69],
        [43, 86],
        [68, 86]
    ]

    num = random.randint(1,2)



    if randrf(0, 1) < 0.6:
        mask = np.array([[[random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)]]], dtype='uint8')
        mask = np.resize(mask, (112, 112, 3))
    else:
        mask = np.random.rand(112, 112, 3) * 255
        mask = mask.astype('uint8')

    if num == 1:
        point = random.randint(0, 4)
        x1, x2, y1, y2 = generate_mask_rectangle(facial_points[point])
        image[y1:y2, x1:x2] = mask[y1:y2, x1:x2]
        return image
    else:
        # mask
        if randrf(0, 1) < 0.55:
            for point in facial_points[2:]:
                x1, x2, y1, y2 = generate_mask_rectangle(point)
                image[y1:y2, x1:x2] = mask[y1:y2, x1:x2]
        # eyes
        else:
            for point in facial_points[:2]:
                x1, x2, y1, y2 = generate_mask_rectangle(point)
                image[y1:y2, x1:x2] = mask[y1:y2, x1:x2]
        return image

def face_augmentation(image):

    funcs = [[augmentWithColorJittering, 0.9], [augmentWithFlip, 0.5],
             [augmentWithCropFace, 0.75], [augmentationWithOcclusion, 0.2]]
    random.shuffle(funcs)
    num = len(funcs)
    for n in range(num):
        func, freq = funcs[n]
        if randrf(0, 1) < freq:
            image = func(image)

    return image