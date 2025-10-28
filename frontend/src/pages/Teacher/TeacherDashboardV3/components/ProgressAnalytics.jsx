import { useEffect, useState } from 'react';
import { apiV1 } from '../../../../services/api';
import { BarChart3, Users, FileText, CheckCircle, Loader2 } from 'lucide-react';

export default function ProgressAnalytics() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { if (classId) loadData(classId); }, [classId]);

  const fetchClasses = async () => {
    try {
      const res = await apiV1.get('/classes/teaching');
      setClasses(res.data);
      if (res.data?.length) setClassId(res.data[0].id);
    } catch (e) { console.error(e); }
  };

  const loadData = async (cid) => {
    setLoading(true);
    try {
      const [o, s] = await Promise.all([
        apiV1.get(`/teacher/classes/${cid}/analytics/overview`),
        apiV1.get(`/teacher/classes/${cid}/analytics/students`)
      ]);
      setOverview(o.data);
      setStudents(s.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Phân tích tiến độ lớp học</h1>
        </div>
        <p className="text-gray-600">Tổng quan điểm số, tỷ lệ nộp bài, và xu hướng theo lớp</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn lớp</label>
        <div className="flex gap-2 overflow-x-auto">
          {classes.map(c => (
            <button key={c.id} onClick={() => setClassId(c.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${classId===c.id?'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg':'bg-white text-gray-700 border border-gray-200'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" /> Đang tải...</div>
      ) : !overview ? (
        <div className="text-gray-500">Chưa có dữ liệu</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-xl border bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Sĩ số</span>
                <Users className="text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{overview.student_count}</div>
            </div>
            <div className="p-5 rounded-xl border bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Bài tập</span>
                <FileText className="text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{overview.total_exercises}</div>
            </div>
            <div className="p-5 rounded-xl border bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Đã nộp</span>
                <CheckCircle className="text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{overview.total_submissions}</div>
            </div>
            <div className="p-5 rounded-xl border bg-white">
              <div className="text-sm text-gray-500 mb-1">Điểm TB lớp</div>
              <div className="text-2xl font-bold text-purple-600">{overview.class_average}</div>
              <div className="text-xs text-gray-500 mt-1">Tỷ lệ nộp: {overview.submission_rate}% • Chờ chấm: {overview.pending_grading}</div>
            </div>
          </div>

          {/* Grading status stacked bar */}
          <div className="p-5 rounded-xl border bg-white mb-6">
            <div className="text-sm font-medium text-gray-700 mb-4">Trạng thái chấm điểm</div>
            <div className="h-4 bg-gray-100 rounded overflow-hidden flex">
              {(() => {
                const total = (overview.graded_submissions || 0) + (overview.pending_grading || 0);
                const gradedW = total ? (overview.graded_submissions / total) * 100 : 0;
                const pendingW = total ? (overview.pending_grading / total) * 100 : 0;
                return (
                  <>
                    <div className="h-4" style={{ width: `${gradedW}%`, background: '#22c55e' }} />
                    <div className="h-4" style={{ width: `${pendingW}%`, background: '#f59e0b' }} />
                  </>
                );
              })()}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Đã chấm: {overview.graded_submissions}</span>
              <span>Chờ chấm: {overview.pending_grading}</span>
            </div>
          </div>

          {/* Trend-like bars */}
          <div className="p-5 rounded-xl border bg-white mb-6">
            <div className="text-sm font-medium text-gray-700 mb-4">Điểm trung bình theo học sinh</div>
            <div className="space-y-3">
              {students.slice(0, 12).map(s => (
                <div key={s.student_id} className="flex items-center gap-3">
                  <div className="w-40 text-sm text-gray-700 truncate">{s.student_name}</div>
                  <div className="flex-1 h-3 bg-gray-100 rounded overflow-hidden">
                    <div className="h-3 bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${Math.min(100, s.average_score)}%`}} />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold text-purple-600">{s.average_score.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills grid */}
          <div className="p-5 rounded-xl border bg-white">
            <div className="text-sm font-medium text-gray-700 mb-4">Điểm trung bình theo kỹ năng</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['reading','writing','listening','speaking'].map(skill => {
                const vals = students.map(s => s.skill_scores?.[skill] || 0).filter(v=>v>0);
                const avg = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
                return (
                  <div key={skill} className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50">
                    <div className="text-xs text-gray-600 capitalize mb-2">{skill}</div>
                    <div className="h-2 bg-white rounded">
                      <div className="h-2 rounded bg-purple-500" style={{ width: `${avg}%`}} />
                    </div>
                    <div className="mt-2 text-sm font-semibold text-purple-600">{avg.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
