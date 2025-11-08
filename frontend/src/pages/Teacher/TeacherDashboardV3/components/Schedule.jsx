import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 26)); // Oct 26, 2025
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const events = [
    {
      id: '1',
      title: 'Lớp 10A1 - Unit 5 Speaking',
      class: '10A1',
      type: 'class',
      startTime: '07:00',
      endTime: '07:45',
      date: '2025-10-27',
      room: 'Phòng 201',
      color: 'blue',
      students: 32
    },
    {
      id: '2',
      title: 'Lớp 10A2 - Grammar Review',
      class: '10A2',
      type: 'class',
      startTime: '08:00',
      endTime: '08:45',
      date: '2025-10-27',
      room: 'Phòng 202',
      color: 'green',
      students: 30
    },
    {
      id: '3',
      title: 'Họp giáo viên',
      type: 'meeting',
      startTime: '14:00',
      endTime: '15:30',
      date: '2025-10-27',
      room: 'Phòng họp',
      color: 'purple'
    },
    {
      id: '4',
      title: 'Lớp 11B1 - IELTS Listening',
      class: '11B1',
      type: 'class',
      startTime: '09:00',
      endTime: '10:30',
      date: '2025-10-28',
      room: 'Phòng 203',
      color: 'orange',
      students: 28
    },
    {
      id: '5',
      title: 'Chấm bài kiểm tra',
      type: 'task',
      startTime: '15:00',
      endTime: '17:00',
      date: '2025-10-28',
      room: 'Văn phòng',
      color: 'pink'
    },
    {
      id: '6',
      title: 'Lớp 10A1 - Reading Comprehension',
      class: '10A1',
      type: 'class',
      startTime: '07:00',
      endTime: '07:45',
      date: '2025-10-29',
      room: 'Phòng 201',
      color: 'blue',
      students: 32
    }
  ];

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  const getWeekDates = () => {
    const dates = [];
    const currentDay = currentDate.getDay();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - currentDay + 1);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const getEventsForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  const getEventColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      pink: 'bg-pink-100 text-pink-700 border-pink-300'
    };
    return colors[color] || colors.blue;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date(2025, 9, 26));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch giảng dạy</h1>
        <p className="text-gray-600">Quản lý lịch học và công việc</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Lớp học hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tổng giờ dạy</p>
              <p className="text-2xl font-bold text-gray-900">18h</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Cuộc họp</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Công việc</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar Controls */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">
              Tuần {weekDates[0].getDate()}/{weekDates[0].getMonth() + 1} - {weekDates[6].getDate()}/{weekDates[6].getMonth() + 1}/{weekDates[6].getFullYear()}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hôm nay
            </Button>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm sự kiện
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Thêm sự kiện mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Tiêu đề</Label>
                  <Input placeholder="VD: Lớp 10A1 - Unit 6" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Loại sự kiện</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class">Lớp học</SelectItem>
                        <SelectItem value="meeting">Cuộc họp</SelectItem>
                        <SelectItem value="task">Công việc</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lớp (nếu có)</Label>
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
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Ngày</Label>
                    <Input type="date" />
                  </div>
                  <div>
                    <Label>Giờ bắt đầu</Label>
                    <Input type="time" />
                  </div>
                  <div>
                    <Label>Giờ kết thúc</Label>
                    <Input type="time" />
                  </div>
                </div>
                <div>
                  <Label>Địa điểm</Label>
                  <Input placeholder="VD: Phòng 201" />
                </div>
                <div>
                  <Label>Màu sắc</Label>
                  <div className="flex gap-2">
                    {['blue', 'green', 'purple', 'orange', 'pink'].map(color => (
                      <button
                        key={color}
                        className={`w-10 h-10 rounded-full ${
                          color === 'blue' ? 'bg-blue-500' :
                          color === 'green' ? 'bg-green-500' :
                          color === 'purple' ? 'bg-purple-500' :
                          color === 'orange' ? 'bg-orange-500' : 'bg-pink-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Ghi chú</Label>
                  <Textarea placeholder="Ghi chú thêm..." rows={3} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                  <Button onClick={() => setIsCreateOpen(false)}>Thêm sự kiện</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Weekly Calendar */}
      <Card className="p-6">
        <div className="grid grid-cols-8 gap-2">
          {/* Time column */}
          <div className="text-xs text-gray-500 pr-2">
            <div className="h-12 flex items-center justify-end">Giờ</div>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-20 flex items-center justify-end border-t border-gray-100">
                {String(i + 7).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDates.map((date, dayIndex) => {
            const isToday = date.getDate() === 26 && date.getMonth() === 9;
            const dayEvents = getEventsForDate(date);
            
            return (
              <div key={dayIndex} className="flex flex-col">
                <div className={`h-12 flex flex-col items-center justify-center rounded-t-lg ${
                  isToday ? 'bg-purple-500 text-white' : 'bg-gray-50'
                }`}>
                  <div className="text-xs">{weekDays[date.getDay()]}</div>
                  <div className="text-lg font-semibold">{date.getDate()}</div>
                </div>
                <div className="relative flex-1">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="h-20 border-t border-gray-100 relative" />
                  ))}
                  {/* Events */}
                  <div className="absolute inset-0 pointer-events-none">
                    {dayEvents.map((event, idx) => {
                      const [startHour] = event.startTime.split(':').map(Number);
                      const [endHour] = event.endTime.split(':').map(Number);
                      const top = ((startHour - 7) * 80) + 4;
                      const height = ((endHour - startHour) * 80) - 8;
                      
                      return (
                        <div
                          key={event.id}
                          className={`absolute left-1 right-1 rounded border-l-4 p-2 pointer-events-auto cursor-pointer hover:shadow-md transition-shadow ${getEventColor(event.color)}`}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <div className="text-xs font-semibold line-clamp-1">{event.title}</div>
                          <div className="text-xs flex items-center gap-1 mt-1 opacity-80">
                            <Clock className="w-3 h-3" />
                            {event.startTime}
                          </div>
                          {event.room && (
                            <div className="text-xs flex items-center gap-1 opacity-80">
                              <MapPin className="w-3 h-3" />
                              {event.room}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Today's Events List */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch hôm nay</h3>
        <div className="space-y-3">
          {getEventsForDate(new Date(2025, 9, 27)).map((event) => (
            <div key={event.id} className={`p-4 rounded-lg border-l-4 ${getEventColor(event.color)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-base font-semibold mb-1">{event.title}</h4>
                  <div className="flex items-center gap-4 text-sm opacity-80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {event.startTime} - {event.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.room}
                    </span>
                    {event.students && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.students} HS
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Schedule;
