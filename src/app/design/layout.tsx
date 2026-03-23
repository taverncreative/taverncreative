"use client";

import { useRouter } from "next/navigation";
import { X, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("tc-sound-muted");
    if (stored !== null) setMuted(stored === "true");
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("tc-sound-muted", String(next));
    window.dispatchEvent(new CustomEvent("tc-mute-toggle", { detail: { muted: next } }));
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white overflow-hidden flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-5 py-4 z-20 relative">
        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium tracking-wide text-white/60 hover:text-white transition-colors"
        >
          TC
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>

      {/* Sound toggle */}
      <div className="absolute bottom-5 right-5 z-20">
        <button
          onClick={toggleMute}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
