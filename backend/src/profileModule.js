const crypto = require("crypto");
const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");
const path = require("path");
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://user:1234@localhost:5432/communium";
const pool = new Pool({ connectionString: DATABASE_URL });
const DEFAULT_ADMIN_EMAILS = ["masinandrorasolonnjatovo@gmail.com"];

function loadClerkBackendSdk() {
  const candidates = [
    "@clerk/backend",
    path.resolve(__dirname, "..", "node_modules", "@clerk", "backend"),
    path.resolve(__dirname, "..", "..", "frontend", "node_modules", "@clerk", "backend"),
  ];

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      continue;
    }
  }

  return null;
}

const clerkBackendSdk = loadClerkBackendSdk();
const verifyToken = clerkBackendSdk?.verifyToken;

const uploadsRoot = path.resolve(__dirname, "..", "uploads");
const filePolicies = {
  profilePicture: {
    label: "Photo de profil",
    maxSize: 5 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
  },
  bannerImage: {
    label: "Photo de couverture",
    maxSize: 8 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
  },
  cv: {
    label: "CV",
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
  },
  identityDocument: {
    label: "Document d'identite",
    maxSize: 8 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  },
  passportDocument: {
    label: "Passeport",
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  },
  rcDocument: {
    label: "RC",
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  },
  iceDocument: {
    label: "ICE",
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  },
  ifDocument: {
    label: "IF",
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  },
  statutesDocument: {
    label: "Statuts societe",
    maxSize: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.max(...Object.values(filePolicies).map((policy) => policy.maxSize)),
  },
  fileFilter: (req, file, cb) => {
    try {
      validateUploadMetadata(file.fieldname, file);
      return cb(null, true);
    } catch (error) {
      return cb(error);
    }
  },
});

let schemaReadyPromise;

const profileFields = {
  firstName: "first_name",
  lastName: "last_name",
  bio: "bio",
  dateOfBirth: "date_of_birth",
  phone: "phone",
  email: "email",
  country: "country",
  city: "city",
  address: "address",
  currentJobTitle: "current_job_title",
  currentCompany: "current_company",
  currentIndustry: "current_industry",
  profession: "profession",
  currentPosition: "current_position",
  establishment: "establishment",
  experienceLevel: "experience_level",
  memberStatus: "member_status",
  availability: "availability",
  hometown: "hometown",
  websiteUrl: "website_url",
  portfolioUrl: "portfolio_url",
  githubUrl: "github_url",
  linkedinUrl: "linkedin_url",
  behanceUrl: "behance_url",
  xUrl: "x_url",
  instagramUrl: "instagram_url",
  languages: "languages",
  education: "education",
  primarySkills: "primary_skills",
  membershipTier: "membership_tier",
};

const privacyVisibilityFields = {
  emailVisibility: "email_visibility",
  phoneVisibility: "phone_visibility",
  dateOfBirthVisibility: "date_of_birth_visibility",
  identityDocumentVisibility: "identity_document_visibility",
  addressVisibility: "address_visibility",
  cityVisibility: "city_visibility",
  countryVisibility: "country_visibility",
  cvVisibility: "cv_visibility",
  professionalExperienceVisibility: "professional_experience_visibility",
  interestsVisibility: "interests_visibility",
  professionVisibility: "profession_visibility",
  photoVisibility: "photo_visibility",
  bannerVisibility: "banner_visibility",
  bioVisibility: "bio_visibility",
};

const legacyPrivacyBooleanFields = {
  showEmail: "show_email",
  showPhone: "show_phone",
  showDateOfBirth: "show_date_of_birth",
  showAddress: "show_address",
  showProfessionalExp: "show_professional_exp",
  showInterests: "show_interests",
  showCV: "show_cv",
};

const privacyFields = {
  ...privacyVisibilityFields,
  ...legacyPrivacyBooleanFields,
  profileVisibility: "profile_visibility",
  allowSearchEngines: "allow_search_engines",
  allowNetworkingRequests: "allow_networking_requests",
};

const defaultPrivacySettings = {
  emailVisibility: "Private",
  phoneVisibility: "Private",
  dateOfBirthVisibility: "Private",
  identityDocumentVisibility: "Private",
  addressVisibility: "Private",
  cityVisibility: "Public",
  countryVisibility: "Public",
  cvVisibility: "ContactsOnly",
  professionalExperienceVisibility: "Public",
  interestsVisibility: "Public",
  professionVisibility: "Public",
  photoVisibility: "Public",
  bannerVisibility: "Public",
  bioVisibility: "Public",
  profileVisibility: "Public",
  allowSearchEngines: true,
  allowNetworkingRequests: true,
};

const experienceFields = {
  jobTitle: "job_title",
  company: "company",
  industry: "industry",
  experienceType: "experience_type",
  startDate: "start_date",
  endDate: "end_date",
  isCurrent: "is_current",
  description: "description",
  location: "location",
  skillsUsed: "skills_used",
  sortOrder: "sort_order",
};

const memberStatuses = ["etudiant", "stagiaire", "employe", "freelance", "entrepreneur", "recruteur", "investisseur", "mentor"];
const experienceLevels = ["debutant", "junior", "intermediaire", "senior", "expert", "lead"];
const experienceTypes = ["stage", "emploi", "freelance", "projet", "benevolat", "formation"];
const membershipTiers = ["Free", "Silver", "Gold", "Platinum"];
const verificationStatuses = ["NON_VERIFIED", "PENDING", "VERIFIED", "REJECTED"];
const verificationAccountTypes = ["PERSONAL", "BUSINESS"];
const verificationDocumentTypes = ["CIN", "PASSPORT", "RC", "ICE", "IF", "COMPANY_STATUTES"];
const verificationFieldToDocumentType = {
  identityDocument: "CIN",
  passportDocument: "PASSPORT",
  rcDocument: "RC",
  iceDocument: "ICE",
  ifDocument: "IF",
  statutesDocument: "COMPANY_STATUTES",
};
const verificationRequiredDocuments = {
  PERSONAL: ["CIN", "PASSPORT"],
  BUSINESS: ["RC", "ICE", "IF", "COMPANY_STATUTES"],
};
const verificationDocumentLabels = {
  CIN: "CIN",
  PASSPORT: "Passeport",
  RC: "RC",
  ICE: "ICE",
  IF: "IF",
  COMPANY_STATUTES: "Statuts societe",
};
const reservedProfileIdentifiers = new Set([
  "admin",
  "api",
  "login",
  "register",
  "settings",
  "profile",
  "dashboard",
]);
const uploadRatePolicies = {
  profilePicture: { windowMs: 10 * 60 * 1000, maxAttempts: 8 },
  bannerImage: { windowMs: 10 * 60 * 1000, maxAttempts: 6 },
  cv: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
  identityDocument: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
  passportDocument: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
  rcDocument: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
  iceDocument: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
  ifDocument: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
  statutesDocument: { windowMs: 10 * 60 * 1000, maxAttempts: 5 },
};
const uploadAttemptStore = new Map();
const privateFieldSecret =
  process.env.PROFILE_PRIVATE_FIELD_SECRET || process.env.CLERK_SECRET_KEY || process.env.AUTH_SECRET || "";

function asyncHandler(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch((error) => {
      if (res.headersSent) {
        return next(error);
      }

      const status = error.statusCode || error.status || 500;
      if (status >= 500) {
        console.error("Erreur serveur du module profil:", error);
      }

      return res.status(status).json({
        success: false,
        error: status >= 500 ? "Le profil est momentanement indisponible" : error.message,
      });
    });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getExtension(filename) {
  return path.extname(filename || "").toLowerCase();
}

function validateUploadMetadata(fieldName, file) {
  const policy = filePolicies[fieldName];

  if (!policy) {
    throw httpError(400, "Champ de fichier non supporte");
  }

  const extension = getExtension(file.originalname);
  const hasValidMime = policy.mimeTypes.includes(file.mimetype);
  const hasValidExtension = policy.extensions.includes(extension);

  if (!hasValidMime || !hasValidExtension) {
    throw httpError(
      400,
      `${policy.label}: format refuse. Formats autorises: ${policy.extensions.join(", ")}`
    );
  }
}

function validateUploadedFile(fieldName, file) {
  const policy = filePolicies[fieldName];

  if (!policy || !file) {
    throw httpError(400, "Fichier manquant");
  }

  validateUploadMetadata(fieldName, file);

  if (file.size > policy.maxSize) {
    throw httpError(
      400,
      `${policy.label}: taille maximale ${Math.round(policy.maxSize / (1024 * 1024))} Mo`
    );
  }
}

function isPdfBuffer(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "%PDF";
}

function readPngDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) {
    return null;
  }

  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);

    if (segmentLength < 2) {
      return null;
    }

    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpDimensions(buffer) {
  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length < 30 ||
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return null;
  }

  const chunk = buffer.subarray(12, 16).toString("ascii");

  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunk === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

function detectImageDimensions(file) {
  if (!file?.buffer) {
    return null;
  }

  if (file.mimetype === "image/png") {
    return readPngDimensions(file.buffer);
  }

  if (file.mimetype === "image/jpeg") {
    return readJpegDimensions(file.buffer);
  }

  if (file.mimetype === "image/webp") {
    return readWebpDimensions(file.buffer);
  }

  return null;
}

function validateDocumentIntegrity(file, { label, minWidth = 640, minHeight = 400 } = {}) {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0 || file.size === 0) {
    throw httpError(400, `${label || "Document"}: fichier vide ou corrompu`);
  }

  if (file.mimetype === "application/pdf") {
    if (!isPdfBuffer(file.buffer)) {
      throw httpError(400, `${label || "Document"}: PDF corrompu ou invalide`);
    }
    return;
  }

  const dimensions = detectImageDimensions(file);
  if (!dimensions?.width || !dimensions?.height) {
    throw httpError(400, `${label || "Document"}: image corrompue ou non lisible`);
  }

  if (dimensions.width < minWidth || dimensions.height < minHeight) {
    throw httpError(400, `${label || "Document"}: resolution minimale ${minWidth}x${minHeight}px`);
  }
}

function toPositiveInt(value, fallback = 1) {
  if (value !== undefined && value !== null) {
    const raw = String(value).trim();
    if (/^\d+$/.test(raw)) {
      const parsed = Number.parseInt(raw, 10);
      if (parsed > 0) {
        return parsed;
      }
    }

    if (raw) {
      const hash = crypto.createHash("sha256").update(raw).digest();
      return (hash.readUInt32BE(0) % 2000000000) + 1;
    }
  }

  return fallback;
}

function slugify(value, fallback = "profil") {
  const slug = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return slug || fallback;
}

function cleanString(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const text = String(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
  return text === "" ? null : text;
}

function isReservedProfileIdentifier(value) {
  return Boolean(value) && reservedProfileIdentifiers.has(String(value).trim().toLowerCase());
}

function assertProfileIdentifierAvailable(label, value) {
  if (isReservedProfileIdentifier(value)) {
    throw httpError(400, `${label} indisponible`);
  }
}

function toDateOnly(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function toIso(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function parseJsonObject(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }

  return Boolean(value);
}

function normalizeProfileVisibility(value) {
  if (["Public", "Private", "ContactsOnly"].includes(value)) {
    return value;
  }

  return undefined;
}

function normalizeFieldVisibility(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "public") {
      return "Public";
    }

    if (normalized === "private") {
      return "Private";
    }

    if (normalized === "contactsonly" || normalized === "contacts_only" || normalized === "contacts-only") {
      return "ContactsOnly";
    }
  }

  return normalizeProfileVisibility(value);
}

function normalizeDocumentType(value) {
  if (["CIN", "PASSPORT", "DRIVING_LICENSE"].includes(value)) {
    return value;
  }

  return undefined;
}

function normalizeVerificationStatus(value) {
  if (verificationStatuses.includes(value)) {
    return value;
  }

  return "NON_VERIFIED";
}

function normalizeAccountType(value) {
  if (!value) {
    return "PERSONAL";
  }

  const normalized = String(value).trim().toUpperCase();

  if (normalized === "BUSINESS") {
    return "BUSINESS";
  }

  return "PERSONAL";
}

function normalizeVerificationDocumentType(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toUpperCase();
  return verificationDocumentTypes.includes(normalized) ? normalized : null;
}

function verificationBadgeLabel(accountType, status) {
  if (normalizeVerificationStatus(status) !== "VERIFIED") {
    return null;
  }

  return normalizeAccountType(accountType) === "BUSINESS" ? "Entreprise verifiee" : "Profil verifie";
}

function enforceStringLength(label, value, max) {
  if (value && value.length > max) {
    throw httpError(400, `${label}: longueur maximale ${max} caracteres`);
  }
}

function sanitizeEmail(value) {
  const email = cleanString(value);

  if (!email) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw httpError(400, "Adresse email invalide");
  }

  enforceStringLength("Email", email, 120);
  return email.toLowerCase();
}

function sanitizePhone(value) {
  const phone = cleanString(value);

  if (!phone) {
    return null;
  }

  if (!/^[0-9+()\s-]{6,24}$/u.test(phone)) {
    throw httpError(400, "Numero de telephone invalide");
  }

  return phone;
}

function sanitizeDateOfBirth(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  const normalized = toDateOnly(cleaned);

  if (!normalized) {
    throw httpError(400, "Date de naissance invalide");
  }

  if (normalized > new Date().toISOString().slice(0, 10)) {
    throw httpError(400, "La date de naissance ne peut pas etre dans le futur");
  }

  return normalized;
}

function sanitizePublicProfileUrl(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  const slug = slugify(cleaned);

  if (slug.length < 3) {
    throw httpError(400, "URL publique trop courte");
  }

  assertProfileIdentifierAvailable("URL publique", slug);
  return slug;
}

function sanitizeUsername(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  if (!/^[a-zA-Z0-9-]{3,30}$/u.test(cleaned)) {
    throw httpError(
      400,
      "Username invalide: 3 a 30 caracteres, lettres, chiffres et tirets uniquement"
    );
  }

  const normalized = cleaned.toLowerCase();
  assertProfileIdentifierAvailable("Username", normalized);
  return normalized;
}

function safeUsername(value) {
  try {
    return sanitizeUsername(value);
  } catch {
    return null;
  }
}

function sanitizeStatus(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  const normalized = slugify(cleaned, "").replace(/-/g, "");
  const matched = memberStatuses.find((item) => item.replace(/-/g, "") === normalized);

  if (!matched) {
    throw httpError(400, "Statut professionnel invalide");
  }

  return matched;
}

function sanitizeExperienceLevel(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  const normalized = slugify(cleaned, "").replace(/-/g, "");
  const matched = experienceLevels.find((item) => item.replace(/-/g, "") === normalized);

  if (!matched) {
    throw httpError(400, "Niveau d'experience invalide");
  }

  return matched;
}

function sanitizeMembershipTier(value) {
  if (value === undefined) {
    return undefined;
  }

  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  const matched = membershipTiers.find((item) => item.toLowerCase() === cleaned.toLowerCase());

  if (!matched) {
    throw httpError(400, "Abonnement invalide");
  }

  return matched;
}

function sanitizeExperienceType(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  const normalized = slugify(cleaned, "");
  const matched = experienceTypes.find((item) => item === normalized);

  if (!matched) {
    throw httpError(400, "Type d'experience invalide");
  }

  return matched;
}

function sanitizeStringArray(value, label, { minLength = 2, maxLength = 60, maxItems = 24 } = {}) {
  if (value === undefined) {
    return undefined;
  }

  const source = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const unique = [];
  const seen = new Set();

  for (const entry of source) {
    const text = cleanString(entry);

    if (!text) {
      continue;
    }

    if (text.length < minLength) {
      throw httpError(400, `${label}: chaque element doit contenir au moins ${minLength} caracteres`);
    }

    if (text.length > maxLength) {
      throw httpError(400, `${label}: chaque element doit contenir au maximum ${maxLength} caracteres`);
    }

    const key = text.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(text);
    }
  }

  if (unique.length > maxItems) {
    throw httpError(400, `${label}: maximum ${maxItems} elements`);
  }

  return unique;
}

