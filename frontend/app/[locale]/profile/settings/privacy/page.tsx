'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { ArrowLeft, FileText, Globe2, Mail, MapPin, Save, Shield, UserRound } from 'lucide-react';
import { localizeHref } from '@/components/locale-path';
import { defaultLocale, isLocale } from '@/i18n.config';

type Visibility = 'Public' | 'Private' | 'ContactsOnly';
type VisibilityFieldKey =
  | 'emailVisibility'
  | 'phoneVisibility'
  | 'dateOfBirthVisibility'
  | 'identityDocumentVisibility'
  | 'addressVisibility'
  | 'cityVisibility'
  | 'countryVisibility'
  | 'cvVisibility'
  | 'professionalExperienceVisibility'
  | 'interestsVisibility'
  | 'professionVisibility'
  | 'photoVisibility'
  | 'bannerVisibility'
  | 'bioVisibility'
  | 'profileVisibility';
type BooleanFieldKey = 'allowSearchEngines' | 'allowNetworkingRequests';

interface PrivacySettings {
  emailVisibility: Visibility;
  phoneVisibility: Visibility;
  dateOfBirthVisibility: Visibility;
  identityDocumentVisibility: Visibility;
  addressVisibility: Visibility;
  cityVisibility: Visibility;
  countryVisibility: Visibility;
  cvVisibility: Visibility;
  professionalExperienceVisibility: Visibility;
  interestsVisibility: Visibility;
  professionVisibility: Visibility;
  photoVisibility: Visibility;
  bannerVisibility: Visibility;
  bioVisibility: Visibility;
  profileVisibility: Visibility;
  allowSearchEngines: boolean;
  allowNetworkingRequests: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showDateOfBirth?: boolean;
  showAddress?: boolean;
  showProfessionalExp?: boolean;
  showInterests?: boolean;
  showCV?: boolean;
}

