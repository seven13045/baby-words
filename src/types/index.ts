// 单词数据结构
export interface Word {
  id: string;
  word: string;           // 英文单词
  phonetic: string;       // 音标
  meaning: string;        // 中文释义
  type: 'noun' | 'verb' | 'adj' | 'adv' | 'phrase' | 'other'; // 词性
  example?: string;       // 例句
  exampleTrans?: string;  // 例句翻译
  level: 'cet6';         // 词库级别
}

// 错题本单词项
export interface WrongWordItem {
  wordId: string;
  addedAt: number;        // 加入时间戳
  lastReviewedAt?: number; // 上次复习时间
  wrongCount: number;     // 累计错误次数
  reviewCount: number;    // 复习次数
  mastered: boolean;      // 是否已掌握
}

// 复习强度设置
export interface RetentionSettings {
  '1': number;      // 1天前: 0-1
  '2': number;      // 2天前
  '3': number;
  '4': number;
  '5': number;
  '6': number;
  '7': number;
  '8-14': number;   // 8-14天
  '14+': number;    // 14天以上
}

// 用户学习进度
export interface UserProgress {
  totalWords: number;
  learnedWords: string[];
  wrongWords: WrongWordItem[];
  retentionSettings: RetentionSettings;
  currentIndex: number;
  studyHistory: {
    date: string;
    newLearned: number;
    reviewed: number;
  }[];
}

// 14天统计项
export interface DayStat {
  label: string;
  count: number;
  dayOffset: number;
}

// 复习结果统计
export interface ReviewResult {
  mastered: number;
  retained: number;
  stillWrong: number;
  total: number;
}

// 应用状态
export type Page = 'home' | 'study' | 'wrong-book' | 'review';

export interface AppState {
  currentPage: Page;
  userProgress: UserProgress;
}
