import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Table, Badge, Alert, 
  Spinner, ProgressBar, Modal, Form 
} from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function EvaluationResultats() {
  const { evaluationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [evaluation, setEvaluation] = useState(null);
  const [resultats, setResultats] = useState([]);
  const [statistiques, setStatistiques] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

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

  // Charger les résultats
  const fetchResultats = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/formateur/evaluation/${evaluationId}/resultats`);
      setEvaluation(response.data.evaluation);
      setResultats(response.data.resultats || []);
      setStatistiques(response.data.statistiques || {});
      
    } catch (err) {
      console.error('Erreur lors du chargement des résultats:', err);
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    if (evaluationId) {
      fetchResultats();
    }
  }, [fetchResultats]);

  useEffect(() => {
    feather.replace();
  }, [resultats]);

  const getPourcentageColor = (pourcentage) => {
    if (pourcentage >= 80) return 'success';
    if (pourcentage >= 60) return 'warning';
    return 'danger';
  };

  const getRangBadge = (rang) => {
    if (rang === 1) return 'gold';
    if (rang === 2) return 'silver';  
    if (rang === 3) return 'bronze';
    return 'secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openDetailModal = (resultat) => {
    setSelectedResult(resultat);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des résultats...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (!evaluation) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          Évaluation introuvable
        </Alert>
        <Button variant="secondary" as={Link} to="/formateur/view/evaluations">
          <i data-feather="arrow-left" className="me-2" />
          Retour à la liste
        </Button>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className="d-flex align-items-center mb-2">
              <Button 
                variant="outline-secondary" 
                size="sm"
                as={Link} 
                to={`/formateur/show/evaluation/${evaluationId}`}
                className="me-3"
              >
                <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
                Retour
              </Button>
              <div>
                <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Résultats de l'évaluation
                </h1>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  {evaluation.titre} - {resultats.length} participant(s)
                </p>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-info"
              as={Link}
              to={`/formateur/evaluation/${evaluationId}/questions`}
            >
              <i data-feather="help-circle" className="me-2" style={{ width: '16px', height: '16px' }} />
              Questions
            </Button>
          </div>
        </div>

        {/* Informations de l'évaluation */}
        <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body>
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
                    <i data-feather="bar-chart-2" className="text-success" style={{ width: "20px", height: "20px" }}></i>
                  </div>
                  <div>
                    <h5 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {evaluation.titre}
                    </h5>
                    <div className="d-flex gap-2 align-items-center">
                      <small className="text-muted">{evaluation.matricule}</small>
                      <Badge bg="success">{evaluation.status}</Badge>
                      <small className="text-muted">•</small>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        <i data-feather="users" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        {evaluation.matiere?.classroom?.name}
                      </small>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-end">
                  <div className={`h4 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {evaluation.questions_count} questions
                  </div>
                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                    {evaluation.total_points} points total
                  </small>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Statistiques générales */}
        {Object.keys(statistiques).length > 0 && (
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {statistiques.nombre_participants || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Participants
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="users" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistiques.moyenne ? statistiques.moyenne.toFixed(1) : 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Moyenne
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="trending-up" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistiques.meilleur_score ? statistiques.meilleur_score.toFixed(1) : 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Meilleur score
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="award" style={{ width: "24px", height: "24px" }}></i>
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
                      <h3 className="mb-0 text-warning">
                        {statistiques.plus_faible_score ? statistiques.plus_faible_score.toFixed(1) : 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Plus faible score
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="trending-down" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Résultats par étudiant */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="users" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Classement des étudiants
                </span>
              </div>
              <Badge bg="info" className="px-3 py-2">
                {resultats.length} résultat(s)
              </Badge>
            </div>
          </Card.Header>

          <Card.Body className={`p-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            {resultats.length > 0 ? (
              <div className="table-responsive">
                <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                  <thead className="table-primary">
                    <tr>
                      <th width="80" className="text-center">Rang</th>
                      <th>Étudiant</th>
                      <th className="text-center">Score</th>
                      <th className="text-center">Progression</th>
                      <th className="text-center">Questions</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultats.map((resultat, index) => (
                      <tr key={resultat.etudiant?.matricule || index}>
                        <td className="text-center">
                          <div className={`d-inline-flex align-items-center justify-content-center rounded-circle ${index < 3 ? 'text-white' : 'text-primary bg-primary bg-opacity-10'}`} 
                               style={{ 
                                 width: '35px', 
                                 height: '35px',
                                 backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'transparent'
                               }}>
                            <strong>#{index + 1}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className={`me-2 p-2 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                              <i data-feather="user" className="text-info" style={{ width: "16px", height: "16px" }}></i>
                            </div>
                            <div>
                              <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {resultat.etudiant?.name || 'Étudiant inconnu'}
                              </div>
                              <small className="text-muted">
                                {resultat.etudiant?.matricule || 'N/A'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <div>
                            <Badge bg={getPourcentageColor(resultat.pourcentage)} className="px-3 py-2 mb-1">
                              {resultat.pourcentage.toFixed(1)}%
                            </Badge>
                            <div className="small text-muted">
                              {resultat.points_obtenus}/{resultat.total_points} pts
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <div style={{ width: '100px' }}>
                            <ProgressBar 
                              now={resultat.pourcentage} 
                              variant={getPourcentageColor(resultat.pourcentage)}
                              style={{ height: '8px' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="small">
                            <Badge bg="primary" className="mb-1">
                              {resultat.questions_repondues}/{resultat.total_questions}
                            </Badge>
                            <div className="text-muted">
                              Questions
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => openDetailModal(resultat)}
                            title="Voir le détail"
                          >
                            <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="users" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucun résultat</h6>
                    <p className="small mb-0">Aucun étudiant n'a encore participé à cette évaluation.</p>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Modal de détail d'un résultat */}
        <Modal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>
              Détail des réponses - {selectedResult?.etudiant?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedResult && (
              <div>
                {/* Résumé */}
                <Card className={`mb-4 ${theme === "dark" ? "bg-secondary" : "bg-light"}`}>
                  <Card.Body>
                    <Row className="text-center">
                      <Col md={3}>
                        <div className="mb-2">
                          <h4 className="text-primary mb-0">
                            {selectedResult.pourcentage.toFixed(1)}%
                          </h4>
                          <small className={theme === "dark" ? "text-light" : "text-muted"}>Score</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="mb-2">
                          <h4 className="text-success mb-0">
                            {selectedResult.points_obtenus}
                          </h4>
                          <small className={theme === "dark" ? "text-light" : "text-muted"}>Points obtenus</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="mb-2">
                          <h4 className="text-info mb-0">
                            {selectedResult.questions_repondues}
                          </h4>
                          <small className={theme === "dark" ? "text-light" : "text-muted"}>Questions répondues</small>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="mb-2">
                          <h4 className="text-warning mb-0">
                            {selectedResult.total_points}
                          </h4>
                          <small className={theme === "dark" ? "text-light" : "text-muted"}>Points total</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Détail par question */}
                <div className="table-responsive">
                  <Table className={`${theme === "dark" ? "table-dark" : ""}`}>
                    <thead>
                      <tr>
                        <th width="60">#</th>
                        <th>Question</th>
                        <th className="text-center">Type</th>
                        <th className="text-center">Points</th>
                        <th className="text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedResult.reponses?.map((reponse, index) => (
                        <tr key={index}>
                          <td className="text-center">
                            <Badge bg="secondary">{index + 1}</Badge>
                          </td>
                          <td>
                            <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {reponse.question.enonce.substring(0, 80)}
                              {reponse.question.enonce.length > 80 && '...'}
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge bg={reponse.question.type === 'QCM' ? 'info' : 'success'}>
                              {reponse.question.type}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg="primary">
                              {reponse.points_obtenus}/{reponse.question.points}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg={reponse.points_obtenus > 0 ? 'success' : 'danger'}>
                              {reponse.points_obtenus > 0 ? 'Correct' : 'Incorrect'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </FormateurLayout>
  );
}