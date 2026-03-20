import { useState, useMemo } from 'react';
import type { UserProgress, Page, WrongWordItem } from './types';
import { Home } from './pages/Home';
import { Study } from './pages/Study';
import { WrongBook } from './pages/WrongBook';
import { Review } from './pages/Review';
import { cet6Words } from './data/words';
import { loadProgress, generateTestData, saveProgress, getInitialProgress } from './utils/storage';
import './index.css';

// 设置为 true 生成测试数据，测试完成后改回 false
const GENERATE_TEST_DATA = false;

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [progress, setProgress] = useState<UserProgress>(() => {
    if (GENERATE_TEST_DATA) {
      return generateTestData(cet6Words.length);
    }
    return loadProgress(cet6Words.length);
  });
  const [reviewWords, setReviewWords] = useState<WrongWordItem[]>([]);

  // 固定种子打乱全部单词，然后过滤已学的
  const studyWords = useMemo(() => {
    // 先固定打乱全部单词
    const shuffled = [...cet6Words];
    let seed = 12345;
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) % 2147483647;
      const j = seed % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // 再过滤已学的，保持打乱顺序
    return shuffled.filter(w => !progress.learnedWords.includes(w.id));
  }, [progress.learnedWords]);

  // 更新进度
  const handleUpdateProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
  };

  // 导航
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  // 开始复习
  const handleStartReview = (words: WrongWordItem[]) => {
    setReviewWords(words);
  };

  // 导入进度
  const handleImportProgress = (imported: UserProgress) => {
    // 同步最新词库总数
    imported.totalWords = cet6Words.length;
    saveProgress(imported);
    setProgress(imported);
  };

  // 清空错题本
  const handleClearWrongWords = () => {
    const newProgress = { ...progress, wrongWords: [] };
    saveProgress(newProgress);
    setProgress(newProgress);
  };

  // 重头开始 - 清空所有进度
  const handleResetProgress = () => {
    const initialProgress = getInitialProgress(cet6Words.length);
    saveProgress(initialProgress);
    setProgress(initialProgress);
  };

  // 页面内容渲染
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home
            progress={progress}
            onNavigate={handleNavigate}
            onImportProgress={handleImportProgress}
            onClearWrongWords={handleClearWrongWords}
            onResetProgress={handleResetProgress}
          />
        );
      
      case 'study':
        // 调试：确认未学单词数量
        console.log('未学单词数:', studyWords.length, '已学:', progress.learnedWords.length);
        return (
          <Study
            words={studyWords.length > 0 ? studyWords : cet6Words}
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onNavigate={handleNavigate}
          />
        );
      
      case 'wrong-book':
        return (
          <WrongBook
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onNavigate={handleNavigate}
            onStartReview={handleStartReview}
          />
        );
      
      case 'review':
        return (
          <Review
            reviewWords={reviewWords}
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onNavigate={handleNavigate}
          />
        );
      
      default:
        return <Home progress={progress} onNavigate={handleNavigate} onImportProgress={handleImportProgress} onClearWrongWords={handleClearWrongWords} onResetProgress={handleResetProgress} />;
    }
  };

  return (
    <div className="font-sans">
      {renderPage()}
    </div>
  );
}

export default App;
