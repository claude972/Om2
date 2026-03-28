from fastapi import FastAPI, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import base64
import uuid
from io import BytesIO
from PIL import Image

load_dotenv()

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connexion MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(mongo_url)
db = client[os.environ.get('DATABASE_NAME', 'chantier_db')]

# Collections
chantiers_collection = db['chantiers']
intervenants_collection = db['intervenants']
taches_collection = db['taches']
commentaires_collection = db['commentaires']
config_collection = db['config']

# Models Pydantic
class Chantier(BaseModel):
    id: Optional[str] = None
    nom: str
    adresse: str
    reference: str
    date_debut: Optional[str] = None
    date_fin: Optional[str] = None
    actif: bool = True

class Intervenant(BaseModel):
    id: Optional[str] = None
    nom: str
    prenom: str
    metier: str  # électricien, plombier, plaquiste, peintre, etc.
    telephone: Optional[str] = None
    email: Optional[str] = None
    actif: bool = True

class Photo(BaseModel):
    id: str
    data: str  # base64
    legende: Optional[str] = None
    date_ajout: str
    type: str  # "avant" ou "apres"

class Commentaire(BaseModel):
    id: str
    tache_id: str
    auteur: str  # nom de l'intervenant ou "Admin"
    texte: str
    date: str
    photos: Optional[List[str]] = []  # liste de base64

class HistoriqueValidation(BaseModel):
    date: str
    action: str  # "validee", "refusee", "marquee_terminee"
    auteur: str
    commentaire: Optional[str] = None

class Tache(BaseModel):
    id: Optional[str] = None
    numero: Optional[str] = None  # T-001, T-002, etc. (auto-généré)
    ordre: int = 0
    intitule: str
    chantier_id: str
    intervenant_id: str
    date_prevue: str
    date_limite: str
    statut: str  # "a_faire", "en_cours", "a_valider", "validee", "refusee"
    zone: str
    photos_avant: List[Photo] = []
    photos_apres: List[Photo] = []
    commentaire_intervenant: Optional[str] = None
    historique_validation: List[HistoriqueValidation] = []
    date_creation: Optional[str] = None

class PinVerification(BaseModel):
    pin: str

class ConfigUpdate(BaseModel):
    admin_pin: str

# Initialiser la configuration par défaut
def init_config():
    if config_collection.count_documents({}) == 0:
        config_collection.insert_one({
            "_id": "config",
            "admin_pin": os.environ.get('ADMIN_PIN', '123456'),
            "tentatives_echecs": 0,
            "derniere_tentative": None,
            "bloque_jusqua": None
        })

init_config()

# Helper function pour compresser les images
def compress_image_base64(base64_string: str, max_width: int = 1200) -> str:
    try:
        # Enlever le préfixe data:image si présent
        if 'base64,' in base64_string:
            base64_string = base64_string.split('base64,')[1]
        
        img_data = base64.b64decode(base64_string)
        img = Image.open(BytesIO(img_data))
        
        # Redimensionner si nécessaire
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Convertir en RGB si nécessaire
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Sauvegarder en JPEG avec compression
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85, optimize=True)
        compressed_data = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/jpeg;base64,{compressed_data}"
    except Exception as e:
        # Si erreur, retourner l'image originale
        return base64_string if base64_string.startswith('data:') else f"data:image/jpeg;base64,{base64_string}"

# ========== ENDPOINTS CONFIG ==========
@app.get("/api/config/check-block")
def check_block():
    config = config_collection.find_one({"_id": "config"})
    if config and config.get('bloque_jusqua'):
        bloque_jusqua = datetime.fromisoformat(config['bloque_jusqua'])
        if datetime.now() < bloque_jusqua:
            return {"bloque": True, "jusqu_a": config['bloque_jusqua']}
        else:
            # Débloquer
            config_collection.update_one(
                {"_id": "config"},
                {"$set": {"tentatives_echecs": 0, "bloque_jusqua": None}}
            )
    return {"bloque": False}

