'use client';

import type { ReactNode } from 'react';
import PublicLandingAtmosphere from '@/components/home/PublicLandingAtmosphere';

interface PublicExperienceFrameProps {
  children: ReactNode;
}

export default function PublicExperienceFrame({ children }: PublicExperienceFrameProps) {
  return (
    <div className="publicExperienceFrame">
      <PublicLandingAtmosphere />
      <div className="publicExperienceVeil" aria-hidden="true" />
      <div className="publicExperienceNoise" aria-hidden="true" />
      <div className="publicExperienceShell">{children}</div>

      <style jsx>{`
        .publicExperienceFrame {
          position: relative;
          min-height: 100vh;
          isolation: isolate;
          background:
            linear-gradient(180deg, #fbfdff 0%, #f4f8ff 42%, #edf3fb 100%),
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 24%),
            radial-gradient(circle at top right, rgba(96, 165, 250, 0.06), transparent 20%),
            radial-gradient(circle at bottom center, rgba(14, 165, 233, 0.05), transparent 18%);
        }

        .publicExperienceVeil,
        .publicExperienceNoise {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .publicExperienceVeil {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(247, 250, 255, 0.8)),
            radial-gradient(circle at 20% 14%, rgba(255, 255, 255, 0.32), transparent 20%),
            radial-gradient(circle at 80% 18%, rgba(255, 255, 255, 0.22), transparent 18%);
        }

        .publicExperienceNoise {
          opacity: 0.12;
          background-image:
            linear-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.05) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.8) 60%, transparent 92%);
        }

        .publicExperienceShell {
          position: relative;
          z-index: 1;
        }

        html[data-theme='dark'] .publicExperienceFrame {
          background:
            linear-gradient(180deg, #08101d 0%, #0c1527 42%, #101827 100%),
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 24%),
            radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 20%);
        }

        html[data-theme='dark'] .publicExperienceVeil {
          background:
            linear-gradient(180deg, rgba(8, 16, 29, 0.58), rgba(8, 16, 29, 0.8)),
            radial-gradient(circle at 18% 12%, rgba(59, 130, 246, 0.12), transparent 20%),
            radial-gradient(circle at 82% 20%, rgba(45, 212, 191, 0.08), transparent 18%);
        }

        html[data-theme='dark'] .publicExperienceNoise {
          opacity: 0.1;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
}
