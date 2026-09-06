# 综合教务选课系统 (Academic Administration & Course Selection System)

> 面向高校小学期数据库系统综合实践设计的高性能、现代化教务选课管理系统。基于 **全栈 TypeScript** 架构与 **单机 SQLite 本地数据库** 引擎，支持 **Web 浏览器秒级热重载** 与 **Windows 原生 `.exe` 桌面客户端** 双模无缝运行。

---

## 1. 核心架构与设计亮点

### 1.1 全栈双模运行架构

```text
+-----------------------------------------------------------------------------------+
|                                 运行模式架构                                       |
+-----------------------------------------------------------------------------------+
| [开发调试 / Web 模式]                                                               |
| 现代 Web 浏览器 (localhost:5173)                                                   |
|    |                                                                              |
|    +---> Vite HMR (React 19 + Tailwind CSS v4 + Motion + TanStack Router & Query) |
|    |                                                                              |
|    +---> 本地 Hono.js HTTP 服务 (localhost:3000) ---> Drizzle ORM ---> 本地 SQLite (.db)
|                                                                                   |
| [交付答辩 / Tauri Windows .exe 桌面模式]                                           |
| Windows 操作系统原生容器 (Tauri 2.0)                                               |
|    +--- WebView2 渲染层 (加载静态构建的 SPA 产物)                                   |
|    +--- 内置本地 Hono.js 轻量服务 (直连同目录 SQLite 数据库，零外部云依赖，即拷即跑)  |
+-----------------------------------------------------------------------------------+
```

### 1.2 前端工程规范 (FSD + MVVM + Atomic Design)
- **Feature-Sliced Design (FSD)**：严格按 `app` / `views` / `widgets` / `features` / `entities` / `shared` 分层组织。
- **MVVM 视图模型解耦**：自定义 ViewModel Hook（如 `useCourseCatalogViewModel`、`useTimetableViewModel`）封装状态机、业务校验与乐观更新（Optimistic UI），View 层专注于纯函数式渲染与动画表现。
- **状态双层分工**：
  - **服务端状态 (Server State)**：由 **TanStack Query** 全权负责缓存、数据失效与抢课乐观响应；
  - **客户端全局状态 (Client State)**：由 **Zustand** 轻量级负责**模拟身份切换**（学生/教师/教务）、**预选清单（预选车）**与排课偏好持久化（`localStorage`）。
- **纯 CSS 现代样式引擎**：全面升级至 **Tailwind CSS v4**（基于 Rust Oxide 引擎与 `@tailwindcss/vite`，纯 CSS 配置，剔除 PostCSS 胶水层），原生支持 OKLCH 宽色域调色板。
- **Rational Motion 合理动效**：交互反馈时间严格控制在 **150ms ~ 300ms**，支持选课容量动态三色伸缩、排课冲突轻微振动提醒与 7x12 网格错峰入场，全系统支持 `prefers-reduced-motion` 操作系统无障碍降级。
- **严格零 Emoji 规约 (Zero-Emoji Policy)**：界面与代码全面移除 Unicode Emoji，统一使用 `lucide-react` 矢量图标；终端及日志统一采用 `[PASS] / [FAIL] / [WARN] / [INFO] / [GUIDE]` 标签。

### 1.3 数据库设计与高并发并发控制
- **数据源底座**：采用轻量纯本地的 `@libsql/client` 配合 **Drizzle ORM**，彻底消除在最新 Node.js 环境下编译原生 C++ 绑定（如 `better-sqlite3`）的依赖痛点。
- **并发防超卖事务**：选课接口采用数据库级行锁与原子扣减检查机制（`UPDATE course_offerings SET current_capacity = current_capacity + 1 WHERE id = ? AND current_capacity < max_capacity`），通过检查影响行数（`rowsAffected > 0`）精准杜绝超卖。
- **冲突预检算法**：在前端选课大厅与后端 API 均内置时间冲突检测算法，多节次交叉课程自动标记警示并阻断提交。

---

## 2. 核心业务功能