interface Profile {
  firstName?: string | null;
  lastName?: string | null;
  publicProfileUrl?: string | null;
  user?: {
    username?: string | null;
  } | null;
  privacySettings?: Partial<PrivacySettings> | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface VisibilityFieldConfig {
  key: VisibilityFieldKey;
  label: string;
  hint: string;
  summary: string;
}

interface BooleanFieldConfig {
  key: BooleanFieldKey;
  label: string;
  hint: string;
}

interface QuickVisibilityFieldConfig {
  key: VisibilityFieldKey;
  label: string;
  hint: string;
  offValue: Visibility;
}

interface QuickBooleanFieldConfig {
  key: BooleanFieldKey;
  label: string;
  hint: string;
}

const defaultPrivacy: PrivacySettings = {
  emailVisibility: 'Private',
  phoneVisibility: 'Private',
  dateOfBirthVisibility: 'Private',
  identityDocumentVisibility: 'Private',
  addressVisibility: 'Private',
  cityVisibility: 'Public',
  countryVisibility: 'Public',
  cvVisibility: 'ContactsOnly',
  professionalExperienceVisibility: 'Public',
  interestsVisibility: 'Public',
  professionVisibility: 'Public',
  photoVisibility: 'Public',
  bannerVisibility: 'Public',
  bioVisibility: 'Public',
  profileVisibility: 'Public',
  allowSearchEngines: true,
  allowNetworkingRequests: true,
};

const privacySections: Array<{
  title: string;
  description: string;
  icon: typeof Shield;
  fields: VisibilityFieldConfig[];
  toggles?: BooleanFieldConfig[];
}> = [
  {
    title: 'Informations personnelles',
    description: 'Controle ce qui touche a ton identite, a ta photo et a ta banniere.',
    icon: UserRound,
    fields: [
      {
        key: 'dateOfBirthVisibility',
        label: 'Date de naissance',
        hint: 'Choisis si la date de naissance doit etre visible publiquement, reservee aux connexions ou privee.',
        summary: 'Date de naissance',
      },
      {
        key: 'identityDocumentVisibility',
        label: 'CIN / Passeport',
        hint: 'Ce reglage est conserve pour le module complet, mais les documents d identite restent proteges du profil public.',
        summary: 'Document identite',
      },
      {
        key: 'photoVisibility',
        label: 'Photo de profil',
        hint: 'Controle la visibilite de la photo sur les surfaces publiques du site.',
        summary: 'Photo',
      },
      {
        key: 'bannerVisibility',
        label: 'Banniere',
        hint: 'Prepare la visibilite de la couverture quand la banniere est ajoutee au profil.',
        summary: 'Banniere',
      },
    ],
  },
  {
    title: 'Coordonnees',
    description: 'Verrouille les informations de contact et la localisation du profil.',
    icon: Mail,
    fields: [
      {
        key: 'emailVisibility',
        label: 'Email',
        hint: 'Affiche l adresse email publiquement, seulement aux connexions, ou a personne.',
        summary: 'Email',
      },
      {
        key: 'phoneVisibility',
        label: 'Telephone',
        hint: 'Protege le numero de telephone en fonction du niveau de confidentialite choisi.',
        summary: 'Telephone',
      },
      {
        key: 'addressVisibility',
        label: 'Adresse',
        hint: 'L adresse postale reste privee par defaut pour eviter toute exposition inutile.',
        summary: 'Adresse',
      },
      {
        key: 'cityVisibility',
        label: 'Ville',
        hint: 'La ville est publique par defaut pour garder un profil professionnel visible.',
        summary: 'Ville',
      },
      {
        key: 'countryVisibility',
        label: 'Pays',
        hint: 'Le pays peut rester public pour les recherches et les recommandations.',
        summary: 'Pays',
      },
    ],
  },
  {
    title: 'Documents',
    description: 'Gere le CV et les ressources sensibles du profil.',
    icon: FileText,
    fields: [
      {
        key: 'cvVisibility',
        label: 'CV PDF',
        hint: 'Par defaut, le CV est reserve aux connexions uniquement.',
        summary: 'CV',
      },
    ],
  },
  {
    title: 'Parcours',
    description: 'Choisis la partie de ton parcours professionnel visible pour le reseau.',
    icon: MapPin,
    fields: [
      {
        key: 'professionalExperienceVisibility',
        label: 'Parcours professionnel',
        hint: 'Controle les experiences, postes et entreprises visibles sur le profil public.',
        summary: 'Parcours',
      },
      {
        key: 'interestsVisibility',
        label: 'Centres d interet',
        hint: 'Utiles pour les recommandations, mais tu peux les limiter aux connexions si besoin.',
        summary: 'Interets',
      },
      {
        key: 'professionVisibility',
        label: 'Profession actuelle',
        hint: 'Pilote le titre, l entreprise et le secteur affiches sur ton profil public.',
        summary: 'Profession',
      },
      {
        key: 'bioVisibility',
        label: 'Bio courte',
        hint: 'Controle le petit resume visible sur la page publique.',
        summary: 'Bio',
      },
    ],
  },
  {
    title: 'Visibilite generale',
    description: 'Definis la portee du profil et les options globales de diffusion.',
    icon: Globe2,
    fields: [
      {
        key: 'profileVisibility',
        label: 'Profil complet',
        hint: 'Public ouvre la page publique, Connexions uniquement reserve le profil au reseau, Prive le masque entierement.',
        summary: 'Profil',
      },
    ],
    toggles: [
      {
        key: 'allowSearchEngines',
        label: 'Indexation par les moteurs',
        hint: 'Autorise Google et les moteurs de recherche a indexer la page publique.',
      },
      {
        key: 'allowNetworkingRequests',
        label: 'Demandes reseau',
        hint: 'Permet aux visiteurs autorises de t envoyer des demandes de connexion.',
      },
    ],
  },
];

const visibilityOptions: Array<{
  value: Visibility;
  label: string;
  description: string;
}> = [
  {
    value: 'Public',
    label: 'Public',
    description: 'Visible sur le profil public.',
  },
  {
    value: 'ContactsOnly',
    label: 'Connexions uniquement',
    description: 'Reserve au reseau connecte.',
  },
  {
    value: 'Private',
    label: 'Prive',
    description: 'Cache au public et aux visiteurs.',
  },
];

const quickVisibilityFields: QuickVisibilityFieldConfig[] = [
  {
    key: 'emailVisibility',
    label: 'Afficher l email',
    hint: 'Expose ton email dans la version publique du profil.',
    offValue: 'Private',
  },
  {
    key: 'phoneVisibility',
    label: 'Afficher le telephone',
    hint: 'Autorise le numero a apparaitre dans la fiche publique.',
    offValue: 'Private',
  },
  {
    key: 'dateOfBirthVisibility',
    label: 'Afficher la naissance',
    hint: 'Permet de publier la date de naissance.',
    offValue: 'Private',
  },
  {
    key: 'addressVisibility',
    label: 'Afficher l adresse',
    hint: 'Ajoute l adresse postale au profil public.',
    offValue: 'Private',
  },
  {
    key: 'professionalExperienceVisibility',
    label: 'Afficher le parcours',
    hint: 'Publie les experiences professionnelles.',
    offValue: 'Private',
  },
  {
    key: 'interestsVisibility',
    label: 'Afficher les tags',
    hint: 'Montre les centres d interet dans la page publique.',
    offValue: 'Private',
  },
  {
    key: 'cvVisibility',
    label: 'Afficher le CV',
    hint: 'Rend le CV telechargeable depuis la page publique.',
    offValue: 'ContactsOnly',
  },
  {
    key: 'bioVisibility',
    label: 'Afficher la bio',
    hint: 'Affiche le resume court sur la page publique.',
    offValue: 'Private',
  },
];

const quickBooleanFields: QuickBooleanFieldConfig[] = [
  {
    key: 'allowSearchEngines',
    label: 'Indexation publique',
    hint: 'Autorise les moteurs de recherche a referencer la page.',
  },
  {
    key: 'allowNetworkingRequests',
    label: 'Demandes reseau',
    hint: 'Permettre aux visiteurs de prendre contact.',
  },
];

function mergePrivacy(settings?: Partial<PrivacySettings> | null): PrivacySettings {
  return {
    ...defaultPrivacy,
    ...(settings || {}),
  };
}

function visibilityLabel(value: Visibility) {
  if (value === 'ContactsOnly') {
    return 'Connexions uniquement';
  }

  if (value === 'Private') {
    return 'Prive';
  }

  return 'Public';
}

function inferStatusTone(status: string) {
  const lowered = status.toLowerCase();

  if (
    lowered.includes('erreur') ||
    lowered.includes('impossible') ||
    lowered.includes('requise') ||
    lowered.includes('indisponible')
  ) {
    return 'warning';
  }

  if (lowered.includes('sauvegard') || lowered.includes('copie') || lowered.includes('charge')) {
    return 'success';
  }

  return 'neutral';
}

function VisibilityField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: Visibility;
  onChange: (value: Visibility) => void;
}) {
  return (
    <label className="privacyVisibilityRow">
      <div className="privacyVisibilityCopy">
        <strong>{label}</strong>
        <span>{hint}</span>
      </div>
      <div className="privacyVisibilityControl">
        <select value={value} onChange={(event) => onChange(event.target.value as Visibility)}>
          {visibilityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <small>{visibilityOptions.find((option) => option.value === value)?.description}</small>
      </div>
    </label>
  );
}

function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="privacyToggleRow">
      <div className="privacyToggleCopy">
        <strong>{label}</strong>
        <span>{hint}</span>
      </div>
      <span className={checked ? 'privacySwitch isActive' : 'privacySwitch'}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="privacySwitchKnob" />
      </span>
    </label>
  );
}

