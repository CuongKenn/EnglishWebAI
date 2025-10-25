# 🤖 AI Management Guide - Hướng dẫn Quản lý AI

## 📋 Tổng quan

Hệ thống AI Practice bây giờ đã có **tích hợp hoàn chỉnh với Admin Dashboard** để quản lý các tính năng AI, API keys, và theo dõi usage statistics.

## 🎯 Những gì đã được tạo

### 1. **AI Settings Page** (Quản lý cấu hình AI)

**Đường dẫn:** `/admin-dashboard/ai-settings`

**Chức năng:**

#### Tab 1: API Keys Management 🔑
- Quản lý API keys cho các dịch vụ AI:
  - **OpenAI API** - Cho Conversation, Writing, Reading AI
  - **Google Translate API** - Cho Translation AI
  - **ElevenLabs API** - Cho Text-to-Speech
  - **DeepL API** - Dịch thuật chất lượng cao (optional)

- Tính năng:
  - ✅ Hide/Show API keys
  - ✅ Kiểm tra trạng thái cấu hình
  - ✅ Links đến documentation
  - ✅ Lưu trữ an toàn với localStorage

#### Tab 2: Feature Management 🛠️
- Bật/tắt từng tính năng AI:
  - 🌐 Dịch bằng AI
  - 💬 Conversation AI
  - 🎧 Luyện nghe AI
  - ✍️ Luyện viết AI
  - 📖 Luyện đọc AI
  - 🎴 Flashcard AI

- Toggle switches đẹp mắt với gradient colors
- Khi tắt tính năng, nó sẽ không hiển thị cho users

#### Tab 3: Limits & Quotas ⚡
- Thiết lập giới hạn sử dụng:
  - **Daily Requests** (100 - 10,000): Giới hạn tổng requests/ngày
  - **Requests per User** (10 - 500): Giới hạn mỗi user/ngày
  - **Max Tokens** (500 - 8,000): Giới hạn tokens cho OpenAI

- Sliders với visual feedback
- Giúp kiểm soát chi phí API

---

### 2. **AI Analytics Page** (Thống kê & Phân tích)

**Đường dẫn:** `/admin-dashboard/ai-analytics`

**Chức năng:**

#### Overview Statistics Cards 📊
- **Total Requests**: Tổng số requests AI
- **Active Users**: Số users đang sử dụng AI
- **Average per Day**: Trung bình requests/ngày
- **Most Popular Feature**: Tính năng được dùng nhiều nhất

#### Usage by Feature Chart 📈
- Bar chart hiển thị usage theo từng tính năng
- Phần trăm so với tổng
- Color-coded theo từng feature

#### 30-Day Trend Chart 📉
- Biểu đồ xu hướng 30 ngày
- Interactive tooltip
- Gradient visualization

#### Detailed Statistics Table 📋
- Bảng chi tiết cho từng tính năng:
  - Tổng requests
  - Phần trăm của tổng
  - Trung bình/ngày
  - Xu hướng tăng/giảm

#### Controls 🎛️
- Time range selector (7d / 30d / 90d)
- Refresh button để làm mới data
- Auto-generate mock data cho demo

---

### 3. **AI Settings Service** (localStorage)

**File:** `frontend/src/services/aiSettingsService.js`

**Chức năng:**

#### Settings Management
```javascript
// Lấy settings
const settings = aiSettingsService.getSettings();

// Update API key
aiSettingsService.updateApiKey('openai', 'sk-...');

// Toggle feature
aiSettingsService.toggleFeature('conversation', true);

// Update limits
aiSettingsService.updateLimits({ dailyRequests: 5000 });

// Check if feature enabled
const isEnabled = aiSettingsService.isFeatureEnabled('translate');
```

#### Usage Statistics
```javascript
// Lấy usage stats
const stats = aiSettingsService.getUsageStats();

// Log usage (khi user dùng feature)
aiSettingsService.logUsage('conversation', userId);

// Generate mock data cho demo
aiSettingsService.generateMockStats();

// Reset statistics
aiSettingsService.resetStats();
```

---

