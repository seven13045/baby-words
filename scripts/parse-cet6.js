import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取原始文件
const rawContent = fs.readFileSync(
  path.join(__dirname, '..', 'cet6_raw.txt'),
  'utf-8'
);

const lines = rawContent.split('\n');
const words = [];
let id = 1;

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  
  // 匹配格式: word [phonetic] meaning
  // 例如: abandon [əˈbændən] v. 1. 抛弃，放弃...
  const match = trimmed.match(/^([a-zA-Z\-]+)\s*\[([^\]]+)\]\s*(.+)$/);
  
  if (match) {
    const [, word, phonetic, meaning] = match;
    words.push({
      id: String(id++),
      word: word.trim(),
      phonetic: '/' + phonetic.trim() + '/',
      meaning: meaning.trim().substring(0, 200) // 限制长度
    });
  }
}

console.log(`成功解析 ${words.length} 个单词`);

// 生成 JSON 文件
const output = {
  name: 'CET-6 核心词汇',
  description: '大学英语六级考试核心词汇',
  total: words.length,
  words: words
};

fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'data', 'cet6_vocabulary.json'),
  JSON.stringify(output, null, 2),
  'utf-8'
);

console.log('词库文件已生成: src/data/cet6_vocabulary.json');
