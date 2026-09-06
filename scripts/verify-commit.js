#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const msgPath = process.argv[2];
if (!msgPath) {
  console.error('\x1b[31m[Commit Lint Error] 未能获取 commit 信息路径。\x1b[0m');
  process.exit(1);
}

const rawMessage = fs.readFileSync(path.resolve(msgPath), 'utf-8');

// 过滤掉 Git 自动生成的注释行 (# 开头的行)
const cleanLines = rawMessage
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

const fullText = cleanLines.join('\n');
const nonWhitespaceCount = fullText.replace(/\s+/g, '').length;

// 1. 提取 Header (第一行)
const header = cleanLines[0] || '';
const headerRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_\u4e00-\u9fa5\-\.]+\))?:\s*.+/;

// 2. 检查三点论关键词
const hasProblem = /(?:^|\n)\s*问题[：:]\s*\S+/.test(fullText);
const hasSolution = /(?:^|\n)\s*解决措施[：:]\s*\S+/.test(fullText);
const hasEffect = /(?:^|\n)\s*效果[：:]\s*\S+/.test(fullText);

const errors = [];

if (!headerRegex.test(header)) {
  errors.push('【Header 格式不规范】须符合 Conventional Commits 规范，例如: feat(选课): 实现并发抢课原子更新机制');
}

if (!hasProblem) {
  errors.push('【缺失“问题”说明】Body 必须包含以“问题：”或“问题:”开头并阐述具体原因的段落');
}

if (!hasSolution) {
  errors.push('【缺失“解决措施”说明】Body 必须包含以“解决措施：”或“解决措施:”开头并阐述修改方法的段落');
}

if (!hasEffect) {
  errors.push('【缺失“效果”说明】Body 必须包含以“效果：”或“效果:”开头并说明预期结果/量化数据的段落');
}

if (nonWhitespaceCount < 40) {
  errors.push(`【字数不足门禁】提交内容去空格后当前仅 ${nonWhitespaceCount} 字，要求不少于 40 字`);
}

if (errors.length > 0) {
  console.error('\n' + '='.repeat(70));
  console.error('\x1b[31;1m[FAIL] Git Commit 门禁校验未通过，已阻止本次提交：\x1b[0m');
  errors.forEach((err, idx) => {
    console.error(`  \x1b[33m${idx + 1}. ${err}\x1b[0m`);
  });

  console.error('\n' + '-'.repeat(70));
  console.error('\x1b[36;1m[GUIDE] 标准三点论提交模板（供参考，直接复制修改）：\x1b[0m');
  console.error('\x1b[32m');
  console.error('feat(选课系统): 完善选课并发事务与剩余容量原子递减逻辑');
  console.error('');
  console.error('问题：在多名学生同时抢选最后一门课时，容易出现超卖导致剩余名额为负数的并发冲突。');
  console.error('解决措施：在 SQLite 事务中采用 UPDATE ... WHERE capacity < max 原子扣减并结合行数校验。');
  console.error('效果：通过高并发压测保证 0 超卖现象，选课接口事务吞吐量提升 25%，数据一致性达到 100%。');
  console.error('\x1b[0m');
  console.error('='.repeat(70) + '\n');
  process.exit(1);
}

console.log('\x1b[32;1m[PASS] Git 提交规范校验通过（中文 Conventional + 三点论 + 40字门禁已达标）\x1b[0m');
process.exit(0);
