import type { TargetAndTransition, Variants } from "motion/react";

export const conflictShakeVariants: Variants = {
  idle: { x: 0 },
  conflict: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.35, ease: "easeInOut" },
  },
};

export const cardInteractiveProps = {
  whileHover: {
    y: -2,
    transition: { duration: 0.2, ease: "easeOut" },
  } as TargetAndTransition,
  whileTap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  } as TargetAndTransition,
};

export const timetableContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.05,
    },
  },
};

export const timetableCellVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
};

export const pageFadeVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};
