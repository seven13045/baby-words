import { useState, useEffect } from 'react';
import type { UserProgress, Page, WrongWordItem, ReviewResult } from '../types';
import { getWordById } from '../data/words';
import { speakWord, formatRelativeTime, createReviewResult } from '../utils/review';
import { saveProgress, updateStudyHistory } from '../utils/storage';

interface ReviewProps {
  reviewWords: WrongWordItem[];
  progress: UserProgress;
  onUpdateProgress: (progress: UserProgress) => void;
  onNavigate: (page: Page) => void;
}

export function Review({ reviewWords, progress, onUpdateProgress, onNavigate }: ReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [result, setResult] = useState<ReviewResult>(createReviewResult());
  const [isFinished, setIsFinished] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justRemoved, setJustRemoved] = useState(false);

  const currentWrongItem = reviewWords[currentIndex];
  const currentWord = currentWrongItem ? getWordById(currentWrongItem.wordId) : undefined;
  const totalCount = reviewWords.length;
  const isLastWord = currentIndex >= totalCount - 1;

  // 自动发音
  useEffect(() => {
    if (currentWord && !showMeaning) {
      speakWord(currentWord.word);
    }
  }, [currentWord, showMeaning]);

  // 显示中文
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
        setJustRemoved(false);
        setIsAnimating(false);
      }, 200);
    }
  };

  // 处理继续
  const handleContinue = () => {
    if (!currentWrongItem || !currentWord) return;

    setIsAnimating(true);

    // 更新结果统计（默认保留）
    setResult(prev => ({
      ...prev,
      retained: prev.retained + 1,
      total: prev.total + 1,
    }));

    // 更新单词状态（仅记录复习次数）
    const newProgress = { ...progress };
    const wordIndex = newProgress.wrongWords.findIndex(w => w.wordId === currentWrongItem.wordId);
    
    if (wordIndex !== -1) {
      const word = newProgress.wrongWords[wordIndex];
      word.lastReviewedAt = Date.now();
      word.reviewCount += 1;
    }

    setTimeout(() => {
      if (isLastWord) {
        const finalProgress = updateStudyHistory(newProgress, 0, result.total + 1);
        onUpdateProgress(finalProgress);
        saveProgress(finalProgress);
        setIsFinished(true);
      } else {
        onUpdateProgress(newProgress);
        setCurrentIndex(prev => prev + 1);
        setShowMeaning(false);
        setJustRemoved(false);
      }
      setIsAnimating(false);
    }, 200);
  };

  // 从错题本移除（掌握）
  const handleRemove = () => {
    if (!currentWrongItem || !currentWord) return;

    setIsAnimating(true);

    const wordIndex = progress.wrongWords.findIndex(w => w.wordId === currentWrongItem.wordId);
    
    if (wordIndex !== -1) {
      const newProgress = {
        ...progress,
        wrongWords: progress.wrongWords.map((w, i) => 
          i === wordIndex 
            ? { ...w, mastered: true, lastReviewedAt: Date.now(), reviewCount: w.reviewCount + 1 }
            : w
        )
      };
      
      // 更新统计
      setResult(prev => ({
        ...prev,
        mastered: prev.mastered + 1,
        total: prev.total + 1,
      }));
      
      setTimeout(() => {
        onUpdateProgress(newProgress);
        saveProgress(newProgress);
        
        if (isLastWord) {
          const finalProgress = updateStudyHistory(newProgress, 0, result.total + 1);
          onUpdateProgress(finalProgress);
          saveProgress(finalProgress);
          setIsFinished(true);
        } else {
          setCurrentIndex(prev => prev + 1);
          setShowMeaning(false);
          setJustRemoved(false);
        }
        setIsAnimating(false);
      }, 200);
    }
  };

  // 处理发音
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentWord) {
      speakWord(currentWord.word);
    }
  };

  // 完成页面
  if (isFinished) {
    const remainingCount = progress.wrongWords.filter(w => !w.mastered).length;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">今日复习完成!</h2>
          <p className="text-gray-500 mb-6">继续保持，积少成多</p>

          {/* 统计 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">{result.mastered}</div>
              <div className="text-xs text-gray-500 mt-1">已掌握</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">{result.retained}</div>
              <div className="text-xs text-gray-500 mt-1">继续保留</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-orange-600">{result.stillWrong}</div>
              <div className="text-xs text-gray-500 mt-1">仍不会</div>
            </div>
          </div>

          <div className="text-gray-600 mb-6">
            错题本剩余: <span className="font-bold text-orange-600">{remainingCount}</span> 个单词
          </div>

          <button
            onClick={() => onNavigate('wrong-book')}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-colors"
          >
            返回错题本
          </button>
        </div>
      </div>
    );
  }

  if (!currentWord || !currentWrongItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">没有需要复习的单词</h2>
          <button
            onClick={() => onNavigate('wrong-book')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium"
          >
            返回错题本
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
            onClick={() => onNavigate('wrong-book')}
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            ← 退出
          </button>
          <div className="text-lg font-bold text-gray-800">错题复习</div>
          <div className="text-sm text-gray-500">
            [{currentIndex + 1}/{totalCount}]
          </div>
        </div>

        {/* 单词信息 */}
        <div className="bg-orange-50 rounded-xl p-4 mb-4">
          <div className="text-sm text-gray-600">
            加入时间: {formatRelativeTime(currentWrongItem.addedAt)}
          </div>
        </div>

        {/* 单词卡片 */}
        <div
          onClick={handleShowMeaning}
          className={`bg-white rounded-3xl shadow-lg p-8 min-h-[320px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
            isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          } ${showMeaning ? 'border-2 border-orange-200' : ''}`}
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
            className="w-14 h-14 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center text-2xl mb-6 transition-colors"
          >
            🔊
          </button>

          {/* 中文释义 */}
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

          {/* 移除错题本 */}
          <button
            onClick={handleRemove}
            disabled={justRemoved}
            className={`px-4 py-4 rounded-2xl font-medium transition-all ${
              justRemoved
                ? 'bg-green-500 text-white scale-110'
                : 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-105'
            }`}
          >
            {justRemoved ? '✓' : '✕'}
          </button>

          {/* 继续按钮 */}
          <button
            onClick={handleContinue}
            className="flex-1 py-4 rounded-2xl font-medium transition-all bg-blue-500 text-white hover:bg-blue-600"
          >
            {isLastWord ? '完成' : '继续 →'}
          </button>
        </div>

        {/* 提示 */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          {showMeaning ? '点击"继续"复习下一个单词' : '点击卡片查看中文释义'}
        </div>
      </div>
    </div>
  );
}
