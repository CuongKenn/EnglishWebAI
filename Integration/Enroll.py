import cv2
import numpy as np
import torch

from Config import Config as conf
from CenterFace.models.centerface import CenterFace
from CenterFace.demo import detect
from CenterFace.datasets import common


detect_model = CenterFace()
detect_model.eval()
detect_model.to(conf.device)
detect_model.load_state_dict(torch.load('./CenterFace/' + conf.checkpoints + '/' + conf.load_detect_model, map_location=torch.device('cpu')))

cap = cv2.VideoCapture(0)
ret, frame = cap.read()


plot_ellipse = np.ones((frame.shape), dtype=frame.dtype) * 255


frame_center = (frame.shape[1] // 2, frame.shape[0] // 2)
bbox_length = int(min(frame.shape[:2]) / 5.5)
x = frame_center[0] - bbox_length
y = frame_center[1] - bbox_length
r = x + bbox_length * 2
b = y + bbox_length * 2
emroll_bbox = (x, y, r, b)

background = np.zeros_like(frame)
cv2.circle(background, frame_center, bbox_length, (1, 1, 1), -1)

select_front_point = 6
select_rotate_point = 24
front_face = {i: None for i in range(-180, 180, 360 // select_front_point)}
rotated_face = {i: None for i in range(-180, 180, 360 // select_rotate_point)}
front_point_angle = np.array([i for i in front_face.keys()])
rotated_point_angle = np.array([i for i in rotated_face.keys()])

i = 0
while ret:
    ret, frame = cap.read()
    frame = cv2.flip(frame, 1)
    key = cv2.waitKey(1)
    # objs = detect(detect_model, frame, dict_ids={}, frame_area= 10)
    objs = detect(detect_model, frame, {}, frame.shape[0] * frame.shape[1])


    cv2.putText(frame, f"Image: {i}", (30, 30), 0, 0.5, (255, 0, 0), 2, 20)
    for obj in objs:
        face = common.crop_face(frame, obj)

        rt, lt, c, rb, lb = obj.landmark

        for l in range(len(obj.landmark)):
            x, y = obj.landmark[l][:2]
            cv2.circle(frame, common.intv(x, y), 3, (0, 0, 255), -1, 16)

        rt, lt, c, rb, lb = np.array(obj.landmark)
        ct, cb, cr, cl = (rt + lt) / 2, (rb + lb) / 2, (rt + rb) / 2, (lt + lb) / 2

        radius_b = int((np.linalg.norm(ct-cb) + np.linalg.norm(cr-cl)) / 10)
        radius_s = int((np.linalg.norm(ct-cb) + np.linalg.norm(cr-cl)) / 15)

        center = (rt + lt + rb + lb) // 4

        # Suppose 10 interval
        vector = c - center
        distance = np.linalg.norm(vector)


        if distance > radius_s and distance < radius_b:
            pass

        iou = common.computeIOU(emroll_bbox, obj.box)

        if iou > 0.2:
            if obj.classification == 1:
                cv2.putText(frame, "Occlusion", (emroll_bbox[0], emroll_bbox[1] - 10), 0, 0.5, (0, 255, 255), 2, 20)

            else:
                if distance < radius_s and i < select_front_point:
                    angle = np.angle(vector[0] + 1j * vector[1]) / np.pi * 180
                    index = np.abs(front_point_angle - angle).argmin()
                    if front_face[front_point_angle[index]] == None:
                        front_face[front_point_angle[index]] = True
                        cv2.imwrite(f'./Enroll_data/front_{i}.jpg', cv2.resize(face, (112, 112)))
                        i += 1
                        cv2.ellipse(plot_ellipse, frame_center, common.intv(bbox_length * 0.3, bbox_length * 0.3), 0,
                                    front_point_angle[index] - int(360 // select_front_point // 2),
                                    front_point_angle[index] + int(360 // select_front_point // 2),
                                    (255, 0, 0), -1)

                if distance >= radius_b and i >=select_front_point:
                    angle = np.angle(vector[0] + 1j * vector[1]) / np.pi * 180
                    index = np.abs(rotated_point_angle - angle).argmin()
                    if rotated_face[rotated_point_angle[index]] == None:
                        rotated_face[rotated_point_angle[index]] = True
                        cv2.imwrite(f'./Enroll_data/rotated_{i}.jpg', cv2.resize(face, (112, 112)))
                        i += 1

                        cv2.ellipse(plot_ellipse, frame_center, common.intv(bbox_length, bbox_length), 0,
                                    rotated_point_angle[index] - int(360 // select_rotate_point // 2),
                                    rotated_point_angle[index] + int(360 // select_rotate_point // 2),
                                    (0, 255, 0), -1)

        cv2.circle(frame, common.intv(tuple(center)), radius_b, (255, 255, 255), 1)
        cv2.circle(frame, common.intv(tuple(center)), radius_s, (255, 255, 255), 1)

    frame *= background
    frame = cv2.addWeighted(frame, 0.8, plot_ellipse, 0.2, 0)
    cv2.imshow('Camera', frame)

    if key == ord('q') or i >= 30:
        break

cap.release()
cv2.destroyAllWindows()
