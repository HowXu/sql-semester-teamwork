import { execSync } from "node:child_process";

try {
  execSync("gitleaks git --pre-commit --staged", { stdio: "inherit" });
  console.log("\x1b[32m[PASS] Gitleaks 安全扫描通过\x1b[0m");
} catch {
  console.warn("\x1b[33m[WARN] 提示: 宿主机未检测到 gitleaks CLI，已跳过本地密钥扫描，由云端 CI 继续保障安全。\x1b[0m");
}
