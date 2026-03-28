#!/usr/bin/env python3
"""
Script de seed pour peupler la base de données avec des données de démonstration
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from datetime import datetime, timedelta
import uuid

# Connexion MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(mongo_url)
db = client['chantier_db']

# Collections
chantiers_collection = db['chantiers']
intervenants_collection = db['intervenants']
taches_collection = db['taches']
config_collection = db['config']

def clear_database():
    """Vider toutes les collections"""
    print("🗑️  Nettoyage de la base de données...")
    chantiers_collection.delete_many({})
    intervenants_collection.delete_many({})
    taches_collection.delete_many({})
    config_collection.delete_many({})
    print("✅ Base de données nettoyée")

def seed_config():
    """Créer la configuration par défaut"""
    print("⚙️  Création de la configuration...")
    config_collection.insert_one({
        "_id": "config",
        "admin_pin": "123456",
        "tentatives_echecs": 0,
        "derniere_tentative": None,
        "bloque_jusqua": None
    })
    print("✅ Configuration créée (PIN: 123456)")

def seed_chantiers():
    """Créer des chantiers de démonstration"""
    print("🏗️  Création des chantiers...")
    
    chantiers = [
        {
            "_id": str(uuid.uuid4()),
            "nom": "Rénovation Bureau O2",
            "adresse": "12 Avenue des Champs, 75008 Paris",
            "reference": "REN-2024-001",
            "date_debut": "2024-01-15",
            "date_fin": "2024-06-30",
            "actif": True
        },
        {
            "_id": str(uuid.uuid4()),
            "nom": "Construction Maison Individuelle",
            "adresse": "45 Rue de la Paix, 92100 Boulogne",
            "reference": "CONST-2024-042",
            "date_debut": "2024-02-01",
            "date_fin": "2024-12-31",
            "actif": True
        }
    ]
    
    chantiers_collection.insert_many(chantiers)
    print(f"✅ {len(chantiers)} chantiers créés")
    return chantiers

def seed_intervenants():
    """Créer des intervenants de démonstration"""
    print("👷 Création des intervenants...")
    
    intervenants = [
        {
            "_id": str(uuid.uuid4()),
            "nom": "Dupont",
            "prenom": "Jean",
            "metier": "Électricien",
            "telephone": "06 12 34 56 78",
            "email": "j.dupont@electricite.fr",
            "actif": True
        },
        {
            "_id": str(uuid.uuid4()),
            "nom": "Martin",
            "prenom": "Sophie",
            "metier": "Plombier",
            "telephone": "06 23 45 67 89",
            "email": "s.martin@plomberie.fr",
            "actif": True
        },
        {
            "_id": str(uuid.uuid4()),
            "nom": "Bernard",
            "prenom": "Pierre",
            "metier": "Plaquiste",
            "telephone": "06 34 56 78 90",
            "email": "p.bernard@platrerie.fr",
            "actif": True
        },
        {
            "_id": str(uuid.uuid4()),
            "nom": "Dubois",
            "prenom": "Marie",
            "metier": "Peintre",
            "telephone": "06 45 67 89 01",
            "email": "m.dubois@peinture.fr",
            "actif": True
        },
        {
            "_id": str(uuid.uuid4()),
            "nom": "Petit",
            "prenom": "Luc",
            "metier": "Carreleur",
            "telephone": "06 56 78 90 12",
            "email": "l.petit@carrelage.fr",
            "actif": True
        },
        {
            "_id": str(uuid.uuid4()),
            "nom": "Roux",
            "prenom": "Thomas",
            "metier": "Menuisier",
            "telephone": "06 67 89 01 23",
            "email": "t.roux@menuiserie.fr",
            "actif": True
        }
    ]
    
    intervenants_collection.insert_many(intervenants)
    print(f"✅ {len(intervenants)} intervenants créés")
    return intervenants

def seed_taches(chantiers, intervenants):
    """Créer des tâches de démonstration"""
    print("📋 Création des tâches...")
    
    today = datetime.now()
    
    taches = [
        # Chantier 1 - Rénovation Bureau
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-001",
            "ordre": 1,
            "intitule": "Installation tableau électrique principal",
            "chantier_id": chantiers[0]["_id"],
            "intervenant_id": intervenants[0]["_id"],  # Électricien
            "date_prevue": (today + timedelta(days=2)).strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=5)).strftime("%Y-%m-%d"),
            "statut": "a_faire",
            "zone": "Local technique - Sous-sol",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": None,
            "historique_validation": [],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-002",
            "ordre": 2,
            "intitule": "Pose des prises électriques - Bureau 1",
            "chantier_id": chantiers[0]["_id"],
            "intervenant_id": intervenants[0]["_id"],  # Électricien
            "date_prevue": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
            "statut": "en_cours",
            "zone": "1er étage - Bureau 1",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": None,
            "historique_validation": [],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-003",
            "ordre": 3,
            "intitule": "Installation sanitaires - Salle de bain RDC",
            "chantier_id": chantiers[0]["_id"],
            "intervenant_id": intervenants[1]["_id"],  # Plombier
            "date_prevue": today.strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=2)).strftime("%Y-%m-%d"),
            "statut": "a_valider",
            "zone": "RDC - Salle de bain",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": "Installation terminée, robinetterie et WC posés",
            "historique_validation": [
                {
                    "date": (today - timedelta(hours=2)).isoformat(),
                    "action": "marquee_terminee",
                    "auteur": "Intervenant",
                    "commentaire": "Installation terminée, robinetterie et WC posés"
                }
            ],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-004",
            "ordre": 4,
            "intitule": "Montage cloisons placo - Open space",
            "chantier_id": chantiers[0]["_id"],
            "intervenant_id": intervenants[2]["_id"],  # Plaquiste
            "date_prevue": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
            "statut": "validee",
            "zone": "1er étage - Open space",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": "Cloisons montées et bandes posées",
            "historique_validation": [
                {
                    "date": (today - timedelta(days=1)).isoformat(),
                    "action": "marquee_terminee",
                    "auteur": "Intervenant",
                    "commentaire": "Cloisons montées et bandes posées"
                },
                {
                    "date": (today - timedelta(hours=12)).isoformat(),
                    "action": "validee",
                    "auteur": "Admin",
                    "commentaire": "Travail impeccable, bien joué !"
                }
            ],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-005",
            "ordre": 5,
            "intitule": "Peinture hall d'entrée",
            "chantier_id": chantiers[0]["_id"],
            "intervenant_id": intervenants[3]["_id"],  # Peintre
            "date_prevue": (today + timedelta(days=5)).strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=8)).strftime("%Y-%m-%d"),
            "statut": "a_faire",
            "zone": "RDC - Hall d'entrée",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": None,
            "historique_validation": [],
            "date_creation": today.isoformat()
        },
        # Chantier 2 - Construction Maison
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-006",
            "ordre": 6,
            "intitule": "Pose carrelage cuisine",
            "chantier_id": chantiers[1]["_id"],
            "intervenant_id": intervenants[4]["_id"],  # Carreleur
            "date_prevue": today.strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=4)).strftime("%Y-%m-%d"),
            "statut": "en_cours",
            "zone": "RDC - Cuisine",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": None,
            "historique_validation": [],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-007",
            "ordre": 7,
            "intitule": "Installation portes intérieures",
            "chantier_id": chantiers[1]["_id"],
            "intervenant_id": intervenants[5]["_id"],  # Menuisier
            "date_prevue": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=7)).strftime("%Y-%m-%d"),
            "statut": "a_faire",
            "zone": "Toutes pièces - RDC et Étage",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": None,
            "historique_validation": [],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-008",
            "ordre": 8,
            "intitule": "Raccordement plomberie salle de bain étage",
            "chantier_id": chantiers[1]["_id"],
            "intervenant_id": intervenants[1]["_id"],  # Plombier
            "date_prevue": (today - timedelta(days=1)).strftime("%Y-%m-%d"),
            "date_limite": today.strftime("%Y-%m-%d"),
            "statut": "refusee",
            "zone": "Étage - Salle de bain",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": "Raccordement effectué",
            "historique_validation": [
                {
                    "date": (today - timedelta(hours=6)).isoformat(),
                    "action": "marquee_terminee",
                    "auteur": "Intervenant",
                    "commentaire": "Raccordement effectué"
                },
                {
                    "date": (today - timedelta(hours=3)).isoformat(),
                    "action": "refusee",
                    "auteur": "Admin",
                    "commentaire": "Fuite détectée au niveau du lavabo. Merci de corriger."
                }
            ],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-009",
            "ordre": 9,
            "intitule": "Câblage réseau RJ45 - Chambres",
            "chantier_id": chantiers[1]["_id"],
            "intervenant_id": intervenants[0]["_id"],  # Électricien
            "date_prevue": (today + timedelta(days=4)).strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=6)).strftime("%Y-%m-%d"),
            "statut": "a_faire",
            "zone": "Étage - Toutes chambres",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": None,
            "historique_validation": [],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-010",
            "ordre": 10,
            "intitule": "Peinture chambres et couloirs",
            "chantier_id": chantiers[1]["_id"],
            "intervenant_id": intervenants[3]["_id"],  # Peintre
            "date_prevue": (today + timedelta(days=10)).strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=14)).strftime("%Y-%m-%d"),
            "statut": "a_faire",
            "zone": "Étage - Chambres et couloirs",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": None,
            "historique_validation": [],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-011",
            "ordre": 11,
            "intitule": "Montage placard sur mesure - Chambre parents",
            "chantier_id": chantiers[1]["_id"],
            "intervenant_id": intervenants[5]["_id"],  # Menuisier
            "date_prevue": (today + timedelta(days=8)).strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=12)).strftime("%Y-%m-%d"),
            "statut": "a_faire",
            "zone": "Étage - Chambre parents",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": None,
            "historique_validation": [],
            "date_creation": today.isoformat()
        },
        {
            "_id": str(uuid.uuid4()),
            "numero": "T-012",
            "ordre": 12,
            "intitule": "Enduit de finition murs salon",
            "chantier_id": chantiers[1]["_id"],
            "intervenant_id": intervenants[2]["_id"],  # Plaquiste
            "date_prevue": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
            "date_limite": (today + timedelta(days=3)).strftime("%Y-%m-%d"),
            "statut": "en_cours",
            "zone": "RDC - Salon",
            "photos_avant": [],
            "photos_apres": [],
            "commentaire_intervenant": None,
            "historique_validation": [],
            "date_creation": today.isoformat()
        }
    ]
    
    taches_collection.insert_many(taches)
    print(f"✅ {len(taches)} tâches créées")
    return taches

def main():
    print("\n" + "="*60)
    print("🚀 SEED DE LA BASE DE DONNÉES - SUIVI CHANTIER O2")
    print("="*60 + "\n")
    
    # Nettoyer
    clear_database()
    
    # Créer les données
    seed_config()
    chantiers = seed_chantiers()
    intervenants = seed_intervenants()
    taches = seed_taches(chantiers, intervenants)
    
    print("\n" + "="*60)
    print("✅ SEED TERMINÉ AVEC SUCCÈS !")
    print("="*60)
    print(f"\n📊 Résumé:")
    print(f"   • Chantiers: {len(chantiers)}")
    print(f"   • Intervenants: {len(intervenants)}")
    print(f"   • Tâches: {len(taches)}")
    print(f"\n🔐 Code PIN admin: 123456")
    print(f"💡 Cliquez 4 fois rapidement sur le logo O2 pour accéder au mode admin\n")

if __name__ == "__main__":
    main()
