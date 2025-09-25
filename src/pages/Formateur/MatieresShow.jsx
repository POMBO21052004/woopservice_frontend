import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Badge, Alert, Spinner, Image, Table, Modal, ProgressBar } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function MatiereShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matiere, setMatiere] = useState(null);
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

  // Charger les données de la matière
  useEffect(() => {
    const fetchMatiere = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/formateur/show/matiere/${id}`);
        setMatiere(response.data.matiere);
      } catch (err) {
        setError('Erreur lors du chargement de la matière');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMatiere();
    }
  }, [id]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [matiere]);

  // Changer le statut de la matière
  const handleToggleStatus = async () => {
    try {
      const response = await api.patch(`/formateur/toggle-status/matiere/${id}`);
      setMatiere(response.data.matiere);
      setShowToggleModal(false);
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
      setError(err.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  // Supprimer la matière
  const handleDelete = async () => {
    try {
      await api.delete(`/formateur/destroy/matiere/${id}`);
      navigate('/formateur/view/matiere');
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
    switch(status) {
      case 'Active': return 'success';
      case 'Inactive': return 'warning';
      case 'Suspendue': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Active': return 'check-circle';
      case 'Inactive': return 'pause-circle';
      case 'Suspendue': return 'x-circle';
      default: return 'help-circle';
    }
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
        <Button variant="secondary" as={Link} to="/formateur/view/matieres">
          <i data-feather="arrow-left" className="me-2" />
          Retour à la liste
        </Button>
      </FormateurLayout>
    );
  }

  if (!matiere) {
    return (
      <FormateurLayout>
        <Alert variant="warning" className="mb-4">
          <i data-feather="alert-triangle" className="me-2" />
          Matière non trouvée
        </Alert>
        <Button variant="secondary" as={Link} to="/formateur/view/matieres">
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
              to="/formateur/view/matieres"
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <h1 className="h3 mb-0">{matiere.nom}</h1>
            <Badge 
              bg={getStatusBadge(matiere.status)} 
              className="ms-3 px-3 py-2"
            >
              <i data-feather={getStatusIcon(matiere.status)} className="me-1" style={{ width: '14px', height: '14px' }} />
              {matiere.status}
            </Badge>
          </div>
          <p className="text-muted mb-0">
            <i data-feather="hash" className="me-1" style={{ width: '14px', height: '14px' }} />
            {matiere.matricule}
          </p>
        </div>
        
        <div className="d-flex gap-2">
          <Button 
            variant="warning"
            onClick={() => setShowToggleModal(true)}
            className="d-flex align-items-center"
          >
            <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
            Changer statut
          </Button>
          <Button 
            variant="primary" 
            as={Link} 
            to={`/formateur/edit/matiere/${matiere.id}`}
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
                <i data-feather="book" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations de la matière
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="align-items-start mb-4">
                <Col md={4} className="text-center">
                  <div className="position-relative d-inline-block">
                    <Image
                      src={matiere.image_url || "/placeholder/matiere_placeholder.png"}
                      alt="Image de la matière"
                      className="rounded"
                      width="200"
                      height="150"
                      style={{ objectFit: 'cover' }}
                    />
                    <Badge 
                      bg={getStatusBadge(matiere.status)}
                      className="position-absolute top-0 end-0 m-2"
                    >
                      <i data-feather={getStatusIcon(matiere.status)} style={{ width: '12px', height: '12px' }} />
                    </Badge>
                  </div>
                </Col>
                <Col md={8}>
                  <div className="mb-3">
                    <h4 className={theme === "dark" ? "text-light" : "text-dark"}>{matiere.nom}</h4>
                    <p className="text-muted mb-2">
                      <i data-feather="hash" className="me-1" style={{ width: '14px', height: '14px' }} />
                      Matricule: {matiere.matricule}
                    </p>
                    <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {matiere.description || 'Aucune description disponible'}
                    </p>
                  </div>
                  
                  <Row className="g-3">
                    <Col sm={6}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                            <i data-feather="home" className="me-2 text-primary" style={{ width: '16px', height: '16px' }} />
                            <div>
                                <small className="text-muted">Classe</small>
                                <p className={`mb-0 fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {matiere.classroom?.name || 'Non définie'}
                                </p>
                            </div>
                            </div>
                            {matiere.classroom && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                as={Link}
                                to={`/formateur/matiere/by-classroom/${matiere.classroom.matricule}`}
                                title="Voir toutes les matières de cette classe"
                            >
                                <i data-feather="external-link" style={{ width: '12px', height: '12px' }} />
                            </Button>
                            )}
                        </div>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex align-items-center">
                        <i data-feather="award" className="me-2 text-success" style={{ width: '16px', height: '16px' }} />
                        <div>
                          <small className="text-muted">Coefficient</small>
                          <p className={`mb-0 fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {matiere.coefficient || 1}
                          </p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>

              {/* Statistiques de contenu */}
              <Row className="g-3">
                <Col md={6}>
                  <Card className={`border-0 ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body className="text-center py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="mb-0 text-primary">{matiere.cours_count || 0}</h3>
                          <small className={theme === "dark" ? "text-light" : "text-muted"}>Cours</small>
                        </div>
                        <i data-feather="book-open" className="text-primary" style={{ width: '24px', height: '24px' }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className={`border-0 ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body className="text-center py-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h3 className="mb-0 text-success">{matiere.evaluations_count || 0}</h3>
                          <small className={theme === "dark" ? "text-light" : "text-muted"}>Évaluations</small>
                        </div>
                        <i data-feather="clipboard" className="text-success" style={{ width: '24px', height: '24px' }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Cours récents */}
          {matiere.cours && matiere.cours.length > 0 && (
            <Card className={`border-0 shadow-sm mt-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="book-open" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Cours récents ({matiere.cours.length})
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className={theme === "dark" ? "table-dark" : ""}>
                    <thead>
                      <tr>
                        <th>Titre</th>
                        <th className="d-none d-md-table-cell">Statut</th>
                        <th className="d-none d-lg-table-cell">Date</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matiere.cours.slice(0, 5).map((cours) => (
                        <tr key={cours.id}>
                          <td>
                            <div>
                              <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {cours.titre}
                              </div>
                              {cours.description && (
                                <small className="text-muted">
                                  {cours.description.length > 50 
                                    ? cours.description.substring(0, 50) + "..."
                                    : cours.description
                                  }
                                </small>
                              )}
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <Badge bg={cours.status === 'Publie' ? 'success' : 'warning'}>
                              {cours.status}
                            </Badge>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <small className="text-muted">
                              {formatDate(cours.created_at)}
                            </small>
                          </td>
                          <td className="text-center">
                            <Button size="sm" variant="outline-primary">
                              <i data-feather="eye" style={{ width: '14px', height: '14px' }} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {matiere.cours.length > 5 && (
                  <div className="text-center mt-3">
                    <Button variant="outline-primary" size="sm">
                      Voir tous les cours ({matiere.cours.length})
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Évaluations récentes */}
          {matiere.evaluations && matiere.evaluations.length > 0 && (
            <Card className={`border-0 shadow-sm mt-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="clipboard" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Évaluations récentes ({matiere.evaluations.length})
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className={theme === "dark" ? "table-dark" : ""}>
                    <thead>
                      <tr>
                        <th>Titre</th>
                        <th className="d-none d-md-table-cell">Durée</th>
                        <th className="d-none d-md-table-cell">Statut</th>
                        <th className="d-none d-lg-table-cell">Date début</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matiere.evaluations.slice(0, 5).map((evaluation) => (
                        <tr key={evaluation.id}>
                          <td>
                            <div>
                              <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {evaluation.titre}
                              </div>
                              {evaluation.description && (
                                <small className="text-muted">
                                  {evaluation.description.length > 50 
                                    ? evaluation.description.substring(0, 50) + "..."
                                    : evaluation.description
                                  }
                                </small>
                              )}
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <small className="text-info">
                              {evaluation.duree_minutes} min
                            </small>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <Badge bg={evaluation.status === 'Active' ? 'success' : 'warning'}>
                              {evaluation.status}
                            </Badge>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <small className="text-muted">
                              {formatDate(evaluation.date_debut)}
                            </small>
                          </td>
                          <td className="text-center">
                            <Button size="sm" variant="outline-primary">
                              <i data-feather="eye" style={{ width: '14px', height: '14px' }} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {matiere.evaluations.length > 5 && (
                  <div className="text-center mt-3">
                    <Button variant="outline-primary" size="sm">
                      Voir toutes les évaluations ({matiere.evaluations.length})
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Informations système */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="info" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations système
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Date de création</span>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  {formatDate(matiere.created_at)}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Dernière modification</span>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  {formatDate(matiere.updated_at)}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Statut actuel</span>
                <Badge bg={getStatusBadge(matiere.status)} className="px-3 py-2">
                  <i data-feather={getStatusIcon(matiere.status)} className="me-1" style={{ width: '12px', height: '12px' }} />
                  {matiere.status}
                </Badge>
              </div>
            </Card.Body>
          </Card>

          {/* Actions rapides */}
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="zap" className="me-2" style={{ width: '20px', height: '20px' }} />
                Actions rapides
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                    variant="outline-primary" 
                    className="d-flex align-items-center justify-content-center"
                    as={Link}
                    to={`/formateur/view/cours/matiere/${matiere.matricule}`}
                    title="Voir toutes les matières de cette classe"
                >
                  <i data-feather="plus" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Voir les cours
                </Button>
                <Button variant="outline-success" className="d-flex align-items-center justify-content-center">
                  <i data-feather="clipboard" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Créer une évaluation
                </Button>
                <Button variant="outline-info" className="d-flex align-items-center justify-content-center">
                  <i data-feather="users" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Voir les étudiants
                </Button>
                <Button 
                  variant="outline-warning" 
                  className="d-flex align-items-center justify-content-center"
                  onClick={() => setShowToggleModal(true)}
                >
                  <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Changer le statut
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal changement de statut */}
      <Modal
        show={showToggleModal}
        onHide={() => setShowToggleModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>Changer le statut de la matière</Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>
            Voulez-vous changer le statut de la matière <strong>{matiere.nom}</strong> ?
          </p>
          <p className="text-muted">
            Statut actuel : <Badge bg={getStatusBadge(matiere.status)}>{matiere.status}</Badge>
          </p>
          <Alert variant="info" className="small">
            <i data-feather="info" className="me-1" style={{ width: '14px', height: '14px' }} />
            Les statuts suivent ce cycle : Active → Inactive → Suspendue → Active
          </Alert>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowToggleModal(false)}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleToggleStatus}>
            <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
            Changer le statut
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
          <Modal.Title>Supprimer la matière</Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <div className="text-center mb-3">
            <i data-feather="alert-triangle" className="text-danger" style={{ width: '48px', height: '48px' }} />
          </div>
          <p className="text-center">
            Êtes-vous sûr de vouloir supprimer la matière <strong>{matiere.nom}</strong> ?
          </p>
          <Alert variant="danger" className="small">
            <i data-feather="alert-circle" className="me-1" style={{ width: '14px', height: '14px' }} />
            Cette action est irréversible. Tous les cours et évaluations associés doivent être supprimés au préalable.
          </Alert>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <i data-feather="trash-2" className="me-2" style={{ width: '16px', height: '16px' }} />
            Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>
    </FormateurLayout>
  );
}