import { useState, useMemo } from 'react';
import type { UserProgress, Page, WrongWordItem } from './types';
import { Home } from './pages/Home';
import { Study } from './pages/Study';
import { WrongBook } from './pages/WrongBook';
import { Review } from './pages/Review';
import { cet6Words } from './data/words';
import { loadProgress, generateTestData, saveProgress } from './utils/storage';
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

  // 获取未学习的单词
  const unlearnedWords = useMemo(() => {
    return cet6Words.filter(w => !progress.learnedWords.includes(w.id));
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
          />
        );
      
      case 'study':
        return (
          <Study
            words={unlearnedWords.length > 0 ? unlearnedWords : cet6Words}
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
        return <Home progress={progress} onNavigate={handleNavigate} onImportProgress={handleImportProgress} onClearWrongWords={handleClearWrongWords} />;
    }
  };

  return (
    <div className="font-sans">
      {renderPage()}
    </div>
  );
}

export default App;
