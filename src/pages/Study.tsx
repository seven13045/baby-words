import { useState, useEffect } from 'react';
import type { Word, UserProgress, Page, WrongWordItem } from '../types';
import { speakWord } from '../utils/review';
import { saveProgress } from '../utils/storage';

interface StudyProps {
  words: Word[];
  progress: UserProgress;
  onUpdateProgress: (progress: UserProgress) => void;
  onNavigate: (page: Page) => void;
}

export function Study({ words, progress, onUpdateProgress, onNavigate }: StudyProps) {
  // words 已经是 App.tsx 中固定打乱并过滤后的
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 获取当前单词
  const currentWord = words[currentIndex];
  const totalWords = words.length;
  const isLastWord = currentIndex >= totalWords - 1;

  // 自动发音
  useEffect(() => {
    if (currentWord && !showMeaning) {
      speakWord(currentWord.word);
    }
  }, [currentWord, showMeaning]);

  // 处理显示中文
  const handleShowMeaning = () => {
    if (!showMeaning) {
      setShowMeaning(true);
    }
  };

  // 处理返回
  const handleBack = () => {
    if (currentIndex > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setShowMeaning(false);

        setIsAnimating(false);
      }, 200);
    }
  };

  // 处理继续
  const handleContinue = () => {
    setIsAnimating(true);
    setTimeout(() => {
      // 标记为已学习
      if (!progress.learnedWords.includes(currentWord.id)) {
        const today = new Date().toISOString().split('T')[0];
        const existingEntry = progress.studyHistory.find(h => h.date === today);
        const newStudyHistory = existingEntry 
          ? progress.studyHistory.map(h => h.date === today ? { ...h, newLearned: h.newLearned + 1 } : h)
          : [...progress.studyHistory, { date: today, newLearned: 1, reviewed: 0 }];
        
        const newProgress = { 
          ...progress,
          learnedWords: [...progress.learnedWords, currentWord.id],
          currentIndex: Math.min(currentIndex + 1, totalWords - 1),
          studyHistory: newStudyHistory
        };
        
        onUpdateProgress(newProgress);
        saveProgress(newProgress);
      }

      if (!isLastWord) {
        setCurrentIndex(prev => prev + 1);
        setShowMeaning(false);

      }
      setIsAnimating(false);
    }, 200);
  };

  // 检查当前单词是否已在错题本
  const isAlreadyInWrongBook = progress.wrongWords.some(w => w.wordId === currentWord.id && !w.mastered);

  // 添加到错题本或从错题本移除
  const handleToggleWrong = () => {
    if (!currentWord) return;
    
    if (isAlreadyInWrongBook) {
      // 从错题本移除
      const newProgress = {
        ...progress,
        wrongWords: progress.wrongWords.filter(w => w.wordId !== currentWord.id)
      };
      onUpdateProgress(newProgress);
      saveProgress(newProgress);
    } else {
      // 添加到错题本
      const wrongItem: WrongWordItem = {
        wordId: currentWord.id,
        addedAt: Date.now(),
        wrongCount: 1,
        reviewCount: 0,
        mastered: false,
      };
      const newProgress = {
        ...progress,
        wrongWords: [...progress.wrongWords, wrongItem]
      };
      onUpdateProgress(newProgress);
      saveProgress(newProgress);
    }
  };

  // 处理发音
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentWord) {
      speakWord(currentWord.word);
    }
  };

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜完成!</h2>
          <p className="text-gray-500 mb-6">你已经学完了所有单词</p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium"
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            ← 返回
          </button>
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {totalWords}
          </div>
        </div>

        {/* 进度条 */}
        <div className="h-1 bg-gray-200 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
          />
        </div>

        {/* 单词卡片 */}
        <div
          onClick={handleShowMeaning}
          className={`bg-white rounded-3xl shadow-lg p-8 min-h-[320px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
            isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          } ${showMeaning ? 'border-2 border-blue-200' : ''}`}
        >
          {/* 单词 */}
          <h2 className="text-4xl font-bold text-gray-800 mb-3 text-center">
            {currentWord.word}
          </h2>

          {/* 音标 */}
          <div className="text-xl text-gray-500 mb-6 font-mono">
            {currentWord.phonetic}
          </div>

          {/* 发音按钮 */}
          <button
            onClick={handleSpeak}
            className="w-14 h-14 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center text-2xl mb-6 transition-colors"
          >
            🔊
          </button>

          {/* 中文释义 - 点击显示 */}
          {showMeaning ? (
            <div className="text-center animate-fadeIn">
              <div className="text-lg text-gray-700 mb-4 leading-relaxed">
                {currentWord.meaning}
              </div>
              {currentWord.example && (
                <div className="text-sm text-gray-500 italic border-t border-gray-100 pt-4 mt-4">
                  <p className="mb-1">{currentWord.example}</p>
                  <p className="text-gray-400">{currentWord.exampleTrans}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              点击显示中文释义
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between mt-8 gap-4">
          {/* 返回按钮 */}
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={`flex-1 py-4 rounded-2xl font-medium transition-all ${
              currentIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ← 返回
          </button>

          {/* 加入/移除错题本 */}
          <button
            onClick={handleToggleWrong}
            className={`px-6 py-4 rounded-2xl font-medium transition-all min-w-[80px] ${
              isAlreadyInWrongBook
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-rose-400 text-white hover:bg-rose-500 hover:scale-105'
            }`}
          >
            {isAlreadyInWrongBook ? '已加入' : '错题'}
          </button>

          {/* 继续按钮 */}
          <button
            onClick={handleContinue}
            className="flex-1 py-4 rounded-2xl font-medium transition-all bg-teal-400 text-white hover:bg-teal-500"
          >
            {isLastWord ? '完成' : '继续 →'}
          </button>
        </div>

        {/* 提示 */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          {showMeaning ? '点击"继续"学习下一个单词' : '点击卡片查看中文释义'}
        </div>
      </div>
    </div>
  );
}
