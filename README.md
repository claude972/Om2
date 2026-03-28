# 🏗️ Application de Suivi de Chantier O2

Application web professionnelle de suivi de tâches pour chantiers BTP. Mobile-first, conçue pour être utilisée directement sur le terrain par les chefs de chantier et les intervenants.

## 📋 Fonctionnalités

### Mode Utilisateur (Intervenant)
- **Consultation des tâches** assignées
- **Upload de photos** avant/après depuis la caméra mobile
- **Marquage des tâches terminées** avec commentaires
- **Filtrage et recherche** de tâches
- **Visualisation** de la progression par chantier

### Mode Administrateur (Secret)
- **Accès secret** : 4 clics rapides sur le logo + code PIN 6 chiffres
- **Gestion complète** : chantiers, intervenants, tâches
- **Création et édition** de tâches
- **Validation/refus** des tâches terminées
- **Réorganisation** de l'ordre des tâches
- **Sécurité** : blocage après 3 tentatives échouées (5 min)
- **Auto-déconnexion** après 10 minutes d'inactivité

### Autres fonctionnalités
- **Workflow de validation** complet avec historique
- **Photos** avant/après compressées automatiquement
- **Badges de statut** colorés (À faire, En cours, À valider, Validée, Refusée)
- **Indicateurs de retard** pour les tâches
- **Statistiques** et progression globale
- **Interface 100% en français**
- **Design mobile-first** avec boutons tactiles larges

## 🚀 Démarrage

### Prérequis
- Python 3.11+
- Node.js 18+
- MongoDB

### Installation et lancement

Les services sont gérés par Supervisor et démarrent automatiquement :

```bash
# Vérifier le statut des services
sudo supervisorctl status

# Redémarrer les services si nécessaire
sudo supervisorctl restart all
```

### Accès à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8001
- **Documentation API** : http://localhost:8001/docs

## 🔐 Accès Administrateur

1. **Cliquez 4 fois rapidement** sur le logo O2 (en moins de 2 secondes)
2. Un modal apparaît pour saisir le **code PIN à 6 chiffres**
3. **Code PIN par défaut** : `123456`
4. Le mode admin s'active avec un bandeau orange en haut de l'écran

⚠️ **Sécurité** :
- 3 tentatives échouées = blocage de 5 minutes
- Auto-déconnexion après 10 minutes d'inactivité
- Aucun indice visuel ne révèle la fonction secrète du logo

## 📊 Données de Démonstration

La base de données est pré-remplie avec :

### Chantiers
1. **Rénovation Bureau O2** (Paris 8ème)
2. **Construction Maison Individuelle** (Boulogne)

### Intervenants (6)
- Jean Dupont - Électricien
- Sophie Martin - Plombier
- Pierre Bernard - Plaquiste
- Marie Dubois - Peintre
- Luc Petit - Carreleur
- Thomas Roux - Menuisier

### Tâches (12)
Réparties sur les 2 chantiers avec différents statuts :
- À faire
- En cours
- À valider
- Validée
- Refusée

## 🛠️ Stack Technique

### Backend
- **Framework** : FastAPI (Python)
- **Base de données** : MongoDB
- **Upload photos** : Base64 encodé avec compression PIL
- **API REST** : Documentation Swagger automatique

### Frontend
- **Framework** : React 18
- **Styling** : Tailwind CSS
- **Icons** : Lucide React
- **HTTP Client** : Axios
- **Date handling** : date-fns

### Infrastructure
- **Process Manager** : Supervisor
- **Database** : MongoDB local

## 📱 Design Mobile-First

- Interface optimisée pour **smartphones de chantier**
- Boutons tactiles de **minimum 44px** (utilisable avec gants)
- **Contraste élevé** pour utilisation en extérieur
- Photos affichées en **miniatures cliquables** avec vue plein écran
- **Scroll horizontal** pour la liste des intervenants
- **Compression automatique** des photos uploadées

## 🎨 Charte Graphique