function sanitizeProfilePayload(body = {}) {
  const payload = {
    username: sanitizeUsername(body.username),
    firstName: cleanString(body.firstName),
    lastName: cleanString(body.lastName),
    bio: cleanString(body.bio),
    dateOfBirth: sanitizeDateOfBirth(body.dateOfBirth),
    phone: sanitizePhone(body.phone),
    email: sanitizeEmail(body.email),
    country: cleanString(body.country),
    city: cleanString(body.city),
    address: cleanString(body.address),
    currentJobTitle: cleanString(body.currentJobTitle),
    currentCompany: cleanString(body.currentCompany),
    currentIndustry: cleanString(body.currentIndustry),
    profession: cleanString(body.profession),
    currentPosition: cleanString(body.currentPosition),
    establishment: cleanString(body.establishment),
    experienceLevel: sanitizeExperienceLevel(body.experienceLevel),
    memberStatus: sanitizeStatus(body.memberStatus),
    primarySkills: sanitizeStringArray(body.primarySkills, "Competences principales", {
      minLength: 2,
      maxLength: 60,
      maxItems: 16,
    }),
    membershipTier: sanitizeMembershipTier(body.membershipTier),
    publicProfileUrl: sanitizePublicProfileUrl(body.publicProfileUrl),
  };

  enforceStringLength("Prenom", payload.firstName, 80);
  enforceStringLength("Nom", payload.lastName, 80);
  enforceStringLength("Bio", payload.bio, 300);
  enforceStringLength("Pays", payload.country, 80);
  enforceStringLength("Ville", payload.city, 80);
  enforceStringLength("Adresse", payload.address, 240);
  enforceStringLength("Titre du profil", payload.currentJobTitle, 160);
  enforceStringLength("Entreprise", payload.currentCompany, 160);
  enforceStringLength("Secteur", payload.currentIndustry, 120);
  enforceStringLength("Profession", payload.profession, 160);
  enforceStringLength("Poste actuel", payload.currentPosition, 160);
  enforceStringLength("Etablissement", payload.establishment, 160);

  return payload;
}

function sanitizeExperiencePayload(body = {}) {
  const payload = {
    jobTitle: cleanString(body.jobTitle),
    company: cleanString(body.company),
    industry: cleanString(body.industry),
    experienceType: sanitizeExperienceType(body.experienceType),
    startDate: cleanString(body.startDate) ? toDateOnly(body.startDate) : null,
    endDate: cleanString(body.endDate) ? toDateOnly(body.endDate) : null,
    isCurrent: normalizeBoolean(body.isCurrent),
    description: cleanString(body.description),
    location: cleanString(body.location),
    skillsUsed: sanitizeStringArray(body.skillsUsed, "Competences utilisees", {
      minLength: 2,
      maxLength: 60,
      maxItems: 12,
    }),
    sortOrder: body.sortOrder === undefined || body.sortOrder === null ? undefined : Number(body.sortOrder),
  };

  enforceStringLength("Poste", payload.jobTitle, 140);
  enforceStringLength("Entreprise", payload.company, 140);
  enforceStringLength("Secteur", payload.industry, 120);
  enforceStringLength("Lieu", payload.location, 120);
  enforceStringLength("Description", payload.description, 1600);

  if (payload.sortOrder !== undefined && (!Number.isInteger(payload.sortOrder) || payload.sortOrder < 0)) {
    throw httpError(400, "Ordre d'experience invalide");
  }

  if (cleanString(body.startDate) && !payload.startDate) {
    throw httpError(400, "Date de debut invalide");
  }

  if (cleanString(body.endDate) && !payload.endDate) {
    throw httpError(400, "Date de fin invalide");
  }

  if (payload.startDate && payload.endDate && payload.endDate < payload.startDate) {
    throw httpError(400, "La date de fin doit etre apres la date de debut");
  }

  if (payload.isCurrent) {
    payload.endDate = null;
  }

  return payload;
}

function sanitizeInterestName(value) {
  const name = cleanString(value);

  if (!name) {
    return null;
  }

  if (name.length < 2) {
    throw httpError(400, "Chaque centre d'interet doit contenir au moins 2 caracteres");
  }

  enforceStringLength("Centre d'interet", name, 60);
  return name;
}

function validateImageIntegrity(fieldName, file, { minWidth = 160, minHeight = 160 } = {}) {
  const policy = filePolicies[fieldName];
  validateDocumentIntegrity(file, {
    label: policy?.label || "Image",
    minWidth,
    minHeight,
  });
}

function sanitizeCropPayload(rawCrop) {
  const crop = parseJsonObject(rawCrop, rawCrop);

  if (!crop || typeof crop !== "object") {
    throw httpError(400, "Coordonnees de recadrage invalides");
  }

  const fallbackSize = Math.max(160, Number(crop.outputSize ?? crop.outputWidth ?? crop.outputHeight ?? 512) || 512);
  const safeDimension = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return fallbackSize;
    }

    return Math.max(64, numeric);
  };

  const numericCrop = {
    x: Number(crop.x ?? crop.left ?? 0),
    y: Number(crop.y ?? crop.top ?? 0),
    size: safeDimension(crop.size ?? crop.width ?? crop.height),
    width: safeDimension(crop.width ?? crop.size),
    height: safeDimension(crop.height ?? crop.size),
    outputSize: Number(crop.outputSize ?? crop.outputWidth ?? 512),
    outputWidth: Number(crop.outputWidth ?? crop.outputSize ?? 512),
    outputHeight: Number(crop.outputHeight ?? crop.outputSize ?? 512),
    sourceWidth: Number(crop.sourceWidth ?? 0),
    sourceHeight: Number(crop.sourceHeight ?? 0),
  };

  const values = Object.values(numericCrop);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw httpError(400, "Coordonnees de recadrage invalides");
  }

  numericCrop.outputSize = Math.max(128, Math.min(1024, Math.round(numericCrop.outputSize || 512)));
  numericCrop.outputWidth = Math.max(128, Math.min(1024, Math.round(numericCrop.outputWidth || numericCrop.outputSize)));
  numericCrop.outputHeight = Math.max(128, Math.min(1024, Math.round(numericCrop.outputHeight || numericCrop.outputSize)));

  return numericCrop;
}

function getBearerToken(req) {
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return "";
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function getDevelopmentHeaderUser(req) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const sourceId =
    cleanString(req.headers["x-user-id"]) ||
    cleanString(req.headers["x-clerk-user-id"]) ||
    sanitizeEmail(req.headers["x-user-email"]);

  if (!sourceId) {
    return null;
  }

  return {
    sub: sourceId,
    name: cleanString(req.headers["x-user-name"]),
    username: safeUsername(req.headers["x-user-username"]),
    email: sanitizeEmail(req.headers["x-user-email"]),
    email_address: sanitizeEmail(req.headers["x-user-email"]),
    unsafe_metadata: {
      accountType: req.headers["x-user-account-type"],
    },
    public_metadata: {
      accountType: req.headers["x-user-account-type"],
    },
  };
}

async function verifyClerkSessionToken(req) {
  const token = getBearerToken(req);
  const developmentHeaderUser = getDevelopmentHeaderUser(req);

  if (!token) {
    if (developmentHeaderUser) {
      return developmentHeaderUser;
    }

    throw httpError(401, "Authentification Clerk requise");
  }

  if (typeof verifyToken !== "function") {
    if (developmentHeaderUser) {
      return developmentHeaderUser;
    }

    throw httpError(500, "SDK Clerk backend introuvable sur le serveur");
  }

  if (!process.env.CLERK_SECRET_KEY) {
    if (developmentHeaderUser) {
      return developmentHeaderUser;
    }

    throw httpError(500, "Configuration Clerk manquante sur le backend");
  }

  try {
    const verification = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!verification?.sub) {
      throw httpError(401, "Session Clerk invalide");
    }

    return verification;
  } catch (error) {
    if (developmentHeaderUser) {
      return developmentHeaderUser;
    }

    if (error?.status) {
      throw error;
    }

    throw httpError(401, "Session Clerk invalide");
  }
}

function getRequestActorKey(req, user, action) {
  const forwarded = Array.isArray(req.headers["x-forwarded-for"])
    ? req.headers["x-forwarded-for"][0]
    : req.headers["x-forwarded-for"];
  const ip = cleanString(forwarded) || cleanString(req.ip) || "unknown-ip";
  return `${action}:${user?.id || 0}:${ip}`;
}

function enforceUploadRateLimit(req, user, fieldName) {
  const policy = uploadRatePolicies[fieldName];

  if (!policy) {
    return;
  }

  const now = Date.now();
  const key = getRequestActorKey(req, user, fieldName);
  const recentAttempts = (uploadAttemptStore.get(key) || []).filter(
    (timestamp) => now - timestamp < policy.windowMs
  );

  if (recentAttempts.length >= policy.maxAttempts) {
    throw httpError(
      429,
      `${filePolicies[fieldName]?.label || "Fichier"}: trop de tentatives, reessayez plus tard`
    );
  }

  recentAttempts.push(now);
  uploadAttemptStore.set(key, recentAttempts);
}

