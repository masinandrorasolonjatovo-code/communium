# 📸 GUIDE D'INTÉGRATION DES CAPTURES D'ÉCRAN

## Emplacements dans le rapport et captures à effectuer

### 1️⃣ Section 5.1 - Listing des événements
**Fichier rapport** : `MODULE5_RAPPORT_COMPLET.md`  
**Section** : "5. Interfaces utilisateur > 5.1 Page d'accueil Module 5"  
**Lieu** : Entre les lignes avec `[🖼️ PLACE RÉSERVÉE - Capture 1: Listing des événements]`

**À capturer** :
- Screenshot de `http://localhost:3001/module5`
- Montre la liste complète des 3 événements
- Affiche le header avec le titre et description
- Montre le bouton "Créer un événement"
- Affiche le formulaire de recherche
- Chaque événement avec photo placeholder, titre, prix, places restantes

**Dimensions recommandées** : 1920 x 1080 (Full width browser)

**Noms de fichier suggérés** :
- `01_module5_listing_events.png`
- `01_events_overview.png`

---

### 2️⃣ Section 5.2 - Détail événement gratuit
**Fichier rapport** : `MODULE5_RAPPORT_COMPLET.md`  
**Section** : "5. Interfaces utilisateur > 5.2 Détail d'un événement > Détail événement gratuit"  
**Lieu** : Entre les lignes avec `[🖼️ PLACE RÉSERVÉE - Capture 2: Détail événement gratuit]`

**À capturer** :
- Screenshot de `http://localhost:3001/module5/28249f2e-34bd-49d4-9a05-a6b41688dd15` (Roundtable Tech)
- Affiche la bannière d'événement
- Titre et description détaillée
- Information de format (Présentiel/Hybride/Virtuel)
- Localisation (Paris, France)
- Date et heure
- Prix "Gratuit"
- **Formulaire d'inscription** :
  - Champs : Nom + Email
  - Bouton "S'inscrire"
  - Pas de sélection de fournisseur de paiement

**Dimensions recommandées** : 1920 x 1200

**Noms de fichier suggérés** :
- `02_module5_event_free.png`
- `02_free_event_detail.png`

---

### 3️⃣ Section 5.2 - Détail événement payant
**Fichier rapport** : `MODULE5_RAPPORT_COMPLET.md`  
**Section** : "5. Interfaces utilisateur > 5.2 Détail d'un événement > Détail événement payant"  
**Lieu** : Entre les lignes avec `[🖼️ PLACE RÉSERVÉE - Capture 3: Détail événement payant]`

**À capturer** :
- Screenshot de `http://localhost:3001/module5/fbaf5d03-60bb-440a-82ee-c1a50f8eabac` (Meetup Python Payant)
- Affiche bannière d'événement
- Titre et description
- Format (Hybride)
- Localisation (Lyon, France)
- Prix : "50.00 MAD"
- **Formulaire d'inscription** :
  - Champs : Nom + Email
  - **Sélecteur fournisseur de paiement** :
    - Label : "Fournisseur de paiement"
    - Message : "Chargement des options de paiement..."
    - (Ou liste vide si providers ne sont pas initialisés)
  - Bouton "S'inscrire"

**Dimensions recommandées** : 1920 x 1200

**Noms de fichier suggérés** :
- `03_module5_event_paid.png`
- `03_paid_event_detail.png`

---

### 4️⃣ Section 5.3 - Confirmation & Ticket généré
**Fichier rapport** : `MODULE5_RAPPORT_COMPLET.md`  
**Section** : "5. Interfaces utilisateur > 5.3 Confirmation d'inscription > Ticket généré"  
**Lieu** : Entre les lignes avec `[🖼️ PLACE RÉSERVÉE - Capture 4: Ticket généré]`

**À capturer** :
- Screenshot après inscription réussie à un événement gratuit
- Montre le **message de succès** :
  - "Inscription enregistrée avec succès !"
  - Ou "Inscription en attente de paiement"
- Affiche les **détails du ticket** :
  - Nom du participant
  - Email
  - Code de billet
  - Date/heure
- **Section téléchargement** :
  - Bouton "Télécharger PDF"
  - Bouton "Afficher QR"
  - Copie du code de billet
- **Affichage QR Code** :
  - Code QR généré en temps réel
  - Scannable avec téléphone

**Comment générer** :
1. Aller sur `http://localhost:3001/module5`
2. Cliquer sur l'événement "Roundtable Tech 2026"
3. Remplir le formulaire avec:
   - Nom: "John Doe"
   - Email: "john@example.com"
4. Cliquer "S'inscrire"
5. Capturer l'écran de confirmation

**Dimensions recommandées** : 1920 x 1200

**Noms de fichier suggérés** :
- `04_module5_ticket_confirmation.png`
- `04_ticket_success.png`

---

### 5️⃣ Section 3 - Schéma Global
**Fichier rapport** : `MODULE5_RAPPORT_COMPLET.md`  
**Section** : "3. Schéma global"  
**Lieu** : Ligne avec `[🎨 PLACE RÉSERVÉE POUR LE SCHÉMA GLOBALE - Architecture Diagram]`

