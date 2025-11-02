import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Video, Plus, Search, Users, Clock, Calendar, ExternalLink, Settings, Copy, Share2, Play, Pause } from 'lucide-react';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';

const OnlineTeaching = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const sessions = [
    {
      id: '1',
      title: 'Unit 5 - Speaking Practice',
      class: '10A1',
      date: '26/10/2025',
      time: '14:00 - 15:00',
      status: 'live',
      participants: 28,
      maxParticipants: 32,
      roomLink: 'https://meet.school.edu.vn/abc123',
      recording: true
    },
    {
      id: '2',
      title: 'Grammar Review - Present Perfect',
      class: '10A2',
      date: '26/10/2025',
      time: '15:30 - 16:30',
      status: 'scheduled',
      participants: 0,
      maxParticipants: 30,
      roomLink: 'https://meet.school.edu.vn/def456',
      recording: false
    },
    {
      id: '3',
      title: 'IELTS Listening Practice',
      class: '11B1',
      date: '27/10/2025',
      time: '09:00 - 10:30',
      status: 'scheduled',
      participants: 0,
      maxParticipants: 28,
      roomLink: 'https://meet.school.edu.vn/ghi789',
      recording: true
    },
    {
      id: '4',
      title: 'Reading Comprehension Workshop',
      class: '10A1',
      date: '25/10/2025',
      time: '14:00 - 15:30',
      status: 'completed',
      participants: 32,
      maxParticipants: 32,
      roomLink: 'https://meet.school.edu.vn/jkl012',
      recording: true,
      recordingUrl: 'https://recordings.school.edu.vn/video123'
    }
  ];

  const recordings = [
    {
      id: '1',
      title: 'Reading Comprehension Workshop',
      class: '10A1',
      date: '25/10/2025',
      duration: '1h 30m',
      views: 28,
      size: '1.2 GB',
      url: 'https://recordings.school.edu.vn/video123'
    },
    {
      id: '2',
      title: 'Vocabulary Building Session',
      class: '10A2',
      date: '24/10/2025',
      duration: '1h 15m',
      views: 25,
      size: '950 MB',
      url: 'https://recordings.school.edu.vn/video124'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white animate-pulse';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live': return 'Đang diễn ra';
      case 'scheduled': return 'Đã lên lịch';
      case 'completed': return 'Đã kết thúc';
      default: return status;
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dạy học trực tuyến</h1>
        <p className="text-gray-600">Quản lý phòng học trực tuyến và buổi dạy online</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-red-500 p-3 rounded-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Đang live</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'live').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Đã lên lịch</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tổng học sinh</p>
              <p className="text-2xl font-bold text-gray-900">118</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sessions">Phòng học trực tuyến</TabsTrigger>
          <TabsTrigger value="recordings">Video đã lưu</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          {/* Toolbar */}
          <Card className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm phòng học..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Tạo phòng học
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Tạo phòng học trực tuyến</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Tiêu đề buổi học</Label>
                      <Input placeholder="VD: Unit 5 - Speaking Practice" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Lớp</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn lớp" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10a1">10A1</SelectItem>
                            <SelectItem value="10a2">10A2</SelectItem>
                            <SelectItem value="11b1">11B1</SelectItem>
                            <SelectItem value="11b2">11B2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Số lượng tối đa</Label>
                        <Input type="number" placeholder="30" defaultValue="30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ngày</Label>
                        <Input type="date" />
                      </div>
                      <div>
                        <Label>Thời gian</Label>
                        <Input type="time" />
                      </div>
                    </div>
                    <div>
                      <Label>Thời lượng (phút)</Label>
                      <Input type="number" placeholder="60" defaultValue="60" />
                    </div>
                    <div>
                      <Label>Mô tả</Label>
                      <Textarea placeholder="Mô tả ngắn về nội dung buổi học..." rows={3} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="recording" className="w-4 h-4" />
                      <Label htmlFor="recording" className="cursor-pointer">Ghi lại buổi học</Label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                      <Button onClick={() => setIsCreateOpen(false)}>Tạo phòng học</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          {/* Sessions List */}
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center ${
                    session.status === 'live' ? 'bg-red-100' :
                    session.status === 'scheduled' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <Video className={`w-8 h-8 ${
                      session.status === 'live' ? 'text-red-600' :
                      session.status === 'scheduled' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{session.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Lớp {session.class}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {session.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.time}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {getStatusText(session.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          {session.participants}/{session.maxParticipants} học sinh
                        </span>
                        {session.recording && (
                          <Badge variant="outline" className="gap-1">
                            <Video className="w-3 h-3" />
                            Đang ghi hình
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {session.status === 'live' && (
                          <Button className="gap-2 bg-red-500 hover:bg-red-600">
                            <Video className="w-4 h-4" />
                            Tham gia
                          </Button>
                        )}
                        {session.status === 'scheduled' && (
                          <>
                            <Button variant="outline" className="gap-2">
                              <Copy className="w-4 h-4" />
                              Sao chép link
                            </Button>
                            <Button variant="outline" className="gap-2">
                              <Share2 className="w-4 h-4" />
                              Chia sẻ
                            </Button>
                          </>
                        )}
                        {session.status === 'completed' && session.recordingUrl && (
                          <Button variant="outline" className="gap-2">
                            <Play className="w-4 h-4" />
                            Xem lại
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Video đã ghi lại</h3>
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div key={recording.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-32 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded flex items-center justify-center">
                    <Play className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">{recording.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Lớp {recording.class}</span>
                      <span>{recording.date}</span>
                      <span>{recording.duration}</span>
                      <span>{recording.views} lượt xem</span>
                      <span>{recording.size}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Play className="w-4 h-4" />
                      Xem
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Tải xuống
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt phòng học</h3>
            <div className="space-y-6">
              <div>
                <Label>Nền tảng video</Label>
                <Select defaultValue="google-meet">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google-meet">Google Meet</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="microsoft-teams">Microsoft Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Thời lượng mặc định (phút)</Label>
                <Input type="number" defaultValue="60" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Tự động ghi hình</h4>
                  <p className="text-sm text-gray-600">Tự động ghi lại tất cả buổi học</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Phòng chờ</h4>
                  <p className="text-sm text-gray-600">Yêu cầu phê duyệt trước khi vào lớp</p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
              <div className="flex justify-end">
                <Button className="gap-2">
                  <Settings className="w-4 h-4" />
                  Lưu cài đặt
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OnlineTeaching;
