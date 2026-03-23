import { useRef, useEffect, useCallback } from "react";

export function useTextMeasurement() {
  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const span = document.createElement("span");
    span.style.cssText =
      "position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:-9999px;pointer-events:none";
    document.body.appendChild(span);
    spanRef.current = span;
    return () => {
      document.body.removeChild(span);
      spanRef.current = null;
    };
  }, []);

  const measure = useCallback(
    (
      text: string,
      fontFamily: string,
      fontSize: number,
      fontWeight: number,
      isUppercase: boolean,
      letterSpacing?: number
    ): { width: number; height: number } => {
      const span = spanRef.current;
      if (!span) return { width: 0, height: fontSize * 1.2 };

      // Set properties separately — shorthand `font` can silently fail
      span.style.fontFamily = `'${fontFamily}', sans-serif`;
      span.style.fontSize = `${fontSize}px`;
      span.style.fontWeight = String(fontWeight);
      span.style.textTransform = isUppercase ? "uppercase" : "none";
      span.style.letterSpacing = letterSpacing ? `${letterSpacing}em` : "normal";
      span.style.lineHeight = "1.2";
      span.textContent = text;

      // Force layout
      const width = span.offsetWidth;
      const height = span.offsetHeight;

      return { width: width || 0, height: height || fontSize * 1.2 };
    },
    []
  );

  return measure;
}
