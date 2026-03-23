import { useState, useEffect } from "react";
import type { FontRegistryEntry } from "./types";

export function useFontLoader(families: string[]) {
  const [fontsReady, setFontsReady] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const [registry, setRegistry] = useState<FontRegistryEntry[]>([]);

  useEffect(() => {
    fetch("/font-registry.json")
      .then((r) => r.json())
      .then((data: FontRegistryEntry[]) => setRegistry(data))
      .catch(() => setRegistry([]));
  }, []);

  useEffect(() => {
    if (registry.length === 0 || families.length === 0) return;

    let cancelled = false;

    // Absolute safety timeout — 5 seconds max wait
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        setFontsReady(true);
        setLoadVersion((v) => v + 1);
      }
    }, 5000);

    async function load() {
      // Load each font via FontFace API
      for (const family of families) {
        // Skip if already available
        try {
          if (document.fonts.check(`48px '${family}'`)) continue;
        } catch {
          // check can throw on some browsers
        }

        const entry = registry.find(
          (r) => r.family === family || r.family.toLowerCase() === family.toLowerCase()
        );
        if (!entry) continue;

        try {
          const url = `/Fonts/${encodeURIComponent(entry.file)}`;
          const face = new FontFace(family, `url(${url})`);
          const loaded = await face.load();
          document.fonts.add(loaded);
        } catch {
          // Font load failed — will use fallback
        }
      }

      // Wait for browser to fully process all added fonts
      try {
        await document.fonts.ready;
      } catch {
        // fonts.ready can reject in some edge cases
      }

      // Extra delay to ensure DOM layout picks up the new fonts
      await new Promise((r) => setTimeout(r, 100));

      // Verify at least one custom font loaded
      let anyLoaded = false;
      for (const family of families) {
        try {
          if (document.fonts.check(`48px '${family}'`)) {
            anyLoaded = true;
            break;
          }
        } catch {
          // ignore
        }
      }

      if (!cancelled) {
        setFontsReady(true);
        setLoadVersion((v) => v + 1);
        clearTimeout(safetyTimeout);

        // If fonts loaded, bump version again after another short delay
        // to catch any late-arriving font rendering
        if (anyLoaded) {
          setTimeout(() => {
            if (!cancelled) setLoadVersion((v) => v + 1);
          }, 200);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, [families, registry]);

  return { fontsReady, loadVersion };
}