async function ensureProfileSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = pool
      .query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('VIP', 'Regular', 'Youth');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        DO $$ BEGIN
          CREATE TYPE membership_tier AS ENUM ('Free', 'Silver', 'Gold', 'Platinum');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        DO $$ BEGIN
          CREATE TYPE privacy_level AS ENUM ('Public', 'Private', 'ContactsOnly');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        DO $$ BEGIN
          CREATE TYPE document_type AS ENUM ('CIN', 'PASSPORT', 'DRIVING_LICENSE');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        DO $$ BEGIN
          CREATE TYPE account_type AS ENUM ('PERSONAL', 'BUSINESS');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        DO $$ BEGIN
          CREATE TYPE verification_status AS ENUM ('NON_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        DO $$ BEGIN
          CREATE TYPE verification_document_type AS ENUM ('CIN', 'PASSPORT', 'RC', 'ICE', 'IF', 'COMPANY_STATUTES');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          role user_role NOT NULL DEFAULT 'Regular',
          account_type account_type NOT NULL DEFAULT 'PERSONAL',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          bio VARCHAR(300),
          date_of_birth DATE,
          phone TEXT,
          email VARCHAR(100),
          country VARCHAR(100),
          city VARCHAR(100),
          address TEXT,
          identity_verified BOOLEAN DEFAULT FALSE,
          identity_document_type document_type,
          identity_document_number TEXT,
          identity_document_url TEXT,
          profile_picture_url TEXT,
          profile_picture_crop JSONB,
          banner_url TEXT,
          current_job_title VARCHAR(200),
          current_company VARCHAR(200),
          current_industry VARCHAR(100),
          profession VARCHAR(160),
          current_position VARCHAR(160),
          establishment VARCHAR(160),
          experience_level VARCHAR(80),
          member_status VARCHAR(80),
          availability VARCHAR(120),
          hometown VARCHAR(120),
          website_url TEXT,
          portfolio_url TEXT,
          github_url TEXT,
          linkedin_url TEXT,
          behance_url TEXT,
          x_url TEXT,
          instagram_url TEXT,
          languages JSONB DEFAULT '[]'::jsonb,
          education JSONB DEFAULT '[]'::jsonb,
          primary_skills JSONB DEFAULT '[]'::jsonb,
          membership_tier membership_tier DEFAULT 'Free',
          profile_views_count INTEGER DEFAULT 0,
          connections_count INTEGER DEFAULT 0,
          cv_download_count INTEGER DEFAULT 0,
          cv_url TEXT,
          public_profile_url VARCHAR(100) UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS professional_experiences (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          job_title VARCHAR(200) NOT NULL,
          company VARCHAR(200) NOT NULL,
          industry VARCHAR(100),
          experience_type VARCHAR(50),
          start_date DATE NOT NULL,
          end_date DATE,
          is_current BOOLEAN DEFAULT FALSE,
          description TEXT,
          location VARCHAR(200),
          skills_used JSONB DEFAULT '[]'::jsonb,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS interests (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          category VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS profile_interests (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          interest_id INTEGER NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(profile_id, interest_id)
        );

        CREATE TABLE IF NOT EXISTS profile_settings (
          id SERIAL PRIMARY KEY,
          profile_id INTEGER UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          show_email BOOLEAN DEFAULT FALSE,
          show_phone BOOLEAN DEFAULT FALSE,
          show_date_of_birth BOOLEAN DEFAULT FALSE,
          show_address BOOLEAN DEFAULT FALSE,
          show_professional_exp BOOLEAN DEFAULT TRUE,
          show_interests BOOLEAN DEFAULT TRUE,
          show_cv BOOLEAN DEFAULT FALSE,
          profile_visibility privacy_level DEFAULT 'Public',
          allow_search_engines BOOLEAN DEFAULT TRUE,
          allow_networking_requests BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS verifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type account_type NOT NULL DEFAULT 'PERSONAL',
          status verification_status NOT NULL DEFAULT 'NON_VERIFIED',
          rejection_reason TEXT,
          submitted_at TIMESTAMP,
          reviewed_at TIMESTAMP,
          reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS verification_documents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
          document_type verification_document_type NOT NULL,
          file_url TEXT NOT NULL,
          file_name TEXT NOT NULL,
          mime_type VARCHAR(120) NOT NULL,
          file_size INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(verification_id, document_type)
        );

        CREATE TABLE IF NOT EXISTS verification_notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          verification_id UUID REFERENCES verifications(id) ON DELETE CASCADE,
          status verification_status NOT NULL DEFAULT 'NON_VERIFIED',
          title VARCHAR(180) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          read_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS verification_audit_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
          actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(80) NOT NULL,
          details JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS verification_document_access_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          document_id UUID NOT NULL REFERENCES verification_documents(id) ON DELETE CASCADE,
          viewer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          viewer_type VARCHAR(32) NOT NULL,
          access_reason VARCHAR(64) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS email_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS phone_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS date_of_birth_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS identity_document_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS address_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS city_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS country_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS cv_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS professional_experience_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS interests_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS profession_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS photo_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS banner_visibility privacy_level;
        ALTER TABLE profile_settings ADD COLUMN IF NOT EXISTS bio_visibility privacy_level;

        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio VARCHAR(300);
        ALTER TABLE profiles ALTER COLUMN phone TYPE TEXT;
        ALTER TABLE profiles ALTER COLUMN identity_document_number TYPE TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profession VARCHAR(160);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_position VARCHAR(160);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS establishment VARCHAR(160);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level VARCHAR(80);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_status VARCHAR(80);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability VARCHAR(120);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hometown VARCHAR(120);
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS behance_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS x_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_skills JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_tier membership_tier DEFAULT 'Free';
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS connections_count INTEGER DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cv_download_count INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type account_type DEFAULT 'PERSONAL';

        ALTER TABLE professional_experiences ADD COLUMN IF NOT EXISTS experience_type VARCHAR(50);
        ALTER TABLE professional_experiences ADD COLUMN IF NOT EXISTS skills_used JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE professional_experiences ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

        UPDATE profile_settings
        SET
          email_visibility = COALESCE(email_visibility, CASE WHEN show_email THEN 'Public'::privacy_level ELSE 'Private'::privacy_level END),
          phone_visibility = COALESCE(phone_visibility, CASE WHEN show_phone THEN 'Public'::privacy_level ELSE 'Private'::privacy_level END),
          date_of_birth_visibility = COALESCE(date_of_birth_visibility, CASE WHEN show_date_of_birth THEN 'Public'::privacy_level ELSE 'Private'::privacy_level END),
          identity_document_visibility = COALESCE(identity_document_visibility, 'Private'::privacy_level),
          address_visibility = COALESCE(address_visibility, CASE WHEN show_address THEN 'Public'::privacy_level ELSE 'Private'::privacy_level END),
          city_visibility = COALESCE(city_visibility, 'Public'::privacy_level),
          country_visibility = COALESCE(country_visibility, 'Public'::privacy_level),
          cv_visibility = COALESCE(cv_visibility, CASE WHEN show_cv THEN 'Public'::privacy_level ELSE 'ContactsOnly'::privacy_level END),
          professional_experience_visibility = COALESCE(professional_experience_visibility, CASE WHEN show_professional_exp THEN 'Public'::privacy_level ELSE 'Private'::privacy_level END),
          interests_visibility = COALESCE(interests_visibility, CASE WHEN show_interests THEN 'Public'::privacy_level ELSE 'Private'::privacy_level END),
          profession_visibility = COALESCE(profession_visibility, 'Public'::privacy_level),
          photo_visibility = COALESCE(photo_visibility, 'Public'::privacy_level),
          banner_visibility = COALESCE(banner_visibility, 'Public'::privacy_level),
          bio_visibility = COALESCE(bio_visibility, 'Public'::privacy_level);

        ALTER TABLE profile_settings ALTER COLUMN email_visibility SET DEFAULT 'Private';
        ALTER TABLE profile_settings ALTER COLUMN phone_visibility SET DEFAULT 'Private';
        ALTER TABLE profile_settings ALTER COLUMN date_of_birth_visibility SET DEFAULT 'Private';
        ALTER TABLE profile_settings ALTER COLUMN identity_document_visibility SET DEFAULT 'Private';
        ALTER TABLE profile_settings ALTER COLUMN address_visibility SET DEFAULT 'Private';
        ALTER TABLE profile_settings ALTER COLUMN city_visibility SET DEFAULT 'Public';
        ALTER TABLE profile_settings ALTER COLUMN country_visibility SET DEFAULT 'Public';
        ALTER TABLE profile_settings ALTER COLUMN cv_visibility SET DEFAULT 'ContactsOnly';
        ALTER TABLE profile_settings ALTER COLUMN professional_experience_visibility SET DEFAULT 'Public';
        ALTER TABLE profile_settings ALTER COLUMN interests_visibility SET DEFAULT 'Public';
        ALTER TABLE profile_settings ALTER COLUMN profession_visibility SET DEFAULT 'Public';
        ALTER TABLE profile_settings ALTER COLUMN photo_visibility SET DEFAULT 'Public';
        ALTER TABLE profile_settings ALTER COLUMN banner_visibility SET DEFAULT 'Public';
        ALTER TABLE profile_settings ALTER COLUMN bio_visibility SET DEFAULT 'Public';
        ALTER TABLE users ALTER COLUMN account_type SET DEFAULT 'PERSONAL';

        CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_profiles_public_profile_url ON profiles(public_profile_url);
        CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(country, city);
        CREATE INDEX IF NOT EXISTS idx_professional_experiences_profile_id ON professional_experiences(profile_id);
        CREATE INDEX IF NOT EXISTS idx_profile_interests_profile_id ON profile_interests(profile_id);
        CREATE INDEX IF NOT EXISTS idx_profile_interests_interest_id ON profile_interests(interest_id);
        CREATE INDEX IF NOT EXISTS idx_profile_settings_visibility ON profile_settings(profile_visibility);
        CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);
        CREATE INDEX IF NOT EXISTS idx_verification_documents_verification ON verification_documents(verification_id);

        CREATE TABLE IF NOT EXISTS profile_posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          post_type VARCHAR(32) NOT NULL DEFAULT 'text',
          body TEXT NOT NULL,
          visibility VARCHAR(32) NOT NULL DEFAULT 'public',
          show_on_profile BOOLEAN NOT NULL DEFAULT TRUE,
          pinned BOOLEAN NOT NULL DEFAULT FALSE,
          attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
          stats JSONB NOT NULL DEFAULT '{"likes":0,"comments":0,"shares":0,"saves":0}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_profile_posts_profile ON profile_posts(profile_id, show_on_profile, pinned, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_verification_notifications_user ON verification_notifications(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_verification_audit_logs_verification ON verification_audit_logs(verification_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_verification_document_access_logs_document ON verification_document_access_logs(document_id, created_at DESC);

        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_professional_experiences_updated_at ON professional_experiences;
        CREATE TRIGGER update_professional_experiences_updated_at BEFORE UPDATE ON professional_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_interests_updated_at ON interests;
        CREATE TRIGGER update_interests_updated_at BEFORE UPDATE ON interests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_profile_settings_updated_at ON profile_settings;
        CREATE TRIGGER update_profile_settings_updated_at BEFORE UPDATE ON profile_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_verifications_updated_at ON verifications;
        CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_verification_documents_updated_at ON verification_documents;
        CREATE TRIGGER update_verification_documents_updated_at BEFORE UPDATE ON verification_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        CREATE OR REPLACE FUNCTION create_default_profile_settings()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO profile_settings (profile_id)
          VALUES (NEW.id)
          ON CONFLICT (profile_id) DO NOTHING;
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS create_profile_settings_after_profile_insert ON profiles;
        CREATE TRIGGER create_profile_settings_after_profile_insert
        AFTER INSERT ON profiles
        FOR EACH ROW EXECUTE FUNCTION create_default_profile_settings();

        CREATE OR REPLACE VIEW public_profiles_search AS
        SELECT
          p.id,
          p.public_profile_url,
          p.first_name,
          p.last_name,
          p.country,
          p.city,
          p.current_job_title,
          p.current_company,
          p.current_industry,
          p.profile_picture_url,
          p.updated_at
        FROM profiles p
        LEFT JOIN profile_settings ps ON ps.profile_id = p.id
        WHERE COALESCE(ps.profile_visibility::text, 'Public') = 'Public';

        INSERT INTO interests (name, category) VALUES
          ('Technologie', 'Professionnel'),
          ('Intelligence Artificielle', 'Professionnel'),
          ('Developpement Web', 'Professionnel'),
          ('Data Science', 'Professionnel'),
          ('Marketing Digital', 'Professionnel'),
          ('Finance', 'Professionnel'),
          ('Sante', 'Professionnel'),
          ('Education', 'Professionnel'),
          ('Voyages', 'Personnel'),
          ('Sport', 'Personnel'),
          ('Musique', 'Personnel'),
          ('Cinema', 'Personnel'),
          ('Lecture', 'Personnel'),
          ('Cuisine', 'Personnel'),
          ('Photographie', 'Personnel'),
          ('Art', 'Personnel'),
          ('Entrepreneuriat', 'Professionnel'),
          ('Innovation', 'Professionnel'),
          ('Leadership', 'Professionnel'),
          ('Reseautage', 'Professionnel')
        ON CONFLICT (name) DO NOTHING;

        INSERT INTO verifications (user_id, type, status, submitted_at, reviewed_at)
        SELECT
          p.user_id,
          COALESCE(u.account_type, 'PERSONAL'::account_type),
          CASE WHEN p.identity_verified THEN 'VERIFIED'::verification_status ELSE 'PENDING'::verification_status END,
          p.updated_at,
          CASE WHEN p.identity_verified THEN p.updated_at ELSE NULL END
        FROM profiles p
        JOIN users u ON u.id = p.user_id
        WHERE p.identity_document_url IS NOT NULL
        ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO verification_documents (verification_id, document_type, file_url, file_name, mime_type, file_size)
        SELECT
          v.id,
          CASE COALESCE(p.identity_document_type::text, 'CIN')
            WHEN 'PASSPORT' THEN 'PASSPORT'::verification_document_type
            ELSE 'CIN'::verification_document_type
          END,
          p.identity_document_url,
          regexp_replace(p.identity_document_url, '^.*/', ''),
          CASE
            WHEN p.identity_document_url ILIKE '%.pdf' THEN 'application/pdf'
            WHEN p.identity_document_url ILIKE '%.png' THEN 'image/png'
            WHEN p.identity_document_url ILIKE '%.webp' THEN 'image/webp'
            ELSE 'image/jpeg'
          END,
          0
        FROM profiles p
        JOIN verifications v ON v.user_id = p.user_id
        WHERE p.identity_document_url IS NOT NULL
        ON CONFLICT (verification_id, document_type) DO NOTHING;
      `)
      .catch((error) => {
        schemaReadyPromise = undefined;
        throw error;
      });
  }

  return schemaReadyPromise;
}

async function query(sql, params = []) {
  await ensureProfileSchema();
  return pool.query(sql, params);
}

async function ensureUploadDir(bucket) {
  const dir = path.join(uploadsRoot, bucket);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function sanitizeFilename(filename) {
  const extension = path.extname(filename || "").toLowerCase();
  const basename = path
    .basename(filename || "upload", extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return `${basename || "upload"}-${crypto.randomUUID()}${extension}`;
}

function getPrivateFieldEncryptionKey() {
  if (!privateFieldSecret) {
    return null;
  }

  return crypto.createHash("sha256").update(privateFieldSecret).digest();
}

function encryptPrivateField(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  if (cleaned.startsWith("enc:v1:")) {
    return cleaned;
  }

  const key = getPrivateFieldEncryptionKey();

  if (!key) {
    return cleaned;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(cleaned, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("base64url")}:${authTag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

function decryptPrivateField(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  if (!cleaned.startsWith("enc:v1:")) {
    return cleaned;
  }

  const key = getPrivateFieldEncryptionKey();

  if (!key) {
    return null;
  }

  const [, , ivRaw, authTagRaw, encryptedRaw] = cleaned.split(":");

  if (!ivRaw || !authTagRaw || !encryptedRaw) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivRaw, "base64url")
    );
    decipher.setAuthTag(Buffer.from(authTagRaw, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

async function saveUpload(file, bucket) {
  const dir = await ensureUploadDir(bucket);
  const filename = sanitizeFilename(file.originalname);
  const targetPath = path.join(dir, filename);
  await fs.writeFile(targetPath, file.buffer);
  return `/uploads/${bucket}/${filename}`;
}

function resolveUploadUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") {
    return null;
  }

  const cleanPath = fileUrl.replace(/^\/+/, "");
  if (!cleanPath.startsWith("uploads/")) {
    return null;
  }

  const resolved = path.resolve(path.join(__dirname, "..", cleanPath));
  if (!resolved.startsWith(uploadsRoot)) {
    return null;
  }

  return resolved;
}

async function deleteUpload(fileUrl) {
  const filePath = resolveUploadUrl(fileUrl);
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Impossible de supprimer le fichier:", fileUrl, error.message);
    }
  }
}

async function getRequestUserData(req) {
  const verifiedToken = await verifyClerkSessionToken(req);
  const sourceId = verifiedToken.sub;
  const id = toPositiveInt(sourceId);
  const rawName =
    cleanString(req.headers["x-user-name"]) ||
    cleanString(verifiedToken.name) ||
    cleanString(verifiedToken.given_name) ||
    `Utilisateur ${id}`;
  const username =
    safeUsername(req.headers["x-user-username"]) ||
    safeUsername(verifiedToken.username || verifiedToken.preferred_username) ||
    slugify(rawName, `user-${id}`).slice(0, 30);
  const email =
    sanitizeEmail(req.headers["x-user-email"]) ||
    sanitizeEmail(verifiedToken.email || verifiedToken.email_address) ||
    `member-${id}@communium.local`;
  const role = ["VIP", "Regular", "Youth"].includes(req.headers["x-user-role"])
    ? req.headers["x-user-role"]
    : "Regular";
  const accountType =
    normalizeAccountType(req.headers["x-user-account-type"] || req.headers["x-account-type"]) ||
    normalizeAccountType(verifiedToken?.unsafe_metadata?.accountType || verifiedToken?.public_metadata?.accountType);

  return { id, clerkUserId: sourceId, username, email, role, accountType };
}

async function ensureUser(req) {
  const user = await getRequestUserData(req);
  const existing = await query("SELECT id, username, email, role, account_type FROM users WHERE id = $1", [user.id]);

  if (existing.rowCount > 0) {
    const row = existing.rows[0];
    await query(
      `
        UPDATE users
        SET role = $2,
            email = COALESCE($3, email),
            account_type = COALESCE($4, account_type, 'PERSONAL'::account_type),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [user.id, user.role, user.email, user.accountType]
    );

    return {
      ...row,
      role: user.role,
      email: row.email || user.email,
      accountType: row.account_type || user.accountType || "PERSONAL",
    };
  }

  const uniqueUsername = await makeUniqueUsername(user.username, user.id);

  try {
    const result = await query(
      `
        INSERT INTO users (id, username, email, role, account_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, role, account_type
      `,
      [user.id, uniqueUsername, user.email, user.role, user.accountType]
    );

    await query(
      "SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1), true)"
    );

    return result.rows[0];
  } catch (error) {
    if (error.code !== "23505") {
      throw error;
    }

    const conflictingUser = await query(
      "SELECT id, username, email, role, account_type FROM users WHERE id = $1 OR email = $2 OR username = $3 ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END LIMIT 1",
      [user.id, user.email, uniqueUsername]
    );

    if (conflictingUser.rowCount > 0) {
      const row = conflictingUser.rows[0];
      await query(
        `
          UPDATE users
          SET role = $2,
              email = COALESCE(email, $3),
              account_type = COALESCE(account_type, $4, 'PERSONAL'::account_type),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [row.id, user.role, user.email, user.accountType]
      );

      return {
        ...row,
        role: user.role,
        email: row.email || user.email,
        accountType: row.account_type || user.accountType || "PERSONAL",
      };
    }

    const fallbackEmail = `member-${user.id}@communium.local`;
    try {
      const result = await query(
        `
          INSERT INTO users (id, username, email, role, account_type)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, username, email, role, account_type
        `,
        [user.id, uniqueUsername, fallbackEmail, user.role, user.accountType]
      );

      return result.rows[0];
    } catch (fallbackError) {
      if (fallbackError.code !== "23505") {
        throw fallbackError;
      }

      const recovered = await query(
        "SELECT id, username, email, role, account_type FROM users WHERE id = $1 OR email = $2 OR username = $3 ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END LIMIT 1",
        [user.id, fallbackEmail, uniqueUsername]
      );

      if (recovered.rowCount > 0) {
        return recovered.rows[0];
      }

      throw fallbackError;
    }
  }
}

async function makeUniquePublicUrl(base, userId, currentProfileId = null) {
  const baseCandidate = slugify(base, `user-${userId}`);
  const safeBaseCandidate = isReservedProfileIdentifier(baseCandidate) ? `user-${userId}` : baseCandidate;
  let candidate = safeBaseCandidate;
  let suffix = 1;

  while (true) {
    const result = await query(
      "SELECT id FROM profiles WHERE public_profile_url = $1 AND ($2::integer IS NULL OR id <> $2)",
      [candidate, currentProfileId]
    );

    if (result.rowCount === 0) {
      return candidate;
    }

    suffix += 1;
    candidate = `${safeBaseCandidate.slice(0, 84)}-${suffix}`;
  }
}

async function makeUniqueUsername(base, currentUserId = null) {
  const generatedFallback = currentUserId ? `member-${currentUserId}` : "member";
  const baseCandidate = safeUsername(base) || slugify(base, generatedFallback).slice(0, 30);
  const safeBaseCandidate = isReservedProfileIdentifier(baseCandidate) ? generatedFallback : baseCandidate;
  let candidate = safeBaseCandidate.slice(0, 30);
  let suffix = 1;

  while (true) {
    const result = await query(
      "SELECT id FROM users WHERE username = $1 AND ($2::integer IS NULL OR id <> $2)",
      [candidate, currentUserId]
    );

    if (result.rowCount === 0) {
      return candidate;
    }

    suffix += 1;
    candidate = `${safeBaseCandidate.slice(0, 24)}-${suffix}`;
  }
}

async function ensureProfileForUser(user, seed = {}) {
  const existing = await query("SELECT id FROM profiles WHERE user_id = $1", [user.id]);
  if (existing.rowCount > 0) {
    await ensureDefaultPrivacy(existing.rows[0].id);
    return existing.rows[0].id;
  }

  const firstName = cleanString(seed.firstName);
  const lastName = cleanString(seed.lastName);
  const baseUrl =
    cleanString(seed.publicProfileUrl) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    user.username ||
    `user-${user.id}`;
  const publicProfileUrl = await makeUniquePublicUrl(baseUrl, user.id);

  const result = await query(
    `
      INSERT INTO profiles (user_id, first_name, last_name, email, public_profile_url)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE
      SET email = COALESCE(profiles.email, EXCLUDED.email)
      RETURNING id
    `,
    [user.id, firstName, lastName, user.email, publicProfileUrl]
  );

  await ensureDefaultPrivacy(result.rows[0].id);
  return result.rows[0].id;
}

async function ensureDefaultPrivacy(profileId) {
  await query(
    `
      INSERT INTO profile_settings (profile_id)
      VALUES ($1)
      ON CONFLICT (profile_id) DO NOTHING
    `,
    [profileId]
  );
}

function configuredVerificationAdminIds() {
  return new Set(
    String(process.env.VERIFICATION_ADMIN_IDS || process.env.CLERK_ADMIN_IDS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => toPositiveInt(value))
  );
}

function configuredVerificationAdminEmails() {
  return new Set(
    [...DEFAULT_ADMIN_EMAILS, String(process.env.VERIFICATION_ADMIN_EMAILS || process.env.CLERK_ADMIN_EMAILS || "")]
      .join(",")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

function looksLikeInternalUserEmail(email) {
  return typeof email === "string" && /@communium\.local$/iu.test(email);
}

function buildVerificationDocumentSignature(documentId, mode, expiresAt) {
  return crypto
    .createHmac("sha256", process.env.VERIFICATION_LINK_SECRET || process.env.CLERK_SECRET_KEY || "communium")
    .update(`${documentId}:${mode}:${expiresAt}`)
    .digest("hex");
}

function buildVerificationDocumentUrl(documentId, mode = "view") {
  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60;
  const signature = buildVerificationDocumentSignature(documentId, mode, expiresAt);
  return `/api/verification/document/${encodeURIComponent(documentId)}?mode=${mode}&expires=${expiresAt}&sig=${signature}`;
}

function hasValidVerificationDocumentSignature(documentId, mode, expiresAt, signature) {
  const expiresNumber = Number.parseInt(String(expiresAt || ""), 10);

  if (!expiresNumber || expiresNumber < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = buildVerificationDocumentSignature(documentId, mode, expiresNumber);
  const actual = String(signature || "");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
  } catch {
    return false;
  }
}

function isVerificationAdmin(user) {
  if (!user) {
    return false;
  }

  if (configuredVerificationAdminIds().has(Number(user.id))) {
    return true;
  }

  return configuredVerificationAdminEmails().has(String(user.email || "").toLowerCase());
}

async function ensureVerificationAdmin(req) {
  const user = await ensureUser(req);

  if (!isVerificationAdmin(user)) {
    throw httpError(403, "Acces admin verification refuse");
  }

  if (String(process.env.ADMIN_2FA_REQUIRED || "").toLowerCase() === "true") {
    try {
      const result = await query(
        "SELECT totp_enabled FROM user_security_settings WHERE user_id = $1 LIMIT 1",
        [user.id]
      );

      if (!result.rows[0]?.totp_enabled) {
        throw httpError(403, "La double authentification admin doit etre activee.");
      }
    } catch (error) {
      if (error?.status) {
        throw error;
      }

      throw httpError(503, "Le module de securite admin n est pas encore disponible.");
    }
  }

  return user;
}

function mapVerificationNotification(row) {
  return {
    id: row.id,
    status: normalizeVerificationStatus(row.status),
    title: row.title,
    message: row.message,
    createdAt: toIso(row.created_at),
    readAt: toIso(row.read_at),
  };
}

function mapVerificationAuditLog(row) {
  return {
    id: row.id,
    action: row.action,
    actorUserId: row.actor_user_id,
    actorUsername: row.actor_username || null,
    createdAt: toIso(row.created_at),
    details: parseJsonObject(row.details, {}),
  };
}

function mapVerificationDocument(row) {
  return {
    id: row.id,
    documentType: row.document_type,
    label: verificationDocumentLabels[row.document_type] || row.document_type,
    fileUrl: row.file_url,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size || 0,
    createdAt: toIso(row.created_at),
    previewUrl: buildVerificationDocumentUrl(row.id, "view"),
    downloadUrl: buildVerificationDocumentUrl(row.id, "download"),
  };
}

function requiredVerificationKinds(accountType) {
  const normalizedType = normalizeAccountType(accountType);
  return normalizedType === "BUSINESS"
    ? verificationRequiredDocuments.BUSINESS.slice()
    : ["CIN_OR_PASSPORT"];
}

function requiredVerificationLabels(accountType) {
  const normalizedType = normalizeAccountType(accountType);
  if (normalizedType === "BUSINESS") {
    return verificationRequiredDocuments.BUSINESS.map((type) => verificationDocumentLabels[type] || type);
  }

  return ["CIN ou passeport"];
}

function buildVerificationProgress(accountType, documents) {
  const normalizedType = normalizeAccountType(accountType);
  const docTypes = new Set((documents || []).map((document) => document.documentType));

  if (normalizedType === "BUSINESS") {
    const required = verificationRequiredDocuments.BUSINESS;
    const missingTypes = required.filter((type) => !docTypes.has(type));

    return {
      uploaded: required.length - missingTypes.length,
      required: required.length,
      percent: Math.round(((required.length - missingTypes.length) / required.length) * 100),
      missingDocumentTypes: missingTypes,
      missingDocumentLabels: missingTypes.map((type) => verificationDocumentLabels[type] || type),
      isComplete: missingTypes.length === 0,
    };
  }

  const hasPersonalDocument = docTypes.has("CIN") || docTypes.has("PASSPORT");
  return {
    uploaded: hasPersonalDocument ? 1 : 0,
    required: 1,
    percent: hasPersonalDocument ? 100 : 0,
    missingDocumentTypes: hasPersonalDocument ? [] : ["CIN_OR_PASSPORT"],
    missingDocumentLabels: hasPersonalDocument ? [] : ["CIN ou passeport"],
    isComplete: hasPersonalDocument,
  };
}

function buildVerificationStatusPayload(verificationRow, documents, notifications, auditLogs, accountTypeOverride) {
  const accountType = normalizeAccountType(accountTypeOverride || verificationRow?.type);
  const status = normalizeVerificationStatus(verificationRow?.status);
  const progress = buildVerificationProgress(accountType, documents);

  return {
    id: verificationRow?.id || null,
    type: accountType,
    status,
    badgeLabel: verificationBadgeLabel(accountType, status),
    submittedAt: toIso(verificationRow?.submitted_at),
    reviewedAt: toIso(verificationRow?.reviewed_at),
    reviewedBy: verificationRow?.reviewed_by || null,
    rejectionReason: verificationRow?.rejection_reason || null,
    progress,
    requiredDocuments: requiredVerificationLabels(accountType),
    documents,
    notifications,
    auditLogs,
  };
}

async function createVerificationNotification(userId, verificationId, status, title, message) {
  const result = await query(
    `
      INSERT INTO verification_notifications (user_id, verification_id, status, title, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [userId, verificationId, normalizeVerificationStatus(status), title, message]
  );

  return result.rows[0] ? mapVerificationNotification(result.rows[0]) : null;
}

async function appendVerificationAuditLog(verificationId, actorUserId, action, details = {}) {
  await query(
    `
      INSERT INTO verification_audit_logs (verification_id, actor_user_id, action, details)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [verificationId, actorUserId || null, action, JSON.stringify(details || {})]
  );
}

async function sendVerificationEmail(user, subject, html) {
  if (!user?.email || looksLikeInternalUserEmail(user.email)) {
    return false;
  }

  if (!process.env.RESEND_API_KEY || !process.env.VERIFICATION_FROM_EMAIL) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.VERIFICATION_FROM_EMAIL,
      to: [user.email],
      subject,
      html,
    }),
  });

  return response.ok;
}

function verificationEmailTemplate({
  title,
  message,
  status,
  helper,
}) {
  const tone =
    status === "VERIFIED"
      ? "linear-gradient(135deg, #0f766e, #14b8a6)"
      : status === "REJECTED"
        ? "linear-gradient(135deg, #b91c1c, #ef4444)"
        : "linear-gradient(135deg, #1d4ed8, #3b82f6)";

  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid rgba(148,163,184,.16);border-radius:24px;overflow:hidden;box-shadow:0 16px 48px rgba(15,23,42,.08)">
        <div style="padding:18px 24px;background:${tone};color:#ffffff;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700">
          Communium verification
        </div>
        <div style="padding:28px 24px">
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1">${title}</h1>
          <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#334155">${message}</p>
          ${helper ? `<p style="margin:0;font-size:14px;line-height:1.6;color:#64748b">${helper}</p>` : ""}
        </div>
      </div>
    </div>
  `;
}

async function notifyVerificationEvent(userId, verificationId, status, payload) {
  const notification = await createVerificationNotification(
    userId,
    verificationId,
    status,
    payload.title,
    payload.message
  );

  const userResult = await query("SELECT id, email, username FROM users WHERE id = $1", [userId]);
  const user = userResult.rows[0];

  try {
    await sendVerificationEmail(
      user,
      payload.subject || payload.title,
      verificationEmailTemplate({
        title: payload.title,
        message: payload.message,
        status,
        helper: payload.helper,
      })
    );
  } catch (error) {
    console.warn("Verification email non envoye:", error.message);
  }

  return notification;
}

async function getVerificationRowByUserId(userId) {
  const result = await query("SELECT * FROM verifications WHERE user_id = $1", [userId]);
  return result.rows[0] || null;
}

async function ensureVerificationRecord(user, explicitType) {
  const accountType = normalizeAccountType(explicitType || user.accountType);
  const result = await query(
    `
      INSERT INTO verifications (user_id, type, status)
      VALUES ($1, $2, 'NON_VERIFIED')
      ON CONFLICT (user_id)
      DO UPDATE SET type = EXCLUDED.type, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
    [user.id, accountType]
  );

  return result.rows[0];
}

async function getVerificationBundleByUserId(userId) {
  const verificationRow = await getVerificationRowByUserId(userId);
  const accountType =
    verificationRow?.type ||
    (await query("SELECT account_type FROM users WHERE id = $1", [userId])).rows[0]?.account_type ||
    "PERSONAL";

  if (!verificationRow) {
    return buildVerificationStatusPayload(null, [], [], [], accountType);
  }

  const [documentsResult, notificationsResult, auditLogsResult] = await Promise.all([
    query(
      "SELECT * FROM verification_documents WHERE verification_id = $1 ORDER BY created_at DESC, document_type ASC",
      [verificationRow.id]
    ),
    query(
      "SELECT * FROM verification_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
      [userId]
    ),
    query(
      `
        SELECT l.*, u.username AS actor_username
        FROM verification_audit_logs l
        LEFT JOIN users u ON u.id = l.actor_user_id
        WHERE verification_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `,
      [verificationRow.id]
    ),
  ]);

  return buildVerificationStatusPayload(
    verificationRow,
    documentsResult.rows.map(mapVerificationDocument),
    notificationsResult.rows.map(mapVerificationNotification),
    auditLogsResult.rows.map(mapVerificationAuditLog),
    accountType
  );
}

async function buildAdminVerificationItem(row) {
  const bundle = await getVerificationBundleByUserId(row.user_id);

  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    email: row.email,
    accountType: normalizeAccountType(row.type || row.account_type),
    status: normalizeVerificationStatus(row.status),
    badgeLabel: verificationBadgeLabel(row.type || row.account_type, row.status),
    fullName: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.username,
    role: row.current_job_title || row.current_company || null,
    company: row.current_company || null,
    location: [row.city, row.country].filter(Boolean).join(", "),
    submittedAt: toIso(row.submitted_at),
    reviewedAt: toIso(row.reviewed_at),
    rejectionReason: row.rejection_reason || null,
    documentCount: row.document_count || 0,
    documents: bundle.documents,
    notifications: bundle.notifications.slice(0, 3),
    auditLogs: bundle.auditLogs.slice(0, 5),
    progress: bundle.progress,
  };
}

async function recordVerificationDocumentAccess(documentId, viewerUserId, viewerType, accessReason) {
  await query(
    `
      INSERT INTO verification_document_access_logs (document_id, viewer_user_id, viewer_type, access_reason)
      VALUES ($1, $2, $3, $4)
    `,
    [documentId, viewerUserId || null, viewerType, accessReason]
  );
}

async function replaceVerificationDocument(verificationId, documentType, file) {
  const existing = await query(
    "SELECT id, file_url FROM verification_documents WHERE verification_id = $1 AND document_type = $2",
    [verificationId, documentType]
  );

  const fileUrl = await saveUpload(file, "verification-documents");

  if (existing.rowCount > 0 && existing.rows[0].file_url) {
    await deleteUpload(existing.rows[0].file_url);
  }

  const result = await query(
    `
      INSERT INTO verification_documents (verification_id, document_type, file_url, file_name, mime_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (verification_id, document_type)
      DO UPDATE SET
        file_url = EXCLUDED.file_url,
        file_name = EXCLUDED.file_name,
        mime_type = EXCLUDED.mime_type,
        file_size = EXCLUDED.file_size,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
    [verificationId, documentType, fileUrl, sanitizeFilename(file.originalname), file.mimetype, file.size]
  );

  return result.rows[0];
}

function isPublicVisibility(value) {
  return value === "Public";
}

function visibilityFromLegacyBoolean(value, hiddenValue = "Private") {
  const normalized = normalizeBoolean(value);

  if (normalized === undefined) {
    return undefined;
  }

  return normalized ? "Public" : hiddenValue;
}

function normalizePrivacyPatch(body = {}) {
  const patch = {};

  for (const field of Object.keys(privacyVisibilityFields)) {
    if (body[field] === undefined) {
      continue;
    }

    const visibility = normalizeFieldVisibility(body[field]);

    if (!visibility) {
      throw httpError(400, `Visibilite invalide pour ${field}`);
    }

    patch[field] = visibility;
  }

  const legacyMappings = [
    ["showEmail", "emailVisibility", "Private"],
    ["showPhone", "phoneVisibility", "Private"],
    ["showDateOfBirth", "dateOfBirthVisibility", "Private"],
    ["showAddress", "addressVisibility", "Private"],
    ["showProfessionalExp", "professionalExperienceVisibility", "Private"],
    ["showInterests", "interestsVisibility", "Private"],
    ["showCV", "cvVisibility", "ContactsOnly"],
  ];

  for (const [legacyField, visibilityField, hiddenValue] of legacyMappings) {
    if (body[legacyField] === undefined) {
      continue;
    }

    const legacyValue = normalizeBoolean(body[legacyField]);
    patch[legacyField] = legacyValue;
    patch[visibilityField] = visibilityFromLegacyBoolean(body[legacyField], hiddenValue);
  }

  const visibilityToLegacyField = {
    emailVisibility: "showEmail",
    phoneVisibility: "showPhone",
    dateOfBirthVisibility: "showDateOfBirth",
    addressVisibility: "showAddress",
    professionalExperienceVisibility: "showProfessionalExp",
    interestsVisibility: "showInterests",
    cvVisibility: "showCV",
  };

  for (const [visibilityField, legacyField] of Object.entries(visibilityToLegacyField)) {
    if (patch[visibilityField] !== undefined) {
      patch[legacyField] = isPublicVisibility(patch[visibilityField]);
    }
  }

  if (body.profileVisibility !== undefined) {
    const profileVisibility = normalizeProfileVisibility(body.profileVisibility);

    if (!profileVisibility) {
      throw httpError(400, "Visibilite du profil invalide");
    }

    patch.profileVisibility = profileVisibility;
  }

  if (body.allowSearchEngines !== undefined) {
    patch.allowSearchEngines = normalizeBoolean(body.allowSearchEngines);
  }

  if (body.allowNetworkingRequests !== undefined) {
    patch.allowNetworkingRequests = normalizeBoolean(body.allowNetworkingRequests);
  }

  return patch;
}

function mapPrivacy(row) {
  if (!row) {
    row = {};
  }

  const settings = {
    id: row.id,
    profileId: row.profile_id,
    emailVisibility: normalizeFieldVisibility(row.email_visibility) || defaultPrivacySettings.emailVisibility,
    phoneVisibility: normalizeFieldVisibility(row.phone_visibility) || defaultPrivacySettings.phoneVisibility,
    dateOfBirthVisibility:
      normalizeFieldVisibility(row.date_of_birth_visibility) || defaultPrivacySettings.dateOfBirthVisibility,
    identityDocumentVisibility:
      normalizeFieldVisibility(row.identity_document_visibility) || defaultPrivacySettings.identityDocumentVisibility,
    addressVisibility: normalizeFieldVisibility(row.address_visibility) || defaultPrivacySettings.addressVisibility,
    cityVisibility: normalizeFieldVisibility(row.city_visibility) || defaultPrivacySettings.cityVisibility,
    countryVisibility: normalizeFieldVisibility(row.country_visibility) || defaultPrivacySettings.countryVisibility,
    cvVisibility: normalizeFieldVisibility(row.cv_visibility) || defaultPrivacySettings.cvVisibility,
    professionalExperienceVisibility:
      normalizeFieldVisibility(row.professional_experience_visibility) ||
      defaultPrivacySettings.professionalExperienceVisibility,
    interestsVisibility: normalizeFieldVisibility(row.interests_visibility) || defaultPrivacySettings.interestsVisibility,
    professionVisibility:
      normalizeFieldVisibility(row.profession_visibility) || defaultPrivacySettings.professionVisibility,
    photoVisibility: normalizeFieldVisibility(row.photo_visibility) || defaultPrivacySettings.photoVisibility,
    bannerVisibility: normalizeFieldVisibility(row.banner_visibility) || defaultPrivacySettings.bannerVisibility,
    bioVisibility: normalizeFieldVisibility(row.bio_visibility) || defaultPrivacySettings.bioVisibility,
    profileVisibility: normalizeProfileVisibility(row.profile_visibility) || defaultPrivacySettings.profileVisibility,
    allowSearchEngines:
      row.allow_search_engines === undefined || row.allow_search_engines === null
        ? defaultPrivacySettings.allowSearchEngines
        : row.allow_search_engines,
    allowNetworkingRequests:
      row.allow_networking_requests === undefined || row.allow_networking_requests === null
        ? defaultPrivacySettings.allowNetworkingRequests
        : row.allow_networking_requests,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };

  return {
    ...settings,
    showEmail: isPublicVisibility(settings.emailVisibility),
    showPhone: isPublicVisibility(settings.phoneVisibility),
    showDateOfBirth: isPublicVisibility(settings.dateOfBirthVisibility),
    showAddress: isPublicVisibility(settings.addressVisibility),
    showProfessionalExp: isPublicVisibility(settings.professionalExperienceVisibility),
    showInterests: isPublicVisibility(settings.interestsVisibility),
    showCV: isPublicVisibility(settings.cvVisibility),
  };
}

function mapExperience(row) {
  return {
    id: row.id,
    profileId: row.profile_id,
    jobTitle: row.job_title,
    company: row.company,
    industry: row.industry,
    experienceType: row.experience_type,
    startDate: toDateOnly(row.start_date),
    endDate: toDateOnly(row.end_date),
    isCurrent: row.is_current,
    description: row.description,
    location: row.location,
    skillsUsed: Array.isArray(row.skills_used) ? row.skills_used : parseJsonObject(row.skills_used, []),
    sortOrder: row.sort_order || 0,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapInterest(row) {
  return {
    id: row.interest_id || row.id,
    profileInterestId: row.profile_interest_id || undefined,
    name: row.name,
    category: row.category,
    createdAt: toIso(row.created_at),
  };
}

function mapProfile(row, settings, experiences, interests, verification) {
  return {
    id: row.id,
    userId: row.user_id,
    accountType: normalizeAccountType(row.account_type),
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.username,
    bio: row.bio,
    dateOfBirth: toDateOnly(row.date_of_birth),
    phone: decryptPrivateField(row.phone),
    email: row.email,
    country: row.country,
    city: row.city,
    address: decryptPrivateField(row.address),
    identityVerified: row.identity_verified,
    identityDocumentType: row.identity_document_type,
    identityDocumentNumber: decryptPrivateField(row.identity_document_number),
    identityDocumentUrl: row.identity_document_url,
    profilePictureUrl: row.profile_picture_url,
    profilePictureCrop: row.profile_picture_crop,
    bannerUrl: row.banner_url,
    currentJobTitle: row.current_job_title,
    currentCompany: row.current_company,
    currentIndustry: row.current_industry,
    profession: row.profession,
    currentPosition: row.current_position,
    establishment: row.establishment,
    experienceLevel: row.experience_level,
    memberStatus: row.member_status,
    availability: row.availability,
    hometown: row.hometown,
    websiteUrl: row.website_url,
    portfolioUrl: row.portfolio_url,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    behanceUrl: row.behance_url,
    xUrl: row.x_url,
    instagramUrl: row.instagram_url,
    languages: Array.isArray(row.languages) ? row.languages : parseJsonObject(row.languages, []),
    education: Array.isArray(row.education) ? row.education : parseJsonObject(row.education, []),
    primarySkills: Array.isArray(row.primary_skills) ? row.primary_skills : parseJsonObject(row.primary_skills, []),
    membershipTier: row.membership_tier || "Free",
    profileViewsCount: row.profile_views_count || 0,
    connectionsCount: row.connections_count || 0,
    cvDownloadCount: row.cv_download_count || 0,
    verificationStatus: verification?.status || "NON_VERIFIED",
    verificationBadgeLabel: verification?.badgeLabel || null,
    cvUrl: row.cv_url,
    publicProfileUrl: row.public_profile_url,
    publicProfilePath: row.public_profile_url ? `/api/profile/public/${row.public_profile_url}` : null,
    user: {
      id: Number(row.user_id),
      username: row.username,
      email: row.user_email,
      role: row.role,
    },
    verification,
    privacySettings: settings,
    professionalExperiences: experiences,
    interests,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function getFullProfileByUserId(userId) {
  const profileResult = await query(
    `
      SELECT p.*, u.username, u.email AS user_email, u.role, u.account_type
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
    `,
    [userId]
  );

  if (profileResult.rowCount === 0) {
    return null;
  }

  return getFullProfileFromRow(profileResult.rows[0]);
}

async function getFullProfileByPublicUrl(publicProfileUrl) {
  const profileResult = await query(
    `
      SELECT p.*, u.username, u.email AS user_email, u.role, u.account_type
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE p.public_profile_url = $1
    `,
    [publicProfileUrl]
  );

  if (profileResult.rowCount === 0) {
    return null;
  }

  return getFullProfileFromRow(profileResult.rows[0]);
}

async function getFullProfileByUsername(username) {
  const profileResult = await query(
    `
      SELECT p.*, u.username, u.email AS user_email, u.role, u.account_type
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE u.username = $1
    `,
    [sanitizeUsername(username)]
  );

  if (profileResult.rowCount === 0) {
    return null;
  }

  return getFullProfileFromRow(profileResult.rows[0]);
}

async function getFullProfileFromRow(row) {
  await ensureDefaultPrivacy(row.id);

  const [settingsResult, experiencesResult, interestsResult, verification] = await Promise.all([
    query("SELECT * FROM profile_settings WHERE profile_id = $1", [row.id]),
    query(
      "SELECT * FROM professional_experiences WHERE profile_id = $1 ORDER BY sort_order ASC, start_date DESC, id DESC",
      [row.id]
    ),
    query(
      `
        SELECT i.id AS interest_id, pi.id AS profile_interest_id, i.name, i.category, pi.created_at
        FROM profile_interests pi
        JOIN interests i ON i.id = pi.interest_id
        WHERE pi.profile_id = $1
        ORDER BY i.name ASC
      `,
      [row.id]
    ),
    getVerificationBundleByUserId(row.user_id),
  ]);

  return mapProfile(
    row,
    mapPrivacy(settingsResult.rows[0]),
    experiencesResult.rows.map(mapExperience),
    interestsResult.rows.map(mapInterest),
    verification
  );
}

function filterPublicProfile(profile) {
  const settings = profile.privacySettings || mapPrivacy(null);

  if (settings.profileVisibility !== "Public") {
    return null;
  }

  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: profile.fullName,
    bio: isPublicVisibility(settings.bioVisibility) ? profile.bio : undefined,
    country: isPublicVisibility(settings.countryVisibility) ? profile.country : undefined,
    city: isPublicVisibility(settings.cityVisibility) ? profile.city : undefined,
    profilePictureUrl: isPublicVisibility(settings.photoVisibility) ? profile.profilePictureUrl : undefined,
    profilePictureCrop: isPublicVisibility(settings.photoVisibility) ? profile.profilePictureCrop : undefined,
    bannerUrl: isPublicVisibility(settings.bannerVisibility) ? profile.bannerUrl : undefined,
    currentJobTitle: isPublicVisibility(settings.professionVisibility) ? profile.currentJobTitle : undefined,
    currentCompany: isPublicVisibility(settings.professionVisibility) ? profile.currentCompany : undefined,
    currentIndustry: isPublicVisibility(settings.professionVisibility) ? profile.currentIndustry : undefined,
    profession: isPublicVisibility(settings.professionVisibility) ? profile.profession : undefined,
    currentPosition: isPublicVisibility(settings.professionVisibility) ? profile.currentPosition : undefined,
    establishment: isPublicVisibility(settings.professionVisibility) ? profile.establishment : undefined,
    experienceLevel: isPublicVisibility(settings.professionVisibility) ? profile.experienceLevel : undefined,
    memberStatus: isPublicVisibility(settings.professionVisibility) ? profile.memberStatus : undefined,
    availability: isPublicVisibility(settings.professionVisibility) ? profile.availability : undefined,
    hometown: isPublicVisibility(settings.cityVisibility) ? profile.hometown : undefined,
    websiteUrl: profile.websiteUrl,
    portfolioUrl: profile.portfolioUrl,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    behanceUrl: profile.behanceUrl,
    xUrl: profile.xUrl,
    instagramUrl: profile.instagramUrl,
    languages: profile.languages || [],
    education: isPublicVisibility(settings.professionalExperienceVisibility) ? profile.education || [] : [],
    primarySkills: isPublicVisibility(settings.professionVisibility) ? profile.primarySkills : [],
    membershipTier: profile.membershipTier || "Free",
    verificationStatus: profile.verificationStatus,
    verificationBadgeLabel: profile.verification?.badgeLabel || null,
    publicProfileUrl: profile.publicProfileUrl,
    user: {
      username: profile.user.username,
      role: profile.user.role,
    },
    email: settings.allowNetworkingRequests && isPublicVisibility(settings.emailVisibility) ? profile.email : undefined,
    phone: settings.allowNetworkingRequests && isPublicVisibility(settings.phoneVisibility) ? profile.phone : undefined,
    dateOfBirth: isPublicVisibility(settings.dateOfBirthVisibility) ? profile.dateOfBirth : undefined,
    address: isPublicVisibility(settings.addressVisibility) ? profile.address : undefined,
    professionalExperiences: isPublicVisibility(settings.professionalExperienceVisibility)
      ? profile.professionalExperiences
      : [],
    interests: isPublicVisibility(settings.interestsVisibility) ? profile.interests : [],
    cvDownloadUrl:
      isPublicVisibility(settings.cvVisibility) && profile.cvUrl
        ? `/api/profile/public/${profile.publicProfileUrl}/cv`
        : undefined,
    allowNetworkingRequests: settings.allowNetworkingRequests,
    allowSearchEngines: settings.allowSearchEngines,
    updatedAt: profile.updatedAt,
  };
}

function profileSummary(profile) {
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: profile.fullName,
    bio: profile.bio,
    country: profile.country,
    city: profile.city,
    profilePictureUrl: profile.profilePictureUrl,
    bannerUrl: profile.bannerUrl,
    currentJobTitle: profile.currentJobTitle,
    currentCompany: profile.currentCompany,
    currentIndustry: profile.currentIndustry,
    profession: profile.profession,
    currentPosition: profile.currentPosition,
    availability: profile.availability,
    websiteUrl: profile.websiteUrl,
    portfolioUrl: profile.portfolioUrl,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    membershipTier: profile.membershipTier,
    verificationStatus: profile.verificationStatus,
    verificationBadgeLabel: profile.verification?.badgeLabel || null,
    publicProfileUrl: profile.publicProfileUrl,
    publicProfilePath: profile.publicProfileUrl ? `/api/profile/public/${profile.publicProfileUrl}` : null,
    user: profile.user,
    interests: profile.interests,
  };
}

async function bumpProfileView(profileId) {
  await query(
    "UPDATE profiles SET profile_views_count = COALESCE(profile_views_count, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [profileId]
  );
}

async function bumpCvDownload(profileId) {
  await query(
    "UPDATE profiles SET cv_download_count = COALESCE(cv_download_count, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [profileId]
  );
}

async function sendStoredFile(res, fileUrl, fallbackFilename) {
  const filePath = resolveUploadUrl(fileUrl);
  if (!filePath) {
    return res.status(404).json({ success: false, error: "Fichier introuvable" });
  }

  try {
    await fs.access(filePath);
    return res.download(filePath, fallbackFilename || path.basename(filePath));
  } catch {
    return res.status(404).json({ success: false, error: "Fichier introuvable" });
  }
}

function buildUpdateSet(data, fieldMap, transform = {}) {
  const columns = [];
  const values = [];

  for (const [field, column] of Object.entries(fieldMap)) {
    if (data[field] !== undefined) {
      const transformer = transform[field] || ((value) => value);
      const value = transformer(data[field]);
      if (value !== undefined) {
        columns.push(column);
        values.push(value);
      }
    }
  }

  return { columns, values };
}

async function upsertProfile(req, res) {
  const user = await ensureUser(req);
  const payload = sanitizeProfilePayload(req.body);

  if (!payload.firstName || !payload.lastName) {
    return res.status(400).json({ success: false, error: "Le prenom et le nom sont obligatoires" });
  }

  if (!payload.username) {
    return res.status(400).json({ success: false, error: "Le username est obligatoire" });
  }

  if (!payload.country || !payload.city) {
    return res.status(400).json({ success: false, error: "Le pays et la ville sont obligatoires" });
  }

  if (!payload.currentJobTitle) {
    return res.status(400).json({ success: false, error: "Le titre professionnel est obligatoire" });
  }

  const existingResult = await query("SELECT id, public_profile_url FROM profiles WHERE user_id = $1", [user.id]);
  const existing = existingResult.rows[0];
  const nextUsername = payload.username;
  const usernameOwner = await query("SELECT id FROM users WHERE username = $1 AND id <> $2", [nextUsername, user.id]);

  if (usernameOwner.rowCount > 0) {
    return res.status(409).json({ success: false, error: "Ce username est deja utilise" });
  }

  await query(
    `
      UPDATE users
      SET username = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
    [nextUsername, user.id]
  );

  const profileSeed = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    publicProfileUrl: payload.publicProfileUrl || nextUsername,
  };
  const profileId = existing?.id || (await ensureProfileForUser(user, profileSeed));
  const publicUrlBase =
    payload.publicProfileUrl ||
    nextUsername ||
    existing?.public_profile_url ||
    [payload.firstName, payload.lastName].filter(Boolean).join(" ") ||
    user.username;
  const publicProfileUrl = await makeUniquePublicUrl(publicUrlBase, user.id, profileId);

  const { columns, values } = buildUpdateSet(payload, profileFields, {
    phone: (value) => encryptPrivateField(value),
    address: (value) => encryptPrivateField(value),
    primarySkills: (value) => JSON.stringify(value || []),
    languages: (value) => JSON.stringify(Array.isArray(value) ? value : []),
    education: (value) => JSON.stringify(Array.isArray(value) ? value : []),
  });

  columns.push("public_profile_url");
  values.push(publicProfileUrl);

  const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
  await query(
    `UPDATE profiles SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1}`,
    [...values, profileId]
  );

  const profile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: profile });
}

async function uploadProfilePicture(req, res) {
  const user = await ensureUser(req);
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Photo de profil manquante" });
  }

  enforceUploadRateLimit(req, user, "profilePicture");
  validateUploadedFile("profilePicture", req.file);
  validateImageIntegrity("profilePicture", req.file, { minWidth: 160, minHeight: 160 });
  const profileId = await ensureProfileForUser(user);
  const profile = await getFullProfileByUserId(user.id);
  const fileUrl = await saveUpload(req.file, "profile-pictures");
  const rawCrop = parseJsonObject(req.body.crop, null);
  const crop = sanitizeCropPayload(
    rawCrop || {
      x: Number(req.body.cropX || 0),
      y: Number(req.body.cropY || 0),
      width: Number(req.body.cropWidth || req.body.size || 512),
      height: Number(req.body.cropHeight || req.body.size || 512),
      outputWidth: Number(req.body.outputWidth || 512),
      outputHeight: Number(req.body.outputHeight || 512),
    }
  );

  if (profile?.profilePictureUrl) {
    await deleteUpload(profile.profilePictureUrl);
  }

  await query(
    `
      UPDATE profiles
      SET profile_picture_url = $1, profile_picture_crop = $2::jsonb, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
    [fileUrl, JSON.stringify(crop), profileId]
  );

  const updatedProfile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: updatedProfile });
}

async function updateProfilePictureCrop(req, res) {
  const user = await ensureUser(req);
  const profileId = await ensureProfileForUser(user);
  const crop = sanitizeCropPayload(parseJsonObject(req.body.crop, req.body));

  await query(
    "UPDATE profiles SET profile_picture_crop = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [JSON.stringify(crop), profileId]
  );

  const profile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: profile });
}

async function uploadCV(req, res) {
  const user = await ensureUser(req);
  if (!req.file) {
    return res.status(400).json({ success: false, error: "CV PDF manquant" });
  }

  enforceUploadRateLimit(req, user, "cv");
  validateUploadedFile("cv", req.file);
  validateDocumentIntegrity(req.file, { label: "CV" });
  const profileId = await ensureProfileForUser(user);
  const profile = await getFullProfileByUserId(user.id);
  const fileUrl = await saveUpload(req.file, "cvs");

  if (profile?.cvUrl) {
    await deleteUpload(profile.cvUrl);
  }

  await query("UPDATE profiles SET cv_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
    fileUrl,
    profileId,
  ]);

  const updatedProfile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: updatedProfile });
}

