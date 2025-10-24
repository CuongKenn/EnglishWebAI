# Profile Feature Documentation

## 📋 Tổng quan

Tính năng Profile đã được thiết kế mới hoàn toàn với giao diện hiện đại, bắt mắt và nhiều hiệu ứng động.

## ✨ Tính năng chính

### 1. **Profile Dropdown trên Navbar**
- Hiển thị avatar và tên người dùng trên thanh navbar
- Dropdown menu với các tùy chọn:
  - 👤 **Thông tin**: Xem và quản lý hồ sơ cá nhân
  - 📚 **Học bạ**: Theo dõi kết quả học tập (Coming Soon)
  - 👥 **Giới thiệu bạn bè**: Chia sẻ và nhận ưu đãi
  - 🚪 **Đăng xuất**: Thoát khỏi tài khoản

### 2. **Trang Profile - Giao diện iPad Nằm Ngang**
Trang profile được thiết kế với:
- 🌌 **Background bầu trời sao FULLSCREEN**: Không có khoảng trắng, ngôi sao nhấp nháy với hiệu ứng twinkle
- 📱 **Khung iPad Nằm Ngang**: Container giống iPad ở giữa màn hình, tối ưu cho viewport
  - Camera và speaker ở phía trên
  - Màn hình iPad với gradient đẹp mắt
  - Không cần scroll, tất cả nội dung hiển thị vừa khung
