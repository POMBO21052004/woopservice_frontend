import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Container, Row, Col, Card, Button, Form, Modal, Badge, 
  ListGroup, InputGroup, Image, Dropdown, Alert, Spinner,
  Toast, ToastContainer, OverlayTrigger, Tooltip, Table
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import FeatherIcon from "../../components/FeatherIcon";
import api from "../../services/api";

export default function ChatFormateur() {
  const [loading, setLoading] = useState(true);
  const [realTimeLoading, setRealTimeLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  
  // États des données
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversationStats, setConversationStats] = useState({});
  
  // États de l'interface
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // États des modales
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  
  // États des fichiers
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  
  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // Filtres de recherche
  const [roleFilter, setRoleFilter] = useState('');
  const [classroomFilter, setClassroomFilter] = useState('');
  
  // Références
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesIntervalRef = useRef(null);

  // Gestion du thème
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute("data-theme") || "light";
      setTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Actualisation automatique des messages toutes les 15 secondes
  useEffect(() => {
    if (selectedConversation) {
      // Nettoyer l'ancien intervalle
      if (messagesIntervalRef.current) {
        clearInterval(messagesIntervalRef.current);
      }

      // Créer un nouvel intervalle
      messagesIntervalRef.current = setInterval(() => {
        fetchMessages(selectedConversation.matricule, 1, true); // true = silencieux (pas de loader)
      }, 15000);
    }

    return () => {
      if (messagesIntervalRef.current) {
        clearInterval(messagesIntervalRef.current);
      }
    };
  }, [selectedConversation]);

  // Scroll automatique vers le bas
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  useEffect(() => {
    feather.replace();
  }, [conversations, messages, searchResults, showSearch, searchResults, searchTerm, editingMessage, replyingTo, messageText, selectedConversation, currentUser, conversationStats, showParticipantsModal]);

  // Afficher les notifications
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Charger les conversations
  const fetchConversations = useCallback(async () => {
    try {
      setRealTimeLoading(true);
      const response = await api.get('/formateur/chat/conversations');
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      showToastMessage('Erreur lors du chargement des conversations', 'danger');
    } finally {
      setRealTimeLoading(false);
    }
  }, []);

  // Charger les messages d'une conversation
  const fetchMessages = useCallback(async (conversationMatricule, page = 1, silent = false) => {
    try {
      const response = await api.get(`/formateur/chat/conversations/${conversationMatricule}/messages`, {
        params: { page, limit: 50 }
      });
      
      if (page === 1) {
        setMessages(response.data.messages || []);
        setSelectedParticipants(response.data.participants);
      } else {
        setMessages(prev => [...response.data.messages, ...prev]);
      }
    } catch (err) {
      console.error('Erreur chargement messages:', err);
      if (!silent) {
        showToastMessage('Erreur lors du chargement des messages', 'danger');
      }
    }
  }, []);

  // Rechercher des utilisateurs avec filtres avancés
  const searchUsers = useCallback(async (search, roleFilterParam = '', classroomFilterParam = '') => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get('/formateur/chat/users/search', {
        params: { 
          search, 
          limit: 50,
          role_filter: roleFilterParam,
          classroom_filter: classroomFilterParam
        }
      });
      setSearchResults(response.data.users || []);
    } catch (err) {
      console.error('Erreur recherche utilisateurs:', err);
      showToastMessage('Erreur lors de la recherche', 'danger');
    }
  }, []);

  // Démarrer une nouvelle conversation
  const startConversation = async (participants) => {
    try {
      const response = await api.post('/formateur/chat/conversations/start', {
        participants: participants
      });
      
      await fetchConversations();
      setSelectedConversation(response.data.conversation);
      setShowNewChatModal(false);
      setSelectedParticipants(response.data.participants);
      showToastMessage(response.data.message, 'success');
    } catch (err) {
      console.error('Erreur démarrage conversation:', err);
      showToastMessage('Erreur lors du démarrage de la conversation', 'danger');
    }
  };

  // Envoyer un message
  const sendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;
    if (!selectedConversation) return;

    try {
      const formData = new FormData();
      formData.append('matricule_conversation', selectedConversation.matricule);
      
      if (messageText.trim()) {
        formData.append('contenu', messageText.trim());
      }
      
      if (replyingTo) {
        formData.append('matricule_message_parent', replyingTo.matricule);
      }
      
      selectedFiles.forEach(file => {
        formData.append('fichiers_joints[]', file);
      });

      if (editingMessage) {
        await api.put(`/formateur/chat/messages/${editingMessage.matricule}/edit`, {
          contenu: messageText.trim()
        });
        setEditingMessage(null);
      } else {
        await api.post('/formateur/chat/messages/send', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setMessageText("");
      setSelectedFiles([]);
      setReplyingTo(null);
      await fetchMessages(selectedConversation.matricule);
      await fetchConversations();
      
    } catch (err) {
      console.error('Erreur envoi message:', err);
      showToastMessage('Erreur lors de l\'envoi du message', 'danger');
    }
  };

  // Supprimer un message (privilège formateur)
  const deleteMessage = async (messageMatricule) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.')) return;
    
    try {
      await api.delete(`/formateur/chat/messages/${messageMatricule}`);
      await fetchMessages(selectedConversation.matricule);
      showToastMessage('Message supprimé avec succès', 'success');
    } catch (err) {
      console.error('Erreur suppression message:', err);
      showToastMessage('Erreur lors de la suppression', 'danger');
    }
  };

  // Épingler/désépingler un message
  const togglePinMessage = async (messageMatricule) => {
    try {
      await api.put(`/formateur/chat/messages/${messageMatricule}/toggle-pin`);
      await fetchMessages(selectedConversation.matricule);
      showToastMessage('Message épinglé/désépinglé', 'success');
    } catch (err) {
      console.error('Erreur épinglage message:', err);
      showToastMessage('Erreur lors de l\'épinglage', 'danger');
    }
  };

  // Ajouter des participants à une conversation
  const addParticipants = async (newParticipants) => {
    if (!selectedConversation || newParticipants.length === 0) return;
    
    try {
      const response = await api.post(`/formateur/chat/conversations/${selectedConversation.matricule}/participants/add`, {
        participants: newParticipants
      });
      
      await fetchConversations();
      showToastMessage(response.data.message, 'success');
      setShowParticipantsModal(false);
    } catch (err) {
      console.error('Erreur ajout participants:', err);
      showToastMessage('Erreur lors de l\'ajout des participants', 'danger');
    }
  };

  // Confirmer la suppression d'un participant
  const confirmDeleteParticipant = (participant) => {
    setParticipantToDelete(participant);
    setShowDeleteConfirmModal(true);
  };

  // Retirer des participants d'une conversation
  const removeParticipants = async (participantsToRemove) => {
    if (!selectedConversation || participantsToRemove.length === 0) return;
    
    try {
      const response = await api.delete(`/formateur/chat/conversations/${selectedConversation.matricule}/participants/remove`, {
        data: { participants: participantsToRemove }
      });
      
      await fetchConversations();
      showToastMessage(response.data.message, 'success');
      setShowDeleteConfirmModal(false);
      setParticipantToDelete(null);
    } catch (err) {
      console.error('Erreur suppression participants:', err);
      showToastMessage('Erreur lors de la suppression des participants', 'danger');
    }
  };

  // Archiver/désarchiver une conversation
  const toggleArchiveConversation = async (conversationMatricule) => {
    try {
      const response = await api.put(`/formateur/chat/conversations/${conversationMatricule}/toggle-archive`);
      await fetchConversations();
      showToastMessage(response.data.message, 'success');
      
      // Si la conversation archivée était sélectionnée, la désélectionner
      if (selectedConversation?.matricule === conversationMatricule) {
        setSelectedConversation(null);
      }
    } catch (err) {
      console.error('Erreur archivage conversation:', err);
      showToastMessage('Erreur lors de l\'archivage', 'danger');
    }
  };

  // Charger les messages épinglés
  const fetchPinnedMessages = async (conversationMatricule) => {
    try {
      const response = await api.get(`/formateur/chat/conversations/${conversationMatricule}/pinned-messages`);
      setPinnedMessages(response.data.messages || []);
      setShowPinnedModal(true);
    } catch (err) {
      console.error('Erreur messages épinglés:', err);
      showToastMessage('Erreur lors du chargement des messages épinglés', 'danger');
    }
  };

  // Charger les statistiques
  const fetchConversationStats = async () => {
    try {
      const response = await api.get('/formateur/chat/stats');
      setConversationStats(response.data.stats || {});
      setShowStatsModal(true);
    } catch (err) {
      console.error('Erreur statistiques:', err);
      showToastMessage('Erreur lors du chargement des statistiques', 'danger');
    }
  };

  // Rechercher dans les messages
  const searchInMessages = async (query) => {
    if (!selectedConversation || !query.trim()) return;
    
    try {
      const response = await api.get(`/formateur/chat/conversations/${selectedConversation.matricule}/search`, {
        params: { query: query.trim() }
      });
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Erreur recherche messages:', err);
      showToastMessage('Erreur lors de la recherche', 'danger');
    }
  };

  // Charger les données initiales
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        await fetchConversations();
        
        // Charger le profil utilisateur
        const userResponse = await api.get('/me');
        setCurrentUser(userResponse.data);
      } catch (err) {
        console.error('Erreur initialisation chat:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [fetchConversations]);

  // Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.matricule);
    }
  }, [selectedConversation, fetchMessages]);

  // Scroll automatique vers le bas
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  // Formatage des dates
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long' 
      });
    }
  };

  // Obtenir le nom d'affichage d'une conversation
  const getConversationDisplayName = (conversation) => {
    if (Array.isArray(conversation.autres_participants) && conversation.autres_participants.length === 1) {
      return conversation.autres_participants[0]?.name || 'Conversation';
    }
    return conversation.nom_affichage || 'Groupe';
  };

  // Obtenir l'avatar d'une conversation
  const getConversationAvatar = (conversation) => {
    if (Array.isArray(conversation.autres_participants) && conversation.autres_participants.length === 1) {
      return conversation.autres_participants[0]?.profil_url;
    }
    return null;
  };

  // Gérer la sélection de fichiers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      showToastMessage('Maximum 5 fichiers autorisés pour les formateurs', 'warning');
      return;
    }
    setSelectedFiles(files);
    setShowFilePreview(true);
  };

  // Gérer les raccourcis clavier
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Grouper les messages par date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  // Gérer la sélection de participants
  const toggleParticipantSelection = (user) => {
    setSelectedParticipants(prev => {
      const isSelected = prev.find(p => p.matricule === user.matricule);
      if (isSelected) {
        return prev.filter(p => p.matricule !== user.matricule);
      } else {
        return [...prev, user];
      }
    });
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du tchat administrateur...</p>
        </div>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      <div className="d-flex flex-column vh-100">
        {/* Layout avec sidebar fixe à gauche et contenu principal */}
        <div className="d-flex flex-grow-1" style={{ height: 'calc(100vh - 120px)' }}>
          
          {/* Sidebar des conversations - FIXE À GAUCHE */}
          <div 
            className={`border-end ${theme === "dark" ? "border-secondary" : ""}`} 
            style={{ width: '350px', minWidth: '350px' }}
          >
            <div className={`h-100 d-flex flex-column ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              
              {/* Header sidebar - FIXE EN HAUT */}
              <div className={`border-bottom p-3 ${theme === "dark" ? "bg-dark border-secondary" : "bg-light"}`}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="message-circle" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                        Conversations
                    </h5>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowNewChatModal(true)}
                    >
                      <i data-feather="plus" style={{ width: "16px", height: "16px" }}></i>
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => fetchConversationStats()}
                    >
                      <i data-feather="bar-chart" style={{ width: "16px", height: "16px" }}></i>
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => fetchConversations()}
                      disabled={realTimeLoading}
                    >
                      {realTimeLoading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <FeatherIcon icon="refresh-cw" size="sm" style={{ width: "16px", height: "16px" }} />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Barre de recherche */}
                <Form.Control
                  type="text"
                  placeholder="Rechercher dans les conversations..."
                  className={`${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Liste des conversations - SCROLLABLE */}
              <div 
                className={`flex-grow-1 ${theme === "dark" ? "bg-dark" : ""}`} 
                style={{ overflowY: 'auto' }}
              >
                {conversations.length > 0 ? (
                  <ListGroup variant="flush">
                    {conversations
                      .filter(conv => 
                        !searchTerm || 
                        getConversationDisplayName(conv).toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((conversation) => (
                      <ListGroup.Item
                        key={conversation.id}
                        action
                        active={selectedConversation?.matricule === conversation.matricule}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`border-1 rounded ${theme === "dark" ? "bg-dark text-light" : ""} ${conversation.statut === 'archivee' ? 'opacity-75' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex align-items-center">
                          <div className="position-relative me-3">
                            {getConversationAvatar(conversation) ? (
                              <Image
                                src={getConversationAvatar(conversation)}
                                alt="Avatar"
                                width="45"
                                height="45"
                                className="rounded-circle"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                style={{ width: '45px', height: '45px' }}
                              >
                                <FeatherIcon 
                                  icon={conversation.total_participants > 2 ? 'users' : 'user'} 
                                  className="text-white" 
                                  style={{ width: '20px', height: '20px' }} 
                                />
                              </div>
                            )}
                            {conversation.messages_non_lus > 0 && (
                              <Badge 
                                bg="danger" 
                                pill 
                                className="position-absolute top-0 end-0"
                                style={{ transform: 'translate(50%, -50%)', fontSize: '0.7em' }}
                              >
                                {conversation.messages_non_lus > 99 ? '99+' : conversation.messages_non_lus}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex-grow-1 min-w-0">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className={`mb-1 text-truncate ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {getConversationDisplayName(conversation).length > 25 ? 
                                  getConversationDisplayName(conversation).substring(0, 25) + "..." : 
                                  getConversationDisplayName(conversation)
                                }
                              </h6>
                              <div className="d-flex align-items-center gap-1">
                                {conversation.statut === 'archivee' && ( 
                                  <FeatherIcon icon="archive" className="text-warning" style={{ width: "12px", height: "12px" }} />
                                )}
                                <small className="text-muted">
                                  {formatMessageTime(conversation.derniere_activite)}
                                </small>
                              </div>
                            </div>
                            
                            {conversation.dernier_message && (
                              <p className="mb-1 text-muted small text-truncate">
                                {conversation.dernier_message.type_message === 'fichier' ? (
                                  <>Fichier</>
                                ) : conversation.dernier_message.type_message === 'image' ? (
                                  <>Image</>
                                ) : (
                                  conversation?.dernier_message?.contenu?.length > 30 ? 
                                    conversation.dernier_message.contenu.substring(0, 30) + "..." : 
                                    conversation.dernier_message.contenu
                                )}
                              </p>
                            )}
                           
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <div className="text-center py-5 px-3">
                    <FeatherIcon icon="message-circle" className="text-muted mb-3" style={{ width: "48px", height: "48px" }} />
                    <h6 className={theme === "dark" ? "text-light" : "text-muted"}>Aucune conversation</h6>
                    <p className="small text-muted">Créez une nouvelle conversation</p>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowNewChatModal(true)}
                    >
                      <FeatherIcon icon="plus" className="me-1" size="sm" style={{ width: "16px", height: "16px" }} />
                      Nouvelle conversation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Zone de chat principale */}
          <div className="flex-grow-1 d-flex flex-column">
            {selectedConversation ? (
              <>
                {/* Header du chat - NAVBAR FIXE EN HAUT */}
                <div className={`border-bottom p-3 ${theme === "dark" ? "bg-dark border-secondary" : "bg-light"}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      {getConversationAvatar(selectedConversation) ? (
                        <Image
                          src={getConversationAvatar(selectedConversation)}
                          alt="Avatar"
                          width="40"
                          height="40"
                          className="rounded-circle me-3"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <FeatherIcon 
                            icon={selectedConversation.total_participants > 2 ? 'users' : 'user'} 
                            className="text-white" 
                            style={{ width: '18px', height: '18px' }} 
                          />
                        </div>
                      )}
                      
                      <div>
                        <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {getConversationDisplayName(selectedConversation)}
                          {selectedConversation.statut === 'archivee' && (
                            <Badge bg="warning" className="ms-2 small">Archivée</Badge>
                          )}
                        </h6>
                        <small className="text-muted">
                          {selectedConversation.total_participants} participants
                          {selectedConversation.matricule_createur === currentUser?.matricule && ' • Vous êtes le créateur'}
                        </small>
                      </div>
                    </div>

                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowSearchModal(true)}
                      >
                        <i data-feather="search" style={{ width: "16px", height: "16px" }}></i>
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => fetchPinnedMessages(selectedConversation.matricule)}
                      >
                        <i data-feather="bookmark" style={{ width: "16px", height: "16px" }}></i>
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => setShowParticipantsModal(true)}
                      >
                        <i data-feather="users" style={{ width: "16px", height: "16px" }}></i>
                      </Button>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                        <i data-feather="more-vertical" style={{ width: "16px", height: "16px" }}></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => setShowParticipantsModal(true)}>
                            <FeatherIcon icon="users" className="me-2" size="sm" style={{ width: "16px", height: "16px" }} />
                            Gérer les participants
                          </Dropdown.Item>
                          {selectedConversation.matricule_createur === currentUser?.matricule && (
                            <Dropdown.Item onClick={() => toggleArchiveConversation(selectedConversation.matricule)}>
                              <FeatherIcon icon="archive" className="me-2" size="sm" style={{ width: "16px", height: "16px" }} />
                              {selectedConversation.statut === 'archivee' ? 'Désarchiver' : 'Archiver'}
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item>
                            <FeatherIcon icon="info" className="me-2" size="sm" style={{ width: "16px", height: "16px" }} />
                            Informations détaillées
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                </div>

                {/* Messages - ZONE SCROLLABLE AU MILIEU */}
                <div className="flex-grow-1" style={{ overflow: 'hidden' }}>
                  <div className={`h-100 p-3 ${theme === "dark" ? "bg-dark" : "bg-white"}`} style={{ overflowY: 'auto' }}>
                    {messages.length > 0 ? (
                      <>
                        {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                          <div key={date}>
                            {/* Séparateur de date */}
                            <div className="text-center my-3">
                              <Badge bg="light" text="dark" className="px-3 py-2">
                                {formatMessageDate(dateMessages[0].created_at)}
                              </Badge>
                            </div>

                            {/* Messages de cette date */}
                            {dateMessages.map((message, index) => (
                              <div
                                key={message.id}
                                className={`mb-3 d-flex ${message.expediteur.matricule === currentUser?.matricule ? 'justify-content-end' : 'justify-content-start'}`}
                              >
                                <div 
                                  className={`max-w-75 ${message.expediteur.matricule === currentUser?.matricule ? 'text-end' : ''}`}
                                  style={{ maxWidth: '75%' }}
                                >
                                  {/* Avatar et nom pour les messages des autres */}
                                  {message.expediteur.matricule !== currentUser?.matricule && (
                                    <div className="d-flex align-items-center mb-1">
                                      <Image
                                        src={message.expediteur.profil_url || "/placeholder/placeholder.png"}
                                        alt="Avatar"
                                        width="20"
                                        height="20"
                                        className="rounded-circle me-2"
                                        style={{ objectFit: 'cover' }}
                                      />
                                      <small className="text-muted">{message.expediteur.name}</small>
                                      <Badge bg={message.expediteur.role === 1 ? 'primary' : 'success'} className="ms-1" style={{ fontSize: '0.6em' }}>
                                        {message.expediteur.role === 1 ? 'Étudiant' : 'Admin'}
                                      </Badge>
                                      <small className="text-muted">
                                        {message.expediteur.status === "Connecté" ? '🟢' : '🔴'}
                                      </small>
                                    </div>
                                  )}

                                  {/* Message parent (réponse) */}
                                  {message.messageParent && (
                                    <div className={`small p-2 rounded mb-1 border-start border-3 ${theme === "dark" ? "bg-secondary bg-opacity-25 border-secondary" : "bg-light border-primary"}`}>
                                      <div className="fw-bold">{message.messageParent.expediteur?.name}</div>
                                      <div className="text-muted">{message.messageParent.contenu}</div>
                                    </div>
                                  )}

                                  <div 
                                    className={`p-3 rounded-3 position-relative ${
                                      message.expediteur.matricule === currentUser?.matricule
                                        ? 'bg-primary text-white ms-auto'
                                        : theme === "dark" ? 'bg-secondary text-light' : 'bg-light'
                                    }`}
                                    style={{ 
                                      borderBottomRightRadius: message.expediteur.matricule === currentUser?.matricule ? '0.375rem !important' : undefined,
                                      borderBottomLeftRadius: message.expediteur.matricule !== currentUser?.matricule ? '0.375rem !important' : undefined
                                    }}
                                  >
                                    {/* Indicateur épinglé */}
                                    {message.epingle && (
                                      <div className="position-absolute top-0 end-0 p-1">
                                        <i data-feather="bookmark" className="text-warning" style={{ width: "16px", height: "16px" }}></i>
                                      </div>
                                    )}

                                    {/* Contenu du message */}
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                      {message.contenu}
                                    </div>

                                    {/* Fichiers joints */}
                                    {message.fichiers_joints_urls && message.fichiers_joints_urls.length > 0 && (
                                      <div className="mt-2">
                                        {message.fichiers_joints_urls.map((fichier, fileIndex) => (
                                          <div key={fileIndex} className="d-flex align-items-center gap-2 mb-1">
                                            <i data-feather="paperclip" style={{ width: "16px", height: "16px" }}></i>
                                            <a 
                                              href={fichier.url} 
                                              className={message.expediteur.matricule === currentUser?.matricule ? "text-white" : ""}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              {fichier.nom}
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Temps, statut et indicateurs de lecture */}
                                    <div className="d-flex justify-content-between align-items-center mt-2 small">
                                      <span className={message.expediteur.matricule === currentUser?.matricule ? "text-white-50" : "text-muted"}>
                                        {formatMessageTime(message.created_at)}
                                        {message.modifie && <span className="ms-1">(modifié)</span>}
                                      </span>
                                      
                                      <div className="d-flex align-items-center gap-2">
                                        {message?.status === "lu" ? (
                                          <div className="d-flex align-items-center">
                                            <i data-feather="check" className="text-success" style={{ width: "12px", height: "12px" }}></i>
                                            <i data-feather="check" className="text-success" style={{ width: "12px", height: "12px" }}></i>
                                          </div>
                                        ) : (
                                          <div className="d-flex align-items-center">
                                            <i data-feather="check" className="text-secondary" style={{ width: "12px", height: "12px" }}></i>
                                          </div>
                                        )}
                                        
                                        {/* Actions sur le message */}
                                        <Dropdown onToggle={(isOpen) => {
                                          if (isOpen) {
                                            setTimeout(() => feather.replace(), 0);
                                          }
                                        }}>
                                          <Dropdown.Toggle
                                            variant="link"
                                            size="sm"
                                            className={`p-0 border-0 ${message.expediteur.matricule === currentUser?.matricule ? "text-white" : "text-muted"}`}
                                          >
                                            <i data-feather="more-horizontal" style={{ width: "16px", height: "16px" }}></i>
                                          </Dropdown.Toggle>
                                          <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => setReplyingTo(message)}>
                                              <i data-feather="corner-up-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                                              Répondre
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => togglePinMessage(message.matricule)}>
                                              <i data-feather="bookmark" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                                              {message.epingle ? 'Désépingler' : 'Épingler'}
                                            </Dropdown.Item>
                                            {message.can_edit && (
                                              <Dropdown.Item onClick={() => {
                                                setEditingMessage(message);
                                                setMessageText(message.contenu);
                                                messageInputRef.current?.focus();
                                              }}>
                                                <i data-feather="edit-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                                                Modifier
                                              </Dropdown.Item>
                                            )}
                                            <Dropdown.Item 
                                              className="text-danger"
                                              onClick={() => deleteMessage(message.matricule)}
                                            >
                                              <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                                              Supprimer (Admin)
                                            </Dropdown.Item>
                                          </Dropdown.Menu>
                                        </Dropdown>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    ) : (
                      <div className="text-center py-5">
                        <FeatherIcon icon="message-circle" className="text-muted mb-3" style={{ width: "48px", height: "48px" }} />
                        <h6 className={theme === "dark" ? "text-light" : "text-muted"}>Aucun message</h6>
                        <p className="small text-muted">Commencez votre première conversation</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Zone de saisie - FOOTER FIXE EN BAS */}
                <div className={`border-top p-3 ${theme === "dark" ? "border-secondary" : ""} ${selectedConversation.statut === 'archivee' ? 'opacity-50' : ''}`}>
                  {selectedConversation.statut === 'archivee' && (
                    <Alert variant="warning" className="mb-2 small py-2">
                      <FeatherIcon icon="archive" className="me-2" style={{ width: "16px", height: "16px" }} />
                      Cette conversation est archivée. Désarchivez-la pour pouvoir envoyer des messages.
                    </Alert>
                  )}

                  {/* Message de réponse */}
                  {replyingTo && (
                    <div className={`mb-2 p-2 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="small">
                          <FeatherIcon icon="corner-up-left" className="me-1" style={{ width: "12px", height: "12px" }} />
                          Réponse à <strong>{replyingTo.expediteur.name}</strong>: {replyingTo.contenu.substring(0, 50)}...
                        </div>
                        <Button variant="link" size="sm" onClick={() => setReplyingTo(null)}>
                          <i data-feather="x" style={{ width: "12px", height: "12px" }}></i>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Message d'édition */}
                  {editingMessage && (
                    <div className={`mb-2 p-2 rounded ${theme === "dark" ? "bg-warning bg-opacity-25" : "bg-warning bg-opacity-10"}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="small text-warning">
                          <FeatherIcon icon="edit-2" className="me-1" style={{ width: "12px", height: "12px" }} />
                          Modification du message
                        </div>
                        <Button variant="link" size="sm" onClick={() => {
                          setEditingMessage(null);
                          setMessageText("");
                        }}>
                          <i data-feather="x" style={{ width: "12px", height: "12px" }}></i>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Fichiers sélectionnés */}
                  {selectedFiles.length > 0 && (
                    <div className={`mb-2 p-2 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                          <div className="small">
                            <FeatherIcon icon="paperclip" className="me-1" style={{ width: "12px", height: "12px" }} />
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            <i data-feather="x" style={{ width: "12px", height: "12px" }}></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Zone de saisie principale */}
                  <InputGroup>
                    <Button
                      variant="outline-secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={selectedConversation.statut === 'archivee'}
                    >
                      <i data-feather="paperclip" style={{ width: "16px", height: "16px" }}></i>
                    </Button>
                    
                    <Form.Control
                      ref={messageInputRef}
                      as="textarea"
                      rows={1}
                      placeholder={editingMessage ? "Modifier le message..." : "Tapez votre message (privilèges administrateur)..."}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={selectedConversation.statut === 'archivee'}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      style={{ resize: 'none', minHeight: '38px', maxHeight: '150px' }}
                    />
                    
                    <Button
                      variant="primary"
                      onClick={sendMessage}
                      disabled={(!messageText.trim() && selectedFiles.length === 0) || selectedConversation.statut === 'archivee'}
                    >
                      <FeatherIcon icon={editingMessage ? "check" : "send"} style={{ width: "16px", height: "16px" }} />
                    </Button>
                  </InputGroup>

                  {/* Input file caché */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.mp4,.avi,.mov"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </>
            ) : (
              <div className={`h-100 d-flex align-items-center justify-content-center ${theme === "dark" ? "bg-dark" : "bg-light"}`}>
                <div className="text-center">
                  <FeatherIcon icon="message-circle" className="text-muted mb-3" style={{ width: "64px", height: "64px" }} />
                  <h5 className={theme === "dark" ? "text-light" : "text-muted"}>Sélectionnez une conversation</h5>
                  <p className="text-muted">Choisissez une conversation dans la liste pour commencer la gestion</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal nouvelle conversation */}
        <Modal
          show={showNewChatModal}
          onHide={() => setShowNewChatModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Créer une nouvelle conversation</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rechercher des utilisateurs</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nom, email ou matricule..."
                    onChange={(e) => searchUsers(e.target.value, roleFilter, classroomFilter)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Filtre par rôle</Form.Label>
                      <Form.Select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      >
                        <option value="">Tous les rôles</option>
                        <option value="1">Étudiants</option>
                        <option value="2">Formateurs</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Filtre par classe</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Code classe..."
                        value={classroomFilter}
                        onChange={(e) => setClassroomFilter(e.target.value)}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {searchResults.length > 0 && (
                  <div className="border rounded p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={`d-flex align-items-center p-2 rounded cursor-pointer ${
                          selectedParticipants.find(p => p.matricule === user.matricule) ? 'bg-primary bg-opacity-25' : ''
                        } ${theme === "dark" ? "hover-bg-secondary" : "hover-bg-light"}`}
                        onClick={() => toggleParticipantSelection(user)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Image
                          src={user.profil_url || "/placeholder/placeholder.png"}
                          alt="Avatar"
                          width="30"
                          height="30"
                          className="rounded-circle me-2"
                          style={{ objectFit: 'cover' }}
                        />
                        <div className="flex-grow-1">
                          <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>{user.name}</div>
                          <div className="small text-muted">{user.email}</div>
                          <div className="d-flex gap-1">
                            <Badge bg={user.role === 1 ? 'primary' : 'success'}>
                              {user.role_text}
                            </Badge>
                            {user.classroom_name && (
                              <Badge bg="secondary" className="small">
                                {user.classroom_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedParticipants.find(p => p.matricule === user.matricule) && (
                          <FeatherIcon icon="check" className="text-primary" style={{ width: "16px", height: "16px" }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Col>

              <Col md={6}>
                <Form.Label>Participants sélectionnés ({selectedParticipants.length})</Form.Label>
                <div className="border rounded p-2" style={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
                  {selectedParticipants.length > 0 ? (
                    selectedParticipants.map((participant) => (
                      <div key={participant.matricule} className="d-flex align-items-center justify-content-between p-2 mb-1 bg-light rounded">
                        <div className="d-flex align-items-center">
                          <Image
                            src={participant.profil_url || "/placeholder/placeholder.png"}
                            alt="Avatar"
                            width="25"
                            height="25"
                            className="rounded-circle me-2"
                            style={{ objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-medium">{participant.name}</div>
                            <Badge bg={participant.role === 1 ? 'primary' : 'success'} className="small">
                              {participant.role_text}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => toggleParticipantSelection(participant)}
                        >
                          <FeatherIcon icon="x" style={{ width: "12px", height: "12px" }} />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <FeatherIcon icon="users" style={{ width: "32px", height: "32px" }} />
                      <p className="mt-2 mb-0">Aucun participant sélectionné</p>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowNewChatModal(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => startConversation(selectedParticipants.map(p => p.matricule))}
              disabled={selectedParticipants.length === 0}
            >
              Créer la conversation
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal confirmation de suppression de participant */}
        <Modal
          show={showDeleteConfirmModal}
          onHide={() => {
            setShowDeleteConfirmModal(false);
            setParticipantToDelete(null);
          }}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title className="text-danger">
              <i data-feather="alert-triangle" className="me-2" style={{ width: "20px", height: "20px" }}></i>
              Confirmer la suppression
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {participantToDelete && (
              <div>
                <Alert variant="warning" className="d-flex align-items-center">
                  <i data-feather="alert-triangle" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  <div>
                    <strong>Attention !</strong> Cette action est irréversible.
                  </div>
                </Alert>
                
                <p>Êtes-vous sûr de vouloir retirer cet utilisateur de la conversation ?</p>
                
                <div className="d-flex align-items-center p-3 border rounded">
                  <Image
                    src={participantToDelete.profil_url || "/placeholder/placeholder.png"}
                    alt="Avatar"
                    width="40"
                    height="40"
                    className="rounded-circle me-3"
                    style={{ objectFit: 'cover' }}
                  />
                  <div>
                    <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {participantToDelete.name}
                    </h6>
                    <div className="d-flex gap-2">
                      <Badge bg={participantToDelete.role === 1 ? 'primary' : 'success'}>
                        {participantToDelete.role === 1 ? 'Étudiant' : 'Admin'}
                      </Badge>
                      <small className="text-muted">{participantToDelete.email}</small>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-light rounded">
                  <small className="text-muted">
                    <i data-feather="info" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    L'utilisateur ne pourra plus voir les nouveaux messages de cette conversation.
                  </small>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setParticipantToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (participantToDelete) {
                  removeParticipants([participantToDelete.matricule]);
                }
              }}
            >
              <i data-feather="user-minus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Confirmer la suppression
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal recherche dans messages */}
        <Modal
          show={showSearchModal}
          onHide={() => setShowSearchModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Rechercher dans la conversation</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <Form.Group>
              <Form.Control
                type="text"
                placeholder="Rechercher un message..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
              />
            </Form.Group>
            <div className="mt-3">
              <Button 
                variant="primary" 
                onClick={() => {
                  searchInMessages(searchTerm);
                  setShowSearchModal(false);
                }}
                disabled={!searchTerm.trim()}
              >
                <FeatherIcon icon="search" className="me-2" size="sm" style={{ width: "16px", height: "16px" }} />
                Rechercher
              </Button>
              <Button 
                variant="outline-secondary" 
                className="ms-2"
                onClick={() => {
                  fetchMessages(selectedConversation.matricule);
                  setSearchTerm("");
                  setShowSearchModal(false);
                }}
              >
                Effacer
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        {/* Modal messages épinglés */}
        <Modal
          show={showPinnedModal}
          onHide={() => setShowPinnedModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Messages épinglés</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {pinnedMessages.length > 0 ? (
              <div className="d-grid gap-2">
                {pinnedMessages.map((message) => (
                  <div key={message.id} className={`p-3 border rounded ${theme === "dark" ? "border-secondary" : ""}`}>
                    <div className="d-flex align-items-start">
                      <Image
                        src={message.expediteur.profil_url || "/placeholder/placeholder.png"}
                        alt="Avatar"
                        width="30"
                        height="30"
                        className="rounded-circle me-2"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{message.expediteur.name}</strong>
                            <Badge bg={message.expediteur.role === 1 ? 'primary' : 'success'} className="ms-1 small">
                              {message.expediteur.role === 1 ? 'Étudiant' : 'Formateur'}
                            </Badge>
                            <small className="text-muted ms-2">
                              {formatMessageTime(message.created_at)}
                            </small>
                          </div>
                          <FeatherIcon icon="bookmark" className="text-warning" style={{ width: "16px", height: "16px" }} />
                        </div>
                        <div className="mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                          {message.contenu}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <FeatherIcon icon="bookmark" className="text-muted mb-3" style={{ width: "48px", height: "48px" }} />
                <h6 className={theme === "dark" ? "text-light" : "text-muted"}>Aucun message épinglé</h6>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Modal gestion des participants */}
        <Modal
          show={showParticipantsModal}
          onHide={() => setShowParticipantsModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Gestion des participants</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedConversation && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Participants actuels ({selectedConversation.total_participants})</h6>
                  <Button variant="primary" size="sm" onClick={() => {
                    setShowNewChatModal(true);
                    setShowParticipantsModal(false);
                  }}>
                    <i data-feather="user-plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Ajouter des participants
                  </Button>
                </div>

                {selectedParticipants.length ? (
                  <div className="table-responsive">
                    <Table hover className={theme === "dark" ? "table-dark" : ""}>
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Rôle</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedParticipants.map((participant) => (
                          <tr key={participant.matricule}>
                            <td>
                              <div className="d-flex align-items-center">
                                <Image
                                  src={participant.profil_url || "/placeholder/placeholder.png"}
                                  alt="Avatar"
                                  width="25"
                                  height="25"
                                  className="rounded-circle me-2"
                                  style={{ objectFit: 'cover' }}
                                />
                                <div>
                                  <div className="fw-medium">{participant.name}</div>
                                  <small className="text-muted">{participant.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge bg={participant.role === 1 ? 'primary' : 'success'}>
                                {participant.role === 1 ? 'Étudiant' : 'Admin'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="success">Actif</Badge>
                            </td>
                            <td>
                              {selectedConversation.matricule_createur === currentUser?.matricule && 
                               participant.matricule !== selectedConversation.matricule_createur && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => confirmDeleteParticipant(participant)}
                                >
                                  <i data-feather="user-minus" style={{ width: "16px", height: "16px" }}></i>
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i data-feather="users" className="text-muted mb-3" style={{ width: "48px", height: "48px" }}></i>
                    <h6>Aucun autre participant</h6>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Modal statistiques */}
        <Modal
          show={showStatsModal}
          onHide={() => setShowStatsModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Statistiques des conversations</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {conversationStats && (
              <Row>
                <Col md={3}>
                  <Card className={`text-center border-0 ${theme === "dark" ? "bg-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <i data-feather="message-circle" className="text-primary mb-2" style={{ width: "24px", height: "24px" }}></i>
                      <h4 className={theme === "dark" ? "text-light" : "text-dark"}>
                        {conversationStats.total_conversations || 0}
                      </h4>
                      <small className="text-muted">Total conversations</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`text-center border-0 ${theme === "dark" ? "bg-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <i data-feather="activity" className="text-success mb-2" style={{ width: "24px", height: "24px" }}></i>
                      <h4 className="text-success">
                        {conversationStats.conversations_actives || 0}
                      </h4>
                      <small className="text-muted">Actives (7j)</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`text-center border-0 ${theme === "dark" ? "bg-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <i data-feather="send" className="text-info mb-2" style={{ width: "24px", height: "24px" }}></i>
                      <h4 className="text-info">
                        {conversationStats.messages_envoyes || 0}
                      </h4>
                      <small className="text-muted">Messages envoyés</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`text-center border-0 ${theme === "dark" ? "bg-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <i data-feather="hash" className="text-warning mb-2" style={{ width: "24px", height: "24px" }}></i>
                      <h4 className="text-warning">
                        {conversationStats.total_messages || 0}
                      </h4>
                      <small className="text-muted">Total messages</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
            
            {conversationStats.activite_journaliere?.length > 0 && (
              <div className="mt-4">
                <h6>Activité des 30 derniers jours</h6>
                <div className="small text-muted">
                  Messages par jour : {conversationStats.activite_journaliere.map(day => day.messages).join(', ')}
                </div>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Notifications Toast */}
        <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 1050 }}>
          <Toast
            show={showToast}
            onClose={() => setShowToast(false)}
            delay={4000}
            autohide
            bg={toastType === 'success' ? 'success' : 'danger'}
            className={theme === "dark" ? "text-light" : "text-white"}
          >
            <Toast.Header
              closeButton={false}
              className={`${toastType === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}`}
            >
              <strong className="me-auto">
                <i data-feather={toastType === 'success' ? 'check-circle' : 'x-circle'} className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Notification Administrateur
              </strong>
            </Toast.Header>
            <Toast.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              {toastMessage}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </FormateurLayout>
  );
}