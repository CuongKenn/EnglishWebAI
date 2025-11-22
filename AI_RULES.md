# Quy tắc làm việc cho AI trong dự án EnglishWebAI

Tài liệu này quy định các nguyên tắc, quy trình và tiêu chuẩn dành cho các AI/agent khi tham gia phát triển, bảo trì và vận hành dự án EnglishWebAI.

Tuân theo tài liệu này giúp thay đổi an toàn, dễ review, dễ rollback và phù hợp với kiến trúc hiện tại của hệ thống.

## 1) Mục tiêu và phạm vi
- Bảo toàn tính ổn định của hệ thống (backend FastAPI + frontend React + Postgres + Docker/Nginx).
- Tối ưu hiệu năng, bảo mật, và trải nghiệm người dùng (Teacher/Student/Parent/Admin).
- Mọi thay đổi phải có lý do rõ ràng, tối thiểu rủi ro, dễ kiểm thử, và có log thay đổi.

## 2) Nguyên tắc chung
- Ưu tiên thay đổi nhỏ, có thể rollout/rollback nhanh (small, incremental PRs).
- Không tự ý đưa credentials/secrets vào code hay logs (env only). Không exfiltrate secrets.
- Không gọi API ngoài/third-party khi chạy test trừ khi có mock/stub.
- Không xoá dữ liệu/migrations hiện hữu nếu chưa có phương án migrate/backup an toàn.
- Tôn trọng chuẩn mã hoá, cấu trúc thư mục và conventions hiện tại của repo.
- Viết và cập nhật CHANGELOG (`CHANGELOG.md`) cho các thay đổi đáng kể.

## 3) Chuẩn code và style
### Backend (Python/FastAPI)
- Tuân thủ PEP8; docstring ngắn gọn cho public functions/routers.
- Tách rõ: routers -> services -> schemas -> models. Không nhúng logic nghiệp vụ nặng vào routers.
- Không tạo vòng phụ thuộc giữa modules. Ưu tiên dependency injection qua `Depends`.
- Tên endpoint REST theo `kebab-case`, version prefix `/api/v1/...` như hiện tại.
- Response và schema thống nhất qua Pydantic. Tránh trả về dict rời rạc.
- Logging: sử dụng mức INFO/WARN/ERROR hợp lý; không log thông tin nhạy cảm.

### Frontend (React/Vite)
- Component theo hướng function + hooks; tách UI (presentational) và logic (hooks/services).
- Gọi API qua lớp `services/` với axios; xử lý lỗi tập trung; không gọi API trực tiếp từ nhiều nơi.
- Sử dụng ESLint rules có sẵn; giữ JSX gọn, tách component nếu >200 dòng.
- UI theo Tailwind + Radix; nhất quán spacing/typography; tránh inline styles rối rắm.

## 4) Cơ sở dữ liệu và migrations (Alembic)
- Mọi thay đổi schema phải qua Alembic migration trong `backend/alembic/versions/`.
- Không sửa file migration đã merge vào develop/production; tạo migration mới để điều chỉnh.
- Migration phải có `upgrade()` và `downgrade()` khả dụng (idempotent nếu có thể).
- Khi thêm cột mới, thiết lập default/server_default phù hợp để tránh downtime.
- Đặt index cho các cột truy vấn nhiều (tham khảo `011_add_analytics_indexes.py`).

## 5) Hợp đồng API và tương thích ngược
- Không thay đổi breaking API khi chưa tăng version và cập nhật frontend tương ứng.
- Nếu bắt buộc breaking change: thêm route mới, deprecate route cũ có thời hạn.
- Cập nhật mô tả route, params, schema và ví dụ trong docstring/Swagger.

## 6) Testing và chất lượng
- Khi sửa public behavior, thêm/điều chỉnh test trong `backend/tests/` (pytest), ưu tiên:
  - Happy path + 1-2 edge cases (rỗng, quyền truy cập, dữ liệu lớn).
  - Mock external services (OpenAI, Azure Speech) khi cần.
- Luôn chạy: build/lint/test cục bộ trước khi mở PR. Không để build gãy.
- Đảm bảo các quality gates: Build PASS, Lint PASS, Tests PASS.

## 7) Bảo mật và tuân thủ
- Secrets chỉ lấy từ `.env`/secret manager; không commit `.env` thật.
- Che mờ/ẩn thông tin cá nhân trong logs/exports.
- Ràng buộc quyền với RBAC hiện có (`app/core/security.py`, `role_utils.py`).
- Kiểm tra CORS, rate limit (nếu có), và validate input bằng Pydantic.

