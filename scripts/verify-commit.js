#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

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

// 1. 提取 Header 并校验 Scope 范围
const header = cleanLines[0] || '';
const headerMatch = header.match(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\(([^)]+)\))?:\s*(.+)/);

const ALLOWED_SCOPES = [
  '基建',
  '规范',
  '文档',
  'schema',
  'db',
  'server',
  'api',
  'web',
  'ui',
  'desktop',
  'ci',
  'deps',
  '选课',
  '排课',
  '成绩',
  '动效'
];

const errors = [];

if (!headerMatch) {
  errors.push('【Header 格式不规范】须符合 Conventional Commits 格式，例如: feat(选课): 实现并发抢课原子更新机制');
} else {
  const scope = headerMatch[2];
  if (!scope) {
    errors.push('【缺失改动 Scope】根据原子化提交原则，必须在括号内注明所属模块，例如: feat(server): ...');
  } else if (!ALLOWED_SCOPES.includes(scope)) {
    errors.push(`【Scope 超出允许范围】"${scope}" 不属于合法模块。允许的 Scope 列表:\n     -> ${ALLOWED_SCOPES.join(', ')}`);
  }
}

// 2. 检查暂存区改动，防止混乱跨包大提交（原子化提交门禁）
try {
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (stagedFiles.length > 0 && headerMatch && headerMatch[2]) {
    const scope = headerMatch[2];
    const touchedPackages = new Set();
    stagedFiles.forEach((file) => {
      if (file.startsWith('packages/schema/')) touchedPackages.add('packages/schema');
      else if (file.startsWith('packages/db/')) touchedPackages.add('packages/db');
      else if (file.startsWith('apps/server/')) touchedPackages.add('apps/server');
      else if (file.startsWith('apps/web/')) touchedPackages.add('apps/web');
      else if (file.startsWith('apps/desktop/')) touchedPackages.add('apps/desktop');
      else if (file.startsWith('.github/')) touchedPackages.add('.github');
      else if (file.startsWith('docs/')) touchedPackages.add('docs');
    });

    // 若同时跨越了两个或更多独立的应用/包模块（非基建/deps/文档），拦截并要求分步原子提交
    if (touchedPackages.size > 1 && !['基建', 'deps', 'ci', '规范', '文档'].includes(scope)) {
      errors.push(`【非原子化提交拦截】检测到您本次暂存了跨多个核心包的文件：[${Array.from(touchedPackages).join(', ')}]。\n     请按照原子化提交原则分别执行 git add <目录> 并分步提交，避免大杂烩提交。`);
    }
  }
} catch {
  // 非 git 环境或空暂存区时放行文件检测
}

// 3. 检查三点论关键词
const hasProblem = /(?:^|\n)\s*问题[：:]\s*\S+/.test(fullText);
const hasSolution = /(?:^|\n)\s*解决措施[：:]\s*\S+/.test(fullText);
const hasEffect = /(?:^|\n)\s*效果[：:]\s*\S+/.test(fullText);

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
  console.error('\x1b[36;1m[GUIDE] 标准原子化三点论提交模板（供参考）：\x1b[0m');
  console.error('\x1b[32m');
  console.error('feat(选课): 完善选课并发事务与剩余容量原子递减逻辑');
  console.error('');
  console.error('问题：在多名学生同时抢选最后一门课时，容易出现超卖导致剩余名额为负数的并发冲突。');
  console.error('解决措施：在 SQLite 事务中采用 UPDATE ... WHERE capacity < max 原子扣减并结合行数校验。');
  console.error('效果：通过高并发压测保证 0 超卖现象，选课接口事务吞吐量提升 25%，数据一致性达到 100%。');
  console.error('\x1b[0m');
  console.error('='.repeat(70) + '\n');
  process.exit(1);
}

console.log('\x1b[32;1m[PASS] Git 提交规范校验通过（原子化 Scope + 中文三点论 + 40字门禁已达标）\x1b[0m');
process.exit(0);
