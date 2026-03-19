import type { UserProgress, Page } from '../types';

interface HomeProps {
  progress: UserProgress;
  onNavigate: (page: Page) => void;
}

export function Home({ progress, onNavigate }: HomeProps) {
  const { totalWords, learnedWords, wrongWords } = progress;
  const learnedCount = learnedWords.length;
  const wrongCount = wrongWords.filter(w => !w.mastered).length;
  const remainingCount = totalWords - learnedCount;
  const progressPercent = Math.round((learnedCount / totalWords) * 100);

  // 获取今日学习数量
  const today = new Date().toISOString().split('T')[0];
  const todayStats = progress.studyHistory.find(h => h.date === today);
  const todayLearned = todayStats?.newLearned || 0;

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


      </div>
    </div>
  );
}
