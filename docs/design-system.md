STYLEKIT_STYLE_REFERENCE
style_name: TweakCN Light Green (现代教务轻质感)
style_slug: tweakcn-light-green
style_source: https://tweakcn.com/r/themes/cmlhfpjhw000004l4f4ax3m7z

# Hard Prompt

## 什么时候用
当你希望 AI 严格按系统设计规则生成 UI 代码、组件、页面与动效时使用。它是教务选课系统所有界面开发的强制标准。

## 怎么用
- 把完整提示词复制到编码助手或作为开发指引。
- 在提示词后追加具体的前端组件、排课表或管理视图需求。
- 生成后按禁止项和交互自检清单逐条核对，严禁风格漂移。

请严格遵守以下风格规则并保持一致性，禁止风格漂移。

## 执行要求
- 优先保证风格一致性与信息可读性，杜绝生硬杂乱的视觉堆砌。
- 遇到视觉冲突时以禁止项为最高优先级。
- **全局严禁使用任何 Emoji 字符**，状态与操作一律使用 `lucide-react` 矢量图标组件。
- 输出前自检：OKLCH 颜色、大圆角阴影微质感、间距层级、Spring 平滑动效。

## Style Rules
你是一个精通 shadcn/ui、TailwindCSS 与 Motion 的高级前端架构专家。生成的所有界面代码必须严格遵守以下约束：

## 绝对禁止
- 禁止在任何界面、代码或注释中使用 Unicode Emoji 符号（如火、勾、叉、笑脸等）。
- 禁止使用生硬尖锐的直角（如 `rounded-none`）。
- 禁止使用刺眼的高饱和度霓虹色彩（如纯红 `#ff0000`、荧光青 `#00ffff`、纯黑 `#000000` 背景）。
- 禁止使用卡片套卡片的过度嵌套结构。
- 禁止使用短促生硬的单调线性过渡（如 `duration-75` 或 `ease-linear`）。
- 禁止直接引用 `@radix-ui` 原语，必须统一从 `@/shared/ui` 导出层消费。

## 必须遵守
- 主色调采用清新自然的植物翠绿 `oklch(0.8871 0.2122 128.5041)`，搭配温润底色与极具对比度的石板灰字色。
- 圆角采用大弧度优雅圆角，基础半径 `var(--radius)` 设定为 `1rem`（对应 `rounded-2xl` 与 `rounded-xl`）。
- 图标统一从 `@/shared/icons` 或 `lucide-react` 导入，并赋予语义化色彩。
- 交互动效结合 `motion`，使用弹性弹簧参数（stiffness: 300, damping: 25）与平滑的 `duration-200 / duration-300 ease-out`。
- 选课容量条采用动态三色渐变指示（绿色充裕、黄色警示、红色饱和）。
- 课表网格单元格具备悬停光晕扩散与微微上浮的物理微质感。

## Animation & Interaction Rules
- **Spring Float**：卡片悬停时微微上浮 `-translate-y-0.5`，配合层级阴影扩散从 `shadow-sm` 跃迁至 `shadow-md`。
- **Smooth Capacity Transition**：选课容量胶囊进度条在剩余名额变动时具备平滑宽度渐变动效。
- **Conflict Jitter**：当排课检测到时间冲突时，受影响时段卡片触发轻微水平抖动提醒（`keyframes: [0, -4, 4, -4, 4, 0]`）。
- **Optimistic Ripple**：点击抢课按钮展示平滑 Loading 图标旋转（`LoaderCircle` 配合 `animate-spin`），成功后弹性缩放弹出 `CircleCheckBig`。

## 配色定义 (OKLCH 调色板)

### 浅色模式 (Light Canvas)
- Canvas Background: `oklch(0.9892 0.0054 117.9205)`
- Canvas Foreground: `oklch(0.2077 0.0398 265.7549)`
- Card Background: `oklch(1.0000 0 0)` (纯白微投影)
- Primary (核心主色): `oklch(0.8871 0.2122 128.5041)`
- Primary Foreground: `oklch(0 0 0)` (黑字强对比)
- Secondary (次要辅色): `oklch(0.3717 0.0392 257.2870)`
- Secondary Foreground: `oklch(0.9842 0.0034 247.8575)`
- Muted (弱化底色): `oklch(0.9683 0.0069 247.8956)`
- Muted Foreground: `oklch(0.5544 0.0407 257.4166)`
- Accent (强调高亮): `oklch(0.9819 0.0181 155.8263)`
- Destructive (危险/退课): `oklch(0.6368 0.2078 25.3313)`
- Border & Input: `oklch(0.9288 0.0126 255.5078)`
- Ring (聚焦光圈): `oklch(0.8871 0.2122 128.5041)`

### 深色模式 (Dark Slate)
- Background: `oklch(0.1288 0.0406 264.6952)`
- Foreground: `oklch(0.9842 0.0034 247.8575)`
- Card: `oklch(0.2077 0.0398 265.7549)`
- Border: `oklch(0.2795 0.0368 260.0310)`