async function uploadBanner(req, res) {
  const user = await ensureUser(req);
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Photo de couverture manquante" });
  }

  enforceUploadRateLimit(req, user, "bannerImage");
  validateUploadedFile("bannerImage", req.file);
  validateImageIntegrity("bannerImage", req.file, { minWidth: 960, minHeight: 240 });
  const profileId = await ensureProfileForUser(user);
  const profile = await getFullProfileByUserId(user.id);
  const fileUrl = await saveUpload(req.file, "banners");

  if (profile?.bannerUrl) {
    await deleteUpload(profile.bannerUrl);
  }

  await query("UPDATE profiles SET banner_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
    fileUrl,
    profileId,
  ]);

  const updatedProfile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: updatedProfile });
}

async function uploadIdentityDocument(req, res) {
  const user = await ensureUser(req);
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Document d'identite manquant" });
  }

  enforceUploadRateLimit(req, user, "identityDocument");
  validateUploadedFile("identityDocument", req.file);
  validateDocumentIntegrity(req.file, { label: "Document d'identite" });
  const documentType = normalizeDocumentType(req.body.documentType);
  const documentNumber = cleanString(req.body.documentNumber);

  if (!documentType) {
    return res.status(400).json({ success: false, error: "Type de document invalide" });
  }

  if (!documentNumber || documentNumber.length < 4 || documentNumber.length > 60) {
    return res.status(400).json({ success: false, error: "Numero de document invalide" });
  }

  const profileId = await ensureProfileForUser(user);
  const profile = await getFullProfileByUserId(user.id);
  const fileUrl = await saveUpload(req.file, "identity-documents");

  if (profile?.identityDocumentUrl) {
    await deleteUpload(profile.identityDocumentUrl);
  }

  await query(
    `
      UPDATE profiles
      SET identity_document_type = $1,
          identity_document_number = $2,
          identity_document_url = $3,
          identity_verified = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `,
    [documentType, encryptPrivateField(documentNumber), fileUrl, profileId]
  );

  const updatedProfile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: updatedProfile });
}

