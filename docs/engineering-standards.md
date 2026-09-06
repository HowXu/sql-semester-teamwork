# 工程措施与代码质量标准

本文档规范本项目的代码质量准则、静态检查等级、打包分包优化及敏感信息防泄漏规范。

---

## 1. TypeScript 极严类型校验规范 (Zero-Any Policy)

本项目在根级 `tsconfig.base.json` 及各子包中开启 TypeScript 最高级别类型安全配置，**严禁使用任何 `any` 类型**。

### 1.1 关键编译开关
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

### 1.2 编码避坑指南
- 动态未知数据必须使用 `unknown` 并配合 `zod` 的 `.parse()` 或类型保护函数（Type Guard）收窄类型，禁止通过 `as any` 逃避校验。
- 索引访问（如 `array[index]` 或 `record[key]`）的返回值在 `noUncheckedIndexedAccess` 下默认包含 `| undefined`，必须进行非空保护。

---

## 2. ESLint 规则集与静态分析

项目采用最新的 ESLint Flat Config，集成 `@typescript-eslint` 严格检查套件。

### 2.1 强制禁令规则 (Error 级)
- `@typescript-eslint/no-explicit-any`: 禁止显式 `any`。
- `@typescript-eslint/no-unsafe-assignment`: 禁止对未校验类型进行赋值。
- `@typescript-eslint/no-unsafe-member-access`: 禁止访问不安全成员。
- `@typescript-eslint/no-unsafe-call`: 禁止调用不安全函数。
- `@typescript-eslint/no-unsafe-return`: 禁止返回未类型化结果。

---

## 3. 视觉规范：零 Emoji 纯矢量图标策略

- **界面与业务代码**：全面禁止使用 Unicode Emoji 符号。所有按钮、通知、角标、表格状态均使用 `lucide-react` 图标组件渲染。
- **终端命令与日志输出**：严禁在命令行和日志中使用表情包，统一采用标准 ASCII 标签配合 ANSI 颜色渲染：
  - `[PASS]`：绿色表示成功通过
  - `[FAIL]`：红色表示失败拦截
  - `[WARN]`：黄色表示告警提醒
  - `[INFO]`：蓝色表示常规信息
  - `[GUIDE]`：青色表示操作指引

---

## 4. 前端打包与 Vendor 分包策略

为避免单包体积过大并充分利用浏览器长效缓存，在 `apps/web/vite.config.ts` 中针对 Rollup 配置细粒度 Chunk 切分：

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-tanstack': ['@tanstack/react-query', '@tanstack/react-router'],
        'vendor-ui': ['motion', 'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-popover'],
        'vendor-utils': ['clsx', 'tailwind-merge', 'zod']
      }
    }
  }
}
```

---

## 5. 敏感凭据防泄漏 (Gitleaks)

- 项目根目录提供 `.gitleaks.toml` 自定义检测规则。
- 在本地 Git 钩子（Lefthook `pre-commit`）与 GitHub Actions CI 中自动化运行安全扫描，防止密钥、数据库凭据与连接串意外提交至公共仓库。