1. **全校选课大厅 (`CourseCatalog`)**：
   - 课程按学院分类与关键词即时检索；
   - 实时三色容量胶囊指示条（充裕/警示/已满）；
   - 排课时间段先验碰撞检测，冲突时标红并显示重叠详情；
   - 支持单门直接抢选或放入“预选车”。
2. **每周排课总表 (`TimetableGrid`)**：
   - 标准 **7 天 $\times$ 12 节课** 交互排课矩阵；
   - 自动合并跨节次课程，同课程统一粉彩色系高亮；
   - 支持点击课程退选并弹出确认对话框。
3. **选课预选清单 / 预选车 (`EnrollmentCart`)**：
   - 暂存多门心仪课程，统计拟修总学分；
   - 提供“一键批量并发结算抢课”，自动反馈每门课程的最终选修状态。
4. **学业成绩与加权 GPA 评定中心 (`GradeDashboard`)**：
   - 实时计算平均学分绩点 (GPA / 4.00)、已获学分、修读总学分及通过率；
   - 展示详细的分数、绩点、成绩等级与修读通过状态。
5. **教学运行大盘与容量监控 (`AdminDashboard`)**：
   - 实时聚合 SQLite 中的全校课程库总量、开设教学班数、总选课人次及全校选课饱和度；
   - 按开课学院下钻展示运行负荷。
6. **模拟身份随时无感切换 (答辩专用)**：
   - 顶部导航栏支持随时一键在学生 A（`2024001`）、学生 B（`2024002`）、主讲教师（`T001`）与教务管理科（`A001`）之间无感切换，展示不同角色下的实时数据联动。

---

## 3. 代码仓库与包结构 (Monorepo)

本项目基于 `pnpm` 工作区组织，严格进行原子化边界隔离：

```text
sql-semester-teamwork/
├── apps/
│   ├── web/                    # 前端单页应用 (Vite + React 19 + Tailwind v4 + TanStack + Zustand)
│   ├── server/                 # 后端 API 服务 (Hono.js + Drizzle ORM + SQLite 事务)
│   └── desktop/                # 桌面客户端包装 (Tauri 2.0 配置与 Windows 打包脚本)
├── packages/
│   ├── schema/                 # 跨前后端共享契约 (全量 Zod Schema 与 TypeScript 类型推导)
│   └── db/                     # 数据库模型与迁移 (Drizzle Schema、libSQL 连接客户端、Seed 数据)
├── scripts/                    # 自动化脚本 (Lefthook 提交门禁、三点论校验、Gitleaks 检查)
├── docs/                       # 架构与设计规范系列技术文档
├── .github/workflows/          # CI 持续集成与 Release 桌面客户端发版工作流
├── pnpm-workspace.yaml         # pnpm Monorepo 工作区定义
└── tsconfig.base.json          # 全局顶格严格 TypeScript 配置 (Zero Any)
```

---

## 4. 快速上手

### 4.1 环境准备
- **Node.js**：`>= 20.0.0`（推荐 LTS 22.x）
- **pnpm**：`>= 9.0.0`（推荐 `10.13.1`）
- **Git**：已配置基础开发者信息

### 4.2 安装与启动

```bash
# 1. 克隆代码仓库并安装依赖
git clone <repo-url>
cd sql-semester-teamwork
pnpm install

# 2. 初始化本地 SQLite 数据库并灌入种子数据
pnpm db:seed

# 3. 启动全栈开发调试 (前端 + 后端并行热重载)
pnpm dev
```

浏览器访问 `http://localhost:5173` 即可进入系统界面，后端 API 运行于 `http://localhost:3000`。

### 4.3 常用命令清单