async function deleteVerificationDocumentsByTypes(verificationId, documentTypes, keepType = null) {
  const result = await query(
    "SELECT id, file_url FROM verification_documents WHERE verification_id = $1 AND document_type = ANY($2::verification_document_type[])",
    [verificationId, documentTypes]
  );

  for (const row of result.rows) {
    if (keepType && row.document_type === keepType) {
      continue;
    }

    await deleteUpload(row.file_url);
    await query("DELETE FROM verification_documents WHERE id = $1", [row.id]);
  }
}

async function syncLegacyPersonalIdentityState(userId, documentType, documentNumber, fileUrl) {
  const profileId = await ensureProfileForUser({ id: userId, email: null, username: null });

  await query(
    `
      UPDATE profiles
      SET identity_document_type = $1,
          identity_document_number = $2,
          identity_document_url = $3,
          identity_verified = FALSE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `,
    [documentType, documentNumber || null, fileUrl, profileId]
  );
}

async function updateVerificationStatusRow(verificationId, status, fields = {}) {
  const nextStatus = normalizeVerificationStatus(status);
  const result = await query(
    `
      UPDATE verifications
      SET status = $2,
          rejection_reason = $3,
          submitted_at = COALESCE($4, submitted_at, CURRENT_TIMESTAMP),
          reviewed_at = $5,
          reviewed_by = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    [
      verificationId,
      nextStatus,
      fields.rejectionReason || null,
      fields.submittedAt || null,
      fields.reviewedAt || null,
      fields.reviewedBy || null,
    ]
  );

  return result.rows[0];
}

async function uploadVerificationDocuments(req, res) {
  const user = await ensureUser(req);
  const requestedType = normalizeAccountType(req.body.type || user.accountType);
  const verification = await ensureVerificationRecord(user, requestedType);
  const uploadedFiles = req.files || {};

  if (requestedType === "PERSONAL") {
    const personalFile = uploadedFiles.identityDocument?.[0] || uploadedFiles.passportDocument?.[0];
    const documentType = normalizeVerificationDocumentType(req.body.documentType)
      || (uploadedFiles.passportDocument?.[0] ? "PASSPORT" : "CIN");
    const documentNumber = cleanString(req.body.documentNumber);

    if (!personalFile) {
      return res.status(400).json({ success: false, error: "Ajoute une CIN ou un passeport pour lancer la verification." });
    }

    if (!["CIN", "PASSPORT"].includes(documentType)) {
      return res.status(400).json({ success: false, error: "Le document personnel doit etre une CIN ou un passeport." });
    }

    enforceUploadRateLimit(req, user, personalFile.fieldname);
    validateUploadedFile(personalFile.fieldname, personalFile);
    validateDocumentIntegrity(personalFile, { label: verificationDocumentLabels[documentType] });

    await deleteVerificationDocumentsByTypes(verification.id, ["CIN", "PASSPORT"], documentType);
    const storedDocument = await replaceVerificationDocument(verification.id, documentType, personalFile);
    await syncLegacyPersonalIdentityState(user.id, documentType, documentNumber, storedDocument.file_url);

    const updatedRow = await updateVerificationStatusRow(verification.id, "PENDING", {
      rejectionReason: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    });

    await appendVerificationAuditLog(updatedRow.id, user.id, "personal_document_uploaded", {
      documentType,
      fileName: storedDocument.file_name,
    });

    await notifyVerificationEvent(user.id, updatedRow.id, "PENDING", {
      title: "Verification recue",
      message: "Votre document personnel a bien ete envoye. L equipe Communium le relit avant validation.",
      helper: "Vous recevrez une mise a jour des que la verification sera approuvee ou rejetee.",
      subject: "Communium • Verification recue",
    });

    const payload = await getVerificationBundleByUserId(user.id);
    return res.json({ success: true, data: payload });
  }

  const businessFieldMap = [
    { field: "rcDocument", type: "RC" },
    { field: "iceDocument", type: "ICE" },
    { field: "ifDocument", type: "IF" },
    { field: "statutesDocument", type: "COMPANY_STATUTES" },
  ];

  const receivedFields = businessFieldMap.filter(({ field }) => Boolean(uploadedFiles[field]?.[0]));

  if (!receivedFields.length) {
    return res.status(400).json({ success: false, error: "Ajoute au moins un document business pour lancer le dossier KYB." });
  }

  for (const item of receivedFields) {
    const file = uploadedFiles[item.field][0];
    enforceUploadRateLimit(req, user, item.field);
    validateUploadedFile(item.field, file);
    validateDocumentIntegrity(file, { label: verificationDocumentLabels[item.type] });
    const stored = await replaceVerificationDocument(verification.id, item.type, file);
    await appendVerificationAuditLog(verification.id, user.id, "business_document_uploaded", {
      documentType: item.type,
      fileName: stored.file_name,
    });
  }

  const currentDocumentsResult = await query(
    "SELECT document_type FROM verification_documents WHERE verification_id = $1",
    [verification.id]
  );
  const currentTypes = new Set(currentDocumentsResult.rows.map((row) => row.document_type));
  const missingTypes = verificationRequiredDocuments.BUSINESS.filter((type) => !currentTypes.has(type));

  const updatedRow = await updateVerificationStatusRow(verification.id, "PENDING", {
    rejectionReason: null,
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
  });

  await notifyVerificationEvent(user.id, updatedRow.id, "PENDING", {
    title: missingTypes.length ? "Documents business partiellement recus" : "Verification business recue",
    message: missingTypes.length
      ? `Votre dossier KYB est en cours. Documents encore attendus: ${missingTypes
          .map((type) => verificationDocumentLabels[type] || type)
          .join(", ")}.`
      : "Tous les documents business requis ont ete recus. Le dossier est maintenant en attente de revue.",
    helper: missingTypes.length
      ? "Ajoutez les pieces manquantes pour accelerer la validation."
      : "Vous recevrez une notification des qu un administrateur valide ou rejette le dossier.",
    subject: "Communium • Dossier business recu",
  });

  const payload = await getVerificationBundleByUserId(user.id);
  return res.json({ success: true, data: payload });
}

async function getVerificationStatus(req, res) {
  const user = await ensureUser(req);
  const payload = await getVerificationBundleByUserId(user.id);
  return res.json({ success: true, data: payload });
}

async function getVerificationNotifications(req, res) {
  const user = await ensureUser(req);
  const result = await query(
    "SELECT * FROM verification_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
    [user.id]
  );

  return res.json({ success: true, count: result.rowCount, data: result.rows.map(mapVerificationNotification) });
}

async function markVerificationNotificationRead(req, res) {
  const user = await ensureUser(req);
  const notificationId = cleanString(req.params.notificationId || req.body.notificationId);

  if (!notificationId) {
    return res.status(400).json({ success: false, error: "Notification cible manquante" });
  }

  const result = await query(
    `
      UPDATE verification_notifications
      SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE id::text = $1 AND user_id = $2
      RETURNING *
    `,
    [notificationId, user.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, error: "Notification introuvable" });
  }

  return res.json({ success: true, data: mapVerificationNotification(result.rows[0]) });
}

async function deleteVerificationDocument(req, res) {
  const user = await ensureUser(req);
  const documentId = cleanString(req.params.documentId);

  if (!documentId) {
    return res.status(400).json({ success: false, error: "Document cible manquant" });
  }

  const documentResult = await query(
    `
      SELECT vd.*, v.user_id, v.id AS verification_id, v.type AS verification_type
      FROM verification_documents vd
      JOIN verifications v ON v.id = vd.verification_id
      WHERE vd.id::text = $1
    `,
    [documentId]
  );

  if (documentResult.rowCount === 0) {
    return res.status(404).json({ success: false, error: "Document introuvable" });
  }

  const document = documentResult.rows[0];
  if (Number(document.user_id) !== Number(user.id)) {
    return res.status(403).json({ success: false, error: "Suppression non autorisee" });
  }

  await deleteUpload(document.file_url);
  await query("DELETE FROM verification_documents WHERE id = $1", [document.id]);

  const remainingDocumentsResult = await query(
    "SELECT * FROM verification_documents WHERE verification_id = $1 ORDER BY created_at DESC, document_type ASC",
    [document.verification_id]
  );
  const remainingDocuments = remainingDocumentsResult.rows.map(mapVerificationDocument);
  const progress = buildVerificationProgress(document.verification_type, remainingDocuments);
  const nextStatus = progress.uploaded > 0 ? "PENDING" : "NON_VERIFIED";
  const nextSubmittedAt = progress.uploaded > 0 ? new Date().toISOString() : null;

  const verificationResult = await query(
    `
      UPDATE verifications
      SET status = $2,
          rejection_reason = NULL,
          submitted_at = $3,
          reviewed_at = NULL,
          reviewed_by = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    [document.verification_id, nextStatus, nextSubmittedAt]
  );

  if (["CIN", "PASSPORT"].includes(document.document_type)) {
    await query(
      `
        UPDATE profiles
        SET identity_document_type = NULL,
            identity_document_number = NULL,
            identity_document_url = NULL,
            identity_verified = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `,
      [user.id]
    );
  } else {
    await query(
      `
        UPDATE profiles
        SET identity_verified = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `,
      [user.id]
    );
  }

  await appendVerificationAuditLog(document.verification_id, user.id, "document_deleted", {
    documentType: document.document_type,
    fileName: document.file_name,
  });

  return res.json({ success: true, data: await getVerificationBundleByUserId(user.id), verification: verificationResult.rows[0] || null });
}