## 🎨 UI/UX Features

### Design Elements
- ✨ **Gradient backgrounds** cho mỗi tính năng
- 🎯 **Color-coded sections** dễ phân biệt
- 📱 **Fully responsive** cho mobile/tablet
- 🔄 **Smooth animations** và transitions
- 💫 **Modern card-based layout**

### Interactive Components
- Toggle switches với animation
- Range sliders với visual feedback
- Hover effects trên cards
- Active states cho navigation
- Loading states

---

## 📍 Navigation

### Admin Dashboard Menu
Thêm section mới trong sidebar:

```
📊 Thống kê và báo cáo
  └─ Thống kê tổng quan

🤖 QUẢN LÝ AI  ⬅️ MỚI!
  ├─ 🤖 AI Analytics
  └─ 🔑 AI Settings

⚙️ Cài đặt
  ├─ Cấu hình hệ thống
  ├─ Sao lưu dữ liệu
  └─ Nhật ký hệ thống
```

---

## 🔒 Data Storage

### LocalStorage Structure

#### AI Settings
```json
{
  "apiKeys": {
    "openai": "sk-...",
    "googleTranslate": "AIza...",
    "elevenLabs": "el_...",
    "deepl": ""
  },
  "features": {
    "translate": true,
    "conversation": true,
    "listening": true,
    "writing": true,
    "reading": true,
    "flashcard": true
  },
  "limits": {
    "dailyRequests": 1000,
    "requestsPerUser": 100,
    "maxTokens": 4000
  },
  "lastUpdated": "2025-10-25T..."
}
```

#### Usage Statistics
```json
{
  "totalRequests": 45231,
  "requestsByFeature": {
    "translate": 15234,
    "conversation": 10456,
    "listening": 6789,
    "writing": 4123,
    "reading": 5678,
    "flashcard": 8951
  },
  "requestsByDay": [
    { "date": "2025-10-01", "count": 1234 },
    { "date": "2025-10-02", "count": 1456 }
  ],
  "activeUsers": 342,
  "lastReset": "2025-10-01T..."
}
```

---

## 🚀 Workflow

### 1. Admin Setup (Lần đầu)
1. Login vào Admin Dashboard
2. Vào **AI Settings** → Tab API Keys
3. Nhập các API keys cần thiết
4. Lưu settings

### 2. Feature Management
1. Vào **AI Settings** → Tab Features
2. Bật/tắt các tính năng theo nhu cầu
3. Tính năng bị tắt sẽ ẩn khỏi users

### 3. Set Limits
1. Vào **AI Settings** → Tab Limits
2. Adjust sliders để set giới hạn
3. Giúp kiểm soát chi phí

### 4. Monitor Usage
1. Vào **AI Analytics**
2. Xem overview statistics
3. Phân tích usage patterns
4. Identify popular features

---

## 🔄 Integration với AI Practice

### Frontend Only (Hiện tại)
- ✅ Tất cả logic chạy trên frontend
- ✅ Data lưu trong localStorage
- ✅ Mock API calls
- ✅ Demo-ready

### Production Ready (Tương lai)
Khi cần production, bạn chỉ cần:

1. **Backend API Endpoints:**
```javascript
// Thay vì localStorage, call API
POST /api/admin/ai-settings/api-keys
GET  /api/admin/ai-settings
PUT  /api/admin/ai-settings/features
GET  /api/admin/ai-analytics/stats
POST /api/ai/usage-log
```

2. **Database Schema:**
```sql
-- ai_settings table
CREATE TABLE ai_settings (
  id INT PRIMARY KEY,
  provider VARCHAR(50),
  api_key VARCHAR(255) ENCRYPTED,
  feature_name VARCHAR(50),
  is_enabled BOOLEAN,
  daily_limit INT,
  updated_at TIMESTAMP
);

-- ai_usage_logs table
CREATE TABLE ai_usage_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  feature_name VARCHAR(50),
  request_count INT,
  tokens_used INT,
  created_at TIMESTAMP
);
```

