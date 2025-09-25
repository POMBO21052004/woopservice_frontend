import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Table, Badge, Alert, 
  Spinner, Modal, Form, ProgressBar, Toast, ToastContainer
} from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function ReponsesEtudiantEvaluation() {
  const { matriculeEtudiant, matriculeEvaluation } = useParams();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [resultatEtudiant, setResultatEtudiant] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // États pour les corrections manuelles
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    points_obtenus: 0,
    commentaire: ""
  });

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

  // Charger les données
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/formateur/answers/student/${matriculeEtudiant}/evaluation/${matriculeEvaluation}`);
      setResultatEtudiant(response.data.resultat_etudiant);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      showToastMessage('Erreur lors du chargement des données', 'danger');
    } finally {
      setLoading(false);
    }
  }, [matriculeEtudiant, matriculeEvaluation]);

  useEffect(() => {
    if (matriculeEtudiant && matriculeEvaluation) {
      fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    feather.replace();
  }, [resultatEtudiant]);

  const getPourcentageColor = (pourcentage) => {
    if (pourcentage >= 80) return 'success';
    if (pourcentage >= 60) return 'warning';
    if (pourcentage >= 40) return 'primary';
    return 'danger';
  };

  const getStatutBadge = (statut, estCorrecte) => {
    if (statut === 'Non répondue') return { bg: 'secondary', text: 'Non répondue', icon: 'minus-circle' };
    if (estCorrecte === true) return { bg: 'success', text: 'Correct', icon: 'check-circle' };
    if (estCorrecte === false) return { bg: 'danger', text: 'Incorrect', icon: 'x-circle' };
    return { bg: 'warning', text: 'À corriger', icon: 'clock' };
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

  const openQuestionDetail = (questionDetail) => {
    setSelectedQuestion(questionDetail);
    setShowDetailModal(true);
  };

  const startCorrection = (questionDetail) => {
    setEditingQuestion(questionDetail);
    setCorrectionForm({
      points_obtenus: questionDetail.points_obtenus,
      commentaire: questionDetail.commentaire || ""
    });
  };

  const saveCorrection = async () => {
    try {
      // Ici vous implémenteriez l'API pour sauvegarder la correction manuelle
      await api.post(`/formateur/answers/correct-manual`, {
        matricule_answer: editingQuestion.reponse?.matricule,
        points_obtenus: correctionForm.points_obtenus,
        commentaire: correctionForm.commentaire
      });
      
      showToastMessage('Correction sauvegardée avec succès', 'success');
      setEditingQuestion(null);
      fetchData(); // Recharger les données
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      showToastMessage('Erreur lors de la sauvegarde de la correction', 'danger');
    }
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des réponses...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (!resultatEtudiant) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          Données introuvables
        </Alert>
        <Button variant="secondary" as={Link} to="/formateur/answers/results">
          <i data-feather="arrow-left" className="me-2" />
          Retour aux résultats
        </Button>
      </FormateurLayout>
    );
  }

  const { etudiant, evaluation, detail_reponses } = resultatEtudiant;

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
                to={`/formateur/answers/evaluation/${matriculeEvaluation}/results`}
                className="me-3"
              >
                <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
                Retour
              </Button>
              <div>
                <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Analyse Détaillée des Réponses
                </h1>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  {etudiant?.name} - {evaluation?.titre}
                </p>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary"
              as={Link}
              to={`/formateur/evaluation/${matriculeEvaluation}/questions`}
            >
              <i data-feather="help-circle" className="me-2" style={{ width: '16px', height: '16px' }} />
              Questions
            </Button>
          </div>
        </div>

        {/* Carte de synthèse */}
        <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body>
            <Row className="align-items-center">
              <Col md={2}>
                <div className="text-center">
                  <div className={`mx-auto mb-2 p-3 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`} style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i data-feather="user" className="text-info" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                  <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {etudiant?.name}
                  </h6>
                  <small className="text-muted">{etudiant?.matricule}</small>
                </div>
              </Col>
              
              <Col md={10}>
                <Row>
                  <Col md={3}>
                    <div className="text-center p-3">
                      <h3 className={`mb-1 text-${getPourcentageColor(resultatEtudiant.pourcentage)}`}>
                        {resultatEtudiant.pourcentage.toFixed(1)}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>Score Final</small>
                      <ProgressBar 
                        now={resultatEtudiant.pourcentage} 
                        variant={getPourcentageColor(resultatEtudiant.pourcentage)}
                        style={{ height: '6px' }}
                        className="mt-2"
                      />
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center p-3">
                      <h3 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {resultatEtudiant.points_obtenus}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Points Obtenus
                      </small>
                      <div className="small text-muted mt-1">
                        / {resultatEtudiant.total_points_possibles}
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center p-3">
                      <h3 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {resultatEtudiant.questions_repondues}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Questions Répondues
                      </small>
                      <div className="small text-muted mt-1">
                        / {resultatEtudiant.total_questions}
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center p-3">
                      <h3 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {resultatEtudiant.reponses_correctes}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Réponses Correctes
                      </small>
                      <div className="small text-muted mt-1">
                        {resultatEtudiant.temps_total}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Informations de l'évaluation */}
        <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body>
            <Row>
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
                    <i data-feather="clipboard" className="text-success" style={{ width: "20px", height: "20px" }}></i>
                  </div>
                  <div>
                    <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {evaluation?.titre}
                    </h6>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <small className="text-muted">{evaluation?.matricule}</small>
                      <Badge bg="success">{evaluation?.status}</Badge>
                      <small className="text-muted">•</small>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        <i data-feather="home" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        {evaluation?.matiere?.classroom?.name}
                      </small>
                      <small className="text-muted">•</small>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        <i data-feather="book" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        {evaluation?.matiere?.nom}
                      </small>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-end">
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    {formatDate(evaluation?.date_debut)}
                  </div>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="clock" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    Durée: {evaluation?.duree_minutes} minutes
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Détail des réponses par question */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex align-items-center">
              <i data-feather="list" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Détail par Question
              </span>
            </div>
          </Card.Header>

          <Card.Body className={`p-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            {detail_reponses?.length > 0 ? (
              <div className="table-responsive">
                <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                  <thead className="table-primary">
                    <tr>
                      <th width="60">#</th>
                      <th>Question</th>
                      <th className="text-center">Type</th>
                      <th className="text-center">Réponse</th>
                      <th className="text-center">Points</th>
                      <th className="text-center">Statut</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail_reponses.map((questionDetail, index) => {
                      const statutBadge = getStatutBadge(questionDetail.statut, questionDetail.est_correcte);
                      const isEditing = editingQuestion?.question?.matricule === questionDetail.question?.matricule;

                      return (
                        <tr key={questionDetail.question?.matricule || index}>
                          <td className="text-center">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                              <small className="fw-bold">{index + 1}</small>
                            </div>
                          </td>
                          <td>
                            <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <div className="fw-medium mb-1">
                                {questionDetail.question?.enonce?.length > 60 ? 
                                  questionDetail.question.enonce.substring(0, 60) + "..." : 
                                  questionDetail.question?.enonce
                                }
                              </div>
                              <small className="text-muted">
                                {questionDetail.question?.matricule}
                              </small>
                              {questionDetail.question?.explication && (
                                <div className="small text-info mt-1">
                                  <i data-feather="info" className="me-1" style={{ width: '10px', height: '10px' }}></i>
                                  Explication disponible
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge bg={questionDetail.question?.type === 'QCM' ? 'info' : 'success'} className="px-2 py-1">
                              {questionDetail.question?.type}
                            </Badge>
                          </td>
                          <td className="text-center">
                            {questionDetail.statut === 'Non répondue' ? (
                              <Badge bg="secondary">Non répondue</Badge>
                            ) : (
                              <div className="small">
                                {questionDetail.question?.type === 'QCM' ? (
                                  <div>
                                    <Badge className="mb-1">
                                      Choix: {questionDetail.reponse?.choix_selectionne_qcm}
                                    </Badge>
                                    <div className="text-success small">
                                      Bonne réponse: {questionDetail.question?.bonne_reponse_general}
                                    </div>
                                  </div>
                                ) : (
                                  <div className={theme === "dark" ? "text-light" : "text-dark"}>
                                    {questionDetail.reponse?.reponse_donnee?.substring(0, 30)}
                                    {questionDetail.reponse?.reponse_donnee?.length > 30 && '...'}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="text-center">
                            {isEditing ? (
                              <Form.Control
                                type="number"
                                size="sm"
                                style={{ width: '80px', margin: '0 auto' }}
                                min="0"
                                max={questionDetail.question?.points}
                                step="0.5"
                                value={correctionForm.points_obtenus}
                                onChange={(e) => setCorrectionForm({
                                  ...correctionForm, 
                                  points_obtenus: parseFloat(e.target.value)
                                })}
                                className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                              />
                            ) : (
                              <Badge bg="primary" className="px-2 py-1">
                                {questionDetail.points_obtenus}/{questionDetail.question?.points}
                              </Badge>
                            )}
                          </td>
                          <td className="text-center">
                            <Badge bg={statutBadge.bg} className="px-2 py-1">
                              <i data-feather={statutBadge.icon} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                              {statutBadge.text}
                            </Badge>
                          </td>
                          <td className="text-center">
                            {isEditing ? (
                              <div className="d-flex gap-1 justify-content-center">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={saveCorrection}
                                  title="Sauvegarder"
                                >
                                  <i data-feather="check" style={{ width: '12px', height: '12px' }}></i>
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setEditingQuestion(null)}
                                  title="Annuler"
                                >
                                  <i data-feather="x" style={{ width: '12px', height: '12px' }}></i>
                                </Button>
                              </div>
                            ) : (
                              <div className="d-flex gap-1 justify-content-center">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => openQuestionDetail(questionDetail)}
                                  title="Voir les détails"
                                >
                                  <i data-feather="eye" style={{ width: '12px', height: '12px' }}></i>
                                </Button>
                                {questionDetail.question?.type === 'Libre' && (
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    onClick={() => startCorrection(questionDetail)}
                                    title="Corriger manuellement"
                                  >
                                    <i data-feather="edit" style={{ width: '12px', height: '12px' }}></i>
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="clipboard" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucune réponse trouvée</h6>
                    <p className="small mb-0">L'étudiant n'a pas encore répondu à cette évaluation.</p>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Modal de détail d'une question */}
        <Modal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Détail de la Question</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedQuestion && (
              <div>
                {/* Énoncé de la question */}
                <Card className={`mb-4 ${theme === "dark" ? "bg-secondary" : "bg-light"}`}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Énoncé de la question
                      </h6>
                      <div className="d-flex gap-2">
                        <Badge bg={selectedQuestion.question?.type === 'QCM' ? 'info' : 'success'}>
                          {selectedQuestion.question?.type}
                        </Badge>
                        <Badge bg="primary">
                          {selectedQuestion.question?.points} points
                        </Badge>
                      </div>
                    </div>
                    <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {selectedQuestion.question?.enonce}
                    </p>
                  </Card.Body>
                </Card>

                {/* Choix multiples si QCM */}
                {selectedQuestion.question?.type === 'QCM' && (
                  <Card className={`mb-4 ${theme === "dark" ? "bg-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Choix multiples
                      </h6>
                      <div className="row">
                        <div className="col-md-4">
                          <div className={`p-2 rounded ${selectedQuestion.question?.bonne_reponse_general === 'A' ? 'bg-success bg-opacity-20' : ''}`}>
                            <strong>A:</strong> {selectedQuestion.question?.choix_a}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className={`p-2 rounded ${selectedQuestion.question?.bonne_reponse_general === 'B' ? 'bg-success bg-opacity-20' : ''}`}>
                            <strong>B:</strong> {selectedQuestion.question?.choix_b}
                          </div>
                        </div>
                        {selectedQuestion.question?.choix_c && (
                          <div className="col-md-4">
                            <div className={`p-2 rounded ${selectedQuestion.question?.bonne_reponse_general === 'C' ? 'bg-success bg-opacity-20' : ''}`}>
                              <strong>C:</strong> {selectedQuestion.question?.choix_c}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <small className="text-success">
                          <i data-feather="check-circle" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                          Bonne réponse: {selectedQuestion.question?.bonne_reponse_general}
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Réponse de l'étudiant */}
                <Card className={`mb-4 ${theme === "dark" ? "bg-secondary" : "bg-light"}`}>
                  <Card.Body>
                    <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Réponse de l'étudiant
                    </h6>
                    {selectedQuestion.statut === 'Non répondue' ? (
                      <p className="text-muted mb-0">
                        <i data-feather="minus-circle" className="me-2" style={{ width: '16px', height: '16px' }}></i>
                        L'étudiant n'a pas répondu à cette question.
                      </p>
                    ) : (
                      <div>
                        {selectedQuestion.question?.type === 'QCM' ? (
                          <div>
                            <p className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <strong>Choix sélectionné:</strong> {selectedQuestion.reponse?.choix_selectionne_qcm}
                            </p>
                            <Badge 
                              bg={selectedQuestion.est_correcte ? 'success' : 'danger'} 
                              className="px-3 py-2"
                            >
                              {selectedQuestion.est_correcte ? 'Réponse correcte' : 'Réponse incorrecte'}
                            </Badge>
                          </div>
                        ) : (
                          <div>
                            <p className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <strong>Réponse donnée:</strong>
                            </p>
                            <div className="p-3 border rounded bg-white text-dark">
                              {selectedQuestion.reponse?.reponse_donnee || 'Aucune réponse'}
                            </div>
                            {selectedQuestion.question?.reponse_attendue && (
                              <div className="mt-3">
                                <p className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  <strong>Réponse attendue:</strong>
                                </p>
                                <div className="p-3 border rounded bg-success bg-opacity-10">
                                  {selectedQuestion.question.reponse_attendue}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {selectedQuestion.reponse?.heure_reponse && (
                          <div className="mt-3">
                            <small className="text-muted">
                              <i data-feather="clock" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                              Répondu le {formatDate(selectedQuestion.reponse.heure_reponse)}
                            </small>
                          </div>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Explication si disponible */}
                {selectedQuestion.question?.explication && (
                  <Card className={`mb-4 ${theme === "dark" ? "bg-info bg-opacity-10" : "bg-info bg-opacity-5"}`}>
                    <Card.Body>
                      <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="info" className="me-2" style={{ width: '16px', height: '16px' }}></i>
                        Explication
                      </h6>
                      <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {selectedQuestion.question.explication}
                      </p>
                    </Card.Body>
                  </Card>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Fermer
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
      </Container>
    </FormateurLayout>
  );
}