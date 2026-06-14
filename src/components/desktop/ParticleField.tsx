"use client";

/**
 * Particle field — weather + ambient particle effects on a single canvas.
 *
 * Renders three regimes driven by the environment store's weather:
 *  - rain/storm: streaking droplets (storm adds wind + occasional lightning),
 *  - snow: drifting flakes,
 *  - always: a sparse layer of slow ambient motes for depth.
 *
 * One canvas, one rAF loop, capped particle counts, DPR-aware. Honours
 * reduced-motion (renders a static frame). Pointer-events are disabled so it
 * never interferes with windows or the dock.
 */

import { useEffect, useRef } from "react";
import { useEnvironmentStore } from "@/store/environment-store";
import { useSettingsStore } from "@/store/settings-store";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
}

export function ParticleField() {
  const condition = useEnvironmentStore((s) => s.weather.condition);
  const windKph = useEnvironmentStore((s) => s.weather.windKph);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle counts scale with regime (capped for performance).
    const weatherCount =
      condition === "rain" || condition === "storm"
        ? 220
        : condition === "snow"
          ? 140
          : 0;
    const ambientCount = 36;

    const wind = (windKph / 38) * 1.6; // normalised horizontal drift

    const makeWeather = (): Particle => {
      const snow = condition === "snow";
      return {
        x: Math.random() * width,
        y: Math.random() * -height,
        vx: snow ? (Math.random() - 0.5) * 0.6 + wind * 0.4 : wind,
        vy: snow ? 0.6 + Math.random() * 0.8 : 8 + Math.random() * 6,
        size: snow ? 1.5 + Math.random() * 2.5 : 1 + Math.random() * 1.5,
        life: 1,
      };
    };

    const makeAmbient = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.1 - Math.random() * 0.2,
      size: 0.6 + Math.random() * 1.6,
      life: Math.random(),
    });

    const weatherParticles = Array.from({ length: weatherCount }, makeWeather);
    const ambientParticles = Array.from({ length: ambientCount }, makeAmbient);

    let lightning = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Storm lightning flashes.
      if (condition === "storm" && Math.random() < 0.004) lightning = 1;
      if (lightning > 0) {
        ctx.fillStyle = `rgba(226,232,240,${lightning * 0.22})`;
        ctx.fillRect(0, 0, width, height);
        lightning = Math.max(0, lightning - 0.06);
      }

      // Ambient motes (always).
      for (const p of ambientParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.005;
        if (p.y < -5 || p.x < -5 || p.x > width + 5) Object.assign(p, makeAmbient(), { y: height + 5 });
        const alpha = 0.12 + Math.abs(Math.sin(p.life)) * 0.18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(199,210,254,${alpha})`;
        ctx.fill();
      }

      // Weather particles.
      const snow = condition === "snow";
      ctx.strokeStyle = "rgba(186,230,253,0.5)";
      ctx.lineWidth = 1;
      for (const p of weatherParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (snow) {
          p.x += Math.sin((p.y + p.x) * 0.02) * 0.4;
        }
        if (p.y > height + 10) Object.assign(p, makeWeather(), { y: -10 });
        if (p.x > width + 10) p.x = -10;
        if (p.x < -10) p.x = width + 10;

        if (snow) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(241,245,249,0.85)";
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.2, p.y - p.vy * 1.2);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    if (reducedMotion) {
      // Single static frame (no animation loop).
      draw();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [condition, windKph, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
    />
  );
}
