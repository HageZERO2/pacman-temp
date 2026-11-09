import { useEffect, useRef } from 'react';

/**
 * Canvas helper: sizes the canvas for the device pixel ratio and runs `draw` once,
 * or every animation frame when `animate` is set. Animation stops on unmount.
 */
export function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
  width: number,
  height: number,
  animate = false,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawRef.current(ctx, width, height, (now - start) / 1000);
      if (animate) raf = requestAnimationFrame(frame);
    };
    frame(start);
    return () => cancelAnimationFrame(raf);
  }, [width, height, animate]);

  return ref;
}
