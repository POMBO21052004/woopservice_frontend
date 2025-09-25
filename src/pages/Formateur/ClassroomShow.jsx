import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Badge, Alert, Spinner, Image, Table, Modal, Form } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function ClassroomShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  // Charger les données de la salle de classe
  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/formateur/show/classroom/${id}`);
        setClassroom(response.data.classroom);
        setUsers(response.data.classroom.users || []);
      } catch (err) {
        setError('Erreur lors du chargement de la salle de classe');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClassroom();
    }
  }, [id]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [classroom, users]);

  // Changer le statut de la salle
  const handleToggleStatus = async () => {
    try {
      const response = await api.patch(`/formateur/classroom/${id}/toggle-status`);
      setClassroom(response.data.classroom);
      setShowToggleModal(false);
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
    }
  };

  // Supprimer la salle
  const handleDelete = async () => {
    try {
      await api.delete(`/formateur/destroy/classroom/${id}`);
      navigate('/formateur/view/classrooms');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      setShowDeleteModal(false);
    }
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

  const getStatusBadge = (status) => {
    return status === 'Open' ? 'success' : 'danger';
  };

  const getStatusIcon = (status) => {
    return status === 'Open' ? 'unlock' : 'lock';
  };

  const getStatusText = (status) => {
    return status === 'Open' ? 'Ouverte' : 'Fermée';
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des détails...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (error) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
        <Button variant="secondary" as={Link} to="/formateur/view/classrooms">
          <i data-feather="arrow-left" className="me-2" />
          Retour à la liste
        </Button>
      </FormateurLayout>
    );
  }

  if (!classroom) {
    return (
      <FormateurLayout>
        <Alert variant="warning" className="mb-4">
          <i data-feather="alert-triangle" className="me-2" />
          Salle de classe non trouvée
        </Alert>
        <Button variant="secondary" as={Link} to="/formateur/view/classrooms">
          <i data-feather="arrow-left" className="me-2" />
          Retour à la liste
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
              as={Link} 
              to="/formateur/view/classrooms"
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <h1 className="h3 mb-0">{classroom.name}</h1>
            <Badge 
              bg={getStatusBadge(classroom.status)} 
              className="ms-3 px-3 py-2"
            >
              <i data-feather={getStatusIcon(classroom.status)} className="me-1" style={{ width: '14px', height: '14px' }} />
              {getStatusText(classroom.status)}
            </Badge>
          </div>
          <p className="text-muted mb-0">
            <i data-feather="hash" className="me-1" style={{ width: '14px', height: '14px' }} />
            {classroom.matricule}
          </p>
        </div>
        
        <div className="d-flex gap-2">
          <Button 
            variant={classroom.status === 'Open' ? 'warning' : 'success'}
            onClick={() => setShowToggleModal(true)}
            className="d-flex align-items-center"
          >
            <i data-feather={classroom.status === 'Open' ? 'lock' : 'unlock'} className="me-2" style={{ width: '16px', height: '16px' }} />
            {classroom.status === 'Open' ? 'Fermer' : 'Ouvrir'}
          </Button>
          <Button 
            variant="primary" 
            as={Link} 
            to={`/formateur/classroom/${classroom.id}/edit`}
            className="d-flex align-items-center"
          >
            <i data-feather="edit" className="me-2" style={{ width: '16px', height: '16px' }} />
            Modifier
          </Button>
          <Button 
            variant="outline-danger"
            onClick={() => setShowDeleteModal(true)}
            className="d-flex align-items-center"
          >
            <i data-feather="trash-2" className="me-2" style={{ width: '16px', height: '16px' }} />
            Supprimer
          </Button>
        </div>
      </div>

      <Row>
        {/* Informations principales */}
        <Col lg={8} className="mb-4">
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="home" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations de la salle
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="align-items-start mb-4">
                <Col md={4} className="text-center">
                  <div className="position-relative d-inline-block">
                    <Image
                      src={classroom.image_url || "/placeholder/classroom_placeholder.png"}
                      alt="Photo de la salle"
                      className="rounded"
                      width="200"
                      height="150"
                      style={{ objectFit: 'cover' }}
                    />
                    <Badge 
                      bg={getStatusBadge(classroom.status)}
                      className="position-absolute top-0 end-0 m-2"
                    >
                      <i data-feather={getStatusIcon(classroom.status)} style={{ width: '12px', height: '12px' }} />
                    </Badge>
                  </div>
                </Col>
                <Col md={8}>
                  <h4 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>{classroom.name}</h4>
                  
                  {classroom.description && (
                    <div className="mb-3">
                      <p className={`mb-1 fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>Description :</p>
                      <p className={theme === "dark" ? "text-light" : "text-muted"}>{classroom.description}</p>
                    </div>
                  )}
                  
                  {classroom.examen && (
                    <div className="mb-3">
                      <p className={`mb-1 fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>Examen :</p>
                      <p className="text-info">
                        <i data-feather="file-text" className="me-1" style={{ width: '16px', height: '16px' }} />
                        {classroom.examen}
                      </p>
                    </div>
                  )}

                  <div className="d-flex align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center">
                      <i data-feather="users" className="me-2 text-primary" style={{ width: '18px', height: '18px' }} />
                      <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {classroom.users_count || 0} utilisateur(s)
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i data-feather="calendar" className="me-2 text-secondary" style={{ width: '18px', height: '18px' }} />
                      <span className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Créée le {formatDate(classroom.created_at)}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>

              <hr className="my-4" />

              <Row>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Matricule :</span>
                    <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>{classroom.matricule}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Statut :</span>
                    <Badge bg={getStatusBadge(classroom.status)}>
                      <i data-feather={getStatusIcon(classroom.status)} className="me-1" style={{ width: '12px', height: '12px' }} />
                      {getStatusText(classroom.status)}
                    </Badge>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Date de création :</span>
                    <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>{formatDate(classroom.created_at)}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Dernière mise à jour :</span>
                    <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>{formatDate(classroom.updated_at)}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Nombre d'utilisateurs :</span>
                    <span className={`fw-bold text-primary`}>{classroom.users_count || 0}</span>
                  </div>
                </Col>
                {classroom.examen && (
                  <Col md={6} className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Type d'examen :</span>
                      <span className={`fw-medium text-info`}>{classroom.examen}</span>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Liste des utilisateurs */}
          {users.length > 0 && (
            <Card className={`border-0 shadow-sm mt-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="users" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Utilisateurs de la salle ({users.length})
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className={`mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                    <thead className="table-light">
                      <tr>
                        <th>
                          <i data-feather="user" className="me-1" style={{ width: '14px', height: '14px' }} />
                          Utilisateur
                        </th>
                        <th className="d-none d-lg-table-cell">
                          <i data-feather="shield" className="me-1" style={{ width: '14px', height: '14px' }} />
                          Rôle
                        </th>
                        <th className="text-center">
                          <i data-feather="activity" className="me-1" style={{ width: '14px', height: '14px' }} />
                          Statut
                        </th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-3">
                                {user?.profil_url ? (
                                  <img 
                                    src={user.profil_url} 
                                    alt={user.name || "Utilisateur"}
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <i data-feather="user" className="text-muted" style={{ width: '16px', height: '16px' }} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {user.name}
                                </div>
                                <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {user.email}
                                </div>
                                {/* <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                  {user.matricule || 'Non spécifié'}
                                </small> */}
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <Badge bg="info" className="px-2 py-1">
                              {user.role === '1' ? 'Admin' : user.role === '2' ? 'Formateur' : 'Étudiant'}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge
                              bg={
                                user.status === "Connecté"
                                  ? "success"
                                  : user.status === "Déconnecté"
                                  ? "secondary"
                                  : "warning"
                              }
                              className="px-2 py-1"
                            >
                              {user.status || "Indéfini"}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button
                              size="sm"
                              variant="outline-info"
                              as={Link}
                              to={`/formateur/view/classroom/user/${user.id}`}
                              title="Voir le profil"
                            >
                              <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
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
                <Button 
                  variant="primary" 
                  as={Link} 
                  to={`/formateur/classroom/${classroom.id}/edit`}
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather="edit" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Modifier la salle
                </Button>
                
                <Button 
                  variant={classroom.status === 'Open' ? 'warning' : 'success'}
                  onClick={() => setShowToggleModal(true)}
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather={classroom.status === 'Open' ? 'lock' : 'unlock'} className="me-2" style={{ width: '18px', height: '18px' }} />
                  {classroom.status === 'Open' ? 'Fermer la salle' : 'Ouvrir la salle'}
                </Button>
                
                <Button 
                  variant="outline-info" 
                  as={Link} 
                  to={`/formateur/view/classroom/${classroom.id}/users`}
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather="users" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Gérer les utilisateurs ({classroom.users_count || 0})
                </Button>

                <Button 
                  variant="outline-info" 
                  as={Link} 
                  to={`/formateur/matiere/by-classroom/${classroom.matricule}`}
                  title="Voir toutes les matières de cette classe"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather="book" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Gérer les matieres ({classroom.matieres_count || 0})
                </Button>

                <Button 
                  variant="outline-info" 
                  as={Link} 
                  to={`/formateur/view/cours/classroom/${classroom.matricule}`}
                  title="Voir toutes les matières de cette classe"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather="book" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Gérer les cours ({classroom.matieres?.cours?.length || 0})
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

          {/* Statistiques de la salle */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="bar-chart-2" className="me-2" style={{ width: '20px', height: '20px' }} />
                Statistiques
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div className="text-primary mb-2">
                  <i data-feather="users" style={{ width: '32px', height: '32px' }} />
                </div>
                <h4 className="text-primary mb-0">{classroom.users_count || 0}</h4>
                <small className={theme === "dark" ? "text-light" : "text-muted"}>
                  Utilisateur(s) assigné(s)
                </small>
              </div>
              
              <hr className="my-3" />
              
              <div className="small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Statut actuel :</span>
                  <Badge bg={getStatusBadge(classroom.status)}>
                    {getStatusText(classroom.status)}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Créée il y a :</span>
                  <span className={theme === "dark" ? "text-light" : "text-dark"}>
                    {Math.ceil((new Date() - new Date(classroom.created_at)) / (1000 * 60 * 60 * 24))} jour(s)
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Type de salle :</span>
                  <span className={theme === "dark" ? "text-light" : "text-dark"}>
                    {classroom.examen ? 'Avec examen' : 'Standard'}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Informations système */}
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="info" className="me-2 text-info" style={{ width: '20px', height: '20px' }} />
                Informations système
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="small">
                <div className="d-flex align-items-start mb-3">
                  <i data-feather="hash" className="text-info me-2 mt-1" style={{ width: '16px', height: '16px' }} />
                  <div>
                    <div className="fw-medium">Matricule</div>
                    <div className={`text-muted font-monospace ${theme === "dark" ? "text-light" : ""}`}>{classroom.matricule}</div>
                  </div>
                </div>
                <div className="d-flex align-items-start mb-3">
                  <i data-feather="calendar" className="text-info me-2 mt-1" style={{ width: '16px', height: '16px' }} />
                  <div>
                    <div className="fw-medium">Date de création</div>
                    <div className={`text-muted ${theme === "dark" ? "text-light" : ""}`}>{formatDate(classroom.created_at)}</div>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <i data-feather="clock" className="text-info me-2 mt-1" style={{ width: '16px', height: '16px' }} />
                  <div>
                    <div className="fw-medium">Dernière modification</div>
                    <div className={`text-muted ${theme === "dark" ? "text-light" : ""}`}>{formatDate(classroom.updated_at)}</div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de changement de statut */}
      <Modal
        show={showToggleModal}
        onHide={() => setShowToggleModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>
            <i data-feather="edit" className="me-2" style={{ width: "20px", height: "20px" }} />
            Changer le statut de la salle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>
            Vous allez {classroom.status === 'Open' ? 'fermer' : 'ouvrir'} la salle <strong>"{classroom.name}"</strong>.
          </p>
          <div className={`alert ${classroom.status === 'Open' ? 'alert-warning' : 'alert-success'}`}>
            <i data-feather={classroom.status === 'Open' ? 'lock' : 'unlock'} className="me-2" style={{ width: "16px", height: "16px" }}></i>
            {classroom.status === 'Open' 
              ? 'Une fois fermée, la salle ne sera plus accessible aux utilisateurs.'
              : 'Une fois ouverte, la salle sera accessible à tous les utilisateurs assignés.'
            }
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowToggleModal(false)}>
            Annuler
          </Button>
          <Button 
            variant={classroom.status === 'Open' ? 'warning' : 'success'} 
            onClick={handleToggleStatus}
          >
            <i data-feather={classroom.status === 'Open' ? 'lock' : 'unlock'} className="me-2" style={{ width: "16px", height: "16px" }} />
            {classroom.status === 'Open' ? 'Fermer' : 'Ouvrir'} la salle
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de suppression */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>
            <i data-feather="trash-2" className="me-2 text-danger" style={{ width: "20px", height: "20px" }} />
            Supprimer la salle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>
            Êtes-vous sûr de vouloir supprimer définitivement la salle <strong>"{classroom.name}"</strong> ?
          </p>
          <div className="alert alert-danger">
            <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            <strong>Attention :</strong> Cette action est irréversible. 
            {classroom.users_count > 0 && (
              <span> Cette salle contient {classroom.users_count} utilisateur(s) qui devront être réassignés.</span>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }} />
            Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>
    </FormateurLayout>
  );
}