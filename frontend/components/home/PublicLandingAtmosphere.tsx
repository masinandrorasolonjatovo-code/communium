'use client';

import { useEffect, useRef } from 'react';

interface SmokeBlob {
  alpha: number;
  driftX: number;
  driftY: number;
  hueOffset: number;
  orbit: number;
  radius: number;
  seed: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createSmokeBlobs(width: number, height: number) {
  return Array.from({ length: 16 }, (_, index) => {
    const seed = (index + 1) * 0.83;

    return {
      alpha: 0.035 + Math.random() * 0.045,
      driftX: 90 + Math.random() * 180,
      driftY: 80 + Math.random() * 220,
      hueOffset: [208, 190, 282, 324, 0][index % 5],
      orbit: 0.1 + Math.random() * 0.22,
      radius: 140 + Math.random() * 160,
      seed,
      velocityX: 0,
      velocityY: 0,
      x: Math.random() * width,
      y: Math.random() * height,
    } satisfies SmokeBlob;
  });
}

function hsla(hue: number, saturation: number, lightness: number, alpha: number) {
  return `hsla(${hue} ${saturation}% ${lightness}% / ${alpha})`;
}

function drawMist(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.12, x, y, radius);

  gradient.addColorStop(0, color);
  gradient.addColorStop(0.28, color.replace(/\/ [^)]+\)$/, '/ 0.55)'));
  gradient.addColorStop(0.7, color.replace(/\/ [^)]+\)$/, '/ 0.15)'));
  gradient.addColorStop(1, color.replace(/\/ [^)]+\)$/, '/ 0)'));

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export default function PublicLandingAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    const pointer = {
      active: false,
      pulse: 0,
      targetX: 0,
      targetY: 0,
      x: 0,
      y: 0,
    };

    const scrollState = {
      ratio: 0,
      targetRatio: 0,
    };

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let smoke = createSmokeBlobs(window.innerWidth, window.innerHeight);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      smoke = createSmokeBlobs(width, height);

      if (!pointer.x && !pointer.y) {
        pointer.x = width * 0.5;
        pointer.y = height * 0.36;
        pointer.targetX = pointer.x;
        pointer.targetY = pointer.y;
      }
    };

    const updateScrollRatio = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollState.targetRatio = clamp(window.scrollY / maxScroll, 0, 1);
    };

    const pointToClient = (clientX: number, clientY: number, pulseBoost = 0.6) => {
      pointer.active = true;
      pointer.targetX = clientX;
      pointer.targetY = clientY;
      pointer.pulse = Math.max(pointer.pulse, pulseBoost);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointToClient(event.clientX, event.clientY, 0.24);
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointToClient(event.clientX, event.clientY, 1.2);
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const anchor = target?.closest(
        'a, button, [role="button"], .featureCard, .planCard, .publicProfileCard, .testimonialCard, .heroFactCard, .showcasePrimaryCard, .showcaseSecondaryCard',
      ) as HTMLElement | null;

      if (!anchor) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      pointToClient(rect.left + rect.width / 2, rect.top + rect.height / 2, 1);
    };

    const renderFrame = (timestamp: number) => {
      const time = timestamp * 0.001;

      scrollState.ratio += (scrollState.targetRatio - scrollState.ratio) * 0.08;

      const autoX =
        width * (0.52 + Math.sin(time * 0.44) * 0.22 + Math.cos(time * 0.19 + scrollState.ratio * 3.2) * 0.08);
      const autoY =
        height * (0.44 + Math.cos(time * 0.37 + scrollState.ratio * 4.1) * 0.18 + scrollState.ratio * 0.08);

      if (!pointer.active) {
        pointer.targetX = autoX;
        pointer.targetY = autoY;
      }

      pointer.x += (pointer.targetX - pointer.x) * 0.09;
      pointer.y += (pointer.targetY - pointer.y) * 0.09;
      pointer.pulse *= 0.94;

      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = 'screen';
      context.filter = 'blur(20px) saturate(128%)';

      drawMist(
        context,
        width * 0.16,
        height * (0.18 + scrollState.ratio * 0.08),
        240 + Math.sin(time * 0.7) * 34,
        hsla(210, 96, 70, 0.14),
      );
      drawMist(
        context,
        width * 0.82,
        height * (0.24 + scrollState.ratio * 0.12),
        220 + Math.cos(time * 0.76) * 30,
        hsla(324, 100, 78, 0.16),
      );
      drawMist(
        context,
        width * 0.56,
        height * (0.72 - scrollState.ratio * 0.14),
        260 + Math.sin(time * 0.54 + 0.8) * 38,
        hsla(188, 96, 72, 0.14),
      );

      smoke.forEach((blob, index) => {
        const driftX = width * 0.5 + Math.sin(time * blob.orbit + blob.seed) * blob.driftX;
        const driftY = height * 0.5 + Math.cos(time * (blob.orbit * 0.86) + blob.seed * 1.2) * blob.driftY;

        const dx = pointer.x - blob.x;
        const dy = pointer.y - blob.y;
        const distance = Math.hypot(dx, dy) || 1;
        const influence = Math.max(0, 1 - distance / Math.max(width, height));
        const pulseBoost = 1 + pointer.pulse * 0.9;

        blob.velocityX += (driftX - blob.x) * 0.0024;
        blob.velocityY += (driftY - blob.y) * 0.0026;
        blob.velocityX += (dx / distance) * 0.26 * influence * pulseBoost;
        blob.velocityY += (dy / distance) * 0.22 * influence * pulseBoost;

        blob.velocityX *= 0.965;
        blob.velocityY *= 0.965;
        blob.x += blob.velocityX;
        blob.y += blob.velocityY;

        const radius =
          blob.radius *
          (0.92 +
            Math.sin(time * (0.9 + index * 0.04) + blob.seed * 1.6) * 0.14 +
            pointer.pulse * 0.12 * influence);
        const hue = (blob.hueOffset + time * 18 + scrollState.ratio * 92 + index * 8) % 360;
        const lightness = blob.hueOffset === 0 ? 98 : blob.hueOffset > 300 ? 78 : 70;
        const color = hsla(hue, blob.hueOffset === 0 ? 0 : 92, lightness, blob.alpha);

        drawMist(context, blob.x, blob.y, radius, color);
        drawMist(context, blob.x + radius * 0.16, blob.y - radius * 0.12, radius * 0.72, color);
      });

      context.restore();
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    resizeCanvas();
    updateScrollRatio();
    animationFrame = window.requestAnimationFrame(renderFrame);

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', updateScrollRatio, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', updateScrollRatio);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  return (
    <div className="publicLandingAtmosphere" aria-hidden="true">
      <div className="publicLandingHalo publicLandingHaloLeft" />
      <div className="publicLandingHalo publicLandingHaloRight" />
      <div className="publicLandingHalo publicLandingHaloBottom" />
      <canvas ref={canvasRef} className="publicLandingSmokeCanvas" />

      <style jsx>{`
        .publicLandingAtmosphere {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .publicLandingAtmosphere::before,
        .publicLandingAtmosphere::after {
          content: '';
          position: absolute;
          inset: -14%;
          pointer-events: none;
        }

        .publicLandingAtmosphere::before {
          background:
            radial-gradient(circle at 20% 18%, rgba(96, 165, 250, 0.18), transparent 28%),
            radial-gradient(circle at 84% 16%, rgba(244, 114, 182, 0.16), transparent 24%),
            radial-gradient(circle at 50% 82%, rgba(45, 212, 191, 0.16), transparent 26%);
          filter: blur(34px);
          opacity: 0.34;
        }

        .publicLandingAtmosphere::after {
          background:
            linear-gradient(180deg, rgba(248, 250, 252, 0.55), rgba(248, 250, 252, 0)),
            radial-gradient(circle at center, rgba(255, 255, 255, 0.12), transparent 62%);
          mix-blend-mode: multiply;
          opacity: 0.22;
        }

        .publicLandingSmokeCanvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.32;
        }

        .publicLandingHalo {
          position: absolute;
          border-radius: 999px;
          filter: blur(42px);
          opacity: 0.26;
          animation: atmosphereHaloFloat 16s ease-in-out infinite;
        }

        .publicLandingHaloLeft {
          top: 12%;
          left: 4%;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(96, 165, 250, 0.4), transparent 72%);
        }

        .publicLandingHaloRight {
          top: 24%;
          right: 6%;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(244, 114, 182, 0.34), transparent 72%);
          animation-delay: -6s;
        }

        .publicLandingHaloBottom {
          left: 38%;
          bottom: 10%;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(45, 212, 191, 0.32), transparent 74%);
          animation-delay: -11s;
        }

        @keyframes atmosphereHaloFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(0.96);
          }

          50% {
            transform: translate3d(0, -18px, 0) scale(1.06);
          }
        }
      `}</style>
    </div>
  );
}