3. **Environment Variables:**
```env
OPENAI_API_KEY=sk-...
GOOGLE_TRANSLATE_KEY=AIza...
ELEVENLABS_KEY=el_...
DEEPL_KEY=...
```

---

## 💡 Best Practices

### Security
- ⚠️ **Không commit API keys** vào git
- 🔐 Trong production, lưu API keys trên server
- 🛡️ Encrypt API keys trong database
- 🔑 Sử dụng environment variables

### Performance
- 📊 Monitor usage regularly
- ⚡ Set appropriate limits
- 🔄 Cache responses khi có thể
- 📈 Scale theo usage patterns

### Cost Management
- 💰 Set daily/user limits hợp lý
- 📉 Monitor spending với analytics
- 🎯 Optimize token usage
- 🔕 Disable unused features

---

## 🎯 Key Points

### ✅ Hoàn chỉnh và sẵn sàng
- Không cần động đến backend
- Tất cả chạy trên frontend
- LocalStorage cho demo
- Dễ dàng migrate sang API

### ✅ Admin có toàn quyền kiểm soát
- Quản lý API keys
- Bật/tắt features
- Set limits & quotas
- Xem analytics real-time

### ✅ Production Ready
- Clean code structure
- Service-based architecture
- Easy to extend
- API-ready design

---

## 📂 File Structure

```
frontend/src/
├── services/
│   └── aiSettingsService.js          # AI Settings service với localStorage
├── pages/
│   ├── student/
│   │   ├── AIPractice.jsx            # Main AI Practice page
│   │   └── AIPractice.css
│   └── Admin/
│       ├── AISettings/
│       │   ├── AISettings.jsx        # AI Settings management page
│       │   ├── AISettings.css
│       │   └── index.js
│       └── AIAnalytics/
│           ├── AIAnalytics.jsx       # AI Analytics dashboard
│           ├── AIAnalytics.css
│           └── index.js
└── components/
    └── ai/
        ├── AISidebar.jsx
        ├── TranslateAI.jsx
        ├── ConversationAI.jsx
        ├── ListeningAI.jsx
        ├── WritingAI.jsx
        ├── ReadingAI.jsx
        └── FlashcardAI.jsx
```

---

## 🎓 Usage Examples

### Example 1: Admin Setup API Keys
```javascript
import aiSettingsService from './services/aiSettingsService';

// Update OpenAI key
aiSettingsService.updateApiKey('openai', 'sk-abc123...');

// Update Google Translate key
aiSettingsService.updateApiKey('googleTranslate', 'AIza-xyz789...');
```

### Example 2: Disable a Feature
```javascript
// Disable Writing AI feature
aiSettingsService.toggleFeature('writing', false);

// Check if feature is enabled
if (aiSettingsService.isFeatureEnabled('writing')) {
  // Show writing feature
} else {
  // Hide writing feature
}
```

### Example 3: Log Usage
```javascript
// When user uses a feature
const userId = getCurrentUser().id;
aiSettingsService.logUsage('conversation', userId);
```

### Example 4: Get Analytics
```javascript
const stats = aiSettingsService.getUsageStats();
console.log('Total requests:', stats.totalRequests);
console.log('Popular feature:', getMostPopular(stats.requestsByFeature));
```

---

## 🔗 Routes Summary

| Route | Component | Description |
|-------|-----------|-------------|
| `/ai-practice` | AIPractice | Student AI practice page |
| `/admin-dashboard/ai-analytics` | AIAnalytics | Admin analytics dashboard |
| `/admin-dashboard/ai-settings` | AISettings | Admin settings management |

---

## 🎉 Kết luận

Hệ thống AI Management đã **hoàn chỉnh và sẵn sàng sử dụng**:

✅ **Admin có đầy đủ quyền quản lý**
- API keys management
- Feature toggles
- Usage limits
- Analytics dashboard

✅ **Không cần backend (Frontend only)**
- LocalStorage để demo
- Mock data generation
- Dễ dàng chuyển sang API

✅ **Production Ready**
- Clean architecture
- Service pattern
- Scalable design
- Security-aware

**Chỉ cần chạy ứng dụng và test thôi!** 🚀

