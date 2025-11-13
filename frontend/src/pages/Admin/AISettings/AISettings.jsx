import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Key, Shield, AlertCircle, CheckCircle2, Bot, Globe, Mic2, Type, MessageCircle, Headphones, PenLine, BookOpen, CreditCard } from 'lucide-react';
import aiSettingsService from '../../../services/aiSettingsService';
import './AISettings.css';

const AISettings = () => {
  const [settings, setSettings] = useState(null);
  const [showKeys, setShowKeys] = useState({});
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('api-keys');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const currentSettings = aiSettingsService.getSettings();
    setSettings(currentSettings);
  };

  const handleApiKeyChange = (provider, value) => {
    setSettings({
      ...settings,
      apiKeys: {
        ...settings.apiKeys,
        [provider]: value,
      },
    });
  };

  const handleFeatureToggle = (feature) => {
    setSettings({
      ...settings,
      features: {
        ...settings.features,
        [feature]: !settings.features[feature],
      },
    });
  };

  const handleLimitChange = (limit, value) => {
    setSettings({
      ...settings,
      limits: {
        ...settings.limits,
        [limit]: parseInt(value) || 0,
      },
    });
  };

  const handleSave = () => {
    aiSettingsService.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleShowKey = (provider) => {
    setShowKeys({
      ...showKeys,
      [provider]: !showKeys[provider],
    });
  };

  // maskApiKey defined but currently not used in UI - could be used for display security later

  const apiProviders = [
    {
      id: 'openai',
      name: 'OpenAI API',
      icon: <Bot className="inline-block w-5 h-5" />,
      description: 'Dùng cho Conversation AI, Writing AI, Reading AI',
      placeholder: 'sk-...',
      docs: 'https://platform.openai.com/api-keys',
    },
    {
      id: 'googleTranslate',
      name: 'Google Translate API',
      icon: <Globe className="inline-block w-5 h-5" />,
      description: 'Dùng cho Translation AI',
      placeholder: 'AIza...',
      docs: 'https://cloud.google.com/translate/docs',
    },
    {
      id: 'elevenLabs',
      name: 'ElevenLabs API',
      icon: <Mic2 className="inline-block w-5 h-5" />,
      description: 'Dùng cho Text-to-Speech trong Listening AI',
      placeholder: 'el_...',
      docs: 'https://elevenlabs.io/docs',
    },
    {
      id: 'deepl',
      name: 'DeepL API',
      icon: <Type className="inline-block w-5 h-5" />,
      description: 'API dịch thuật chất lượng cao (tùy chọn)',
      placeholder: '',
      docs: 'https://www.deepl.com/docs-api',
    },
  ];

  const features = [
    { id: 'translate', name: 'Dịch bằng AI', icon: <Globe className="inline-block w-5 h-5" />, color: 'blue' },
    { id: 'conversation', name: 'Conversation AI', icon: <MessageCircle className="inline-block w-5 h-5" />, color: 'purple' },
    { id: 'listening', name: 'Luyện nghe AI', icon: <Headphones className="inline-block w-5 h-5" />, color: 'green' },
    { id: 'writing', name: 'Luyện viết AI', icon: <PenLine className="inline-block w-5 h-5" />, color: 'orange' },
    { id: 'reading', name: 'Luyện đọc AI', icon: <BookOpen className="inline-block w-5 h-5" />, color: 'indigo' },
    { id: 'flashcard', name: 'Flashcard AI', icon: <CreditCard className="inline-block w-5 h-5" />, color: 'pink' },
  ];

  if (!settings) return <div>Đang tải...</div>;

  return (
    <div className="ai-settings-container">
      <div className="ai-settings-header">
        <div>
          <h1 className="ai-settings-title">
            <Key className="title-icon" />
            Quản lý AI Settings
          </h1>
          <p className="ai-settings-subtitle">
            Cấu hình API keys và quản lý các tính năng AI
          </p>
        </div>
        <button 
          className={`save-button ${saved ? 'saved' : ''}`}
          onClick={handleSave}
        >
          {saved ? (
            <>
              <CheckCircle2 size={18} />
              Đã lưu!
            </>
          ) : (
            <>
              <Save size={18} />
              Lưu thay đổi
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="ai-settings-tabs">
        <button
          className={`tab-button ${activeTab === 'api-keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-keys')}
        >
          <Key size={18} />
          API Keys
        </button>
        <button
          className={`tab-button ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          <Shield size={18} />
          Tính năng
        </button>
        <button
          className={`tab-button ${activeTab === 'limits' ? 'active' : ''}`}
          onClick={() => setActiveTab('limits')}
        >
          <AlertCircle size={18} />
          Giới hạn
        </button>
      </div>

      {/* Tab Content */}
      <div className="ai-settings-content">
        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="tab-content">
            <div className="info-banner">
              <AlertCircle size={20} />
              <div>
                <strong>Lưu ý bảo mật:</strong> API keys được lưu trên trình duyệt (localStorage). 
                Trong production, nên lưu trữ an toàn trên server.
              </div>
            </div>

            <div className="api-providers-grid">
              {apiProviders.map((provider) => (
                <div key={provider.id} className="api-provider-card">
                  <div className="provider-header">
                    <div className="provider-info">
                      <span className="provider-icon">{provider.icon}</span>
                      <div>
                        <h3>{provider.name}</h3>
                        <p className="provider-description">{provider.description}</p>
                      </div>
                    </div>
                    <a
                      href={provider.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="docs-link"
                    >
                      <BookOpen size={16} className="inline-block mr-1" /> Docs
                    </a>
                  </div>

                  <div className="api-key-input-group">
                    <input
                      type={showKeys[provider.id] ? 'text' : 'password'}
                      value={settings.apiKeys[provider.id] || ''}
                      onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                      placeholder={provider.placeholder || 'Nhập API key...'}
                      className="api-key-input"
                    />
                    <button
                      className="toggle-visibility-btn"
                      onClick={() => toggleShowKey(provider.id)}
                    >
                      {showKeys[provider.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="key-status">
                    {settings.apiKeys[provider.id] ? (
                      <span className="status-configured">
                        <Check size={16} className="inline-block mr-1" /> Đã cấu hình
                      </span>
                    ) : (
                      <span className="status-not-configured">
                        <AlertTriangle size={16} className="inline-block mr-1" /> Chưa cấu hình
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="tab-content">
            <div className="info-banner">
              <Shield size={20} />
              <div>
                Bật/tắt các tính năng AI cho toàn bộ hệ thống. 
                Tính năng bị tắt sẽ không hiển thị cho người dùng.
              </div>
            </div>

            <div className="features-grid">
              {features.map((feature) => (
                <div key={feature.id} className={`feature-card feature-${feature.color}`}>
                  <div className="feature-icon-large">{feature.icon}</div>
                  <h3 className="feature-name">{feature.name}</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.features[feature.id]}
                      onChange={() => handleFeatureToggle(feature.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="feature-status">
                    {settings.features[feature.id] ? 'Đang bật' : 'Đã tắt'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <div className="tab-content">
            <div className="info-banner">
              <AlertCircle size={20} />
              <div>
                Thiết lập giới hạn sử dụng để kiểm soát chi phí API và tránh lạm dụng.
              </div>
            </div>

            <div className="limits-section">
              <div className="limit-card">
                <div className="limit-header">
                  <div>
                    <h3>Giới hạn requests hàng ngày</h3>
                    <p>Tổng số requests AI cho toàn hệ thống mỗi ngày</p>
                  </div>
                  <span className="limit-badge">{settings.limits.dailyRequests.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={settings.limits.dailyRequests}
                  onChange={(e) => handleLimitChange('dailyRequests', e.target.value)}
                  className="limit-slider"
                />
                <div className="limit-labels">
                  <span>100</span>
                  <span>10,000</span>
                </div>
              </div>

              <div className="limit-card">
                <div className="limit-header">
                  <div>
                    <h3>Requests mỗi người dùng</h3>
                    <p>Số requests tối đa mỗi người dùng có thể thực hiện mỗi ngày</p>
                  </div>
                  <span className="limit-badge">{settings.limits.requestsPerUser}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={settings.limits.requestsPerUser}
                  onChange={(e) => handleLimitChange('requestsPerUser', e.target.value)}
                  className="limit-slider"
                />
                <div className="limit-labels">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>

              <div className="limit-card">
                <div className="limit-header">
                  <div>
                    <h3>Max Tokens mỗi request</h3>
                    <p>Giới hạn tokens cho mỗi request (áp dụng cho OpenAI)</p>
                  </div>
                  <span className="limit-badge">{settings.limits.maxTokens.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="8000"
                  step="500"
                  value={settings.limits.maxTokens}
                  onChange={(e) => handleLimitChange('maxTokens', e.target.value)}
                  className="limit-slider"
                />
                <div className="limit-labels">
                  <span>500</span>
                  <span>8,000</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="settings-footer">
        <span className="last-updated">
          Cập nhật lần cuối: {new Date(settings.lastUpdated).toLocaleString('vi-VN')}
        </span>
      </div>
    </div>
  );
};

export default AISettings;

