import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Button, Form, Alert, Spinner, Toast, ToastContainer } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import FeatherIcon from "../../components/FeatherIcon";

export default function EvaluationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");

  // États des données
  const [evaluation, setEvaluation] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [matieresByClassroom, setMatieresByClassroom] = useState([]);
  const [errors, setErrors] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    titre: "",
    description: "",
    matricule_classroom: "",
    matricule_matiere: "",
    date_debut: "",
    duree_minutes: 60,
    status: "Brouillon"
  });

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

  // Charger les données de l'évaluation et des classes
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger l'évaluation
      const evaluationRes = await api.get(`/formateur/show/evaluation/${id}`);
      const evalData = evaluationRes.data.evaluation;
      setEvaluation(evalData);

      // Charger les classes
      const classroomsRes = await api.get("/formateur/view/classroom");
      setClassrooms(classroomsRes.data.classrooms || []);

      // Préparer le formulaire avec les données de l'évaluation
      const dateDebut = evalData.date_debut ? 
        new Date(evalData.date_debut).toISOString().slice(0, 16) : "";
      
      setForm({
        titre: evalData.titre || "",
        description: evalData.description || "",
        matricule_classroom: evalData.matiere?.matricule_classroom || "",
        matricule_matiere: evalData.matricule_matiere || "",
        date_debut: dateDebut,
        duree_minutes: evalData.duree_minutes || 60,
        status: evalData.status || "Brouillon"
      });

      // Si une classe est déjà sélectionnée, charger ses matières
      if (evalData.matiere?.matricule_classroom) {
        await fetchMatieresByClassroom(evalData.matiere.matricule_classroom);
      }

    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Récupérer les matières d'une classe
  const fetchMatieresByClassroom = useCallback(async (matriculeClassroom) => {
    if (!matriculeClassroom) {
      setMatieresByClassroom([]);
      return;
    }
    
    try {
      const res = await api.get(`/formateur/evaluations/matieres/${matriculeClassroom}`);
      setMatieresByClassroom(res.data.matieres || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des matières", err);
      setMatieresByClassroom([]);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    feather.replace();
  }, [evaluation, form, classrooms, matieresByClassroom]);

  // Gérer le changement de classe
  const handleClassroomChange = (matriculeClassroom) => {
    setForm({ ...form, matricule_classroom: matriculeClassroom, matricule_matiere: "" });
    fetchMatieresByClassroom(matriculeClassroom);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    
    try {
      await api.put(`/formateur/update/evaluation/${id}`, form);
      
      showToastMessage("Évaluation mise à jour avec succès", 'success');
      setTimeout(() => {
        navigate(`/formateur/show/evaluation/${id}`);
      }, 1500);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        showToastMessage("Erreur de validation", 'danger');
      } else {
        console.error(err);
        showToastMessage(err.response?.data?.message || "Une erreur inattendue s'est produite", 'danger');
      }
    } finally {
      setSaving(false);
    }
  };

  const canModifyEvaluation = () => {
    if (!evaluation) return true;
    
    const now = new Date();
    const dateDebut = new Date(evaluation.date_debut);
    
    // Ne peut pas modifier si terminée
    if (evaluation.status === 'Terminée') return false;
    
    // Ne peut pas modifier si déjà commencée et programmée
    if (now > dateDebut && evaluation.status === 'Programmée') return false;
    
    return true;
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

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
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
          <Button variant="outline-primary" onClick={fetchData}>
            <i data-feather="refresh-cw" className="me-2" />
            Réessayer
          </Button>
        </div>
      </FormateurLayout>
    );
  }

  if (!canModifyEvaluation()) {
    return (
      <FormateurLayout>
        <Alert variant="warning" className="mb-4">
          <i data-feather="alert-triangle" className="me-2" />
          Cette évaluation ne peut plus être modifiée car elle est {evaluation.status.toLowerCase()} ou déjà commencée.
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" as={Link} to="/formateur/view/evaluations">
            <i data-feather="arrow-left" className="me-2" />
            Retour à la liste
          </Button>
          <Button variant="primary" as={Link} to={`/formateur/show/evaluation/${id}`}>
            <i data-feather="eye" className="me-2" />
            Voir les détails
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
              to={`/formateur/show/evaluation/${id}`}
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <div>
              <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Modifier l'évaluation
              </h1>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                {evaluation.titre} - {evaluation.matricule}
              </p>
            </div>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary"
            as={Link}
            to={`/formateur/show/evaluation/${id}`}
          >
            <i data-feather="eye" className="me-2" style={{ width: '16px', height: '16px' }} />
            Voir
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          {/* Formulaire principal */}
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="edit" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations de l'évaluation
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Titre de l'évaluation *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ex: Contrôle de mathématiques - Chapitre 5"
                        required
                        value={form.titre}
                        onChange={e => setForm({ ...form, titre: e.target.value })}
                        isInvalid={!!errors.titre}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">{errors.titre}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
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

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Matière *</Form.Label>
                      <Form.Select
                        value={form.matricule_matiere}
                        onChange={e => setForm({ ...form, matricule_matiere: e.target.value })}
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

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Date et heure de début *</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        required
                        value={form.date_debut}
                        onChange={e => setForm({ ...form, date_debut: e.target.value })}
                        isInvalid={!!errors.date_debut}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <Form.Control.Feedback type="invalid">{errors.date_debut}</Form.Control.Feedback>
                      {evaluation.date_debut && (
                        <Form.Text className="text-muted">
                          Ancienne date: {formatDate(evaluation.date_debut)}
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Durée (en minutes) *</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="480"
                        required
                        value={form.duree_minutes}
                        onChange={e => setForm({ ...form, duree_minutes: parseInt(e.target.value) })}
                        isInvalid={!!errors.duree_minutes}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Text className="text-muted">
                        Maximum 8 heures (480 minutes)
                      </Form.Text>
                      <Form.Control.Feedback type="invalid">{errors.duree_minutes}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Statut *</Form.Label>
                      <Form.Select
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}
                        isInvalid={!!errors.status}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      >
                        <option value="Brouillon">Brouillon</option>
                        <option value="Programmée">Programmée</option>
                        <option value="Annulée">Annulée</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Description (optionnelle)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Description de l'évaluation, consignes particulières..."
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        isInvalid={!!errors.description}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <div className="d-flex gap-2 justify-content-end">
                      <Button 
                        variant="secondary" 
                        as={Link} 
                        to={`/formateur/show/evaluation/${id}`}
                        disabled={saving}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="submit" 
                        variant="primary"
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
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Informations actuelles */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="info" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations actuelles
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="small">
                <div className="mb-2">
                  <label className="fw-bold text-muted">MATRICULE</label>
                  <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <code className="px-2 py-1 bg-primary bg-opacity-10 rounded text-primary">
                      {evaluation.matricule}
                    </code>
                  </div>
                </div>
                
                <div className="mb-2">
                  <label className="fw-bold text-muted">CLASSE ACTUELLE</label>
                  <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="home" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                    {evaluation.matiere?.classroom?.name || 'Non définie'}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="fw-bold text-muted">MATIÈRE ACTUELLE</label>
                  <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="book" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                    {evaluation.matiere?.nom || 'Non définie'}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="fw-bold text-muted">DURÉE ACTUELLE</label>
                  <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="clock" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                    {formatDuration(evaluation.duree_minutes)}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="fw-bold text-muted">QUESTIONS</label>
                  <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="help-circle" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                    {evaluation.questions_count} question(s)
                  </div>
                </div>

                <div className="mb-2">
                  <label className="fw-bold text-muted">POINTS TOTAL</label>
                  <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="award" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                    {evaluation.total_points || 0} point(s)
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
                  variant="success"
                  as={Link}
                  to={`/formateur/create/questions`}
                  size="sm"
                >
                  <i data-feather="plus" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Ajouter une question
                </Button>

                <Button 
                  variant="success"
                  as={Link}
                  to={`/formateur/evaluation/${id}/questions`}
                  size="sm"
                >
                  <i data-feather="help-circle" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Gérer les questions
                </Button>
                
                <Button 
                  variant="info"
                  as={Link}
                  to={`/formateur/evaluation/${id}/resultats`}
                  size="sm"
                >
                  <i data-feather="bar-chart-2" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Voir les résultats
                </Button>
                
                <Button 
                  variant="outline-secondary"
                  as={Link}
                  to="/formateur/view/evaluations"
                  size="sm"
                >
                  <i data-feather="list" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Toutes les évaluations
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
    </FormateurLayout>
  );
}