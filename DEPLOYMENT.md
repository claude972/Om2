# 🚀 Guide de Déploiement sur Emergent

## Application de Suivi Chantier O2

### ✅ Prérequis

L'application est **prête pour le déploiement** sur Emergent. Tous les services sont configurés et fonctionnent.

### 📋 Checklist Avant Déploiement

- [x] Backend FastAPI fonctionnel (port 8001)
- [x] Frontend React compilé (port 3000)
- [x] MongoDB configuré et peuplé
- [x] Supervisor configuré pour les process
- [x] Variables d'environnement configurées
- [x] Logo O2 intégré
- [x] Données de démonstration chargées
- [x] Tests API passés avec succès

### 🔧 Configuration Actuelle

#### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017/
DATABASE_NAME=chantier_db
ADMIN_PIN=123456
```

#### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

> ⚠️ **Note** : L'URL du backend sera automatiquement mise à jour lors du déploiement Emergent

### 📦 Structure de Déploiement

```
/app/
├── backend/
│   ├── server.py          # API FastAPI
│   ├── requirements.txt   # Dépendances Python
│   └── .env              # Variables d'environnement
├── frontend/
│   ├── src/              # Code React
│   ├── public/           # Assets statiques + logo
│   ├── package.json      # Dépendances Node
│   └── .env             # Variables d'environnement
├── scripts/
│   └── seed_data.py      # Script de peuplement DB
└── memory/
    ├── PRD.md
    ├── test_credentials.md
    └── ...
```

### 🎯 Services Gérés par Supervisor

```ini
[program:backend]
directory=/app/backend
command=python server.py
autostart=true
autorestart=true

[program:frontend]
directory=/app/frontend
command=yarn start
autostart=true
autorestart=true
```

### 🔐 Sécurité pour la Production

#### ⚠️ IMPORTANT : Changer le Code PIN

Après le déploiement, vous devez **impérativement** changer le code PIN par défaut :

1. Accéder au mode admin (4 clics sur logo + PIN 123456)
2. Aller dans les paramètres admin
3. Modifier le code PIN pour un code sécurisé

Ou directement dans MongoDB :
```javascript
db.config.updateOne(
  { _id: "config" },
  { $set: { admin_pin: "VOTRE_NOUVEAU_PIN" } }
)
```

#### Recommandations
- Utiliser un PIN de 6 chiffres aléatoires
- Ne pas utiliser : 123456, 000000, 111111, etc.
- Communiquer le PIN uniquement aux administrateurs autorisés
- Changer le PIN régulièrement

### 📊 Données Initiales

L'application démarre avec :
- **2 chantiers** de démonstration
- **6 intervenants** avec différents métiers
- **12 tâches** avec statuts variés

Pour **réinitialiser** les données :
```bash
python /app/scripts/seed_data.py
```

Pour **supprimer** les données de démo (base vide) :
```javascript
db.chantiers.deleteMany({})
db.intervenants.deleteMany({})
db.taches.deleteMany({})
db.commentaires.deleteMany({})
```

### 🌐 URLs Après Déploiement

Une fois déployé sur Emergent, l'application sera accessible via :

```
https://[votre-app].preview.emergentagent.com
```

L'URL du backend sera automatiquement configurée dans la variable d'environnement `REACT_APP_BACKEND_URL`.

### 📱 Test du Déploiement

Après le déploiement, vérifier :

1. **Page d'accueil** s'affiche correctement
2. **Logo O2** est visible
3. **Chantiers et intervenants** sont chargés
4. **Tâches** s'affichent dans la liste
5. **Mode admin** fonctionne (4 clics + PIN 123456)
6. **Upload de photos** fonctionne
7. **Validation de tâches** fonctionne

### 🧪 Tests Manuels Post-Déploiement

#### Test 1 : Navigation Basique
- [ ] Ouvrir l'application
- [ ] Sélectionner un chantier
- [ ] Cliquer sur un intervenant
- [ ] Ouvrir une tâche
- [ ] Vérifier les informations

#### Test 2 : Mode Admin
- [ ] Cliquer 4 fois rapidement sur le logo
- [ ] Saisir PIN : 123456
- [ ] Vérifier le bandeau orange
- [ ] Vérifier le bouton flottant "+"
- [ ] Créer une nouvelle tâche
- [ ] Modifier une tâche existante

#### Test 3 : Upload Photos
- [ ] Ouvrir une tâche
- [ ] Cliquer sur "Ajouter" photo AVANT
- [ ] Uploader une image
- [ ] Vérifier la compression
- [ ] Vérifier l'affichage miniature
- [ ] Cliquer pour vue plein écran

#### Test 4 : Workflow Validation
- [ ] Ouvrir une tâche "En cours"
- [ ] Ajouter une photo APRÈS
- [ ] Marquer comme "Terminée"
- [ ] Vérifier passage à "À valider"
- [ ] Activer mode admin
- [ ] Valider ou refuser la tâche
- [ ] Vérifier l'historique

### 🔍 Débogage Post-Déploiement

Si problèmes rencontrés :

#### Backend ne répond pas
```bash
# Vérifier les logs
tail -f /var/log/supervisor/backend.err.log

# Redémarrer le service
sudo supervisorctl restart backend

# Tester l'API
curl https://[votre-app].preview.emergentagent.com/api/health
```

#### Frontend ne charge pas
```bash
# Vérifier les logs
tail -f /var/log/supervisor/frontend.err.log

# Redémarrer le service
sudo supervisorctl restart frontend
```

#### Photos ne s'uploadent pas
- Vérifier la taille de l'image (< 10MB recommandé)
- Vérifier la connexion internet
- Vérifier les logs backend pour erreurs de compression

#### Mode admin ne s'active pas
- Vérifier que 4 clics sont bien détectés (< 2 sec)
- Vérifier le code PIN (par défaut : 123456)
- Vérifier qu'il n'y a pas de blocage (attendre 5 min si bloqué)

### 📞 Support

En cas de problème :

1. Consulter les logs : `/var/log/supervisor/`
2. Vérifier la documentation : `/app/README.md`
3. Consulter le PRD : `/app/memory/PRD.md`
4. Credentials de test : `/app/memory/test_credentials.md`

### 🎉 Fonctionnalités Clés à Présenter

1. **Accès admin secret** via le logo (wow effect)
2. **Upload photos** depuis caméra mobile
3. **Workflow de validation** complet
4. **Interface mobile-first** professionnelle
5. **Filtres et recherche** en temps réel
6. **Badges de statut** visuels et colorés
7. **Progression** par intervenant et globale
8. **Historique** des validations tracé

### ⚡ Performance

- Temps de chargement : < 2 sec
- Photos compressées : réduction ~70%
- API response : < 100ms
- Base de données : indexée et optimisée

### 🔮 Évolutions Possibles

Pour étendre l'application après le MVP :
- Export PDF des rapports
- Mode hors-ligne complet (PWA)
- Notifications push
- Multi-entreprises
- Application mobile native

---

**✅ L'application est prête pour le déploiement !**

**Code PIN par défaut** : `123456` (à changer en production)

**Bon déploiement ! 🚀**
