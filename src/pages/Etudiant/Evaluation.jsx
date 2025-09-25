import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Badge, Alert, Spinner, Toast, ToastContainer, 
  Collapse, ProgressBar, Modal
} from "react-bootstrap";
import { Link } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function EvaluationsEtudiant() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [classroom, setClassroom] = useState({});
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationsGroupees, setEvaluationsGroupees] = useState({});
  const [prochaineEvaluation, setProchaineEvaluation] = useState(null);

  // États de l'accordion
  const [openSections, setOpenSections] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modal de confirmation d'accès
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // Timer pour actualiser les données
  const [refreshTimer, setRefreshTimer] = useState(null);

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

  // Charger les évaluations de la classe de l'étudiant
  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/etudiant/view/evaluations/my-classroom');
      
      if (response.data.status === 'success') {
        setClassroom(response.data.classroom || {});
        setEvaluations(response.data.evaluations || []);
        setEvaluationsGroupees(response.data.evaluations_groupees_par_matiere || {});
        setProchaineEvaluation(response.data.prochaine_evaluation || null);
      } else {
        showToastMessage(response.data.message || "Erreur lors du chargement des évaluations", 'danger');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des évaluations:', err);
      const errorMessage = err.response?.data?.message || "Erreur lors du chargement des évaluations";
      showToastMessage(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvaluations();

    // Actualiser les données toutes les minutes
    const timer = setInterval(() => {
      fetchEvaluations();
    }, 60000);

    setRefreshTimer(timer);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [fetchEvaluations]);

  useEffect(() => {
    feather.replace();
  }, [evaluationsGroupees, prochaineEvaluation]);

  // Gérer l'accordion
  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Confirmer l'accès à une évaluation
  const confirmAccess = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowAccessModal(true);
  };

  const handleAccessEvaluation = () => {
    if (selectedEvaluation) {
      window.location.href = `/etudiant/evaluation/${selectedEvaluation.id}/start`;
    }
    setShowAccessModal(false);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Programmée': return 'primary';
      case 'Terminée': return 'success';
      default: return 'secondary';
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

  const getEtatTemporelIcon = (etat) => {
    switch(etat) {
      case 'En cours': return 'play-circle';
      case 'Future': return 'clock';
      case 'Passée': return 'check-circle';
      default: return 'help-circle';
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

  const formatTempsRestant = (minutes) => {

    if (minutes > 0) {

      if (minutes <= 0)  {
        return "Expiré";
      }
      
      // Convertir les minutes décimales en secondes totales pour plus de précision
      const totalSeconds = Math.floor(minutes * 60);
      
      // Si moins d'une heure, afficher minutes et secondes
      if (minutes < 60) {
        const mins = Math.floor(minutes);
        const secs = totalSeconds % 60;
        return mins > 0 ? `${mins}min ${secs}s` : `${secs}s`;
      }
      
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.floor(minutes % 60);
      const remainingSeconds = totalSeconds % 60;
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
      }
      
      // Pour les durées en heures, inclure les secondes seulement si pertinent
      if (remainingMinutes > 0) {
        return remainingSeconds > 0 ? `${hours}h ${remainingMinutes}min ${remainingSeconds}s` : `${hours}h ${remainingMinutes}min`;
      } else {
        return remainingSeconds > 0 ? `${hours}h ${remainingSeconds}s` : `${hours}h`;
      }

    } else {
      
      if (-minutes <= 0)  {
        return "Expiré";
      }
      
      // Convertir les minutes décimales en secondes totales pour plus de précision
      const totalSeconds = Math.floor(minutes * 60);
      
      // Si moins d'une heure, afficher minutes et secondes
      if (-minutes < 60) {
        const mins = Math.floor(-minutes);
        const secs = totalSeconds % 60;
        return mins > 0 ? `${mins}min ${secs}s` : `${secs}s`;
      }
      
      const hours = Math.floor(-minutes / 60);
      const remainingMinutes = Math.floor(-minutes % 60);
      const remainingSeconds = totalSeconds % 60;
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
      }
      
      // Pour les durées en heures, inclure les secondes seulement si pertinent
      if (remainingMinutes > 0) {
        return remainingSeconds > 0 ? `${hours}h ${remainingMinutes}min ${remainingSeconds}s` : `${hours}h ${remainingMinutes}min`;
      } else {
        return remainingSeconds > 0 ? `${hours}h ${remainingSeconds}s` : `${hours}h`;
      }

    }
    
  };

  if (loading) {
    return (
      <EtudiantLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement de vos évaluations...</p>
        </div>
      </EtudiantLayout>
    );
  }

  return (
    <EtudiantLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                <i data-feather="clipboard" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Mes Évaluations - {classroom.name || 'Ma Classe'}
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Évaluations organisées par matière • {evaluations.length} évaluation{evaluations.length !== 1 ? 's' : ''} disponible{evaluations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline-primary"
              onClick={fetchEvaluations}
              title="Actualiser"
            >
              <i data-feather="refresh-cw" style={{ width: "16px", height: "16px" }}></i>
            </Button>
          </div>

          {/* Prochaine évaluation */}
          {prochaineEvaluation && (
            <Alert variant="info" className="mb-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i data-feather="clock" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  <div>
                    <strong>Prochaine évaluation :</strong> {prochaineEvaluation.titre}
                    <div className="small">
                      <i data-feather="book" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                      {prochaineEvaluation.matiere?.nom} • 
                      <i data-feather="calendar" className="ms-2 me-1" style={{ width: "12px", height: "12px" }}></i>
                      {formatDate(prochaineEvaluation.date_debut)} • 
                      <i data-feather="clock" className="ms-2 me-1" style={{ width: "12px", height: "12px" }}></i>
                      {formatDuration(prochaineEvaluation.duree_minutes)}
                    </div>
                    <div className="small text-muted mt-1">
                      Dans {formatTempsRestant(prochaineEvaluation.temps_avant_debut)}
                    </div>
                  </div>
                </div>
                <Badge bg="warning" className="px-3 py-2">
                  <i data-feather="clock" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                  À venir
                </Badge>
              </div>
            </Alert>
          )}

          {/* Statistiques rapides */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {evaluations.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="clipboard" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-success">
                        {evaluations.filter(e => e.etat_temporel === 'En cours').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        En cours
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="play-circle" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-info">
                        {evaluations.filter(e => e.etat_temporel === 'Future').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        À venir
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="clock" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-secondary">
                        {evaluations.filter(e => e.a_participe).length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Participées
                      </small>
                    </div>
                    <div className="text-secondary">
                      <i data-feather="check-circle" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Panneau principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex align-items-center">
              <i data-feather="layers" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Évaluations par Matière
              </span>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Évaluations groupées par matière */}
            {Object.keys(evaluationsGroupees).length > 0 ? (
              <div className="evaluation-groups">
                {Object.entries(evaluationsGroupees).map(([nomMatiere, evaluationsList]) => (
                  <Card key={nomMatiere} className={`mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header 
                      className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
                      onClick={() => toggleSection(`matiere-${nomMatiere}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i data-feather="book" className="text-success me-3" style={{ width: "20px", height: "20px" }}></i>
                          <div>
                            <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomMatiere}</h5>
                            <small className="text-muted">
                              {evaluationsList.length} évaluation{evaluationsList.length > 1 ? 's' : ''}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="success">{evaluationsList.length} éval.</Badge>
                          {evaluationsList.some(e => e.etat_temporel === 'En cours') && (
                            <Badge bg="warning">En cours</Badge>
                          )}
                          <i 
                            data-feather={openSections[`matiere-${nomMatiere}`] ? "chevron-up" : "chevron-down"} 
                            className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                            style={{ width: "20px", height: "20px" }}
                          ></i>
                        </div>
                      </div>
                    </Card.Header>
                    
                    <Collapse in={openSections[`matiere-${nomMatiere}`] !== false}>
                      <Card.Body className={theme === "dark" ? "bg-dark" : ""}>
                        <Row className="g-3">
                          {evaluationsList.map((evaluation) => (
                            <Col key={evaluation.id} md={6} lg={4}>
                              <Card className={`h-100 border ${theme === "dark" ? "bg-dark border-secondary" : "bg-white"} ${evaluation.etat_temporel === 'En cours' ? 'border-success' : ''}`}>
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <Badge 
                                      bg={getEtatTemporelBadge(evaluation.etat_temporel)} 
                                      className="mb-2"
                                    >
                                      <i data-feather={getEtatTemporelIcon(evaluation.etat_temporel)} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                                      {evaluation.etat_temporel}
                                    </Badge>
                                    {evaluation.a_participe && (
                                      <Badge bg="secondary" className="mb-2 ms-1">
                                        <i data-feather="check-circle" className="me-1" style={{ width: '10px', height: '10px' }}></i>
                                        Fait
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <h6 className={`${theme === "dark" ? "text-light" : "text-dark"} mb-2`}>
                                    {evaluation.titre.length > 45 ? 
                                      evaluation.titre.substring(0, 45) + "..." : 
                                      evaluation.titre
                                    }
                                  </h6>
                                  
                                  <small className="text-muted d-block mb-2">Code: {evaluation.matricule}</small>
                                  
                                  {evaluation.description && (
                                    <p className={`small ${theme === "dark" ? "text-light" : "text-muted"} mb-2`}>
                                      {evaluation.description.length > 80 ? 
                                        evaluation.description.substring(0, 80) + "..." : 
                                        evaluation.description
                                      }
                                    </p>
                                  )}
                                  
                                  <div className="d-flex flex-wrap gap-1 mb-2">
                                    <Badge bg="info" className="small">
                                      {evaluation.questions_count} questions
                                    </Badge>
                                    <Badge bg="primary" className="small">
                                      {evaluation.total_points} pts
                                    </Badge>
                                    <Badge bg="secondary" className="small">
                                      {formatDuration(evaluation.duree_minutes)}
                                    </Badge>
                                  </div>
                                  
                                  <div className="small text-muted mb-3">
                                    <div className="d-flex align-items-center mb-1">
                                      <i data-feather="calendar" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                      {formatDate(evaluation.date_debut)}
                                    </div>
                                    
                                    {evaluation.etat_temporel === 'Future' && (
                                      <div className="text-info">
                                        <i data-feather="clock" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                        Dans {formatTempsRestant(evaluation.temps_avant_debut)}
                                      </div>
                                    )}
                                    
                                    {evaluation.etat_temporel === 'En cours' && (
                                      <div className="text-success">
                                        <i data-feather="play-circle" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                        Temps restant: {formatTempsRestant(evaluation.temps_restant)}
                                      </div>
                                    )}
                                    
                                    {evaluation.etat_temporel === 'Passée' && evaluation.a_participe && evaluation.pourcentage !== undefined && (
                                      <div className="text-primary">
                                        <i data-feather="award" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                        Score: {evaluation.score_obtenu}/{evaluation.total_points} ({evaluation.pourcentage}%)
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="d-flex gap-1">
                                    {evaluation.peut_acceder && !evaluation.a_participe && (
                                      <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => confirmAccess(evaluation)}
                                        className="flex-fill"
                                      >
                                        <i data-feather="play-circle" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                                        Commencer
                                      </Button>
                                    )}
                                    
                                    {!evaluation.peut_acceder && evaluation.etat_temporel === 'Future' && (
                                      <Button
                                        size="sm"
                                        variant="outline-info"
                                        disabled
                                        className="flex-fill"
                                      >
                                        <i data-feather="clock" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                                        Pas encore
                                      </Button>
                                    )}
                                    
                                    {evaluation.a_participe && (
                                      <Button
                                        size="sm"
                                        variant="outline-primary"
                                        as={Link}
                                        to={`/etudiant/evaluation/${evaluation.id}/details`}
                                        className="flex-fill"
                                      >
                                        <i data-feather="eye" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                                        Voir résultat
                                      </Button>
                                    )}
                                    
                                    {evaluation.etat_temporel === 'Passée' && !evaluation.a_participe && (
                                      <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        disabled
                                        className="flex-fill"
                                      >
                                        <i data-feather="x-circle" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                                        Expiré
                                      </Button>
                                    )}
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Card.Body>
                    </Collapse>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="clipboard" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucune évaluation disponible</h6>
                    <p className="small mb-0">
                      Votre classe n'a pas encore d'évaluations programmées.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Modal de confirmation d'accès */}
        <Modal
          show={showAccessModal}
          onHide={() => setShowAccessModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>
              <i data-feather="play-circle" className="me-2 text-success" style={{ width: "20px", height: "20px" }} />
              Commencer l'évaluation
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedEvaluation && (
              <div>
                <h5>{selectedEvaluation.titre}</h5>
                <p className="text-muted mb-3">
                  <i data-feather="book" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  {selectedEvaluation.matiere?.nom} • {selectedEvaluation.matiere?.classroom?.name}
                </p>
                
                <div className="alert alert-info">
                  <div className="row">
                    <div className="col-6">
                      <strong>Questions:</strong> {selectedEvaluation.questions_count}
                    </div>
                    <div className="col-6">
                      <strong>Points:</strong> {selectedEvaluation.total_points}
                    </div>
                    <div className="col-6">
                      <strong>Durée:</strong> {formatDuration(selectedEvaluation.duree_minutes)}
                    </div>
                    <div className="col-6">
                      <strong>Temps restant:</strong> {formatTempsRestant(selectedEvaluation.temps_restant)}
                    </div>
                  </div>
                </div>
                
                <div className="alert alert-warning">
                  <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  <strong>Attention :</strong> Une fois commencée, vous ne pourrez pas interrompre l'évaluation. 
                  Assurez-vous d'avoir une connexion stable.
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowAccessModal(false)}>
              Annuler
            </Button>
            <Button variant="success" onClick={handleAccessEvaluation}>
              <i data-feather="play-circle" className="me-2" style={{ width: "16px", height: "16px" }} />
              Commencer maintenant
            </Button>
          </Modal.Footer>
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
                Notification
              </strong>
            </Toast.Header>
            <Toast.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              {toastMessage}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
    </EtudiantLayout>
  );
}