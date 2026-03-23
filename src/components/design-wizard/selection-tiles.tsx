"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Tile {
  id: string;
  label: string;
  step: string;
}

interface SelectionTilesProps {
  tiles: Tile[];
  onTileClick: (step: string) => void;
}

export function SelectionTiles({ tiles, onTileClick }: SelectionTilesProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center px-4 min-h-[32px]">
      <AnimatePresence mode="popLayout">
        {tiles.map((tile) => (
          <motion.button
            key={tile.id}
            layout
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            onClick={() => onTileClick(tile.step)}
            className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-medium backdrop-blur-sm border border-white/10 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
          >
            {tile.label}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
