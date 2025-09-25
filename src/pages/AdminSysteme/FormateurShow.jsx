import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Badge, Alert, Spinner, Image, Modal, Toast, ToastContainer } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function ShowFormateur() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modal pour confirmation suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // Afficher les notifications toast
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Charger les données du formateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/admin-systeme/show/formateur/${id}`);
        setUser(response.data.user);
      } catch (err) {
        setError('Erreur lors du chargement du formateur');
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

  // Gérer la suppression
  const handleDelete = async () => {
    try {
      await api.delete(`/admin-systeme/destroy/formateur/${id}`);
      showToastMessage("Formateur supprimé avec succès", 'success');
      setTimeout(() => {
        navigate('/admin-systeme/view/formateur');
      }, 1500);
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
    }
    setShowDeleteModal(false);
  };

  const formatDate = (dateString) => {
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

  const getGenderBadge = (gender) => {
    const variants = {
      'Masculin': 'primary',
      'Féminin': 'info',
      'Autre': 'secondary'
    };
    return variants[gender] || 'secondary';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Connecté': return 'success';
      case 'Déconnecté': return 'secondary';
      case 'En attente': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des informations de l'administrateur...</p>
        </div>
      </AdminSystemeLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminSystemeLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error || 'Administrateur introuvable'}
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" as={Link} to="/admin-systeme/view/formateur">
            <i data-feather="arrow-left" className="me-2" />
            Retour à la liste
          </Button>
        </div>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              as={Link} 
              to="/admin-systeme/view/formateur"
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <div>
              <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                {user.name}
              </h1>
              <div className="d-flex align-items-center gap-2 mt-1">
                <small className="text-muted">{user.matricule}</small>
                <Badge bg="info" className="px-2 py-1">
                  <i data-feather="user-check" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                  Formateur
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <Button 
            variant="primary" 
            as={Link} 
            to={`/admin-systeme/edit/formateur/${id}`}
          >
            <i data-feather="edit" className="me-2" style={{ width: '16px', height: '16px' }} />
            Modifier
          </Button>
          <Button 
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <i data-feather="trash-2" className="me-2" style={{ width: '16px', height: '16px' }} />
            Supprimer
          </Button>
        </div>
      </div>

      <Row>
        {/* Informations principales */}
        <Col lg={8}>
          {/* Profil du formateur */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="user" className="me-2" style={{ width: '20px', height: '20px' }} />
                Profil du formateur
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="align-items-center mb-4">
                <Col md={3} className="text-center">
                  <div className="position-relative d-inline-block">
                    {user?.profil_url ? (
                      <Image
                        src={user.profil_url}
                        alt="Photo de profil"
                        className="rounded-circle"
                        width="120"
                        height="120"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                        style={{ width: '120px', height: '120px' }}
                      >
                        <i data-feather="user" className="text-muted" style={{ width: '48px', height: '48px' }} />
                      </div>
                    )}
                    <Badge 
                      bg="info" 
                      className="position-absolute bottom-0 end-0 rounded-circle p-2"
                      style={{ transform: 'translate(25%, 25%)' }}
                    >
                      <i data-feather="user-check" style={{ width: '12px', height: '12px' }} />
                    </Badge>
                  </div>
                </Col>
                <Col md={9}>
                  <h4 className="mb-2">{user?.name || 'Nom non renseigné'}</h4>
                  <p className="text-muted mb-2">
                    <i data-feather="mail" className="me-2" style={{ width: '16px', height: '16px' }} />
                    {user?.email || 'Email non renseigné'}
                  </p>
                  {user?.phone && (
                    <p className="text-muted mb-2">
                      <i data-feather="phone" className="me-2" style={{ width: '16px', height: '16px' }} />
                      {user.code_phone && `${user.code_phone} `}{user.phone}
                    </p>
                  )}
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <Badge bg="info" className="me-2">Formateur</Badge>
                    {user?.gender && (
                      <Badge bg={getGenderBadge(user.gender)}>{user.gender}</Badge>
                    )}
                    <Badge bg={getStatusBadge(user.status || 'En attente')}>
                      {user.status || 'En attente'}
                    </Badge>
                  </div>
                </Col>
              </Row>

              <hr className="my-4" />

              <Row>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Nom complet :</span>
                    <span className="fw-medium">{user?.name || 'Non renseigné'}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Email :</span>
                    <span className="fw-medium">{user?.email || 'Non renseigné'}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Matricule :</span>
                    <span className="fw-medium">
                      <code className="px-2 py-1 bg-primary bg-opacity-10 rounded text-primary">
                        {user?.matricule || 'Non renseigné'}
                      </code>
                    </span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Date de naissance :</span>
                    <span className="fw-medium">{formatDate(user?.birthday)}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Genre :</span>
                    <span className="fw-medium">{user?.gender || 'Non renseigné'}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Téléphone :</span>
                    <span className="fw-medium">
                      {user?.code_phone} {user?.phone || 'Non renseigné'}
                    </span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Inscrit depuis :</span>
                    <span className="fw-medium">{formatDate(user?.created_at)}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Dernière mise à jour :</span>
                    <span className="fw-medium">{formatDate(user?.updated_at)}</span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Activités récentes */}
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="activity" className="me-2" style={{ width: '20px', height: '20px' }} />
                Activités et permissions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i data-feather="book" className="text-primary me-3" style={{ width: '18px', height: '18px' }}></i>
                    <div>
                      <div className="fw-bold">Gestion des cours</div>
                      <small className="text-muted">Création et modification autorisées</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i data-feather="users" className="text-success me-3" style={{ width: '18px', height: '18px' }}></i>
                    <div>
                      <div className="fw-bold">Gestion des étudiants</div>
                      <small className="text-muted">Consultation et modification</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i data-feather="file-text" className="text-info me-3" style={{ width: '18px', height: '18px' }}></i>
                    <div>
                      <div className="fw-bold">Matières et classes</div>
                      <small className="text-muted">Accès selon les affectations</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <i data-feather="file-text" className="text-warning me-3" style={{ width: '18px', height: '18px' }}></i>
                    <div>
                      <div className="fw-bold">Gestion des evaluations</div>
                      <small className="text-muted">Création et modification</small>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
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
                <Button 
                  variant="primary"
                  as={Link}
                  to={`/admin-systeme/edit/formateur/${id}`}
                >
                  <i data-feather="edit-2" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Modifier le profil
                </Button>
                <Button 
                  variant="outline-info" 
                  as={Link} 
                  to="/admin-systeme/view/formateur"
                >
                  <i data-feather="list" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Tous les formateurs
                </Button>
                <Button 
                  variant="outline-primary" 
                  as={Link} 
                  to="/admin-systeme/dashboard"
                >
                  <i data-feather="grid" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Retour au Dashboard
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Statistiques du formateur */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="bar-chart" className="me-2" style={{ width: '20px', height: '20px' }} />
                Statut du compte
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div className="text-info mb-2">
                  <i data-feather="user-check" style={{ width: '32px', height: '32px' }} />
                </div>
                <h6 className="mb-0">Type de compte</h6>
                <h4 className="text-info mb-0">Administrateur</h4>
                <small className="text-muted">
                  Accès aux fonctionnalités pédagogiques
                </small>
              </div>
              
              <hr className="my-3" />
              
              <div className="small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Profil complété :</span>
                  <span className="fw-bold text-success">
                    {user?.profil_url && user?.birthday && user?.phone && user?.gender ? '100%' : 
                     user?.name && user?.email && user?.gender ? '85%' : 
                     user?.name && user?.email ? '70%' : '50%'}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Dernière connexion :</span>
                  <span>{formatDate(user?.updated_at)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Rôle :</span>
                  <Badge bg="info">Formateur (Rôle 2)</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Informations système */}
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="info" className="me-2 text-secondary" style={{ width: '20px', height: '20px' }} />
                Informations système
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="small">
                <div className="d-flex align-items-start mb-3">
                  <i data-feather="key" className="text-secondary me-2 mt-1" style={{ width: '16px', height: '16px' }} />
                  <div>
                    <div className="fw-medium">Matricule</div>
                    <div className="text-muted">{user.matricule}</div>
                  </div>
                </div>
                <div className="d-flex align-items-start mb-3">
                  <i data-feather="calendar" className="text-secondary me-2 mt-1" style={{ width: '16px', height: '16px' }} />
                  <div>
                    <div className="fw-medium">Date de création</div>
                    <div className="text-muted">{formatDate(user.created_at)}</div>
                  </div>
                </div>
                <div className="d-flex align-items-start mb-3">
                  <i data-feather="clock" className="text-secondary me-2 mt-1" style={{ width: '16px', height: '16px' }} />
                  <div>
                    <div className="fw-medium">Dernière modification</div>
                    <div className="text-muted">{formatDate(user.updated_at)}</div>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <i data-feather="shield" className="text-secondary me-2 mt-1" style={{ width: '16px', height: '16px' }} />
                  <div>
                    <div className="fw-medium">Niveau d'accès</div>
                    <div className="text-muted">Administrateur - Niveau 2</div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de confirmation de suppression */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>Confirmation de Suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>Êtes-vous sûr de vouloir supprimer cette administrateur ?</p>
          <div className="alert alert-warning">
            <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Cette action est irréversible. Le formateur "{user.name}" sera définitivement supprimé du système.
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>
            <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Notifications Toast */}
      <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 1050 }}>
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
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
              Notification
            </strong>
          </Toast.Header>
          <Toast.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </AdminSystemeLayout>
  );
}