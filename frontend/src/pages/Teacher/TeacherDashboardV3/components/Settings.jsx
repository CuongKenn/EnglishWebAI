import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Switch } from '../../../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { User, Bell, Lock, Mail, Globe, Save, Camera } from 'lucide-react';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';

const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newAssignments, setNewAssignments] = useState(true);
  const [newMessages, setNewMessages] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cài đặt</h1>
        <p className="text-gray-600">Quản lý thông tin cá nhân và tùy chỉnh hệ thống</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Thông báo
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            Bảo mật
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Globe className="w-4 h-4" />
            Tùy chỉnh
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cá nhân</h3>
            
            <div className="flex items-start gap-6 mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-purple-500 text-white text-2xl">
                    NV
                  </AvatarFallback>
                </Avatar>
                <Button size="sm" className="absolute bottom-0 right-0 rounded-full p-2">
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-gray-900 mb-1">Ảnh đại diện</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Định dạng: JPG, PNG. Kích thước tối đa: 2MB
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Tải ảnh lên</Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    Xóa ảnh
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Họ và tên</Label>
                  <Input defaultValue="Nguyễn Văn A" />
                </div>
                <div>
                  <Label>Số điện thoại</Label>
                  <Input defaultValue="0901234567" />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input type="email" defaultValue="nguyenvana@school.edu.vn" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Chức vụ</Label>
                  <Input defaultValue="Giáo viên Tiếng Anh" disabled />
                </div>
                <div>
                  <Label>Mã giáo viên</Label>
                  <Input defaultValue="GV001" disabled />
                </div>
              </div>

              <div>
                <Label>Giới thiệu</Label>
                <Textarea
                  rows={4}
                  defaultValue="Giáo viên Tiếng Anh với 10 năm kinh nghiệm giảng dạy. Chuyên về phương pháp giảng dạy tích hợp và ứng dụng công nghệ trong giáo dục."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Hủy</Button>
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Cài đặt thông báo</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Thông báo qua Email</h4>
                  <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Thông báo đẩy</h4>
                  <p className="text-sm text-gray-600">Nhận thông báo đẩy trên trình duyệt</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>

              <div className="pt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Loại thông báo</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Bài tập mới</h5>
                      <p className="text-sm text-gray-600">Khi có học sinh nộp bài tập</p>
                    </div>
                    <Switch checked={newAssignments} onCheckedChange={setNewAssignments} />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Tin nhắn mới</h5>
                      <p className="text-sm text-gray-600">Khi có tin nhắn từ học sinh hoặc phụ huynh</p>
                    </div>
                    <Switch checked={newMessages} onCheckedChange={setNewMessages} />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Báo cáo hàng tuần</h5>
                      <p className="text-sm text-gray-600">Nhận báo cáo tổng hợp mỗi tuần</p>
                    </div>
                    <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Hủy</Button>
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Bảo mật tài khoản</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-4">Đổi mật khẩu</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Mật khẩu hiện tại</Label>
                    <Input type="password" placeholder="Nhập mật khẩu hiện tại" />
                  </div>
                  <div>
                    <Label>Mật khẩu mới</Label>
                    <Input type="password" placeholder="Nhập mật khẩu mới" />
                  </div>
                  <div>
                    <Label>Xác nhận mật khẩu mới</Label>
                    <Input type="password" placeholder="Nhập lại mật khẩu mới" />
                  </div>
                  <Button className="gap-2">
                    <Lock className="w-4 h-4" />
                    Đổi mật khẩu
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Xác thực hai yếu tố</h4>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Xác thực 2FA</h5>
                    <p className="text-sm text-gray-600">Tăng cường bảo mật cho tài khoản</p>
                  </div>
                  <Button variant="outline">Kích hoạt</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Phiên đăng nhập</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Windows - Chrome</h5>
                      <p className="text-sm text-gray-600">IP: 192.168.1.1 • Hiện tại</p>
                    </div>
                    <Badge className="bg-green-500 text-white">Đang hoạt động</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tùy chỉnh hệ thống</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngôn ngữ</Label>
                  <Select defaultValue="vi">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Múi giờ</Label>
                  <Select defaultValue="utc7">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc7">UTC+7 (Hà Nội)</SelectItem>
                      <SelectItem value="utc8">UTC+8 (Bangkok)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Định dạng ngày</Label>
                  <Select defaultValue="dmy">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Định dạng giờ</Label>
                  <Select defaultValue="24h">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 giờ</SelectItem>
                      <SelectItem value="12h">12 giờ (AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Hiển thị</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Chế độ tối</h5>
                      <p className="text-sm text-gray-600">Bật giao diện tối để giảm mỏi mắt</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Compact mode</h5>
                      <p className="text-sm text-gray-600">Giảm khoảng cách giữa các phần tử</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Hủy</Button>
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
