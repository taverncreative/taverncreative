"use client";

import { motion } from "framer-motion";

interface MonthSelectorProps {
  onSelect: (monthLabel: string, dateStr: string) => void;
}

function getMonths(): { label: string; dateStr: string; isSummer: boolean }[] {
  const now = new Date();
  const months: { label: string; dateStr: string; isSummer: boolean }[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Start from next month, go 18 months
  let m = now.getMonth() + 1;
  let y = now.getFullYear();
  if (m > 11) { m = 0; y++; }

  for (let i = 0; i < 18; i++) {
    const month = (m + i) % 12;
    const year = y + Math.floor((m + i) / 12);
    const isSummer = month >= 5 && month <= 8; // Jun-Sep
    months.push({
      label: `${monthNames[month]} ${String(year).slice(-2)}`,
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-15`,
      isSummer,
    });
  }
  return months;
}

export function MonthSelector({ onSelect }: MonthSelectorProps) {
  const months = getMonths();

  return (
    <div className="w-full max-w-lg mx-auto text-center -mt-8">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl sm:text-4xl font-light text-white mb-2 drop-shadow-sm"
      >
        When&apos;s the big day?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-white/40 text-sm mb-6"
      >
        Pick your month
      </motion.p>

      <div className="flex flex-wrap gap-2.5 justify-center">
        {months.map((month, i) => (
          <motion.button
            key={month.label}
            initial={{ opacity: 0.3, scale: 0.9, y: 10 }}
            animate={{
              opacity: month.isSummer ? 1 : 0.8,
              scale: 1,
              y: 0,
            }}
            whileHover={{
              scale: 1.1,
              opacity: 1,
              y: -3,
              transition: { duration: 0.15 },
            }}
            whileTap={{ scale: 0.95 }}
            transition={{
              delay: i * 0.03,
              duration: 0.4,
              ease: "easeOut",
            }}
            onClick={() => onSelect(month.label, month.dateStr)}
            className={`relative rounded-full border backdrop-blur-sm font-medium transition-colors ${
              month.isSummer
                ? "px-5 py-2.5 text-sm border-white/25 bg-white/10 text-white"
                : "px-4 py-2 text-xs border-white/15 bg-white/[0.06] text-white/80"
            }`}
          >
            {/* Gentle pulse animation for summer months */}
            {month.isSummer && (
              <motion.span
                className="absolute inset-0 rounded-full bg-white/5"
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            )}
            <span className="relative">{month.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
