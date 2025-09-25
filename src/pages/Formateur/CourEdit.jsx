import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Button, Form, Alert, Spinner, Toast, ToastContainer, Image } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import FeatherIcon from "../../components/FeatherIcon";

export default function CoursEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState("light");
  const [matieres, setMatieres] = useState([]);

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    titre: "",
    description: "",
    contenu: "",
    matricule_matiere: "",
    fichiers_joints_1: null,
    fichiers_joints_2: null,
    liens_externes: "",
    status: "Brouillon",
    current_fichier_1: null,
    current_fichier_2: null
  });

  const [errors, setErrors] = useState({});
  const [filePreview1, setFilePreview1] = useState(null);
  const [filePreview2, setFilePreview2] = useState(null);

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

  // Charger les données du cours et les matières
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursResponse, matieresResponse] = await Promise.all([
        api.get(`/formateur/show/cours/${id}`),
        api.get("/formateur/view/cours")
      ]);

      const cours = coursResponse.data.cours;
      setForm({
        titre: cours.titre || "",
        description: cours.description || "",
        contenu: cours.contenu || "",
        matricule_matiere: cours.matricule_matiere || "",
        fichiers_joints_1: null,
        fichiers_joints_2: null,
        liens_externes: cours.liens_externes_decoded ? cours.liens_externes_decoded.join('\n') : "",
        status: cours.status || "Brouillon",
        current_fichier_1: cours.fichiers_joints_1_decoded || null,
        current_fichier_2: cours.fichiers_joints_2_decoded || null
      });

      setMatieres(matieresResponse.data.matieres || []);
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
      
      // Créer un aperçu si c'est une image
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (name === 'fichiers_joints_1') {
            setFilePreview1(e.target.result);
          } else {
            setFilePreview2(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        if (name === 'fichiers_joints_1') {
          setFilePreview1(null);
        } else {
          setFilePreview2(null);
        }
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
      formData.append('titre', form.titre);
      formData.append('description', form.description);
      formData.append('contenu', form.contenu);
      formData.append('matricule_matiere', form.matricule_matiere);
      formData.append('status', form.status);
      formData.append('_method', 'PUT'); // Pour Laravel
      
      if (form.fichiers_joints_1) {
        formData.append('fichiers_joints_1', form.fichiers_joints_1);
      }
      if (form.fichiers_joints_2) {
        formData.append('fichiers_joints_2', form.fichiers_joints_2);
      }
      if (form.liens_externes) {
        formData.append('liens_externes', JSON.stringify(form.liens_externes.split('\n').filter(l => l.trim())));
      }

      await api.post(`/formateur/update/cours/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      showToastMessage("Cours mis à jour avec succès", 'success');
      setTimeout(() => {
        navigate(`/formateur/show/cours/${id}`);
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

  // Fonction pour détecter le type de fichier et son icône
  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return 'file-text';
    if (type?.includes('word') || type?.includes('document')) return 'file-text';
    if (type?.includes('sheet') || type?.includes('excel')) return 'grid';
    if (type?.includes('presentation') || type?.includes('powerpoint')) return 'monitor';
    if (type?.includes('image')) return 'image';
    if (type?.includes('text')) return 'file-text';
    return 'file';
  };

  const getFileColor = (type) => {
    if (type?.includes('pdf')) return 'text-danger';
    if (type?.includes('word') || type?.includes('document')) return 'text-primary';
    if (type?.includes('sheet') || type?.includes('excel')) return 'text-success';
    if (type?.includes('presentation') || type?.includes('powerpoint')) return 'text-warning';
    if (type?.includes('image')) return 'text-info';
    return 'text-secondary';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canPreviewImage = (type) => {
    return type?.includes('image');
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
          <Button variant="secondary" as={Link} to="/formateur/view/cours">
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
              to={`/formateur/show/cours/${id}`}
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <h1 className="h3 mb-0">Modifier le cours</h1>
          </div>
          <p className="text-muted mb-0">
            Modification des informations du cours
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
                        <i data-feather="book-open" className="me-1" style={{ width: '14px', height: '14px' }} />
                        Titre du cours *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="titre"
                        placeholder="Ex: Introduction aux fonctions..."
                        value={form.titre}
                        onChange={handleInputChange}
                        isInvalid={!!errors.titre}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      />
                      <Form.Control.Feedback type="invalid">{errors.titre}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i data-feather="book" className="me-1" style={{ width: '14px', height: '14px' }} />
                        Matière *
                      </Form.Label>
                      <Form.Select
                        name="matricule_matiere"
                        value={form.matricule_matiere}
                        onChange={handleInputChange}
                        isInvalid={!!errors.matricule_matiere}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      >
                        <option value="">Sélectionnez une matière</option>
                        {matieres.map(matiere => (
                          <option key={matiere.matricule} value={matiere.matricule}>
                            {matiere.nom} - {matiere.classroom?.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.matricule_matiere}</Form.Control.Feedback>
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
                        <option value="Brouillon">Brouillon</option>
                        <option value="Publié">Publié</option>
                        <option value="Archivé">Archivé</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i data-feather="external-link" className="me-1" style={{ width: '14px', height: '14px' }} />
                        Liens externes
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="liens_externes"
                        placeholder="Un lien par ligne..."
                        value={form.liens_externes}
                        onChange={handleInputChange}
                        isInvalid={!!errors.liens_externes}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">{errors.liens_externes}</Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Séparez chaque lien par une nouvelle ligne
                      </Form.Text>
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
                        rows={3}
                        name="description"
                        placeholder="Description courte du cours..."
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

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i data-feather="edit-3" className="me-1" style={{ width: '14px', height: '14px' }} />
                        Contenu du cours *
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={8}
                        name="contenu"
                        placeholder="Contenu détaillé du cours..."
                        value={form.contenu}
                        onChange={handleInputChange}
                        isInvalid={!!errors.contenu}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      />
                      <Form.Control.Feedback type="invalid">{errors.contenu}</Form.Control.Feedback>
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
                to={`/formateur/show/cours/${id}`}
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
            {/* Fichiers joints */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="paperclip" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Fichiers joints
                </h5>
              </Card.Header>
              <Card.Body>
                {/* Fichier 1 */}
                <div className="mb-4">
                  <Form.Label className="fw-bold">Fichier joint 1</Form.Label>
                  
                  {/* Affichage du fichier actuel */}
                  {form.current_fichier_1 && form.current_fichier_1.length > 0 && (
                    <div className="mb-3 p-3 border rounded">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <i 
                              data-feather={getFileIcon(form.current_fichier_1[0].type)} 
                              className={`me-2 ${getFileColor(form.current_fichier_1[0].type)}`} 
                              style={{ width: '20px', height: '20px' }} 
                            />
                            <strong className={theme === "dark" ? "text-light" : "text-dark"}>
                              {form.current_fichier_1[0].nom}
                            </strong>
                          </div>
                          <div className="small text-muted">
                            Taille: {formatFileSize(form.current_fichier_1[0].taille)}
                          </div>
                          {canPreviewImage(form.current_fichier_1[0].type) && (
                            <div className="mt-2">
                              <Image
                                src={form.current_fichier_1[0].url}
                                alt={form.current_fichier_1[0].nom}
                                thumbnail
                                style={{ maxWidth: '150px', maxHeight: '100px' }}
                              />
                            </div>
                          )}
                        </div>
                        <small className="text-success">Fichier actuel</small>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload nouveau fichier */}
                  <Form.Control
                    type="file"
                    name="fichiers_joints_1"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                    onChange={handleInputChange}
                    isInvalid={!!errors.fichiers_joints_1}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                  <Form.Control.Feedback type="invalid">{errors.fichiers_joints_1}</Form.Control.Feedback>
                  
                  {/* Aperçu nouveau fichier */}
                  {filePreview1 && (
                    <div className="mt-2">
                      <small className="text-info d-block mb-2">Nouveau fichier:</small>
                      <Image
                        src={filePreview1}
                        alt="Aperçu"
                        thumbnail
                        style={{ maxWidth: '150px', maxHeight: '100px' }}
                      />
                    </div>
                  )}
                  
                  <Form.Text className="text-muted">
                    PDF, DOC, PPT, XLS, JPG, PNG, TXT - Max 10MB
                    {form.current_fichier_1 && " (Remplacera le fichier actuel)"}
                  </Form.Text>
                </div>

                {/* Fichier 2 */}
                <div>
                  <Form.Label className="fw-bold">Fichier joint 2</Form.Label>
                  
                  {/* Affichage du fichier actuel */}
                  {form.current_fichier_2 && form.current_fichier_2.length > 0 && (
                    <div className="mb-3 p-3 border rounded">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <i 
                              data-feather={getFileIcon(form.current_fichier_2[0].type)} 
                              className={`me-2 ${getFileColor(form.current_fichier_2[0].type)}`} 
                              style={{ width: '20px', height: '20px' }} 
                            />
                            <strong className={theme === "dark" ? "text-light" : "text-dark"}>
                              {form.current_fichier_2[0].nom}
                            </strong>
                          </div>
                          <div className="small text-muted">
                            Taille: {formatFileSize(form.current_fichier_2[0].taille)}
                          </div>
                          {canPreviewImage(form.current_fichier_2[0].type) && (
                            <div className="mt-2">
                              <Image
                                src={form.current_fichier_2[0].url}
                                alt={form.current_fichier_2[0].nom}
                                thumbnail
                                style={{ maxWidth: '150px', maxHeight: '100px' }}
                              />
                            </div>
                          )}
                        </div>
                        <small className="text-success">Fichier actuel</small>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload nouveau fichier */}
                  <Form.Control
                    type="file"
                    name="fichiers_joints_2"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                    onChange={handleInputChange}
                    isInvalid={!!errors.fichiers_joints_2}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                  <Form.Control.Feedback type="invalid">{errors.fichiers_joints_2}</Form.Control.Feedback>
                  
                  {/* Aperçu nouveau fichier */}
                  {filePreview2 && (
                    <div className="mt-2">
                      <small className="text-info d-block mb-2">Nouveau fichier:</small>
                      <Image
                        src={filePreview2}
                        alt="Aperçu"
                        thumbnail
                        style={{ maxWidth: '150px', maxHeight: '100px' }}
                      />
                    </div>
                  )}
                  
                  <Form.Text className="text-muted">
                    PDF, DOC, PPT, XLS, JPG, PNG, TXT - Max 10MB
                    {form.current_fichier_2 && " (Remplacera le fichier actuel)"}
                  </Form.Text>
                </div>
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
                    <strong className="text-primary">Statuts disponibles</strong>
                    <ul className="mb-0 text-muted ps-3 mt-1">
                      <li><strong>Brouillon</strong> : Non visible par les étudiants</li>
                      <li><strong>Publié</strong> : Visible et accessible</li>
                      <li><strong>Archivé</strong> : Masqué mais conservé</li>
                    </ul>
                  </div>
                  
                  <div className="mb-3">
                    <strong className="text-success">Fichiers joints</strong>
                    <p className="mb-0 text-muted">
                      Supports PDF, documents Office, images. Taille max: 10MB par fichier.
                    </p>
                  </div>
                  
                  <div className="mb-0">
                    <strong className="text-warning">Liens externes</strong>
                    <p className="mb-0 text-muted">
                      Ajoutez des ressources web, vidéos YouTube, etc. Un lien par ligne.
                    </p>
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