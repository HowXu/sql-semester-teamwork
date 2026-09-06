# 贡献指南 (Contributing Guide)

欢迎参与教务选课系统的开发与建设。为了保证项目代码库的高质量、架构整洁性以及评审效率，所有团队成员在贡献代码时必须严格遵守本指南。

---

## 1. 核心规约概览

- **架构规约**：前端严格践行 **MVVM + Feature-Sliced Design (FSD) + Atomic Design**，彻底解耦 UI 渲染与数据状态。
- **图标与视觉规约**：**全局严禁使用 Emoji 符号**。界面统一使用 `lucide-react` 矢量图标；控制台与日志使用标准文本标签 `[PASS] / [FAIL] / [WARN] / [INFO] / [GUIDE]`。
- **类型严谨度**：顶格严格开启 TypeScript 校验，**零 `any` 容忍**。所有动态输入必须使用 Zod Schema 校验收窄。
- **提交流水线**：本地通过 **Lefthook** 执行 Gitleaks 密钥扫描、严格 Lint、TypeScript 检查以及**中文三点论 Commit 门禁**。
- **协同发版**：采用 **GitHub Stacked PR (`gh stack`)** 模式拆分小步迭代，方便分段 Review。

---

## 2. 代码提交规范（中文三点论）

### 2.1 格式要求
每次 Git 提交的 Header 必须符合 Conventional Commits 格式，正文必须包含结构化三点论，全文字数（去空格）**不少于 40 字**：

```text
<type>(<scope>): <简要总结>

问题：<详细说明本次改动所针对的业务缺陷、功能诉求或性能瓶颈>
解决措施：<详细说明修改了哪些核心模块、采用了何种算法、数据结构或技术手段>
效果：<详细说明改动带来的直接结果与收益，强烈建议包含量化数据指标>
```

### 2.2 示范模板
```text
feat(选课系统): 完善选课并发事务与剩余容量原子递减逻辑

问题：在多名学生同时抢选最后一门课时，容易出现超卖导致剩余名额为负数的并发冲突。
解决措施：在 SQLite 事务中采用 UPDATE ... WHERE capacity < max 原子扣减并结合行数校验。
效果：通过高并发压测保证 0 超卖现象，选课接口事务吞吐量提升 25%，数据一致性达到 100%。
```

---

## 3. GitHub Stacked PR (`gh stack`) 协作流

为了便于审查并避免大型巨型 PR，复杂功能的开发请使用 GitHub 官方 `gh stack` 工具链分层提报：

```bash
# 1. 在 trunk (main) 上创建 bottom 分支
gh stack init feat/layer-1-infra

# 2. 完成当前层代码并提交（遵从三点论）
git add .
git commit -m "feat(基建): ..."

# 3. 向上创建下一层分支
gh stack add feat/layer-2-feature

# 4. 查看当前堆栈拓扑
gh stack view --short

# 5. 推送并自动化创建关联 PR
gh stack submit
```

若对底层分支进行了修改，请执行 `gh stack rebase --upstack` 级联同步上层分支。详细操作步骤请参阅 [Git 工作流与 Stack PR 指南](./docs/git-workflow.md)。

---

## 4. 本地开发与常用命令

```bash
# 安装依赖
pnpm install

# 启动全栈热重载开发环境 (前端 SPA + Hono API 服务)
pnpm dev

# 仅启动前端应用
pnpm dev:web

# 仅启动后端 API 服务
pnpm dev:server

# 打开 Drizzle Studio 实时可视化数据库面板
pnpm db:studio

# 执行数据库种子数据注入
pnpm db:seed

# 全量顶格类型检查 (零 any)
pnpm typecheck

# 代码规范静态分析 (0 警告 0 错误)
pnpm lint

# 桌面端 Tauri 调试 (需本地已配置 Rust)
pnpm tauri dev
```

---

## 5. 详细工程技术文档

- 架构设计详情：[系统整体架构与工程规范](file:///c:/Helianthus/SXP-Simon/杂/sql-semester-teamwork/docs/architecture.md)
- 界面与设计系统：[设计系统与视觉规范 (TweakCN Light Green)](file:///c:/Helianthus/SXP-Simon/杂/sql-semester-teamwork/docs/design-system.md)
- 数据库与并发：[数据库模型与高级特性设计](file:///c:/Helianthus/SXP-Simon/杂/sql-semester-teamwork/docs/database-design.md)
- 代码质量与规范：[工程措施与代码质量标准](file:///c:/Helianthus/SXP-Simon/杂/sql-semester-teamwork/docs/engineering-standards.md)
- 分支与门禁指南：[Git 提交规范与 GitHub Stacked PR 工作流指南](file:///c:/Helianthus/SXP-Simon/杂/sql-semester-teamwork/docs/git-workflow.md)
- CI/CD 与发版：[CI 门禁与自动化 Release 发版说明](file:///c:/Helianthus/SXP-Simon/杂/sql-semester-teamwork/docs/ci-cd.md)
