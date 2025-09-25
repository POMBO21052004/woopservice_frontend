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
  Modal,
  Toast,
  ToastContainer
} from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import FeatherIcon from "../../components/FeatherIcon";

export default function EditEtudiantsZoneAttenteByFormateurs() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [theme, setTheme] = useState("light");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthday: '',
    gender: '',
    code_phone: '',
    phone: '',
    matricule_classroom: '',
    profil: null
  });
  
  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirmation: ''
  });
  
  const [previewImage, setPreviewImage] = useState(null);

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

  // Charger les données de l'étudiant et des classes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userResponse, classroomResponse] = await Promise.all([
          api.get(`/formateur/edit/etudiant-espace-attente/${id}`),
          api.get('/formateur/view/etudiant-espace-attente') // Pour récupérer les classes
        ]);
        
        const userData = userResponse.data.user;
        setUser(userData);
        setClassrooms(classroomResponse.data.classrooms || []);
        
        // Pré-remplir le formulaire
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          birthday: userData.birthday || '',
          gender: userData.gender || '',
          code_phone: userData.code_phone || '',
          phone: userData.phone || '',
          matricule_classroom: userData.matricule_classroom || '',
          profil: null
        });
        
        if (userData.profil_url) {
          setPreviewImage(userData.profil_url);
        }
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [user]);

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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
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
          profil: 'Format de fichier non supporté. Utilisez JPG, PNG ou WEBP.'
        }));
        return;
      }
      
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          profil: 'La taille du fichier ne doit pas dépasser 2MB.'
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        profil: file
      }));
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Effacer l'erreur
      if (errors.profil) {
        setErrors(prev => ({
          ...prev,
          profil: null
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setErrors({});
      
      // Créer FormData pour l'upload de fichier
      const formDataToSend = new FormData();
      
      // Ajouter tous les champs sauf profil s'il n'y a pas de nouveau fichier
      Object.keys(formData).forEach(key => {
        if (key === 'profil') {
          if (formData.profil instanceof File) {
            formDataToSend.append('profil', formData.profil);
          }
        } else if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Ajouter _method pour simuler PUT avec FormData
      formDataToSend.append('_method', 'PUT');
      
      const response = await api.post(`/formateur/update/etudiant-espace-attente/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.data.status === 'success') {
        showToastMessage('Étudiant mis à jour avec succès !', 'success');
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          navigate(`/formateur/show/etudiant-espace-attente/${id}`);
        }, 2000);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        showToastMessage('Erreur de validation', 'danger');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
        showToastMessage('Erreur lors de la mise à jour', 'danger');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!passwordData.password || !passwordData.password_confirmation) {
      showToastMessage('Veuillez remplir tous les champs du mot de passe', 'danger');
      return;
    }
    
    if (passwordData.password !== passwordData.password_confirmation) {
      showToastMessage('Les mots de passe ne correspondent pas', 'danger');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await api.put(`/formateur/update/etudiant-espace-attente/${id}`, passwordData);
      
      if (response.data.status === 'success') {
        showToastMessage('Mot de passe mis à jour avec succès !', 'success');
        setShowPasswordModal(false);
        setPasswordData({ password: '', password_confirmation: '' });
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        showToastMessage(err.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe', 'danger');
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

  if (error && !user) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" as={Link} to="/formateur/view/etudiant-espace-attente">
            <i data-feather="arrow-left" className="me-2" />
            Retour à la liste
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
              to={`/formateur/show/etudiant-espace-attente/${id}`}
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <h1 className="h3 mb-0">Modifier l'étudiant</h1>
          </div>
          <p className="text-muted mb-0">
            Modification des informations de l'étudiant
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

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Formulaire principal */}
          <Col lg={8} className="mb-4">
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="user-check" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Informations personnelles
                </h5>
              </Card.Header>
              <Card.Body>
                {/* Photo de profil */}
                <Row className="mb-4">
                  <Col md={3} className="text-center">
                    <div className="position-relative d-inline-block mb-3">
                      {previewImage ? (
                        <Image
                          src={previewImage}
                          alt="Photo de profil"
                          className="rounded-circle"
                          width="120"
                          height="120"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                          style={{ width: '120px', height: '120px' }}
                        >
                          <i data-feather="user" className="text-muted" style={{ width: '48px', height: '48px' }} />
                        </div>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        className="position-absolute bottom-0 end-0 rounded-circle p-2"
                        style={{ transform: 'translate(25%, 25%)' }}
                        onClick={() => document.getElementById('profileImage').click()}
                      >
                        <i data-feather="camera" style={{ width: '12px', height: '12px' }} />
                      </Button>
                    </div>
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <p className="small text-muted mb-0">
                      JPG, PNG, WEBP - Max 2MB
                    </p>
                    {errors.profil && (
                      <div className="text-danger small mt-1">{errors.profil}</div>
                    )}
                  </Col>
                </Row>

                {/* Champs du formulaire */}
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="user" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Nom complet *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Nom complet de l'étudiant"
                        isInvalid={!!errors.name}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name?.[0]}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="mail" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Email *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="nom@email.com"
                        isInvalid={!!errors.email}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email?.[0]}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="calendar" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Date de naissance
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleInputChange}
                        isInvalid={!!errors.birthday}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.birthday?.[0]}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="user-check" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Genre
                      </Form.Label>
                      <Form.Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        isInvalid={!!errors.gender}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Masculin">Masculin</option>
                        <option value="Féminin">Féminin</option>
                        <option value="Autre">Autre</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.gender?.[0]}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="flag" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Indicatif pays
                      </Form.Label>
                      <Form.Select
                        name="code_phone"
                        value={formData.code_phone}
                        onChange={handleInputChange}
                        isInvalid={!!errors.code_phone}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="+237">+237 (Cameroun)</option>
                        <option value="+33">+33 (France)</option>
                        <option value="+235">+235 (Tchad)</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.code_phone?.[0]}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
 
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="phone" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Numéro de téléphone
                      </Form.Label>
                      <Form.Control
                        type="tel"  
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="690123456"
                        isInvalid={!!errors.phone}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone?.[0]}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Numéro de contact de l'étudiant
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i data-feather="book" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Classe *
                      </Form.Label>
                      <Form.Select
                        name="matricule_classroom"
                        value={formData.matricule_classroom}
                        onChange={handleInputChange}
                        isInvalid={!!errors.matricule_classroom}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      >
                        <option value="">Sélectionner une classe</option>
                        {classrooms.map(classroom => (
                          <option key={classroom.matricule} value={classroom.matricule}>
                            {classroom.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.matricule_classroom?.[0]}
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
                        variant="outline-warning"
                        onClick={() => setShowPasswordModal(true)}
                        className="d-flex align-items-center"
                      >
                        <i data-feather="lock" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Changer le mot de passe
                      </Button>
                      
                      <div>
                        <Button
                          variant="outline-secondary"
                          as={Link}
                          to={`/formateur/show/etudiant-espace-attente/${id}`}
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
                              Enregistrer les Modifications
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
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="help-circle" className="me-2 text-info" style={{ width: '20px', height: '20px' }} />
                  Conseils
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="small">
                  <div className="d-flex align-items-start mb-2">
                    <i data-feather="user-check" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>Utilisez le nom complet tel qu'il apparaît sur les documents officiels</span>
                  </div>
                  <div className="d-flex align-items-start mb-2">
                    <i data-feather="mail" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>L'email sera utilisé pour les notifications et communications importantes</span>
                  </div>
                  <div className="d-flex align-items-start mb-2">
                    <i data-feather="book" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>La classe détermine les matières et cours accessibles à l'étudiant</span>
                  </div>
                  <div className="d-flex align-items-start">
                    <i data-feather="phone" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>Le numéro sera utilisé pour les urgences et confirmations</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Informations sur l'étudiant */}
            {user && (
              <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <h5 className="mb-0 d-flex align-items-center">
                    <i data-feather="info" className="me-2 text-success" style={{ width: '20px', height: '20px' }} />
                    Informations actuelles
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small">Matricule</span>
                    <code className="px-2 py-1 bg-primary bg-opacity-10 rounded text-primary small">
                      {user.matricule}
                    </code>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small">Statut</span>
                    <span className={`badge ${user.role === 1 ? 'bg-success' : 'bg-warning'}`}>
                      {user.role === 1 ? 'Actif' : 'En attente'}
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small">Inscrit le</span>
                    <span className="small">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="small">Dernière modification</span>
                    <span className="small">
                      {new Date(user.updated_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Actions supplémentaires */}
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="settings" className="me-2 text-warning" style={{ width: '20px', height: '20px' }} />
                  Actions supplémentaires
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button
                    variant="outline-info"
                    as={Link}
                    to={`/formateur/show/etudiant-espace-attente/${id}`}
                  >
                    <i data-feather="eye" className="me-2" style={{ width: '16px', height: '16px' }} />
                    Voir le profil
                  </Button>
                  <Button
                    variant="outline-primary"
                    as={Link}
                    to="/formateur/view/etudiant-espace-attente"
                  >
                    <i data-feather="users" className="me-2" style={{ width: '16px', height: '16px' }} />
                    Tous les étudiants
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Modal de changement de mot de passe */}
      <Modal 
        show={showPasswordModal} 
        onHide={() => setShowPasswordModal(false)} 
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header 
          closeButton
          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
        >
          <Modal.Title className="d-flex align-items-center">
            <i data-feather="lock" className="me-2" style={{ width: '20px', height: '20px' }} />
            Changer le mot de passe
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordUpdate}>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <Form.Group className="mb-3">
              <Form.Label>Nouveau mot de passe</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
                placeholder="Entrez le nouveau mot de passe"
                isInvalid={!!errors.password}
                className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.[0]}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Minimum 8 caractères avec majuscules, minuscules et chiffres
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirmer le mot de passe</Form.Label>
              <Form.Control
                type="password"
                name="password_confirmation"
                value={passwordData.password_confirmation}
                onChange={handlePasswordChange}
                placeholder="Confirmez le nouveau mot de passe"
                className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button
              variant="secondary"
              onClick={() => setShowPasswordModal(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </Modal.Footer>
        </Form>
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
    </FormateurLayout>
  );
}