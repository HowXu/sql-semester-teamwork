import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "@/widgets/Navbar/Navbar";
import { EnrollmentCartModal } from "@/widgets/EnrollmentCart/EnrollmentCartModal";
import { TimetablePage } from "@/views/TimetablePage";
import { CourseCatalogPage } from "@/views/CourseCatalogPage";
import { GradePage } from "@/views/GradePage";
import { AdminPage } from "@/views/AdminPage";
import { motion, AnimatePresence } from "motion/react";
import { pageFadeVariants } from "@/shared/lib/motion";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
      refetchOnWindowFocus: false,
    },
  },
});

type TabType = "timetable" | "courses" | "grades" | "admin";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-destructive/30 bg-destructive/5 space-y-4 my-8">
          <h3 className="text-base font-bold text-foreground">页面加载遇到错误</h3>
          <p className="text-xs text-muted-foreground font-mono">{this.state.error?.message || "未知异常"}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs"
          >
            重试加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>("timetable");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
        <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                variants={pageFadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full"
              >
                {currentTab === "timetable" && <TimetablePage />}
                {currentTab === "courses" && <CourseCatalogPage />}
                {currentTab === "grades" && <GradePage />}
                {currentTab === "admin" && <AdminPage />}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>

        <footer className="border-t border-border/70 py-6 text-center text-sm sm:text-base text-muted-foreground">
          <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="font-medium">综合教务选课系统 · 数字化教学服务平台</div>
            <div className="text-muted-foreground/70">2026-2027学年 第一学期</div>
          </div>
        </footer>

        {/* Global Cart Modal Drawer */}
        <EnrollmentCartModal />
      </div>
    </QueryClientProvider>
  );
}
