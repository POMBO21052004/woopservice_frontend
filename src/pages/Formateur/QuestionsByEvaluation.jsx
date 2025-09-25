import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Form, Modal, Table, 
  Badge, Alert, Spinner, Toast, ToastContainer, ButtonGroup 
} from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function QuestionsByEvaluation() {
  const { evaluationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState("light");

  // États des données
  const [evaluation, setEvaluation] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [total_points_evaluation, setTotalPointsEvaluation] = useState([]);

  // États des modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState(null);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    enonce: "",
    type: "QCM",
    choix_a: "",
    choix_b: "",
    choix_c: "",
    bonne_reponse_general: "",
    points: 1,
    explication: "",
    image: null
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

  // Charger l'évaluation et ses questions
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger l'évaluation
      const evaluationRes = await api.get(`/formateur/show/evaluation/${evaluationId}`);
      setEvaluation(evaluationRes.data.evaluation);
      setTotalPointsEvaluation(evaluationRes.data.total_points_evalaution);
      
      // Charger les questions filtrées pour cette évaluation
      const questionsRes = await api.get("/formateur/view/questions", {
        params: { matricule_evaluation: evaluationRes.data.evaluation.matricule }
      });
      setQuestions(questionsRes.data.questions || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      showToastMessage('Erreur lors du chargement des données', 'danger');
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    if (evaluationId) {
      fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    feather.replace();
  }, [questions, form]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setForm({
      enonce: "",
      type: "QCM",
      choix_a: "",
      choix_b: "",
      choix_c: "",
      bonne_reponse_general: "",
      points: 1,
      explication: "",
      image: null
    });
    setErrors({});
  };

  // Gérer l'ajout d'une question
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('enonce', form.enonce);
      formData.append('type', form.type);
      formData.append('matricule_evaluation', evaluation.matricule);
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
      
      if (questionToEdit) {
        await api.post(`/formateur/update/question/${questionToEdit.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-HTTP-Method-Override': 'PUT'
          }
        });
        showToastMessage("Question mise à jour avec succès", 'success');
        setShowEditModal(false);
      } else {
        await api.post(`/formateur/store/question`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
        showToastMessage("Question ajoutée avec succès", 'success');
        setShowAddModal(false);
      }
      
      fetchData();
      resetForm();
      setQuestionToEdit(null);
      
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

  // Ouvrir la modale d'édition avec les données de la question
  const handleEdit = (question) => {
    setQuestionToEdit(question);
    setForm({
      enonce: question.enonce || "",
      type: question.type || "QCM",
      choix_a: question.choix_a || "",
      choix_b: question.choix_b || "",
      choix_c: question.choix_c || "",
      bonne_reponse_general: question.bonne_reponse_general || "",
      points: question.points || 1,
      explication: question.explication || "",
      image: null
    });
    setShowEditModal(true);
  };

  // Gérer la suppression
  const confirmDelete = (question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/formateur/destroy/question/${questionToDelete.id}`);
      fetchData();
      setShowDeleteModal(false);
      setQuestionToDelete(null);
      showToastMessage("Question supprimée avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canModifyQuestion = () => {
    if (!evaluation) return true;
    
    const now = new Date();
    const dateDebut = new Date(evaluation.date_debut);
    
    // Ne peut pas modifier si terminée
    if (evaluation.status === 'Terminée') return false;
    
    // Ne peut pas modifier si déjà commencée et programmée
    if (now > dateDebut && evaluation.status === 'Programmée') return false;
    
    return true;
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des questions...</p>
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
        <Button variant="secondary" as={Link} to="/formateur/evaluations">
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
                  Questions de l'évaluation
                </h1>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  {evaluation.titre} - {questions.length} question(s)
                </p>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            {canModifyQuestion() && (
              <Button 
                variant="success"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <i data-feather="plus" className="me-2" style={{ width: '16px', height: '16px' }} />
                Nouvelle question
              </Button>
            )}
          </div>
        </div>

        {/* Informations de l'évaluation */}
        <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body>
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                    <i data-feather="clipboard" className="text-primary" style={{ width: "20px", height: "20px" }}></i>
                  </div>
                  <div>
                    <h5 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {evaluation.titre}
                    </h5>
                    <div className="d-flex gap-2 align-items-center">
                      <small className="text-muted">{evaluation.matricule}</small>
                      <Badge bg={evaluation.status === 'Programmée' ? 'primary' : evaluation.status === 'Brouillon' ? 'warning' : 'success'}>
                        {evaluation.status}
                      </Badge>
                      <small className="text-muted">•</small>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        <i data-feather="home" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        {evaluation.matiere?.classroom?.name}
                      </small>
                      <small className="text-muted">•</small>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        <i data-feather="book" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        {evaluation.matiere?.nom}
                      </small>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-end">
                  <div className={`h4 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  {total_points_evaluation || 0} points
                  </div>
                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                    Total des points
                  </small>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {!canModifyQuestion() && (
          <Alert variant="warning" className="mb-4">
            <i data-feather="alert-triangle" className="me-2" />
            Cette évaluation ne peut plus être modifiée car elle est {evaluation.status.toLowerCase()} ou déjà commencée.
          </Alert>
        )}

        {/* Liste des questions */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="help-circle" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Questions ({questions.length})
                </span>
              </div>
              {canModifyQuestion() && (
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <i data-feather="plus" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Ajouter
                </Button>
              )}
            </div>
          </Card.Header>

          <Card.Body className={`p-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            {questions.length > 0 ? (
              <div className="table-responsive">
                <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                  <thead className="table-primary">
                    <tr>
                      <th width="50">#</th>
                      <th>Question</th>
                      <th className="text-center">Type</th>
                      <th className="text-center">Points</th>
                      <th className="text-center">Réponses</th>
                      {canModifyQuestion() && <th className="text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question, index) => (
                      <tr key={question.id}>
                        <td className="text-center">
                          <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>
                            <small className="fw-bold">{index + 1}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {question.enonce.length > 80 ? 
                                question.enonce.substring(0, 80) + "..." : 
                                question.enonce
                              }
                            </div>
                            <small className="text-muted">{question.matricule}</small>
                            {question.explication && (
                              <div className="small text-info mt-1">
                                <i data-feather="info" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                Explication disponible
                              </div>
                            )}
                            {question.image && (
                              <div className="small text-success mt-1">
                                <i data-feather="image" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                Image jointe
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-center">
                          <Badge bg={getTypeBadge(question.type)} className="px-2 py-1">
                            <i data-feather={getTypeIcon(question.type)} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                            {question.type}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="warning" className="px-2 py-1">
                            {question.points} pts
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="secondary" className="px-2 py-1">
                            {question.reponses_count || 0}
                          </Badge>
                        </td>
                        {canModifyQuestion() && (
                          <td className="text-center">
                            <ButtonGroup size="sm">
                              <Button
                                variant="outline-info"
                                as={Link}
                                to={`/formateur/show/question/${question.id}`}
                                title="Voir les détails"
                              >
                                <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                              </Button>
                              <Button
                                variant="outline-warning"
                                onClick={() => handleEdit(question)}
                                title="Modifier"
                              >
                                <i data-feather="edit" style={{ width: '14px', height: '14px' }}></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() => confirmDelete(question)}
                                title="Supprimer"
                              >
                                <i data-feather="trash-2" style={{ width: '14px', height: '14px' }}></i>
                              </Button>
                            </ButtonGroup>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="help-circle" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucune question</h6>
                    <p className="small mb-3">Cette évaluation ne contient aucune question pour le moment.</p>
                    {canModifyQuestion() && (
                      <Button 
                        variant="primary"
                        onClick={() => {
                          resetForm();
                          setShowAddModal(true);
                        }}
                      >
                        <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Créer la première question
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Modale d'ajout/édition */}
        <Modal
          show={showAddModal || showEditModal}
          onHide={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
            setQuestionToEdit(null);
          }}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>
              {questionToEdit ? 'Modifier la question' : 'Créer une question'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Row className="g-3">
                <Col md={12}>
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

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Type de question *</Form.Label>
                    <Form.Select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      isInvalid={!!errors.type}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    >
                      <option value="QCM">QCM (Choix multiples)</option>
                      <option value="Réponse_libre">Réponse libre</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.type}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
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

                {form.type === 'QCM' && (
                  <>
                    <Col md={12}>
                      <hr className="my-3" />
                      <h6 className={theme === "dark" ? "text-light" : "text-dark"}>
                        Choix multiples
                      </h6>
                    </Col>
                    
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Choix A *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Premier choix"
                          required={form.type === 'QCM'}
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
                          required={form.type === 'QCM'}
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
                        <Form.Label>Choix C</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Troisième choix (optionnel)"
                          value={form.choix_c}
                          onChange={e => setForm({ ...form, choix_c: e.target.value })}
                          isInvalid={!!errors.choix_c}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">{errors.choix_c}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Bonne réponse *</Form.Label>
                        <Form.Select
                          value={form.bonne_reponse_general}
                          onChange={e => setForm({ ...form, bonne_reponse_general: e.target.value })}
                          isInvalid={!!errors.bonne_reponse_general}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                          required={form.type === 'QCM'}
                        >
                          <option value="">Sélectionnez la bonne réponse</option>
                          {form.choix_a && <option value={form.choix_a}>A - {form.choix_a}</option>}
                          {form.choix_b && <option value={form.choix_b}>B - {form.choix_b}</option>}
                          {form.choix_c && <option value={form.choix_c}>C - {form.choix_c}</option>}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.bonne_reponse_general}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </>
                )}

                {form.type === 'Réponse_libre' && (
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Réponse attendue *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Saisissez la réponse attendue ou les mots-clés..."
                        required
                        value={form.bonne_reponse_general}
                        onChange={e => setForm({ ...form, bonne_reponse_general: e.target.value })}
                        isInvalid={!!errors.bonne_reponse_general}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">{errors.bonne_reponse_general}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                )}

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
                  </Form.Group>
                </Col>

                <Col md={6}>
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
              </Row>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                  setQuestionToEdit(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" variant="success" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    {/* <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i> */}
                    {questionToEdit ? 'Mettre à jour' : 'Créer la question'}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
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
            {questionToDelete && (
              <div className="alert alert-warning">
                <strong>Question :</strong> {questionToDelete.enonce}
              </div>
            )}
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