import type { UserProgress, RetentionSettings } from '../types';

const STORAGE_KEY = 'cet6-vocabulary-progress';

// 默认复习强度设置
export const defaultRetentionSettings: RetentionSettings = {
  '1': 1.00,    // 1天前: 100%
  '2': 0.80,    // 2天前: 80%
  '3': 0.70,    // 3天前: 70%
  '4': 0.60,    // 4天前: 60%
  '5': 0.55,    // 5天前: 55%
  '6': 0.50,    // 6天前: 50%
  '7': 0.45,    // 7天前: 45%
  '8-14': 0.40, // 8-14天: 40%
  '14+': 0.30,  // 14天+: 30%
};

// 获取初始用户进度
export function getInitialProgress(totalWords: number): UserProgress {
  return {
    totalWords,
    learnedWords: [],
    wrongWords: [],
    retentionSettings: { ...defaultRetentionSettings },
    currentIndex: 0,
    studyHistory: [],
  };
}

// 从localStorage加载用户进度
export function loadProgress(totalWords: number): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserProgress;
      // 确保有默认设置
      if (!parsed.retentionSettings) {
        parsed.retentionSettings = { ...defaultRetentionSettings };
      }
      // 词库更新时同步最新总词数
      parsed.totalWords = totalWords;
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
  return getInitialProgress(totalWords);
}

// 保存用户进度到localStorage
export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

// 更新学习历史
export function updateStudyHistory(
  progress: UserProgress,
  newLearned: number = 0,
  reviewed: number = 0
): UserProgress {
  const today = new Date().toISOString().split('T')[0];
  const existingEntry = progress.studyHistory.find(h => h.date === today);
  
  if (existingEntry) {
    existingEntry.newLearned += newLearned;
    existingEntry.reviewed += reviewed;
  } else {
    progress.studyHistory.push({
      date: today,
      newLearned,
      reviewed,
    });
  }
  
  return progress;
}

// 生成测试数据 - 每天5个错题，共15天（今天+14天前）
export function generateTestData(totalWords: number): UserProgress {
  const progress = getInitialProgress(totalWords);
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  // 生成今天到14天前的数据，每天5个
  for (let day = 0; day <= 14; day++) {
    const dayTimestamp = now - day * oneDay;
    // 每天5个单词，ID从 1+day*5 到 5+day*5
    for (let i = 1; i <= 5; i++) {
      const wordId = String(day * 5 + i);
      progress.wrongWords.push({
        wordId,
        addedAt: dayTimestamp - Math.random() * oneDay * 0.5, // 当天随机时间
        wrongCount: Math.floor(Math.random() * 3) + 1, // 1-3次错误
        reviewCount: Math.floor(Math.random() * 2), // 0-1次复习
        mastered: false,
      });
    }
  }
  
  // 标记一些已掌握的（约20%）
  progress.wrongWords.forEach((w, index) => {
    if (index % 5 === 0) {
      w.mastered = true;
    }
  });
  
  saveProgress(progress);
  return progress;
}
