import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Tạo axios instance với config mặc định
const aiApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token vào mỗi request
aiApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============= READING AI =============

/**
 * Lấy bài đọc theo cấp độ
 * @param {string} level - Cấp độ: beginner, intermediate, advanced
 * @param {string} topic - Chủ đề (optional)
 * @returns {Promise} - Bài đọc với câu hỏi
 */
export const getReadingPassage = async (level, topic = null) => {
  try {
    const params = { level };
    if (topic) params.topic = topic;
    
    const response = await aiApiClient.get('/ai/reading/generate', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching reading passage:', error);
    // Fallback to mock data if API fails
    return getMockReadingData(level);
  }
};

/**
 * Nộp bài đọc và nhận feedback
 * @param {number} passageId - ID của bài đọc
 * @param {Object} answers - Các câu trả lời
 * @returns {Promise} - Kết quả và feedback
 */
export const submitReadingAnswers = async (passageId, answers) => {
  try {
    const response = await aiApiClient.post('/ai/reading/submit', {
      passage_id: passageId,
      answers,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting reading answers:', error);
    throw error;
  }
};

// ============= LISTENING AI =============

/**
 * Lấy bài nghe theo cấp độ
 * @param {string} level - Cấp độ: beginner, intermediate, advanced
 * @returns {Promise} - Bài nghe với câu hỏi
 */
export const getListeningLesson = async (level) => {
  try {
    const response = await aiApiClient.get('/ai/listening/generate', {
      params: { level },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching listening lesson:', error);
    return getMockListeningData(level);
  }
};

/**
 * Tổng hợp văn bản thành giọng nói
 * @param {string} text - Văn bản cần đọc
 * @param {string} voice - Giọng đọc (male/female)
 * @param {number} speed - Tốc độ (0.5 - 2.0)
 * @returns {Promise} - Audio URL
 */
export const textToSpeech = async (text, voice = 'female', speed = 1.0) => {
  try {
    const response = await aiApiClient.post('/ai/tts', {
      text,
      voice,
      speed,
    });
    return response.data.audio_url;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

/**
 * Nộp bài nghe và nhận feedback
 * @param {number} lessonId - ID của bài nghe
 * @param {Object} answers - Các câu trả lời
 * @returns {Promise} - Kết quả và feedback
 */
export const submitListeningAnswers = async (lessonId, answers) => {
  try {
    const response = await aiApiClient.post('/ai/listening/submit', {
      lesson_id: lessonId,
      answers,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting listening answers:', error);
    throw error;
  }
};

// ============= FLASHCARD AI =============

/**
 * Lấy flashcards theo cấp độ
 * @param {string} level - Cấp độ CEFR: A1, A2, B1, B2, C1, C2
 * @param {number} limit - Số lượng flashcards (mặc định 20)
 * @returns {Promise} - Danh sách flashcards
 */
export const getFlashcards = async (level, limit = 20) => {
  try {
    const response = await aiApiClient.get('/ai/flashcards', {
      params: { level, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return getMockFlashcardData(level);
  }
};

/**
 * Tạo flashcards từ văn bản
 * @param {string} text - Văn bản đầu vào
 * @param {number} count - Số lượng flashcards cần tạo
 * @returns {Promise} - Danh sách flashcards được tạo
 */
export const generateFlashcardsFromText = async (text, count = 10) => {
  try {
    const response = await aiApiClient.post('/ai/flashcards/generate', {
      text,
      count,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
};

/**
 * Lưu tiến độ học flashcard
 * @param {number} flashcardId - ID của flashcard
 * @param {boolean} known - Đã biết hay chưa
 * @returns {Promise}
 */
export const saveFlashcardProgress = async (flashcardId, known) => {
  try {
    const response = await aiApiClient.post('/ai/flashcards/progress', {
      flashcard_id: flashcardId,
      known,
    });
    return response.data;
  } catch (error) {
    console.error('Error saving flashcard progress:', error);
    throw error;
  }
};

// ============= WRITING AI =============

/**
 * Lấy đề bài viết
 * @param {string} level - Cấp độ
 * @param {string} type - Loại bài viết: essay, letter, story
 * @returns {Promise} - Đề bài viết
 */
export const getWritingPrompt = async (level, type = 'essay') => {
  try {
    const response = await aiApiClient.get('/ai/writing/prompt', {
      params: { level, type },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching writing prompt:', error);
    throw error;
  }
};

/**
 * Chấm bài viết và nhận feedback
 * @param {string} prompt - Đề bài
 * @param {string} content - Nội dung bài viết
 * @returns {Promise} - Điểm và feedback chi tiết
 */
export const submitWriting = async (prompt, content) => {
  try {
    const response = await aiApiClient.post('/ai/writing/evaluate', {
      prompt,
      content,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting writing:', error);
    throw error;
  }
};

// ============= CONVERSATION AI =============

/**
 * Gửi tin nhắn đến AI và nhận phản hồi
 * @param {string} message - Tin nhắn
 * @param {Array} history - Lịch sử hội thoại
 * @param {string} mode - Chế độ: casual, formal, practice
 * @returns {Promise} - Phản hồi từ AI
 */
export const sendConversationMessage = async (message, history = [], mode = 'casual') => {
  try {
    const response = await aiApiClient.post('/ai/conversation', {
      message,
      history,
      mode,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending conversation message:', error);
    throw error;
  }
};

// ============= TRANSLATE AI =============

/**
 * Dịch văn bản
 * @param {string} text - Văn bản cần dịch
 * @param {string} from - Ngôn ngữ nguồn (vi/en)
 * @param {string} to - Ngôn ngữ đích (vi/en)
 * @returns {Promise} - Văn bản đã dịch
 */
export const translateText = async (text, from = 'vi', to = 'en') => {
  try {
    const response = await aiApiClient.post('/ai/translate', {
      text,
      source_lang: from,
      target_lang: to,
    });
    return response.data;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
};

// ============= MOCK DATA (Fallback) =============

const getMockReadingData = (level) => {
  const passages = {
    beginner: {
      id: 1,
      title: "My Daily Routine",
      level: "Beginner",
      content: "I wake up at 7 o'clock every morning. I brush my teeth and wash my face. Then I have breakfast with my family. I usually eat bread and drink milk. After breakfast, I go to school. My school starts at 8 o'clock.",
      questions: [
        {
          question: "What time does the person wake up?",
          options: ["6 o'clock", "7 o'clock", "8 o'clock", "9 o'clock"],
          correct: 1,
        },
        {
          question: "What does the person eat for breakfast?",
          options: ["Rice", "Noodles", "Bread", "Soup"],
          correct: 2,
        },
      ],
    },
    intermediate: {
      id: 2,
      title: "The Benefits of Exercise",
      level: "Intermediate",
      content: "Regular exercise is essential for maintaining good health. It helps strengthen muscles, improve cardiovascular health, and boost mental well-being. Studies show that people who exercise regularly have lower rates of depression and anxiety. Additionally, exercise can help control weight and reduce the risk of chronic diseases.",
      questions: [
        {
          question: "What is the main idea of the passage?",
          options: [
            "Exercise is difficult",
            "Exercise has many health benefits",
            "Exercise is only for young people",
            "Exercise is expensive",
          ],
          correct: 1,
        },
      ],
    },
    advanced: {
      id: 3,
      title: "The Future of Artificial Intelligence in Education",
      level: "Advanced",
      content: "Artificial Intelligence (AI) is revolutionizing the education sector in unprecedented ways. From personalized learning experiences to automated grading systems, AI is transforming how students learn and teachers teach. One of the most significant impacts of AI in education is the ability to provide personalized learning paths. Traditional classroom settings often struggle to cater to individual student needs, but AI-powered systems can analyze a student's learning style, pace, and preferences to create customized educational content.",
      questions: [
        {
          question: "What is the main idea of the passage?",
          options: [
            "AI is replacing human teachers",
            "AI is transforming education through personalization",
            "Traditional education is better than AI",
            "AI can only grade tests",
          ],
          correct: 1,
        },
      ],
    },
  };

  return passages[level] || passages.beginner;
};

const getMockListeningData = (level) => {
  const lessons = {
    beginner: {
      id: 1,
      title: "Ordering Food at a Restaurant",
      level: "Beginner",
      duration: "2:30",
      audio_url: null,
      transcript: "Waiter: Good evening! What would you like to order?\nCustomer: I'd like a pizza and a salad, please.\nWaiter: What kind of drink would you like?\nCustomer: A glass of water, please.",
      questions: [
        {
          question: "What does the customer order?",
          options: ["Burger and fries", "Pizza and salad", "Pasta and soup", "Sandwich and juice"],
          correct: 1,
        },
      ],
    },
    intermediate: {
      id: 2,
      title: "Daily Conversation at a Coffee Shop",
      level: "Intermediate",
      duration: "3:45",
      audio_url: null,
      transcript: "Customer: Hi! I'd like a cappuccino and a croissant, please.\nBarista: Sure! Would you like that for here or to go?\nCustomer: For here, thank you.",
      questions: [
        {
          question: "What does the customer order?",
          options: [
            "A cappuccino and a croissant",
            "A latte and a muffin",
            "An espresso and a sandwich",
            "A tea and a cookie",
          ],
          correct: 0,
        },
      ],
    },
    advanced: {
      id: 3,
      title: "Business Meeting Discussion",
      level: "Advanced",
      duration: "5:00",
      audio_url: null,
      transcript: "Manager: Let's discuss our Q4 strategy. Sales have been declining.\nEmployee: I suggest we focus on digital marketing and customer retention.\nManager: Excellent idea. Let's allocate more budget to those areas.",
      questions: [
        {
          question: "What is the main topic of discussion?",
          options: [
            "Hiring new employees",
            "Q4 strategy and declining sales",
            "Office relocation",
            "Product development",
          ],
          correct: 1,
        },
      ],
    },
  };

  return lessons[level] || lessons.beginner;
};

const getMockFlashcardData = (level) => {
  const flashcards = {
    A1: [
      {
        id: 1,
        word: "Hello",
        pronunciation: "/həˈloʊ/",
        meaning: "Xin chào",
        example: "Hello, my name is John.",
        category: "Greetings",
        level: "A1",
      },
      {
        id: 2,
        word: "Thank you",
        pronunciation: "/θæŋk juː/",
        meaning: "Cảm ơn",
        example: "Thank you for your help.",
        category: "Greetings",
        level: "A1",
      },
      {
        id: 3,
        word: "Good",
        pronunciation: "/ɡʊd/",
        meaning: "Tốt",
        example: "This is a good book.",
        category: "Adjectives",
        level: "A1",
      },
    ],
    A2: [
      {
        id: 4,
        word: "Important",
        pronunciation: "/ɪmˈpɔːrtnt/",
        meaning: "Quan trọng",
        example: "Education is very important.",
        category: "Adjectives",
        level: "A2",
      },
      {
        id: 5,
        word: "Difficult",
        pronunciation: "/ˈdɪfɪkəlt/",
        meaning: "Khó khăn",
        example: "This exercise is difficult.",
        category: "Adjectives",
        level: "A2",
      },
      {
        id: 6,
        word: "Understand",
        pronunciation: "/ˌʌndərˈstænd/",
        meaning: "Hiểu",
        example: "I understand the lesson now.",
        category: "Verbs",
        level: "A2",
      },
    ],
    B1: [
      {
        id: 7,
        word: "Achieve",
        pronunciation: "/əˈtʃiːv/",
        meaning: "Đạt được",
        example: "She achieved her goal of getting into university.",
        category: "Achievement",
        level: "B1",
      },
      {
        id: 8,
        word: "Environment",
        pronunciation: "/ɪnˈvaɪrənmənt/",
        meaning: "Môi trường",
        example: "We must protect the environment.",
        category: "Nature",
        level: "B1",
      },
      {
        id: 9,
        word: "Technology",
        pronunciation: "/tekˈnɑːlədʒi/",
        meaning: "Công nghệ",
        example: "Technology is changing our lives.",
        category: "Technology",
        level: "B1",
      },
    ],
    B2: [
      {
        id: 10,
        word: "Artificial",
        pronunciation: "/ˌɑːrtɪˈfɪʃl/",
        meaning: "Nhân tạo",
        example: "Artificial intelligence is transforming education.",
        category: "Technology",
        level: "B2",
      },
      {
        id: 11,
        word: "Significant",
        pronunciation: "/sɪɡˈnɪfɪkənt/",
        meaning: "Quan trọng, đáng kể",
        example: "There has been a significant improvement.",
        category: "Academic",
        level: "B2",
      },
      {
        id: 12,
        word: "Demonstrate",
        pronunciation: "/ˈdemənstreɪt/",
        meaning: "Chứng minh, thể hiện",
        example: "The study demonstrates the benefits of exercise.",
        category: "Academic",
        level: "B2",
      },
    ],
    C1: [
      {
        id: 13,
        word: "Unprecedented",
        pronunciation: "/ʌnˈpresɪdentɪd/",
        meaning: "Chưa từng có",
        example: "The pandemic caused unprecedented challenges.",
        category: "Advanced",
        level: "C1",
      },
      {
        id: 14,
        word: "Advocate",
        pronunciation: "/ˈædvəkeɪt/",
        meaning: "Ủng hộ, biện hộ",
        example: "She advocates for environmental protection.",
        category: "Formal",
        level: "C1",
      },
      {
        id: 15,
        word: "Compelling",
        pronunciation: "/kəmˈpelɪŋ/",
        meaning: "Thuyết phục, hấp dẫn",
        example: "He presented a compelling argument.",
        category: "Academic",
        level: "C1",
      },
    ],
    C2: [
      {
        id: 16,
        word: "Ubiquitous",
        pronunciation: "/juːˈbɪkwɪtəs/",
        meaning: "Phổ biến khắp nơi",
        example: "Smartphones have become ubiquitous in modern society.",
        category: "Advanced",
        level: "C2",
      },
      {
        id: 17,
        word: "Paradigm",
        pronunciation: "/ˈpærədaɪm/",
        meaning: "Mô hình, khuôn mẫu",
        example: "This represents a paradigm shift in education.",
        category: "Academic",
        level: "C2",
      },
      {
        id: 18,
        word: "Nuanced",
        pronunciation: "/ˈnuːɑːnst/",
        meaning: "Tinh tế, có sắc thái",
        example: "The issue requires a nuanced understanding.",
        category: "Advanced",
        level: "C2",
      },
    ],
  };

  return flashcards[level] || flashcards.B1;
};

export default {
  getReadingPassage,
  submitReadingAnswers,
  getListeningLesson,
  textToSpeech,
  submitListeningAnswers,
  getFlashcards,
  generateFlashcardsFromText,
  saveFlashcardProgress,
  getWritingPrompt,
  submitWriting,
  sendConversationMessage,
  translateText,
};