async function serveVerificationDocument(req, res) {
  const documentId = cleanString(req.params.documentId);
  const mode = cleanString(req.query.mode) === "download" ? "download" : "view";
  const expires = req.query.expires;
  const sig = req.query.sig;

  const documentResult = await query(
    `
      SELECT vd.*, v.user_id, v.id AS verification_id
      FROM verification_documents vd
      JOIN verifications v ON v.id = vd.verification_id
      WHERE vd.id::text = $1
    `,
    [documentId]
  );

  if (documentResult.rowCount === 0) {
    return res.status(404).json({ success: false, error: "Document introuvable" });
  }

  const document = documentResult.rows[0];
  const canUseSignature = hasValidVerificationDocumentSignature(document.id, mode, expires, sig);
  let actorUserId = null;
  let viewerType = "temporary";

  if (!canUseSignature) {
    const user = await ensureUser(req);
    const ownsDocument = Number(user.id) === Number(document.user_id);
    const isAdmin = isVerificationAdmin(user);

    if (!ownsDocument && !isAdmin) {
      return res.status(403).json({ success: false, error: "Acces document refuse" });
    }

    actorUserId = user.id;
    viewerType = isAdmin ? "admin" : "member";
  }

  const filePath = resolveUploadUrl(document.file_url);
  if (!filePath) {
    return res.status(404).json({ success: false, error: "Fichier non disponible" });
  }

  await recordVerificationDocumentAccess(document.id, actorUserId, viewerType, mode);
  res.setHeader("Content-Type", document.mime_type || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `${mode === "download" ? "attachment" : "inline"}; filename="${document.file_name || "document"}"`
  );
  return res.sendFile(filePath);
}

