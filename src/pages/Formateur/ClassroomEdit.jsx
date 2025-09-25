import React, { useState, useEffect } from "react";
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Form, 
  Alert, 
  Spinner, 
  Image,
  Modal
} from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import FeatherIcon from "../../components/FeatherIcon";

export default function ClassroomEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    examen: '',
    status: 'Open',
    image: null
  });
  
  const [previewImage, setPreviewImage] = useState(null);
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

  // Charger les données de la salle de classe
  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/formateur/classroom/${id}/edit`);
        const classroomData = response.data.classroom;
        setClassroom(classroomData);
        
        // Pré-remplir le formulaire
        setFormData({
          name: classroomData.name || '',
          description: classroomData.description || '',
          examen: classroomData.examen || '',
          status: classroomData.status || 'Open',
          image: null
        });
        
        if (classroomData.image_url) {
          setPreviewImage(classroomData.image_url);
        }
      } catch (err) {
        setError('Erreur lors du chargement de la salle de classe');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClassroom();
    }
  }, [id]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [classroom]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation du fichier
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 2048 * 1024; // 2MB
      
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          image: 'Format de fichier non supporté. Utilisez JPG, PNG ou WEBP.'
        }));
        return;
      }
      
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          image: 'La taille du fichier ne doit pas dépasser 2MB.'
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Effacer l'erreur
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: null
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setErrors({});
      
      // Créer FormData pour l'upload de fichier
      const formDataToSend = new FormData();
      
      // Ajouter tous les champs
      Object.keys(formData).forEach(key => {
        if (key === 'image') {
          if (formData.image instanceof File) {
            formDataToSend.append('image', formData.image);
          }
        } else if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Ajouter _method pour simuler PUT avec FormData
      formDataToSend.append('_method', 'PUT');
      
      const response = await api.post(`/formateur/update/classroom/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.data.status === 'success') {
        setSuccess('Salle de classe mise à jour avec succès !');
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          navigate(`/formateur/show/classroom/${id}`);
        }, 2000);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la mise à jour de la salle');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await api.delete(`/formateur/destroy/classroom/${id}`);
      navigate('/formateur/view/classrooms');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      setShowDeleteModal(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement de la salle...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (error && !classroom) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
        <Button variant="secondary" as={Link} to="/formateur/view/classrooms">
          <i data-feather="arrow-left" className="me-2" />
          Retour à la liste
        </Button>
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
              to={`/formateur/show/classroom/${id}`}
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <h1 className="h3 mb-0">Modifier la salle</h1>
          </div>
          <p className="text-muted mb-0">
            Modifiez les informations de la salle de classe
          </p>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          <i data-feather="check-circle" className="me-2" />
          {success}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Formulaire principal */}
          <Col lg={8} className="mb-4">
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="home" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Informations de la salle
                </h5>
              </Card.Header>
              <Card.Body>
                {/* Image de la salle */}
                <Row className="mb-4">
                  <Col md={4} className="text-center">
                    <div className="position-relative d-inline-block mb-3">
                      {previewImage ? (
                        <Image
                          src={previewImage}
                          alt="Image de la salle"
                          className="rounded"
                          width="200"
                          height="150"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded bg-light d-flex align-items-center justify-content-center border"
                          style={{ width: '200px', height: '150px' }}
                        >
                          <i data-feather="home" className="text-muted" style={{ width: '48px', height: '48px' }} />
                        </div>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        className="position-absolute bottom-0 end-0 rounded-circle p-2"
                        style={{ transform: 'translate(25%, 25%)' }}
                        onClick={() => document.getElementById('classroomImage').click()}
                      >
                        <i data-feather="camera" style={{ width: '12px', height: '12px' }} />
                      </Button>
                    </div>
                    <input
                      type="file"
                      id="classroomImage"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <p className="small text-muted mb-0">
                      JPG, PNG, WEBP - Max 2MB
                    </p>
                    {errors.image && (
                      <div className="text-danger small mt-1">{errors.image}</div>
                    )}
                  </Col>
                  <Col md={8}>
                    <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <h6 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="info" className="me-1" style={{ width: '16px', height: '16px' }} />
                        Informations actuelles
                      </h6>
                      <div className="small">
                        <div className="mb-1">
                          <strong>Matricule :</strong> <span className={`font-monospace ${theme === "dark" ? "text-light" : "text-muted"}`}>{classroom?.matricule}</span>
                        </div>
                        <div className="mb-1">
                          <strong>Créée le :</strong> <span className={theme === "dark" ? "text-light" : "text-muted"}>
                            {classroom?.created_at ? new Date(classroom.created_at).toLocaleDateString('fr-FR') : 'Non disponible'}
                          </span>
                        </div>
                        <div>
                          <strong>Utilisateurs :</strong> <span className={`fw-bold text-primary`}>
                            {classroom?.users_count || 0} assigné(s)
                          </span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Champs du formulaire */}
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="type" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Nom de la salle *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Ex: Salle A101"
                        isInvalid={!!errors.name}
                        required
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name?.[0]}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                      
                      
                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="file-text" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Examen (optionnel)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="examen"
                        value={formData.examen}
                        onChange={handleInputChange}
                        placeholder="Ex: Examen final 2024"
                        isInvalid={!!errors.examen}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.examen?.[0]}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Spécifiez le type d'examen si cette salle est dédiée aux examens
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="align-left" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Description
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Description détaillée de la salle de classe..."
                        isInvalid={!!errors.description}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.description?.[0]}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Décrivez les caractéristiques, équipements et particularités de la salle
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="activity" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Statut *
                      </Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        isInvalid={!!errors.status}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      >
                        <option value="Open">Ouverte</option>
                        <option value="Close">Fermée</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.status?.[0]}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                </Row>

                <hr className="my-4" />

                {/* Boutons d'action */}
                <Row>
                  <Col md={12}>
                    <div className="d-flex justify-content-between">
                      <Button
                        variant="outline-danger"
                        onClick={() => setShowDeleteModal(true)}
                        className="d-flex align-items-center"
                        disabled={saving}
                      >
                        <i data-feather="trash-2" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Supprimer la salle
                      </Button>
                      
                      <div>
                        <Button
                          variant="outline-secondary"
                          as={Link}
                          to={`/formateur/show/classroom/${id}`}
                          className="me-2"
                          disabled={saving}
                        >
                          Annuler
                        </Button>
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={saving}
                          className="d-flex align-items-center"
                        >
                          {saving ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Mise à jour...
                            </>
                          ) : (
                            <>
                              <FeatherIcon icon="save" size={16} className="me-2" />
                              Enregistrer les modifications
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Colonne latérale */}
          <Col lg={4}>
            {/* Aide et conseils */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="bg-white border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="help-circle" className="me-2 text-info" style={{ width: '20px', height: '20px' }} />
                  Conseils de modification
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="small">
                  <div className="d-flex align-items-start mb-2">
                    <i data-feather="type" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>Utilisez un nom descriptif et unique pour identifier facilement la salle</span>
                  </div>
                  <div className="d-flex align-items-start mb-2">
                    <i data-feather="image" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>Une image représentative aide à identifier rapidement la salle</span>
                  </div>
                  <div className="d-flex align-items-start mb-2">
                    <i data-feather="activity" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>Le statut "Fermée" empêche l'accès des utilisateurs</span>
                  </div>
                  <div className="d-flex align-items-start">
                    <i data-feather="align-left" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>La description détaille les équipements et spécificités</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Informations sur les utilisateurs */}
            {classroom?.users_count > 0 && (
              <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className="bg-white border-0">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i data-feather="users" className="me-2 text-warning" style={{ width: '20px', height: '20px' }} />
                    Utilisateurs assignés
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center mb-3">
                    <div className="text-warning mb-2">
                      <i data-feather="users" style={{ width: '32px', height: '32px' }} />
                    </div>
                    <h4 className="text-warning mb-0">{classroom.users_count}</h4>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Utilisateur(s) dans cette salle
                    </small>
                  </div>
                  
                  <div className="alert alert-warning">
                    <i data-feather="alert-triangle" className="me-2" style={{ width: '16px', height: '16px' }} />
                    Cette salle contient des utilisateurs. La fermer les empêchera d'y accéder.
                  </div>
                  
                  <Button 
                    variant="outline-info" 
                    size="sm" 
                    as={Link} 
                    to={`/formateur/view/classroom/${id}/users`}
                    className="w-100"
                  >
                    <i data-feather="eye" className="me-2" style={{ width: '14px', height: '14px' }} />
                    Voir les utilisateurs
                  </Button>
                </Card.Body>
              </Card>
            )}

            {/* Statistiques */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="bg-white border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="bar-chart-2" className="me-2 text-success" style={{ width: '20px', height: '20px' }} />
                  Informations
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="small">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Matricule :</span>
                    <span className={`fw-bold font-monospace ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {classroom?.matricule}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Créée le :</span>
                    <span className={theme === "dark" ? "text-light" : "text-dark"}>
                      {classroom?.created_at ? new Date(classroom.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Statut actuel :</span>
                    <span className={`fw-bold ${classroom?.status === 'Open' ? 'text-success' : 'text-danger'}`}>
                      {classroom?.status === 'Open' ? 'Ouverte' : 'Fermée'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Utilisateurs :</span>
                    <span className="fw-bold text-primary">{classroom?.users_count || 0}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Zone de danger */}
            <Card className="border-0 shadow-sm border-danger">
              <Card.Header className="bg-danger bg-opacity-10 border-0">
                <h5 className="mb-0 d-flex align-items-center text-danger">
                  <i data-feather="alert-triangle" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Zone de danger
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="small mb-2">
                  <strong>Suppression définitive :</strong> Cette action supprimera la salle et toutes ses données.
                </p>
                {classroom?.users_count > 0 && (
                  <p className="small mb-2 text-warning">
                    <strong>Attention :</strong> {classroom.users_count} utilisateur(s) sont assignés à cette salle.
                  </p>
                )}
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="w-100"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={saving}
                >
                  <i data-feather="trash-2" className="me-2" style={{ width: '14px', height: '14px' }} />
                  Supprimer cette salle
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Modal de suppression */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>
            <i data-feather="trash-2" className="me-2 text-danger" style={{ width: '20px', height: '20px' }} />
            Supprimer la salle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>
            Êtes-vous sûr de vouloir supprimer définitivement la salle <strong>"{classroom?.name}"</strong> ?
          </p>
          <div className="alert alert-danger">
            <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            <strong>Cette action est irréversible.</strong>
            {classroom?.users_count > 0 && (
              <div className="mt-2">
                Cette salle contient {classroom.users_count} utilisateur(s) qui devront être réassignés à d'autres salles.
              </div>
            )}
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>Tapez le nom de la salle pour confirmer :</Form.Label>
            <Form.Control
              type="text"
              placeholder={classroom?.name}
              className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
            />
            <Form.Text className="text-muted">
              Cette vérification empêche les suppressions accidentelles
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Suppression...
              </>
            ) : (
              <>
                <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }} />
                Supprimer définitivement
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </FormateurLayout>
  );
} 
                  