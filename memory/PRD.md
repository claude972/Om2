# PRD - Application de Suivi de Tâches Chantier O2

## Vue d'ensemble

Application web mobile-first de suivi de tâches pour chantiers BTP, destinée aux chefs de chantier et intervenants de terrain.

## Objectifs

1. Faciliter le suivi des tâches sur les chantiers
2. Permettre la documentation visuelle (photos avant/après)
3. Fluidifier le workflow de validation des travaux
4. Offrir une interface adaptée à l'utilisation terrain (mobile, tactile)
5. Protéger l'accès administratif par un système secret

## Utilisateurs Cibles

### Intervenants (Mode Lecture + Interaction Limitée)
- Consultent les tâches qui leur sont assignées
- Ajoutent des photos avant/après
- Marquent les tâches comme terminées
- Ajoutent des commentaires

### Administrateurs (Mode Complet)
- Accès via système secret (4 clics sur logo + PIN 6 chiffres)
- Gestion complète : chantiers, intervenants, tâches
- Validation/refus des tâches terminées
- Réorganisation des priorités
- Modification du code PIN

## Fonctionnalités Principales

### 1. Dashboard
- Sélecteur de chantier (dropdown)
- Sélecteur de date (date picker)
- Liste d'intervenants en cartes scrollables horizontalement
- Affichage progression par intervenant
- Compteur de progression global du chantier

### 2. Gestion des Tâches
- Liste de tâches en cartes
- Numérotation automatique (T-001, T-002...)
- Ordre de priorité réorganisable (admin uniquement)
- Filtres : statut, intervenant, zone, recherche texte
- Badges de statut colorés
- Indicateur de retard (date limite dépassée)

### 3. Détail d'une Tâche
- Informations complètes
- Photos AVANT (admin + intervenant peuvent ajouter)
- Photos APRÈS (intervenant uniquement)
- Upload photos : caméra mobile ou galerie
- Compression automatique des images
- Commentaires intervenant
- Workflow de validation (marquer terminée → à valider → validée/refusée)
- Historique de validation avec horodatage

### 4. Mode Administrateur Secret
- **Activation** : 4 clics rapides sur logo (< 2 sec) + PIN 6 chiffres
- **Sécurité** : 
  - 3 tentatives échouées = blocage 5 minutes
  - Auto-déconnexion après 10 min d'inactivité
  - Aucun indice visuel sur le logo
- **Capacités** :
  - Création/édition/suppression : chantiers, intervenants, tâches
  - Validation/refus des tâches
  - Réorganisation ordre des tâches
  - Modification du code PIN
  - Toutes les fonctionnalités CRUD

### 5. Statuts des Tâches
- **À faire** (gris) : Tâche créée, non commencée
- **En cours** (bleu) : Tâche en cours de réalisation
- **À valider** (orange) : Marquée terminée par l'intervenant
- **Validée** (vert) : Acceptée par l'admin
- **Refusée** (rouge) : Refusée par l'admin avec commentaire obligatoire

### 6. Gestion des Photos
- Upload depuis caméra mobile ou galerie
- Compression automatique (max 1200px, qualité 85%)
- Conversion en JPEG
- Stockage en base64 dans MongoDB
- Affichage miniatures avec vue plein écran
- Suppression possible (admin uniquement)
- Légendes optionnelles

## Contraintes Techniques

### Performance
- Compression automatique des images avant stockage
- Chargement lazy des photos
- Requêtes API optimisées avec filtres côté serveur

### UX Mobile
- Boutons tactiles minimum 44px x 44px
- Compatible gants de chantier
- Contraste élevé pour lecture extérieure
- Scroll horizontal pour listes d'intervenants
- Interface responsive (mobile-first)

