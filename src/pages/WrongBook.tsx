import { useState, useMemo } from 'react';
import type { UserProgress, Page, Word, RetentionSettings, WrongWordItem } from '../types';
import { getWordById } from '../data/words';
import { get14DayStats, calculateTodayReview, formatRelativeTime } from '../utils/review';
import { saveProgress, defaultRetentionSettings } from '../utils/storage';

interface WrongBookProps {
  progress: UserProgress;
  onUpdateProgress: (progress: UserProgress) => void;
  onNavigate: (page: Page) => void;
  onStartReview: (words: WrongWordItem[]) => void;
}

export function WrongBook({ progress, onUpdateProgress, onNavigate, onStartReview }: WrongBookProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<RetentionSettings>(progress.retentionSettings);

  // 获取未掌握的错题
  const activeWrongWords = useMemo(() => 
    progress.wrongWords.filter(w => !w.mastered),
    [progress.wrongWords]
  );

  // 14天统计
  const dayStats = useMemo(() => 
    get14DayStats(progress.wrongWords),
    [progress.wrongWords]
  );

  // 今日待复习
  const todayReviewWords = useMemo(() => 
    calculateTodayReview(progress.wrongWords, progress.retentionSettings),
    [progress.wrongWords, progress.retentionSettings]
  );

  // 按时间倒序排列的错题
  const sortedWrongWords = useMemo(() => 
    [...activeWrongWords].sort((a, b) => b.addedAt - a.addedAt),
    [activeWrongWords]
  );

  // 获取单词详情
  const getWordInfo = (wordId: string): Word | undefined => {
    return getWordById(wordId);
  };

  // 从错题本删除（彻底移除）
  const handleRemove = (wordId: string) => {
    const newProgress = { 
      ...progress,
      wrongWords: progress.wrongWords.filter(w => w.wordId !== wordId)
    };
    onUpdateProgress(newProgress);
    saveProgress(newProgress);
  };

  // 保存设置
  const handleSaveSettings = () => {
    const newProgress = { ...progress, retentionSettings: tempSettings };
    onUpdateProgress(newProgress);
    saveProgress(newProgress);
    setShowSettings(false);
  };

  // 恢复默认设置
  const handleResetSettings = () => {
    setTempSettings({ ...defaultRetentionSettings });
  };

  // 开始复习
  const handleStartReview = () => {
    if (todayReviewWords.length === 0) {
      alert('今天没有需要复习的单词');
      return;
    }
    onStartReview(todayReviewWords);
    onNavigate('review');
  };

  // 设置项渲染
  const renderSettingSlider = (key: string, label: string) => {
    const value = tempSettings[key as keyof RetentionSettings] * 100;
    return (
      <div key={key} className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium text-blue-600">{Math.round(value)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => {
            const newValue = parseInt(e.target.value) / 100;
            setTempSettings(prev => ({ ...prev, [key]: newValue }));
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 返回
          </button>
          <h1 className="text-lg font-bold text-gray-800">错题本</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-gray-600 text-sm border border-gray-300 rounded-lg px-3 py-1"
          >
            设置
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* 复习强度设置面板 */}
        {showSettings && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">复习强度设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">调整各时间段错题的复习概率</p>
            
            {renderSettingSlider('0', '今天加入')}
            {renderSettingSlider('1', '1天前')}
            {renderSettingSlider('2', '2天前')}
            {renderSettingSlider('3', '3天前')}
            {renderSettingSlider('4', '4天前')}
            {renderSettingSlider('5', '5天前')}
            {renderSettingSlider('6', '6天前')}
            {renderSettingSlider('7', '7天前')}
            {renderSettingSlider('8-14', '8-14天')}
            {renderSettingSlider('14+', '14天+')}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleResetSettings}
                className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50"
              >
                恢复默认
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
              >
                保存设置
              </button>
            </div>
          </div>
        )}

        {/* 14天统计 */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
          <h2 className="text-base font-bold text-gray-800 mb-3">近14天错题统计</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {dayStats.slice(0, 7).map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-[10px] font-medium text-gray-600 mb-0.5">{stat.count}</div>
                <div
                  className="w-full rounded-sm transition-all"
                  style={{ 
                    height: `${Math.max(stat.count > 0 ? 16 : 3, Math.min(60, stat.count * 10))}px`,
                    minHeight: '3px',
                    background: stat.dayOffset === 0 
                      ? 'linear-gradient(180deg, #2dd4bf 0%, #14b8a6 100%)' 
                      : stat.dayOffset <= 3 
                      ? 'linear-gradient(180deg, #fb7185 0%, #e11d48 100%)' 
                      : 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)'
                  }}
                />
                <span className="text-[9px] text-gray-400 mt-0.5 text-center">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 mt-2">
            {dayStats.slice(7, 14).map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-[10px] font-medium text-gray-600 mb-0.5">{stat.count}</div>
                <div
                  className="w-full rounded-sm transition-all"
                  style={{ 
                    height: `${Math.max(stat.count > 0 ? 16 : 3, Math.min(60, stat.count * 10))}px`,
                    minHeight: '3px',
                    background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)'
                  }}
                />
                <span className="text-[9px] text-gray-400 mt-0.5 text-center">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 mt-2">
            <div className="flex flex-col items-center col-start-1">
              <div className="text-[10px] font-medium text-gray-600 mb-0.5">{dayStats[14]?.count || 0}</div>
              <div
                className="w-full rounded-sm transition-all"
                style={{ 
                  height: `${Math.max(dayStats[14]?.count > 0 ? 16 : 3, Math.min(60, (dayStats[14]?.count || 0) * 10))}px`,
                  minHeight: '3px',
                  background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)'
                }}
              />
              <span className="text-[9px] text-gray-400 mt-0.5 text-center">14天+</span>
            </div>
          </div>
        </div>

        {/* 错题列表 */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">错题列表</h2>
            <span className="text-sm text-gray-500">共 {activeWrongWords.length} 个</span>
          </div>

          {sortedWrongWords.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🎉</div>
              <p>错题本为空，继续保持！</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {sortedWrongWords.map((item) => {
                const wordInfo = getWordInfo(item.wordId);
                if (!wordInfo) return null;
                
                return (
                  <div
                    key={item.wordId}
                    className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{wordInfo.word}</span>
                          <span className="text-sm text-gray-500 font-mono">{wordInfo.phonetic}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{wordInfo.meaning}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>◷ {formatRelativeTime(item.addedAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(item.wordId)}
                        className="text-gray-400 hover:text-red-500 p-2 text-lg"
                        title="移出错题本"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 开始复习按钮 */}
        <button
          onClick={handleStartReview}
          disabled={todayReviewWords.length === 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
            todayReviewWords.length > 0
              ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-white hover:shadow-xl active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div>开始复习</div>
          <div className="text-sm font-normal opacity-90 mt-1">
            今日待复习: {todayReviewWords.length} 个
          </div>
        </button>
      </div>
    </div>
  );
}
