import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Button, Row, Col, Form, Alert, Badge, Spinner, Toast, ToastContainer, Modal, Table, ProgressBar
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function ShowQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();

  // États
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [duplicateForm, setDuplicateForm] = useState({ matricule_evaluation: "" });

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // État du thème
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

  // Afficher les notifications toast
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Récupérer les données de la question
  const fetchQuestion = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/formateur/question/${id}`);
      setQuestion(res.data.question);
    } catch (err) {
      console.error("Erreur lors de la récupération de la question", err);
      setError("Question introuvable ou erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Récupérer la liste des évaluations pour la duplication
  const fetchEvaluations = useCallback(async () => {
    try {
      const res = await api.get("/formateur/view/questions");
      setEvaluations(res.data.evaluations || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des évaluations", err);
    }
  }, []);

  useEffect(() => {
    feather.replace();
    fetchQuestion();
    fetchEvaluations();
  }, [fetchQuestion, fetchEvaluations]);

  useEffect(() => {
    feather.replace();
  }, [question, evaluations, duplicateForm]);

  // Gérer la suppression
  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/formateur/destroy/question/${id}`);
      showToastMessage("Question supprimée avec succès", 'success');
      setTimeout(() => {
        navigate('/formateur/view/questions');
      }, 1500);
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
    }
    setShowDeleteModal(false);
  };

  // Gérer la duplication
  const handleDuplicateConfirmed = async () => {
    try {
      await api.post(`/formateur/duplicate/question/${id}`, duplicateForm);
      showToastMessage("Question dupliquée avec succès", 'success');
      setShowDuplicateModal(false);
      setDuplicateForm({ matricule_evaluation: "" });
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la duplication", 'danger');
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'QCM': return 'primary';
      case 'Réponse_libre': return 'success';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'QCM': return 'check-square';
      case 'Réponse_libre': return 'edit-3';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <FormateurLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className={`mt-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Chargement des détails de la question...
            </div>
          </div>
        </Container>
      </FormateurLayout>
    );
  }

  if (error || !question) {
    return (
      <FormateurLayout>
        <Container className="py-4">
          <Alert variant="danger" className="mb-4">
            <i data-feather="alert-circle" className="me-2" />
            {error || 'Question introuvable'}
          </Alert>
          <div className="d-flex gap-2">
            <Button variant="secondary" as={Link} to="/formateur/view/questions">
              <i data-feather="arrow-left" className="me-2" />
              Retour à la liste
            </Button>
            <Button variant="outline-primary" onClick={fetchQuestion}>
              <i data-feather="refresh-cw" className="me-2" />
              Réessayer
            </Button>
          </div>
        </Container>
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
                to="/formateur/questions"
                className="me-3"
              >
                <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
                Retour
              </Button>
              <div>
                <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Détails de la question
                </h1>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  {question.matricule}
                </p>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-warning"
              as={Link}
              to={`/formateur/edit/question/${question.id}`}
            >
              <i data-feather="edit" className="me-2" style={{ width: '16px', height: '16px' }} />
              Modifier
            </Button>
            <Button 
              variant="outline-success"
              onClick={() => setShowDuplicateModal(true)}
            >
              <i data-feather="copy" className="me-2" style={{ width: '16px', height: '16px' }} />
              Dupliquer
            </Button>
            <Button 
              variant="outline-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <i data-feather="trash-2" className="me-2" style={{ width: '16px', height: '16px' }} />
              Supprimer
            </Button>
          </div>
        </div>

        <Row>
          <Col lg={8}>
            {/* Informations principales */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i data-feather="help-circle" className="me-2" style={{ width: '20px', height: '20px' }} />
                    Question
                  </h5>
                  <div className="d-flex gap-2">
                    <Badge bg={getTypeBadge(question.type)}>
                      <i data-feather={getTypeIcon(question.type)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {question.type}
                    </Badge>
                    <Badge bg="warning">{question.points} points</Badge>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <h6 className={`fw-bold mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>Énoncé</h6>
                  <p className={`${theme === "dark" ? "text-light" : "text-dark"} mb-3`}>
                    {question.enonce}
                  </p>
                </div>

                {question.image_url && (
                  <div className="mb-4">
                    <h6 className={`fw-bold mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>Image associée</h6>
                    <img 
                      src={question.image_url} 
                      alt="Question" 
                      className="img-fluid rounded shadow-sm"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                )}

                {question.type === 'QCM' && (
                  <div className="mb-4">
                    <h6 className={`fw-bold mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>Choix de réponse</h6>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <div className={`p-3 border rounded ${question.bonne_reponse_general === question.choix_a ? 'border-success bg-success bg-opacity-10' : theme === "dark" ? "border-secondary" : "border-light"}`}>
                          <div className="d-flex align-items-center">
                            <Badge bg="primary" className="me-2">A</Badge>
                            <span className={theme === "dark" ? "text-light" : "text-dark"}>{question.choix_a}</span>
                            {question.bonne_reponse_general === question.choix_a && (
                              <i data-feather="check-circle" className="ms-auto text-success" style={{ width: '16px', height: '16px' }}></i>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className={`p-3 border rounded ${question.bonne_reponse_general === question.choix_b ? 'border-success bg-success bg-opacity-10' : theme === "dark" ? "border-secondary" : "border-light"}`}>
                          <div className="d-flex align-items-center">
                            <Badge bg="primary" className="me-2">B</Badge>
                            <span className={theme === "dark" ? "text-light" : "text-dark"}>{question.choix_b}</span>
                            {question.bonne_reponse_general === question.choix_b && (
                              <i data-feather="check-circle" className="ms-auto text-success" style={{ width: '16px', height: '16px' }}></i>
                            )}
                          </div>
                        </div>
                      </div>
                      {question.choix_c && (
                        <div className="col-md-4">
                          <div className={`p-3 border rounded ${question.bonne_reponse_general === question.choix_c ? 'border-success bg-success bg-opacity-10' : theme === "dark" ? "border-secondary" : "border-light"}`}>
                            <div className="d-flex align-items-center">
                              <Badge bg="primary" className="me-2">C</Badge>
                              <span className={theme === "dark" ? "text-light" : "text-dark"}>{question.choix_c}</span>
                              {question.bonne_reponse_general === question.choix_c && (
                                <i data-feather="check-circle" className="ms-auto text-success" style={{ width: '16px', height: '16px' }}></i>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h6 className={`fw-bold mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {question.type === 'QCM' ? 'Bonne réponse' : 'Réponse attendue'}
                  </h6>
                  <div className={`p-3 bg-success bg-opacity-10 border border-success rounded ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="check-circle" className="me-2 text-success" style={{ width: '16px', height: '16px' }}></i>
                    {question.bonne_reponse_general}
                  </div>
                </div>

                {question.explication && (
                  <div className="mb-4">
                    <h6 className={`fw-bold mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>Explication</h6>
                    <div className={`p-3 bg-info bg-opacity-10 border border-info rounded ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="info" className="me-2 text-info" style={{ width: '16px', height: '16px' }}></i>
                      {question.explication}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Statistiques des réponses */}
            {question.statistiques && question.statistiques.total_reponses > 0 && (
              <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className="border-0">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i data-feather="bar-chart-2" className="me-2" style={{ width: '20px', height: '20px' }} />
                    Statistiques des réponses
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row className="text-center">
                    <Col md={4}>
                      <div className="mb-3">
                        <h3 className="text-primary mb-1">{question.statistiques.total_reponses}</h3>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>Total réponses</small>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="mb-3">
                        <h3 className="text-success mb-1">{question.statistiques.reponses_correctes}</h3>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>Réponses correctes</small>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="mb-3">
                        <h3 className="text-danger mb-1">{question.statistiques.reponses_incorrectes}</h3>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>Réponses incorrectes</small>
                      </div>
                    </Col>
                  </Row>
                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>Taux de réussite</span>
                      <span className={`small fw-bold text-${question.statistiques.taux_reussite >= 70 ? 'success' : question.statistiques.taux_reussite >= 50 ? 'warning' : 'danger'}`}>
                        {question.statistiques.taux_reussite}%
                      </span>
                    </div>
                    <ProgressBar 
                      now={question.statistiques.taux_reussite} 
                      variant={question.statistiques.taux_reussite >= 70 ? 'success' : question.statistiques.taux_reussite >= 50 ? 'warning' : 'danger'}
                      style={{ height: '8px' }}
                    />
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Réponses des étudiants */}
            {question.answers && question.answers.length > 0 && (
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className="border-0">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i data-feather="users" className="me-2" style={{ width: '20px', height: '20px' }} />
                    Réponses des étudiants ({question.answers.length})
                  </h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                      <thead className="table-primary">
                        <tr>
                          <th>Étudiant</th>
                          <th>Réponse donnée</th>
                          <th className="text-center">Résultat</th>
                          <th>Heure de réponse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {question.answers.map((answer, index) => (
                          <tr key={answer.id || index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                                  <i data-feather="user" style={{ width: '16px', height: '16px' }}></i>
                                </div>
                                <div>
                                  <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {answer.etudiant?.name || 'Étudiant inconnu'}
                                  </div>
                                  <small className="text-muted">{answer.matricule_etudiant}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={theme === "dark" ? "text-light" : "text-dark"}>
                                {question.type === 'QCM' ? answer.choix_selectionne_qcm : answer.reponse_donnee}
                              </span>
                            </td>
                            <td className="text-center">
                              {question.type === 'QCM' && (
                                <Badge bg={answer.choix_selectionne_qcm === question.bonne_reponse_general ? 'success' : 'danger'}>
                                  <i data-feather={answer.choix_selectionne_qcm === question.bonne_reponse_general ? 'check-circle' : 'x-circle'} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                  {answer.choix_selectionne_qcm === question.bonne_reponse_general ? 'Correct' : 'Incorrect'}
                                </Badge>
                              )}
                              {question.type === 'Réponse_libre' && (
                                <Badge bg="secondary">
                                  <i data-feather="edit-3" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                  À corriger
                                </Badge>
                              )}
                            </td>
                            <td>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                {answer.heure_reponse ? formatDate(answer.heure_reponse) : 'Non disponible'}
                              </small>
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

          {/* Sidebar */}
          <Col lg={4}>
            {/* Informations contextuelles */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="info" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Contexte
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="small">
                  <div className="mb-3">
                    <label className="fw-bold text-muted">CLASSE</label>
                    <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="home" className="me-2" style={{ width: '16px', height: '16px' }}></i>
                      {question.evaluation?.matiere?.classroom?.name || 'Non définie'}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="fw-bold text-muted">MATIÈRE</label>
                    <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="book" className="me-2" style={{ width: '16px', height: '16px' }}></i>
                      {question.evaluation?.matiere?.nom || 'Non définie'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="fw-bold text-muted">ÉVALUATION</label>
                    <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="clipboard" className="me-2" style={{ width: '16px', height: '16px' }}></i>
                      {question.evaluation?.titre || 'Non définie'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="fw-bold text-muted">DATE DE CRÉATION</label>
                    <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="calendar" className="me-2" style={{ width: '16px', height: '16px' }}></i>
                      {formatDate(question.created_at)}
                    </div>
                  </div>

                  <div className="mb-0">
                    <label className="fw-bold text-muted">DERNIÈRE MODIFICATION</label>
                    <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="clock" className="me-2" style={{ width: '16px', height: '16px' }}></i>
                      {formatDate(question.updated_at)}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Actions rapides */}
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="settings" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Actions rapides
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="warning"
                    as={Link}
                    to={`/formateur/edit/question/${question.id}`}
                    size="sm"
                  >
                    <i data-feather="edit" className="me-2" style={{ width: '16px', height: '16px' }} />
                    Modifier cette question
                  </Button>
                  
                  <Button 
                    variant="success"
                    onClick={() => setShowDuplicateModal(true)}
                    size="sm"
                  >
                    <i data-feather="copy" className="me-2" style={{ width: '16px', height: '16px' }} />
                    Dupliquer la question
                  </Button>
                  
                  {question.evaluation && (
                    <Button 
                      variant="info"
                      as={Link}
                      to={`/formateur/show/evaluation/${question.evaluation.id}`}
                      size="sm"
                    >
                      <i data-feather="clipboard" className="me-2" style={{ width: '16px', height: '16px' }} />
                      Voir l'évaluation
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline-secondary"
                    as={Link}
                    to="/formateur/questions"
                    size="sm"
                  >
                    <i data-feather="list" className="me-2" style={{ width: '16px', height: '16px' }} />
                    Toutes les questions
                  </Button>
                  
                  <hr />
                  
                  <Button 
                    variant="danger"
                    onClick={() => setShowDeleteModal(true)}
                    size="sm"
                  >
                    <i data-feather="trash-2" className="me-2" style={{ width: '16px', height: '16px' }} />
                    Supprimer la question
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modale de duplication */}
        <Modal
          show={showDuplicateModal}
          onHide={() => setShowDuplicateModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Dupliquer la Question</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <div className="mb-3">
              <h6>Question à dupliquer :</h6>
              <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                <Badge bg={getTypeBadge(question.type)} className="mb-2">
                  {question.type}
                </Badge>
                <div className={theme === "dark" ? "text-light" : "text-dark"}>
                  {question.enonce}
                </div>
                <small className="text-muted">
                  {question.points} points
                </small>
              </div>
            </div>
            
            <Form.Group>
              <Form.Label>Évaluation de destination *</Form.Label>
              <Form.Select
                value={duplicateForm.matricule_evaluation}
                onChange={e => setDuplicateForm({ ...duplicateForm, matricule_evaluation: e.target.value })}
                className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                required
              >
                <option value="">Sélectionnez une évaluation</option>
                {evaluations.map(evaluation => (
                  <option key={evaluation.matricule} value={evaluation.matricule}>
                    {evaluation.titre} ({evaluation.matiere?.nom} - {evaluation.matiere?.classroom?.name})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                La question sera copiée avec le préfixe [COPIE]
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDuplicateModal(false)}>
              Annuler
            </Button>
            <Button 
              variant="success" 
              onClick={handleDuplicateConfirmed}
              disabled={!duplicateForm.matricule_evaluation}
            >
              <i data-feather="copy" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Dupliquer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modale de confirmation de suppression */}
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
            <p>Êtes-vous sûr de vouloir supprimer cette question ?</p>
            <div className="alert alert-warning">
              <strong>Question :</strong> {question.enonce}
            </div>
            <div className="alert alert-danger">
              <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Cette action est irréversible. Toutes les réponses associées seront également supprimées.
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirmed}>
              <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Supprimer
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