---

# TweakCN Light Green 设计系统规范

> 专为现代化高校教务与选课系统定制的轻量质感设计语言，将高可读性表格排版、柔和的植物系绿意与现代无障碍交互深度统一。

## 1. Token 字典（精确 Class 映射）

### 1.1 边框与圆角
```text
外边框: border border-border/80
主卡片圆角: rounded-2xl (1rem)
内部控件圆角: rounded-xl (0.75rem)
胶囊角: rounded-full
```

### 1.2 阴影梯度
```text
极轻微: shadow-2xs
卡片默认: shadow-sm
卡片悬浮: hover:shadow-md
弹窗浮层: shadow-xl
```

### 1.3 字体与字号阶梯
```text
无衬线主字体: font-sans (Inter / 系统默认)
数字与代码: font-mono (JetBrains Mono)
大屏数值 (GPA/学分): text-3xl font-bold tracking-tight
页面大标题: text-2xl font-semibold tracking-tight
模块标题: text-lg font-medium
正文: text-sm
辅助说明: text-xs text-muted-foreground
```

### 1.4 间距韵律
```text
页面主容器: p-6 md:p-8 max-w-7xl mx-auto
网格间距: gap-4 md:gap-6
卡片内衬: p-5 md:p-6
紧凑控件间距: gap-2
```

---

## 2. [FORBIDDEN] 绝对禁止使用

- `rounded-none`: 严禁生硬直角。
- `text-red-500` / `bg-red-500` (未适配主题的生硬 Tailwind 默认红)：必须使用 `text-destructive` / `bg-destructive/10`。
- `Unicode Emoji`（严禁出现任何 Emoji 图标与表情符号）：统一调用 `BookOpen`、`GraduationCap`、`CircleCheckBig`、`CircleSlash2`。
- `shadow-2xl` 用于常规普通表格行：阴影层级必须克制。

---

## 3. [REQUIRED] 核心组件必须包含的 Token

### 按钮 (Button)
```html
rounded-xl font-medium transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center gap-2
```

### 课程卡片 (CourseCard)
```html
rounded-2xl bg-card text-card-foreground border border-border/70 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
```

### 选课容量指示胶囊 (CapacityBadge)
```html
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
```

### 输入框与检索栏 (SearchInput)
```html
rounded-xl border border-input bg-background/50 px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
```

---

## 4. [COMPARE] 错误 vs 正确对比

### 选课按钮

[WRONG] **错误示例**（包含生硬直角与表情符号）：
```html
<button class="bg-green-500 text-white p-2 rounded-none">
  选这门课 [选课]
</button>
```

[CORRECT] **正确示例**（严格使用主题 Token 与 Lucide 矢量图标）：
```html
<button class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow active:scale-[0.98] transition-all">
  <Plus class="h-4 w-4" />
  <span>选修课程</span>
</button>
```

### 课程容量指示器

[WRONG] **错误示例**（缺乏层级与生硬文本）：
```html
<div>容量: 45/50 (快满了)</div>
```

[CORRECT] **正确示例**（使用结构化指示条与状态图标）：
```html
<div class="flex items-center gap-2">
  <div class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 border border-amber-500/20">
    <Clock class="h-3.5 w-3.5" />
    <span>余量 5 / 50</span>
  </div>
  <div class="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
    <div class="h-full bg-amber-500 transition-all duration-300" style="width: 90%" />
  </div>
</div>
```

---

## 5. [TEMPLATES] 页面骨架模板

### 5.1 顶部导航栏骨架
```html
<header class="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
  <div class="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
    <div class="flex items-center gap-3">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <GraduationCap class="h-5 w-5" />
      </div>
      <div>
        <h1 class="text-base font-semibold tracking-tight text-foreground">综合教务选课系统</h1>
        <p class="text-xs text-muted-foreground">2026-2027 学年秋季学期</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <nav class="flex items-center gap-1 text-sm font-medium">
        <a href="/timetable" class="px-3 py-1.5 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">课表总览</a>
        <a href="/courses" class="px-3 py-1.5 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">选课大厅</a>
        <a href="/grades" class="px-3 py-1.5 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">成绩与绩点</a>
      </nav>
    </div>
  </div>
</header>
```

### 5.2 课程卡片骨架
```html
<div class="rounded-2xl border border-border/70 bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
  <div class="flex items-start justify-between gap-4">
    <div>
      <span class="inline-flex items-center rounded-md bg-secondary/15 px-2 py-0.5 text-xs font-mono font-medium text-secondary">CS201</span>
      <h3 class="mt-1.5 text-base font-semibold text-card-foreground">数据库系统实现与实践</h3>
      <p class="text-xs text-muted-foreground mt-0.5">计算机科学与技术学院 · 4.0 学分</p>
    </div>
    <div class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 border border-emerald-500/20">
      <CircleCheckBig class="h-3.5 w-3.5" />
      <span>剩余 18 名额</span>
    </div>
  </div>
  <div class="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
    <div class="flex items-center gap-3">
      <span class="inline-flex items-center gap-1"><User class="h-3.5 w-3.5" /> 张教授</span>
      <span class="inline-flex items-center gap-1"><MapPin class="h-3.5 w-3.5" /> 教学楼 A-302</span>
    </div>
    <button class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-all">
      <Plus class="h-3.5 w-3.5" />
      <span>选课</span>
    </button>
  </div>
</div>
```

