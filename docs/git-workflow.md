# Git 提交规范与 GitHub Stacked PR 工作流指南

本文档规定本项目的提交信息格式规范、本地提交门禁校验机制，以及基于 GitHub 官方 `gh stack` 的分层 PR (Stacked Pull Requests) 协作全流程。

---

## 1. 提交信息规范：中文 Conventional + “三点论”

### 1.1 总体格式要求
所有提交必须遵循 Conventional Commits 规范，且正文必须采用结构化的“三点论”（问题、解决措施、效果），全文去空格后总字数不得少于 **40 字**。

```text
<type>(<scope>): <简要总结>

问题：<详细说明本次改动所针对的业务缺陷、功能诉求或性能瓶颈>
解决措施：<详细说明修改了哪些核心模块、采用了何种算法、数据结构或技术手段>
效果：<详细说明改动带来的直接结果与收益，强烈建议附带量化数据指标>
```

### 1.2 Type 类型枚举
- `feat`: 新增业务功能
- `fix`: 修复程序缺陷
- `docs`: 文档变更
- `style`: 代码格式调整（不影响逻辑）
- `refactor`: 代码重构（不增加新功能也不修复缺陷）
- `perf`: 性能调优
- `test`: 测试用例增补
- `build`: 构建系统或外部依赖改动
- `ci`: CI/CD 流程配置文件修改
- `chore`: 其他杂项工程维护

### 1.3 标准示范模板

```text
feat(选课系统): 完善选课并发事务与剩余容量原子递减逻辑

问题：在多名学生同时抢选最后一门课时，容易出现超卖导致剩余名额为负数的并发冲突。
解决措施：在 SQLite 事务中采用 UPDATE ... WHERE capacity < max 原子扣减并结合行数校验。
效果：通过高并发压测保证 0 超卖现象，选课接口事务吞吐量提升 25%，数据一致性达到 100%。
```

### 1.4 本地 Lefthook 门禁机制
- 根目录 `lefthook.yml` 的 `commit-msg` 钩子会自动调用 `scripts/verify-commit.js`。
- 若格式不合规或字数未达标，提交将被自动阻断，并在控制台打印彩色指引卡片与示例模板（严禁 Emoji，统一采用 `[FAIL]`、`[GUIDE]` 等标准 ASCII 标识）。

---

## 2. GitHub Stacked PR (`gh stack`) 协作指南

在开展多层 Stack PR 开发前，建议查阅以下权威资料：
- **GitHub 官方技术文档**：[Stacked pull requests - GitHub Docs](https://docs.github.com/en/pull-requests/how-tos/stacked-pull-requests)
- **社区实战博客指南**：[GitHub Stack PR 实战指南：用 gh stack 拆分、同步与合并 PR - 余弦の博客](https://blog.cosine.ren/post/github-stacked-pull-requests-guide)

本项目全面采用上述分层提交与分段 Review 机制，将复杂功能拆分为线性递进的小 PR，避免上千行单次大 PR 导致审查困难。

### 2.1 核心概念
- **trunk**：目标主干分支，通常为 `main`。
- **bottom**：距离 trunk 最近的最底层 PR（承载基础能力）。
- **top**：位于堆栈顶部、依赖最深的最上层 PR。
- **upstack**：从当前分支向上（朝向 top 方向）。
- **downstack**：从当前分支向下（朝向 trunk 方向）。
- **依赖核心法则**：上层可以依赖下层，但下层绝不能反向依赖上层。

### 2.2 环境准备与常用命令

```bash
# 检查 GitHub CLI 与扩展安装
gh --version
gh extension install github/gh-stack

# 设置别名（推荐）
gh stack alias
# 设置后即可简写为 gs view, gs push 等
```

| 操作目的 | 对应命令 | 行为说明 |
| :--- | :--- | :--- |
| **初始化底层** | `gh stack init <branch-name>` | 从当前主干分支创建 bottom 分支 |
| **向上新建一层** | `gh stack add <branch-name>` | 在当前 top 分支之上追加新分支 |
| **查看堆栈状态** | `gh stack view --short` | 终端树状展示所有分支与 PR 关联关系 |
| **全栈推送与创建 PR** | `gh stack submit` | 将本地分支链推送到 GitHub 并创建互相关联的 PR |
| **仅更新分支** | `gh stack push` | 推送最新提交，不创建新 PR |
| **修改下层后级联同步** | `gh stack rebase --upstack` | 下层修改后，使上层所有分支自动 rebase 最新代码 |
| **拉取远端同步** | `gh stack sync` | 同步远端分支结构与变动 |
| **按顺序合并** | `gh stack merge` | 自底向上按序合并入主干 |

---

## 3. 本项目初始化分层设计 (Stack 划分)

为保证项目初始化的审查清晰度与原子化隔离，我们设计为以下 6 层递进 Stack：

```text
main (trunk)
  └── feat/stack-1-infra-and-docs       (Layer 1: Monorepo 骨架、代码规范、文档、门禁)
        └── feat/stack-2-schema-and-db    (Layer 2: 共享 Zod Schema、Drizzle SQLite 模型与种子)
              └── feat/stack-3-backend-api     (Layer 3: Hono.js API、并发防超卖事务、排课冲突检测)
                    └── feat/stack-4-frontend-core    (Layer 4: Vite + React 19 + Tailwind v4 + Zustand + Motion)
                          └── feat/stack-5-desktop-and-ci   (Layer 5: Tauri 2.0 桌面配置、CI/CD 自动化流水线)
                                └── feat/stack-6-docs-and-ci-polish (Layer 6: 文档同步、CI/CD 强化与 README 完善)
```

每层均可独立 review、独立验证，并保留完整的三点论提交记录。
