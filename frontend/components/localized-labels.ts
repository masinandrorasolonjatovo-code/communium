import type { Locale } from '@/i18n.config';

type Copy = {
  fr: string;
  en: string;
  ar?: string;
};

export function tr(locale: Locale | string | undefined, fr: string, en: string, ar?: string) {
  if (locale === 'en') {
    return en;
  }

  if (locale === 'ar' && ar) {
    return ar;
  }

  return fr;
}

function clean(value?: string | null) {
  return String(value || '').trim();
}

function key(value?: string | null) {
  return clean(value).toLowerCase().replace(/[\s_-]+/g, '');
}

function fromMap(locale: Locale | string | undefined, value: string | null | undefined, fallback: Copy, map: Record<string, Copy>) {
  const match = map[key(value)] || fallback;
  return tr(locale, match.fr, match.en, match.ar);
}

export function formatPlanLabel(locale: Locale | string | undefined, value?: string | null) {
  return fromMap(locale, value, { fr: 'Gratuit', en: 'Free', ar: 'مجاني' }, {
    free: { fr: 'Gratuit', en: 'Free', ar: 'مجاني' },
    basic: { fr: 'Basique', en: 'Basic', ar: 'أساسي' },
    regular: { fr: 'Standard', en: 'Regular', ar: 'عادي' },
    silver: { fr: 'Silver', en: 'Silver', ar: 'Silver' },
    gold: { fr: 'Gold', en: 'Gold', ar: 'Gold' },
    platinum: { fr: 'Platinum', en: 'Platinum', ar: 'Platinum' },
    premium: { fr: 'Premium', en: 'Premium', ar: 'Premium' },
  });
}

export function formatMemberRole(locale: Locale | string | undefined, value?: string | null) {
  return fromMap(locale, value, { fr: 'Membre', en: 'Member', ar: 'عضو' }, {
    regular: { fr: 'Standard', en: 'Regular', ar: 'عادي' },
    member: { fr: 'Membre', en: 'Member', ar: 'عضو' },
    admin: { fr: 'Admin', en: 'Admin', ar: 'مشرف' },
    owner: { fr: 'Proprietaire', en: 'Owner', ar: 'مالك' },
    business: { fr: 'Entreprise', en: 'Business', ar: 'شركة' },
    personal: { fr: 'Personnel', en: 'Personal', ar: 'شخصي' },
  });
}

export function formatSubscriptionStatus(locale: Locale | string | undefined, value?: string | null) {
  return fromMap(locale, value, { fr: 'Gratuit', en: 'Free', ar: 'مجاني' }, {
    free: { fr: 'Gratuit', en: 'Free', ar: 'مجاني' },
    active: { fr: 'Actif', en: 'Active', ar: 'نشط' },
    trialing: { fr: 'Essai', en: 'Trial', ar: 'تجربة' },
    pending: { fr: 'En attente', en: 'Pending', ar: 'قيد الانتظار' },
    pastdue: { fr: 'Paiement en retard', en: 'Past due', ar: 'متأخر الدفع' },
    canceled: { fr: 'Annule', en: 'Canceled', ar: 'ملغى' },
    cancelled: { fr: 'Annule', en: 'Canceled', ar: 'ملغى' },
    expired: { fr: 'Expire', en: 'Expired', ar: 'منتهي' },
    paid: { fr: 'Paye', en: 'Paid', ar: 'مدفوع' },
    failed: { fr: 'Echoue', en: 'Failed', ar: 'فشل' },
  });
}

export function formatVerificationStatus(locale: Locale | string | undefined, value?: string | null) {
  return fromMap(locale, value, { fr: 'Non verifie', en: 'Not verified', ar: 'غير موثق' }, {
    nonverified: { fr: 'Non verifie', en: 'Not verified', ar: 'غير موثق' },
    pending: { fr: 'En attente', en: 'Pending', ar: 'قيد الانتظار' },
    verified: { fr: 'Verifie', en: 'Verified', ar: 'موثق' },
    rejected: { fr: 'Rejete', en: 'Rejected', ar: 'مرفوض' },
    approved: { fr: 'Approuve', en: 'Approved', ar: 'مقبول' },
  });
}

export function formatVerificationType(locale: Locale | string | undefined, value?: string | null) {
  return fromMap(locale, value, { fr: 'Personnel', en: 'Personal', ar: 'شخصي' }, {
    personal: { fr: 'Personnel', en: 'Personal', ar: 'شخصي' },
    business: { fr: 'Entreprise', en: 'Business', ar: 'شركة' },
  });
}

export function formatVisibilityLabel(locale: Locale | string | undefined, value?: string | null) {
  return fromMap(locale, value, { fr: 'Public', en: 'Public', ar: 'عام' }, {
    public: { fr: 'Public', en: 'Public', ar: 'عام' },
    private: { fr: 'Prive', en: 'Private', ar: 'خاص' },
    contactsonly: { fr: 'Reseau', en: 'Connections', ar: 'العلاقات' },
    network: { fr: 'Reseau', en: 'Network', ar: 'الشبكة' },
    premium: { fr: 'Premium', en: 'Premium', ar: 'Premium' },
  });
}

export function formatPostTypeLabel(locale: Locale | string | undefined, value?: string | null) {
  return fromMap(locale, value, { fr: 'Texte', en: 'Text', ar: 'نص' }, {
    text: { fr: 'Texte', en: 'Text', ar: 'نص' },
    image: { fr: 'Image', en: 'Image', ar: 'صورة' },
    video: { fr: 'Video', en: 'Video', ar: 'فيديو' },
    project: { fr: 'Projet', en: 'Project', ar: 'مشروع' },
    article: { fr: 'Article', en: 'Article', ar: 'مقال' },
    cv: { fr: 'CV', en: 'Resume', ar: 'السيرة الذاتية' },
    event: { fr: 'Evenement', en: 'Event', ar: 'حدث' },
    recruitment: { fr: 'Recrutement', en: 'Recruitment', ar: 'توظيف' },
    business: { fr: 'Business', en: 'Business', ar: 'أعمال' },
  });
}

export function formatCompletionLabel(locale: Locale | string | undefined, id?: string | null, fallback?: string | null) {
  const labels: Record<string, Copy> = {
    photo: { fr: 'Ajouter une photo', en: 'Add a photo', ar: 'إضافة صورة' },
    profilephoto: { fr: 'Ajouter une photo', en: 'Add a photo', ar: 'إضافة صورة' },
    avatar: { fr: 'Ajouter une photo', en: 'Add a photo', ar: 'إضافة صورة' },
    name: { fr: 'Completer le nom', en: 'Complete the name', ar: 'إكمال الاسم' },
    profession: { fr: 'Completer la profession', en: 'Complete the profession', ar: 'إكمال المهنة' },
    location: { fr: 'Ajouter la localisation', en: 'Add location', ar: 'إضافة الموقع' },
    experience: { fr: 'Ajouter une experience', en: 'Add experience', ar: 'إضافة خبرة' },
    interests: { fr: 'Ajouter les centres d interet', en: 'Add interests', ar: 'إضافة الاهتمامات' },
    cv: { fr: 'Ajouter un CV', en: 'Add a resume', ar: 'إضافة السيرة الذاتية' },
    verification: { fr: 'Lancer la verification', en: 'Start verification', ar: 'بدء التوثيق' },
    privacy: { fr: 'Configurer la confidentialite', en: 'Set privacy', ar: 'ضبط الخصوصية' },
  };

  return fromMap(locale, id, { fr: fallback || 'Element de profil', en: fallback || 'Profile item', ar: fallback || 'عنصر الملف' }, labels);
}

