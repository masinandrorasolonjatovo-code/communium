import Link from 'next/link';
import {
  ArrowRight,
  Crown,
  FileText,
  Globe2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { Locale } from '@/i18n.config';

interface PublicImmersionSectionProps {
  locale: Locale;
  signUpHref: string;
  exploreHref: string;
}

export default function PublicImmersionSection({ locale, signUpHref, exploreHref }: PublicImmersionSectionProps) {
  const isFrench = locale === 'fr';
  const isArabic = locale === 'ar';
  const t = (fr: string, en: string, ar: string) => (isArabic ? ar : isFrench ? fr : en);

  const leadSignals = [
    {
      icon: Globe2,
      title: t(
        'Un profil lisible des le premier regard',
        'A profile that reads clearly at first glance',
        'ملف واضح من النظرة الأولى',
      ),
      text: t(
        'Presence publique nette, moderne et facile a comprendre.',
        'A public presence that feels clear, modern and easy to understand.',
        'حضور عام واضح وحديث وسهل الفهم.',
      ),
    },
    {
      icon: FileText,
      title: t('Un CV pret a partager', 'A resume that is ready to share', 'سيرة ذاتية جاهزة للمشاركة'),
      text: t(
        'Visible seulement quand vous le choisissez.',
        'Visible only when you choose to share it.',
        'تظهر فقط عندما تختار أنت ذلك.',
      ),
    },
    {
      icon: UsersRound,
      title: t('Un reseau qui reste qualifie', 'A network that stays qualified', 'شبكة مهنية تبقى مؤهلة'),
      text: t(
        'Connexions, suggestions et activite dans un cadre plus propre.',
        'Connections, suggestions and activity inside a cleaner surface.',
        'اتصالات واقتراحات ونشاط داخل مساحة أكثر وضوحًا.',
      ),
    },
  ];

  const profileStates = [
    {
      label: t('Profil public', 'Public profile', 'الملف العام'),
      value: t('Pret', 'Ready', 'جاهز'),
    },
    {
      label: t('CV', 'Resume', 'السيرة الذاتية'),
      value: t('Partageable', 'Shareable', 'قابلة للمشاركة'),
    },
    {
      label: t('Reseau', 'Network', 'الشبكة'),
      value: t('Actif', 'Active', 'نشطة'),
    },
  ];

  const networkPills = isArabic
    ? ['الملفات', 'الاتصالات', 'الاقتراحات']
    : isFrench
      ? ['Profils', 'Connexions', 'Suggestions']
      : ['Profiles', 'Connections', 'Suggestions'];

  return (
    <section className="immersionSection" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="immersionLead">
        <span className="immersionEyebrow">EXPERIENCE COMMUNIUM</span>
        <h2>{t('Une presence professionnelle qui prend vie.', 'A professional presence that comes alive.', 'حضور مهني ينبض بالحياة.')}</h2>
        <p>
          {t(
            'Profil, publications, CV et visibilite reunis dans une interface claire, moderne et facile a comprendre.',
            'Profile, publishing, resume and visibility brought together in one clear, modern and easy-to-read interface.',
            'الملف والمنشورات والسيرة الذاتية والظهور المهني مجتمعة في واجهة واضحة وحديثة وسهلة الفهم.',
          )}
        </p>

        <div className="immersionActionRow">
          <Link href={signUpHref} className="immersionPrimaryButton">
            {t('Creer mon profil', 'Create my profile', 'أنشئ ملفي')}
          </Link>
          <Link href={exploreHref} className="immersionGhostButton">
            {t('Explorer la plateforme', 'Explore the platform', 'استكشف المنصة')}
          </Link>
        </div>

        <div className="immersionSignalList">
          {leadSignals.map((signal) => {
            const Icon = signal.icon;

            return (
              <article key={signal.title} className="immersionSignalCard">
                <span className="immersionSignalIcon">
                  <Icon className="miniIcon" strokeWidth={2.1} />
                </span>
                <div>
                  <strong>{signal.title}</strong>
                  <p>{signal.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="immersionMediaColumn">
        <article className="immersionHeroMockup">
          <div className="immersionTopbar">
            <span className="immersionDot red" />
            <span className="immersionDot amber" />
            <span className="immersionDot blue" />
            <span className="immersionTopbarLabel">communium.app/presence</span>
          </div>

          <div className="immersionHeroCanvas">
            <div className="canvasGrid" aria-hidden="true" />
            <span className="canvasGlow glowOne" aria-hidden="true" />
            <span className="canvasGlow glowTwo" aria-hidden="true" />

            <div className="immersionProfileWindow">
            <span className="immersionWindowEyebrow">{t('Apercu produit', 'Product preview', 'معاينة المنتج')}</span>

              <div className="immersionIdentityRow">
                <span className="immersionAvatar" aria-hidden="true">
                  <span className="immersionAvatarGlow" />
                  <UserRound className="immersionAvatarIcon" strokeWidth={2.1} />
                  <span className="immersionAvatarBadge">SB</span>
                </span>

                <div className="immersionIdentityCopy">
                  <strong>Sofia Benkirane</strong>
                  <span>{t('Strategiste produit', 'Product strategist', 'استراتيجية منتجات')}</span>
                  <small>{t('Fes, Maroc', 'Fez, Morocco', 'فاس، المغرب')}</small>
                </div>

                <span className="immersionVerifiedBadge">
                  <ShieldCheck className="miniIcon" strokeWidth={2.1} />
                  {t('Profil verifie', 'Verified profile', 'ملف موثّق')}
                </span>
              </div>

              <div className="immersionStateGrid">
                {profileStates.map((state) => (
                  <article key={state.label} className="immersionStateCard">
                    <small>{state.label}</small>
                    <strong>{state.value}</strong>
                  </article>
                ))}
              </div>

              <div className="immersionRecentPost">
                <span className="immersionPostEyebrow">{t('Publication recente', 'Recent post', 'منشور حديث')}</span>
                <p>
                  {t(
                    'Presentation d un projet produit pour ameliorer la visibilite professionnelle.',
                    'Presentation of a product project designed to improve professional visibility.',
                    'عرض مشروع منتج يهدف إلى تحسين الظهور المهني.',
                  )}
                </p>

                <Link href={exploreHref} className="immersionInlineLink">
                  {t('Voir le profil', 'View profile', 'عرض الملف')}
                  <ArrowRight className="miniIcon" strokeWidth={2.1} />
                </Link>
              </div>
            </div>
          </div>
        </article>

        <div className="immersionMiniGrid">
          <article className="immersionMiniCard">
            <div className="immersionMiniCanvas networkCanvas">
              <span className="miniGlow glowOne" aria-hidden="true" />
              <div className="networkCluster" aria-hidden="true">
                <span className="networkPill lead">{networkPills[0]}</span>
                <span className="networkPill side">{networkPills[1]}</span>
                <span className="networkPill side alt">{networkPills[2]}</span>
                <span className="networkLine lineOne" />
                <span className="networkLine lineTwo" />
              </div>

              <div className="immersionMiniPanel">
                <span className="immersionMiniBadge">
                  <UsersRound className="miniIcon" strokeWidth={2.1} />
                  {t('Reseautage professionnel', 'Professional networking', 'شبكات مهنية')}
                </span>
                <strong>{t('Des connexions qui restent utiles.', 'Connections that stay useful.', 'اتصالات تبقى مفيدة فعلًا.')}</strong>
                <p>
                  {t(
                    'Profils, suggestions et interactions dans un cadre plus lisible.',
                    'Profiles, suggestions and interactions inside a clearer experience.',
                    'ملفات واقتراحات وتفاعلات داخل تجربة أكثر وضوحًا.',
                  )}
                </p>
              </div>
            </div>
          </article>

          <article className="immersionMiniCard premium">
            <div className="immersionMiniCanvas premiumCanvas">
              <span className="miniGlow glowTwo" aria-hidden="true" />
              <div className="premiumStack" aria-hidden="true">
                <span className="premiumTag">{t('Pack Gold', 'Gold pack', 'باقة Gold')}</span>
                <div className="premiumFeatureCard">
                  <strong>{t('Profil mis en avant', 'Profile highlighted', 'ملف مميز')}</strong>
                  <small>{t('Visible dans les suggestions', 'Visible in suggestions', 'ظاهر داخل الاقتراحات')}</small>
                </div>
                <div className="premiumFeatureCard">
                  <strong>{t('CV partageable', 'Shareable resume', 'سيرة ذاتية قابلة للمشاركة')}</strong>
                  <small>{t('Pret pour les bons contacts', 'Ready for the right contacts', 'جاهزة للجهات المناسبة')}</small>
                </div>
              </div>

              <div className="immersionMiniPanel">
                <span className="immersionMiniBadge premium">
                  <Crown className="miniIcon" strokeWidth={2.1} />
                  {t('Visibilite premium', 'Premium visibility', 'ظهور بريميوم')}
                </span>
                <strong>
                  {t(
                    'Une mise en avant sobre et credible.',
                    'A premium boost that stays refined and credible.',
                    'تعزيز راقٍ وموثوق للظهور.',
                  )}
                </strong>
                <p>
                  {t(
                    'Le profil, le CV et la publication gagnent en clarte au bon moment.',
                    'Profile, resume and publishing gain clarity at the right moment.',
                    'الملف والسيرة الذاتية والمنشورات تكتسب وضوحًا أكبر في الوقت المناسب.',
                  )}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <style jsx>{`
        .immersionSection {
          --immersion-ease: cubic-bezier(0.22, 1, 0.36, 1);
          --immersion-dur: 0.45s;
          --immersion-slow: 0.62s;
          --immersion-ink: #0f172a;
          --immersion-muted: #5b687b;
          --immersion-line: rgba(148, 163, 184, 0.14);
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: clamp(1.5rem, 3vw, 2.5rem);
          align-items: stretch;
          overflow: hidden;
          padding: clamp(1.75rem, 4vw, 3rem) clamp(1.25rem, 3vw, 2rem);
          border-radius: clamp(24px, 3vw, 34px);
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at 12% 0%, rgba(59, 130, 246, 0.06), transparent 38%),
            linear-gradient(185deg, rgba(253, 254, 255, 0.94) 0%, rgba(241, 247, 255, 0.88) 100%);
          box-shadow: 0 32px 72px rgba(15, 23, 42, 0.07);
          backdrop-filter: blur(20px);
        }

        .immersionLead,
        .immersionMediaColumn,
        .immersionSignalList,
        .immersionMiniGrid {
          display: grid;
          gap: 16px;
        }

        .immersionLead {
          align-content: center;
        }

        .immersionEyebrow {
          width: fit-content;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding: 0 13px;
          border-radius: 999px;
          background: rgba(219, 234, 254, 0.92);
          color: var(--brand-700);
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .immersionLead h2,
        .immersionLead p {
          margin: 0;
        }

        .immersionLead h2 {
          font-size: clamp(1.85rem, 3vw, 2.95rem);
          line-height: 1;
          letter-spacing: -0.05em;
          color: var(--immersion-ink);
        }

        .immersionLead p {
          max-width: 58ch;
          color: var(--immersion-muted);
          line-height: 1.7;
        }

        .immersionActionRow {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .immersionPrimaryButton,
        .immersionGhostButton {
          position: relative;
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid transparent;
          font-weight: 800;
          text-decoration: none;
          transition:
            transform var(--immersion-dur) var(--immersion-ease),
            box-shadow var(--immersion-slow) var(--immersion-ease),
            border-color var(--immersion-dur) ease,
            background var(--immersion-slow) ease,
            color var(--immersion-dur) ease;
        }

        .immersionPrimaryButton {
          color: #ffffff;
          background: linear-gradient(135deg, var(--brand-700), var(--brand-500));
          box-shadow:
            0 18px 36px rgba(37, 99, 235, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .immersionPrimaryButton:hover,
        .immersionGhostButton:hover {
          transform: translateY(-2px);
        }

        .immersionPrimaryButton:hover {
          box-shadow:
            0 26px 48px rgba(37, 99, 235, 0.3),
            0 0 40px rgba(56, 189, 248, 0.16);
        }

        .immersionGhostButton {
          color: var(--immersion-ink);
          background: rgba(255, 255, 255, 0.74);
          border-color: var(--immersion-line);
        }

        .immersionGhostButton:hover {
          border-color: rgba(59, 130, 246, 0.28);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
        }

        .immersionSignalList {
          gap: 10px;
        }

        .immersionSignalCard {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 14px;
          align-items: start;
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(255, 255, 255, 0.54);
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.04);
          transition:
            transform var(--immersion-dur) var(--immersion-ease),
            background var(--immersion-dur) var(--immersion-ease),
            border-color var(--immersion-dur) ease;
        }

        .immersionSignalCard:hover {
          transform: translateX(3px);
          background: rgba(255, 255, 255, 0.72);
          border-color: rgba(147, 197, 253, 0.34);
        }

        .immersionSignalIcon {
          width: 40px;
          height: 40px;
          display: inline-grid;
          place-items: center;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(29, 78, 216, 0.14), rgba(96, 165, 250, 0.18));
          color: var(--brand-700);
        }

        .immersionSignalCard strong,
        .immersionMiniPanel strong,
        .premiumFeatureCard strong,
        .immersionIdentityCopy strong,
        .immersionStateCard strong {
          display: block;
          color: var(--immersion-ink);
          letter-spacing: -0.02em;
        }

        .immersionSignalCard strong {
          font-size: 1rem;
          line-height: 1.35;
        }

        .immersionSignalCard p,
        .immersionMiniPanel p,
        .premiumFeatureCard small,
        .immersionIdentityCopy span,
        .immersionIdentityCopy small,
        .immersionStateCard small,
        .immersionRecentPost p {
          margin: 0;
          color: var(--immersion-muted);
          line-height: 1.62;
        }

        .immersionSignalCard p {
          margin-top: 4px;
        }

        .immersionHeroMockup,
        .immersionMiniCard {
          display: grid;
          gap: 14px;
          padding: 16px;
          border-radius: 30px;
          border: 1px solid rgba(203, 213, 225, 0.92);
          background:
            radial-gradient(circle at top right, rgba(96, 165, 250, 0.08), transparent 26%),
            linear-gradient(188deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 255, 0.94));
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
          transition:
            transform var(--immersion-slow) var(--immersion-ease),
            box-shadow var(--immersion-slow) var(--immersion-ease),
            border-color var(--immersion-dur) ease;
        }

        .immersionHeroMockup:hover,
        .immersionMiniCard:hover {
          transform: translateY(-4px);
          border-color: rgba(96, 165, 250, 0.34);
          box-shadow:
            0 28px 54px rgba(15, 23, 42, 0.1),
            0 0 42px rgba(59, 130, 246, 0.08);
        }

        .immersionMiniCard {
          border-radius: 24px;
          padding: 14px;
          border-color: rgba(148, 163, 184, 0.1);
        }

        .immersionMiniCard.premium {
          border-color: rgba(250, 204, 21, 0.28);
          background:
            radial-gradient(circle at top right, rgba(250, 204, 21, 0.14), transparent 30%),
            linear-gradient(180deg, rgba(255, 252, 242, 0.98), rgba(255, 248, 229, 0.96));
        }

        .immersionTopbar {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(248, 250, 252, 0.96);
          border: 1px solid rgba(203, 213, 225, 0.9);
          color: #475569;
        }

        .immersionDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }

        .immersionDot.red {
          background: #fb7185;
        }

        .immersionDot.amber {
          background: #fbbf24;
        }

        .immersionDot.blue {
          background: #60a5fa;
        }

        .immersionTopbarLabel {
          margin-left: 4px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .immersionHeroCanvas,
        .immersionMiniCanvas {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid rgba(203, 213, 225, 0.85);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
            linear-gradient(180deg, #ffffff, #f4f8ff);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            0 14px 30px rgba(15, 23, 42, 0.04);
        }

        .immersionHeroCanvas {
          min-height: 430px;
        }

        .immersionMiniCanvas {
          min-height: 248px;
        }

        .canvasGrid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent 100%);
          opacity: 0.34;
          pointer-events: none;
        }

        .canvasGlow,
        .miniGlow {
          position: absolute;
          border-radius: 999px;
          filter: blur(42px);
          opacity: 0.42;
          pointer-events: none;
        }

        .canvasGlow.glowOne {
          top: 28px;
          left: 28px;
          width: 180px;
          height: 180px;
          background: rgba(56, 189, 248, 0.13);
          animation: glowDrift 12s ease-in-out infinite alternate;
        }

        .canvasGlow.glowTwo {
          right: 42px;
          bottom: 58px;
          width: 210px;
          height: 210px;
          background: rgba(59, 130, 246, 0.1);
          animation: glowDrift 14s ease-in-out infinite alternate-reverse;
        }

        .miniGlow.glowOne {
          top: 16px;
          right: 22px;
          width: 120px;
          height: 120px;
          background: rgba(56, 189, 248, 0.12);
          animation: glowPulse 10s ease-in-out infinite;
        }

        .miniGlow.glowTwo {
          top: 20px;
          right: 18px;
          width: 130px;
          height: 130px;
          background: rgba(250, 204, 21, 0.12);
          animation: glowPulse 11s ease-in-out infinite;
        }

        .immersionProfileWindow {
          position: absolute;
          left: 28px;
          right: 28px;
          bottom: 28px;
          z-index: 1;
          display: grid;
          gap: 18px;
          padding: 22px;
          border-radius: 24px;
          border: 1px solid rgba(203, 213, 225, 0.88);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.93)),
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 30%);
          backdrop-filter: blur(18px);
          box-shadow:
            0 24px 48px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          animation: windowFloat 14s ease-in-out infinite;
        }

        .immersionWindowEyebrow,
        .immersionVerifiedBadge,
        .immersionMiniBadge,
        .premiumTag,
        .immersionPostEyebrow {
          width: fit-content;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .immersionWindowEyebrow,
        .immersionPostEyebrow {
          background: rgba(241, 245, 249, 0.96);
          border: 1px solid rgba(203, 213, 225, 0.88);
          color: #334155;
        }

        .immersionIdentityRow {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
        }

        .immersionAvatar {
          position: relative;
          isolation: isolate;
          width: 68px;
          height: 68px;
          display: inline-grid;
          place-items: center;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.92), rgba(56, 189, 248, 0.7));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 18px 40px rgba(37, 99, 235, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #ffffff;
        }

        .immersionAvatarGlow {
          position: absolute;
          inset: auto 10% -18% 10%;
          height: 44%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.24), transparent 70%);
          filter: blur(10px);
        }

        .immersionAvatarIcon {
          position: relative;
          z-index: 1;
          width: 1.78rem;
          height: 1.78rem;
          color: rgba(255, 255, 255, 0.96);
          filter: drop-shadow(0 6px 16px rgba(15, 23, 42, 0.22));
        }

        .immersionAvatarBadge {
          position: absolute;
          right: 6px;
          bottom: 6px;
          min-width: 21px;
          height: 21px;
          padding: 0 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.24);
          color: #f8fbff;
          font-size: 0.54rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          z-index: 2;
        }

        .immersionIdentityCopy {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .immersionIdentityCopy strong {
          color: #0f172a;
          font-size: 1.26rem;
          line-height: 1.08;
        }

        .immersionIdentityCopy span {
          color: #334155;
          font-size: 0.98rem;
          font-weight: 560;
        }

        .immersionIdentityCopy small {
          color: #64748b;
          font-size: 0.84rem;
        }

        .immersionVerifiedBadge {
          background: rgba(219, 234, 254, 0.94);
          border: 1px solid rgba(96, 165, 250, 0.24);
          color: #1d4ed8;
          white-space: nowrap;
        }

        .immersionStateGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .immersionStateCard {
          display: grid;
          gap: 6px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.95);
          background: rgba(248, 250, 252, 0.98);
        }

        .immersionStateCard small {
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .immersionStateCard strong {
          color: #0f172a;
          font-size: 1rem;
          line-height: 1.3;
        }

        .immersionRecentPost {
          display: grid;
          gap: 10px;
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid rgba(226, 232, 240, 0.95);
          background: rgba(248, 250, 252, 0.98);
        }

        .immersionRecentPost p {
          color: #334155;
          font-size: 1rem;
          line-height: 1.6;
        }

        .immersionInlineLink {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          color: #2563eb;
          font-weight: 800;
          text-decoration: none;
          transition: color var(--immersion-dur) ease, transform var(--immersion-dur) var(--immersion-ease);
        }

        .immersionInlineLink:hover {
          color: #1d4ed8;
          transform: translateX(2px);
        }

        .immersionSection[dir='rtl'] .immersionLead,
        .immersionSection[dir='rtl'] .immersionSignalCard,
        .immersionSection[dir='rtl'] .immersionIdentityCopy,
        .immersionSection[dir='rtl'] .immersionRecentPost,
        .immersionSection[dir='rtl'] .immersionMiniPanel {
          text-align: right;
        }

        .immersionSection[dir='rtl'] .immersionIdentityRow,
        .immersionSection[dir='rtl'] .immersionActionRow,
        .immersionSection[dir='rtl'] .immersionSignalCard,
        .immersionSection[dir='rtl'] .immersionInlineLink,
        .immersionSection[dir='rtl'] .immersionMiniBadge {
          direction: rtl;
        }

        .immersionSection[dir='rtl'] .immersionInlineLink .miniIcon {
          transform: scaleX(-1);
        }

        .immersionMiniGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .networkCanvas,
        .premiumCanvas {
          padding: 18px;
        }

        .networkCluster,
        .premiumStack {
          position: absolute;
          inset: 18px 18px auto 18px;
          z-index: 1;
        }

        .networkCluster {
          min-height: 112px;
        }

        .networkPill {
          position: absolute;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(147, 197, 253, 0.28);
          background: rgba(255, 255, 255, 0.94);
          color: #1e3a8a;
          font-size: 0.76rem;
          font-weight: 800;
          backdrop-filter: blur(12px);
        }

        .networkPill.lead {
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
        }

        .networkPill.side {
          top: 0;
          left: 6px;
        }

        .networkPill.side.alt {
          left: auto;
          right: 6px;
        }

        .networkLine {
          position: absolute;
          top: 54px;
          height: 1px;
          background: linear-gradient(90deg, rgba(96, 165, 250, 0.18), rgba(96, 165, 250, 0.72), rgba(96, 165, 250, 0.18));
          transform-origin: left center;
        }

        .networkLine.lineOne {
          left: 68px;
          width: calc(50% - 44px);
          transform: rotate(16deg);
        }

        .networkLine.lineTwo {
          right: 68px;
          width: calc(50% - 44px);
          transform: rotate(-16deg);
        }

        .premiumStack {
          display: grid;
          gap: 10px;
        }

        .premiumTag {
          background: rgba(254, 240, 138, 0.5);
          border: 1px solid rgba(234, 179, 8, 0.3);
          color: #854d0e;
        }

        .premiumFeatureCard {
          display: grid;
          gap: 4px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(250, 204, 21, 0.2);
          background: rgba(255, 251, 235, 0.94);
        }

        .premiumFeatureCard strong {
          color: #713f12;
          font-size: 0.96rem;
          line-height: 1.3;
        }

        .premiumFeatureCard small {
          color: #92400e;
          font-size: 0.84rem;
        }

        .immersionMiniPanel {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          z-index: 1;
          display: grid;
          gap: 10px;
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid rgba(203, 213, 225, 0.85);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94)),
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 32%);
          backdrop-filter: blur(16px);
        }

        .immersionMiniBadge {
          background: rgba(219, 234, 254, 0.9);
          border: 1px solid rgba(96, 165, 250, 0.22);
          color: #1d4ed8;
          text-transform: none;
        }

        .immersionMiniBadge.premium {
          background: rgba(254, 240, 138, 0.42);
          border-color: rgba(234, 179, 8, 0.28);
          color: #854d0e;
        }

        .immersionMiniPanel strong {
          color: #0f172a;
          font-size: 1rem;
          line-height: 1.35;
        }

        .immersionMiniPanel p {
          color: #475569;
          font-size: 0.94rem;
          line-height: 1.6;
        }

        .miniIcon {
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
        }

        @keyframes glowDrift {
          from {
            transform: translate3d(0, 0, 0) scale(1);
          }
          to {
            transform: translate3d(12px, -10px, 0) scale(1.08);
          }
        }

        @keyframes glowPulse {
          0%,
          100% {
            opacity: 0.32;
            transform: scale(1);
          }
          50% {
            opacity: 0.48;
            transform: scale(1.07);
          }
        }

        @keyframes windowFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .immersionPrimaryButton,
          .immersionGhostButton,
          .immersionSignalCard,
          .immersionHeroMockup,
          .immersionMiniCard,
          .immersionInlineLink,
          .immersionProfileWindow,
          .canvasGlow,
          .miniGlow {
            animation: none !important;
            transition: none !important;
          }

          .immersionPrimaryButton:hover,
          .immersionGhostButton:hover,
          .immersionHeroMockup:hover,
          .immersionMiniCard:hover,
          .immersionSignalCard:hover,
          .immersionInlineLink:hover {
            transform: none !important;
          }
        }

        @media (max-width: 1180px) {
          .immersionSection {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .immersionSection {
            padding: 18px;
            border-radius: 24px;
          }

          .immersionIdentityRow,
          .immersionStateGrid,
          .immersionMiniGrid {
            grid-template-columns: 1fr;
          }

          .immersionIdentityRow {
            justify-items: start;
          }

          .immersionHeroCanvas {
            min-height: 520px;
          }

          .immersionProfileWindow {
            left: 18px;
            right: 18px;
            bottom: 18px;
            padding: 18px;
          }

          .networkLine {
            display: none;
          }

          .networkCluster {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            min-height: 0;
          }

          .networkPill {
            position: relative;
            top: auto;
            left: auto;
            right: auto;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}
