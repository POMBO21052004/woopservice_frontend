import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Button, Form, Row, Col, Alert, Badge, Spinner, Toast, ToastContainer
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { useNavigate, Link } from "react-router-dom";

export default function CreateQuestion() {
  const navigate = useNavigate();

  // États
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
    image: null
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

  // Récupérer les classes
  const fetchClassrooms = useCallback(async () => {
    try {
      const res = await api.get("/formateur/view/questions");
      setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des classes", err);
    } finally {
      setLoading(false);
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
    fetchClassrooms();
  }, [fetchClassrooms]);

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

      await api.post("/formateur/store/question", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      showToastMessage("Question créée avec succès", 'success');
      
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

  if (loading) {
    return (
      <FormateurLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className={`mt-3 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Chargement des données...
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
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
                <i data-feather="plus-circle" className="text-success" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Créer une Question
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Ajout d'une nouvelle question à une évaluation
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
            </div>
          </div>
        </div>

        {/* Formulaire de création */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex align-items-center">
              <i data-feather="plus-circle" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Formulaire de Création
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
                    <Form.Text className="text-muted">
                      <i data-feather="info" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      Choisissez d'abord la classe concernée
                    </Form.Text>
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
                    <Form.Text className="text-muted">
                      <i data-feather="book" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      Seules les matières de la classe sont affichées
                    </Form.Text>
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
                    <Form.Text className="text-muted">
                      <i data-feather="clipboard" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      Seules les évaluations modifiables sont affichées
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <hr className="my-3" />
                  <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="help-circle" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                    Contenu de la Question
                  </h5>
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
                    <Form.Text className="text-muted">
                      Rédigez votre question de manière claire et précise
                    </Form.Text>
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
                    <Form.Text className="text-muted">0.5 à 20</Form.Text>
                  </Form.Group>
                </Col>

                {/* Champs spécifiques aux QCM */}
                {form.type === 'QCM' && (
                  <>
                    <Col md={12}>
                      <hr className="my-3" />
                      <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="check-square" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Options de Réponse QCM
                      </h6>
                    </Col>
                    
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          <Badge bg="primary" className="me-2">A</Badge>
                          Choix A *
                        </Form.Label>
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
                        <Form.Label>
                          <Badge bg="primary" className="me-2">B</Badge>
                          Choix B *
                        </Form.Label>
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
                        <Form.Label>
                          <Badge bg="secondary" className="me-2">C</Badge>
                          Choix C (optionnel)
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Troisième choix"
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
                    <Form.Text className="text-muted">
                      {form.type === 'QCM' ? 
                        'Sélectionnez parmi les choix A, B ou C' : 
                        'Réponse modèle ou mots-clés pour la correction'
                      }
                    </Form.Text>
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
                      JPG, PNG, WEBP - Max 2MB. Utilisez une image pour illustrer votre question.
                    </Form.Text>
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
                    <Form.Text className="text-muted">
                      Cette explication sera visible par les étudiants après correction
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <hr className="my-3" />
                  <div className="d-flex gap-2 justify-content-end">
                    <Button 
                      variant="outline-secondary" 
                      as={Link} 
                      to="/formateur/view/questions"
                      disabled={saving}
                    >
                      <i data-feather="x" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      variant="success"
                      disabled={saving || !form.matricule_evaluation}
                    >
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Création...
                        </>
                      ) : (
                        <>
                          <i data-feather="check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Créer la Question
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Aperçu de la sélection */}
        {(form.matricule_classroom || form.matricule_matiere || form.matricule_evaluation) && (
          <Card className={`mt-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark border-info" : "bg-info bg-opacity-10"}`}>
            <Card.Body>
              <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Aperçu de votre sélection
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {form.matricule_classroom && (
                  <Badge bg="primary" className="px-3 py-2">
                    <i data-feather="home" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    {classrooms.find(c => c.matricule === form.matricule_classroom)?.name || 'Classe'}
                  </Badge>
                )}
                {form.matricule_classroom && form.matricule_matiere && (
                  <>
                    <i data-feather="chevron-right" className="text-muted align-self-center" style={{ width: '16px', height: '16px' }}></i>
                    <Badge bg="success" className="px-3 py-2">
                      <i data-feather="book" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {matieresByClassroom.find(m => m.matricule === form.matricule_matiere)?.nom || 'Matière'}
                    </Badge>
                  </>
                )}
                {form.matricule_matiere && form.matricule_evaluation && (
                  <>
                    <i data-feather="chevron-right" className="text-muted align-self-center" style={{ width: '16px', height: '16px' }}></i>
                    <Badge bg="info" className="px-3 py-2">
                      <i data-feather="clipboard" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {evaluationsByMatiere.find(e => e.matricule === form.matricule_evaluation)?.titre || 'Évaluation'}
                    </Badge>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        )}

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