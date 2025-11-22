// Service quản lý AI Settings với localStorage (Frontend only)

const AI_SETTINGS_KEY = 'ai_settings';
const AI_USAGE_KEY = 'ai_usage_stats';

class AISettingsService {
  // Lấy tất cả settings
  getSettings() {
    const settings = localStorage.getItem(AI_SETTINGS_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
    
    // Default settings
    return {
      apiKeys: {
        openai: '',
        googleTranslate: '',
        elevenLabs: '',
        deepl: '',
      },
      features: {
        translate: true,
        conversation: true,
        listening: true,
        writing: true,
        reading: true,
        flashcard: true,
      },
      limits: {
        dailyRequests: 1000,
        requestsPerUser: 100,
        maxTokens: 4000,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  // Lưu settings
  saveSettings(settings) {
    settings.lastUpdated = new Date().toISOString();
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }

  // Update API key
  updateApiKey(provider, key) {
    const settings = this.getSettings();
    settings.apiKeys[provider] = key;
    return this.saveSettings(settings);
  }

  // Toggle feature
  toggleFeature(feature, enabled) {
    const settings = this.getSettings();
    settings.features[feature] = enabled;
    return this.saveSettings(settings);
  }

  // Update limits
  updateLimits(limits) {
    const settings = this.getSettings();
    settings.limits = { ...settings.limits, ...limits };
    return this.saveSettings(settings);
  }

  // Check if feature is enabled
  isFeatureEnabled(feature) {
    const settings = this.getSettings();
    return settings.features[feature] || false;
  }

  // Get API key
  getApiKey(provider) {
    const settings = this.getSettings();
    return settings.apiKeys[provider] || '';
  }

  // ========== USAGE STATISTICS ==========

  // Lấy usage statistics
  getUsageStats() {
    const stats = localStorage.getItem(AI_USAGE_KEY);
    if (stats) {
      return JSON.parse(stats);
    }
    
    // Default stats
    return {
      totalRequests: 0,
      requestsByFeature: {
        translate: 0,
        conversation: 0,
        listening: 0,
        writing: 0,
        reading: 0,
        flashcard: 0,
      },
      requestsByDay: [],
      activeUsers: 0,
      lastReset: new Date().toISOString(),
    };
  }

  // Log usage (mock - trong thực tế sẽ call API)
  logUsage(feature) {
    const stats = this.getUsageStats();
    stats.totalRequests++;
    stats.requestsByFeature[feature] = (stats.requestsByFeature[feature] || 0) + 1;
    
    // Log by day
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = stats.requestsByDay.findIndex(d => d.date === today);
    
    if (todayIndex >= 0) {
      stats.requestsByDay[todayIndex].count++;
    } else {
      stats.requestsByDay.push({ date: today, count: 1 });
    }
    
    // Keep only last 30 days
    if (stats.requestsByDay.length > 30) {
      stats.requestsByDay = stats.requestsByDay.slice(-30);
    }
    
    localStorage.setItem(AI_USAGE_KEY, JSON.stringify(stats));
    return stats;
  }

  // Generate mock statistics for demo
  generateMockStats() {
    const stats = {
      totalRequests: Math.floor(Math.random() * 50000) + 10000,
      requestsByFeature: {
        translate: Math.floor(Math.random() * 15000) + 5000,
        conversation: Math.floor(Math.random() * 12000) + 4000,
        listening: Math.floor(Math.random() * 8000) + 2000,
        writing: Math.floor(Math.random() * 6000) + 1500,
        reading: Math.floor(Math.random() * 7000) + 2000,
        flashcard: Math.floor(Math.random() * 10000) + 3000,
      },
      requestsByDay: [],
      activeUsers: Math.floor(Math.random() * 500) + 100,
      lastReset: new Date().toISOString(),
    };

    // Generate last 30 days data
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      stats.requestsByDay.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 2000) + 500,
      });
    }

    localStorage.setItem(AI_USAGE_KEY, JSON.stringify(stats));
    return stats;
  }

  // Reset statistics
  resetStats() {
    const stats = {
      totalRequests: 0,
      requestsByFeature: {
        translate: 0,
        conversation: 0,
        listening: 0,
        writing: 0,
        reading: 0,
        flashcard: 0,
      },
      requestsByDay: [],
      activeUsers: 0,
      lastReset: new Date().toISOString(),
    };
    localStorage.setItem(AI_USAGE_KEY, JSON.stringify(stats));
    return stats;
  }
}

export default new AISettingsService();

