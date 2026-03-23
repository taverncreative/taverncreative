"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StepContainerProps {
  stepKey: string;
  direction: number; // 1 = forward, -1 = backward
  children: React.ReactNode;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
};

export function StepContainer({ stepKey, direction, children }: StepContainerProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.25 },
          scale: { duration: 0.25 },
        }}
        className="absolute inset-0 flex items-center justify-center px-4"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