---

## 6. Motion 动效体系与合理应用规范 (Rational Motion Design)

本项目采用 `motion` 作为交互与物理动效驱动引擎。**动效的引入必须克制、精准、符合物理直觉，严禁为了炫技而引发视觉疲劳或降低操作效率。**

### 6.1 动效合理性四大核心原则
1. **意图明确 (Purpose-Driven)**：每一个动效必须承载确定的功能意图（引导注意力、反馈状态变更、呈现空间位置层级），禁止纯装饰性的无意义抖动或漫长位移。
2. **物理直觉 (Spring Physics)**：摒弃生硬机械的线性过渡，全面采用弹簧物理模型（Spring），模拟自然界惯性与阻尼，使界面触感轻盈自然。
3. **极速响应 (Snappy Response)**：交互反馈时间必须严控在 **150ms ~ 300ms** 以内，绝不可因为等待动画播放完毕而阻塞用户的下一步操作。
4. **无障碍降级 (Reduced Motion)**：全系统严格遵从操作系统的减弱动态偏好（`prefers-reduced-motion`）。当用户开启此选项时，所有位置平移（translate/scale）自动降级为纯透明度淡入淡出（fade only）。

### 6.2 教务系统专属合理动效场景与代码级 Token

#### 场景 1：排课冲突警示抖动 (Conflict Shake)
- **业务场景**：选课时检测到上课时间重叠或先修课程缺失。
- **动效意图**：在不阻断用户视线的前提下，通过轻微振动和警示高亮吸引注意力，直观告知“此处时间重叠受阻”。
- **标准实现**：
```tsx
export const conflictShakeVariants = {
  idle: { x: 0 },
  conflict: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.35, ease: "easeInOut" }
  }
};
```

#### 场景 2：选课容量与并发状态流转 (Capacity Morph)
- **业务场景**：其他同学选课导致剩余容量实时递减，或学生成功抢课。
- **动效意图**：容量进度条的宽度改变采用流动插值，数字滚动刷新，让数据变动清晰可感知。
- **标准实现**：
```tsx
<motion.div 
  className="h-full bg-primary"
  initial={false}
  animate={{ width: `${(current / max) * 100}%` }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>
```

#### 场景 3：卡片交互与上下文保持 (Shared Layout & Float)
- **业务场景**：鼠标悬停在课程卡片上，或点击卡片展开教学大纲详情模态框。
- **动效意图**：Hover 时微微浮起产生触控深度；展开时通过 `layoutId` 保持空间上下文连续，避免突兀弹窗。
- **标准实现**：
```tsx
export const cardInteractiveProps = {
  whileHover: { y: -2, transition: { duration: 0.2, ease: "easeOut" } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } }
};
```

#### 场景 4：周排课网格平滑交错入场 (Timetable Stagger)
- **业务场景**：切换单双周或切换学期时，重新加载 7x12 课表网格。
- **动效意图**：通过极轻微的错峰淡入（staggerChildren: 0.02），消除全屏突兀白屏刷新感。
- **标准实现**：
```tsx
export const timetableContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.05 }
  }
};

export const timetableCellVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
};
```

### 6.3 动效工程底线与禁止项 (Motion Forbidden)
- **绝对禁止全页面长时间遮罩动画**（超过 400ms 的入场等待一律禁止）。
- **绝对禁止在大型滚动列表（如 200 条课程列表）中对每行都挂载昂贵的复杂重绘动画**，只能对视口内可见卡片使用轻量 GPU 硬件加速变换。
- **绝对禁止动画直接修改 `width` / `height` / `top` / `left`** 导致浏览器重排（Reflow），必须通过 `motion` 的 `layout` 属性利用 GPU Transform 投影机制。

---

## 7. [CHECKLIST] 交付前自检清单

- [ ] 全界面**绝无任何 Emoji 符号**，状态标识全面使用 `lucide-react` 矢量图标。
- [ ] 卡片与弹窗圆角一致采用 `rounded-2xl`（1rem），内部控件采用 `rounded-xl`。
- [ ] 按钮具备明显的 Hover 光泽与 Active 轻微缩放（`active:scale-[0.98]`）。
- [ ] 动效使用严格符合合理性原则，严禁无意义的过度装饰动画；关键反馈时间在 300ms 内。
- [ ] 动效全面支持 `prefers-reduced-motion` 降级，避免引发眩晕。
- [ ] 文本层级清晰，数值与代码使用 `font-mono`。
- [ ] 配色基于 OKLCH 主题变量，浅色温润纯净，深色雅致克制。
- [ ] 响应式布局自适应移动端、平板与桌面端。