### Sécurité
- Code PIN stocké en base de données
- Système de blocage après tentatives échouées
- Timeout automatique du mode admin
- Aucun stockage de credentials utilisateur (pas d'auth individuelle)

### Accessibilité
- data-testid sur tous les éléments interactifs
- Focus visible sur les éléments
- Textes en français clair
- Messages d'erreur explicites

## Stack Technique

### Frontend
- React 18
- Tailwind CSS
- Lucide React (icons)
- Axios (HTTP)
- date-fns (dates)

### Backend
- FastAPI (Python)
- MongoDB
- Pydantic (validation)
- Pillow (compression images)
- ReportLab (export PDF - futur)

### Infrastructure
- Supervisor (process management)
- MongoDB local
- Hot reload dev

## Données du Modèle

### Chantier
- id, nom, adresse, reference
- date_debut, date_fin
- actif (boolean)

### Intervenant
- id, nom, prenom, metier
- telephone, email
- actif (boolean)
- stats : total_taches, taches_completees (calculé)

### Tâche
- id, numero, ordre
- intitule, zone
- chantier_id, intervenant_id
- date_prevue, date_limite
- statut
- photos_avant[], photos_apres[]
- commentaire_intervenant
- historique_validation[]
- date_creation

### Photo
- id, data (base64), legende
- date_ajout, type (avant/apres)

### HistoriqueValidation
- date, action (marquee_terminee/validee/refusee)
- auteur, commentaire

### Config
- admin_pin
- tentatives_echecs
- bloque_jusqua

## API Endpoints

### Config
- GET /api/config/check-block
- POST /api/config/verify-pin
- PUT /api/config/update-pin

### Chantiers
- GET /api/chantiers
- POST /api/chantiers (admin)
- PUT /api/chantiers/{id} (admin)
- DELETE /api/chantiers/{id} (admin)

### Intervenants
- GET /api/intervenants
- POST /api/intervenants (admin)
- PUT /api/intervenants/{id} (admin)
- DELETE /api/intervenants/{id} (admin)

### Tâches
- GET /api/taches (avec filtres)
- GET /api/taches/{id}
- POST /api/taches (admin)
- PUT /api/taches/{id} (admin)
- DELETE /api/taches/{id} (admin)
- POST /api/taches/{id}/reorder (admin)
- POST /api/taches/{id}/photos
- DELETE /api/taches/{id}/photos/{photo_id} (admin)
- POST /api/taches/{id}/marquer-terminee
- POST /api/taches/{id}/valider (admin)
- POST /api/taches/{id}/refuser (admin)

### Statistiques
- GET /api/statistiques

## Workflow Utilisateur

### Intervenant
1. Ouvre l'app → voit le dashboard
2. Sélectionne son chantier
3. Clique sur sa carte d'intervenant (filtre ses tâches)
4. Ouvre une tâche
5. Ajoute des photos avant (si nécessaire)
6. Réalise le travail
7. Ajoute des photos après
8. Marque la tâche "Terminée" avec commentaire
9. Statut passe à "À valider"

### Admin
1. Ouvre l'app
2. Clique 4 fois rapidement sur le logo O2
3. Saisit le code PIN : 123456
4. Mode admin activé (bandeau orange)
5. Consulte les tâches "À valider"
6. Ouvre une tâche
7. Vérifie les photos et commentaires
8. Valide OU Refuse (avec commentaire obligatoire)
9. L'historique est tracé

### Création de Tâche (Admin)
1. Activer le mode admin
2. Cliquer sur le bouton flottant "+"
3. Remplir le formulaire :
   - Intitulé
   - Chantier
   - Intervenant
   - Zone
   - Date prévue / Date limite
   - Statut initial
4. La tâche est créée avec numéro auto (T-XXX)

## Évolutions Futures

### Phase 2 (Non implémentée)
- Export PDF des rapports
- Mode hors-ligne complet (PWA avec Service Worker)
- Notifications push
- Signature électronique
- Géolocalisation des photos
- Multi-chantiers en parallèle
- Dashboard analytics avancé

### Phase 3 (Entreprise)
- Multi-tenancy (plusieurs entreprises)
- Rôles utilisateurs granulaires
- Intégration facturation
- Planning Gantt
- API publique
- Application mobile native

## Critères de Succès

1. ✅ Interface 100% mobile-friendly
2. ✅ Temps de chargement < 2 secondes
3. ✅ Mode admin non découvrable sans explication
4. ✅ Photos compressées < 500Ko
5. ✅ Workflow de validation complet et tracé
6. ✅ Aucune perte de données lors des uploads
7. ✅ Compatible Safari iOS et Chrome Android

## Contraintes & Limitations

- Pas d'authentification utilisateur individuelle
- Photos stockées en base64 (limite de taille MongoDB : 16MB par document)
- Pas de mode hors-ligne complet (seulement hot reload)
- Export PDF non implémenté dans MVP
- Pas de gestion des droits granulaire (admin/non-admin uniquement)
- Historique limité à la validation (pas d'audit complet)

## Design System

### Couleurs
- Primary : #1e3a8a (bleu foncé)
- Secondary : #f97316 (orange)
- Background : #f8fafc (gris clair)
- Success : #10b981 (vert)
- Error : #ef4444 (rouge)
- Warning : #f59e0b (orange foncé)

### Typography
- Police : Inter (Google Fonts fallback)
- Taille minimum : 14px (lisibilité mobile)
- Line-height : 1.5

### Spacing
- Base : 4px (système 4px)
- Boutons : padding minimum 12px vertical, 16px horizontal
- Cards : padding 16px (mobile) / 24px (desktop)

### Breakpoints
- Mobile : < 640px
- Tablet : 640px - 1024px
- Desktop : > 1024px

## Métriques & Analytics (Futur)

- Temps moyen de validation par tâche
- Taux de refus par intervenant
- Nombre de photos par tâche
- Délai moyen entre création et validation
- Tâches en retard par chantier

## Support & Maintenance

- Logs backend : /var/log/supervisor/backend.err.log
- Logs frontend : /var/log/supervisor/frontend.err.log
- Seed database : python /app/scripts/seed_data.py
- Restart services : sudo supervisorctl restart all

## Documentation

- README.md : Guide utilisateur et installation
- test_credentials.md : Credentials de test
- API Swagger : http://localhost:8001/docs

---

**Version** : 1.0.0 (MVP)  
**Date** : Mars 2024  
**Statut** : ✅ Implémenté et testé