@app.post("/api/config/verify-pin")
def verify_pin(data: PinVerification):
    config = config_collection.find_one({"_id": "config"})
    
    # Vérifier si bloqué
    if config.get('bloque_jusqua'):
        bloque_jusqua = datetime.fromisoformat(config['bloque_jusqua'])
        if datetime.now() < bloque_jusqua:
            raise HTTPException(status_code=403, detail="Accès bloqué. Réessayez plus tard.")
        else:
            config_collection.update_one(
                {"_id": "config"},
                {"$set": {"tentatives_echecs": 0, "bloque_jusqua": None}}
            )
            config = config_collection.find_one({"_id": "config"})
    
    if data.pin == config['admin_pin']:
        # Réinitialiser les tentatives
        config_collection.update_one(
            {"_id": "config"},
            {"$set": {"tentatives_echecs": 0}}
        )
        return {"valid": True}
    else:
        # Incrémenter les tentatives
        tentatives = config.get('tentatives_echecs', 0) + 1
        update_data = {"tentatives_echecs": tentatives}
        
        if tentatives >= 3:
            # Bloquer pour 5 minutes
            bloque_jusqua = datetime.now() + timedelta(minutes=5)
            update_data['bloque_jusqua'] = bloque_jusqua.isoformat()
            config_collection.update_one({"_id": "config"}, {"$set": update_data})
            raise HTTPException(status_code=403, detail="Trop de tentatives. Accès bloqué pour 5 minutes.")
        
        config_collection.update_one({"_id": "config"}, {"$set": update_data})
        return {"valid": False, "tentatives_restantes": 3 - tentatives}

@app.put("/api/config/update-pin")
def update_pin(data: ConfigUpdate):
    config_collection.update_one(
        {"_id": "config"},
        {"$set": {"admin_pin": data.admin_pin}}
    )
    return {"success": True}

# ========== ENDPOINTS CHANTIERS ==========
@app.get("/api/chantiers")
def get_chantiers():
    chantiers = list(chantiers_collection.find({"actif": True}))
    for c in chantiers:
        c['id'] = str(c['_id'])
        del c['_id']
    return chantiers

@app.post("/api/chantiers")
def create_chantier(chantier: Chantier):
    chantier_dict = chantier.dict()
    chantier_dict['_id'] = str(uuid.uuid4())
    chantiers_collection.insert_one(chantier_dict)
    chantier_dict['id'] = chantier_dict['_id']
    del chantier_dict['_id']
    return chantier_dict

@app.put("/api/chantiers/{chantier_id}")
def update_chantier(chantier_id: str, chantier: Chantier):
    chantier_dict = chantier.dict(exclude={'id'})
    chantiers_collection.update_one({"_id": chantier_id}, {"$set": chantier_dict})
    return {"success": True}

@app.delete("/api/chantiers/{chantier_id}")
def delete_chantier(chantier_id: str):
    chantiers_collection.update_one({"_id": chantier_id}, {"$set": {"actif": False}})
    return {"success": True}

# ========== ENDPOINTS INTERVENANTS ==========
@app.get("/api/intervenants")
def get_intervenants():
    intervenants = list(intervenants_collection.find({"actif": True}))
    for i in intervenants:
        i['id'] = str(i['_id'])
        del i['_id']
        # Compter les tâches
        total_taches = taches_collection.count_documents({"intervenant_id": i['id']})
        taches_completees = taches_collection.count_documents({
            "intervenant_id": i['id'],
            "statut": "validee"
        })
        i['total_taches'] = total_taches
        i['taches_completees'] = taches_completees
    return intervenants

@app.post("/api/intervenants")
def create_intervenant(intervenant: Intervenant):
    intervenant_dict = intervenant.dict()
    intervenant_dict['_id'] = str(uuid.uuid4())
    intervenants_collection.insert_one(intervenant_dict)
    intervenant_dict['id'] = intervenant_dict['_id']
    del intervenant_dict['_id']
    return intervenant_dict

@app.put("/api/intervenants/{intervenant_id}")
def update_intervenant(intervenant_id: str, intervenant: Intervenant):
    intervenant_dict = intervenant.dict(exclude={'id'})
    intervenants_collection.update_one({"_id": intervenant_id}, {"$set": intervenant_dict})
    return {"success": True}

