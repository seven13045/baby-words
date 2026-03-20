import type { Word } from '../types';
import cet6Data from './cet6_vocabulary.json';

// CET-6 核心词汇（2165词，来自开源词库 mahavivo/english-wordlists）
export const cet6Words: Word[] = cet6Data.words.map(w => ({
  id: w.id,
  word: w.word,
  phonetic: w.phonetic,
  meaning: w.meaning,
  type: 'other' as const,
  level: 'cet6' as const
}));

// 导出更多单词数据...
export const getAllWords = (): Word[] => cet6Words;

// 根据ID获取单词
export const getWordById = (id: string): Word | undefined => {
  return cet6Words.find(w => w.id === id);
};

// 获取未学习的单词
export const getUnlearnedWords = (learnedIds: string[]): Word[] => {
  return cet6Words.filter(w => !learnedIds.includes(w.id));
};
