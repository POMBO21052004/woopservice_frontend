import React, { useState, useEffect } from "react";
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Badge, 
  Alert, 
  Spinner, 
  Image,
  Modal,
  Table
} from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import FeatherIcon from "../../components/FeatherIcon";

export default function ClassroomUserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [theme, setTheme] = useState("light");

  // Gérer les changements de thème
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

  // Charger les données de l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/formateur/view/classroom/user/${id}`);
        setUser(response.data.user);
      } catch (err) {
        setError('Erreur lors du chargement des informations de l\'utilisateur');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [user]);

  // Fonction pour retirer l'utilisateur de sa salle actuelle
  const handleRemoveFromClassroom = async () => {
    if (!user.classroom) return;

    try {
      setRemoving(true);
      await api.delete(`/formateur/classroom/${user.classroom.id}/remove-user/${user.id}`);
      
      // Mettre à jour les données utilisateur
      setUser(prev => ({
        ...prev,
        matricule_classroom: null,
        classroom: null
      }));
      
      setShowRemoveModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du retrait de l\'utilisateur');
    } finally {
      setRemoving(false);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch(parseInt(role)) {
      case 0: return 'warning';  // Etudiant en zone d'attente
      case 1: return 'info';     // Étudiant
      case 2: return 'success';  // Formateur  
      case 3: return 'danger';   // Admin
      default: return 'secondary';
    }
  };

  const getRoleText = (role) => {
    switch(parseInt(role)) {
      case 0: return 'Étudiant en Zone d\'attente';
      case 1: return 'Étudiant';
      case 2: return 'Formateur';
      case 3: return 'Administrateur';
      default: return 'Non défini';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch(status) {
      case 'Connecté': return 'success';
      case 'Déconnecté': return 'secondary';
      case 'En ligne': return 'success';
      case 'Hors ligne': return 'secondary';
      default: return 'warning';
    }
  };

  const getGenderIcon = (gender) => {
    switch(gender?.toLowerCase()) {
      case 'male':
      case 'masculin':
      case 'm': return 'user';
      case 'female':
      case 'féminin':
      case 'f': return 'user';
      default: return 'user';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseigné';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Non renseigné';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du profil...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (error || !user) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error || 'Utilisateur introuvable'}
        </Alert>
        <Button 
          variant="secondary" 
          onClick={() => navigate(-1)}
          className="d-flex align-items-center"
        >
          <i data-feather="arrow-left" className="me-2" />
          Retour
        </Button>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center mb-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => navigate(-1)}
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <h1 className="h3 mb-0">Profil utilisateur</h1>
            <Badge 
              bg={getStatusBadgeVariant(user.status)} 
              className="ms-3 px-3 py-2"
            >
              <i data-feather="activity" className="me-1" style={{ width: '14px', height: '14px' }} />
              {user.status || 'Indéfini'}
            </Badge>
          </div>
          <p className="text-muted mb-0">
            <i data-feather="hash" className="me-1" style={{ width: '14px', height: '14px' }} />
            {user.matricule}
          </p>
        </div>
        
        <div className="d-flex gap-2">
          {user.classroom && (
            <Button 
              variant="warning"
              onClick={() => setShowRemoveModal(true)}
              className="d-flex align-items-center"
            >
              <i data-feather="user-minus" className="me-2" style={{ width: '16px', height: '16px' }} />
              Retirer de la salle
            </Button>
          )}
          <Button 
            variant="outline-info" 
            as={Link} 
            to={user.classroom ? `/formateur/show/classroom/${user.classroom.id}` : '/formateur/view/classrooms'}
            className="d-flex align-items-center"
          >
            <i data-feather="home" className="me-2" style={{ width: '16px', height: '16px' }} />
            {user.classroom ? 'Voir la salle' : 'Assigner à une salle'}
          </Button>
        </div>
      </div>

      <Row>
        {/* Informations principales */}
        <Col lg={8} className="mb-4">
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="user" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations personnelles
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="align-items-start mb-4">
                <Col md={4} className="text-center">
                  <div className="position-relative d-inline-block">
                    {user.profil_url ? (
                      <Image
                        src={user.profil_url}
                        alt="Photo de profil"
                        className="rounded-circle"
                        width="150"
                        height="150"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                        style={{ width: '150px', height: '150px' }}
                      >
                        <i data-feather={getGenderIcon(user.gender)} className="text-muted" style={{ width: '48px', height: '48px' }} />
                      </div>
                    )}
                    <Badge 
                      bg={getStatusBadgeVariant(user.status)}
                      className="position-absolute bottom-0 end-0 rounded-pill px-2 py-1"
                    >
                      <i data-feather="activity" style={{ width: '12px', height: '12px' }} />
                    </Badge>
                  </div>
                </Col>
                <Col md={8}>
                  <div className="mb-3">
                    <h4 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {user.name}
                    </h4>
                    <div className="d-flex align-items-center mb-2">
                      <Badge bg={getRoleBadgeVariant(user.role)} className="me-3 px-3 py-2">
                        <i data-feather="shield" className="me-1" style={{ width: '14px', height: '14px' }} />
                        {getRoleText(user.role)}
                      </Badge>
                      <Badge bg={getStatusBadgeVariant(user.status)} className="px-3 py-2">
                        <i data-feather="activity" className="me-1" style={{ width: '14px', height: '14px' }} />
                        {user.status || 'Indéfini'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h6 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="mail" className="me-2" style={{ width: '16px', height: '16px' }} />
                      Contact
                    </h6>
                    <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <div className="mb-1">
                        <i data-feather="at-sign" className="me-2" style={{ width: '14px', height: '14px' }} />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div>
                          <i data-feather="phone" className="me-2" style={{ width: '14px', height: '14px' }} />
                          {user.code_phone ? `${user.code_phone} ${user.phone}` : user.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {user.classroom && (
                    <div className="mb-3">
                      <h6 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="home" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Salle de classe
                      </h6>
                      <div className="d-flex align-items-center">
                        <span className={`fw-bold me-2 ${theme === "dark" ? "text-light" : "text-primary"}`}>
                          {user.classroom.name}
                        </span>
                        <Badge 
                          bg={user.classroom.status === 'Open' ? 'success' : 'danger'} 
                          className="me-2"
                        >
                          {user.classroom.status === 'Open' ? 'Ouverte' : 'Fermée'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline-info"
                          as={Link}
                          to={`/formateur/show/classroom/${user.classroom.id}`}
                        >
                          <i data-feather="eye" className="me-1" style={{ width: '12px', height: '12px' }} />
                          Voir
                        </Button>
                      </div>
                      {user.classroom.description && (
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          {user.classroom.description}
                        </small>
                      )}
                    </div>
                  )}
                </Col>
              </Row>

              <hr className="my-4" />

              {/* Détails supplémentaires */}
              <Row>
                <Col md={6} className="mb-3">
                  <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="info" className="me-2" style={{ width: '16px', height: '16px' }} />
                    Informations personnelles
                  </h6>
                  <Table borderless size="sm" className={theme === "dark" ? "text-light" : ""}>
                    <tbody>
                      <tr>
                        <td className="text-muted">Matricule :</td>
                        <td className="fw-medium font-monospace">{user.matricule}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Genre :</td>
                        <td className="fw-medium">{user.gender || 'Non spécifié'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Date de naissance :</td>
                        <td className="fw-medium">{formatDate(user.birthday)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Rôle :</td>
                        <td>
                          <Badge bg={getRoleBadgeVariant(user.role)}>
                            {getRoleText(user.role)}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                
                <Col md={6} className="mb-3">
                  <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-2" style={{ width: '16px', height: '16px' }} />
                    Informations système
                  </h6>
                  <Table borderless size="sm" className={theme === "dark" ? "text-light" : ""}>
                    <tbody>
                      <tr>
                        <td className="text-muted">Statut :</td>
                        <td>
                          <Badge bg={getStatusBadgeVariant(user.status)}>
                            {user.status || 'Indéfini'}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Créé le :</td>
                        <td className="fw-medium">{formatDateTime(user.created_at)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Dernière mise à jour :</td>
                        <td className="fw-medium">{formatDateTime(user.updated_at)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Salle assignée :</td>
                        <td className="fw-medium">
                          {user.matricule_classroom ? (
                            <span className="text-success">Oui</span>
                          ) : (
                            <span className="text-warning">Non</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Colonne latérale */}
        <Col lg={4}>
          {/* Actions rapides */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="settings" className="me-2" style={{ width: '20px', height: '20px' }} />
                Actions rapides
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                {user.classroom && (
                  <>
                    <Button 
                      variant="primary" 
                      as={Link} 
                      to={`/formateur/show/classroom/${user.classroom.id}`}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <i data-feather="home" className="me-2" style={{ width: '18px', height: '18px' }} />
                      Voir sa salle
                    </Button>
                    
                    <Button 
                      variant="warning"
                      onClick={() => setShowRemoveModal(true)}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <i data-feather="user-minus" className="me-2" style={{ width: '18px', height: '18px' }} />
                      Retirer de la salle
                    </Button>
                  </>
                )}
                
                <Button 
                  variant="outline-info" 
                  as={Link} 
                  to="/formateur/view/etudiants"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather="users" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Tous les utilisateurs
                </Button>
                
                <Button 
                  variant="outline-secondary" 
                  as={Link} 
                  to="/formateur/view/classrooms"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather="list" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Toutes les salles
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Statistiques utilisateur */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="bar-chart-2" className="me-2 text-info" style={{ width: '20px', height: '20px' }} />
                Informations rapides
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div className={`mb-2 ${getRoleBadgeVariant(user.role) === 'info' ? 'text-info' : 'text-primary'}`}>
                  <i data-feather="user" style={{ width: '32px', height: '32px' }} />
                </div>
                <h4 className={getRoleBadgeVariant(user.role) === 'info' ? 'text-info' : 'text-primary'}>
                  {getRoleText(user.role)}
                </h4>
                <small className={theme === "dark" ? "text-light" : "text-muted"}>
                  Rôle dans le système
                </small>
              </div>
              
              <hr className="my-3" />
              
              <div className="small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Statut actuel :</span>
                  <Badge bg={getStatusBadgeVariant(user.status)}>
                    {user.status || 'Indéfini'}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Inscrit depuis :</span>
                  <span className={theme === "dark" ? "text-light" : "text-dark"}>
                    {Math.ceil((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))} jour(s)
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Assigné à une salle :</span>
                  <span className={user.classroom ? 'text-success fw-bold' : 'text-warning fw-bold'}>
                    {user.classroom ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Informations de salle */}
          {user.classroom && (
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="home" className="me-2 text-success" style={{ width: '20px', height: '20px' }} />
                  Salle assignée
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <div className="text-success mb-2">
                    <i data-feather="home" style={{ width: '32px', height: '32px' }} />
                  </div>
                  <h5 className={`text-success mb-1 ${theme === "dark" ? "text-light" : ""}`}>
                    {user.classroom.name}
                  </h5>
                  <Badge 
                    bg={user.classroom.status === 'Open' ? 'success' : 'danger'}
                    className="mb-2"
                  >
                    {user.classroom.status === 'Open' ? 'Ouverte' : 'Fermée'}
                  </Badge>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Matricule : {user.matricule_classroom}
                  </div>
                </div>
                
                {user.classroom.description && (
                  <div className="mb-3">
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      {user.classroom.description}
                    </small>
                  </div>
                )}
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-success" 
                    size="sm" 
                    as={Link} 
                    to={`/formateur/show/classroom/${user.classroom.id}`}
                    className="w-100"
                  >
                    <i data-feather="eye" className="me-2" style={{ width: '14px', height: '14px' }} />
                    Voir la salle
                  </Button>
                  
                  <Button 
                    variant="outline-warning" 
                    size="sm" 
                    className="w-100"
                    onClick={() => setShowRemoveModal(true)}
                  >
                    <i data-feather="user-minus" className="me-2" style={{ width: '14px', height: '14px' }} />
                    Retirer de la salle
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal de retrait de la salle */}
      <Modal
        show={showRemoveModal}
        onHide={() => setShowRemoveModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>
            <i data-feather="user-minus" className="me-2 text-warning" style={{ width: "20px", height: "20px" }} />
            Retirer de la salle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>
            Êtes-vous sûr de vouloir retirer <strong>"{user.name}"</strong> de la salle <strong>"{user.classroom?.name}"</strong> ?
          </p>
          <div className="alert alert-warning">
            <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            L'utilisateur ne pourra plus accéder à cette salle de classe, mais son compte restera actif.
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button 
            variant="secondary" 
            onClick={() => setShowRemoveModal(false)}
            disabled={removing}
          >
            Annuler
          </Button>
          <Button 
            variant="warning" 
            onClick={handleRemoveFromClassroom}
            disabled={removing}
          >
            {removing ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Retrait en cours...
              </>
            ) : (
              <>
                <i data-feather="user-minus" className="me-2" style={{ width: "16px", height: "16px" }} />
                Retirer de la salle
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </FormateurLayout>
  );
}
   