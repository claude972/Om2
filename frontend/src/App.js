import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, parseISO, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus, X, Camera, Upload, Check, XCircle, Send, AlertCircle,
  ChevronDown, Search, Filter, Calendar, MapPin, User, Clock,
  CheckCircle, Loader, Eye, Trash2, Edit2, Save, ChevronUp
} from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Fonction pour obtenir les couleurs selon le niveau d'urgence
const getUrgenceColor = (niveau) => {
  const colors = {
    faible: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', label: 'Faible', badge: 'bg-blue-100 text-blue-800' },
    normale: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', label: 'Normale', badge: 'bg-gray-100 text-gray-800' },
    haute: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', label: 'Haute', badge: 'bg-orange-100 text-orange-800' },
    critique: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', label: 'Critique', badge: 'bg-red-100 text-red-800' }
  };
  return colors[niveau] || colors.normale;
};

function App() {
  // États principaux
  const [chantiers, setChantiers] = useState([]);
  const [intervenants, setIntervenants] = useState([]);
  const [taches, setTaches] = useState([]);
  const [selectedChantier, setSelectedChantier] = useState(null);
  const [selectedIntervenant, setSelectedIntervenant] = useState(null);
  const [selectedTache, setSelectedTache] = useState(null);
  const [statistiques, setStatistiques] = useState(null);
  
  // États admin
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [adminTimeout, setAdminTimeout] = useState(null);
  
  // États UI
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewIntervenantModal, setShowNewIntervenantModal] = useState(false);
  const [showNewChantierModal, setShowNewChantierModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  
  // Refs
  const pinInputRefs = useRef([]);
  const logoClickTimer = useRef(null);
  const activityTimer = useRef(null);

  // Charger les données initiales
  useEffect(() => {
    loadData();
    checkBlock();
  }, []);

  useEffect(() => {
    if (selectedChantier) {
      loadStatistiques(selectedChantier.id);
      loadTaches();
    }
  }, [selectedChantier, selectedIntervenant, statusFilter, searchQuery]);

  // Timer d'inactivité admin
  useEffect(() => {
    if (isAdminMode) {
      resetActivityTimer();
      window.addEventListener('mousemove', resetActivityTimer);
      window.addEventListener('keypress', resetActivityTimer);
      window.addEventListener('click', resetActivityTimer);
      
      return () => {
        window.removeEventListener('mousemove', resetActivityTimer);
        window.removeEventListener('keypress', resetActivityTimer);
        window.removeEventListener('click', resetActivityTimer);
        if (activityTimer.current) clearTimeout(activityTimer.current);
      };
    }
  }, [isAdminMode]);

  const resetActivityTimer = () => {
    if (activityTimer.current) clearTimeout(activityTimer.current);
    activityTimer.current = setTimeout(() => {
      setIsAdminMode(false);
      alert('Mode admin désactivé après 10 minutes d\'inactivité');
    }, 10 * 60 * 1000); // 10 minutes
  };

  const checkBlock = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/config/check-block`);
      setIsBlocked(response.data.bloque);
    } catch (error) {
      console.error('Erreur vérification blocage:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [chantiersRes, intervenantsRes] = await Promise.all([
        axios.get(`${API_URL}/api/chantiers`),
        axios.get(`${API_URL}/api/intervenants`)
      ]);
      
      setChantiers(chantiersRes.data);
      setIntervenants(intervenantsRes.data);
      
      if (chantiersRes.data.length > 0 && !selectedChantier) {
        setSelectedChantier(chantiersRes.data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTaches = async () => {
    if (!selectedChantier) return;
    
    try {
      const params = {
        chantier_id: selectedChantier.id,
        ...(selectedIntervenant && { intervenant_id: selectedIntervenant.id }),
        ...(statusFilter && { statut: statusFilter }),
        ...(searchQuery && { recherche: searchQuery })
      };
      
      const response = await axios.get(`${API_URL}/api/taches`, { params });
      setTaches(response.data);
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    }
  };

  const loadStatistiques = async (chantierId) => {
    try {
      const response = await axios.get(`${API_URL}/api/statistiques`, {
        params: { chantier_id: chantierId }
      });
      setStatistiques(response.data);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  // Gestion du logo cliquable (4 clics rapides)
  const handleLogoClick = () => {
    if (isBlocked) {
      alert('Accès bloqué temporairement. Réessayez plus tard.');
      return;
    }

    if (isAdminMode) return;

    setClickCount(prev => prev + 1);

    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);

    logoClickTimer.current = setTimeout(() => {
      setClickCount(0);
    }, 2000);

    if (clickCount + 1 === 4) {
      setClickCount(0);
      setShowPinModal(true);
      setTimeout(() => {
        if (pinInputRefs.current[0]) {
          pinInputRefs.current[0].focus();
        }
      }, 100);
    }
  };

  // Gestion du PIN
  const handlePinChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pinValue];
    newPin[index] = value;
    setPinValue(newPin);

    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value) {
      verifyPin(newPin.join(''));
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinValue[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = async (pin) => {
    try {
      const response = await axios.post(`${API_URL}/api/config/verify-pin`, { pin });
      
      if (response.data.valid) {
        setIsAdminMode(true);
        setShowPinModal(false);
        setPinValue(['', '', '', '', '', '']);
        setPinError('');
      } else {
        setPinError(`Code incorrect. ${response.data.tentatives_restantes} tentatives restantes.`);
        setPinValue(['', '', '', '', '', '']);
        pinInputRefs.current[0]?.focus();
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setPinError(error.response.data.detail);
        setShowPinModal(false);
        setIsBlocked(true);
        setPinValue(['', '', '', '', '', '']);
      } else {
        setPinError('Erreur de vérification');
      }
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setPinValue(['', '', '', '', '', '']);
    setPinError('');
  };

  // Fonctions de suppression (mode admin uniquement)
  const handleDeleteTache = async (tacheId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/taches/${tacheId}`);
      alert('Tâche supprimée avec succès');
      loadTaches();
      if (selectedChantier) loadStatistiques(selectedChantier.id);
      setShowTaskModal(false);
      setSelectedTache(null);
    } catch (error) {
      console.error('Erreur suppression tâche:', error);
      alert('Erreur lors de la suppression de la tâche');
    }
  };

  const handleDeleteIntervenant = async (intervenantId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet intervenant ? Toutes ses tâches assignées devront être réassignées.')) return;
    
    try {
      await axios.delete(`${API_URL}/api/intervenants/${intervenantId}`);
      alert('Intervenant supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Erreur suppression intervenant:', error);
      alert('Erreur lors de la suppression de l\'intervenant');
    }
  };

  const handleDeleteChantier = async (chantierId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce chantier ? Toutes les tâches associées seront également supprimées.')) return;
    
    try {
      await axios.delete(`${API_URL}/api/chantiers/${chantierId}`);
      alert('Chantier supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Erreur suppression chantier:', error);
      alert('Erreur lors de la suppression du chantier');
    }
  };

  // Rendu des badges de statut
  const renderStatusBadge = (statut) => {
    const badges = {
      a_faire: { label: 'À faire', class: 'badge-a-faire' },
      en_cours: { label: 'En cours', class: 'badge-en-cours' },
      a_valider: { label: 'À valider', class: 'badge-a-valider' },
      validee: { label: 'Validée', class: 'badge-validee' },
      refusee: { label: 'Refusée', class: 'badge-refusee' }
    };
    
    const badge = badges[statut] || badges.a_faire;
    return <span className={`badge ${badge.class}`} data-testid={`badge-${statut}`}>{badge.label}</span>;
  };

  // Vérifier si une tâche est en retard
  const isTaskLate = (tache) => {
    if (tache.statut === 'validee') return false;
    try {
      return isBefore(parseISO(tache.date_limite), new Date());
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bandeau mode admin */}
      {isAdminMode && (
        <div className="admin-banner" data-testid="admin-banner">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span>🔒 MODE ADMINISTRATEUR ACTIVÉ</span>
            <button
              onClick={() => setIsAdminMode(false)}
              className="text-white underline text-sm"
              data-testid="quit-admin-btn"
            >
              Quitter
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* Logo cliquable (secret admin) */}
            <img
              src="/logo.png"
              alt="Logo O2"
              className="h-16 cursor-pointer select-none"
              onClick={handleLogoClick}
              data-testid="logo-btn"
              draggable={false}
            />
            
            {/* Compteur de progression */}
            {statistiques && (
              <div className="text-right" data-testid="progress-counter">
                <div className="text-2xl font-bold text-primary">
                  {statistiques.progression}%
                </div>
                <div className="text-xs text-gray-500">Progression</div>
              </div>
            )}
          </div>

          {/* Sélecteurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Sélecteur de chantier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chantier
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedChantier?.id || ''}
                  onChange={(e) => {
                    const chantier = chantiers.find(c => c.id === e.target.value);
                    setSelectedChantier(chantier);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="chantier-selector"
                >
                  {chantiers.map(chantier => (
                    <option key={chantier.id} value={chantier.id}>
                      {chantier.nom} - {chantier.reference}
                    </option>
                  ))}
                </select>
                {isAdminMode && (
                  <>
                    <button
                      onClick={() => setShowNewChantierModal(true)}
                      className="px-3 py-3 bg-secondary text-white rounded-lg hover:bg-orange-600 flex items-center justify-center"
                      data-testid="add-chantier-btn"
                      title="Ajouter un chantier"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    {selectedChantier && (
                      <button
                        onClick={() => handleDeleteChantier(selectedChantier.id)}
                        className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center"
                        data-testid="delete-chantier-btn"
                        title="Supprimer le chantier"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sélecteur de date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="date-filter"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Liste des intervenants */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Intervenants</h2>
            {isAdminMode && (
              <button
                onClick={() => setShowNewIntervenantModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-secondary text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                data-testid="add-intervenant-btn"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" data-testid="intervenants-list">
            {/* Carte "Tous" */}
            <div
              onClick={() => setSelectedIntervenant(null)}
              className={`intervenant-card flex-shrink-0 p-4 border-2 rounded-lg cursor-pointer ${
                !selectedIntervenant ? 'selected' : 'border-gray-200 bg-white'
              }`}
              data-testid="intervenant-card-tous"
            >
              <div className="font-semibold text-gray-900">Tous</div>
              <div className="text-xs text-gray-500 mt-1">
                {intervenants.length} intervenants
              </div>
            </div>

            {intervenants.map(intervenant => {
              const progression = intervenant.total_taches > 0
                ? (intervenant.taches_completees / intervenant.total_taches) * 100
                : 0;
              
              return (
                <div
                  key={intervenant.id}
                  className={`intervenant-card flex-shrink-0 p-4 border-2 rounded-lg relative ${
                    selectedIntervenant?.id === intervenant.id ? 'selected' : 'border-gray-200 bg-white'
                  }`}
                  data-testid={`intervenant-card-${intervenant.id}`}
                >
                  {/* Bouton de suppression en mode admin */}
                  {isAdminMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIntervenant(intervenant.id);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-10"
                      data-testid={`delete-intervenant-${intervenant.id}`}
                      title="Supprimer l'intervenant"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  
                  <div 
                    onClick={() => setSelectedIntervenant(intervenant)}
                    className="cursor-pointer"
                  >
                    <div className="font-semibold text-gray-900">
                      {intervenant.prenom} {intervenant.nom}
                    </div>
                    <div className="text-xs text-secondary font-medium mt-1">
                      {intervenant.metier}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {intervenant.taches_completees} / {intervenant.total_taches} tâches
                    </div>
                    <div className="progress-bar mt-2">
                      <div className="progress-fill" style={{ width: `${progression}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Barre de recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="search-input"
              />
            </div>
          </div>

          {/* Filtre par statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            data-testid="status-filter"
          >
            <option value="">Tous les statuts</option>
            <option value="a_faire">À faire</option>
            <option value="en_cours">En cours</option>
            <option value="a_valider">À valider</option>
            <option value="validee">Validée</option>
            <option value="refusee">Refusée</option>
          </select>
        </div>
      </div>

      {/* Liste des tâches */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        {taches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucune tâche trouvée</p>
            {isAdminMode && (
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-900"
                data-testid="create-first-task-btn"
              >
                Créer la première tâche
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4" data-testid="taches-list">
            {taches.map(tache => {
              const intervenant = intervenants.find(i => i.id === tache.intervenant_id);
              const isLate = isTaskLate(tache);
              const urgenceColors = getUrgenceColor(tache.niveau_urgence || 'normale');
              
              // Récupérer la première photo disponible (avant ou après)
              const firstPhoto = tache.photos_avant.length > 0 
                ? tache.photos_avant[0] 
                : tache.photos_apres.length > 0 
                  ? tache.photos_apres[0] 
                  : null;
              
              return (
                <div
                  key={tache.id}
                  onClick={() => {
                    setSelectedTache(tache);
                    setShowTaskModal(true);
                  }}
                  className={`task-card p-4 rounded-lg border-2 cursor-pointer ${urgenceColors.bg} ${urgenceColors.border}`}
                  data-testid={`task-card-${tache.numero}`}
                >
                  <div className="flex gap-4">
                    {/* Photo miniature à gauche */}
                    {firstPhoto ? (
                      <div className="flex-shrink-0">
                        <img
                          src={firstPhoto.data}
                          alt="Aperçu tâche"
                          className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* Contenu de la carte */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-bold text-primary">{tache.numero}</span>
                          {renderStatusBadge(tache.statut)}
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${urgenceColors.badge}`}>
                            {urgenceColors.label.toUpperCase()}
                          </span>
                          {isLate && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                              EN RETARD
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2 truncate">{tache.intitule}</h3>

                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="truncate">{intervenant ? `${intervenant.prenom} ${intervenant.nom}` : 'Non assigné'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{tache.zone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(parseISO(tache.date_prevue), 'dd/MM/yyyy')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-500" />
                          Limite: {format(parseISO(tache.date_limite), 'dd/MM/yyyy')}
                        </div>
                      </div>

                      {tache.photos_avant.length > 0 || tache.photos_apres.length > 0 ? (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <Camera className="w-3 h-3" />
                          {tache.photos_avant.length} avant, {tache.photos_apres.length} après
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Aucune photo - À compléter
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bouton flottant admin */}
      {isAdminMode && (
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="floating-btn"
          data-testid="floating-add-btn"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modal PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={closePinModal}>
          <div
            className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 fade-in"
            onClick={(e) => e.stopPropagation()}
            data-testid="pin-modal"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Code d'accès</h3>
            </div>

            <div className="flex justify-center gap-2 mb-4">
              {pinValue.map((digit, index) => (
                <input
                  key={index}
                  ref={el => pinInputRefs.current[index] = el}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  className="pin-input"
                  data-testid={`pin-input-${index}`}
                />
              ))}
            </div>

            {pinError && (
              <div className="text-center text-red-600 text-sm mb-4" data-testid="pin-error">
                {pinError}
              </div>
            )}

            <button
              onClick={closePinModal}
              className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              data-testid="cancel-pin-btn"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Modal détail tâche */}
      {showTaskModal && selectedTache && (
        <TaskDetailModal
          tache={selectedTache}
          intervenant={intervenants.find(i => i.id === selectedTache.intervenant_id)}
          isAdminMode={isAdminMode}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTache(null);
            loadTaches();
            loadData();
          }}
          apiUrl={API_URL}
        />
      )}

      {/* Modal nouvelle tâche */}
      {showNewTaskModal && (
        <NewTaskModal
          chantiers={chantiers}
          intervenants={intervenants}
          selectedChantier={selectedChantier}
          onClose={() => setShowNewTaskModal(false)}
          onSuccess={() => {
            setShowNewTaskModal(false);
            loadTaches();
          }}
          apiUrl={API_URL}
        />
      )}

      {/* Modal nouvel intervenant */}
      {showNewIntervenantModal && (
        <NewIntervenantModal
          onClose={() => setShowNewIntervenantModal(false)}
          onSuccess={() => {
            setShowNewIntervenantModal(false);
            loadData();
          }}
          apiUrl={API_URL}
        />
      )}

      {/* Modal nouveau chantier */}
      {showNewChantierModal && (
        <NewChantierModal
          onClose={() => setShowNewChantierModal(false)}
          onSuccess={() => {
            setShowNewChantierModal(false);
            loadData();
          }}
          apiUrl={API_URL}
        />
      )}
    </div>
  );
}

// Composant Modal Détail Tâche
function TaskDetailModal({ tache, intervenant, isAdminMode, onClose, apiUrl }) {
  const [currentTache, setCurrentTache] = useState(tache);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [commentaireValidation, setCommentaireValidation] = useState('');
  const [showFullImage, setShowFullImage] = useState(null);

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const base64 = event.target.result;
        await axios.post(`${apiUrl}/api/taches/${currentTache.id}/photos`, {
          photo_data: base64,
          photo_type: type,
          legende: ''
        });
        
        const response = await axios.get(`${apiUrl}/api/taches/${currentTache.id}`);
        setCurrentTache(response.data);
      } catch (error) {
        console.error('Erreur upload photo:', error);
        alert('Erreur lors de l\'upload de la photo');
      } finally {
        setUploadingPhoto(false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleMarquerTerminee = async () => {
    try {
      await axios.post(`${apiUrl}/api/taches/${currentTache.id}/marquer-terminee`, {
        commentaire
      });
      
      const response = await axios.get(`${apiUrl}/api/taches/${currentTache.id}`);
      setCurrentTache(response.data);
      setCommentaire('');
      alert('Tâche marquée comme terminée !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    }
  };

  const handleValider = async () => {
    try {
      await axios.post(`${apiUrl}/api/taches/${currentTache.id}/valider`, {
        commentaire: commentaireValidation
      });
      
      const response = await axios.get(`${apiUrl}/api/taches/${currentTache.id}`);
      setCurrentTache(response.data);
      setCommentaireValidation('');
      alert('Tâche validée !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    }
  };

  const handleRefuser = async () => {
    if (!commentaireValidation.trim()) {
      alert('Veuillez saisir un commentaire pour refuser la tâche');
      return;
    }

    try {
      await axios.post(`${apiUrl}/api/taches/${currentTache.id}/refuser`, {
        commentaire: commentaireValidation
      });
      
      const response = await axios.get(`${apiUrl}/api/taches/${currentTache.id}`);
      setCurrentTache(response.data);
      setCommentaireValidation('');
      alert('Tâche refusée');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du refus');
    }
  };

  const handleDeletePhoto = async (photoId, type) => {
    if (!window.confirm('Supprimer cette photo ?')) return;

    try {
      await axios.delete(
        `${apiUrl}/api/taches/${currentTache.id}/photos/${photoId}?photo_type=${type}`
      );
      
      const response = await axios.get(`${apiUrl}/api/taches/${currentTache.id}`);
      setCurrentTache(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    
    try {
      await axios.delete(`${apiUrl}/api/taches/${currentTache.id}`);
      alert('Tâche supprimée avec succès');
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const urgenceColors = getUrgenceColor(currentTache.niveau_urgence || 'normale');

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto modal-backdrop" onClick={onClose}>
        <div className="min-h-screen px-4 py-8">
          <div
            className="bg-white rounded-lg max-w-3xl mx-auto fade-in"
            onClick={(e) => e.stopPropagation()}
            data-testid="task-detail-modal"
          >
            {/* Header */}
            <div className="bg-primary text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{currentTache.numero}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${urgenceColors.badge}`}>
                      {urgenceColors.label.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">{currentTache.intitule}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdminMode && (
                    <button
                      onClick={handleDeleteTask}
                      className="text-white hover:bg-red-600 p-2 rounded-full bg-red-500"
                      data-testid="delete-task-btn"
                      title="Supprimer la tâche"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="text-white hover:bg-blue-800 p-2 rounded-full"
                    data-testid="close-modal-btn"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-gray-600">Intervenant</label>
                  <p className="font-semibold">
                    {intervenant ? `${intervenant.prenom} ${intervenant.nom}` : 'Non assigné'}
                  </p>
                  {intervenant && (
                    <p className="text-sm text-secondary">{intervenant.metier}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-600">Statut</label>
                  <div className="mt-1">
                    {renderStatusBadge(currentTache.statut)}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Niveau d'urgence</label>
                  <div className="mt-1">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${urgenceColors.badge}`}>
                      {urgenceColors.label.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Zone</label>
                  <p className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {currentTache.zone}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date prévue</label>
                  <p className="font-semibold">
                    {format(parseISO(currentTache.date_prevue), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date limite</label>
                  <p className="font-semibold text-red-600">
                    {format(parseISO(currentTache.date_limite), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              {/* Photos AVANT */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Photos AVANT</h3>
                <div className="photo-grid">
                  {currentTache.photos_avant.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.data}
                        alt="Avant"
                        className="w-full h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => setShowFullImage(photo.data)}
                      />
                      {isAdminMode && (
                        <button
                          onClick={() => handleDeletePhoto(photo.id, 'avant')}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {(isAdminMode || currentTache.intervenant_id) && (
                    <label className="upload-zone h-32 flex flex-col items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'avant')}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                      {uploadingPhoto ? (
                        <Loader className="w-6 h-6 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Ajouter</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Photos APRÈS */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Photos APRÈS</h3>
                <div className="photo-grid">
                  {currentTache.photos_apres.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.data}
                        alt="Après"
                        className="w-full h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => setShowFullImage(photo.data)}
                      />
                      {isAdminMode && (
                        <button
                          onClick={() => handleDeletePhoto(photo.id, 'apres')}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {currentTache.intervenant_id && (
                    <label className="upload-zone h-32 flex flex-col items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'apres')}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                      {uploadingPhoto ? (
                        <Loader className="w-6 h-6 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Ajouter</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Commentaire intervenant */}
              {currentTache.commentaire_intervenant && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Commentaire de l'intervenant</h4>
                  <p className="text-gray-700">{currentTache.commentaire_intervenant}</p>
                </div>
              )}

              {/* Actions intervenant */}
              {currentTache.statut !== 'validee' && currentTache.statut !== 'a_valider' && !isAdminMode && (
                <div className="mb-6 border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Marquer comme terminée</h4>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Commentaire (optionnel)..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    data-testid="commentaire-intervenant-input"
                  />
                  <button
                    onClick={handleMarquerTerminee}
                    className="mt-3 w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    data-testid="marquer-terminee-btn"
                  >
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                    Marquer comme terminée
                  </button>
                </div>
              )}

              {/* Actions admin validation */}
              {isAdminMode && currentTache.statut === 'a_valider' && (
                <div className="mb-6 border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Validation admin</h4>
                  <textarea
                    value={commentaireValidation}
                    onChange={(e) => setCommentaireValidation(e.target.value)}
                    placeholder="Commentaire (obligatoire pour refuser)..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    data-testid="commentaire-validation-input"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button
                      onClick={handleValider}
                      className="py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      data-testid="valider-tache-btn"
                    >
                      <Check className="w-5 h-5 inline mr-2" />
                      Valider
                    </button>
                    <button
                      onClick={handleRefuser}
                      className="py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                      data-testid="refuser-tache-btn"
                    >
                      <XCircle className="w-5 h-5 inline mr-2" />
                      Refuser
                    </button>
                  </div>
                </div>
              )}

              {/* Historique validation */}
              {currentTache.historique_validation.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Historique</h4>
                  <div className="space-y-3">
                    {currentTache.historique_validation.map((entry, index) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0">
                          {entry.action === 'validee' && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {entry.action === 'refusee' && <XCircle className="w-5 h-5 text-red-600" />}
                          {entry.action === 'marquee_terminee' && <Clock className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {entry.action === 'validee' && 'Tâche validée'}
                            {entry.action === 'refusee' && 'Tâche refusée'}
                            {entry.action === 'marquee_terminee' && 'Marquée terminée'}
                          </div>
                          <div className="text-gray-600">
                            Par {entry.auteur} • {format(parseISO(entry.date), 'dd/MM/yyyy HH:mm')}
                          </div>
                          {entry.commentaire && (
                            <div className="mt-1 text-gray-700 italic">"{entry.commentaire}"</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal image plein écran */}
      {showFullImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setShowFullImage(null)}
        >
          <img
            src={showFullImage}
            alt="Plein écran"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setShowFullImage(null)}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 p-2 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}

// Composant Modal Nouvelle Tâche
function NewTaskModal({ chantiers, intervenants, selectedChantier, onClose, onSuccess, apiUrl }) {
  const [formData, setFormData] = useState({
    intitule: '',
    chantier_id: selectedChantier?.id || '',
    intervenant_id: '',
    date_prevue: format(new Date(), 'yyyy-MM-dd'),
    date_limite: format(new Date(), 'yyyy-MM-dd'),
    statut: 'a_faire',
    niveau_urgence: 'normale',
    zone: '',
    ordre: 0
  });

  const [photosAvant, setPhotosAvant] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotosAvant(prev => [...prev, {
          id: Date.now() + Math.random(),
          data: event.target.result,
          legende: ''
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (photoId) => {
    setPhotosAvant(prev => prev.filter(p => p.id !== photoId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Créer la tâche
      const response = await axios.post(`${apiUrl}/api/taches`, formData);
      const tacheId = response.data.id;

      // Uploader les photos si présentes
      if (photosAvant.length > 0) {
        setUploadingPhoto(true);
        for (const photo of photosAvant) {
          try {
            await axios.post(`${apiUrl}/api/taches/${tacheId}/photos`, {
              photo_data: photo.data,
              photo_type: 'avant',
              legende: photo.legende || ''
            });
          } catch (photoError) {
            console.error('Erreur upload photo:', photoError);
          }
        }
        setUploadingPhoto(false);
      }

      alert(`Tâche créée avec succès ! ${photosAvant.length} photo(s) ajoutée(s).`);
      onSuccess();
    } catch (error) {
      console.error('Erreur création tâche:', error);
      alert('Erreur lors de la création de la tâche');
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-backdrop" onClick={onClose}>
      <div className="min-h-screen px-4 py-8">
        <div
          className="bg-white rounded-lg max-w-2xl mx-auto fade-in"
          onClick={(e) => e.stopPropagation()}
          data-testid="new-task-modal"
        >
          <div className="bg-primary text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouvelle tâche</h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-blue-800 p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intitulé de la tâche *
                </label>
                <input
                  type="text"
                  required
                  value={formData.intitule}
                  onChange={(e) => setFormData({ ...formData, intitule: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: Pose des prises RJ45 - Bureau 3"
                  data-testid="intitule-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chantier *
                </label>
                <select
                  required
                  value={formData.chantier_id}
                  onChange={(e) => setFormData({ ...formData, chantier_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="chantier-select"
                >
                  <option value="">Sélectionner un chantier</option>
                  {chantiers.map(c => (
                    <option key={c.id} value={c.id}>{c.nom} - {c.reference}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intervenant *
                </label>
                <select
                  required
                  value={formData.intervenant_id}
                  onChange={(e) => setFormData({ ...formData, intervenant_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="intervenant-select"
                >
                  <option value="">Sélectionner un intervenant</option>
                  {intervenants.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.prenom} {i.nom} - {i.metier}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone / Localisation *
                </label>
                <input
                  type="text"
                  required
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: RDC - Salle de bain 2"
                  data-testid="zone-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date prévue *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_prevue}
                    onChange={(e) => setFormData({ ...formData, date_prevue: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    data-testid="date-prevue-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date limite *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_limite}
                    onChange={(e) => setFormData({ ...formData, date_limite: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    data-testid="date-limite-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut *
                </label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="statut-select"
                >
                  <option value="a_faire">À faire</option>
                  <option value="en_cours">En cours</option>
                  <option value="a_valider">À valider</option>
                  <option value="validee">Validée</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau d'urgence *
                </label>
                <select
                  value={formData.niveau_urgence}
                  onChange={(e) => setFormData({ ...formData, niveau_urgence: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="niveau-urgence-select"
                >
                  <option value="faible">🔵 Faible</option>
                  <option value="normale">⚪ Normale</option>
                  <option value="haute">🟠 Haute</option>
                  <option value="critique">🔴 Critique</option>
                </select>
              </div>

              {/* Section upload photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos AVANT (recommandé)
                </label>
                
                {/* Miniatures des photos */}
                {photosAvant.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {photosAvant.map(photo => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.data}
                          alt="Aperçu"
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Zone d'upload */}
                <label className="upload-zone cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center py-6">
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 font-medium">
                      Cliquer pour ajouter des photos
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Plusieurs photos possibles
                    </span>
                  </div>
                </label>
                
                <p className="text-xs text-gray-500 mt-2">
                  💡 Ajoutez des photos pour documenter l'état initial et faciliter la compréhension du travail à réaliser.
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Conseil :</strong> Ajouter des photos dès la création améliore la qualité du suivi et facilite le travail des intervenants.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={uploadingPhoto}
                className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="create-task-submit-btn"
              >
                {uploadingPhoto ? 'Upload en cours...' : 'Créer la tâche'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Composant Modal Nouvel Intervenant
function NewIntervenantModal({ onClose, onSuccess, apiUrl }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    metier: '',
    telephone: '',
    email: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${apiUrl}/api/intervenants`, formData);
      alert('Intervenant créé avec succès !');
      onSuccess();
    } catch (error) {
      console.error('Erreur création intervenant:', error);
      alert('Erreur lors de la création de l\'intervenant');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-backdrop" onClick={onClose}>
      <div className="min-h-screen px-4 py-8">
        <div
          className="bg-white rounded-lg max-w-lg mx-auto fade-in"
          onClick={(e) => e.stopPropagation()}
          data-testid="new-intervenant-modal"
        >
          <div className="bg-secondary text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouvel intervenant</h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-orange-600 p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="Jean"
                    data-testid="prenom-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="Dupont"
                    data-testid="nom-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Métier *
                </label>
                <input
                  type="text"
                  required
                  value={formData.metier}
                  onChange={(e) => setFormData({ ...formData, metier: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="Électricien, Plombier, Peintre..."
                  data-testid="metier-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="06 12 34 56 78"
                  data-testid="telephone-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="intervenant@email.fr"
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-orange-600"
                data-testid="create-intervenant-submit-btn"
              >
                Créer l'intervenant
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Composant Modal Nouveau Chantier
function NewChantierModal({ onClose, onSuccess, apiUrl }) {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    reference: '',
    date_debut: format(new Date(), 'yyyy-MM-dd'),
    date_fin: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${apiUrl}/api/chantiers`, formData);
      alert('Chantier créé avec succès !');
      onSuccess();
    } catch (error) {
      console.error('Erreur création chantier:', error);
      alert('Erreur lors de la création du chantier');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-backdrop" onClick={onClose}>
      <div className="min-h-screen px-4 py-8">
        <div
          className="bg-white rounded-lg max-w-lg mx-auto fade-in"
          onClick={(e) => e.stopPropagation()}
          data-testid="new-chantier-modal"
        >
          <div className="bg-secondary text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouveau chantier</h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-orange-600 p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du chantier *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="Ex: Rénovation Immeuble Centre-Ville"
                  data-testid="nom-chantier-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <input
                  type="text"
                  required
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="Ex: 45 Rue de la République, 75001 Paris"
                  data-testid="adresse-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence *
                </label>
                <input
                  type="text"
                  required
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="Ex: CHANT-2024-001"
                  data-testid="reference-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    data-testid="date-debut-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin estimée
                  </label>
                  <input
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    data-testid="date-fin-input"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-orange-600"
                data-testid="create-chantier-submit-btn"
              >
                Créer le chantier
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper function pour le badge
function renderStatusBadge(statut) {
  const badges = {
    a_faire: { label: 'À faire', class: 'badge-a-faire' },
    en_cours: { label: 'En cours', class: 'badge-en-cours' },
    a_valider: { label: 'À valider', class: 'badge-a-valider' },
    validee: { label: 'Validée', class: 'badge-validee' },
    refusee: { label: 'Refusée', class: 'badge-refusee' }
  };
  
  const badge = badges[statut] || badges.a_faire;
  return <span className={`badge ${badge.class}`}>{badge.label}</span>;
}

export default App;