## 8) Hiệu năng và quan sát
- Tránh N+1 queries; dùng `selectinload/joinedload` nếu phù hợp.
- Thêm index khi có truy vấn chậm lặp lại; đo đạc trước/sau.
- Không block event loop với tác vụ nặng; cân nhắc background tasks/worker.
- Ghi nhận metric/timer ở các đoạn nóng (nếu có hạ tầng).

## 9) Quy trình Git và PR
- Nhánh chính: `develop`. Tạo nhánh tính năng: `feature/<ngan-gon>`; bugfix: `fix/<mo-ta>`.
- Commit theo Conventional Commits: `feat: …`, `fix: …`, `docs: …`, `chore: …`, `refactor: …`, `perf: …`, `test: …`.
- PR nhỏ gọn, mô tả rõ: mục tiêu, thay đổi chính, ảnh chụp màn hình (nếu UI), rủi ro, cách test.
- Cập nhật `CHANGELOG.md` trong cùng PR khi có tính năng/sửa lỗi đáng kể.
- Sau khi merge, dọn nhánh nếu không còn dùng.

## 10) Docker, deploy và môi trường
- Dev: dùng `docker-compose.yml`. Không sửa cứng port/đường dẫn; lấy từ env.
- Backend container chạy `alembic upgrade head` trước khi start Uvicorn (giữ nguyên hành vi này).
- Không đẩy file nặng/binary vào git; dùng volumes cho data/media/logs.
- Nginx: không chỉnh trực tiếp cấu hình production nếu không được yêu cầu; tạo bản PR riêng.

## 11) Quy tắc sử dụng AI dịch vụ (OpenAI/Azure)
- Tất cả key lấy từ env; không hardcode.
- Với yêu cầu tốn phí, thêm guardrails: limit tần suất, kích thước payload, timeout.
- Cache/memoize kết quả phù hợp; xử lý retry với backoff.
- Không gửi dữ liệu nhạy cảm lên dịch vụ ngoài trừ khi đã ẩn danh/được phép.

## 12) Truyền thông và tài liệu
- Cập nhật `CHANGELOG.md` và thêm mô tả ở PR.
- Với API mới: ghi chú ngắn trong routers/services về input/output/edge cases.
- Nếu thay đổi lớn: thêm hướng dẫn ngắn vào README/khu vực docs liên quan.

## 13) Checklist trước khi mở PR
- [ ] Code chạy, không lỗi lint/type.
- [ ] Test chính chạy PASS, thêm test cần thiết.
- [ ] Migrations (nếu có) chạy lên/xuống được.
- [ ] Không lộ secrets; .env không bị commit.
- [ ] Cập nhật CHANGELOG (nếu applicable).
- [ ] Screenshot/video (nếu là thay đổi UI).

## 14) Những điều bị cấm
- [X] Commit secrets, token, mật khẩu, dữ liệu người dùng thật.
- [X] Xoá hoặc chỉnh sửa migration đã chạy ở môi trường chung.
- [X] Push thẳng vào `develop`/`production` (không qua PR) trừ khi khẩn cấp đã được duyệt.
- [X] Tạo thay đổi lớn, đa mục tiêu trong một PR.
- [X] Log dữ liệu nhạy cảm, mã nguồn chưa kiểm duyệt bản quyền.

## 15) Liên hệ và quyền quyết định
- Người phê duyệt cuối cùng: Maintainers trên nhánh `develop`.
- Tranh chấp/không chắc chắn: tạo issue mô tả rõ, đề xuất phương án, xin ý kiến duyệt.

---

## Phụ lục A: Mẫu tiêu đề commit (Conventional Commits)
- `feat: thêm bài kiểm tra tuần cho lớp`
- `fix: sửa lỗi không load bài tập của học sinh`
- `docs: cập nhật CHANGELOG cho v1.2.1`
- `refactor: tách logic grading khỏi router`
- `perf: thêm index cho bảng submissions`
- `test: thêm test cho ai_analytics router`

## Phụ lục B: Mẫu mô tả PR
Tiêu đề: `feat(teacher-dashboard): thêm báo cáo hiệu suất lớp`

Tóm tắt:
- Thêm màn hình thống kê lớp theo tuần/tháng
- API: `/api/v1/teacher-analytics/...` (không breaking)
- Index mới: `idx_submission_date_range`

Cách kiểm thử:
- Seed dữ liệu rồi mở trang Teacher Dashboard V3
- Lọc theo lớp 5A, tuần 40 => thấy biểu đồ và bảng cập nhật

Rủi ro/ảnh hưởng:
- Có thêm index nên migration cần chạy trước khi deploy

Ảnh minh hoạ:
- Đính kèm ảnh giao diện mới (nếu có)

---

Tài liệu này sẽ tiếp tục được cập nhật khi dự án phát triển. Vui lòng tuân thủ nghiêm các quy tắc để đảm bảo chất lượng và tính ổn định của hệ thống.