- **Couleur primaire** : Bleu foncé (#1e3a8a)
- **Couleur secondaire** : Orange (#f97316)
- **Fond** : Gris clair (#f8fafc)
- **Police** : Inter (fallback: system fonts)

## 📸 Gestion des Photos

Les photos sont :
1. **Capturées** depuis la caméra mobile ou uploadées
2. **Compressées** automatiquement (max 1200px, qualité 85%)
3. **Converties** en JPEG
4. **Stockées** en base64 dans MongoDB
5. **Affichées** en miniatures avec vue plein écran au clic

## 🔄 Workflow de Validation

1. **Intervenant** : Ajoute des photos après et marque la tâche "Terminée"
2. **Statut** : Passe automatiquement à "À valider"
3. **Admin** : Valide ou refuse avec commentaire obligatoire (si refus)
4. **Historique** : Toutes les actions sont tracées avec date et auteur

## 🌐 API Endpoints

### Configuration
- `GET /api/config/check-block` - Vérifier si l'accès est bloqué
- `POST /api/config/verify-pin` - Vérifier le code PIN
- `PUT /api/config/update-pin` - Modifier le code PIN (admin)

### Chantiers
- `GET /api/chantiers` - Liste des chantiers
- `POST /api/chantiers` - Créer un chantier (admin)
- `PUT /api/chantiers/{id}` - Modifier un chantier (admin)
- `DELETE /api/chantiers/{id}` - Supprimer un chantier (admin)

### Intervenants
- `GET /api/intervenants` - Liste des intervenants avec stats
- `POST /api/intervenants` - Créer un intervenant (admin)
- `PUT /api/intervenants/{id}` - Modifier un intervenant (admin)
- `DELETE /api/intervenants/{id}` - Supprimer un intervenant (admin)

### Tâches
- `GET /api/taches` - Liste des tâches (avec filtres)
- `GET /api/taches/{id}` - Détail d'une tâche
- `POST /api/taches` - Créer une tâche (admin)
- `PUT /api/taches/{id}` - Modifier une tâche (admin)
- `DELETE /api/taches/{id}` - Supprimer une tâche (admin)
- `POST /api/taches/{id}/reorder` - Réorganiser l'ordre (admin)
- `POST /api/taches/{id}/photos` - Ajouter une photo
- `DELETE /api/taches/{id}/photos/{photo_id}` - Supprimer une photo
- `POST /api/taches/{id}/marquer-terminee` - Marquer terminée (intervenant)
- `POST /api/taches/{id}/valider` - Valider (admin)
- `POST /api/taches/{id}/refuser` - Refuser (admin)

### Statistiques
- `GET /api/statistiques` - Stats globales par chantier

## 🔧 Scripts Utiles

```bash
# Repeupler la base de données
python /app/scripts/seed_data.py

# Vérifier les logs backend
tail -f /var/log/supervisor/backend.err.log

# Vérifier les logs frontend
tail -f /var/log/supervisor/frontend.err.log

# Redémarrer uniquement le backend
sudo supervisorctl restart backend

# Redémarrer uniquement le frontend
sudo supervisorctl restart frontend
```

## 🧪 Tests

### Tester le backend
```bash
# Health check
curl http://localhost:8001/api/health

# Liste des chantiers
curl http://localhost:8001/api/chantiers

# Statistiques
curl http://localhost:8001/api/statistiques?chantier_id=<ID>
```

### Tester l'accès admin
1. Ouvrir l'application frontend
2. Cliquer 4 fois rapidement sur le logo O2
3. Saisir le code PIN : `123456`
4. Vérifier le bandeau "MODE ADMINISTRATEUR ACTIVÉ"
5. Vérifier l'apparition du bouton flottant "+"

## 📝 Notes Importantes

- Les **photos** sont compressées automatiquement pour optimiser la bande passante
- Le **mode admin** se désactive automatiquement après 10 minutes d'inactivité
- Les **dates limites** affichent un badge "EN RETARD" si dépassées
- La **numérotation des tâches** (T-001, T-002...) est automatique et séquentielle
- Les **intervenants** voient leur progression calculée en temps réel

## 🚧 Évolutions Futures Possibles

- [ ] Export PDF des rapports de chantier
- [ ] Mode hors-ligne complet (PWA avec Service Worker)
- [ ] Notifications push pour les nouvelles tâches
- [ ] Signature électronique sur les validations
- [ ] Géolocalisation des photos
- [ ] Tableau de bord analytics avancé
- [ ] Multi-tenancy (plusieurs entreprises)

## 📄 Licence

Application développée pour O2 - Tous droits réservés

---

**Version** : 1.0.0  
**Dernière mise à jour** : Mars 2024
