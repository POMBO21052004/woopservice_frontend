import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Form, Alert, Spinner, Badge, 
  Toast, ToastContainer, Modal, ProgressBar 
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function EvaluationStart() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState("light");

  // États des données
  const [evaluation, setEvaluation] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [reponses, setReponses] = useState({});
  const [tempsRestant, setTempsRestant] = useState(0);
  const [evaluationStarted, setEvaluationStarted] = useState(false);

  // États d'interface
  const [questionActive, setQuestionActive] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Timer
  const [timer, setTimer] = useState(null);

  // Gérer les changementsde thème
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

  // Démarrer l'évaluation
  const startEvaluation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/etudiant/evaluation/${id}/start`);
      
      if (response.data.status === 'success') {
        setEvaluation(response.data.evaluation);
        setQuestions(response.data.evaluation.questions || []);
        setTempsRestant(response.data.temps_restant);
        setEvaluationStarted(true);
        
        // Initialiser les réponses vides
        const reponsesVides = {};
        response.data.evaluation.questions?.forEach(question => {
          reponsesVides[question.matricule] = {
            matricule_question: question.matricule,
            choix_selectionne_qcm: '',
            reponse_donnee: ''
          };
        });
        setReponses(reponsesVides);
        
        showToastMessage('Évaluation démarrée avec succès', 'success');
      } else {
        showToastMessage(response.data.message || "Erreur lors du démarrage", 'danger');
        navigate('/etudiant/view/evaluations/my-classroom');
      }
    } catch (err) {
      console.error('Erreur lors du démarrage:', err);
      const errorMessage = err.response?.data?.message || "Erreur lors du démarrage de l'évaluation";
      showToastMessage(errorMessage, 'danger');
      navigate('/etudiant/view/evaluations/my-classroom');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Timer pour le temps restant
  useEffect(() => {
    if (evaluationStarted && -tempsRestant > 0) {
      const interval = setInterval(() => {
        -setTempsRestant(prev => {
          if (-prev <= 3) {
            setShowTimeUpModal(true);
            handleSubmitAnswers(true); // Soumission automatique
            return 0;
          }
          return prev + 3;
        });
      }, 10000); // Toutes les 1/2 minutes

      setTimer(interval);
      return () => clearInterval(interval);
    }
  }, [evaluationStarted, tempsRestant]);

  // Vérifier périodiquement le temps restant avec le serveur
  useEffect(() => {
    if (evaluationStarted) {
      const checkTimeInterval = setInterval(async () => {
        try {
          const response = await api.get(`/etudiant/evaluation/${id}/temps-restant`);
          if (response.data.status === 'success') {
            if (response.data.etat === 'expire') {
              setShowTimeUpModal(true);
              handleSubmitAnswers(true);
            } else if (response.data.etat === 'en_cours') {
              setTempsRestant(response.data.temps_restant);
            }
          }
        } catch (err) {
          console.error('Erreur vérification temps:', err);
        }
      }, 15000); // Toutes les 15 secondes

      return () => clearInterval(checkTimeInterval);
    }
  }, [evaluationStarted, id]);

  useEffect(() => {
    if (id) {
      startEvaluation();
    }

    // Nettoyer le timer au démontage
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [startEvaluation]);

  useEffect(() => {
    feather.replace();
  }, [questions, questionActive]);

  // Empêcher la fermeture accidentelle
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (evaluationStarted && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [evaluationStarted, submitting]);

  // Gérer les changements de réponses
  const handleReponseChange = (matriculeQuestion, type, value) => {
    setReponses(prev => ({
      ...prev,
      [matriculeQuestion]: {
        ...prev[matriculeQuestion],
        [type]: value
      }
    }));
  };

  // Naviguer entre les questions
  const goToQuestion = (index) => {
    setQuestionActive(index);
  };

  // Soumettre les réponses
  const handleSubmitAnswers = async (autoSubmit = false) => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      // Préparer les données
      const reponsesArray = Object.values(reponses).filter(r => 
        r.choix_selectionne_qcm || r.reponse_donnee
      );

      const response = await api.post(`/etudiant/evaluation/${id}/submit`, {
        reponses: reponsesArray
      });

      if (response.data.status === 'success') {
        if (timer) clearInterval(timer);
        
        showToastMessage(
          autoSubmit ? 
            'Temps expiré ! Vos réponses ont été enregistrées automatiquement.' :
            'Réponses enregistrées avec succès !', 
          'success'
        );
        
        setTimeout(() => {
          navigate('/etudiant/view/evaluations/my-classroom');
        }, 2000);
      } else {
        showToastMessage(response.data.message || "Erreur lors de l'enregistrement", 'danger');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Erreur soumission:', err);
      showToastMessage(
        err.response?.data?.message || "Erreur lors de l'enregistrement des réponses", 
        'danger'
      );
      setSubmitting(false);
    }
  };

  // Formater le temps
  const formatTime = (minutes) => {
    
    if (minutes > 0) {
      
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

    } else {
      
      // Convertir les minutes décimales en secondes totales
      const totalSeconds = Math.floor(-minutes * 60);
      
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

    }
    
  };

  // Calculer le progrès
  const calculateProgress = () => {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.values(reponses).filter(r => 
      r.choix_selectionne_qcm || r.reponse_donnee
    ).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  // Vérifier si la question actuelle est répondue
  const isQuestionAnswered = (matriculeQuestion) => {
    const reponse = reponses[matriculeQuestion];
    return reponse && (reponse.choix_selectionne_qcm || reponse.reponse_donnee);
  };

  if (loading) {
    return (
      <EtudiantLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Démarrage de l'évaluation...</p>
        </div>
      </EtudiantLayout>
    );
  }

  if (!evaluation || !evaluationStarted) {
    return (
      <EtudiantLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          Impossible d'accéder à cette évaluation
        </Alert>
      </EtudiantLayout>
    );
  }

  const currentQuestion = questions[questionActive];

  return (
    <div className={`min-vh-100 ${theme === "dark" ? "bg-dark" : "bg-light"}`}>
      <Container fluid className="py-3">
        {/* En-tête fixe */}
        <Card className={`sticky-top mb-3 shadow-sm ${theme === "dark" ? "bg-dark border-secondary" : "bg-white"}`} style={{ zIndex: 1000 }}>
          <Card.Body className="py-2">
            <Row className="align-items-center">
              <Col md={3}>
                <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  {evaluation.titre}
                </div>
                <small className="text-muted">
                  {evaluation.matiere?.nom} • {user?.name}
                </small>
              </Col>
              
              <Col md={3} className="text-center">
                <div className={`${-tempsRestant <= 10 ? 'text-danger' : 'text-success'} fw-bold`}>
                  <i data-feather="clock" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                  Temps restant: {formatTime(tempsRestant)}
                </div>
              </Col>
              
              <Col md={3} className="text-center">
                <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Question {questionActive + 1} sur {questions.length}
                </div>
                <ProgressBar 
                  now={((questionActive + 1) / questions.length) * 100}
                  variant="info"
                  size="sm"
                  className="mt-1"
                />
              </Col>
              
              <Col md={3} className="text-end">
                <div className="d-flex align-items-center justify-content-end gap-2">
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Progrès: {Math.round(calculateProgress())}%
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={submitting}
                  >
                    {/* <i data-feather="check-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i> */}
                    Terminer
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row>
          {/* Sidebar avec liste des questions */}
          <Col md={3}>
            <Card className={`sticky-top ${theme === "dark" ? "bg-dark border-secondary" : "bg-white"}`} style={{ top: '120px' }}>
              <Card.Header className={`${theme === "dark" ? "bg-dark border-secondary" : ""}`}>
                <h6 className="mb-0">
                  <i data-feather="list" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Navigation
                </h6>
              </Card.Header>
              <Card.Body className="p-2">
                <div className="d-grid gap-1">
                  {questions.map((question, index) => (
                    <Button
                      key={question.id}
                      variant={
                        index === questionActive ? 'primary' :
                        isQuestionAnswered(question.matricule) ? 'success' : 'outline-secondary'
                      }
                      size="sm"
                      onClick={() => goToQuestion(index)}
                      className="text-start"
                    >
                      <div className="d-flex align-items-center">
                        <span className="fw-bold me-2">{index + 1}</span>
                        <div className="flex-grow-1">
                          <Badge bg={question.type === 'QCM' ? 'info' : 'warning'} className="me-1">
                            {question.type}
                          </Badge>
                          <small>{question.points}pts</small>
                        </div>
                        {isQuestionAnswered(question.matricule) && (
                          <i data-feather="check-circle" className="text-success" style={{ width: "12px", height: "12px" }}></i>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>

                <hr className="my-2" />
                
                <div className="small text-center">
                  <div className={theme === "dark" ? "text-light" : "text-muted"}>
                    <div>Total: {questions.length} questions</div>
                    <div>Points: {evaluation.total_points}</div>
                    <div className="text-success">
                      Répondues: {Object.values(reponses).filter(r => r.choix_selectionne_qcm || r.reponse_donnee).length}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Zone de question principale */}
          <Col md={9}>
            {currentQuestion && (
              <Card className={`shadow-sm ${theme === "dark" ? "bg-dark border-secondary" : "bg-white"}`}>
                <Card.Header className={`${theme === "dark" ? "bg-dark border-secondary" : ""}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">
                        Question {questionActive + 1}
                        <Badge bg={currentQuestion.type === 'QCM' ? 'info' : 'warning'} className="ms-2">
                          {currentQuestion.type}
                        </Badge>
                        <Badge bg="primary" className="ms-2">
                          {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                        </Badge>
                      </h5>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => goToQuestion(Math.max(0, questionActive - 1))}
                        disabled={questionActive === 0}
                      >
                        {/* <i data-feather="chevron-left" style={{ width: "14px", height: "14px" }}></i> */}
                        Précédent
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => goToQuestion(Math.min(questions.length - 1, questionActive + 1))}
                        disabled={questionActive === questions.length - 1}
                      >
                        Suivant
                        {/* <i data-feather="chevron-right" className="ms-1" style={{ width: "14px", height: "14px" }}></i> */}
                      </Button>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body>
                  {/* Énoncé de la question */}
                  <div className={`mb-4 p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <div className={`h6 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {currentQuestion.enonce}
                    </div>
                  </div>

                  {/* Image de la question si présente */}
                  {currentQuestion.image && (
                    <div className="text-center mb-4">
                      <img 
                        src={currentQuestion.image} 
                        alt="Image de la question" 
                        className="img-fluid rounded"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}

                  {/* Zone de réponse */}
                  {currentQuestion.type === 'QCM' ? (
                    <div>
                      <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Choisissez votre réponse :
                      </h6>
                      <div className="d-grid gap-2">
                        {[
                          { key: 'A', text: currentQuestion.choix_a },
                          { key: 'B', text: currentQuestion.choix_b },
                          { key: 'C', text: currentQuestion.choix_c }
                        ].filter(choix => choix.text).map((choix) => (
                          <div key={choix.key}>
                            <Form.Check
                              type="radio"
                              id={`q${currentQuestion.id}_${choix.key}`}
                              name={`question_${currentQuestion.matricule}`}
                              checked={reponses[currentQuestion.matricule]?.choix_selectionne_qcm === choix.text}
                              onChange={() => handleReponseChange(currentQuestion.matricule, 'choix_selectionne_qcm', choix.text)}
                              label={
                                <div className={`p-3 border rounded ${
                                  reponses[currentQuestion.matricule]?.choix_selectionne_qcm === choix.text ? 
                                    'border-primary bg-primary bg-opacity-10' : 
                                    theme === "dark" ? 'border-secondary bg-dark' : 'border-secondary bg-white'
                                }`}>
                                  <strong className="me-2">{choix.key}.</strong>
                                  {choix.text}
                                </div>
                              }
                              className="mb-0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Votre réponse :
                      </h6>
                      <Form.Control
                        as="textarea"
                        rows={8}
                        placeholder="Rédigez votre réponse ici..."
                        value={reponses[currentQuestion.matricule]?.reponse_donnee || ''}
                        onChange={(e) => handleReponseChange(currentQuestion.matricule, 'reponse_donnee', e.target.value)}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <div className="form-text">
                        Développez votre réponse de manière claire et structurée.
                      </div>
                    </div>
                  )}

                  {/* Explication si présente */}
                  {currentQuestion.explication && (
                    <div className={`mt-4 p-3 rounded border-start border-info border-4 ${theme === "dark" ? "bg-info bg-opacity-10" : "bg-info bg-opacity-5"}`}>
                      <h6 className="text-info">
                        <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Information
                      </h6>
                      <div className={theme === "dark" ? "text-light" : "text-dark"}>
                        {currentQuestion.explication}
                      </div>
                    </div>
                  )}
                </Card.Body>

                {/* Navigation en bas de question */}
                <Card.Footer className={`${theme === "dark" ? "bg-dark border-secondary" : ""}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="outline-primary"
                      onClick={() => goToQuestion(Math.max(0, questionActive - 1))}
                      disabled={questionActive === 0}
                    >
                      {/* <i data-feather="chevron-left" className="me-1" style={{ width: "16px", height: "16px" }}></i> */}
                      Question précédente
                    </Button>

                    <div className="text-center">
                      <Badge 
                        bg={isQuestionAnswered(currentQuestion.matricule) ? 'success' : 'warning'}
                        className="px-3 py-2"
                      >
                        {isQuestionAnswered(currentQuestion.matricule) ? (
                          <>
                            {/* <i data-feather="check-circle" className="me-1" style={{ width: "12px", height: "12px" }}></i> */}
                            Répondue
                          </>
                        ) : (
                          <>
                            {/* <i data-feather="alert-circle" className="me-1" style={{ width: "12px", height: "12px" }}></i> */}
                            Non répondue
                          </>
                        )}
                      </Badge>
                    </div>

                    {questionActive === questions.length - 1 ? (
                      <Button
                        variant="success"
                        onClick={() => setShowConfirmModal(true)}
                        disabled={submitting}
                      >
                        {/* <i data-feather="check-circle" className="me-1" style={{ width: "16px", height: "16px" }}></i> */}
                        Terminer l'évaluation
                      </Button>
                    ) : (
                      <Button
                        variant="outline-primary"
                        onClick={() => goToQuestion(questionActive + 1)}
                      >
                        Question suivante
                        {/* <i data-feather="chevron-right" className="ms-1" style={{ width: "16px", height: "16px" }}></i> */}
                      </Button>
                    )}
                  </div>
                </Card.Footer>
              </Card>
            )}
          </Col>
        </Row>

        {/* Modal de confirmation */}
        <Modal
          show={showConfirmModal}
          onHide={() => !submitting && setShowConfirmModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
          backdrop={submitting ? "static" : true}
          keyboard={!submitting}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton={!submitting}>
            <Modal.Title>
              <i data-feather="check-circle" className="me-2 text-success" style={{ width: "20px", height: "20px" }} />
              Confirmer la soumission
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <div className="mb-3">
              <h6>Résumé de votre évaluation :</h6>
              <ul className="list-unstyled">
                <li><strong>Questions répondues :</strong> {Object.values(reponses).filter(r => r.choix_selectionne_qcm || r.reponse_donnee).length} sur {questions.length}</li>
                <li><strong>Questions restantes :</strong> {questions.length - Object.values(reponses).filter(r => r.choix_selectionne_qcm || r.reponse_donnee).length}</li>
                <li><strong>Temps restant :</strong> {formatTime(tempsRestant)}</li>
              </ul>
            </div>
            
            <div className="alert alert-warning">
              <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              <strong>Attention :</strong> Une fois soumise, vous ne pourrez plus modifier vos réponses.
            </div>

            {submitting && (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 mb-0">Enregistrement en cours...</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button 
              variant="secondary" 
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              Continuer l'évaluation
            </Button>
            <Button 
              variant="success" 
              onClick={() => handleSubmitAnswers(false)}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  {/* <i data-feather="send" className="me-2" style={{ width: "16px", height: "16px" }} /> */}
                  Confirmer et soumettre
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal temps expiré */}
        <Modal
          show={showTimeUpModal}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Modal.Title>
              <i data-feather="clock" className="me-2 text-danger" style={{ width: "20px", height: "20px" }} />
              Temps expiré !
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <div className="text-center">
              <div className="alert alert-info">
                <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Le temps imparti pour cette évaluation est écoulé. Vos réponses sont en cours d'enregistrement automatiquement.
              </div>
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Enregistrement automatique en cours...</p>
            </div>
          </Modal.Body>
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
    </div>
  );
} 