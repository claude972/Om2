# Credentials de Test - Application Suivi Chantier O2

## Accès Administrateur

**Mode d'accès** : Cliquer 4 fois rapidement (< 2 secondes) sur le logo O2

**Code PIN Admin** : `123456`

**Sécurité** :
- 3 tentatives échouées = blocage 5 minutes
- Auto-déconnexion après 10 minutes d'inactivité

## Chantiers de Démonstration

1. **Rénovation Bureau O2**
   - Adresse: 12 Avenue des Champs, 75008 Paris
   - Référence: REN-2024-001

2. **Construction Maison Individuelle**
   - Adresse: 45 Rue de la Paix, 92100 Boulogne
   - Référence: CONST-2024-042

## Intervenants

| Nom | Prénom | Métier | Téléphone | Email |
|-----|--------|--------|-----------|-------|
| Dupont | Jean | Électricien | 06 12 34 56 78 | j.dupont@electricite.fr |
| Martin | Sophie | Plombier | 06 23 45 67 89 | s.martin@plomberie.fr |
| Bernard | Pierre | Plaquiste | 06 34 56 78 90 | p.bernard@platrerie.fr |
| Dubois | Marie | Peintre | 06 45 67 89 01 | m.dubois@peinture.fr |
| Petit | Luc | Carreleur | 06 56 78 90 12 | l.petit@carrelage.fr |
| Roux | Thomas | Menuisier | 06 67 89 01 23 | t.roux@menuiserie.fr |

## Tâches de Démonstration

12 tâches créées avec différents statuts :
- 6 tâches "À faire"
- 3 tâches "En cours"
- 1 tâche "À valider"
- 1 tâche "Validée"
- 1 tâche "Refusée"

## Base de Données

**MongoDB** : mongodb://localhost:27017/
**Database** : chantier_db

**Collections** :
- chantiers
- intervenants
- taches
- commentaires
- config

## API Endpoints de Test

```bash
# Health check
curl http://localhost:8001/api/health

# Vérifier le PIN
curl -X POST http://localhost:8001/api/config/verify-pin \
  -H "Content-Type: application/json" \
  -d '{"pin": "123456"}'

# Liste des chantiers
curl http://localhost:8001/api/chantiers

# Liste des intervenants
curl http://localhost:8001/api/intervenants

# Liste des tâches
curl http://localhost:8001/api/taches

# Statistiques globales
curl http://localhost:8001/api/statistiques
```

## Notes

- Aucun mot de passe ou authentification utilisateur (sauf PIN admin)
- Les intervenants peuvent uniquement interagir avec leurs tâches assignées
- Seul le mode admin permet de créer/modifier/supprimer
