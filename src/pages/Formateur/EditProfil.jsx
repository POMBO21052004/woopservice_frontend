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
  InputGroup,
  Modal
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import FeatherIcon from "../../components/FeatherIcon";

export default function ProfilEditFormateur() {
  const { user: authUser, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthday: '',
    gender: '',
    code_phone: '',
    phone: '',
    profil: null
  });
  
  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirmation: ''
  });
  
  const [previewImage, setPreviewImage] = useState(null);

  // Charger les données du profil
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/me');
        const userData = response.data;
        setUser(userData);
        
        // Pré-remplir le formulaire
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          birthday: userData.birthday || '',
          gender: userData.gender || '',
          code_phone: userData.code_phone || '',
          phone: userData.phone || '',
          profil: null
        });
        
        if (userData.profil) {
          setPreviewImage(`${userData.profil_url}`);
        }
      } catch (err) {
        setError('Erreur lors du chargement du profil');
        console.error('Erreur profil:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

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
      setSuccess(null);
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
      
      const response = await api.post('/me/update', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.data.status === 'success') {
        setSuccess('Profil mis à jour avec succès !');
        
        // Mettre à jour le contexte utilisateur
        if (updateUser) {
          updateUser(response.data.data.user);
        }
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          navigate('/formateur/view/profil');
        }, 2000);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!passwordData.password || !passwordData.password_confirmation) {
      setError('Veuillez remplir tous les champs du mot de passe');
      return;
    }
    
    if (passwordData.password !== passwordData.password_confirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await api.put('/me/update', passwordData);
      
      if (response.data.status === 'success') {
        setSuccess('Mot de passe mis à jour avec succès !');
        setShowPasswordModal(false);
        setPasswordData({ password: '', password_confirmation: '' });
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe');
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
          <p className="mt-2">Chargement du profil...</p>
        </div>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Modifier mon profil</h1>
          <p className="text-muted mb-0">
            Mettez à jour vos informations professionnelles
          </p>
        </div>
        <Button 
          variant="outline-secondary" 
          size="lg" 
          as={Link} 
          to="/admin-systeme/view/profil"
          className="d-flex align-items-center"
        >
          <i data-feather="arrow-left" className="me-2" style={{ width: '20px', height: '20px' }} />
          Retour au profil
        </Button>
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
            <Card className="border-0 shadow-sm">
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="user-check" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Informations professionnelles
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
                          <i data-feather="user-check" className="text-muted" style={{ width: '48px', height: '48px' }} />
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
                        placeholder="Dr. Votre nom complet"
                        isInvalid={!!errors.name}
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
                        Email professionnel *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="dr.nom@hopital.com"
                        isInvalid={!!errors.email}
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
                        max={new Date().toISOString().split('T')[0]}
                        isInvalid={!!errors.birthday}
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
                      >
                        <option value="">Sélectionner...</option>
                        <option value="+237">+237</option>
                        <option value="+33">+33</option>
                        <option value="+235">+235</option>
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
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone?.[0]}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Numéro pour les urgences et rendez-vous
                      </Form.Text>
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
                          to="/admin-systeme/view/profil"
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
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="help-circle" className="me-2 text-info" style={{ width: '20px', height: '20px' }} />
                  Conseils professionnels
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="small">
                  <div className="d-flex align-items-start mb-2">
                    <i data-feather="user-check" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>Utilisez votre nom complet tel qu'il apparaît sur votre acte de naissance</span>
                  </div>
                  <div className="d-flex align-items-start mb-2">
                    <i data-feather="mail" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>Utilisez un email professionnel pour recevoir les notifications</span>
                  </div>
                  <div className="d-flex align-items-start">
                    <i data-feather="phone" className="text-primary me-2 mt-1" style={{ width: '14px', height: '14px' }} />
                    <span>Votre numéro sera utilisé pour les urgences et confirmations</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Sécurité */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="shield" className="me-2 text-success" style={{ width: '20px', height: '20px' }} />
                  Sécurité du compte
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small">Mot de passe</span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Modifier
                  </Button>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small">Email vérifié</span>
                  <i data-feather="check-circle" className="text-success" style={{ width: '16px', height: '16px' }} />
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small">Compte Administrateur systeme</span>
                  <i data-feather="user-check" className="text-success" style={{ width: '16px', height: '16px' }} />
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="small">Profil sécurisé</span>
                  <i data-feather="shield" className="text-success" style={{ width: '16px', height: '16px' }} />
                </div>
              </Card.Body>
            </Card>

            {/* Informations importantes */}
            <Card className="border-0 shadow-sm border-warning">
              <Card.Header className="bg-warning bg-opacity-10 border-0">
                <h5 className="mb-0 d-flex align-items-center text-warning">
                  <i data-feather="alert-triangle" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Important
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="small mb-2">
                  <strong>Champs obligatoires :</strong> Nom et email sont requis pour votre profil.
                </p>
                <p className="small mb-2">
                  <strong>Photo de profil :</strong> Une photo professionnelle inspire confiance aux patients.
                </p>
                <p className="small mb-0">
                  <strong>Validation :</strong> Vos informations peuvent être vérifiées par l'administration.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Modal de changement de mot de passe */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <i data-feather="lock" className="me-2" style={{ width: '20px', height: '20px' }} />
            Changer le mot de passe
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePasswordUpdate}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nouveau mot de passe</Form.Label>
              <InputGroup>
                <Form.Control
                  type="password"
                  name="password"
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  placeholder="Entrez votre nouveau mot de passe"
                  isInvalid={!!errors.password}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password?.[0]}
                </Form.Control.Feedback>
              </InputGroup>
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
                placeholder="Confirmez votre nouveau mot de passe"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
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

    </FormateurLayout>
  );
}