async function listAdminVerifications(req, res) {
  await ensureVerificationAdmin(req);
  const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
  const pageSize = Math.min(30, Math.max(1, Number.parseInt(String(req.query.pageSize || "10"), 10) || 10));
  const offset = (page - 1) * pageSize;
  const search = cleanString(req.query.search);
  const statusFilter = normalizeVerificationStatus(cleanString(req.query.status));
  const hasStatusFilter = cleanString(req.query.status) && verificationStatuses.includes(statusFilter);
  const typeFilter = normalizeAccountType(cleanString(req.query.type));
  const hasTypeFilter = cleanString(req.query.type) && verificationAccountTypes.includes(typeFilter);

  const params = [];
  const where = [];

  if (hasStatusFilter) {
    params.push(statusFilter);
    where.push(`v.status = $${params.length}`);
  }

  if (hasTypeFilter) {
    params.push(typeFilter);
    where.push(`v.type = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(`(
      u.username ILIKE $${params.length}
      OR u.email ILIKE $${params.length}
      OR p.first_name ILIKE $${params.length}
      OR p.last_name ILIKE $${params.length}
      OR p.current_company ILIKE $${params.length}
    )`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  params.push(pageSize, offset);

  const baseQuery = `
    SELECT
      v.*,
      u.username,
      u.email,
      u.account_type,
      p.first_name,
      p.last_name,
      p.current_job_title,
      p.current_company,
      p.city,
      p.country,
      COUNT(vd.id)::integer AS document_count
    FROM verifications v
    JOIN users u ON u.id = v.user_id
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN verification_documents vd ON vd.verification_id = v.id
    ${whereSql}
    GROUP BY v.id, u.id, p.id
    ORDER BY COALESCE(v.submitted_at, v.created_at) DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `;

  const result = await query(baseQuery, params);
  const countParams = params.slice(0, params.length - 2);
  const countResult = await query(
    `
      SELECT COUNT(*)::integer AS total
      FROM verifications v
      JOIN users u ON u.id = v.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      ${whereSql}
    `,
    countParams
  );

  const statsResult = await query(
    `
      SELECT status, COUNT(*)::integer AS total
      FROM verifications
      GROUP BY status
    `
  );

  const items = [];
  for (const row of result.rows) {
    items.push(await buildAdminVerificationItem(row));
  }

  return res.json({
    success: true,
    page,
    pageSize,
    total: countResult.rows[0]?.total || 0,
    stats: verificationStatuses.reduce((accumulator, status) => {
      accumulator[status] = statsResult.rows.find((row) => row.status === status)?.total || 0;
      return accumulator;
    }, {}),
    data: items,
  });
}

async function getAdminVerificationDetail(req, res) {
  await ensureVerificationAdmin(req);
  const verificationId = cleanString(req.params.verificationId);

  if (!verificationId) {
    return res.status(400).json({ success: false, error: "Verification cible manquante" });
  }

  const result = await query(
    `
      SELECT
        v.*,
        u.username,
        u.email,
        u.account_type,
        p.first_name,
        p.last_name,
        p.current_job_title,
        p.current_company,
        p.city,
        p.country,
        COUNT(vd.id)::integer AS document_count
      FROM verifications v
      JOIN users u ON u.id = v.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN verification_documents vd ON vd.verification_id = v.id
      WHERE v.id::text = $1
      GROUP BY v.id, u.id, p.id
    `,
    [verificationId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, error: "Verification introuvable" });
  }

  return res.json({ success: true, data: await buildAdminVerificationItem(result.rows[0]) });
}

async function approveVerification(req, res) {
  const admin = await ensureVerificationAdmin(req);
  const verificationId = cleanString(req.body.verificationId);

  if (!verificationId) {
    return res.status(400).json({ success: false, error: "Verification cible manquante" });
  }

  const verificationResult = await query("SELECT * FROM verifications WHERE id::text = $1", [verificationId]);
  if (verificationResult.rowCount === 0) {
    return res.status(404).json({ success: false, error: "Verification introuvable" });
  }

  const verification = verificationResult.rows[0];
  const updatedRow = await updateVerificationStatusRow(verification.id, "VERIFIED", {
    rejectionReason: null,
    reviewedAt: new Date().toISOString(),
    reviewedBy: admin.id,
  });

  await query(
    "UPDATE profiles SET identity_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
    [verification.user_id]
  );

  await appendVerificationAuditLog(updatedRow.id, admin.id, "approved", {
    by: admin.username,
  });

  await notifyVerificationEvent(verification.user_id, updatedRow.id, "VERIFIED", {
    title: normalizeAccountType(updatedRow.type) === "BUSINESS" ? "Entreprise verifiee" : "Profil verifie",
    message:
      normalizeAccountType(updatedRow.type) === "BUSINESS"
        ? "Votre dossier business a ete approuve. Le badge Entreprise verifiee est maintenant actif."
        : "Votre verification d identite a ete approuvee. Le badge Profil verifie est maintenant actif.",
    helper: "Le reseau voit maintenant un signal de confiance supplementaire sur votre presence Communium.",
    subject: "Communium • Verification approuvee",
  });

  return res.json({ success: true, data: await getVerificationBundleByUserId(verification.user_id) });
}

async function rejectVerification(req, res) {
  const admin = await ensureVerificationAdmin(req);
  const verificationId = cleanString(req.body.verificationId);
  const rejectionReason = cleanString(req.body.rejectionReason);

  if (!verificationId || !rejectionReason) {
    return res.status(400).json({ success: false, error: "Verification et motif de rejet sont obligatoires" });
  }

  const verificationResult = await query("SELECT * FROM verifications WHERE id::text = $1", [verificationId]);
  if (verificationResult.rowCount === 0) {
    return res.status(404).json({ success: false, error: "Verification introuvable" });
  }

  const verification = verificationResult.rows[0];
  const updatedRow = await updateVerificationStatusRow(verification.id, "REJECTED", {
    rejectionReason,
    reviewedAt: new Date().toISOString(),
    reviewedBy: admin.id,
  });

  await query(
    "UPDATE profiles SET identity_verified = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
    [verification.user_id]
  );

  await appendVerificationAuditLog(updatedRow.id, admin.id, "rejected", {
    by: admin.username,
    rejectionReason,
  });

  await notifyVerificationEvent(verification.user_id, updatedRow.id, "REJECTED", {
    title: "Verification a completer",
    message: `Le dossier de verification a ete relu mais doit etre corrige avant validation: ${rejectionReason}.`,
    helper: "Remplacez les documents demandes puis renvoyez le dossier depuis votre espace Communium.",
    subject: "Communium • Verification a corriger",
  });

  return res.json({ success: true, data: await getVerificationBundleByUserId(verification.user_id) });
}

async function createOrUpdateExperience(req, res, mode) {
  const user = await ensureUser(req);
  const profileId = await ensureProfileForUser(user);
  const payload = sanitizeExperiencePayload(req.body);
  const { columns, values } = buildUpdateSet(payload, experienceFields, {
    skillsUsed: (value) => JSON.stringify(value || []),
  });
  const hasRequiredFields = payload.jobTitle && payload.company && payload.startDate;
  if (mode === "create" && !hasRequiredFields) {
    return res.status(400).json({
      success: false,
      error: "Le poste, l'entreprise et la date de debut sont obligatoires",
    });
  }

  if (payload.isCurrent) {
    await query("UPDATE professional_experiences SET is_current = FALSE WHERE profile_id = $1", [profileId]);
  }

  if (mode === "create") {
    if (payload.sortOrder === undefined) {
      const sortResult = await query(
        "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM professional_experiences WHERE profile_id = $1",
        [profileId]
      );
      columns.push("sort_order");
      values.push((sortResult.rows[0]?.max_order || 0) + 1);
    }

    const insertColumns = ["profile_id", ...columns];
    const insertValues = [profileId, ...values];
    const placeholders = insertValues.map((_, index) => `$${index + 1}`).join(", ");
    await query(
      `INSERT INTO professional_experiences (${insertColumns.join(", ")}) VALUES (${placeholders})`,
      insertValues
    );
  } else {
    const experienceId = toPositiveInt(req.params.experienceId, 0);
    const owner = await query(
      "SELECT id FROM professional_experiences WHERE id = $1 AND profile_id = $2",
      [experienceId, profileId]
    );

    if (owner.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Experience professionnelle introuvable" });
    }

    if (columns.length > 0) {
      const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
      await query(
        `UPDATE professional_experiences SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = $${
          values.length + 1
        }`,
        [...values, experienceId]
      );
    }
  }

  const profile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: profile });
}

async function reorderExperiences(req, res) {
  const user = await ensureUser(req);
  const profileId = await ensureProfileForUser(user);
  const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds.map((value) => toPositiveInt(value, 0)).filter(Boolean) : [];

  if (!orderedIds.length) {
    return res.status(400).json({ success: false, error: "Liste d'experiences invalide" });
  }

  const owned = await query("SELECT id FROM professional_experiences WHERE profile_id = $1", [profileId]);
  const ownedIds = new Set(owned.rows.map((row) => row.id));

  if (orderedIds.some((id) => !ownedIds.has(id)) || orderedIds.length !== ownedIds.size) {
    return res.status(400).json({ success: false, error: "Impossible de reordonner ces experiences" });
  }

  await Promise.all(
    orderedIds.map((experienceId, index) =>
      query(
        "UPDATE professional_experiences SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND profile_id = $3",
        [index, experienceId, profileId]
      )
    )
  );

  const profile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: profile });
}

async function deleteExperience(req, res) {
  const user = await ensureUser(req);
  const profileId = await ensureProfileForUser(user);
  const experienceId = toPositiveInt(req.params.experienceId, 0);

  const result = await query(
    "DELETE FROM professional_experiences WHERE id = $1 AND profile_id = $2",
    [experienceId, profileId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, error: "Experience professionnelle introuvable" });
  }

  const profile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: profile });
}

async function getAvailableInterests(req, res) {
  const search = cleanString(req.query.search);
  const category = cleanString(req.query.category);
  const limit = Math.min(toPositiveInt(req.query.limit, 50), 100);
  const params = [];
  const where = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`name ILIKE $${params.length}`);
  }

  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }

  params.push(limit);
  const result = await query(
    `
      SELECT id, name, category, created_at
      FROM interests
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY name ASC
      LIMIT $${params.length}
    `,
    params
  );

  return res.json({ success: true, data: result.rows.map(mapInterest) });
}

async function addInterests(req, res) {
  const user = await ensureUser(req);
  const profileId = await ensureProfileForUser(user);
  const names = Array.isArray(req.body.names)
    ? req.body.names
    : req.body.name
      ? [req.body.name]
      : [];
  const interestIds = [];

  if (req.body.interestId) {
    interestIds.push(toPositiveInt(req.body.interestId, 0));
  }

  for (const nameValue of names) {
    const name = sanitizeInterestName(nameValue);
    if (!name) {
      continue;
    }

    const interest = await query(
      `
        INSERT INTO interests (name, category)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE SET
          category = COALESCE(EXCLUDED.category, interests.category),
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `,
      [name, cleanString(req.body.category)]
    );
    interestIds.push(interest.rows[0].id);
  }

  if (interestIds.length === 0) {
    return res.status(400).json({ success: false, error: "Aucun centre d'interet fourni" });
  }

  const uniqueInterestIds = [...new Set(interestIds.filter(Boolean))];
  const existingInterestsResult = await query("SELECT interest_id FROM profile_interests WHERE profile_id = $1", [
    profileId,
  ]);
  const existingInterestIds = new Set(existingInterestsResult.rows.map((row) => Number(row.interest_id)));
  const newInterestIds = uniqueInterestIds.filter((interestId) => !existingInterestIds.has(interestId));

  if (existingInterestIds.size + newInterestIds.length > 24) {
    return res.status(400).json({
      success: false,
      error: "Le profil ne peut pas contenir plus de 24 centres d'interet",
    });
  }

  for (const interestId of uniqueInterestIds) {
    await query(
      `
        INSERT INTO profile_interests (profile_id, interest_id)
        VALUES ($1, $2)
        ON CONFLICT (profile_id, interest_id) DO NOTHING
      `,
      [profileId, interestId]
    );
  }

  const profile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: profile });
}

async function removeInterest(req, res) {
  const user = await ensureUser(req);
  const profileId = await ensureProfileForUser(user);
  const interestId = toPositiveInt(req.params.interestId, 0);

  await query("DELETE FROM profile_interests WHERE profile_id = $1 AND interest_id = $2", [
    profileId,
    interestId,
  ]);

  const profile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: profile });
}

async function updatePrivacySettings(req, res) {
  const user = await ensureUser(req);
  const profileId = await ensureProfileForUser(user);
  await ensureDefaultPrivacy(profileId);
  const normalizedPatch = normalizePrivacyPatch(req.body);
  const { columns, values } = buildUpdateSet(normalizedPatch, privacyFields);

  if (columns.length > 0) {
    const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
    await query(
      `UPDATE profile_settings SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE profile_id = $${
        values.length + 1
      }`,
      [...values, profileId]
    );
  }

  const profile = await getFullProfileByUserId(user.id);
  return res.json({ success: true, data: profile });
}

function normalizePostVisibility(value) {
  const normalized = cleanString(value).toLowerCase();

  if (["private", "network", "premium"].includes(normalized)) {
    return normalized;
  }

  return "public";
}

function normalizePostType(value) {
  const normalized = cleanString(value).toLowerCase();

  if (["text", "image", "video", "project", "article", "cv", "event", "recruitment", "business"].includes(normalized)) {
    return normalized;
  }

  return "text";
}

function mapProfilePost(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    profileId: Number(row.profile_id),
    type: row.post_type,
    body: row.body || "",
    visibility: row.visibility || "public",
    showOnProfile: Boolean(row.show_on_profile),
    pinned: Boolean(row.pinned),
    attachments: parseJsonObject(row.attachments, []),
    stats: parseJsonObject(row.stats, { likes: 0, comments: 0, shares: 0, saves: 0 }),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function resolveProfileForPosts(req, user) {
  const username = safeUsername(req.query.username || req.params.username);
  const profileUrl = cleanString(req.query.profileUrl);

  if (username) {
    return getFullProfileByUsername(username);
  }

  if (profileUrl) {
    return getFullProfileByPublicUrl(slugify(profileUrl));
  }

  if (user) {
    await ensureProfileForUser(user);
    return getFullProfileByUserId(user.id);
  }

  return null;
}

async function listProfilePosts(req, res) {
  await ensureProfileSchema();
  let user = null;

  try {
    user = await ensureUser(req);
  } catch {
    user = null;
  }

  const profile = await resolveProfileForPosts(req, user);

  if (!profile) {
    return res.json({ success: true, data: [] });
  }

  const owner = user && Number(user.id) === Number(profile.userId || profile.user?.id);
  const params = [profile.id];
  const where = ["profile_id = $1"];

  if (!owner) {
    where.push("show_on_profile = TRUE");
    where.push("visibility = 'public'");
  }

  const result = await query(
    `
      SELECT *
      FROM profile_posts
      WHERE ${where.join(" AND ")}
      ORDER BY pinned DESC, created_at DESC
      LIMIT 80
    `,
    params
  );

  return res.json({ success: true, data: result.rows.map(mapProfilePost) });
}

async function createProfilePost(req, res) {
  const user = await ensureUser(req);
  await ensureProfileSchema();
  const profileId = await ensureProfileForUser(user);
  const body = cleanString(req.body.body);

  if (!body || body.length > 4000) {
    return res.status(400).json({ success: false, error: "Publication invalide" });
  }

  const result = await query(
    `
      INSERT INTO profile_posts
        (user_id, profile_id, post_type, body, visibility, show_on_profile, pinned, attachments, stats)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
      RETURNING *
    `,
    [
      user.id,
      profileId,
      normalizePostType(req.body.type || req.body.postType),
      body,
      normalizePostVisibility(req.body.visibility),
      req.body.showOnProfile !== false,
      Boolean(req.body.pinned),
      JSON.stringify(Array.isArray(req.body.attachments) ? req.body.attachments : []),
      JSON.stringify({ likes: 0, comments: 0, shares: 0, saves: 0 }),
    ]
  );

  return res.status(201).json({ success: true, data: mapProfilePost(result.rows[0]) });
}

async function updateProfilePost(req, res) {
  const user = await ensureUser(req);
  await ensureProfileSchema();
  const postId = toPositiveInt(req.params.postId || req.params.id, 0);
  const existing = await query("SELECT * FROM profile_posts WHERE id = $1 AND user_id = $2", [postId, user.id]);

  if (!existing.rowCount) {
    return res.status(404).json({ success: false, error: "Publication introuvable" });
  }

  const body = req.body.body !== undefined ? cleanString(req.body.body) : existing.rows[0].body;

  if (!body || body.length > 4000) {
    return res.status(400).json({ success: false, error: "Publication invalide" });
  }

  const result = await query(
    `
      UPDATE profile_posts
      SET post_type = $2,
          body = $3,
          visibility = $4,
          show_on_profile = $5,
          pinned = $6,
          attachments = $7::jsonb,
          stats = $8::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $9
      RETURNING *
    `,
    [
      postId,
      normalizePostType(req.body.type || req.body.postType || existing.rows[0].post_type),
      body,
      normalizePostVisibility(req.body.visibility || existing.rows[0].visibility),
      req.body.showOnProfile === undefined ? existing.rows[0].show_on_profile : Boolean(req.body.showOnProfile),
      req.body.pinned === undefined ? existing.rows[0].pinned : Boolean(req.body.pinned),
      JSON.stringify(Array.isArray(req.body.attachments) ? req.body.attachments : parseJsonObject(existing.rows[0].attachments, [])),
      JSON.stringify(req.body.stats && typeof req.body.stats === "object" ? req.body.stats : parseJsonObject(existing.rows[0].stats, {})),
      user.id,
    ]
  );

  return res.json({ success: true, data: mapProfilePost(result.rows[0]) });
}

async function deleteProfilePost(req, res) {
  const user = await ensureUser(req);
  await ensureProfileSchema();
  const postId = toPositiveInt(req.params.postId || req.params.id, 0);
  await query("DELETE FROM profile_posts WHERE id = $1 AND user_id = $2", [postId, user.id]);

  return res.json({ success: true });
}

async function getProfileMedia(req, res) {
  await ensureProfileSchema();
  let user = null;

  try {
    user = await ensureUser(req);
  } catch {
    user = null;
  }

  const profile = await resolveProfileForPosts(req, user);

  if (!profile) {
    return res.json({ success: true, data: { photos: [], videos: [], projects: [], cover: null, avatar: null } });
  }

  const postsResult = await query(
    `
      SELECT *
      FROM profile_posts
      WHERE profile_id = $1
        AND show_on_profile = TRUE
        AND visibility = 'public'
      ORDER BY pinned DESC, created_at DESC
      LIMIT 80
    `,
    [profile.id]
  );
  const media = {
    photos: [],
    videos: [],
    projects: [],
    cover: profile.bannerUrl || null,
    avatar: profile.profilePictureUrl || null,
  };

  for (const post of postsResult.rows.map(mapProfilePost)) {
    for (const attachment of post.attachments || []) {
      const type = String(attachment.type || attachment.mimeType || "").toLowerCase();
      if (type.includes("video")) {
        media.videos.push({ ...attachment, postId: post.id });
      } else if (post.type === "project") {
        media.projects.push({ ...attachment, postId: post.id });
      } else {
        media.photos.push({ ...attachment, postId: post.id });
      }
    }
  }

  return res.json({ success: true, data: media });
}

async function getProfileDocuments(req, res) {
  await ensureProfileSchema();
  let user = null;

  try {
    user = await ensureUser(req);
  } catch {
    user = null;
  }

  const profile = await resolveProfileForPosts(req, user);

  if (!profile) {
    return res.json({ success: true, data: [] });
  }

  const owner = user && Number(user.id) === Number(profile.userId || profile.user?.id);
  const settings = profile.privacySettings || mapPrivacy(null);
  const documents = [];

  if (profile.cvUrl && (owner || isPublicVisibility(settings.cvVisibility))) {
    documents.push({
      id: "cv",
      type: "cv",
      title: "CV",
      fileUrl: owner ? profile.cvUrl : `/api/profile/public/${profile.publicProfileUrl}/cv`,
      visibility: settings.cvVisibility || "ContactsOnly",
    });
  }

  return res.json({ success: true, data: documents });
}

async function getPublicProfile(req, res) {
  const rawIdentifier = cleanString(req.params.profileUrl);
  const publicSlug = slugify(rawIdentifier);
  let profile = await getFullProfileByPublicUrl(publicSlug);

  if (!profile) {
    const safeCandidate = safeUsername(rawIdentifier);
    if (safeCandidate) {
      profile = await getFullProfileByUsername(safeCandidate);
    }
  }

  if (!profile) {
    return res.status(404).json({ success: false, error: "Profil public introuvable" });
  }

  const publicProfile = filterPublicProfile(profile);
  if (!publicProfile) {
    return res.status(403).json({ success: false, error: "Ce profil n'est pas public" });
  }

  await bumpProfileView(profile.id);
  return res.json({ success: true, data: publicProfile });
}

async function getPublicProfileByUsername(req, res) {
  const profile = await getFullProfileByUsername(req.params.username);
  if (!profile) {
    return res.status(404).json({ success: false, error: "Profil public introuvable" });
  }

  const publicProfile = filterPublicProfile(profile);
  if (!publicProfile) {
    return res.status(403).json({ success: false, error: "Ce profil n'est pas public" });
  }

  await bumpProfileView(profile.id);
  return res.json({ success: true, data: publicProfile });
}

async function getProfileByUsername(req, res) {
  const profile = await getFullProfileByUsername(req.params.username);
  if (!profile) {
    return res.status(404).json({ success: false, error: "Profil introuvable" });
  }

  const publicProfile = filterPublicProfile(profile);
  if (!publicProfile) {
    return res.status(404).json({ success: false, error: "Profil introuvable" });
  }

  await bumpProfileView(profile.id);
  return res.json({ success: true, data: publicProfile });
}

async function downloadPublicCV(req, res) {
  const profile = await getFullProfileByPublicUrl(slugify(req.params.profileUrl));
  if (!profile) {
    return res.status(404).json({ success: false, error: "Profil public introuvable" });
  }

  const settings = profile.privacySettings || mapPrivacy(null);
  if (settings.profileVisibility !== "Public" || !isPublicVisibility(settings.cvVisibility) || !profile.cvUrl) {
    return res.status(403).json({ success: false, error: "CV non disponible publiquement" });
  }

  await bumpCvDownload(profile.id);
  return sendStoredFile(res, profile.cvUrl, `cv-${profile.publicProfileUrl}.pdf`);
}

async function downloadMyCV(req, res) {
  const user = await ensureUser(req);
  const profile = await getFullProfileByUserId(user.id);

  if (!profile?.cvUrl) {
    return res.status(404).json({ success: false, error: "CV introuvable" });
  }

  return sendStoredFile(res, profile.cvUrl, `cv-${profile.publicProfileUrl || user.id}.pdf`);
}

async function exportMyProfile(req, res) {
  const user = await ensureUser(req);
  await ensureProfileForUser(user);
  const profile = await getFullProfileByUserId(user.id);

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="communium-profile-${profile.publicProfileUrl || user.id}.json"`
  );

  return res.json({
    success: true,
    exportedAt: new Date().toISOString(),
    data: profile,
  });
}

async function deleteProfileAsset(req, res, assetType) {
  const user = await ensureUser(req);
  const profile = await getFullProfileByUserId(user.id);

  if (!profile) {
    return res.status(404).json({ success: false, error: "Profil introuvable" });
  }

  const assetConfig = {
    photo: {
      fileUrl: profile.profilePictureUrl,
      sql: "UPDATE profiles SET profile_picture_url = NULL, profile_picture_crop = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      message: "Photo supprimee",
    },
    banner: {
      fileUrl: profile.bannerUrl,
      sql: "UPDATE profiles SET banner_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      message: "Banniere supprimee",
    },
    cv: {
      fileUrl: profile.cvUrl,
      sql: "UPDATE profiles SET cv_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      message: "CV supprime",
    },
    identity: {
      fileUrl: profile.identityDocumentUrl,
      sql: "UPDATE profiles SET identity_document_type = NULL, identity_document_number = NULL, identity_document_url = NULL, identity_verified = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      message: "Document d'identite supprime",
    },
  }[assetType];

  if (!assetConfig) {
    return res.status(400).json({ success: false, error: "Type de fichier invalide" });
  }

  if (assetConfig.fileUrl) {
    await deleteUpload(assetConfig.fileUrl);
  }

  await query(assetConfig.sql, [profile.id]);
  const updatedProfile = await getFullProfileByUserId(user.id);

  return res.json({
    success: true,
    message: assetConfig.message,
    data: updatedProfile,
  });
}

async function deleteMyProfile(req, res) {
  const user = await ensureUser(req);
  const profile = await getFullProfileByUserId(user.id);

  if (!profile) {
    return res.status(404).json({ success: false, error: "Profil introuvable" });
  }

  await Promise.all([
    deleteUpload(profile.profilePictureUrl),
    deleteUpload(profile.bannerUrl),
    deleteUpload(profile.cvUrl),
    deleteUpload(profile.identityDocumentUrl),
  ]);

  await query("DELETE FROM profiles WHERE id = $1 AND user_id = $2", [profile.id, user.id]);

  return res.json({
    success: true,
    message: "Profil reinitialise. Recharge la page pour recreer un profil vide.",
  });
}

async function checkProfileUrlAvailability(req, res) {
  const candidate = slugify(req.params.url);
  if (isReservedProfileIdentifier(candidate)) {
    return res.json({
      success: true,
      data: {
        url: candidate,
        available: false,
      },
    });
  }
  let requesterId = 0;

  try {
    const requester = await getRequestUserData(req);
    requesterId = requester.id;
  } catch {
    requesterId = 0;
  }

  const result = await query(
    `
      SELECT p.id
      FROM profiles p
      WHERE p.public_profile_url = $1
        AND ($2::integer = 0 OR p.user_id <> $2)
    `,
    [candidate, requesterId]
  );

  return res.json({
    success: true,
    data: {
      url: candidate,
      available: result.rowCount === 0,
    },
  });
}

async function checkUsernameAvailability(req, res) {
  const candidate = sanitizeUsername(req.params.username ?? req.query.username);

  if (!candidate) {
    return res.status(400).json({ success: false, error: "Username invalide" });
  }

  let requesterId = 0;

  try {
    const requester = await getRequestUserData(req);
    requesterId = requester.id;
  } catch {
    requesterId = 0;
  }

  const result = await query(
    `
      SELECT id
      FROM users
      WHERE username = $1
        AND ($2::integer = 0 OR id <> $2)
    `,
    [candidate, requesterId]
  );

  return res.json({
    success: true,
    data: {
      username: candidate,
      available: result.rowCount === 0,
    },
  });
}

async function searchPublicProfiles(req, res) {
  const search = cleanString(req.query.q || req.query.search) || "";
  const country = cleanString(req.query.country);
  const city = cleanString(req.query.city);
  const interest = cleanString(req.query.interest);
  const limit = Math.min(toPositiveInt(req.query.limit, 20), 50);
  const params = [];
  const where = ["COALESCE(ps.profile_visibility::text, 'Public') = 'Public'"];

  if (search) {
    params.push(`%${search}%`);
    where.push(`
      (
        p.first_name ILIKE $${params.length}
        OR p.last_name ILIKE $${params.length}
        OR u.username ILIKE $${params.length}
        OR p.bio ILIKE $${params.length}
        OR p.current_job_title ILIKE $${params.length}
        OR p.profession ILIKE $${params.length}
        OR p.current_position ILIKE $${params.length}
        OR p.current_company ILIKE $${params.length}
        OR p.current_industry ILIKE $${params.length}
        OR p.country ILIKE $${params.length}
        OR p.city ILIKE $${params.length}
        OR i.name ILIKE $${params.length}
      )
    `);
  }

  if (country) {
    params.push(`%${country}%`);
    where.push(`p.country ILIKE $${params.length}`);
  }

  if (city) {
    params.push(`%${city}%`);
    where.push(`p.city ILIKE $${params.length}`);
  }

  if (interest) {
    params.push(`%${interest}%`);
    where.push(`i.name ILIKE $${params.length}`);
  }

  params.push(limit);
  const result = await query(
    `
      SELECT DISTINCT p.*, u.username, u.email AS user_email, u.role, u.account_type
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN profile_settings ps ON ps.profile_id = p.id
      LEFT JOIN profile_interests pi ON pi.profile_id = p.id
      LEFT JOIN interests i ON i.id = pi.interest_id
      WHERE ${where.join(" AND ")}
      ORDER BY p.updated_at DESC
      LIMIT $${params.length}
    `,
    params
  );

  const profiles = [];
  for (const row of result.rows) {
    const fullProfile = await getFullProfileFromRow(row);
    const publicProfile = filterPublicProfile(fullProfile);
    if (publicProfile) {
      profiles.push(profileSummary(publicProfile));
    }
  }

  return res.json({ success: true, count: profiles.length, data: profiles });
}

function singleUpload(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        const policy = filePolicies[fieldName];
        return res.status(400).json({
          success: false,
          error: `${policy?.label || "Fichier"}: taille maximale ${Math.round(
            (policy?.maxSize || 0) / (1024 * 1024)
          )} Mo`,
        });
      }

      return res.status(error.status || 400).json({
        success: false,
        error: error.message || "Erreur d'upload",
      });
    });
  };
}

