'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { Bookmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import SiteFooter from '@/components/SiteFooter';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale, type Locale } from '@/i18n.config';
import { useParams } from 'next/navigation';

const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const apiRoot = backendOrigin ? `${backendOrigin}/api` : '/api';

interface SavedPost {
  id: number;
  body?: string;
  type?: string;
  author?: {
    fullName?: string;
    username?: string;
  };
}

export default function SavedPage() {
  const params = useParams<{ locale?: string }>();
  const locale: Locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const isFrench = locale === 'fr';
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaved() {
      if (!isLoaded || !user) return;
      setLoading(true);
      try {
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const token = await getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        headers.set('x-user-id', user.id);
        if (user.fullName) headers.set('x-user-name', user.fullName);
        if (user.username) headers.set('x-user-username', user.username);
        if (user.primaryEmailAddress?.emailAddress) headers.set('x-user-email', user.primaryEmailAddress.emailAddress);
        const response = await fetch(`${apiRoot}/saved`, { headers, cache: 'no-store' });
        const body = await response.json();
        if (response.ok && body.success) {
          setPosts(body.data || []);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadSaved();
  }, [getToken, isLoaded, user]);

  return (
    <>
      <main className="savedPage">
        <section className="savedShell">
          <div className="savedHead">
            <Bookmark size={22} />
            <div>
              <span className="eyebrow">{isFrench ? 'Publications enregistrees' : 'Saved posts'}</span>
              <h1>{isFrench ? 'Vos contenus sauvegardes' : 'Your saved content'}</h1>
            </div>
          </div>

          {loading ? <div className="savedCard">{isFrench ? 'Chargement...' : 'Loading...'}</div> : null}
          {!loading && posts.length === 0 ? (
            <div className="savedCard">{isFrench ? 'Aucune publication enregistree pour le moment.' : 'No saved posts yet.'}</div>
          ) : null}
          {posts.map((post) => (
            <Link key={post.id} href={localizeHref(locale, `/feed?post=${post.id}`)} className="savedCard">
              <strong>{post.author?.fullName || post.author?.username || 'Communium'}</strong>
              <span>{post.body || post.type || 'Publication'}</span>
            </Link>
          ))}
        </section>
      </main>
      <SiteFooter locale={locale} />
      <style jsx>{`
        .savedPage {
          min-height: 100vh;
          padding: 18px;
          background: #f6f8fb;
          color: #07122f;
        }

        .savedShell {
          max-width: 880px;
          margin: 0 auto;
          display: grid;
          gap: 14px;
        }

        .savedHead,
        .savedCard {
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.07);
          padding: 18px;
        }

        .savedHead {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .savedCard {
          display: grid;
          gap: 6px;
          color: inherit;
          text-decoration: none;
        }

        .savedCard span {
          color: #475569;
        }

        h1 {
          margin: 4px 0 0;
        }

        .eyebrow {
          color: #0050d8;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
}