| 命令 | 说明 |
| :--- | :--- |
| `pnpm dev` | 并行启动前端 SPA (`apps/web`) 与后端服务 (`apps/server`) |
| `pnpm dev:web` | 仅启动前端 Vite 开发服务器 |
| `pnpm dev:server` | 仅启动 Hono.js 后端服务 (带热重载 watch) |
| `pnpm build` | 全工作区一键编译构建（前端 SPA + 后端 TS + 桌面配置） |
| `pnpm build:web` | 单独构建前端静态资源（自动按预设分出 4 个 Vendor Chunks） |
| `pnpm typecheck` | 全量 TypeScript 严格类型检查（**顶格禁止任何 `any` 漏网**） |
| `pnpm lint` | 全量 ESLint 扁平规则检查（**0 错误、0 警告门禁**） |
| `pnpm db:seed` | 执行数据库种子脚本，向 SQLite 注入专业课程、教学班与初始成绩数据 |
| `pnpm db:studio` | 启动 Drizzle Studio 本地可视化数据库管理面板 |
| `pnpm tauri dev` | 启动 Tauri 桌面客户端调试窗口（需本地已配置 Rust） |

---

## 5. 工程规范与协作流水线

### 5.1 中文 Conventional Commits “三点论”门禁
提交信息必须通过 **Lefthook** 本地门禁校验。每次提交必须包含 Scope 标识与正文“三点论”（问题、解决措施、效果），去空格后全文**不少于 40 字**：

```text
feat(选课): 完善选课并发事务与剩余容量原子递减逻辑

问题：在多名学生同时抢选最后一门课时，容易出现超卖导致剩余名额为负数的并发冲突。
解决措施：在 SQLite 事务中采用 UPDATE ... WHERE capacity < max 原子扣减并结合影响行数校验。
效果：通过高并发测试保证 0 超卖现象，选课接口事务吞吐量提升 25%，数据一致性达到 100%。
```

支持的 Scope 列表：`基建`、`规范`、`文档`、`schema`、`db`、`server`、`api`、`web`、`ui`、`desktop`、`ci`、`deps`、`选课`、`排课`、`成绩`、`动效`。

### 5.2 GitHub Stacked PR (`gh stack`) 分层协作建议
为提升代码审查 (Code Review) 效率并保障主干稳定性，团队在开发较为复杂的功能时，推荐采用 GitHub 官方推荐的 **Stacked PR** 模式。通过拆分为小步递进的分层分支，避免数百上千行庞大 PR 造成的审查延迟：

- **底层承载**：数据模型（Schema/DB）或公共类型契约
- **中层驱动**：后端 API 路由、业务逻辑与并发事务处理
- **上层表现**：前端 ViewModel、页面组件与交互动效

使用 `gh stack` 可实现一键向远端推送分层堆栈并自动生成互相关联的 PR：

```bash
# 全栈推送分支并自动生成层叠 PR
gh stack submit
```

完整的分层协作理念、指令速查及实战案例请参阅 [Git 提交规范与 GitHub Stacked PR 工作流指南](./docs/git-workflow.md)。

---

## 6. 深入技术文档导航

- [系统整体架构与工程规范](./docs/architecture.md)：包含方案 A 双模架构、MVVM/FSD/Atomic Design 详细映射、Zustand 状态划分与 libSQL 驱动说明。
- [设计系统与视觉规范 (TweakCN Light Green)](./docs/design-system.md)：包含 OKLCH 调色板、圆角间距 Token 字典、组件模板及 Rational Motion 动效规范。
- [数据库模型与高级特性设计](./docs/database-design.md)：包含实体关系 E-R 图、Drizzle SQLite 表结构、索引规划与并发防超卖实现细节。
- [工程措施与代码质量标准](./docs/engineering-standards.md)：包含 TypeScript 顶格严格配置、ESLint 9 规则、Gitleaks 密钥防护与原子化提交策略。
- [Git 提交规范与 GitHub Stacked PR 工作流指南](./docs/git-workflow.md)：包含 Conventional Commits 三点论细则与 `gh stack` 全生命周期指令速查。
- [CI 门禁与自动化 Release 发版说明](./docs/ci-cd.md)：包含 GitHub Actions 自动化 CI 校验管线与 Windows `.exe` 桌面安装包编译发布流程。
- [贡献者指南 (Contributing Guide)](./CONTRIBUTING.md)：团队协作规范与开发指引。