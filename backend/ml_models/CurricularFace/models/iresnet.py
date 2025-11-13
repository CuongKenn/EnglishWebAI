"""
iResNet model for face recognition
Adapted from CurricularFace
"""
import torch
import torch.nn as nn


class Flatten(nn.Module):
    def forward(self, input):
        return input.view(input.size(0), -1)


class SEModule(nn.Module):
    def __init__(self, channels, reduction):
        super(SEModule, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc1 = nn.Conv2d(
            channels, channels // reduction, kernel_size=1, padding=0, bias=False)
        self.relu = nn.ReLU(inplace=True)
        self.fc2 = nn.Conv2d(
            channels // reduction, channels, kernel_size=1, padding=0, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        module_input = x
        x = self.avg_pool(x)
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        x = self.sigmoid(x)
        return module_input * x


class bottleneck_IR_SE(nn.Module):
    def __init__(self, in_channel, depth, stride):
        super(bottleneck_IR_SE, self).__init__()
        if in_channel == depth:
            self.shortcut_layer = nn.MaxPool2d(1, stride)
        else:
            self.shortcut_layer = nn.Sequential(
                nn.Conv2d(in_channel, depth, (1, 1), stride, bias=False), nn.BatchNorm2d(depth))
        self.res_layer = nn.Sequential(
            nn.BatchNorm2d(in_channel),
            nn.Conv2d(in_channel, depth, (3, 3), (1, 1), 1, bias=False), nn.PReLU(depth),
            nn.Conv2d(depth, depth, (3, 3), stride, 1, bias=False), nn.BatchNorm2d(depth),
            SEModule(depth, 16)
        )

    def forward(self, x):
        shortcut = self.shortcut_layer(x)
        res = self.res_layer(x)
        return res + shortcut


class iresnet100(nn.Module):
    def __init__(self, num_features=512, drop_ratio=0.4, mode='ir'):
        super(iresnet100, self).__init__()
        unit_module = bottleneck_IR_SE
        
        self.input_layer = nn.Sequential(
            nn.Conv2d(3, 64, (3, 3), 1, 1, bias=False),
            nn.BatchNorm2d(64),
            nn.PReLU(64)
        )
        
        self.output_layer = nn.Sequential(
            nn.BatchNorm2d(512),
            nn.Dropout(drop_ratio),
            Flatten(),
            nn.Linear(512 * 7 * 7, num_features),
            nn.BatchNorm1d(num_features)
        )
        
        modules = []
        block = [3, 13, 30, 3]
        for i, num in enumerate(block):
            for j in range(num):
                if i == 0 and j == 0:
                    modules.append(unit_module(64, 64, 2))
                elif j == 0:
                    modules.append(unit_module(int(128 * 2 ** (i - 1)), int(128 * 2 ** i), 2))
                else:
                    modules.append(unit_module(int(128 * 2 ** i), int(128 * 2 ** i), 1))
        
        self.body = nn.Sequential(*modules)

    def forward(self, x):
        x = self.input_layer(x)
        x = self.body(x)
        x = self.output_layer(x)
        return x