function multiUpload(fieldConfigs) {
  return (req, res, next) => {
    upload.fields(fieldConfigs)(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: "Un des documents depasse la taille maximale autorisee.",
        });
      }

      return res.status(error.status || 400).json({
        success: false,
        error: error.message || "Erreur d'upload verification",
      });
    });
  };
}

function createProfileRouter() {
  const router = express.Router();

  router.get("/public/by-username/:username", asyncHandler(getPublicProfileByUsername));
  router.get("/public", asyncHandler(searchPublicProfiles));
  router.get("/public/:profileUrl/cv", asyncHandler(downloadPublicCV));
  router.get("/public/:profileUrl", asyncHandler(getPublicProfile));
  router.get("/check-url/:url", asyncHandler(checkProfileUrlAvailability));
  router.get("/check-username", asyncHandler(checkUsernameAvailability));
  router.get("/check-username/:username", asyncHandler(checkUsernameAvailability));
  router.get("/search", asyncHandler(searchPublicProfiles));
  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      const user = await ensureUser(req);
      await ensureProfileForUser(user);
      const profile = await getFullProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ success: false, error: "Profil non trouve" });
      }

      return res.json({ success: true, data: profile });
    })
  );
  router.post("/", asyncHandler(upsertProfile));
  router.put("/", asyncHandler(upsertProfile));
  router.patch("/", asyncHandler(upsertProfile));
  router.put("/me", asyncHandler(upsertProfile));
  router.patch("/me", asyncHandler(upsertProfile));
  router.get("/posts", asyncHandler(listProfilePosts));
  router.post("/posts", asyncHandler(createProfilePost));
  router.patch("/posts/:postId", asyncHandler(updateProfilePost));
  router.delete("/posts/:postId", asyncHandler(deleteProfilePost));
  router.get("/media", asyncHandler(getProfileMedia));
  router.get("/documents", asyncHandler(getProfileDocuments));

  router.get(
    "/my-profile",
    asyncHandler(async (req, res) => {
      const user = await ensureUser(req);
      await ensureProfileForUser(user);
      const profile = await getFullProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ success: false, error: "Profil non trouve" });
      }

      return res.json({ success: true, data: profile });
    })
  );

  router.put("/my-profile", asyncHandler(upsertProfile));
  router.get("/my-profile/export", asyncHandler(exportMyProfile));
  router.delete("/my-profile", asyncHandler(deleteMyProfile));
  router.post("/avatar", singleUpload("profilePicture"), asyncHandler(uploadProfilePicture));
  router.delete("/avatar", asyncHandler((req, res) => deleteProfileAsset(req, res, "photo")));
  router.put("/avatar/crop", asyncHandler(updateProfilePictureCrop));
  router.post("/profile-picture", singleUpload("profilePicture"), asyncHandler(uploadProfilePicture));
  router.delete("/profile-picture", asyncHandler((req, res) => deleteProfileAsset(req, res, "photo")));
  router.put("/profile-picture/crop", asyncHandler(updateProfilePictureCrop));
  router.post("/cover", singleUpload("bannerImage"), asyncHandler(uploadBanner));
  router.delete("/cover", asyncHandler((req, res) => deleteProfileAsset(req, res, "banner")));
  router.post("/banner", singleUpload("bannerImage"), asyncHandler(uploadBanner));
  router.delete("/banner", asyncHandler((req, res) => deleteProfileAsset(req, res, "banner")));
  router.post("/cv", singleUpload("cv"), asyncHandler(uploadCV));
  router.get("/cv/download", asyncHandler(downloadMyCV));
  router.delete("/cv", asyncHandler((req, res) => deleteProfileAsset(req, res, "cv")));
  router.post("/identity-document", singleUpload("identityDocument"), asyncHandler(uploadIdentityDocument));
  router.delete("/identity-document", asyncHandler((req, res) => deleteProfileAsset(req, res, "identity")));
  router.post("/experiences", asyncHandler((req, res) => createOrUpdateExperience(req, res, "create")));
  router.put("/experiences/:experienceId", asyncHandler((req, res) => createOrUpdateExperience(req, res, "update")));
  router.delete("/experiences/:experienceId", asyncHandler(deleteExperience));
  router.put("/experiences/reorder", asyncHandler(reorderExperiences));
  router.post("/professional-experience", asyncHandler((req, res) => createOrUpdateExperience(req, res, "create")));
  router.put(
    "/professional-experience/:experienceId",
    asyncHandler((req, res) => createOrUpdateExperience(req, res, "update"))
  );
  router.delete("/professional-experience/:experienceId", asyncHandler(deleteExperience));
  router.put("/professional-experience/reorder", asyncHandler(reorderExperiences));
  router.get("/interests/available", asyncHandler(getAvailableInterests));
  router.post("/interests", asyncHandler(addInterests));
  router.delete("/interests/:interestId", asyncHandler(removeInterest));
  router.put("/privacy", asyncHandler(updatePrivacySettings));
  router.put("/privacy-settings", asyncHandler(updatePrivacySettings));
  router.patch("/privacy", asyncHandler(updatePrivacySettings));
  router.patch("/visibility", asyncHandler(updatePrivacySettings));
  router.get("/:username", asyncHandler(getProfileByUsername));

  return router;
}

function createVerificationRouter() {
  const router = express.Router();

  router.get("/status", asyncHandler(getVerificationStatus));
  router.get("/me", asyncHandler(getVerificationStatus));
  router.get("/notifications", asyncHandler(getVerificationNotifications));
  router.post("/notifications/:notificationId/read", asyncHandler(markVerificationNotificationRead));
  router.get("/document/:documentId", asyncHandler(serveVerificationDocument));
  router.delete("/document/:documentId", asyncHandler(deleteVerificationDocument));
  router.post(
    "/upload",
    multiUpload([
      { name: "identityDocument", maxCount: 1 },
      { name: "passportDocument", maxCount: 1 },
      { name: "rcDocument", maxCount: 1 },
      { name: "iceDocument", maxCount: 1 },
      { name: "ifDocument", maxCount: 1 },
      { name: "statutesDocument", maxCount: 1 },
    ]),
    asyncHandler(uploadVerificationDocuments)
  );
  router.post(
    "/submit",
    multiUpload([
      { name: "identityDocument", maxCount: 1 },
      { name: "passportDocument", maxCount: 1 },
      { name: "rcDocument", maxCount: 1 },
      { name: "iceDocument", maxCount: 1 },
      { name: "ifDocument", maxCount: 1 },
      { name: "statutesDocument", maxCount: 1 },
    ]),
    asyncHandler(uploadVerificationDocuments)
  );

  return router;
}

function createNotificationRouter() {
  const router = express.Router();

  router.get("/", asyncHandler(getVerificationNotifications));
  router.post("/:notificationId/read", asyncHandler(markVerificationNotificationRead));

  return router;
}

function createVerificationAdminRouter() {
  const router = express.Router();

  router.get("/verifications", asyncHandler(listAdminVerifications));
  router.get("/verifications/:verificationId", asyncHandler(getAdminVerificationDetail));
  router.post("/verification/approve", asyncHandler(approveVerification));
  router.post("/verification/reject", asyncHandler(rejectVerification));
  router.post("/verifications/:verificationId/approve", asyncHandler((req, res) => {
    req.body = {
      ...(req.body || {}),
      verificationId: req.params.verificationId,
    };
    return approveVerification(req, res);
  }));
  router.post("/verifications/:verificationId/reject", asyncHandler((req, res) => {
    req.body = {
      ...(req.body || {}),
      verificationId: req.params.verificationId,
    };
    return rejectVerification(req, res);
  }));

  return router;
}

module.exports = {
  createProfileRouter,
  createVerificationRouter,
  createNotificationRouter,
  createVerificationAdminRouter,
  ensureProfileSchema,
  uploadsRoot,
  asyncHandler,
  cleanString,
  decryptPrivateField,
  encryptPrivateField,
  ensureUser,
  ensureVerificationAdmin,
  httpError,
  normalizeAccountType,
  parseJsonObject,
  query,
  sanitizeEmail,
  sanitizePhone,
  toIso,
  toPositiveInt,
};