- 🎨 **Màu sắc nhất quán**: Gradient tím-hồng (#667eea to #764ba2)

### 3. **Hai Tab chính**

#### Tab 1: Thông tin tài khoản
- Hiển thị readonly các thông tin:
  - Tên hiển thị
  - Email
  - Họ và tên
  - Số điện thoại
  - Địa chỉ
  - Ngày sinh
- Mỗi item có icon và hiệu ứng hover đẹp

#### Tab 2: Cài đặt tài khoản
- Cho phép chỉnh sửa thông tin cá nhân
- Nút "Chỉnh sửa" để bật chế độ edit
- Các trường có thể sửa (Grid 2 cột):
  - Tên hiển thị
  - Họ và tên
  - Số điện thoại
  - Địa chỉ
  - Ngày sinh
  - Giới tính
- Email không thể thay đổi (readonly)
- Nút "Lưu" và "Hủy" khi đang chỉnh sửa

**✨ XÁC MINH EMAIL:**
- ✅ Hiển thị trạng thái xác minh email
- 📧 Nút "Gửi email xác minh"
- ⏱️ Nút "Gửi lại" với cooldown 60 giây
- 🎨 Màu sắc thay đổi theo trạng thái (vàng: chưa xác minh, xanh: đã xác minh)

**👨‍👩‍👧 LIÊN KẾT PHỤ HUYNH (Chỉ cho học sinh):**
- 🔗 Nhập email phụ huynh để liên kết
- 📧 Gửi yêu cầu liên kết đến phụ huynh
- ✅ Hiển thị thông tin phụ huynh đã liên kết
- 🔓 Nút "Hủy liên kết" để gỡ bỏ liên kết
- 🎯 Phụ huynh có thể theo dõi kết quả học tập

### 4. **Upload Avatar**
- Click vào icon camera trên avatar để upload ảnh
- Hiển thị preview ngay lập tức
- Avatar hiển thị initials nếu chưa có ảnh
- Avatar có gradient border đẹp

### 5. **Các trang bổ sung**

#### Học bạ (Report Card)
- Trang coming soon
- Chuẩn bị cho tính năng theo dõi kết quả học tập

#### Giới thiệu bạn bè (Invite Friends)
- Hiển thị mã giới thiệu cá nhân
- Copy link giới thiệu
- Danh sách lợi ích khi giới thiệu

## 🎨 Hiệu ứng và Animation

1. **Starry Background FULLSCREEN**
   - 20+ ngôi sao với các kích thước khác nhau
   - Animation twinkle 8 giây
   - Opacity thay đổi từ 0.6 đến 1
   - **Full viewport**: position: fixed, không có padding
   - Không có khoảng trắng xung quanh

2. **iPad Landscape Layout**
   - Khung iPad nằm ngang (max-width: 1100px)
   - Height tối ưu: calc(100vh - 8rem)
   - Flexbox layout để tránh scroll
   - Content 2 cột trong settings tab

3. **Fade In Animations**
   - iPad container fade in từ dưới lên
   - Tab content fade in khi chuyển tab

4. **Hover Effects**
   - Info items trượt sang phải khi hover
   - Buttons có transform và shadow khi hover
   - Tabs có background color thay đổi
   - Verification sections có border highlight

5. **Interactive Elements**
   - Avatar upload button scale lên khi hover
   - Dropdown arrow xoay khi mở/đóng
   - Copy button đổi icon khi copy thành công
   - Resend button với cooldown countdown

## 📱 Responsive Design

### Desktop (> 768px)
- iPad container landscape (1100px max-width)
- Avatar 120px
- Settings form: Grid 2 cột
- Info grid: 2 cột
- Tabs hiển thị đầy đủ nội dung
- Không cần scroll

### Tablet (768px - 480px)
- iPad width 100%
- iPad padding giảm
- Avatar 100px
- Settings form: 1 cột
- Info grid: 1 cột
- Font sizes nhỏ hơn
- Button actions thành cột

### Mobile (< 480px)
- iPad container 100% width, full viewport
- Height: calc(100vh - 2rem)
- Avatar 80px
- Minimal padding
- Stacked layout
- Forms và grids 1 cột

## 🎯 User Flow

1. Người dùng đăng nhập
2. Navbar hiển thị avatar và tên
3. Click vào avatar → Dropdown menu xuất hiện
4. Chọn "Thông tin" → Đi đến trang Profile
5. Mặc định ở tab "Thông tin tài khoản" (readonly)
6. Chuyển sang tab "Cài đặt tài khoản"
7. Click "Chỉnh sửa" → Bật edit mode
8. Sửa các trường cần thiết
9. Click icon camera để upload avatar
10. Click "Lưu" → Cập nhật thông tin
11. Click "Hủy" → Hủy thay đổi

## 🔧 Technical Details

### Components
- `ProfileDropdown`: Avatar menu trên navbar
- `Profile`: Trang profile chính
- `ReportCard`: Trang học bạ
- `InviteFriends`: Trang giới thiệu bạn bè

### Routes
- `/profile` - Trang profile
- `/report-card` - Trang học bạ
- `/invite-friends` - Trang giới thiệu bạn bè

### State Management
- `user`: Thông tin user từ authService
- `activeTab`: Tab hiện tại ('info' hoặc 'settings')
- `isEditing`: Chế độ chỉnh sửa
- `editedUser`: Thông tin đang chỉnh sửa
- `emailVerified`: Trạng thái xác minh email
- `parentEmail`: Email phụ huynh để liên kết
- `linkedParent`: Thông tin phụ huynh đã liên kết
- `resendCooldown`: Thời gian chờ giữa các lần gửi email

### CSS Files
- `Profile.css`: Style cho trang profile
- `ProfileDropdown.css`: Style cho dropdown menu
- `ReportCard.css`: Style cho trang học bạ
- `InviteFriends.css`: Style cho trang giới thiệu

## 🚀 Next Steps

Để hoàn thiện tính năng, cần:

1. **Backend Integration**
   - ✅ API để update user profile
   - ✅ API để upload avatar
   - ✅ **API để gửi email xác minh**
   - ✅ **API để xác nhận email verification**
   - ✅ **API để liên kết với phụ huynh**
   - ✅ **API để hủy liên kết với phụ huynh**
   - ⏳ API để lấy thống kê học bạ
   - ⏳ API để quản lý referral code

2. **Database Schema Updates**
   ```sql
   ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
   ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
   ALTER TABLE users ADD COLUMN verification_sent_at TIMESTAMP;
   
   CREATE TABLE parent_student_links (
     id SERIAL PRIMARY KEY,
     student_id INTEGER REFERENCES users(id),
     parent_id INTEGER REFERENCES users(id),
     status VARCHAR(50) DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT NOW(),
     verified_at TIMESTAMP
   );
   ```

3. **Features to Add**
   - ✅ Email verification với cooldown
   - ✅ Parent-student linking
   - ⏳ Change password
   - ⏳ Two-factor authentication
   - ⏳ Activity log
   - ⏳ Học bạ với charts và statistics

4. **Improvements**
   - ⏳ Toast notifications thay vì alert
   - ⏳ Form validation
   - ⏳ Image cropping cho avatar
   - ⏳ Loading states
   - ⏳ Error handling
   - ⏳ Email notification cho phụ huynh khi có yêu cầu liên kết

## 📝 Notes

- Avatar hiện tại chỉ lưu trong state, cần API để lưu vào database
- Update profile hiện tại chỉ cập nhật state local
- Email không thể thay đổi (theo thiết kế)
- Tất cả routes đều protected (yêu cầu đăng nhập)

## 🎨 Design Inspiration

Giao diện lấy cảm hứng từ:
- iPad design với camera và speaker
- Starry night sky background
- Modern gradient colors
- Clean and minimal UI
- Smooth animations

---

**Created with ❤️ for English AI Platform**