**À utiliser** :
- **Fichier** : `SCHEMA_GLOBAL_MODULE5.txt` (ASCII art généré)
- **Ou** : Version Mermaid rendue (voir ci-dessous)
- **Ou** : Screenshot du diagramme Mermaid

**Format recommandé** :
1. **Option 1** (Texte) : Copier le contenu de `SCHEMA_GLOBAL_MODULE5.txt` en tant que bloc de code
2. **Option 2** (Image) : Convertir le diagramme Mermaid en PNG/SVG via:
   - https://mermaid.live/
   - https://kroki.io/
   - VS Code Mermaid extension
3. **Option 3** (Mixte) : ASCII art texte + PNG image haute résolution

**Contenu du schéma** :
- **Flux utilisateur** → Frontend → Backend → Database
- **Services externes** : Email, Payment Providers
- **Transactions** : BEGIN/COMMIT/ROLLBACK
- **WebSocket broadcasting**
- **Capacité et waitlist**

---

## 📋 Checklist d'intégration

### Avant d'intégrer les captures:
- [ ] Vérifier que localhost:3001 est en ligne
- [ ] Vérifier que localhost:5000 est en ligne
- [ ] Tester une inscription complète (gratuit)
- [ ] Tester la page détail payante
- [ ] Nettoyer le navigateur (zoom 100%, pas d'extensions visibles)

### Format des fichiers image:
- [ ] Format : PNG ou JPG
- [ ] Compression : Maximale (reduce quality to 85%)
- [ ] Dimensions : Minimum 1920x1080, maximum 2560x1440
- [ ] Noms de fichier : Sans espaces, numérotés (01_, 02_, etc.)

### Intégration dans Word:
1. **Créer un dossier** : `captures_ecran/`
2. **Placer les images** dans ce dossier avec numéros
3. **Ouvrir le fichier Markdown** dans Word ou Pandoc
4. **Insérer les images** aux emplacements `[🖼️ PLACE RÉSERVÉE]`
5. **Dimensionner les images** à 80% de la largeur de la page
6. **Ajouter des légendes** sous chaque image

---

## 🎨 Instruction pour le Schéma Global

Le schéma global doit montrer:

```
USER (Frontend Interface)
  ↓
FRONTEND (Next.js App on :3001)
  ↓
API REQUESTS (CORS enabled)
  ↓
BACKEND (Express Server on :5000)
  ↓
DATABASE (PostgreSQL - module5 schema)
  ↓
EXTERNAL SERVICES:
  • Email: Nodemailer → SMTP
  • Payment: Payment Providers (CMI, Stripe)
```

**Détails à inclure** :
- Endpoints clés (`/events`, `/register`, `/tickets/:id/pdf`)
- Flux de données (Événement → Inscription → Billet → Email)
- Gestion de la capacité et waitlist
- Processus de paiement
- Tables PostgreSQL principales

---

## 📝 Notes pour la rédaction

### En-têtes des sections images:
```
**[Figure N]: Description courte**
*Capture d'écran du [fonctionnalité] montrant [détails clés]*
```

### Exemple de légende:
```
**[Figure 1]: Liste des événements Module 5**
*Affichage de 3 événements de test avec capacité détaillée, 
prix et options de filtrage par recherche.*
```

### Références croisées:
```
Voir Figure 1 pour la vue d'ensemble des événements disponibles.
```

---

## ✅ Validation finale

Avant de finaliser le rapport:

- [ ] Toutes les 4 captures d'écran intégrées
- [ ] Schéma global inséré et visible
- [ ] Légendes complètes sous chaque image
- [ ] Numérotation de figures cohérente (Figure 1-5)
- [ ] Références croisées correctes dans le texte
- [ ] Mise en page professionnelle (marges, police, espacement)
- [ ] Pas d'erreurs typo ou grammaire
- [ ] Export PDF pour vérifier la qualité d'impression

---

## 💾 Fichiers générés

Localisation dans le workspace:

```
communium/
├── MODULE5_RAPPORT_COMPLET.md          ← Rapport principal
├── SCHEMA_GLOBAL_MODULE5.txt           ← Schéma ASCII art
├── GUIDE_CAPTURES_ECRAN.md             ← Ce fichier
└── captures_ecran/                      ← À créer
    ├── 01_events_listing.png
    ├── 02_event_free.png
    ├── 03_event_paid.png
    ├── 04_ticket_confirmation.png
    └── schema_global.png
```

---

## 🎯 Commandes rapides

Pour capturer à l'aide du navigateur:
```powershell
# Capturer une zone avec les outils de développement:
# Ctrl + Shift + P → Screenshot → Capture area
# Ou utiliser: Print Screen → Paint → Crop et save

# Alternative: Utiliser outils système Windows:
# Windows + Shift + S → Snip & Sketch
```

---

**Document créé le** : 28 mai 2026  
**Version** : 1.0  
**Responsable** : Copilot - Module 5 Report Generator
