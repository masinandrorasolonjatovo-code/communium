'use client';

import { useEffect, useState } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      const root = document.documentElement;
      const total = Math.max(root.scrollHeight - root.clientHeight, 0);
      const nextProgress = total > 0 ? clamp(window.scrollY / total, 0, 1) : 0;

      setIsScrollable(total > 24);
      setProgress(nextProgress);
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();
    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const visualProgress = isScrollable ? Math.max(progress, 0.014) : 0;
  const leadSparkPosition = clamp(visualProgress * 100, 3, 97);
  const trailSparkPosition = clamp(visualProgress * 100 - 11, 8, 92);

  return (
    <>
      <div
        className={isScrollable ? 'headerScrollProgress isVisible' : 'headerScrollProgress'}
        aria-hidden="true"
      >
        <span className="headerScrollProgressTrack" />
        <span
          className="headerScrollProgressFill"
          style={{
            transform: `scaleX(${visualProgress})`,
          }}
        />
        <span
          className="headerScrollProgressGlow"
          style={{
            transform: `translateX(${progress * 100}%) translateX(-100%)`,
          }}
        />
        <span
          className="headerScrollProgressSpark headerScrollProgressSparkLead"
          style={{
            left: `${leadSparkPosition}%`,
          }}
        />
        <span
          className="headerScrollProgressSpark headerScrollProgressSparkTrail"
          style={{
            left: `${trailSparkPosition}%`,
          }}
        />
      </div>

      <style jsx>{`
        .headerScrollProgress {
          position: relative;
          width: 100%;
          height: 6px;
          margin-top: 0;
          padding: 0;
          border-radius: 999px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(-2px);
          transition:
            opacity 180ms ease,
            transform 180ms ease;
          pointer-events: none;
          background: transparent;
          box-shadow: none;
        }

        .headerScrollProgress.isVisible {
          opacity: 1;
          transform: translateY(0);
        }

        .headerScrollProgressTrack,
        .headerScrollProgressFill,
        .headerScrollProgressGlow {
          position: absolute;
          inset: 0;
          border-radius: 999px;
        }

        .headerScrollProgressTrack {
          background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(148, 163, 184, 0.2), rgba(59, 130, 246, 0.16));
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.08),
            inset 0 -1px 2px rgba(15, 23, 42, 0.08);
        }

        .headerScrollProgressFill {
          transform-origin: left center;
          background:
            linear-gradient(90deg, var(--brand-700), var(--brand-500) 46%, var(--teal-500) 100%);
          box-shadow:
            0 0 0 1px rgba(59, 130, 246, 0.16),
            0 6px 16px rgba(37, 99, 235, 0.24);
          transition: transform 120ms linear;
        }

        .headerScrollProgressFill::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 16% 52%, rgba(255, 255, 255, 0.9) 0 1.4px, transparent 2.7px),
            radial-gradient(circle at 38% 36%, rgba(255, 255, 255, 0.74) 0 1.1px, transparent 2.5px),
            radial-gradient(circle at 62% 70%, rgba(255, 255, 255, 0.66) 0 1.3px, transparent 2.7px),
            radial-gradient(circle at 82% 34%, rgba(255, 255, 255, 0.72) 0 1.2px, transparent 2.6px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0) 32%, rgba(255, 255, 255, 0.18) 58%, rgba(255, 255, 255, 0) 84%);
          mix-blend-mode: screen;
          opacity: 0.96;
          animation: progressSparkleDrift 3.4s linear infinite;
        }

        .headerScrollProgressGlow {
          width: 14%;
          inset: 1px auto 1px 0;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.58),
            rgba(255, 255, 255, 0)
          );
          filter: blur(2px);
          mix-blend-mode: screen;
          transition: transform 120ms linear;
        }

        .headerScrollProgressSpark {
          position: absolute;
          top: 50%;
          border-radius: 999px;
          pointer-events: none;
          transform: translate(-50%, -50%);
          mix-blend-mode: screen;
        }

        .headerScrollProgressSpark::before,
        .headerScrollProgressSpark::after {
          content: '';
          position: absolute;
          inset: 50% auto auto 50%;
          transform: translate(-50%, -50%);
          border-radius: 999px;
        }

        .headerScrollProgressSparkLead {
          width: 10px;
          height: 10px;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.42));
          animation: progressSparkPulse 2.1s ease-in-out infinite;
        }

        .headerScrollProgressSparkLead::before {
          width: 10px;
          height: 10px;
          background:
            linear-gradient(90deg, transparent 44%, rgba(255, 255, 255, 0.96) 46%, rgba(255, 255, 255, 0.96) 54%, transparent 56%),
            linear-gradient(0deg, transparent 44%, rgba(255, 255, 255, 0.96) 46%, rgba(255, 255, 255, 0.96) 54%, transparent 56%);
        }

        .headerScrollProgressSparkLead::after {
          width: 3px;
          height: 3px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.62);
        }

        .headerScrollProgressSparkTrail {
          width: 7px;
          height: 7px;
          opacity: 0.76;
          filter: drop-shadow(0 0 6px rgba(103, 232, 249, 0.38));
          animation: progressSparkFloat 2.8s ease-in-out infinite;
        }

        .headerScrollProgressSparkTrail::before {
          width: 7px;
          height: 7px;
          background:
            linear-gradient(90deg, transparent 45%, rgba(191, 219, 254, 0.92) 47%, rgba(191, 219, 254, 0.92) 53%, transparent 55%),
            linear-gradient(0deg, transparent 45%, rgba(191, 219, 254, 0.92) 47%, rgba(191, 219, 254, 0.92) 53%, transparent 55%);
        }

        .headerScrollProgressSparkTrail::after {
          width: 2px;
          height: 2px;
          background: rgba(191, 219, 254, 0.88);
        }

        @keyframes progressSparkleDrift {
          0% {
            transform: translateX(-10%);
            opacity: 0.76;
          }

          50% {
            transform: translateX(4%);
            opacity: 1;
          }

          100% {
            transform: translateX(10%);
            opacity: 0.8;
          }
        }

        @keyframes progressSparkPulse {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(0.96);
            opacity: 0.88;
          }

          50% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 1;
          }
        }

        @keyframes progressSparkFloat {
          0%,
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0.92);
          }

          50% {
            transform: translate(-50%, calc(-50% - 1px)) rotate(22deg) scale(1.06);
          }
        }

        @media (max-width: 980px) {
          .headerScrollProgress {
            height: 5px;
            transform: translateY(-1px);
          }
        }

        @media (max-width: 640px) {
          .headerScrollProgress {
            height: 4px;
          }
        }
      `}</style>
    </>
  );
}
