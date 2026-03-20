import { useRef } from 'react';
import type { UserProgress, Page } from '../types';

// 计算连续学习天数
function calculateStreak(history: { date: string; newLearned: number; reviewed: number }[]): number {
  if (history.length === 0) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  
  let streak = 0;
  let checkDate = new Date();
  
  // 如果今天没学习，从昨天开始算
  const todayEntry = sorted.find(h => h.date === today);
  if (!todayEntry || (todayEntry.newLearned === 0 && todayEntry.reviewed === 0)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  for (const entry of sorted) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (entry.date === dateStr && (entry.newLearned > 0 || entry.reviewed > 0)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (entry.date < dateStr) {
      break;
    }
  }
  
  return streak;
}

interface HomeProps {
  progress: UserProgress;
  onNavigate: (page: Page) => void;
  onImportProgress: (progress: UserProgress) => void;
}

export function Home({ progress, onNavigate, onImportProgress }: HomeProps) {
  const { totalWords, learnedWords, wrongWords } = progress;
  const learnedCount = learnedWords.length;
  const wrongCount = wrongWords.filter(w => !w.mastered).length;
  const remainingCount = totalWords - learnedCount;
  const progressPercent = Math.round((learnedCount / totalWords) * 100);

  // 获取今日学习数量
  const today = new Date().toISOString().split('T')[0];
  const todayStats = progress.studyHistory.find(h => h.date === today);
  const todayLearned = todayStats?.newLearned || 0;

  // 获取最近7天学习记录
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = progress.studyHistory.find(h => h.date === dateStr);
      days.push({
        date: dateStr,
        dayName: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        learned: dayStats?.newLearned || 0,
        reviewed: dayStats?.reviewed || 0,
        isToday: i === 0
      });
    }
    return days;
  };

  const last7Days = getLast7Days();
  const totalLearned7Days = last7Days.reduce((sum, d) => sum + d.learned, 0);
  const streak = calculateStreak(progress.studyHistory);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导出进度
  const handleExport = () => {
    const json = JSON.stringify(progress, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `宝宝单词进度_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入进度
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as UserProgress;
        if (data.learnedWords && data.wrongWords) {
          onImportProgress(data);
          alert('进度导入成功！');
        } else {
          alert('文件格式不正确');
        }
      } catch {
        alert('导入失败，请检查文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* 标题 */}
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-800">宝宝单词</h1>
          <p className="text-gray-400 mt-2 text-sm tracking-wider">CET-6</p>
        </div>

        {/* 主入口按钮 */}
        <div className="space-y-4 mb-8">
          {/* 背新单词 */}
          <button
            onClick={() => onNavigate('study')}
            className="w-full bg-teal-400 hover:bg-teal-500 text-white rounded-2xl p-6 shadow-lg transition-all active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-xl font-bold">背新单词</div>
                <div className="text-teal-100 text-sm mt-1">
                  今日已学 {todayLearned} 个
                </div>
              </div>
              <div className="text-2xl opacity-60">→</div>
            </div>
          </button>

          {/* 错题本 */}
          <button
            onClick={() => onNavigate('wrong-book')}
            className="w-full bg-rose-400 hover:bg-rose-500 text-white rounded-2xl p-6 shadow-lg transition-all active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-xl font-bold">错题本</div>
                <div className="text-rose-100 text-sm mt-1">
                  待复习: {wrongCount} 个
                </div>
              </div>
              <div className="text-2xl opacity-60">→</div>
            </div>
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">学习统计</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{totalWords}</div>
              <div className="text-xs text-gray-500 mt-1">总单词</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{learnedCount}</div>
              <div className="text-xs text-gray-500 mt-1">已背诵</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{remainingCount}</div>
              <div className="text-xs text-gray-500 mt-1">待学习</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>学习进度</span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 错题统计 */}
          {wrongCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">错题本</span>
                <span className="text-orange-600 font-bold">{wrongCount} 个待复习</span>
              </div>
            </div>
          )}
        </div>

        {/* 每日学习记录 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">近7天学习</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">连续</span>
              <span className="text-xl font-bold text-teal-500">{streak}</span>
              <span className="text-sm text-gray-500">天</span>
            </div>
          </div>
          
          {/* 7天打卡网格 */}
          <div className="flex justify-between mb-4">
            {last7Days.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                    day.learned > 0 || day.reviewed > 0
                      ? 'bg-teal-400 text-white shadow-md'
                      : day.isToday
                      ? 'bg-teal-100 text-teal-600 border-2 border-teal-400'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {day.learned > 0 ? day.learned : day.dayName}
                </div>
                <span className={`text-xs mt-1 ${day.isToday ? 'text-teal-600 font-bold' : 'text-gray-400'}`}>
                  {day.isToday ? '今天' : day.dayName}
                </span>
              </div>
            ))}
          </div>
          
          {/* 本周统计 */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-500">{totalLearned7Days}</div>
              <div className="text-xs text-gray-500">本周新学</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-400">
                {last7Days.reduce((sum, d) => sum + d.reviewed, 0)}
              </div>
              <div className="text-xs text-gray-500">本周复习</div>
            </div>
          </div>
        </div>

        {/* 导出/导入进度 */}
        <div className="bg-white rounded-2xl shadow-md p-5 mt-4">
          <h2 className="text-sm font-bold text-gray-500 mb-3">进度备份</h2>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex-1 py-3 bg-teal-50 text-teal-600 font-bold rounded-xl text-sm active:scale-95 transition-all"
            >
              导出进度
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 bg-rose-50 text-rose-500 font-bold rounded-xl text-sm active:scale-95 transition-all"
            >
              导入进度
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">换设备时先导出，再在新设备上导入</p>
        </div>

      </div>
    </div>
  );
}
