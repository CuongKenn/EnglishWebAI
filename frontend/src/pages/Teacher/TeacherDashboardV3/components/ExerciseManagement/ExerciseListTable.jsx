import { Eye, Trash2 } from 'lucide-react';

export default function ExerciseListTable({ items = [], onView, onDelete }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="text-left text-gray-600 text-sm border-b">
            <th className="px-4 py-3 w-[36px]">#</th>
            <th className="px-4 py-3">Tiêu đề</th>
            <th className="px-4 py-3">Lớp</th>
            <th className="px-4 py-3">Loại</th>
            <th className="px-4 py-3">Kỹ năng</th>
            <th className="px-4 py-3">Hạn</th>
            <th className="px-4 py-3">Điểm</th>
            <th className="px-4 py-3">Đã nộp</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {items.map((ex, idx) => (
            <tr key={ex.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900 line-clamp-1">{ex.title}</div>
              </td>
              <td className="px-4 py-3">{ex.class}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  {getTypeLabel(ex.type)}
                </span>
              </td>
              <td className="px-4 py-3 uppercase text-gray-700">{ex.skill || '-'}</td>
              <td className="px-4 py-3 text-gray-600">{formatDateTime(ex.dueDate)}</td>
              <td className="px-4 py-3">{ex.maxScore}</td>
              <td className="px-4 py-3">{ex.submissions}/{ex.totalStudents}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs ${ex.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {ex.status === 'active' ? 'Đang mở' : ex.status === 'closed' ? 'Đã đóng' : 'Bản nháp'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 justify-end">
                  <button
                    className="px-2 py-1 text-gray-600 hover:text-gray-900"
                    onClick={() => onView?.(ex)}
                    title="Xem chi tiết"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="px-2 py-1 text-red-600 hover:text-red-700"
                    onClick={() => onDelete?.(ex.id)}
                    title="Xóa bài"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={10}>
                Chưa có bài tập nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  function getTypeLabel(type) {
    const labels = {
      skill_exercise: 'Bài tập Kỹ năng',
      test_15min: 'Kiểm tra 15 phút',
      midterm: 'Kiểm tra Giữa kì',
      final: 'Kiểm tra Cuối kì',
    };
    return labels[type] || type;
  }

  function formatDateTime(dt) {
    try {
      if (!dt) return '-';
      const d = new Date(dt);
      return d.toLocaleString('vi-VN');
    } catch {
      return dt || '-';
    }
  }
}
