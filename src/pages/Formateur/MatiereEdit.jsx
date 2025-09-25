import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Button, Form, Alert, Spinner, Image, Toast, ToastContainer } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import FeatherIcon from "../../components/FeatherIcon";

export default function MatiereEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState("light");
  const [classrooms, setClassrooms] = useState([]);

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    nom: "",
    description: "",
    matricule_classroom: "",
    coefficient: 1,
    status: "Active",
    image: null,
    current_image_url: ""
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

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

  // Charger les données de la matière et les classes
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [matiereResponse, classroomResponse] = await Promise.all([
        api.get(`/formateur/edit/matiere/${id}`),
        api.get("/formateur/view/matiere")
      ]);

      const matiere = matiereResponse.data.matiere;
      setForm({
        nom: matiere.nom || "",
        description: matiere.description || "",
        matricule_classroom: matiere.matricule_classroom || "",
        coefficient: matiere.coefficient || 1,
        status: matiere.status || "Active",
        image: null,
        current_image_url: matiere.image_url || ""
      });

      setClassrooms(classroomResponse.data.classrooms || []);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [fetchData]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [form, errors]);

  // Gérer les changements du formulaire
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setForm(prev => ({ ...prev, [name]: file }));
      
      // Créer un aperçu de l'image
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }

    // Supprimer l'erreur pour ce champ si elle existe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('nom', form.nom);
      formData.append('description', form.description);
      formData.append('matricule_classroom', form.matricule_classroom);
      formData.append('coefficient', form.coefficient);
      formData.append('status', form.status);
      formData.append('_method', 'PUT'); // Pour Laravel
      
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post(`/formateur/update/matiere/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      showToastMessage("Matière mise à jour avec succès", 'success');
      setTimeout(() => {
        navigate(`/formateur/show/matiere/${id}`);
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

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des données...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (error) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" as={Link} to="/formateur/view/matiere">
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
              to={`/formateur/show/matiere/${id}`}
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <h1 className="h3 mb-0">Modifier la matière</h1>
          </div>
          <p className="text-muted mb-0">
            Modification des informations de la matière
          </p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Formulaire principal */}
          <Col lg={8}>
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="edit" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Informations générales
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i data-feather="book" className="me-1" style={{ width: '14px', height: '14px' }} />
                        Nom de la matière *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="nom"
                        placeholder="Ex: Mathématiques, Français..."
                        value={form.nom}
                        onChange={handleInputChange}
                        isInvalid={!!errors.nom}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      />
                      <Form.Control.Feedback type="invalid">{errors.nom}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i data-feather="home" className="me-1" style={{ width: '14px', height: '14px' }} />
                        Classe *
                      </Form.Label>
                      <Form.Select
                        name="matricule_classroom"
                        value={form.matricule_classroom}
                        onChange={handleInputChange}
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
                      <Form.Label className="fw-bold">
                        <i data-feather="award" className="me-1" style={{ width: '14px', height: '14px' }} />
                        Coefficient
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="coefficient"
                        min="1"
                        max="10"
                        value={form.coefficient}
                        onChange={handleInputChange}
                        isInvalid={!!errors.coefficient}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">{errors.coefficient}</Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Entre 1 et 10 (défaut: 1)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i data-feather="activity" className="me-1" style={{ width: '14px', height: '14px' }} />
                        Statut *
                      </Form.Label>
                      <Form.Select
                        name="status"
                        value={form.status}
                        onChange={handleInputChange}
                        isInvalid={!!errors.status}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspendue">Suspendue</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i data-feather="file-text" className="me-1" style={{ width: '14px', height: '14px' }} />
                        Description
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        placeholder="Description de la matière..."
                        value={form.description}
                        onChange={handleInputChange}
                        isInvalid={!!errors.description}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Maximum 1000 caractères
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Actions */}
            <div className="d-flex gap-2 justify-content-end">
              <Button 
                variant="secondary" 
                as={Link} 
                to={`/formateur/show/matiere/${id}`}
                disabled={saving}
              >
                <i data-feather="x" className="me-2" style={{ width: '16px', height: '16px' }} />
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="success"
                disabled={saving}
                className="d-flex align-items-center"
              >
                {saving ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                    <FeatherIcon icon="save" size={16} className="me-2" />
                )}
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Image de la matière */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="image" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Image de la matière
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <div className="position-relative d-inline-block">
                    <Image
                      src={imagePreview || form.current_image_url || "/placeholder/matiere_placeholder.png"}
                      alt="Aperçu de l'image"
                      className="rounded"
                      width="200"
                      height="150"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
                
                <Form.Group>
                  <Form.Label>Changer l'image</Form.Label>
                  <Form.Control
                    type="file"
                    name="image"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleInputChange}
                    isInvalid={!!errors.image}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                  <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    JPG, PNG, WEBP - Max 2MB
                  </Form.Text>
                </Form.Group>
                
                {imagePreview && (
                  <div className="mt-2">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        setForm(prev => ({ ...prev, image: null }));
                        setImagePreview(null);
                        // Reset file input
                        const fileInput = document.querySelector('input[name="image"]');
                        if (fileInput) fileInput.value = '';
                      }}
                    >
                      <i data-feather="x" className="me-1" style={{ width: '14px', height: '14px' }} />
                      Supprimer l'aperçu
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Aide */}
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="help-circle" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Aide
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="small">
                  <div className="mb-3">
                    <strong className="text-primary">Nom de la matière</strong>
                    <p className="mb-0 text-muted">
                      Utilisez un nom clair et descriptif (ex: Mathématiques Niveau 1)
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <strong className="text-success">Coefficient</strong>
                    <p className="mb-0 text-muted">
                      Définit l'importance de la matière dans les calculs de moyennes
                    </p>
                  </div>
                  
                  <div className="mb-0">
                    <strong className="text-warning">Statut</strong>
                    <ul className="mb-0 text-muted ps-3">
                      <li><strong>Active</strong> : Visible et accessible</li>
                      <li><strong>Inactive</strong> : Masquée temporairement</li>
                      <li><strong>Suspendue</strong> : Bloquée définitivement</li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

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