@app.delete("/api/intervenants/{intervenant_id}")
def delete_intervenant(intervenant_id: str):
    intervenants_collection.update_one({"_id": intervenant_id}, {"$set": {"actif": False}})
    return {"success": True}

# ========== ENDPOINTS TÂCHES ==========
@app.get("/api/taches")
def get_taches(
    chantier_id: Optional[str] = None,
    intervenant_id: Optional[str] = None,
    statut: Optional[str] = None,
    zone: Optional[str] = None,
    recherche: Optional[str] = None
):
    query = {}
    if chantier_id:
        query['chantier_id'] = chantier_id
    if intervenant_id:
        query['intervenant_id'] = intervenant_id
    if statut:
        query['statut'] = statut
    if zone:
        query['zone'] = {'$regex': zone, '$options': 'i'}
    if recherche:
        query['$or'] = [
            {'intitule': {'$regex': recherche, '$options': 'i'}},
            {'numero': {'$regex': recherche, '$options': 'i'}},
            {'zone': {'$regex': recherche, '$options': 'i'}}
        ]
    
    taches = list(taches_collection.find(query).sort('ordre', 1))
    for t in taches:
        t['id'] = str(t['_id'])
        del t['_id']
    return taches

@app.get("/api/taches/{tache_id}")
def get_tache(tache_id: str):
    tache = taches_collection.find_one({"_id": tache_id})
    if not tache:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    tache['id'] = str(tache['_id'])
    del tache['_id']
    return tache

@app.post("/api/taches")
def create_tache(tache: Tache):
    # Générer le numéro de tâche
    count = taches_collection.count_documents({}) + 1
    tache_dict = tache.dict()
    tache_dict['_id'] = str(uuid.uuid4())
    tache_dict['numero'] = f"T-{count:03d}"
    tache_dict['date_creation'] = datetime.now().isoformat()
    if 'ordre' not in tache_dict or tache_dict['ordre'] == 0:
        tache_dict['ordre'] = count
    taches_collection.insert_one(tache_dict)
    tache_dict['id'] = tache_dict['_id']
    del tache_dict['_id']
    return tache_dict

@app.put("/api/taches/{tache_id}")
def update_tache(tache_id: str, tache: Tache):
    tache_dict = tache.dict(exclude={'id', 'numero'})
    taches_collection.update_one({"_id": tache_id}, {"$set": tache_dict})
    return {"success": True}

@app.delete("/api/taches/{tache_id}")
def delete_tache(tache_id: str):
    taches_collection.delete_one({"_id": tache_id})
    return {"success": True}

@app.post("/api/taches/{tache_id}/reorder")
def reorder_tache(tache_id: str, new_order: int = Body(..., embed=True)):
    tache = taches_collection.find_one({"_id": tache_id})
    if not tache:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
    old_order = tache['ordre']
    
    if new_order > old_order:
        # Déplacer vers le bas
        taches_collection.update_many(
            {"ordre": {"$gt": old_order, "$lte": new_order}},
            {"$inc": {"ordre": -1}}
        )
    else:
        # Déplacer vers le haut
        taches_collection.update_many(
            {"ordre": {"$gte": new_order, "$lt": old_order}},
            {"$inc": {"ordre": 1}}
        )
    
    taches_collection.update_one({"_id": tache_id}, {"$set": {"ordre": new_order}})
    return {"success": True}

# Photos
@app.post("/api/taches/{tache_id}/photos")
def add_photo(tache_id: str, photo_data: str = Body(...), photo_type: str = Body(...), legende: str = Body(None)):
    tache = taches_collection.find_one({"_id": tache_id})
    if not tache:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
    # Compresser l'image
    compressed_data = compress_image_base64(photo_data)
    
    photo = {
        "id": str(uuid.uuid4()),
        "data": compressed_data,
        "legende": legende,
        "date_ajout": datetime.now().isoformat(),
        "type": photo_type
    }
    
    field = "photos_avant" if photo_type == "avant" else "photos_apres"
    taches_collection.update_one(
        {"_id": tache_id},
        {"$push": {field: photo}}
    )
    return photo

