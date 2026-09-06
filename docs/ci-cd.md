# CI 门禁与自动化 Release 发版说明

本文档说明项目的持续集成 (CI) 质量流水线与基于 GitHub Actions 的 Windows 原生 `.exe` 自动化 Release 打包发版流程。

---

## 1. 持续集成门禁 (CI Pipeline)

CI 流程配置文件位于 `.github/workflows/ci.yml`，在向主分支推送或发起任意 Pull Request（完美兼容 GitHub Stacked PR 各层级间的分段 PR）时自动触发执行。

### 1.1 关键检查任务

1. **凭证泄露扫描 (Security Scan)**：
   - 使用官方 `gitleaks/gitleaks-action` 扫描 PR 中的所有增量提交。
   - 发现明文私钥、密码或 API Token 时立即阻断流水线。
2. **极严类型检查 (Strict Typecheck)**：
   - 运行 `pnpm typecheck` (`tsc -b --noEmit`)。
   - 依赖项与全包代码进行全量编译类型分析，出现任何隐式/显式 `any` 或类型不匹配均报错。
3. **代码规范检查 (Strict Lint)**：
   - 运行 `pnpm lint --max-warnings 0`。
   - 保证 0 warning、0 error。
4. **构建产物验证 (Build Verification)**：
   - 验证 `pnpm run build` 是否在全包范围内正常编译。
   - 检查前端 Vite 是否按照预设 `manualChunks` 成功输出分包产物（`vendor-react`、`vendor-tanstack`、`vendor-ui`、`vendor-motion`）。
5. **数据库模型与种子数据验证 (Database Integrity)**：
   - 执行 `pnpm db:seed`，验证 SQLite 模型、Zod Schema 与 Drizzle ORM 的数据一致性，确保每次提交均可成功建立数据库初始状态。

---

## 2. Windows 桌面客户端 Release 流水线

Release 发版配置文件位于 `.github/workflows/release.yml`，当开发者推送以 `v` 开头的语义化版本标签（例如 `git tag v1.0.0 && git push origin v1.0.0`）时自动激活。

### 2.1 流水线执行步骤

```text
[Push Tag: v1.0.0]
       |
       v
[Windows-latest 虚拟环境启动]
       |
       +---> 配置 Node.js 与 pnpm 缓存
       +---> 配置 Rust 稳定版工具链 (stable-x86_64-pc-windows-msvc)
       |
       v
[前端与基础包全量构建 (pnpm build)]
       |
       v
[Tauri 2.0 原生编译 (tauri-apps/tauri-action)]
       |
       +---> 产出: 教务选课系统_1.0.0_x64-setup.exe (NSIS 安装包)
       +---> 产出: 教务选课系统_1.0.0_x64.msi (Windows Installer)
       |
       v
[提取三点论 Commit 生成 Release Notes]
       |
       v
[创建 GitHub Release 并自动挂载 .exe / .msi 产物供下载]
```

### 2.2 本地与远程一致性
- 开发者本地未安装 Rust 环境时，可以专注于在 Web 浏览器模式下热重载开发。
- 只要向 GitHub 推送版本 Tag，云端 GitHub Actions 即可自动化编译出经签名的标准 Windows `.exe` 可执行文件。
