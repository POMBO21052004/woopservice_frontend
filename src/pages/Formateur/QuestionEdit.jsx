import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Button, Form, Row, Col, Alert, Badge, Spinner, Toast, ToastContainer
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function EditQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();

  // États
  const [question, setQuestion] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [matieresByClassroom, setMatieresByClassroom] = useState([]);
  const [evaluationsByMatiere, setEvaluationsByMatiere] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    enonce: "",
    type: "QCM",
    matricule_classroom: "",
    matricule_matiere: "",
    matricule_evaluation: "",
    choix_a: "",
    choix_b: "",
    choix_c: "",
    bonne_reponse_general: "",
    points: 1,
    explication: "",
    image: null,
    current_image: null
  });

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
      const questionData = res.data.question;
      
      setQuestion(questionData);
      
      // Pré-remplir le formulaire
      setForm({
        enonce: questionData.enonce || "",
        type: questionData.type || "QCM",
        matricule_classroom: questionData.evaluation?.matiere?.classroom?.matricule || "",
        matricule_matiere: questionData.evaluation?.matiere?.matricule || "",
        matricule_evaluation: questionData.evaluation?.matricule || "",
        choix_a: questionData.choix_a || "",
        choix_b: questionData.choix_b || "",
        choix_c: questionData.choix_c || "",
        bonne_reponse_general: questionData.bonne_reponse_general || "",
        points: questionData.points || 1,
        explication: questionData.explication || "",
        image: null,
        current_image: questionData.image_url || null
      });

      // Charger les données en cascade si nécessaire
      if (questionData.evaluation?.matiere?.classroom?.matricule) {
        await fetchMatieresByClassroom(questionData.evaluation.matiere.classroom.matricule);
      }
      
      if (questionData.evaluation?.matiere?.matricule) {
        await fetchEvaluationsByMatiere(questionData.evaluation.matiere.matricule);
      }

    } catch (err) {
      console.error("Erreur lors de la récupération de la question", err);
      showToastMessage("Erreur lors de la récupération des données de la question", 'danger');
      navigate('/formateur/questions');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Récupérer les classes
  const fetchClassrooms = useCallback(async () => {
    try {
      const res = await api.get("/formateur/view/questions");
      setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des classes", err);
    }
  }, []);

  // Récupérer les matières d'une classe
  const fetchMatieresByClassroom = useCallback(async (matriculeClassroom) => {
    if (!matriculeClassroom) {
      setMatieresByClassroom([]);
      return;
    }
    
    try {
      const res = await api.get(`/formateur/questions/matieres/${matriculeClassroom}`);
      setMatieresByClassroom(res.data.matieres || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des matières", err);
      setMatieresByClassroom([]);
    }
  }, []);

  // Récupérer les évaluations d'une matière
  const fetchEvaluationsByMatiere = useCallback(async (matriculeMatiere) => {
    if (!matriculeMatiere) {
      setEvaluationsByMatiere([]);
      return;
    }
    
    try {
      const res = await api.get(`/formateur/questions/evaluations/${matriculeMatiere}`);
      setEvaluationsByMatiere(res.data.evaluations || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des évaluations", err);
      setEvaluationsByMatiere([]);
    }
  }, []);

  useEffect(() => {
    feather.replace();
    fetchQuestion();
    fetchClassrooms();
  }, [fetchQuestion, fetchClassrooms]);

  useEffect(() => {
    feather.replace();
  }, [question, form, classrooms, matieresByClassroom, evaluationsByMatiere]);

  // Gérer le changement de classe dans le formulaire
  const handleClassroomChange = (matriculeClassroom) => {
    setForm({ 
      ...form, 
      matricule_classroom: matriculeClassroom, 
      matricule_matiere: "", 
      matricule_evaluation: "" 
    });
    fetchMatieresByClassroom(matriculeClassroom);
    setEvaluationsByMatiere([]);
  };

  // Gérer le changement de matière dans le formulaire
  const handleMatiereChange = (matriculeMatiere) => {
    setForm({ 
      ...form, 
      matricule_matiere: matriculeMatiere, 
      matricule_evaluation: "" 
    });
    fetchEvaluationsByMatiere(matriculeMatiere);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('enonce', form.enonce);
      formData.append('type', form.type);
      formData.append('matricule_evaluation', form.matricule_evaluation);
      formData.append('points', form.points);
      formData.append('bonne_reponse_general', form.bonne_reponse_general);
      
      if (form.type === 'QCM') {
        formData.append('choix_a', form.choix_a);
        formData.append('choix_b', form.choix_b);
        formData.append('choix_c', form.choix_c);
      }
      
      if (form.explication) {
        formData.append('explication', form.explication);
      }
      
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post(`/formateur/update/question/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-HTTP-Method-Override': 'PUT'
        }
      });
      
      showToastMessage("Question modifiée avec succès", 'success');
      
      // Rediriger vers la liste après un délai
      setTimeout(() => {
        navigate('/formateur/view/questions');
      }, 1500);
      
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        showToastMessage("Erreur de validation", 'danger');
      } else {
        console.error(err);
        showToastMessage("Une erreur inattendue s'est produite", 'danger');
      }
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <FormateurLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className={`mt-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Chargement des données de la question...
            </div>
          </div>
        </Container>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-warning bg-opacity-25" : "bg-warning bg-opacity-10"}`}>
                <i data-feather="edit" className="text-warning" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Modifier la Question
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Modification de la question : {question?.matricule}
                </p>
              </div>
            </div>
            
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                as={Link}
                to="/formateur/view/questions"
                className="d-flex align-items-center"
              >
                <i data-feather="arrow-left" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Retour à la liste
              </Button>
              
              {question && (
                <Button
                  variant="outline-info"
                  as={Link}
                  to={`/formateur/show/question/${question.id}`}
                  className="d-flex align-items-center"
                >
                  <i data-feather="eye" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Voir les détails
                </Button>
              )}
            </div>
          </div>

          {/* Informations contextuelles */}
          {question && (
            <Alert variant="info" className="mb-4">
              <div className="d-flex align-items-center">
                <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                <div>
                  <strong>Contexte actuel :</strong> {question.evaluation?.matiere?.classroom?.name} → {question.evaluation?.matiere?.nom} → {question.evaluation?.titre}
                  <div className="mt-1">
                    <Badge bg={getTypeBadge(question.type)} className="me-2">
                      <i data-feather={getTypeIcon(question.type)} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                      {question.type}
                    </Badge>
                    <Badge bg="warning">{question.points} points</Badge>
                    {question.statistiques && (
                      <Badge bg="secondary" className="ms-2">
                        {question.statistiques.total_reponses} réponse(s)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Alert>
          )}
        </div>

        {/* Formulaire d'édition */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex align-items-center">
              <i data-feather="edit" className="text-warning me-2" style={{ width: "20px", height: "20px" }}></i>
              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Formulaire de Modification
              </span>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                {/* Sélection en cascade : Classe → Matière → Évaluation */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Classe *</Form.Label>
                    <Form.Select
                      value={form.matricule_classroom}
                      onChange={e => handleClassroomChange(e.target.value)}
                      isInvalid={!!errors.matricule_classroom}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    >
                      <option value="">Sélectionnez une classe</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.matricule} value={classroom.matricule}>
                          {classroom.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.matricule_classroom}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Matière *</Form.Label>
                    <Form.Select
                      value={form.matricule_matiere}
                      onChange={e => handleMatiereChange(e.target.value)}
                      isInvalid={!!errors.matricule_matiere}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                      disabled={!form.matricule_classroom}
                    >
                      <option value="">
                        {form.matricule_classroom ? 'Sélectionnez une matière' : 'Choisissez d\'abord une classe'}
                      </option>
                      {matieresByClassroom.map(matiere => (
                        <option key={matiere.matricule} value={matiere.matricule}>
                          {matiere.nom}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.matricule_matiere}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Évaluation *</Form.Label>
                    <Form.Select
                      value={form.matricule_evaluation}
                      onChange={e => setForm({ ...form, matricule_evaluation: e.target.value })}
                      isInvalid={!!errors.matricule_evaluation}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                      disabled={!form.matricule_matiere}
                    >
                      <option value="">
                        {form.matricule_matiere ? 'Sélectionnez une évaluation' : 'Choisissez d\'abord une matière'}
                      </option>
                      {evaluationsByMatiere.map(evaluation => (
                        <option key={evaluation.matricule} value={evaluation.matricule}>
                          {evaluation.titre}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.matricule_evaluation}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Énoncé de la question *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Saisissez l'énoncé de votre question..."
                      required
                      value={form.enonce}
                      onChange={e => setForm({ ...form, enonce: e.target.value })}
                      isInvalid={!!errors.enonce}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.enonce}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Type *</Form.Label>
                    <Form.Select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      isInvalid={!!errors.type}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    >
                      <option value="QCM">QCM</option>
                      <option value="Réponse_libre">Réponse libre</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.type}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Points *</Form.Label>
                    <Form.Control
                      type="number"
                      min="0.5"
                      max="20"
                      step="0.5"
                      required
                      value={form.points}
                      onChange={e => setForm({ ...form, points: parseFloat(e.target.value) })}
                      isInvalid={!!errors.points}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.points}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {/* Champs spécifiques aux QCM */}
                {form.type === 'QCM' && (
                  <>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Choix A *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Premier choix"
                          required
                          value={form.choix_a}
                          onChange={e => setForm({ ...form, choix_a: e.target.value })}
                          isInvalid={!!errors.choix_a}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">{errors.choix_a}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Choix B *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Deuxième choix"
                          required
                          value={form.choix_b}
                          onChange={e => setForm({ ...form, choix_b: e.target.value })}
                          isInvalid={!!errors.choix_b}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">{errors.choix_b}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Choix C *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Troisième choix"
                          required
                          value={form.choix_c}
                          onChange={e => setForm({ ...form, choix_c: e.target.value })}
                          isInvalid={!!errors.choix_c}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">{errors.choix_c}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </>
                )}

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      {form.type === 'QCM' ? 'Bonne réponse (sélectionnez le choix) *' : 'Réponse attendue *'}
                    </Form.Label>
                    {form.type === 'QCM' ? (
                      <Form.Select
                        value={form.bonne_reponse_general}
                        onChange={e => setForm({ ...form, bonne_reponse_general: e.target.value })}
                        isInvalid={!!errors.bonne_reponse_general}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      >
                        <option value="">Choisissez la bonne réponse</option>
                        {form.choix_a && <option value={form.choix_a}>A: {form.choix_a}</option>}
                        {form.choix_b && <option value={form.choix_b}>B: {form.choix_b}</option>}
                        {form.choix_c && <option value={form.choix_c}>C: {form.choix_c}</option>}
                      </Form.Select>
                    ) : (
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Saisissez la réponse attendue ou les mots-clés..."
                        required
                        value={form.bonne_reponse_general}
                        onChange={e => setForm({ ...form, bonne_reponse_general: e.target.value })}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                    )}
                    <Form.Control.Feedback type="invalid">{errors.bonne_reponse_general}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Image (optionnelle)</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={e => setForm({ ...form, image: e.target.files[0] })}
                      isInvalid={!!errors.image}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      JPG, PNG, WEBP - Max 2MB
                    </Form.Text>
                    {form.current_image && (
                      <div className="mt-2">
                        <small className="text-muted">Image actuelle :</small>
                        <img 
                          src={form.current_image} 
                          alt="Current question" 
                          className="d-block mt-1"
                          style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Explication (optionnelle)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Explication de la réponse ou commentaire pour les étudiants..."
                      value={form.explication}
                      onChange={e => setForm({ ...form, explication: e.target.value })}
                      isInvalid={!!errors.explication}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.explication}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <div className="d-flex gap-2 justify-content-end">
                    <Button 
                      variant="secondary" 
                      as={Link} 
                      to="/formateur/questions"
                      disabled={saving}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      variant="warning"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          {/* <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i> */}
                          Sauvegarder les modifications
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

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