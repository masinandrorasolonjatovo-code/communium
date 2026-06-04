'use client';

import type { ReactNode } from 'react';

interface PageHeroProps {
  label: string;
  title: string;
  description: string;
  actions?: ReactNode;
  rightContent?: ReactNode;
  variant?: 'default' | 'auth' | 'compact';
  className?: string;
}

export default function PageHero({
  label,
  title,
  description,
  actions,
  rightContent,
  variant = 'default',
  className = '',
}: PageHeroProps) {
  const hasRightContent = Boolean(rightContent);
  const heroClassName = [
    'pageHero',
    `pageHero--${variant}`,
    hasRightContent ? 'hasRightContent' : 'noRightContent',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={heroClassName}>
      <div className="pageHeroMain">
        <span className="pageHeroLabel">{label}</span>
        <h1 className="pageHeroTitle">{title}</h1>
        <p className="pageHeroDescription">{description}</p>
        {actions ? <div className="pageHeroActionRow">{actions}</div> : null}
      </div>

      {rightContent ? <div className="pageHeroRight">{rightContent}</div> : null}

      <style jsx>{`
        .pageHero {
          display: grid;
          gap: clamp(18px, 2.4vw, 28px);
          align-items: start;
        }

        .pageHero.hasRightContent {
          grid-template-columns: minmax(0, 1.14fr) minmax(320px, 0.86fr);
        }

        .pageHero.noRightContent {
          grid-template-columns: minmax(0, 1fr);
        }

        .pageHeroMain {
          min-width: 0;
          display: grid;
          gap: 12px;
          align-content: start;
        }

        .pageHero.noRightContent .pageHeroMain {
          max-width: 980px;
          margin-inline: auto;
        }

        .pageHeroLabel {
          width: fit-content;
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          padding: 0 11px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(239, 246, 255, 0.98), rgba(219, 234, 254, 0.9));
          color: #1d4ed8;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .pageHeroTitle {
          margin: 0;
          max-width: 900px;
          color: #0f172a;
          font-size: clamp(2rem, 3.15vw, 3.6rem);
          line-height: 1.02;
          letter-spacing: -0.055em;
          text-wrap: balance;
        }

        .pageHeroDescription {
          margin: 0;
          max-width: 720px;
          color: #64748b;
          font-size: 1rem;
          line-height: 1.72;
          text-wrap: pretty;
        }

        .pageHeroActionRow {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 4px;
        }

        .pageHeroRight {
          min-width: 0;
          display: grid;
          gap: 14px;
          align-content: start;
        }

        .pageHero--auth .pageHeroMain {
          max-width: 100%;
          margin-inline: 0;
        }

        .pageHero--auth .pageHeroTitle {
          max-width: 760px;
          font-size: clamp(1.9rem, 2.8vw, 3rem);
          line-height: 1.04;
        }

        .pageHero--auth .pageHeroDescription {
          max-width: 640px;
          font-size: 0.98rem;
        }

        .pageHero--compact .pageHeroTitle {
          font-size: clamp(1.85rem, 2.8vw, 2.7rem);
          line-height: 1.06;
        }

        @media (max-width: 1100px) {
          .pageHero.hasRightContent {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .pageHero {
            gap: 16px;
          }

          .pageHeroTitle {
            font-size: clamp(1.85rem, 9vw, 2.8rem);
            line-height: 1.04;
          }

          .pageHeroDescription {
            font-size: 0.96rem;
            line-height: 1.68;
          }

          .pageHeroActionRow {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </section>
  );
}
