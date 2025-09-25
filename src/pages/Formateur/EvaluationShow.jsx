import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Button, Alert, Spinner, Badge, Modal, Toast, ToastContainer, Table, ProgressBar } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function EvaluationShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [theme, setTheme] = useState("light");

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

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

  // Charger les données de l'évaluation
  const fetchEvaluation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/formateur/show/evaluation/${id}`);
      setEvaluation(response.data.evaluation);
    } catch (err) {
      setError('Erreur lors du chargement de l\'évaluation');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEvaluation();
    }
  }, [fetchEvaluation]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [evaluation]);

  // Gérer le changement de statut
  const handleToggleStatus = async () => {
    try {
      await api.patch(`/formateur/toggle-status/evaluation/${id}`);
      fetchEvaluation();
      setShowStatusModal(false);
      showToastMessage("Statut de l'évaluation mis à jour", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la mise à jour du statut", 'danger');
    }
  };

  // Gérer la suppression
  const handleDelete = async () => {
    try {
      await api.delete(`/formateur/destroy/evaluation/${id}`);
      showToastMessage("Évaluation supprimée avec succès", 'success');
      setTimeout(() => {
        navigate('/formateur/view/evaluations');
      }, 1500);
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
    }
    setShowDeleteModal(false);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Programmée': return 'primary';
      case 'Brouillon': return 'warning';
      case 'Terminée': return 'success';
      case 'Annulée': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Programmée': return 'calendar';
      case 'Brouillon': return 'edit-3';
      case 'Terminée': return 'check-circle';
      case 'Annulée': return 'x-circle';
      default: return 'help-circle';
    }
  };

  const getEtatTemporelBadge = (etat) => {
    switch(etat) {
      case 'En cours': return 'success';
      case 'Future': return 'info';
      case 'Passée': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formater le temps
  const formatTime = (minutes) => {
    // Convertir les minutes décimales en secondes totales
    const totalSeconds = Math.floor(minutes * 60);
    
    // Calculer les heures, minutes et secondes
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    // Formater l'affichage
    if (hours > 0) {
      return `${hours}h ${mins}min ${secs}s`;
    } else if (mins > 0) {
      return `${mins}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDuration = (minutes) => {
    // Convertir les minutes décimales en secondes totales
    const totalSeconds = Math.floor(minutes * 60);
    
    // Calculer les heures, minutes et secondes
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    // Formater l'affichage
    if (hours > 0) {
      return `${hours}h ${mins}min ${secs}s`;
    } else if (mins > 0) {
      return `${mins}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const calculateProgress = () => {
    if (!evaluation || !evaluation.questions_count) return 0;
    return evaluation.questions_count > 0 ? 100 : 0;
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement de l'évaluation...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (error || !evaluation) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error || 'Évaluation introuvable'}
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" as={Link} to="/formateur/view/evaluations">
            <i data-feather="arrow-left" className="me-2" />
            Retour à la liste
          </Button>
          <Button variant="outline-primary" onClick={fetchEvaluation}>
            <i data-feather="refresh-cw" className="me-2" />
            Réessayer
          </Button>
        </div>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              as={Link} 
              to="/formateur/view/evaluations"
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <div>
              <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                {evaluation.titre}
              </h1>
              <div className="d-flex align-items-center gap-2 mt-1">
                <small className="text-muted">{evaluation.matricule}</small>
                <Badge bg={getStatusBadge(evaluation.status)} className="px-2 py-1">
                  <i data-feather={getStatusIcon(evaluation.status)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                  {evaluation.status}
                </Badge>
                <Badge bg={getEtatTemporelBadge(evaluation.etat_temporel)} className="px-2 py-1">
                  {evaluation.etat_temporel}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary"
            onClick={() => setShowStatusModal(true)}
            title="Changer le statut"
          >
            <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
            Statut
          </Button>
          <Button 
            variant="warning" 
            as={Link} 
            to={`/formateur/edit/evaluation/${id}`}
          >
            <i data-feather="edit" className="me-2" style={{ width: '16px', height: '16px' }} />
            Modifier
          </Button>
          <Button 
            variant="success"
            as={Link}
            to={`/formateur/evaluation/${id}/questions`}
          >
            <i data-feather="help-circle" className="me-2" style={{ width: '16px', height: '16px' }} />
            Questions ({evaluation.questions_count})
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
        {/* Contenu principal */}
        <Col lg={8}>
          {/* Informations générales */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="info" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations générales
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-4">
                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">TITRE</label>
                    <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {evaluation.titre}
                    </div>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">MATRICULE</label>
                    <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <code className="px-2 py-1 bg-primary bg-opacity-10 rounded text-primary">
                        {evaluation.matricule}
                      </code>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">CLASSE</label>
                    <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="home" className="me-2" style={{ width: '16px', height: '16px' }} />
                      {evaluation.matiere?.classroom?.name || 'Non définie'}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">MATIÈRE</label>
                    <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="book" className="me-2" style={{ width: '16px', height: '16px' }} />
                      {evaluation.matiere?.nom || 'Non définie'}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">DATE DE DÉBUT</label>
                    <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="calendar" className="me-2" style={{ width: '16px', height: '16px' }} />
                      {formatDate(evaluation.date_debut)}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">DURÉE</label>
                    <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="clock" className="me-2" style={{ width: '16px', height: '16px' }} />
                      {formatDuration(evaluation.duree_minutes)}
                    </div>
                  </div>
                </Col>

                {evaluation.date_fin && (
                  <Col md={12}>
                    <div className="mb-3">
                      <label className="small fw-bold text-muted">DATE DE FIN CALCULÉE</label>
                      <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="calendar" className="me-2" style={{ width: '16px', height: '16px' }} />
                        {formatDate(evaluation.date_fin)}
                      </div>
                    </div>
                  </Col>
                )}

                {evaluation.description && (
                  <Col md={12}>
                    <div className="mb-3">
                      <label className="small fw-bold text-muted">DESCRIPTION</label>
                      <div className={`${theme === "dark" ? "text-light" : "text-dark"}`} style={{ whiteSpace: 'pre-wrap' }}>
                        {evaluation.description}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Informations temporelles */}
          {evaluation.etat_temporel && (
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="clock" className="me-2" style={{ width: '20px', height: '20px' }} />
                  État temporel
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <Badge bg={getEtatTemporelBadge(evaluation.etat_temporel)} className="px-4 py-2 fs-6">
                    {evaluation.etat_temporel}
                  </Badge>
                </div>
                
                {evaluation.temps_avant_debut && (
                  <div className="text-center">
                    <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Commence dans <strong>{formatTime(evaluation.temps_avant_debut)}</strong>
                    </p>
                  </div>
                )}
                
                {evaluation.temps_restant && (
                  <div className="text-center">
                    <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Temps restant: <strong>{formatTime(evaluation.temps_restant)}</strong>
                    </p>
                    <ProgressBar 
                      now={((evaluation.duree_minutes - evaluation.temps_restant) / evaluation.duree_minutes) * 100}
                      variant="success"
                      className="mt-2"
                    />
                  </div>
                )}
                
                {evaluation.temps_depuis_fin && (
                  <div className="text-center">
                    <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Terminée depuis <strong>{formatTime(evaluation.temps_depuis_fin)}</strong>
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Questions de l'évaluation */}
          {evaluation.questions && evaluation.questions.length > 0 && (
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="help-circle" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Questions ({evaluation.questions.length})
                </h5>
                <Button
                  variant="outline-primary"
                  size="sm"
                  as={Link}
                  to={`/formateur/evaluation/${id}/questions`}
                >
                  <i data-feather="plus" className="me-1" style={{ width: '14px', height: '14px' }} />
                  Gérer les questions
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table className={`mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                    <thead className="table-light">
                      <tr>
                        <th>Question</th>
                        <th className="text-center">Type</th>
                        <th className="text-center">Points</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluation.questions.slice(0, 5).map((question, index) => (
                        <tr key={question.id}>
                          <td>
                            <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <strong>#{index + 1}</strong> - {question.enonce.substring(0, 80)}
                              {question.enonce.length > 80 && '...'}
                            </div>
                            <small className="text-muted">{question.matricule}</small>
                          </td>
                          <td className="text-center">
                            <Badge bg={question.type === 'QCM' ? 'info' : 'success'} className="px-2 py-1">
                              {question.type}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg="primary" className="px-2 py-1">
                              {question.points} pts
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button
                              size="sm"
                              variant="outline-info"
                              as={Link}
                              to={`/formateur/show/question/${question.id}`}
                            >
                              <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {evaluation.questions.length > 5 && (
                  <Card.Footer className="text-center">
                    <Button
                      variant="outline-primary"
                      as={Link}
                      to={`/formateur/evaluation/${id}/questions`}
                    >
                      Voir toutes les questions ({evaluation.questions.length})
                    </Button>
                  </Card.Footer>
                )}
              </Card.Body>
            </Card>
          )}
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
                  variant="success"
                  as={Link}
                  to={`/formateur/view/question/by-evaluation/${id}`}
                >
                  <i data-feather="help-circle" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Gérer les questions
                </Button>
                
                <Button 
                  variant="info"
                  as={Link}
                  to={`/formateur/evaluation/${id}/resultats`}
                >
                  <i data-feather="bar-chart-2" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Voir les résultats
                </Button>

                <Button 
                  variant="info"
                  as={Link}
                  to={`/formateur/answers/evaluation/${evaluation.matricule}`}
                >
                  <i data-feather="bar-chart-2" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Voir les résultats par etudiant
                </Button>
                
                <Button 
                  variant="outline-primary"
                  onClick={() => setShowStatusModal(true)}
                >
                  <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Changer le statut
                </Button>
                
                <Button 
                  variant="warning"
                  as={Link}
                  to={`/formateur/edit/evaluation/${id}`}
                >
                  <i data-feather="edit" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Modifier l'évaluation
                </Button>
                
                <Button 
                  variant="outline-secondary"
                  as={Link}
                  to="/formateur/view/evaluations"
                >
                  <i data-feather="list" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Toutes les évaluations
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Statistiques */}
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
                  <i data-feather="help-circle" style={{ width: '32px', height: '32px' }} />
                </div>
                <h4 className="text-primary mb-0">{evaluation.questions_count}</h4>
                <small className={theme === "dark" ? "text-light" : "text-muted"}>
                  Question(s)
                </small>
              </div>
              
              {evaluation.total_points > 0 && (
                <div className="text-center mb-3">
                  <div className="text-success mb-2">
                    <i data-feather="award" style={{ width: '24px', height: '24px' }} />
                  </div>
                  <h5 className="text-success mb-0">{evaluation.total_points}</h5>
                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                    Point(s) total
                  </small>
                </div>
              )}
              
              <hr className="my-3" />
              
              <div className="small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Progression :</span>
                  <span className={theme === "dark" ? "text-light" : "text-dark"}>
                    <ProgressBar 
                      now={calculateProgress()}
                      variant="info"
                      style={{ width: '80px', height: '8px' }}
                      className="d-inline-block"
                    />
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Créée il y a :</span>
                  <span className={theme === "dark" ? "text-light" : "text-dark"}>
                    {Math.ceil((new Date() - new Date(evaluation.created_at)) / (1000 * 60 * 60 * 24))} jour(s)
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">État :</span>
                  <Badge bg={getEtatTemporelBadge(evaluation.etat_temporel)}>
                    {evaluation.etat_temporel}
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Informations sur la matière et classe */}
          {evaluation.matiere && (
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="book" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Matière & Classe
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i data-feather="book" className="me-2 text-success" style={{ width: '18px', height: '18px' }} />
                    <strong className={theme === "dark" ? "text-light" : "text-dark"}>
                      {evaluation.matiere.nom}
                    </strong>
                  </div>
                  {evaluation.matiere.description && (
                    <p className="small text-muted mb-2">
                      {evaluation.matiere.description}
                    </p>
                  )}
                  <div className="d-flex align-items-center justify-content-between">
                    <small className="text-muted">
                      Coefficient: {evaluation.matiere.coefficient || 1}
                    </small>
                    <Badge bg="success" className="small">
                      {evaluation.matiere.status}
                    </Badge>
                  </div>
                </div>
                
                {evaluation.matiere.classroom && (
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i data-feather="home" className="me-2 text-primary" style={{ width: '18px', height: '18px' }} />
                      <strong className={theme === "dark" ? "text-light" : "text-dark"}>
                        {evaluation.matiere.classroom.name}
                      </strong>
                    </div>
                    {evaluation.matiere.classroom.description && (
                      <p className="small text-muted mb-2">
                        {evaluation.matiere.classroom.description}
                      </p>
                    )}
                    <div className="d-flex align-items-center justify-content-between">
                      <small className="text-muted">
                        {evaluation.matiere.classroom.matricule}
                      </small>
                      <Badge bg={evaluation.matiere.classroom.status === 'Open' ? 'success' : 'danger'} className="small">
                        {evaluation.matiere.classroom.status === 'Open' ? 'Ouverte' : 'Fermée'}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <Button
                    variant="outline-success"
                    size="sm"
                    as={Link}
                    to={`/formateur/view/cours/matiere/${evaluation.matiere.matricule}`}
                  >
                    <i data-feather="book-open" className="me-1" style={{ width: '14px', height: '14px' }} />
                    Voir cours
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    as={Link}
                    to={`/formateur/show/classroom/${evaluation.matiere.classroom?.id}`}
                  >
                    <i data-feather="home" className="me-1" style={{ width: '14px', height: '14px' }} />
                    Voir classe
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal de changement de statut */}
      <Modal
        show={showStatusModal}
        onHide={() => setShowStatusModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>Changer le statut de l'évaluation</Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>
            Vous allez changer le statut de l'évaluation <strong>"{evaluation.titre}"</strong>.
          </p>
          <div className="alert alert-info">
            <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Le nouveau statut sera déterminé automatiquement en fonction de l'état actuel et de la logique métier.
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleToggleStatus}>
            <i data-feather="refresh-cw" className="me-2" style={{ width: "16px", height: "16px" }} />
            Confirmer le changement
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
            Supprimer l'évaluation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>
            Êtes-vous sûr de vouloir supprimer définitivement l'évaluation <strong>"{evaluation.titre}"</strong> ?
          </p>
          <div className="alert alert-danger">
            <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            <strong>Attention :</strong> Cette action est irréversible. 
            {evaluation.questions_count > 0 && (
              <span> Cette évaluation contient {evaluation.questions_count} question(s) qui seront également supprimée(s).</span>
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
    </FormateurLayout>
  );
}