import type { WrongWordItem, RetentionSettings, DayStat, ReviewResult } from '../types';

// 计算14天统计
export function get14DayStats(wrongWords: WrongWordItem[]): DayStat[] {
  const stats: DayStat[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 今天
  const todayCount = wrongWords.filter(w => {
    const d = new Date(w.addedAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && !w.mastered;
  }).length;
  stats.push({ label: '今天', count: todayCount, dayOffset: 0 });
  
  // 1-13天
  for (let i = 1; i <= 13; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - i);
    const count = wrongWords.filter(w => {
      const d = new Date(w.addedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === targetDate.getTime() && !w.mastered;
    }).length;
    stats.push({ 
      label: i === 1 ? '1天前' : `${i}天前`, 
      count, 
      dayOffset: i 
    });
  }
  
  // 14天+
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const oldCount = wrongWords.filter(w => {
    return w.addedAt < fourteenDaysAgo.getTime() && !w.mastered;
  }).length;
  stats.push({ label: '14天+', count: oldCount, dayOffset: 14 });
  
  return stats;
}

// 获取天数对应的设置key
function getRateKey(daysDiff: number): string {
  if (daysDiff === 0) return '0';
  if (daysDiff === 1) return '1';
  if (daysDiff === 2) return '2';
  if (daysDiff === 3) return '3';
  if (daysDiff === 4) return '4';
  if (daysDiff === 5) return '5';
  if (daysDiff === 6) return '6';
  if (daysDiff === 7) return '7';
  if (daysDiff <= 14) return '8-14';
  return '14+';
}

// 计算今日待复习单词 - 严格按照比例数量选取
export function calculateTodayReview(
  wrongWords: WrongWordItem[],
  retentionSettings: RetentionSettings
): WrongWordItem[] {
  const today = new Date();
  const reviewWords: WrongWordItem[] = [];
  
  // 按天数分组
  const groupedByDay: Record<string, WrongWordItem[]> = {};
  
  for (const item of wrongWords) {
    if (item.mastered) continue; // 跳过已掌握的
    
    const daysDiff = Math.floor(
      (today.getTime() - item.addedAt) / (1000 * 60 * 60 * 24)
    );
    
    // 0天（今天加入）的也参与复习，可以在设置中调整比例
    
    const rateKey = getRateKey(daysDiff);
    if (!groupedByDay[rateKey]) {
      groupedByDay[rateKey] = [];
    }
    groupedByDay[rateKey].push(item);
  }
  
  // 每天按固定数量选取（假设每天4个新错题）
  const dailyNewWords = 4;
  
  for (const [rateKey, items] of Object.entries(groupedByDay)) {
    const rate = retentionSettings[rateKey as keyof RetentionSettings] || 0.3;
    // 计算该天数应复习的数量
    const targetCount = Math.round(dailyNewWords * rate);
    
    // 随机打乱该组的单词
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    
    // 选取指定数量
    const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));
    reviewWords.push(...selected);
  }
  
  return reviewWords;
}

// 格式化相对时间
export function formatRelativeTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `今天 ${hours}:${minutes}`;
  } else if (diffDays === 1) {
    return '1天前';
  } else if (diffDays <= 6) {
    return `${diffDays}天前`;
  } else if (diffDays <= 13) {
    return '1周前';
  } else {
    return '14天+';
  }
}

// 发音功能
export function speakWord(word: string): void {
  if ('speechSynthesis' in window) {
    // 取消之前的语音
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

// 创建新的复习结果
export function createReviewResult(): ReviewResult {
  return {
    mastered: 0,
    retained: 0,
    stillWrong: 0,
    total: 0,
  };
}
