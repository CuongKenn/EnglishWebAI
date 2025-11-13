import os
import sys
import cv2
import time
import copy
import torch
import datetime
import operator
import collections
import numpy as np
import torch.nn.functional as F

from torch.utils.data import DataLoader
from PyQt5 import QtCore, QtGui, QtWidgets
from PyQt5.QtWidgets import *
from PyQt5.QtCore import *
from PyQt5.QtGui import *

# Graphical User Interface
from Qt_designer import Ui_MainWindow

# detection
from Config import Config as conf
from CenterFace.models.centerface import CenterFace
from CenterFace.demo import detect
from CenterFace.datasets import common
from CenterFace.datasets.load_enroll_image import Load_enroll_image
from CenterFace.sort import Sort


# recognition
from CurricularFace.models.seesawfacenet import SeesawFaceNet
from CurricularFace.datasets.enrollment_dataset import Load_Enroll_Dataset
from CurricularFace.datasets.common import compute_cosine_similarity, l2_norm



class MainWindow(QMainWindow, Ui_MainWindow):
    def __init__(self, parent=None):
        super(MainWindow, self).__init__(parent)
        self.setupUi(self)
        self.mode = "on_line"
        self.video_path = None      # off_line
        self.play_video = False
        self.play_filename = None
        self.save_video_state = False
        self.translate = QtCore.QCoreApplication.translate
        self.rb_on_line.toggled.connect(self.on_line_state)
        self.rb_off_line.toggled.connect(self.off_line_state)
        self.rb_camera_enroll.toggled.connect(self.camera_enroll_state)
        self.rb_image_enroll.toggled.connect(self.image_enroll_state)
        self.horizontalSlider.valueChanged.connect(self.slider_change)

        self.load_enrollment_progressBar.setStyleSheet("QProgressBar::chunk{background-color: #77DDFF;}")
        self.enrollment_progressBar.setStyleSheet("QProgressBar::chunk{background-color: #77DDFF;}")
        self.finished_progressBar.setStyleSheet("QProgressBar::chunk{background-color: #00FF99;}")

        # Initial model
        self.device = conf.device
        self.load_models()
        self.update_enrollments = True      # if update_enrollments is True, system will reload enrollment vector.
        self.all_members_imgs = None
        self.dir_path = None
        self.enroll_i = 0

        # Video start
        self.stream_timer = QTimer()
        self.stream_timer.start(60)
        self.stream_timer.timeout.connect(self.video_stream)

        # Information
        self.datetime = QtCore.QDateTime.currentDateTime()
        self.time_timer = QTimer()
        self.time_timer.start(2)
        self.time_timer.timeout.connect(self.set_time)

        self.person_title_label_on_line.setText(f"Number of registrants: {len(os.listdir(conf.member_path))}")
        self.person_title_label_off_line.setText(f"Number of registrants: {len(os.listdir(conf.member_path))}")
        self.gpu_title_label_on_line.setText(f"Graphics card: {torch.cuda.is_available()}")
        self.gpu_title_label_off_line.setText(f"Graphics card: {torch.cuda.is_available()}")

        # Build connection signal
        self.btn_start_state = False
        self.btn_close_state = True         # if close_state is Ture, system will excute cv2.VideoCapture(0).
        self.btn_start.clicked.connect(self.start)
        self.btn_close.clicked.connect(self.close)
        self.btn_enrollment_state = False
        self.btn_enrollment.clicked.connect(self.enroll_start)
        self.btn_video_path.clicked.connect(self.select_video_path)
        self.btn_select_enroll_dir.clicked.connect(self.select_dir_path)

        # Dynamic label
        self.identification_frame_dict = {}
        self.record_frame_dict = {}
        self.tree_widget = {}       # Record the tree widget each person root.
        self.time_dict = {}         # Record the time of each person entry and departure.
        self.treeWidget.itemClicked["QTreeWidgetItem*", "int"].connect(self.frame_change)   # Click treewidget item to change the frame

        # Person frame
        self.person_frame_dict = {}     # Comparison the last time

        # Enrollment person information
        self.load_enrollments_display()

    def load_models(self):
        self.detect_model = CenterFace()
        self.detect_model.eval()
        self.detect_model.to(self.device)
        self.detect_model.load_state_dict(torch.load(f"./CenterFace/checkpoints/{conf.load_detect_model}", map_location=torch.device(self.device)))

        self.recog_model = SeesawFaceNet()
        self.recog_model.eval()
        self.recog_model.to(self.device)
        self.recog_model.load_state_dict(torch.load(f"./CurricularFace/checkpoints/{conf.load_recog_model}", map_location=torch.device(self.device)))

    def total_enroll_display(self, enroll_i, name):
        self.enroll_face_img = QtWidgets.QLabel(self.enroll_display_frame)
        self.enroll_face_img.setAlignment(QtCore.Qt.AlignCenter)
        self.enroll_face_img.setObjectName("enroll_face_img")
        Qdataset = self.load_database_image(name, scale=2)
        self.enroll_face_img.setPixmap(QPixmap.fromImage(Qdataset))
        self.gridLayout_22.addWidget(self.enroll_face_img, enroll_i + 1, 0, 1, 1)  # Database image

        self.enroll_id = QtWidgets.QLabel(self.enroll_display_frame)
        self.enroll_id.setAlignment(QtCore.Qt.AlignCenter)
        self.enroll_id.setObjectName("enroll_ID")
        self.enroll_id.setText(f"{name}")
        self.gridLayout_22.addWidget(self.enroll_id, enroll_i + 1, 1, 1, 1)  # ID

        self.enroll_id_num = QtWidgets.QLabel(self.enroll_display_frame)
        self.enroll_id_num.setAlignment(QtCore.Qt.AlignCenter)
        self.enroll_id_num.setObjectName("enroll_id_num")
        self.enroll_id_num.setText(f"{len(os.listdir(f'{conf.member_path}/{name}'))//2} open")
        self.gridLayout_22.addWidget(self.enroll_id_num, enroll_i + 1, 2, 1, 1)  # Img num

    def load_enrollments_display(self):
        for self.enroll_i, name in enumerate(os.listdir(conf.member_path)):
            self.total_enroll_display(self.enroll_i, name)

    def load_enrollments(self, batch_size=25):

        if self.all_members_imgs != None:
            for label in self.all_members_imgs.values():
                label.deleteLater()

        self.person_title_label_on_line.setText(f"Number of registrants: {len(os.listdir(conf.member_path))}")
        self.load_enrollment_progressBar.setValue(0)
        enrollment_dict = collections.OrderedDict()
        enrollment_dataset = Load_Enroll_Dataset(conf.member_path)
        enrollment_loader = DataLoader(dataset=enrollment_dataset, batch_size=batch_size, shuffle=False)
        for i, (img_paths, imgs) in enumerate(enrollment_loader):
            complete_process = (i + 1) / len(enrollment_loader) * 100
            self.load_enrollment_progressBar.setValue(complete_process)
            with torch.no_grad():
                imgs = imgs.to(self.device)
                embeddings = self.recog_model(imgs)
            res = {img_path: embedding[None, :] for (img_path, embedding) in zip(img_paths, embeddings)}
            enrollment_dict.update(res)
        self.load_enrollment_progressBar.setValue(100)
        self.labels = [keys.split('/')[2] for keys in enrollment_dict.keys()]
        self.enrollment_embeddings = torch.cat(list(enrollment_dict.values())).to(self.device)
        self.initial_dict_ids = {id: 0 for id in set(self.labels)}
        self.all_members_imgs = copy.deepcopy(self.initial_dict_ids)
        self.person_frame_dict = copy.deepcopy(self.initial_dict_ids)

        for i, id in enumerate(set(self.labels)):
            # Database image
            self.database_face = QtWidgets.QLabel(self.all_members_frame)
            self.database_face.setAlignment(QtCore.Qt.AlignCenter)
            self.database_face.setObjectName(f"database_face_{i}")
            Qdataset = self.load_database_image(id, scale=2)
            self.database_face.setPixmap(QPixmap.fromImage(Qdataset))
            self.all_members_imgs[id] = self.database_face
            row, col = divmod(i, 8)
            self.gridLayout_12.addWidget(self.database_face, row, col, 1, 1)  # Database image

    def on_line_state(self):
        self.information_stackedWidget.setCurrentIndex(0)
        self.camera_label.setText("Please click to start, Use an instant system")
        self.mode = "on_line"
        if not self.btn_close_state:
            self.close()

    def off_line_state(self):
        self.information_stackedWidget.setCurrentIndex(1)
        self.camera_label.setText("Please click to select the video path first, Click to start, Use an offline system")
        self.mode = "off_line"
        if not self.btn_close_state:
            self.close()

    def camera_enroll_state(self):
        self.enrollment_stackedWidget.setCurrentIndex(0)
        self.enrollment_bottom_stackedWidget.setCurrentIndex(0)
        if not self.btn_close_state:
            self.close()

    def image_enroll_state(self):
        self.enrollment_stackedWidget.setCurrentIndex(1)
        self.enrollment_bottom_stackedWidget.setCurrentIndex(1)
        if not self.btn_close_state:
            self.close()
        if self.btn_enrollment_state:
            self.camera_enroll_close()

    def select_dir_path(self):
        self.dir_path = QtWidgets.QFileDialog.getExistingDirectory(None, "Select registration folder", "./")
        self.enroll_dir_label.setText(f"  {self.dir_path}")
        self.lineEdit.setText(f"{self.dir_path.split('/')[-1]}")

    def select_video_path(self):
        self.video_path = QtWidgets.QFileDialog.getOpenFileName(None, "select video", "./", "All Files (*)")[0]
        self.video_path_label.setText(f"  {self.video_path}")

    def set_time(self):
        self.time_title_label_on_line.setText(f"Immediate time: {self.datetime.currentDateTime().toString('yyyy-MM-dd hh:mm:ss')}")

    def add_tree_widget(self, ID, time_dict):

        if ID not in self.tree_widget:
            # Build new item
            id_item = QtWidgets.QTreeWidgetItem(self.treeWidget)
            self.tree_widget[ID] = id_item
            id_item.setText(0, self.translate("MainWindow", f"{ID}"))

        else:
            # Read old item
            id_item = self.tree_widget[ID]

        # Record the last time
        if ID != "Unknown" and len(time_dict[ID]) >= 2:
            last_time = time_dict[ID][-2][1]
            if self.mode == 'on_line' and (datetime.datetime.strptime(time_dict[ID][-1][0], '%Y-%m-%d %H:%M:%S') - \
                    datetime.datetime.strptime(last_time, '%Y-%m-%d %H:%M:%S')).total_seconds() > 3:

                id_item.setText(0, self.translate("MainWindow", f"{ID}"))
                time_item = QtWidgets.QTreeWidgetItem(id_item)
                time_item.setText(0, self.translate("MainWindow", f"times: {len(time_dict[ID])}"))
                time_item.setText(1, self.translate("MainWindow", f"{time_dict[ID][-1][0]}"))
                time_item.setText(2, self.translate("MainWindow", f"{time_dict[ID][-1][1]}"))

            elif self.mode == 'off_line' and (datetime.datetime.strptime(time_dict[ID][-1][0], '%H:%M:%S.%f') - \
                    datetime.datetime.strptime(last_time, '%H:%M:%S.%f')).total_seconds() > 3:
                id_item.setText(0, self.translate("MainWindow", f"{ID}"))
                time_item = QtWidgets.QTreeWidgetItem(id_item)
                time_item.setText(0, self.translate("MainWindow", f"times: {len(time_dict[ID])}"))
                time_item.setText(1, self.translate("MainWindow", f"{time_dict[ID][-1][0]}"))
                time_item.setText(2, self.translate("MainWindow", f"{time_dict[ID][-1][1]}"))
            else:
                time_item = self.person_frame_dict[ID]
                time_item.setText(2, self.translate("MainWindow", f"{time_dict[ID][-1][1]}"))
                start_time_local, end_time_local = time_dict[ID].pop(-1)
                time_dict[ID][-1][1] = end_time_local
        else:
            time_item = QtWidgets.QTreeWidgetItem(id_item)
            time_item.setText(0, self.translate("MainWindow", f"times: {len(time_dict[ID])}"))
            time_item.setText(1, self.translate("MainWindow", f"{time_dict[ID][-1][0]}"))
            time_item.setText(2, self.translate("MainWindow", f"{time_dict[ID][-1][1]}"))

        # We can fix time.
        if ID != "Unknown":
            self.person_frame_dict[ID] = time_item

    def slider_change(self):
        if self.play_video and not self.btn_start_state:
            slider_value = self.sender().value()
            num_frame = self.cap.get(cv2.CAP_PROP_FRAME_COUNT)
            assign_frame = round(num_frame * slider_value / 100)
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, assign_frame)
            ret, frame = self.cap.read()
            if ret:
                Qframe = self.image_transfer_Qimage(frame, scale="frame")
                self.camera_label.setPixmap(QPixmap.fromImage(Qframe))

    def frame_change(self, item, column):
        if item.text(0)[:6] == "times:" and self.play_video:
            if self.mode == "on_line":
                sec = (datetime.datetime.strptime(item.text(1), '%Y-%m-%d %H:%M:%S') - \
                       datetime.datetime.strptime(self.play_filename, '%Y-%m-%d %H-%M-%S')).total_seconds()

                total_sec = (datetime.datetime.strptime(self.end_time, '%Y-%m-%d %H:%M:%S') - \
                             datetime.datetime.strptime(self.play_filename, '%Y-%m-%d %H-%M-%S')).total_seconds()
                set_frame = int(sec / total_sec * self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
                self.horizontalSlider.setValue(sec / total_sec * 100)
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, set_frame)
                ret, frame = self.cap.read()
                if ret:
                    Qframe = self.image_transfer_Qimage(frame, scale="frame")
                    self.camera_label.setPixmap(QPixmap.fromImage(Qframe))
            elif self.mode == "off_line":
                sec = (datetime.datetime.strptime(item.text(1), '%H:%M:%S.%f') - \
                       datetime.datetime.strptime('0:00:00.00', '%H:%M:%S.%f')).total_seconds()
                total_sec = (datetime.datetime.strptime(self.end_time, '%H:%M:%S.%f') - \
                             datetime.datetime.strptime('0:00:00.00', '%H:%M:%S.%f')).total_seconds()
                set_frame = int(sec / total_sec * self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
                self.horizontalSlider.setValue(sec / total_sec * 100)
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, set_frame)
                ret, frame = self.cap.read()
                if ret:
                    Qframe = self.image_transfer_Qimage(frame, scale="frame")
                    self.camera_label.setPixmap(QPixmap.fromImage(Qframe))
            # print(item.text(2))

    def start(self):
        if self.btn_enrollment_state:
            self.camera_enroll_close()

        # Initial sort
        self.mot_tracker = Sort(3)
        self.btn_start_state = not self.btn_start_state     # Change the button start state

        if self.btn_start_state:
            self.btn_start.setText("Pause")
            if self.btn_close_state and not self.play_video:
                # Open camera or video
                self.btn_close_state = False
                # If you press close, there will be a problem without this operation
                if self.rb_on_line.isChecked():
                    self.mode = "on_line"
                else:
                    self.mode = "off_line"


                if self.mode == "on_line":
                    self.cap = cv2.VideoCapture(conf.cap_index)
                    if self.cap.isOpened():
                        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                        self.resolution_title_label_on_line.setText(f"Resolution: {width}x{height}")

                elif self.mode == "off_line":
                    try:
                        self.cap = cv2.VideoCapture(f"{self.video_path}")
                        if self.cap.isOpened():
                            width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                            height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                            self.resolution_title_label_off_line.setText(f"Resolution: {width}x{height}")
                    except:
                        self.camera_label.setText("Please select the appropriate video file!!")
                        self.btn_start_state = not self.btn_start_state
                        self.btn_close_state = True
                        self.btn_start.setText("Start")

            if self.update_enrollments:
                # Load enrollment member
                self.load_enrollments()
                self.update_enrollments = False
        else:
            past_reid = set(self.identification_frame_dict.keys())
            for reid in past_reid:
                self.dynamic_remove(reid)
            self.btn_start.setText("Start")

    def close(self):
        if self.btn_enrollment_state:
            self.camera_enroll_close()

        self.btn_close_state = True
        self.cap.release()

        if self.rb_on_line.isChecked():
            self.camera_label.setText("Please click to start, Use an instant system")
        else:
            self.camera_label.setText("Please click to select the video path first, and then click Start, Use an offline system")

        self.btn_start.setText("Start")
        self.btn_start_state = False
        past_reid = set(self.identification_frame_dict.keys())
        for reid in past_reid:
            self.dynamic_remove(reid)

        if self.mode == "off_line":
            self.video_path = None
            self.video_path_label.setText("")


        if self.mode == "on_line":
            self.horizontalSlider.setValue(0)
            self.play_video = True
            self.save_video.release()
            self.cap = cv2.VideoCapture(f"{self.play_filename}.mp4")
            self.end_time = self.datetime.currentDateTime().toString('yyyy-MM-dd hh:mm:ss')
        elif self.mode == "off_line":
            self.horizontalSlider.setValue(0)
            self.play_video = True
            self.save_video.release()
            self.cap = cv2.VideoCapture(f"{self.play_filename}.mp4")
            video_fps = self.cap.get(cv2.CAP_PROP_FPS)  # Video show FPS
            total_video_frame = self.cap.get(cv2.CAP_PROP_FRAME_COUNT)  # Video tne num of frame
            video_length = str(datetime.timedelta(seconds=total_video_frame / video_fps))
            if len(video_length.split('.')) == 1:
                video_length = f"{video_length}.00"
            else:
                video_length = video_length[:-4]
            self.end_time = video_length
        else:
            self.mode = None

    def enroll_start(self):
        if self.btn_start_state == True:
            self.close()

        self.btn_enrollment_state = not self.btn_enrollment_state

        if self.btn_enrollment_state:
            self.mode = "enrollment"
            if self.lineEdit.text() != '' and self.rb_camera_enroll.isChecked():
                self.enrollment_name = self.lineEdit.text()
                self.enrollment_progressBar.setValue(0)
                self.btn_enrollment.setText("Registration suspended")
                self.enrollment_image = {}
                self.cap = cv2.VideoCapture(conf.cap_index)

                self.i = 0
                ret, frame = self.cap.read()
                self.plot_ellipse = np.ones((frame.shape), dtype=frame.dtype) * 255

                self.frame_center = (frame.shape[1] // 2, frame.shape[0] // 2)
                self.bbox_length = int(min(frame.shape[:2]) / 4)
                self.bbox_x = self.frame_center[0] - self.bbox_length
                self.bbox_y = self.frame_center[1] - self.bbox_length
                self.bbox_r = self.bbox_x + self.bbox_length * 2
                self.bbox_b = self.bbox_y + self.bbox_length * 2
                self.emroll_bbox = (self.bbox_x, self.bbox_y, self.bbox_r, self.bbox_b)

                self.background = np.zeros_like(frame)
                cv2.circle(self.background, self.frame_center, self.bbox_length, (1, 1, 1), -1)

                self.select_front_point = 6
                self.select_rotate_point = 24
                self.front_face = {i: None for i in range(-180, 180, 360 // self.select_front_point)}
                self.rotated_face = {i: None for i in range(-180, 180, 360 // self.select_rotate_point)}
                self.front_point_angle = np.array([i for i in self.front_face.keys()])
                self.rotated_point_angle = np.array([i for i in self.rotated_face.keys()])
            elif self.lineEdit.text() == '':
                self.enrollment_label.setText(f"Please enter the new member name first, Then click the Start Registration button")
                self.mode = None
                self.btn_enrollment_state = False
        else:
            self.camera_enroll_close()

    def camera_enroll_close(self):
        if self.i >= 30:
            if self.lineEdit.text() not in os.listdir(conf.member_path):
                os.mkdir(f"{conf.member_path}/{self.lineEdit.text()}")

            for img_name, face in self.enrollment_image.items():
                cv2.imwrite(f"./{conf.member_path}/{self.enrollment_name}/{img_name}", face)
                # 上面遮蔽
                # face_ = face.copy()
                # face_[:56, :] = 0
                # cv2.imwrite(f"./{conf.member_path}/{self.enrollment_name}/t_{img_name}", face_)

                # 下面遮蔽
                face_ = face.copy()
                face_[56:, :] = 0
                cv2.imwrite(f"./{conf.member_path}/{self.enrollment_name}/b_{img_name}", face_)

            self.enroll_i += 1
            self.total_enroll_display(self.enroll_i, self.lineEdit.text())

            self.update_enrollments = True
            self.person_title_label_on_line.setText(f"Number of registrants: {len(os.listdir(conf.member_path))}")

        self.mode = None
        self.enrollment_label.setText("Please click on the registration process below to register the face information of the new person")
        self.btn_enrollment_state = False
        self.btn_enrollment.setText("start registering")
        self.cap.release()



        del self.plot_ellipse
        del self.i
        del self.frame_center
        del self.bbox_x
        del self.bbox_y
        del self.bbox_r
        del self.bbox_b
        del self.emroll_bbox
        del self.background
        del self.select_front_point
        del self.select_rotate_point
        del self.front_face
        del self.rotated_face
        del self.front_point_angle
        del self.rotated_point_angle
        del self.enrollment_image
        del self.enrollment_name

    def image_enroll_start(self, image_person_dir):
        for i in range(self.gridLayout_24.count()):
            self.gridLayout_24.itemAt(i).widget().deleteLater()

        if self.lineEdit.text() == '' or image_person_dir == None:
            self.mode = None
            self.btn_enrollment_state = False
        else:
            self.save_all_face = []
            self.save_all_tf_face = []
            if self.btn_start_state:
                self.close()
            self.enroll_image_batch_size = 5
            image_enroll_loader = Load_enroll_image(image_person_dir)
            self.enroll_loader = DataLoader(dataset=image_enroll_loader, batch_size=self.enroll_image_batch_size,
                                            shuffle=False, num_workers=0)

            for i, (image_path, newImage, scalar) in enumerate(self.enroll_loader):
                self.enrollment_progressBar.setValue((i + 1) / len(self.enroll_loader) * 80)

                newImage = newImage.to(self.device)
                scalar = scalar.cpu().numpy()
                with torch.no_grad():
                    hm, box, landmark = self.detect_model(newImage)
                hm_pool = F.max_pool2d(hm, 3, 1, 1)  # nms of centernet (filt some obj with high repeatability)
                scores, indices = ((hm == hm_pool).float() * hm).view(self.enroll_image_batch_size, 2, -1).cpu().topk(
                    200)
                hm_height, hm_width = hm.shape[2:]

                indices = indices.squeeze()
                ys = (indices // hm_width).data.numpy()
                xs = (indices % hm_width).data.numpy()
                scores = scores.squeeze().data.numpy()
                box = box.cpu().squeeze().data.numpy()
                landmark = landmark.cpu().squeeze().data.numpy()
                stride = 4
                for i, hm_ in enumerate(hm):
                    image = cv2.imread(image_path[i])
                    hm_ = hm_[None, :]
                    objs = []
                    for cls in range(hm_.shape[1]):
                        for cx, cy, score in zip(xs[i][cls], ys[i][cls], scores[i][cls]):
                            if score < conf.threshold:
                                break
                            x, y, r, b = box[i, :, cy, cx]
                            xyrb = (np.array([cx, cy, cx, cy]) + [-x, -y, r, b]) * stride * scalar[i]
                            x5y5 = landmark[i, :, cy, cx]
                            x5y5 = (common.exp(x5y5 * 4) + ([cx] * 5 + [cy] * 5)) * stride * scalar[i]
                            box_landmark = list(zip(x5y5[:5], x5y5[5:]))
                            objs.append(common.BBox(cls, xyrb=xyrb, dict_ids={}, score=score, landmark=box_landmark))

                    for obj in objs:
                        face = common.crop_face(image, obj)
                        self.save_all_face.append(face)
                        self.save_all_tf_face.append(conf.recog_transforms(face))

            self.save_all_tf_face = torch.stack(self.save_all_tf_face).to(self.device)
            with torch.no_grad():
                embedding_face = self.recog_model(self.save_all_tf_face)
            num_img = len(os.listdir(self.dir_path))
            embedding_face = l2_norm(embedding_face)
            result = embedding_face @ embedding_face.T
            index = (result >= 0.2).sum(axis=1).argmax()
            scores, indices = result[index].cpu().topk(num_img)
            save_face = []
            for i, (score, index) in enumerate(zip(scores, indices)):
                if (i + 1) > num_img or score < 0.3:
                    break
                face = self.save_all_face[index]
                save_face.append(face)

            self.enrollment_progressBar.setValue(100)
            self.image_enroll_close(save_face)

    def image_enroll_close(self, save_face):
        if self.lineEdit.text() not in os.listdir(conf.member_path):
            os.mkdir(f"{conf.member_path}/{self.lineEdit.text()}")

        for i, face in enumerate(save_face):
            y, x = divmod(i, 8)
            self.detect_face_img = QtWidgets.QLabel(self.display_result_frame)
            self.detect_face_img.setAlignment(QtCore.Qt.AlignCenter)
            self.detect_face_img.setObjectName(f"detect_face_img_{i}")
            Qdataset = self.image_transfer_Qimage(face)
            self.detect_face_img.setPixmap(QPixmap.fromImage(Qdataset))
            self.gridLayout_24.addWidget(self.detect_face_img,  y, x, 1, 1)  # Database image

            cv2.imwrite(f"./{conf.member_path}/{self.lineEdit.text()}/front_{i}.jpg", face)
            # 遮蔽上半臉
            # face_ = face.copy()
            # face_[:56, :] = 0
            # cv2.imwrite(f"./{conf.member_path}/{self.lineEdit.text()}/t_front_{i}.jpg", face_)
            # 遮蔽下半臉
            face_ = face.copy()
            face_[56:, :] = 0
            cv2.imwrite(f"./{conf.member_path}/{self.lineEdit.text()}/b_front_{i}.jpg", face_)

        self.enroll_i += 1
        self.total_enroll_display(self.enroll_i, self.lineEdit.text())

        del self.save_all_face
        del self.save_all_tf_face
        del self.enroll_image_batch_size
        del self.enroll_loader

        self.update_enrollments = True
        self.person_title_label_on_line.setText(f"Number of registrants: {len(os.listdir(conf.member_path))}")
        self.mode = None
        self.btn_enrollment_state = False

    def load_database_image(self, ID, scale=1):
        if ID == "Unknown":
            database_img = cv2.imread(f"./{ID}/Unknown.jpg")
        else:
            database_img = cv2.imread(f"{conf.member_path}/{ID}/front_0.jpg")

        database_img = cv2.cvtColor(database_img, cv2.COLOR_BGR2RGB)
        height, width, channel = database_img.shape
        if scale != 1:
            width, height = width // scale, height // scale
            database_img = cv2.resize(database_img, (width, height))
        Qframe = QImage(database_img.data, width, height, width * channel, QImage.Format_RGB888)
        return Qframe

    def image_transfer_Qimage(self, image, scale=None):
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        height, width, channel = image.shape
        if scale == None:
            Qimage = QImage(image.data, width, height, width * channel, QImage.Format_RGB888)
        elif scale == "frame":
            Qimage = QImage(image.data, width, height, width * channel, QImage.Format_RGB888).scaled(
                                width / height * self.camera_label.height(), self.camera_label.height())
        elif scale == "enroll":
            Qimage = QImage(image.data, width, height, width * channel, QImage.Format_RGB888).scaled(
                width / height * self.enrollment_label.height(), self.enrollment_label.height())
        return Qimage

    def dynamic_addition(self, obj):
        # Database image
        self.database_label = QtWidgets.QLabel(self.identification_frame)
        self.database_label.setAlignment(QtCore.Qt.AlignCenter)
        self.database_label.setObjectName("database_label")
        Qdataset = self.load_database_image(obj.ID)
        self.database_label.setPixmap(QPixmap.fromImage(Qdataset))
        self.gridLayout.addWidget(self.database_label, obj.reid + 1, 0, 1, 1)   # Database image

        # Detect image
        self.detect_label = QtWidgets.QLabel(self.identification_frame)
        self.detect_label.setAlignment(QtCore.Qt.AlignCenter)
        self.detect_label.setObjectName("detect_label")
        self.gridLayout.addWidget(self.detect_label, obj.reid + 1, 1, 1, 1)     # Detect image

        # Result
        self.result_frame = QtWidgets.QFrame(self.identification_frame)
        self.result_frame.setFrameShape(QtWidgets.QFrame.StyledPanel)
        self.result_frame.setFrameShadow(QtWidgets.QFrame.Raised)
        self.result_frame.setObjectName("result_frame")
        self.verticalLayout_result_frame = QtWidgets.QVBoxLayout(self.result_frame)
        self.verticalLayout_result_frame.setContentsMargins(-1, 5, -1, 5)
        self.verticalLayout_result_frame.setObjectName("verticalLayout")
        self.gridLayout.addWidget(self.result_frame, obj.reid + 1, 2, 1, 1)     # Result

        self.result_id_label = QtWidgets.QLabel(self.result_frame)
        self.result_id_label.setAlignment(QtCore.Qt.AlignLeft)
        self.result_id_label.setAlignment(QtCore.Qt.AlignVCenter)
        self.result_id_label.setObjectName("result_id")
        self.verticalLayout_result_frame.addWidget(self.result_id_label)

        self.result_id_score_label = QtWidgets.QLabel(self.result_frame)
        self.result_id_score_label.setAlignment(QtCore.Qt.AlignLeft)
        self.result_id_score_label.setAlignment(QtCore.Qt.AlignVCenter)
        self.result_id_score_label.setObjectName("result_id_score_label")
        self.verticalLayout_result_frame.addWidget(self.result_id_score_label)

        # Updata identification_frame_dict
        self.identification_frame_dict[obj.reid] = [self.database_label, self.detect_label, self.result_frame,
                                                    self.result_id_label, self.result_id_score_label, obj]

        # Record time
        self.strat_time_label = QtWidgets.QLabel(self.record_frame)
        self.strat_time_label.setAlignment(QtCore.Qt.AlignCenter)
        self.strat_time_label.setObjectName("strat_time_label")
        self.strat_time_label.setText(f"{obj.start_time}")
        self.gridLayout_record.addWidget(self.strat_time_label, obj.reid + 1, 0, 1, 1)  # Record start time

        self.end_time_label = QtWidgets.QLabel(self.record_frame)
        self.end_time_label.setAlignment(QtCore.Qt.AlignCenter)
        self.end_time_label.setObjectName("end_time_label")
        self.gridLayout_record.addWidget(self.end_time_label, obj.reid + 1, 1, 1, 1)  # Record end time

        self.record_id = QtWidgets.QLabel(self.record_frame)
        self.record_id.setAlignment(QtCore.Qt.AlignCenter)
        self.record_id.setObjectName("record_id_label")
        self.gridLayout_record.addWidget(self.record_id, obj.reid + 1, 2, 1, 1)     # Record ID

        # Build record label dict
        self.record_frame_dict[obj.reid] = [self.strat_time_label, self.end_time_label, self.record_id]

    def dynamic_remove(self, reid):
        database, detect, result_frame, _, _, obj = self.identification_frame_dict.pop(reid)
        self.gridLayout.removeWidget(database)
        database.deleteLater()
        self.gridLayout.removeWidget(detect)
        detect.deleteLater()
        self.gridLayout.removeWidget(result_frame)
        result_frame.deleteLater()

        strat_time_label, end_time_label, record_id = self.record_frame_dict[reid]
        end_time_label.setText(f"{obj.end_time}")
        if obj.ID == "Unknown" and self.mode == 'on_line':
            record_id.setStyleSheet('background-color: rgb(255, 0, 0)')
        record_id.setText(f"{obj.ID}")
        if obj.ID not in self.time_dict:
            self.time_dict[obj.ID] = []
        self.time_dict[obj.ID].append([obj.start_time, obj.end_time])
        self.add_tree_widget(obj.ID, self.time_dict)

    @pyqtSlot(name="video_stream")
    def video_stream(self):
        if self.th_text.text() != '':
            self.recog_th = float(self.th_text.text())
        else:
            self.th_text.setText('0.4')
            self.recog_th = float(self.th_text.text())

        if self.mode == "on_line":
            if self.btn_start_state and not self.play_video:
                self.ret, frame = self.cap.read()
                frame = cv2.flip(frame, 1)
                if self.ret:
                    if not self.save_video_state:
                        # save video
                        self.save_video_state = True
                        h, w = frame.shape[:2]
                        encoder = cv2.VideoWriter_fourcc(*"mp4v")
                        self.video_fps = self.cap.get(cv2.CAP_PROP_FPS)  # Video show FPS
                        self.play_filename = self.datetime.currentDateTime().toString('yyyy-MM-dd HH-mm-ss')
                        self.save_video = cv2.VideoWriter(f"{self.play_filename}.mp4", encoder, self.video_fps, (w, h), True)
                    # Reset select bbox
                    for remove in self.all_members_imgs.values():
                        remove.setStyleSheet("")

                    start_time = time.time()
                    objs = detect(self.detect_model, frame, self.initial_dict_ids, frame.shape[0] * frame.shape[1],
                                  threshold=conf.threshold, device=self.device)
                    if len(objs) > 0:
                        faces = []
                        for obj in objs:
                            obj.start_time = self.datetime.currentDateTime().toString('yyyy-MM-dd hh:mm:ss')
                            face = common.crop_face(frame, obj)
                            face = conf.recog_transforms(face)
                            faces.append(face)

                        faces = torch.stack(faces, dim=0)
                        faces = faces.to(self.device)
                        objs = compute_cosine_similarity(self.enrollment_embeddings, self.labels, self.initial_dict_ids,
                                                         faces, objs, self.recog_model, k=conf.knn_num)
                        objs, exist_reid = self.mot_tracker.update(objs)            # Sort tracking & Update exist reid
                        past_reid = set(self.identification_frame_dict.keys())      # Last frame reid
                        ex_reid = exist_reid ^ past_reid        # Exclusive events

                        for obj in objs:
                            # This "obj.dict_ids" has been weighted, so we need to find the result again.
                            obj.ID = max(obj.dict_ids.items(), key=operator.itemgetter(1))[0]
                            obj.ID_score = obj.dict_ids[obj.ID]

                            if obj.num_matching > 3:       # Avoid detector False Positive
                                if (obj.cls == 0 and obj.ID_score < self.recog_th) or \
                                   (obj.dict_ids_times[obj.ID] / obj.num_matching < 0.3):
                                    obj.ID = "Unknown"
                                    obj.ID_score = None
                                elif (obj.cls == 1 and obj.ID_score < self.recog_th - 0.05) or \
                                     (obj.dict_ids_times[obj.ID] / obj.num_matching < 0.3):
                                    obj.ID = "Unknown"
                                    obj.ID_score = None
                                if obj.reid in ex_reid:     # Build identification label
                                    if obj.reid not in self.identification_frame_dict:
                                        self.dynamic_addition(obj)
                                        ex_reid.remove(obj.reid)
                                # Update obj
                                database_label, detect_label, result_frame, result_id_label, result_id_score_label, _ = \
                                    self.identification_frame_dict[obj.reid]

                                self.identification_frame_dict[obj.reid] = \
                                    [database_label, detect_label, result_frame, result_id_label, result_id_score_label, obj]
                                Qdataset = self.load_database_image(obj.ID)
                                database_label.setPixmap(QPixmap.fromImage(Qdataset))

                                # Select all_members_imgs
                                if obj.ID != "Unknown":
                                    self.all_members_imgs[obj.ID].setStyleSheet(
                                        "border : solid blue;" "border-width : 5px 5px 5px 5px;")

                                _, detect_label, result_frame, result_id_label, result_id_score_label, _ = \
                                    self.identification_frame_dict[obj.reid]
                                _, _, record_id = self.record_frame_dict[obj.reid]
                                detect_face = self.image_transfer_Qimage(obj.First_face)
                                detect_label.setPixmap(QPixmap.fromImage(detect_face))
                                result_id_label.setText(f"ID: {obj.ID}")
                                record_id.setText(f"{obj.ID}")
                                if obj.ID == "Unknown":
                                    detect_label.setStyleSheet("background-color: rgb(255, 0, 0);")
                                    result_id_score_label.setText(f"Result: Unmatch")
                                else:
                                    detect_label.setStyleSheet("")
                                    result_id_score_label.setText(f"Result: Match")     # Match
                                    # result_id_score_label.setText(f"Result: {round(float(obj.ID_score * 100), 1)}")   # Score
                                common.drawbbox(frame, obj)

                        for del_reid in ex_reid:            # Delete identification label
                            if del_reid in self.identification_frame_dict:
                                self.dynamic_remove(del_reid)

                    else:   # without obj
                        objs, exist_reid = self.mot_tracker.update(objs)  # Sort tracking & Update exist reid
                        past_reid = set(self.identification_frame_dict.keys())  # Last frame reid
                        ex_reid = exist_reid ^ past_reid  # Exclusive events
                        for del_reid in ex_reid:            # Delete identification label
                            if del_reid in self.identification_frame_dict:
                                self.dynamic_remove(del_reid)

                    self.save_video.write(frame)
                    Qframe = self.image_transfer_Qimage(frame, scale="frame")
                    self.camera_label.setPixmap(QPixmap.fromImage(Qframe))
                    end_time = time.time()
                    fps = 1 / (end_time - start_time)
                    self.fps_title_label_on_line.setText(f"Operational efficiency: {round(fps, 3)} (FPS)")

                else:
                    self.camera_label.setText("Please confirm whether the camera is normal!")
            elif self.btn_start_state and self.play_video:
                self.ret, frame = self.cap.read()
                if self.ret:
                    self.horizontalSlider.setValue(self.cap.get(cv2.CAP_PROP_POS_FRAMES) / self.cap.get(cv2.CAP_PROP_FRAME_COUNT) * 100)

                    Qframe = self.image_transfer_Qimage(frame, scale="frame")
                    self.camera_label.setPixmap(QPixmap.fromImage(Qframe))

        elif self.mode == "off_line":
            if self.btn_start_state and not self.play_video:
                self.ret, frame = self.cap.read()

                if self.ret:
                    if not self.save_video_state:
                        self.save_video_state = True
                        # save video
                        h, w = frame.shape[:2]
                        encoder = cv2.VideoWriter_fourcc(*"mp4v")
                        self.video_fps = self.cap.get(cv2.CAP_PROP_FPS)               # Video show FPS
                        self.play_filename = "Record_video"
                        self.save_video = cv2.VideoWriter(f"{self.play_filename}.mp4", encoder, self.video_fps, (w, h), True)
                        self.total_video_frame = self.cap.get(cv2.CAP_PROP_FRAME_COUNT)     # Video tne num of frame
                        self.video_length = str(datetime.timedelta(seconds=self.total_video_frame / self.video_fps))
                        if len(self.video_length.split('.')) == 1:
                                self.video_length = f"{self.video_length}.00"
                        else:
                            self.video_length = self.video_length[:-4]
                        self.video_time_label.setText(f"video length: {self.video_length}")
                    # Reset select bbox
                    for remove in self.all_members_imgs.values():
                        remove.setStyleSheet("")

                    now_frame = self.cap.get(cv2.CAP_PROP_POS_FRAMES)
                    video_time = str(datetime.timedelta(seconds=(now_frame / self.video_fps)))
                    if len(video_time.split('.')) == 1:
                        video_time = f'{video_time}.00'
                    else:
                        video_time = video_time[:-4]

                    self.time_title_label_off_line.setText(f"video time: {video_time}")

                    start_time = time.time()
                    objs = detect(self.detect_model, frame, self.initial_dict_ids, frame.shape[0] * frame.shape[1],
                                  threshold=conf.threshold, device=self.device)
                    if len(objs) > 0:
                        faces = []
                        for obj in objs:
                            obj.start_time = f"{video_time}"      # Which time (frame) in video.
                            face = common.crop_face(frame, obj)
                            face = conf.recog_transforms(face)
                            faces.append(face)

                        faces = torch.stack(faces, dim=0)
                        faces = faces.to(self.device)
                        objs = compute_cosine_similarity(self.enrollment_embeddings, self.labels, self.initial_dict_ids,
                                                         faces, objs, self.recog_model, k=conf.knn_num)
                        objs, exist_reid = self.mot_tracker.update(objs)            # Sort tracking & Update exist reid
                        past_reid = set(self.identification_frame_dict.keys())      # Last frame reid
                        ex_reid = exist_reid ^ past_reid        # Exclusive events

                        for obj in objs:
                            # This "obj.dict_ids" has been weighted, so we need to find the result again.
                            obj.ID = max(obj.dict_ids.items(), key=operator.itemgetter(1))[0]
                            obj.ID_score = obj.dict_ids[obj.ID]
                            if obj.num_matching >= 3:       # Avoid detector False Positive
                                if (obj.cls == 0 and obj.ID_score < self.recog_th) or \
                                        (obj.dict_ids_times[obj.ID] / obj.num_matching < 0.25):
                                    obj.ID = "Unknown"
                                    obj.ID_score = None
                                elif (obj.cls == 1 and obj.ID_score < self.recog_th - 0.05) or \
                                        (obj.dict_ids_times[obj.ID] / obj.num_matching < 0.25):
                                    obj.ID = "Unknown"
                                    obj.ID_score = None
                                if obj.reid in ex_reid:     # Build identification label
                                    if obj.reid not in self.identification_frame_dict:
                                        self.dynamic_addition(obj)
                                        ex_reid.remove(obj.reid)
                                # Update obj
                                database_label, detect_label, result_frame, result_id_label, result_id_score_label, _ = \
                                    self.identification_frame_dict[obj.reid]

                                self.identification_frame_dict[obj.reid] = \
                                    [database_label, detect_label, result_frame, result_id_label, result_id_score_label, obj]
                                Qdataset = self.load_database_image(obj.ID)
                                database_label.setPixmap(QPixmap.fromImage(Qdataset))

                                # Select all_members_imgs
                                if obj.ID != "Unknown":
                                    self.all_members_imgs[obj.ID].setStyleSheet(
                                        "border : solid blue;" "border-width : 5px 5px 5px 5px;")

                                _, detect_label, result_frame, result_id_label, result_id_score_label, _ = \
                                    self.identification_frame_dict[obj.reid]
                                _, _, record_id = self.record_frame_dict[obj.reid]
                                detect_face = self.image_transfer_Qimage(obj.First_face)
                                detect_label.setPixmap(QPixmap.fromImage(detect_face))
                                result_id_label.setText(f"ID: {obj.ID}")
                                record_id.setText(f"{obj.ID}")
                                if obj.ID == "Unknown":
                                    result_id_score_label.setText(f"Result: Unmatch")
                                else:
                                    result_id_score_label.setText(f"Result: Match")     # Match

                                    # result_id_score_label.setText(f"Result: {round(float(obj.ID_score * 100), 1)}")   # Score
                                common.drawbbox(frame, obj)

                        for del_reid in ex_reid:    # Delete identification label
                            if del_reid in self.identification_frame_dict:
                                self.dynamic_remove(del_reid)

                    else:   # without obj
                        objs, exist_reid = self.mot_tracker.update(objs)  # Sort tracking & Update exist reid
                        past_reid = set(self.identification_frame_dict.keys())  # Last frame reid
                        ex_reid = exist_reid ^ past_reid  # Exclusive events
                        for del_reid in ex_reid:            # Delete identification label
                            if del_reid in self.identification_frame_dict:
                                self.dynamic_remove(del_reid)

                    self.save_video.write(frame)
                    Qframe = self.image_transfer_Qimage(frame, scale="frame")
                    self.camera_label.setPixmap(QPixmap.fromImage(Qframe))
                    end_time = time.time()
                    fps = 1 / (end_time-start_time)
                    self.fps_title_label_off_line.setText(f"Operational efficiency: {round(fps, 3)} (FPS)")

                    video_remain_time = str(datetime.timedelta(seconds=(self.total_video_frame - now_frame) / fps))
                    if len(video_remain_time.split('.')) == 1:
                        pass
                    else:
                        video_remain_time = video_remain_time[:-4]

                    self.video_remain_time.setText(f"Time left: {video_remain_time}")
                    self.finished_progressBar.setValue(now_frame / self.total_video_frame * 100)
                else:
                    self.camera_label.setText("Video facial recognition completed!")
            elif self.btn_start_state and self.play_video:
                self.ret, frame = self.cap.read()
                if self.ret:
                    self.horizontalSlider.setValue(self.cap.get(cv2.CAP_PROP_POS_FRAMES) / self.cap.get(cv2.CAP_PROP_FRAME_COUNT) * 100)
                    Qframe = self.image_transfer_Qimage(frame, scale="frame")
                    self.camera_label.setPixmap(QPixmap.fromImage(Qframe))

        elif self.mode == "enrollment":
            if self.btn_enrollment_state:
                if self.rb_camera_enroll.isChecked():   # Camera enrollment
                    self.ret, frame = self.cap.read()
                    frame = cv2.flip(frame, 1)
                    objs = detect(self.detect_model, frame, {}, frame.shape[0] * frame.shape[1])
                    cv2.putText(frame, f"Image: {self.i}", (30, 30), 0, 0.5, (255, 0, 0), 2, 20)
                    for obj in objs:
                        face = common.crop_face(frame, obj)
                        rt, lt, c, rb, lb = obj.landmark
                        for l in range(len(obj.landmark)):
                            x, y = obj.landmark[l][:2]
                            cv2.circle(frame, common.intv(x, y), 3, (0, 0, 255), -1, 16)
                        rt, lt, c, rb, lb = np.array(obj.landmark)
                        ct, cb, cr, cl = (rt + lt) / 2, (rb + lb) / 2, (rt + rb) / 2, (lt + lb) / 2
                        radius_b = int((np.linalg.norm(ct - cb) + np.linalg.norm(cr - cl)) / 10)
                        radius_s = int((np.linalg.norm(ct - cb) + np.linalg.norm(cr - cl)) / 15)
                        center = (rt + lt + rb + lb) // 4
                        # Suppose 10 interval
                        vector = c - center
                        distance = np.linalg.norm(vector)
                        if distance > radius_s and distance < radius_b:
                            pass

                        iou = common.computeIOU(self.emroll_bbox, obj.box)
                        if iou > 0.2:
                            if obj.classification == 1:
                                cv2.putText(frame, "Occlusion", (self.emroll_bbox[0], self.emroll_bbox[1] - 10), 0, 0.5,
                                            (0, 255, 255), 2, 20)
                            else:
                                if distance < radius_s and self.i < self.select_front_point:
                                    angle = np.angle(vector[0] + 1j * vector[1]) / np.pi * 180
                                    index = np.abs(self.front_point_angle - angle).argmin()
                                    if self.front_face[self.front_point_angle[index]] == None:
                                        self.front_face[self.front_point_angle[index]] = True
                                        self.enrollment_image[f"front_{self.i}.jpg"] = cv2.resize(face, (112, 112))

                                        self.i += 1
                                        cv2.ellipse(self.plot_ellipse, self.frame_center,
                                                    common.intv(self.bbox_length * 0.3, self.bbox_length * 0.3), 0,
                                                    self.front_point_angle[index] - int(360 // self.select_front_point // 2),
                                                    self.front_point_angle[index] + int(360 // self.select_front_point // 2),
                                                    (255, 0, 0), -1)

                                if distance >= radius_b and self.i >= self.select_front_point:
                                    angle = np.angle(vector[0] + 1j * vector[1]) / np.pi * 180
                                    index = np.abs(self.rotated_point_angle - angle).argmin()
                                    if self.rotated_face[self.rotated_point_angle[index]] == None:
                                        self.rotated_face[self.rotated_point_angle[index]] = True
                                        self.enrollment_image[f"front_{self.i}.jpg"] = cv2.resize(face, (112, 112))

                                        self.i += 1

                                        cv2.ellipse(self.plot_ellipse, self.frame_center, common.intv(self.bbox_length, self.bbox_length), 0,
                                                    self.rotated_point_angle[index] - int(360 // self.select_rotate_point // 2),
                                                    self.rotated_point_angle[index] + int(360 // self.select_rotate_point // 2),
                                                    (0, 255, 0), -1)

                        cv2.circle(frame, common.intv(tuple(center)), radius_b, (255, 255, 255), 1)
                        cv2.circle(frame, common.intv(tuple(center)), radius_s, (255, 255, 255), 1)
                    self.enrollment_progressBar.setValue((self.i / 30) * 100)
                    frame *= self.background
                    frame = cv2.addWeighted(frame, 0.85, self.plot_ellipse, 0.15, 0)
                    Qframe = self.image_transfer_Qimage(frame, scale="enroll")
                    self.enrollment_label.setPixmap(QPixmap.fromImage(Qframe))

                    if self.i >= 30:
                        self.enrollment_progressBar.setValue(100)
                        self.camera_enroll_close()

                elif self.rb_image_enroll.isChecked():       # Image enrollment
                    self.enrollment_progressBar.setValue(0)
                    self.image_enroll_start(self.dir_path)




if __name__ == "__main__":
    app = QApplication(sys.argv)
    main_window = MainWindow()
    main_window.show()
    sys.exit(app.exec_())

