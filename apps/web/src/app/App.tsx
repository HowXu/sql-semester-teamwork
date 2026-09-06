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

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

        <footer className="border-t border-border/70 py-6 text-center text-xs sm:text-sm text-muted-foreground">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
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