@app.delete("/api/taches/{tache_id}/photos/{photo_id}")
def delete_photo(tache_id: str, photo_id: str, photo_type: str):
    field = "photos_avant" if photo_type == "avant" else "photos_apres"
    taches_collection.update_one(
        {"_id": tache_id},
        {"$pull": {field: {"id": photo_id}}}
    )
    return {"success": True}

# Validation
@app.post("/api/taches/{tache_id}/marquer-terminee")
def marquer_terminee(tache_id: str, commentaire: str = Body(None)):
    tache = taches_collection.find_one({"_id": tache_id})
    if not tache:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    
    historique_entry = {
        "date": datetime.now().isoformat(),
        "action": "marquee_terminee",
        "auteur": "Intervenant",
        "commentaire": commentaire
    }
    
    taches_collection.update_one(
        {"_id": tache_id},
        {
            "$set": {
                "statut": "a_valider",
                "commentaire_intervenant": commentaire
            },
            "$push": {"historique_validation": historique_entry}
        }
    )
    return {"success": True}

@app.post("/api/taches/{tache_id}/valider")
def valider_tache(tache_id: str, commentaire: str = Body(None)):
    historique_entry = {
        "date": datetime.now().isoformat(),
        "action": "validee",
        "auteur": "Admin",
        "commentaire": commentaire
    }
    
    taches_collection.update_one(
        {"_id": tache_id},
        {
            "$set": {"statut": "validee"},
            "$push": {"historique_validation": historique_entry}
        }
    )
    return {"success": True}

@app.post("/api/taches/{tache_id}/refuser")
def refuser_tache(tache_id: str, commentaire: str = Body(...)):
    if not commentaire:
        raise HTTPException(status_code=400, detail="Un commentaire est obligatoire pour refuser une tâche")
    
    historique_entry = {
        "date": datetime.now().isoformat(),
        "action": "refusee",
        "auteur": "Admin",
        "commentaire": commentaire
    }
    
    taches_collection.update_one(
        {"_id": tache_id},
        {
            "$set": {"statut": "refusee"},
            "$push": {"historique_validation": historique_entry}
        }
    )
    return {"success": True}

# Commentaires
@app.get("/api/taches/{tache_id}/commentaires")
def get_commentaires(tache_id: str):
    commentaires = list(commentaires_collection.find({"tache_id": tache_id}).sort('date', 1))
    for c in commentaires:
        c['id'] = str(c['_id'])
        del c['_id']
    return commentaires

@app.post("/api/taches/{tache_id}/commentaires")
def add_commentaire(tache_id: str, auteur: str = Body(...), texte: str = Body(...), photos: List[str] = Body([])):
    commentaire = {
        "_id": str(uuid.uuid4()),
        "tache_id": tache_id,
        "auteur": auteur,
        "texte": texte,
        "photos": photos,
        "date": datetime.now().isoformat()
    }
    commentaires_collection.insert_one(commentaire)
    commentaire['id'] = commentaire['_id']
    del commentaire['_id']
    return commentaire

# Statistiques
@app.get("/api/statistiques")
def get_statistiques(chantier_id: Optional[str] = None):
    query = {}
    if chantier_id:
        query['chantier_id'] = chantier_id
    
    total_taches = taches_collection.count_documents(query)
    taches_validees = taches_collection.count_documents({**query, "statut": "validee"})
    taches_en_cours = taches_collection.count_documents({**query, "statut": "en_cours"})
    taches_a_faire = taches_collection.count_documents({**query, "statut": "a_faire"})
    taches_a_valider = taches_collection.count_documents({**query, "statut": "a_valider"})
    taches_refusees = taches_collection.count_documents({**query, "statut": "refusee"})
    
    # Tâches en retard
    now = datetime.now().isoformat()
    taches_retard = taches_collection.count_documents({
        **query,
        "date_limite": {"$lt": now},
        "statut": {"$nin": ["validee"]}
    })
    
    progression = (taches_validees / total_taches * 100) if total_taches > 0 else 0
    
    return {
        "total_taches": total_taches,
        "taches_validees": taches_validees,
        "taches_en_cours": taches_en_cours,
        "taches_a_faire": taches_a_faire,
        "taches_a_valider": taches_a_valider,
        "taches_refusees": taches_refusees,
        "taches_retard": taches_retard,
        "progression": round(progression, 1)
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)