-- Initialisation de la base de données Communium - Profil Personnel (M1-03)
-- Ce script crée toutes les tables nécessaires pour la fonctionnalité de profil utilisateur

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('VIP', 'Regular', 'Youth');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_tier AS ENUM ('Free', 'Silver', 'Gold', 'Platinum');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE privacy_level AS ENUM ('Public', 'Private', 'ContactsOnly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('CIN', 'PASSPORT', 'DRIVING_LICENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des memberships
CREATE TABLE IF NOT EXISTS memberships (
    id SERIAL PRIMARY KEY,
    tier membership_tier NOT NULL,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des profils utilisateur
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Informations personnelles de base
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    phone TEXT,
    email VARCHAR(100), -- Peut être différent de l'email de connexion

    -- Adresse
    country VARCHAR(100),
    city VARCHAR(100),
    address TEXT,

    -- Documents d'identité
    identity_verified BOOLEAN DEFAULT FALSE,
    identity_document_type document_type,
    identity_document_number TEXT,
    identity_document_url TEXT,

    -- Photo de profil
    profile_picture_url TEXT,
    profile_picture_crop JSONB, -- Coordonnées de recadrage {x, y, width, height}

    -- Profession actuelle
    current_job_title VARCHAR(200),
    current_company VARCHAR(200),
    current_industry VARCHAR(100),

    -- CV
    cv_url TEXT,

    -- URL publique
    public_profile_url VARCHAR(100) UNIQUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index utiles pour M1-03: URL publique, recherche et localisation
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_public_profile_url ON profiles(public_profile_url);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(country, city);
CREATE INDEX IF NOT EXISTS idx_profiles_current_role ON profiles(current_job_title, current_company, current_industry);

-- Table des expériences professionnelles
CREATE TABLE IF NOT EXISTS professional_experiences (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    job_title VARCHAR(200) NOT NULL,
    company VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    location VARCHAR(200),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_professional_experiences_profile_id ON professional_experiences(profile_id);

-- Table des centres d'intérêt
CREATE TABLE IF NOT EXISTS interests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison profil - intérêts (relation many-to-many)
CREATE TABLE IF NOT EXISTS profile_interests (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    interest_id INTEGER NOT NULL REFERENCES interests(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(profile_id, interest_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profile_interests_profile_id ON profile_interests(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_interests_interest_id ON profile_interests(interest_id);

-- Table des paramètres de confidentialité
CREATE TABLE IF NOT EXISTS profile_settings (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Visibilité des informations
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    show_date_of_birth BOOLEAN DEFAULT FALSE,
    show_address BOOLEAN DEFAULT FALSE,
    show_professional_exp BOOLEAN DEFAULT TRUE,
    show_interests BOOLEAN DEFAULT TRUE,
    show_cv BOOLEAN DEFAULT FALSE,

    -- Niveau de confidentialité général
    profile_visibility privacy_level DEFAULT 'Public',

    -- Qui peut voir le profil
    allow_search_engines BOOLEAN DEFAULT TRUE,
    allow_networking_requests BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profile_settings_visibility ON profile_settings(profile_visibility);

-- Table des messages (gardée pour compatibilité)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professional_experiences_updated_at ON professional_experiences;
CREATE TRIGGER update_professional_experiences_updated_at BEFORE UPDATE ON professional_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interests_updated_at ON interests;
CREATE TRIGGER update_interests_updated_at BEFORE UPDATE ON interests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profile_settings_updated_at ON profile_settings;
CREATE TRIGGER update_profile_settings_updated_at BEFORE UPDATE ON profile_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Parametres de confidentialite crees automatiquement pour chaque nouveau profil
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

-- Vue pratique pour rechercher uniquement les profils publics
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
WHERE COALESCE(ps.profile_visibility, 'Public') = 'Public';

-- Insertion de données de test pour les intérêts courants
INSERT INTO interests (name, category) VALUES
('Technologie', 'Professionnel'),
('Intelligence Artificielle', 'Professionnel'),
('Développement Web', 'Professionnel'),
('Data Science', 'Professionnel'),
('Marketing Digital', 'Professionnel'),
('Finance', 'Professionnel'),
('Santé', 'Professionnel'),
('Éducation', 'Professionnel'),
('Voyages', 'Personnel'),
('Sport', 'Personnel'),
('Musique', 'Personnel'),
('Cinéma', 'Personnel'),
('Lecture', 'Personnel'),
('Cuisine', 'Personnel'),
('Photographie', 'Personnel'),
('Art', 'Personnel'),
('Entrepreneuriat', 'Professionnel'),
('Innovation', 'Professionnel'),
('Leadership', 'Professionnel'),
('Réseautage', 'Professionnel')
ON CONFLICT (name) DO NOTHING;

-- Commentaires pour documentation
COMMENT ON TABLE profiles IS 'Profils utilisateur avec toutes les informations personnelles et professionnelles';
COMMENT ON TABLE professional_experiences IS 'Expériences professionnelles des utilisateurs';
COMMENT ON TABLE interests IS 'Catalogue des centres d''intérêt disponibles';
COMMENT ON TABLE profile_interests IS 'Relation many-to-many entre profils et intérêts';
COMMENT ON TABLE profile_settings IS 'Paramètres de confidentialité pour chaque profil';
