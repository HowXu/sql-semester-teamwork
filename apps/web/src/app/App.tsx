import { useState } from "react";
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

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>("timetable");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
        <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
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
        </main>

        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>小学期数据库系统综合实践 · 高性能单机 SQLite / Hono.js / React 19</div>
            <div className="font-mono text-[11px]">TweakCN Light Green 设计规范 · 严格零 Emoji</div>
          </div>
        </footer>

        {/* Global Cart Modal Drawer */}
        <EnrollmentCartModal />
      </div>
    </QueryClientProvider>
  );
}
