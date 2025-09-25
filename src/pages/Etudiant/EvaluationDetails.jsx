import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Badge, Alert, Spinner, 
  Toast, ToastContainer, Table, ProgressBar 
} from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function EvaluationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");

  // États des données
  const [evaluation, setEvaluation] = useState(null);
  const [mesReponses, setMesReponses] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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

  // Charger les détails de l'évaluation
  const fetchEvaluationDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/etudiant/show/evaluation/${id}`);
      
      if (response.data.status === 'success') {
        setEvaluation(response.data.evaluation);
        setMesReponses(response.data.evaluation.mes_reponses || {});
      } else {
        setError(response.data.message || 'Erreur lors du chargement des détails');
      }
    } catch (err) {
      setError('Erreur lors du chargement des détails de l\'évaluation');
      console.error('Erreur:', err);
      if (err.response?.status === 404) {
        setError('Évaluation introuvable ou non accessible');
      } else if (err.response?.status === 403) {
        setError('Vous n\'avez pas l\'autorisation d\'accéder à cette évaluation');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEvaluationDetails();
    }
  }, [fetchEvaluationDetails]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [evaluation]);

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
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getScoreBadge = (pourcentage) => {
    if (pourcentage >= 80) return 'success';
    if (pourcentage >= 60) return 'primary';
    if (pourcentage >= 40) return 'warning';
    return 'danger';
  };

  const getScoreText = (pourcentage) => {
    if (pourcentage >= 80) return 'Excellent';
    if (pourcentage >= 60) return 'Bien';
    if (pourcentage >= 40) return 'Passable';
    return 'Insuffisant';
  };

  // Analyser la réponse d'une question
  const analyzeAnswer = (question, reponse) => {
    if (!reponse) {
      return {
        status: 'non_repondue',
        points: 0,
        correct: null,
        icon: 'minus-circle',
        color: 'secondary'
      };
    }

    if (question.type === 'QCM') {
      const correct = reponse.choix_selectionne_qcm === question.bonne_reponse_general;
      return {
        status: correct ? 'correcte' : 'incorrecte',
        points: correct ? question.points : 0,
        correct: correct,
        icon: correct ? 'check-circle' : 'x-circle',
        color: correct ? 'success' : 'danger'
      };
    } else {
      // Pour les questions libres, on ne peut pas évaluer automatiquement
      return {
        status: 'en_attente',
        points: 0,
        correct: null,
        icon: 'clock',
        color: 'warning'
      };
    }
  };

  if (loading) {
    return (
      <EtudiantLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des résultats...</p>
        </div>
      </EtudiantLayout>
    );
  }

  if (error || !evaluation) {
    return (
      <EtudiantLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error || 'Évaluation introuvable'}
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" as={Link} to="/etudiant/view/evaluations/my-classroom">
            <i data-feather="arrow-left" className="me-2" />
            Retour à mes évaluations
          </Button>
          <Button variant="outline-primary" onClick={fetchEvaluationDetails}>
            <i data-feather="refresh-cw" className="me-2" />
            Réessayer
          </Button>
        </div>
      </EtudiantLayout>
    );
  }

  return (
    <EtudiantLayout>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              as={Link} 
              to="/etudiant/view/evaluations/my-classroom"
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
                  {evaluation.status}
                </Badge>
                <Badge bg={getEtatTemporelBadge(evaluation.etat_temporel)} className="px-2 py-1">
                  {evaluation.etat_temporel}
                </Badge>
                {evaluation.a_participe && (
                  <Badge bg="success" className="px-2 py-1">
                    <i data-feather="check-circle" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    Participée
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Row>
        {/* Contenu principal */}
        <Col lg={8}>
          {/* Résumé des résultats */}
          {evaluation.a_participe && evaluation.pourcentage !== undefined && (
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="award" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Mes résultats
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="text-center mb-4">
                  <Col md={3}>
                    <div className="mb-2">
                      <h2 className={`text-${getScoreBadge(evaluation.pourcentage)} mb-0`}>
                        {evaluation.score_obtenu}
                      </h2>
                      <small className="text-muted">Points obtenus</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-2">
                      <h2 className={`${theme === "dark" ? "text-light" : "text-dark"} mb-0`}>
                        {evaluation.total_points}
                      </h2>
                      <small className="text-muted">Points total</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-2">
                      <h2 className={`text-${getScoreBadge(evaluation.pourcentage)} mb-0`}>
                        {evaluation.pourcentage}%
                      </h2>
                      <small className="text-muted">Pourcentage</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="mb-2">
                      <Badge bg={getScoreBadge(evaluation.pourcentage)} className="px-3 py-2 fs-6">
                        {getScoreText(evaluation.pourcentage)}
                      </Badge>
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">Progression</small>
                    <small className={`text-${getScoreBadge(evaluation.pourcentage)}`}>
                      {evaluation.pourcentage}%
                    </small>
                  </div>
                  <ProgressBar 
                    now={evaluation.pourcentage} 
                    variant={getScoreBadge(evaluation.pourcentage)}
                    style={{ height: '10px' }}
                  />
                </div>

                <Row className="g-3">
                  <Col md={6}>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Questions répondues :</span>
                      <span className={theme === "dark" ? "text-light" : "text-dark"}>
                        {Object.keys(mesReponses).length} / {evaluation.questions?.length || 0}
                      </span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Réponses correctes :</span>
                      <span className="text-success">
                        {evaluation.questions?.filter(q => {
                          const reponse = mesReponses[q.matricule];
                          return reponse && q.type === 'QCM' && reponse.choix_selectionne_qcm === q.bonne_reponse_general;
                        }).length || 0}
                      </span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Détail des réponses par question */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="help-circle" className="me-2" style={{ width: '20px', height: '20px' }} />
                Détail des réponses
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {evaluation.questions && evaluation.questions.length > 0 ? (
                evaluation.questions.map((question, index) => {
                  const reponse = mesReponses[question.matricule];
                  const analysis = analyzeAnswer(question, reponse);
                  
                  return (
                    <div 
                      key={question.id} 
                      className={`p-4 ${index < evaluation.questions.length - 1 ? 'border-bottom' : ''} ${theme === "dark" ? "border-secondary" : ""}`}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-grow-1">
                          <h6 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            <span className="me-2 text-primary">#{index + 1}</span>
                            {question.enonce}
                          </h6>
                          <div className="d-flex gap-2 mb-2">
                            <Badge bg={question.type === 'QCM' ? 'info' : 'warning'}>
                              {question.type}
                            </Badge>
                            <Badge bg="primary">{question.points} point{question.points > 1 ? 's' : ''}</Badge>
                            <Badge bg={analysis.color}>
                              <i data-feather={analysis.icon} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                              {analysis.points} / {question.points}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Image de la question si présente */}
                      {question.image && (
                        <div className="text-center mb-3">
                          <img 
                            src={question.image} 
                            alt="Image de la question" 
                            className="img-fluid rounded"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}

                      {question.type === 'QCM' ? (
                        <div>
                          <div className="row g-2">
                            {[
                              { key: 'A', text: question.choix_a },
                              { key: 'B', text: question.choix_b },
                              { key: 'C', text: question.choix_c }
                            ].filter(choix => choix.text).map((choix) => {
                              const isSelected = reponse?.choix_selectionne_qcm === choix.text;
                              const isCorrect = choix.text === question.bonne_reponse_general;
                              
                              let variant = 'outline-secondary';
                              let icon = null;
                              
                              if (isCorrect) {
                                variant = 'outline-success';
                                icon = 'check-circle';
                              } else if (isSelected && !isCorrect) {
                                variant = 'outline-danger';
                                icon = 'x-circle';
                              }

                              return (
                                <div key={choix.key} className="col-12">
                                  <div className={`p-3 border rounded ${variant.replace('outline-', 'border-')} ${
                                    isSelected ? 'bg-opacity-10' : ''
                                  } ${theme === "dark" && !isSelected ? "bg-dark" : ""}`}>
                                    <div className="d-flex align-items-center">
                                      <strong className="me-2">{choix.key}.</strong>
                                      <span className="flex-grow-1">{choix.text}</span>
                                      {icon && (
                                        <i 
                                          data-feather={icon} 
                                          className={`ms-2 ${isCorrect ? 'text-success' : 'text-danger'}`}
                                          style={{ width: '16px', height: '16px' }}
                                        ></i>
                                      )}
                                      {isSelected && (
                                        <Badge bg="primary" className="ms-2">
                                          Votre choix
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {!reponse && (
                            <div className="alert alert-warning mt-3">
                              <i data-feather="alert-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                              Vous n'avez pas répondu à cette question.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="mb-3">
                            <label className="form-label fw-bold text-muted">Votre réponse :</label>
                            <div className={`p-3 border rounded ${theme === "dark" ? "bg-secondary bg-opacity-25 border-secondary" : "bg-light"}`}>
                              {reponse?.reponse_donnee ? (
                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                  {reponse.reponse_donnee}
                                </div>
                              ) : (
                                <em className="text-muted">Aucune réponse fournie</em>
                              )}
                            </div>
                          </div>
                          
                          {question.reponse_attendue && (
                            <div className="mb-3">
                              <label className="form-label fw-bold text-success">Réponse attendue :</label>
                              <div className="p-3 border border-success rounded bg-success bg-opacity-10">
                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                  {question.reponse_attendue}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="alert alert-info">
                            <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Cette question nécessite une correction manuelle par le formateur.
                          </div>
                        </div>
                      )}

                      {/* Explication si présente */}
                      {question.explication && (
                        <div className={`mt-3 p-3 rounded border-start border-info border-4 ${theme === "dark" ? "bg-info bg-opacity-10" : "bg-info bg-opacity-5"}`}>
                          <h6 className="text-info mb-2">
                            <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Explication
                          </h6>
                          <div className={theme === "dark" ? "text-light" : "text-dark"}>
                            {question.explication}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-muted">
                  <i data-feather="help-circle" className="mb-2" style={{ width: "32px", height: "32px" }}></i>
                  <p>Aucune question disponible pour cette évaluation.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Informations de l'évaluation */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="info" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Matière :</span>
                  <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {evaluation.matiere?.nom || 'Non définie'}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Classe :</span>
                  <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {evaluation.matiere?.classroom?.name || 'Non définie'}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Date :</span>
                  <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {formatDate(evaluation.date_debut)}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Durée :</span>
                  <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {formatDuration(evaluation.duree_minutes)}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Questions :</span>
                  <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {evaluation.questions?.length || 0}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Points total :</span>
                  <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {evaluation.total_points}
                  </span>
                </div>
              </div>

              {evaluation.description && (
                <div>
                  <label className="form-label fw-bold text-muted">Description :</label>
                  <p className={theme === "dark" ? "text-light" : "text-dark"} style={{ whiteSpace: 'pre-wrap' }}>
                    {evaluation.description}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Statistiques rapides */}
          {evaluation.a_participe && (
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="bar-chart-2" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Statistiques
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <div className={`text-${getScoreBadge(evaluation.pourcentage)} mb-2`}>
                    <i data-feather="award" style={{ width: '32px', height: '32px' }} />
                  </div>
                  <h4 className={`text-${getScoreBadge(evaluation.pourcentage)} mb-0`}>
                    {evaluation.pourcentage}%
                  </h4>
                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                    {getScoreText(evaluation.pourcentage)}
                  </small>
                </div>
                
                <hr className="my-3" />
                
                <div className="small">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Réussite :</span>
                    <span className={`text-${getScoreBadge(evaluation.pourcentage)}`}>
                      {evaluation.score_obtenu}/{evaluation.total_points}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Participation :</span>
                    <Badge bg="success">Complète</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Statut :</span>
                    <Badge bg={getEtatTemporelBadge(evaluation.etat_temporel)}>
                      {evaluation.etat_temporel}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Actions */}
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="settings" className="me-2" style={{ width: '20px', height: '20px' }} />
                Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary"
                  onClick={() => window.print()}
                >
                  <i data-feather="printer" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Imprimer les résultats
                </Button>
                <Button 
                  variant="outline-secondary"
                  as={Link}
                  to="/etudiant/view/evaluations/my-classroom"
                >
                  <i data-feather="arrow-left" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Retour aux évaluations
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
    </EtudiantLayout>
  );
}