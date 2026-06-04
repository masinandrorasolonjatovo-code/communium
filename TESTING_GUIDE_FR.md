# Guide Complet : CI/CD et Tests de Performance

Derniere mise a jour: 2026-05-30

## 📋 Vue d'ensemble

Le pipeline CI/CD automatisé via **GitHub Actions** effectue les vérifications suivantes :

### 1. ✅ Vérification TypeScript
- Compilation sans erreurs
- Vérification ESLint
- Formatage du code

### 2. 🧪 Tests Unitaires
- Tests de l'algorithme de matching
- Couverture de code
- Génération de rapports

### 3. 📊 Tests de Charge
- 100 utilisateurs simultanés
- Durée : 30 secondes
- Cibles de performance :
  - Réponse moyenne : < 1 seconde
  - P95 : < 2 secondes
  - P99 : < 3 secondes
  - Taux de succès : > 95%

### 4. 🎯 Tests de Performance
- Benchmark de l'algorithme de matching
- Tests avec 10, 100, 1000 utilisateurs
- Cible : < 2 secondes pour 1000 utilisateurs

### 5. 🐳 Build Docker
- Vérification des Dockerfile
- Construction des images

## 🚀 Exécution Locale

### Installation
```bash
cd backend
npm install --save-dev jest ts-jest @types/jest ts-node
```

### Tests Unitaires
```bash
npm run test:unit
```

**Exemple de sortie :**
```
PASS  tests/matching.test.ts
  Matching Algorithm - Unit Tests
    findMatches
      ✓ should find matches for a user
      ✓ should return matches sorted by score (highest first)
      ✓ should filter matches by minimum threshold
      ✓ should find common interests
      ✓ should not match same user
      ✓ should respect limit parameter
      ✓ should handle empty candidates
      ✓ should calculate scores between 0 and 100
    batchFindMatches
      ✓ should perform batch matching for all users
      ✓ should return matches for each user
      ✓ should not include self-matches in batch results
    Performance
      ✓ should find matches for 100 users in less than 500ms

Tests:       12 passed, 12 total
```

### Tests de Charge
```bash
# Assurez-vous que le serveur API est en cours d'exécution sur localhost:5000
npm run test:load
```

**Exemple de sortie :**
```
Starting load test with 100 concurrent users for 30000ms

========== LOAD TEST RESULTS ==========
Total Requests: 1,250
Successful: 1,187
Failed: 63
Success Rate: 94.96%
Requests/Second: 42

========== RESPONSE TIME METRICS ==========
Average: 850ms
Min: 120ms
Max: 4,500ms
P95: 1,800ms
P99: 2,900ms

========== PERFORMANCE CHECKS ==========
Average Response Time (< 1000ms): ✗ FAIL
P95 Response Time (< 2000ms): ✓ PASS
P99 Response Time (< 3000ms): ✓ PASS
Success Rate (> 95%): ✗ FAIL
```

### Tests de Performance
```bash
npm run test:perf
```

**Exemple de sortie :**
```
Running benchmark: findMatches (10 users) (1000 iterations)
Running benchmark: findMatches (100 users) (500 iterations)
Running benchmark: findMatches (1000 users) (100 iterations)
Running benchmark: batchFindMatches (100 users) (10 iterations)
Running benchmark: batchFindMatches (500 users) (5 iterations)

========== BENCHMARK RESULTS ==========
Name                                    Avg (ms)     Min (ms)     Max (ms)     Ops/s
--------------------------------------------------------------------------------
findMatches (10 users)                  0.234        0.102        1.456        4,274
findMatches (100 users)                 2.156        0.945        8.234        464
findMatches (1000 users)                21.450       18.200       34.560       47
batchFindMatches (100 users)            150.000      140.000      200.000      7
batchFindMatches (500 users)            3,200.000    2,950.000    3,450.000    0

========== PERFORMANCE TARGETS ==========
Target: Match finding for 1000 users in < 2 seconds (page load target)
findMatches (1000 users): 1,450ms ✓ PASS
```

## 🎯 Cibles de Performance pour l'Élite Marocaine

Communium cible l'élite marocaine où la performance est critique :

- **Temps de chargement page** : < 2 secondes
- **Recherche de matches** : < 2 secondes pour 1000+ utilisateurs
- **Temps de réponse API** :
  - Moyenne : < 1 seconde
  - P95 (95% des utilisateurs) : < 2 secondes
  - P99 (99% des utilisateurs) : < 3 secondes

## 📁 Structure des Fichiers de Test

```
backend/
├── src/
│   └── matching.ts              # Algorithme de matching
├── tests/
│   ├── matching.test.ts         # Tests unitaires
│   ├── load.test.ts             # Tests de charge
│   └── performance.test.ts      # Benchmarks de performance
├── jest.config.js               # Configuration Jest
└── tsconfig.json                # Configuration TypeScript
```

## 🔄 Flux du Pipeline CI/CD

```
┌─────────────────────────────┐
│   Push / Pull Request       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  TypeScript Compilation    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Unit Tests              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Load Tests              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Code Quality             │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Build Docker Images       │
└──────────────┬──────────────┘
               │
               ▼
         ✅ All Passed
         (ou ❌ Failed)
```

## 🧬 Algorithme de Matching

L'algorithme utilise une pondération intelligente pour trouver les meilleures correspondances :

- **Intérêts** : 40% du score
- **Compétences** : 30% du score
- **Objectifs** : 20% du score
- **Disponibilité** : 10% du score

Bonus : +5 points pour les appairements inter-rôles (VIP avec non-VIP).

### Exemple :
```
User 1 (VIP):
- Intérêts : [coding, AI, blockchain]
- Compétences : [JavaScript, Python, Solidity]
- Objectifs : [startup, innovation]

User 2 (Regular):
- Intérêts : [coding, web, blockchain]
- Compétences : [JavaScript, React, Node.js]
- Objectifs : [startup, learning]

Match Score = 65/100
- Intérêts communs : 2/3 = 67% × 0.4 = 26.8
- Compétences communes : 1/3 = 33% × 0.3 = 10
- Objectifs communs : 1/2 = 50% × 0.2 = 10
- Disponibilité moyenne × 0.1 = 5 (exemple)
- Bonus inter-rôle : +5
= 56.8 + 5 = 61.8 → 65/100
```

## 📈 Optimisations Implémentées

1. **Caching** : Résultats de matching en cache Redis
2. **Pagination** : Limitation des résultats retournés
3. **Index de base de données** : Optimisation des requêtes
4. **Batch Processing** : Traitement par lots des utilisateurs
5. **Algorithme optimisé** : Complexité O(n) pour la comparaison

## 🐛 Dépannage

### Les tests échouent localement mais passent en CI
- Vérifiez la version de Node.js (18+)
- Supprimez et réinstallez les dépendances

### Les tests de charge s'arrêtent à cause d'un timeout
- Vérifiez que le serveur API est en cours d'exécution
- Vérifiez l'accès réseau à localhost:5000

### Les benchmarks de performance échouent
- Réduisez la charge système
- Optimisez l'algorithme de matching
- Envisagez le caching des résultats

## 📚 Ressources Additionnelles

- `CI_CD_SETUP.md` : Configuration détaillée du pipeline
- `I18N_SETUP.md` : Configuration de l'internationalisation
- `README.md` : Guide global du projet