function QuickVisibilityToggleCard({
  label,
  hint,
  checked,
  currentMode,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  currentMode: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={checked ? 'privacyQuickCard isActive' : 'privacyQuickCard'}>
      <div className="privacyQuickCopy">
        <strong>{label}</strong>
        <span>{hint}</span>
      </div>
      <div className="privacyQuickMeta">
        <small className="privacyQuickMode">{currentMode}</small>
        <span className={checked ? 'privacySwitch isActive' : 'privacySwitch'}>
          <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
          <span className="privacySwitchKnob" />
        </span>
      </div>
    </label>
  );
}

export default function PrivacySettingsPage() {
  const params = useParams<{ locale?: string }>();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const studioHref = localizeHref(locale, '/dashboard/profile');
  const dashboardHref = localizeHref(locale, '/dashboard');
  const signInHref = localizeHref(locale, '/auth/sign-in');
  const verificationHref = localizeHref(locale, '/profile/settings/verification');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings>(defaultPrivacy);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Chargement des reglages...');

  const activeUserEmail = user?.primaryEmailAddress?.emailAddress || '';
  const activeUserName = user?.fullName || user?.username || 'Membre Communium';

  const actorHeaders = useMemo(
    () => ({
      'x-user-email': activeUserEmail,
      'x-user-name': activeUserName,
      'x-user-account-type':
        typeof user?.unsafeMetadata?.accountType === 'string' ? user.unsafeMetadata.accountType : '',
    }),
    [activeUserEmail, activeUserName, user?.unsafeMetadata?.accountType],
  );

  const memberName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || activeUserName;
  const publicProfileHref =
    profile?.user?.username ? localizeHref(locale, `/u/${profile.user.username}`) : '';

  const fieldCatalog = useMemo(
    () =>
      privacySections.flatMap((section) => section.fields).filter((field) => field.key !== 'profileVisibility'),
    [],
  );

  const publicFields = useMemo(
    () =>
      fieldCatalog
        .filter((field) => privacy[field.key] === 'Public')
        .map((field) => field.summary),
    [fieldCatalog, privacy],
  );

  const contactsOnlyFields = useMemo(
    () =>
      fieldCatalog
        .filter((field) => privacy[field.key] === 'ContactsOnly')
        .map((field) => field.summary),
    [fieldCatalog, privacy],
  );

  const privateFields = useMemo(
    () =>
      fieldCatalog
        .filter((field) => privacy[field.key] === 'Private')
        .map((field) => field.summary),
    [fieldCatalog, privacy],
  );

  async function createAuthorizedHeaders(json = true) {
    const token = await getToken();

    if (!token) {
      throw new Error('Session Clerk indisponible. Reconnecte-toi.');
    }

    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...actorHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      setStatus('Connexion requise');
      return;
    }

    void loadProfile();
  }, [actorHeaders, getToken, isLoaded, user]);

  async function parseResponse<T>(response: Response) {
    const body = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !body.success) {
      throw new Error(body.error || 'Erreur API');
    }

    return body;
  }

  async function loadProfile() {
    try {
      setIsLoading(true);
      setStatus('Chargement des reglages...');
      const response = await fetch('/api/profile/my-profile', { headers: await createAuthorizedHeaders(false) });
      const body = await parseResponse<Profile>(response);
      const nextProfile = body.data || null;

      setProfile(nextProfile);
      setPrivacy(mergePrivacy(nextProfile?.privacySettings));
      setStatus('Reglages charges');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Impossible de charger la confidentialite');
    } finally {
      setIsLoading(false);
    }
  }

  async function savePrivacy() {
    try {
      setStatus('Sauvegarde en cours...');
      const response = await fetch('/api/profile/privacy-settings', {
        method: 'PUT',
        headers: await createAuthorizedHeaders(),
        body: JSON.stringify(privacy),
      });
      const body = await parseResponse<Profile>(response);
      const nextProfile = body.data || null;

      setProfile(nextProfile);
      setPrivacy(mergePrivacy(nextProfile?.privacySettings));
      setStatus('Confidentialite sauvegardee');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erreur pendant la sauvegarde');
    }
  }

  async function copyPublicUrl() {
    if (!publicProfileHref) {
      setStatus("Aucune URL publique disponible pour l'instant");
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${publicProfileHref}`);
      setStatus('URL publique copiee');
    } catch {
      setStatus('Impossible de copier le lien public');
    }
  }

  const statusTone = inferStatusTone(status);

  if (!isLoaded || isLoading) {
    return (
      <main className="privacySettingsPage">
        <div className="privacyShell">
          <section className="privacyHeroCard">
            <span className="privacyEyebrow">Confidentialite</span>
            <h1>Chargement des reglages de confidentialite...</h1>
            <div className="privacySkeletonGrid">
              <span className="privacySkeletonCard" />
              <span className="privacySkeletonCard" />
              <span className="privacySkeletonCard" />
              <span className="privacySkeletonCard" />
            </div>
          </section>
          <PrivacySettingsStyles />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="privacySettingsPage">
        <div className="privacyShell">
          <section className="privacyHeroCard">
            <span className="privacyEyebrow">Acces membre</span>
            <h1>Connecte-toi pour regler la confidentialite du profil.</h1>
            <p>Cette page est reservee au membre connecte pour proteger les informations privees.</p>
            <div className="privacyHeroActions">
              <Link href={signInHref} className="privacyPrimaryButton">
                Se connecter
              </Link>
              <Link href={dashboardHref} className="privacyGhostButton">
                Retour au dashboard
              </Link>
            </div>
          </section>
          <PrivacySettingsStyles />
        </div>
      </main>
    );
  }

  return (
    <main className="privacySettingsPage">
      <div className="privacyShell">
        <section className="privacyHeroCard">
          <div className="privacyHeroHead">
            <div>
              <span className="privacyEyebrow">Parametres de confidentialite</span>
              <h1>Une vraie page dediee pour piloter la visibilite de chaque information.</h1>
              <p>
                Telephone, email, adresse, CV, parcours, photo et banniere ont maintenant leurs propres regles
                Public, Connexions uniquement ou Prive.
              </p>
            </div>

            <div className="privacyHeroActions">
              <Link href={studioHref} className="privacyGhostButton">
                <ArrowLeft className="privacyButtonIcon" strokeWidth={2.1} />
                Retour au profil
              </Link>
              {publicProfileHref ? (
                <button type="button" className="privacyGhostButton" onClick={() => void copyPublicUrl()}>
                  <Globe2 className="privacyButtonIcon" strokeWidth={2.1} />
                  Copier le lien public
                </button>
              ) : null}
              {publicProfileHref ? (
                <Link href={publicProfileHref} className="privacyGhostButton">
                  <Globe2 className="privacyButtonIcon" strokeWidth={2.1} />
                  Voir le profil public
                </Link>
              ) : null}
              <Link href={verificationHref} className="privacyGhostButton">
                <Shield className="privacyButtonIcon" strokeWidth={2.1} />
                Verification du compte
              </Link>
              <button type="button" className="privacyPrimaryButton" onClick={() => void savePrivacy()}>
                <Save className="privacyButtonIcon" strokeWidth={2.1} />
                Enregistrer
              </button>
            </div>
          </div>

          <div className="privacySummaryGrid">
            <article className="privacySummaryCard">
              <small>Membre</small>
              <strong>{memberName}</strong>
              <span>{visibilityLabel(privacy.profileVisibility)}</span>
            </article>
            <article className="privacySummaryCard">
              <small>Public</small>
              <strong>{publicFields.length}</strong>
              <span>{publicFields.length ? publicFields.join(' / ') : 'Aucun champ expose'}</span>
            </article>
            <article className="privacySummaryCard">
              <small>Connexions</small>
              <strong>{contactsOnlyFields.length}</strong>
              <span>{contactsOnlyFields.length ? contactsOnlyFields.join(' / ') : 'Aucun champ reserve'}</span>
            </article>
            <article className="privacySummaryCard">
              <small>Prive</small>
              <strong>{privateFields.length}</strong>
              <span>{privateFields.length ? privateFields.join(' / ') : 'Aucun champ masque'}</span>
            </article>
          </div>
        </section>

        <section className={`privacyStatusStrip ${statusTone}`}>
          <Shield className="privacyStatusIcon" strokeWidth={2.1} />
          <span>{status}</span>
        </section>

        <section className="privacyRulesCard">
          <div className="privacyRulesHead">
            <span className="privacyRulesIcon">
              <Shield className="privacySectionIcon" strokeWidth={2.1} />
            </span>
            <div>
              <h2>Regles de visibilite</h2>
              <p>
                Des interrupteurs simples, un libelle clair, et un seul bouton de sauvegarde. Pour le mode
                Connexions uniquement, utilise les reglages avances juste en dessous.
              </p>
            </div>
          </div>

          <label className="privacyProfileSelectCard">
            <span className="privacyProfileSelectLabel">Visibilite du profil</span>
            <select
              value={privacy.profileVisibility}
              onChange={(event) =>
                setPrivacy((current) => ({
                  ...current,
                  profileVisibility: event.target.value as Visibility,
                }))
              }
            >
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="privacyQuickGrid">
            {quickVisibilityFields.map((field) => (
              <QuickVisibilityToggleCard
                key={field.key}
                label={field.label}
                hint={field.hint}
                checked={privacy[field.key] === 'Public'}
                currentMode={visibilityLabel(privacy[field.key])}
                onChange={(checked) =>
                  setPrivacy((current) => ({
                    ...current,
                    [field.key]: checked ? 'Public' : field.offValue,
                  }))
                }
              />
            ))}

            {quickBooleanFields.map((field) => (
              <QuickVisibilityToggleCard
                key={field.key}
                label={field.label}
                hint={field.hint}
                checked={privacy[field.key]}
                currentMode={privacy[field.key] ? 'Actif' : 'Inactif'}
                onChange={(checked) =>
                  setPrivacy((current) => ({
                    ...current,
                    [field.key]: checked,
                  }))
                }
              />
            ))}
          </div>

          <div className="privacyRulesFooter">
            <p>
              Ville, pays, profession, photo, banniere et CIN restent reglables plus bas dans les reglages avances.
            </p>
            <button type="button" className="privacyPrimaryButton" onClick={() => void savePrivacy()}>
              Sauvegarder la confidentialite
            </button>
          </div>
        </section>

        <section className="privacyLayout">
          <div className="privacyMainColumn">
            <article className="privacyCard">
              <div className="privacyCardHead">
                <span className="privacyCardEyebrow">Reglages avances</span>
                <h2>Controle champ par champ</h2>
                <p>
                  Ici, tu peux regler precisement les modes Public, Connexions uniquement ou Prive pour chaque
                  information sensible du profil.
                </p>
              </div>
            </article>

            {privacySections.map((section) => {
              const Icon = section.icon;

              return (
                <article key={section.title} className="privacyCard">
                  <div className="privacyCardHead">
                    <div className="privacyCardTitleRow">
                      <span className="privacyCardIcon">
                        <Icon className="privacySectionIcon" strokeWidth={2.1} />
                      </span>
                      <div>
                        <h2>{section.title}</h2>
                        <p>{section.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="privacySectionStack">
                    {section.fields.map((field) => (
                      <VisibilityField
                        key={field.key}
                        label={field.label}
                        hint={field.hint}
                        value={privacy[field.key]}
                        onChange={(value) =>
                          setPrivacy((current) => ({
                            ...current,
                            [field.key]: value,
                          }))
                        }
                      />
                    ))}

                    {section.toggles?.map((toggle) => (
                      <ToggleField
                        key={toggle.key}
                        label={toggle.label}
                        hint={toggle.hint}
                        checked={privacy[toggle.key]}
                        onChange={(checked) =>
                          setPrivacy((current) => ({
                            ...current,
                            [toggle.key]: checked,
                          }))
                        }
                      />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="privacyAsideColumn">
            <article className="privacySideCard">
              <span className="privacyCardEyebrow">Lecture rapide</span>
              <h3>Resume de la page</h3>
              <div className="privacyModeBadgeRow">
                <span className="privacyModeBadge publicMode">Public: {publicFields.length}</span>
                <span className="privacyModeBadge networkMode">Connexions: {contactsOnlyFields.length}</span>
                <span className="privacyModeBadge privateMode">Prive: {privateFields.length}</span>
              </div>
              <p>
                Le profil complet est actuellement en mode <strong>{visibilityLabel(privacy.profileVisibility)}</strong>.
              </p>
            </article>

            <article className="privacySideCard">
              <span className="privacyCardEyebrow">Valeurs par defaut</span>
              <h3>Base recommandee</h3>
              <ul className="privacyHintList">
                <li>Nom, profession, ville et pays restent publics.</li>
                <li>Telephone, email, adresse, date de naissance et CIN restent prives.</li>
                <li>Le CV est reserve aux connexions par defaut.</li>
                <li>Le parcours et les centres d interet restent visibles publiquement.</li>
              </ul>
            </article>

            <article className="privacySideCard">
              <span className="privacyCardEyebrow">Protection forte</span>
              <h3>Donnees sensibles</h3>
              <p>
                Meme si tu ajustes la fiche administrative ici, les documents d identite ne sont jamais exposes sur le
                profil public. Ce panneau sert aussi a preparer les vues reservees aux connexions.
              </p>
              <div className="privacySideActions">
                <Link href={verificationHref} className="privacyGhostButton fullWidthButton">
                  Ouvrir la verification
                </Link>
                <Link href={studioHref} className="privacyGhostButton fullWidthButton">
                  Revenir au profil
                </Link>
              </div>
            </article>
          </aside>
        </section>

        <PrivacySettingsStyles />
      </div>
    </main>
  );
}

function PrivacySettingsStyles() {
  return (
    <style>{`
      .privacySettingsPage {
        min-height: 100vh;
        padding: 14px;
        background:
          radial-gradient(circle at top left, rgba(29, 78, 216, 0.16), transparent 32%),
          radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.12), transparent 28%),
          linear-gradient(180deg, #fbfdff 0%, #f4f7fb 48%, #edf3fb 100%);
        color: #0f172a;
        font-family: Manrope, 'Segoe UI', ui-sans-serif, system-ui, sans-serif;
      }

      .privacyShell {
        display: grid;
        gap: 18px;
      }

      .privacyHeroCard,
      .privacyRulesCard,
      .privacyStatusStrip,
      .privacyCard,
      .privacySideCard,
      .privacySummaryCard {
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 22px 60px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(18px);
      }

      .privacyHeroCard {
        display: grid;
        gap: 18px;
        padding: 26px;
        border-radius: 30px;
      }

      .privacyRulesCard {
        display: grid;
        gap: 18px;
        padding: 24px;
        border-radius: 30px;
      }

      .privacyHeroHead {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 18px;
        align-items: start;
      }

      .privacyEyebrow,
      .privacyCardEyebrow {
        display: inline-flex;
        align-items: center;
        min-height: 32px;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(219, 234, 254, 0.92);
        color: #1d4ed8;
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .privacyHeroCard h1,
      .privacyCard h2,
      .privacySideCard h3 {
        margin: 0;
        letter-spacing: -0.04em;
      }

      .privacyHeroCard h1 {
        margin-top: 12px;
        font-size: clamp(2rem, 4vw, 3.3rem);
        line-height: 1.02;
      }

      .privacyHeroCard p,
      .privacyRulesCard p,
      .privacyCard p,
      .privacySideCard p,
      .privacySummaryCard span,
      .privacyToggleCopy span,
      .privacyVisibilityCopy span,
      .privacyVisibilityControl small {
        margin: 0;
        color: #64748b;
        line-height: 1.65;
      }

      .privacyHeroActions,
      .privacySideActions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .privacyPrimaryButton,
      .privacyGhostButton {
        min-height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 0 18px;
        border-radius: 999px;
        border: 0;
        font: inherit;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease,
          border-color 0.18s ease;
      }

      .privacyPrimaryButton {
        background: linear-gradient(135deg, #1d4ed8, #3b82f6);
        color: #ffffff;
        box-shadow: 0 16px 30px rgba(29, 78, 216, 0.24);
      }

      .privacyGhostButton {
        background: rgba(255, 255, 255, 0.9);
        color: #0f172a;
        border: 1px solid rgba(148, 163, 184, 0.22);
      }

      .privacyPrimaryButton:hover,
      .privacyGhostButton:hover {
        transform: translateY(-1px);
      }

      .privacyButtonIcon,
      .privacyStatusIcon,
      .privacySectionIcon {
        width: 18px;
        height: 18px;
        flex: 0 0 auto;
      }

      .privacySummaryGrid,
      .privacyLayout,
      .privacyQuickGrid {
        display: grid;
        gap: 16px;
      }

      .privacySummaryGrid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .privacySummaryCard {
        display: grid;
        gap: 6px;
        padding: 18px;
        border-radius: 24px;
      }

      .privacySummaryCard small {
        color: #64748b;
        font-size: 0.76rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .privacySummaryCard strong {
        font-size: 1.2rem;
        letter-spacing: -0.03em;
      }

      .privacyStatusStrip {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        border-radius: 999px;
        font-weight: 800;
      }

      .privacyStatusStrip.success {
        color: #0f766e;
        background: rgba(236, 253, 245, 0.96);
      }

      .privacyStatusStrip.warning {
        color: #9a3412;
        background: rgba(255, 247, 237, 0.96);
      }

      .privacyLayout {
        grid-template-columns: minmax(0, 1.4fr) minmax(300px, 0.8fr);
        align-items: start;
      }

      .privacyMainColumn,
      .privacyAsideColumn,
      .privacyHintList,
      .privacySectionStack {
        display: grid;
        gap: 16px;
      }

      .privacyCard,
      .privacySideCard {
        padding: 22px;
        border-radius: 28px;
      }

      .privacyRulesHead {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 14px;
        align-items: start;
      }

      .privacyRulesHead h2 {
        margin: 0 0 4px;
        font-size: clamp(1.35rem, 2vw, 1.8rem);
        letter-spacing: -0.04em;
      }

      .privacyRulesIcon {
        width: 56px;
        height: 56px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: rgba(239, 246, 255, 0.94);
        color: #1d4ed8;
      }

      .privacyProfileSelectCard {
        display: grid;
        gap: 10px;
      }

      .privacyProfileSelectLabel {
        font-size: 1rem;
        font-weight: 900;
        color: #0f172a;
      }

      .privacyProfileSelectCard select {
        width: 100%;
        min-height: 50px;
        padding: 0 16px;
        border-radius: 20px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(255, 255, 255, 0.95);
        color: #0f172a;
        font: inherit;
        font-weight: 700;
        outline: none;
      }

      .privacyProfileSelectCard select:focus {
        border-color: rgba(29, 78, 216, 0.38);
        box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.08);
      }

      .privacyQuickGrid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .privacyQuickCard {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: start;
        padding: 18px;
        border-radius: 24px;
        border: 1px solid rgba(148, 163, 184, 0.16);
        background: rgba(255, 255, 255, 0.88);
        cursor: pointer;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease;
      }

      .privacyQuickCard:hover {
        transform: translateY(-1px);
        box-shadow: 0 18px 30px rgba(15, 23, 42, 0.07);
      }

      .privacyQuickCard.isActive {
        border-color: rgba(37, 99, 235, 0.34);
        background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(239, 246, 255, 0.98));
      }

      .privacyQuickCopy,
      .privacyQuickMeta {
        display: grid;
        gap: 8px;
      }

      .privacyQuickCopy strong {
        font-size: 1.04rem;
      }

      .privacyQuickMode {
        min-height: 28px;
        padding: 0 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: rgba(241, 245, 249, 0.96);
        color: #334155;
        font-size: 0.76rem;
        font-weight: 900;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .privacyRulesFooter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .privacyCardHead {
        margin-bottom: 18px;
      }

      .privacyCardTitleRow {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 14px;
        align-items: start;
      }

      .privacyCardIcon {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        background: rgba(219, 234, 254, 0.94);
        color: #1d4ed8;
      }

      .privacyVisibilityRow,
      .privacyToggleRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px;
        border-radius: 22px;
        background: rgba(248, 250, 252, 0.84);
        border: 1px solid rgba(148, 163, 184, 0.16);
      }

      .privacyVisibilityCopy,
      .privacyToggleCopy {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .privacyVisibilityCopy strong,
      .privacyToggleCopy strong {
        font-size: 1rem;
      }

      .privacyVisibilityControl {
        width: min(260px, 100%);
        display: grid;
        gap: 6px;
        justify-items: end;
      }

      .privacyVisibilityControl select {
        width: 100%;
        min-height: 48px;
        padding: 0 14px;
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(255, 255, 255, 0.92);
        color: #0f172a;
        font: inherit;
        font-weight: 700;
        outline: none;
      }

      .privacyVisibilityControl select:focus {
        border-color: rgba(29, 78, 216, 0.38);
        box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.08);
      }

      .privacySwitch {
        position: relative;
        width: 56px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.26);
        transition: background 0.18s ease;
      }

      .privacySwitch input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }

      .privacySwitchKnob {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 8px 16px rgba(15, 23, 42, 0.14);
        transform: translateX(4px);
        transition: transform 0.18s ease;
      }

      .privacySwitch.isActive {
        background: rgba(29, 78, 216, 0.92);
      }

      .privacySwitch.isActive .privacySwitchKnob {
        transform: translateX(28px);
      }

      .privacyModeBadgeRow {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .privacyModeBadge {
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        padding: 0 14px;
        border-radius: 999px;
        font-weight: 900;
      }

      .publicMode {
        background: rgba(219, 234, 254, 0.92);
        color: #1d4ed8;
      }

      .networkMode {
        background: rgba(224, 231, 255, 0.92);
        color: #4338ca;
      }

      .privateMode {
        background: rgba(241, 245, 249, 0.96);
        color: #334155;
      }

      .privacyHintList {
        margin: 0;
        padding-left: 18px;
        color: #475569;
        line-height: 1.7;
      }

      .privacySkeletonGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .privacySkeletonCard {
        min-height: 112px;
        border-radius: 24px;
        background: linear-gradient(90deg, rgba(226, 232, 240, 0.7), rgba(241, 245, 249, 0.98), rgba(226, 232, 240, 0.7));
        background-size: 220% 100%;
        animation: privacyShimmer 1.3s linear infinite;
      }

      .fullWidthButton {
        width: 100%;
      }

      @keyframes privacyShimmer {
        from {
          background-position: 200% 0;
        }

        to {
          background-position: -200% 0;
        }
      }

      @media (max-width: 1180px) {
        .privacyLayout,
        .privacyHeroHead,
        .privacySummaryGrid,
        .privacySkeletonGrid,
        .privacyQuickGrid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .privacySettingsPage {
          padding: 12px;
        }

        .privacyHeroCard,
        .privacyRulesCard,
        .privacyCard,
        .privacySideCard,
        .privacySummaryCard {
          border-radius: 24px;
        }

        .privacyHeroActions,
        .privacySideActions,
        .privacyModeBadgeRow,
        .privacyRulesFooter {
          flex-direction: column;
          align-items: stretch;
        }

        .privacyPrimaryButton,
        .privacyGhostButton {
          width: 100%;
        }

        .privacyVisibilityRow,
        .privacyToggleRow {
          flex-direction: column;
          align-items: stretch;
        }

        .privacyCardTitleRow,
        .privacyQuickCard,
        .privacyRulesHead {
          grid-template-columns: 1fr;
        }

        .privacyVisibilityControl {
          width: 100%;
          justify-items: stretch;
        }
      }
    `}</style>
  );
}
