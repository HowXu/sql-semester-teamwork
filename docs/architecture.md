# 系统整体架构与工程规范

本文档阐述教务选课系统的总体工程架构、技术选型决策及前端分层设计模式。

---

## 1. 架构总览：方案 A 双模架构

系统采用 **桌面/全栈双模运行机制**：

```text
+-----------------------------------------------------------------------------------+
|                                 运行模式架构                                       |
+-----------------------------------------------------------------------------------+
| [开发环境 / Web 模式]                                                               |
| 现代 Web 浏览器 (localhost:5173)                                                   |
|    |                                                                              |
|    +---> Vite HMR (React 19 + TanStack Router + TanStack Query)                    |
|    |                                                                              |
|    +---> 本地 Hono.js 服务 (localhost:3000) ---> Drizzle ORM ---> 本地 SQLite (.db) |
|                                                                                   |
| [生产交付 / Tauri Windows .exe 桌面模式]                                           |
| Windows 操作系统原生容器 (Tauri 2.0)                                               |
|    +--- WebView2 渲染层 (加载由 Vite 构建生成的静态 SPA 资源)                        |
|    +--- 本地后端服务/Sidecar (启动轻量 Hono.js 进程直连本地 SQLite 数据库文件)       |
+-----------------------------------------------------------------------------------+
```

### 1.1 核心优势
- **双模统一**：日常开发直接在现代浏览器中享受 Vite SWC 秒级热重载（HMR）；答辩或交付时一键生成单文件 Windows `.exe` 安装程序或便携程序。
- **纯本地持久化**：以 SQLite 本地文件为存储中心，零云端配置依赖，数据即拷即走，非常契合小学期数据库实践答辩要求。
- **端到端类型安全**：前后端统一 TypeScript 技术栈，共享 Zod Schema，实现编译期契约保障。

---

## 2. 前端架构：MVVM + FSD + Atomic Design

前端位于 `apps/web/src`，融合 **Feature-Sliced Design (FSD)**、**Atomic Design (原子设计)** 与 **MVVM (Model-View-ViewModel)** 模式。

### 2.1 目录分层结构 (FSD)

```text
apps/web/src/
├── app/                        # 顶层配置：全局上下文 Provider、TanStack Router 路由树注入、全局样式
├── views/                      # 页面路由视图：纯结构组装，不包含复杂业务逻辑
│   ├── TimetablePage.tsx       # 交互式课表主视图
│   ├── CourseCatalogPage.tsx   # 课程选修大厅视图
│   ├── GradeStatsPage.tsx      # 成绩统计与绩点加权分析视图
│   └── AdminSchedulePage.tsx   # 教务排课与计划管理视图
├── widgets/                    # 跨 Feature/Entity 组合的复合部件
│   ├── TimetableGrid/          # 周排课网格大部件 (7x12 交互网格)
│   ├── EnrollmentDrawer/       # 选课暂存抽屉与冲突检测结果卡
│   ├── CourseStatsChart/       # 选课率与成绩分布统计报表图表
│   └── NavigationBar/          # 顶部与侧边栏导航控制栏
├── features/                   # 用户动作驱动的业务用例
│   ├── enroll-course/          # 选课：并发抢课、容量状态、时间冲突校验
│   ├── drop-course/            # 退课：退课确认、容量恢复
│   ├── filter-courses/         # 课程多维检索：院系、学分、时间段过滤
│   └── submit-grades/          # 教师端成绩批量录入与校验
├── entities/                   # 业务领域实体定义与数据展示
│   ├── course/                 # 课程实体：CourseCard, useCourseDetail
│   ├── student/                # 学生实体：个人基本信息、已修学分看板
│   ├── schedule/               # 排课实体：时间段与节次模型
│   └── grade/                  # 成绩实体：分数与加权 GPA 模型
└── shared/                     # 基础公共能力
    ├── ui/                     # 基于 Atomic Design 的原子组件库
    │   ├── atoms/              # 原子 (Button, Input, Badge, Skeleton, Separator)
    │   ├── molecules/          # 分子 (SearchInput, FormField, DialogHeader)
    │   └── organisms/          # 有机体 (DataTable, CardWithHeader, ModalDialog)
    ├── api/                    # Hono RPC 客户端实例与 Fetch 包装
    ├── icons/                  # 统一矢量图标导出 (严禁 Emoji，统一使用 Lucide 图标)
    └── lib/                    # 工具函数：样式合并 cn、时间片碰撞算法、加权绩点计算
```

### 2.2 MVVM 模式映射

- **Model（模型）**：
  - 位于 `packages/schema`。定义核心业务实体的数据契约、Zod 校验规则与 TypeScript 类型推导。
- **ViewModel（视图模型）**：
  - 位于 `features/*/model` 或 `entities/*/model`。
  - 通过自定义 Hook（如 `useCourseEnrollmentViewModel`）封装状态机、TanStack Query 数据拉取、乐观更新（Optimistic UI）、防抖节流以及业务校验。
  - 对 View 层仅暴露出渲染所需的只读 `state` 和操作方法 `actions`。
- **View（视图）**：
  - 纯函数式 React 组件（如 `views/*` 与 `widgets/*`）。
  - 专注于 UI 排版、样式表现以及基于 `motion` 的入场/退场与布局平滑过渡，不直接书写数据转换与网络请求细节。
  - **动效合理性原则**：动效必须承载确定的业务意图（如排课冲突轻度抖动、容量变化平滑拉伸、卡片详情共享展开），严禁无意义的眩目动画；交互反馈严控在 300ms 以内，且全系统尊重 `prefers-reduced-motion` 操作系统减弱动态设置。详情参见 [docs/design-system.md](./design-system.md)。

### 2.3 Atomic Design 组件归类准则

- **Atoms（原子）**：不可再拆分的基元组件，仅包含基础样式与无状态交互。例如 `Button`、`Input`、`Badge`、`Tooltip`。
- **Molecules（分子）**：若干原子组合而成的简单功能单元。例如带搜索图标的输入框 `SearchInput`、表单项包裹容器 `FormField`。
- **Organisms（有机体）**：具有独立展示意义的模块，由分子和原子组合而成。例如带分页和排序的数据表格 `DataTable`、通用操作对话框 `ModalDialog`。

---

## 3. 依赖分包与封装边界规范

### 3.1 shadcn/ui 与底层原语关系
- `shadcn/ui` 采用开放源码模式，所有原子组件均存放在 `apps/web/src/shared/ui` 目录下。
- 为保证无障碍访问（WAI-ARIA）与严谨的键盘控制行为，部分复杂组件底层引入了 `@radix-ui` 原语支持。
- **防腐层规范**：业务组件（View / Widget / Feature）**严禁直接引用 `@radix-ui`**，必须统一通过 `@/shared/ui` 导出层进行调用。

### 3.2 矢量图标体系 (Zero-Emoji Policy)
- **全面移除并严禁在界面与代码中使用任何 Emoji 字符**。
- 全系统使用 `lucide-react` 矢量图标库，并在 `@/shared/icons` 中集中二次导出，保证图标风格一致、尺寸受控、颜色继承系统调色板。
