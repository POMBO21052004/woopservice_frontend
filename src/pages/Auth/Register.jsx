import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ProgressBar } from "react-bootstrap";
import api from "../../services/api";
import feather from "feather-icons";
import FeatherIcon from "../../components/FeatherIcon";

const Register = () => {

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    student_level: "",
  });
  const [classrooms, setClassrooms] = useState([]);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Détection du thème
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
  
  // Initialisation des icônes Feather
  useEffect(() => {
    feather.replace();
  }, [theme, error, isLoading, successMessage, classrooms]);

  // Calcul de la force du mot de passe
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 25) return "danger";
    if (strength < 50) return "warning";
    if (strength < 75) return "info";
    return "success";
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return "Très faible";
    if (strength < 50) return "Faible";
    if (strength < 75) return "Moyen";
    return "Fort";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: null });
    setError(null);

    // Calculer la force du mot de passe
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  useEffect(() => {
    api.get('/register/data').then(res => {
      if(res.data.status === 'success') setClassrooms(res.data.classrooms || []);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validation des conditions d'utilisation
    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation pour continuer");
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post("/register", form);
      setSuccessMessage(res.data.message || "Inscription réussie ! Redirection vers la connexion...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const response = err.response;
      if (response?.status === 422 && response.data?.errors) {
        setFieldErrors(response.data.errors);
      } else {
        setError(response?.data?.message || "Une erreur s'est produite lors de l'inscription");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    const newTheme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      setTheme(savedTheme);
    }
  }, []);

  return (
    <div className={`min-vh-100 d-flex align-items-center py-4 ${
      theme === "dark" 
        ? "bg-dark" 
        : "bg-light"
    }`} style={{
      background: theme === "dark" 
        ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
        : "linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 50%, #e8f5e8 100%)"
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col xl={6} lg={7} md={9} sm={11}>
            {/* En-tête avec logo et branding éducatif */}
            <div className="text-center mb-4">
              
              <h1 className={`h3 fw-bold mb-2 ${
                theme === "dark" ? "text-light" : "text-dark"
              }`}>
                <i data-feather="book-open" className="text-primary me-2" style={{ width: "24px", height: "24px" }}></i>
                Rejoindre Woop Service
              </h1>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Créez votre compte étudiant pour accéder à tous vos cours
              </p>
              <div className="d-flex justify-content-center align-items-center mt-2">
                <div className="badge bg-info bg-opacity-10 text-info px-3 py-1 rounded-pill">
                  <i data-feather="users" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Rejoignez l'univers de l'apprentissage
                </div>
              </div>
            </div>

            {/* Carte principale d'inscription */}
            <Card className={`shadow-lg border-0 overflow-hidden ${
              theme === "dark" ? "bg-dark" : "bg-white"
            }`}>
              {/* Barre de statut éducatif */}
              <div className="bg-success" style={{ height: "4px" }}></div>
              
              <Card.Header className={`text-center py-4 border-0 ${
                theme === "dark" ? "bg-dark" : "bg-white"
              }`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className={`mb-1 fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Inscription Étudiante
                    </h4>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Créez votre profil d'apprentissage personnalisé
                    </small>
                  </div>
                  <Button
                    variant={theme === "dark" ? "outline-light" : "outline-secondary"}
                    size="sm"
                    onClick={toggleTheme}
                    className="rounded-circle p-2"
                    style={{ width: "40px", height: "40px" }}
                  >
                    <i data-feather={theme === "dark" ? "sun" : "moon"} style={{ width: "16px", height: "16px" }}></i>
                  </Button>
                </div>
              </Card.Header>

              <Card.Body className={`p-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                {/* Alertes d'erreur */}
                {error && (
                  <Alert variant="danger" className="d-flex align-items-start mb-4">
                    <i data-feather="alert-circle" className="text-danger me-2 mt-1" style={{ width: "18px", height: "18px" }}></i>
                    <div>
                      <strong>Erreur d'inscription</strong>
                      <div className="small mt-1">{error}</div>
                    </div>
                  </Alert>
                )}

                {/* Message de succès */}
                {successMessage && (
                  <Alert variant="success" className="d-flex align-items-start mb-4">
                    <i data-feather="check-circle" className="text-success me-2 mt-1" style={{ width: "18px", height: "18px" }}></i>
                    <div>
                      <strong>Inscription réussie !</strong>
                      <div className="small mt-1">{successMessage}</div>
                    </div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} className="needs-validation" noValidate>
                  <Row className="g-4">
                    {/* Nom complet */}
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Nom complet *
                        </Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type="text"
                            name="name"
                            placeholder="Prénom et nom de famille"
                            value={form.name}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            isInvalid={!!fieldErrors.name}
                            className={`py-3 ps-5 ${
                              theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"
                            } ${focusedField === 'name' ? 'border-primary shadow-sm' : ''}`}
                            required
                          />
                          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                            <i data-feather="user" className={`${
                              focusedField === 'name' ? 'text-primary' : (theme === "dark" ? 'text-light' : 'text-muted')
                            }`} style={{ width: "18px", height: "18px" }}></i>
                          </div>
                        </div>
                        {fieldErrors.name && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            <i data-feather="x-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                            {fieldErrors.name}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Email */}
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Adresse email étudiante *
                        </Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type="email"
                            name="email"
                            placeholder="nom@gmail.com"
                            value={form.email}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            isInvalid={!!fieldErrors.email}
                            className={`py-3 ps-5 ${
                              theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"
                            } ${focusedField === 'email' ? 'border-primary shadow-sm' : ''}`}
                            required
                          />
                          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                            <i data-feather="at-sign" className={`${
                              focusedField === 'email' ? 'text-primary' : (theme === "dark" ? 'text-light' : 'text-muted')
                            }`} style={{ width: "18px", height: "18px" }}></i>
                          </div>
                        </div>
                        {fieldErrors.email && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            <i data-feather="x-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                            {fieldErrors.email}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Niveau d'étude */}
                    <Form.Group md={12}>
                      <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="book" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Niveau d'étude *
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Select
                          name="matricule_classroom"
                          value={form.matricule_classroom}
                          onChange={handleChange}
                          onBlur={() => setFocusedField(null)}
                          onFocus={() => setFocusedField('matricule_classroom')}
                          isInvalid={!!fieldErrors.matricule_classroom}
                          className={`py-3 ps-5 ${
                            theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"
                          } ${focusedField === 'student_level' ? 'border-primary shadow-sm' : ''}`}
                          required
                        >
                          <option value="">Sélectionnez votre classe...</option>
                          {classrooms.map(cl => (
                            <option key={cl.matricule} value={cl.matricule}>
                              {cl.name}{cl.examen ? ' - ' + cl.examen : ''}
                            </option>
                          ))}
                        </Form.Select>
                        <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                          <i data-feather="book" className={`${
                            focusedField === 'matricule_classroom' ? 'text-primary' : (theme === "dark" ? 'text-light' : 'text-muted')
                          }`} style={{ width: "18px", height: "18px" }}></i>
                        </div>
                      </div>
                      <Form.Control.Feedback type="invalid">
                        {fieldErrors.matricule_classroom}
                      </Form.Control.Feedback>
                    </Form.Group>

                    {/* Mot de passe */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="lock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Mot de passe *
                        </Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            isInvalid={!!fieldErrors.password}
                            className={`py-3 ps-5 pe-5 ${
                              theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"
                            } ${focusedField === 'password' ? 'border-primary shadow-sm' : ''}`}
                            required
                          />
                          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                            <i data-feather="key" className={`${
                              focusedField === 'password' ? 'text-primary' : (theme === "dark" ? 'text-light' : 'text-muted')
                            }`} style={{ width: "18px", height: "18px" }}></i>
                          </div>
                          <Button
                            variant="link"
                            className="position-absolute top-50 end-0 translate-middle-y border-0 text-decoration-none p-0 pe-3"
                            onClick={() => setShowPassword(!showPassword)}
                            type="button"
                          >
                            <i data-feather={showPassword ? "eye-off" : "eye"} className={
                              theme === "dark" ? "text-light" : "text-muted"
                            } style={{ width: "18px", height: "18px" }}></i>
                          </Button>
                        </div>
                        
                        {/* Indicateur de force du mot de passe */}
                        {form.password && (
                          <div className="mt-2">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                Force du mot de passe:
                              </small>
                              <small className={`text-${getPasswordStrengthColor(passwordStrength)}`}>
                                {getPasswordStrengthText(passwordStrength)}
                              </small>
                            </div>
                            <ProgressBar 
                              now={passwordStrength} 
                              variant={getPasswordStrengthColor(passwordStrength)}
                              style={{ height: "6px" }}
                            />
                          </div>
                        )}

                        {fieldErrors.password && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            <i data-feather="x-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                            {fieldErrors.password}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Confirmation mot de passe */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="shield" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Confirmer le mot de passe *
                        </Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type={showConfirmPassword ? "text" : "password"}
                            name="password_confirmation"
                            placeholder="••••••••"
                            value={form.password_confirmation}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('password_confirmation')}
                            onBlur={() => setFocusedField(null)}
                            isInvalid={!!fieldErrors.password_confirmation}
                            className={`py-3 ps-5 pe-5 ${
                              theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"
                            } ${focusedField === 'password_confirmation' ? 'border-primary shadow-sm' : ''}`}
                            required
                          />
                          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                            <i data-feather="check-circle" className={`${
                              focusedField === 'password_confirmation' ? 'text-primary' : (theme === "dark" ? 'text-light' : 'text-muted')
                            }`} style={{ width: "18px", height: "18px" }}></i>
                          </div>
                          <Button
                            variant="link"
                            className="position-absolute top-50 end-0 translate-middle-y border-0 text-decoration-none p-0 pe-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            type="button"
                          >
                            <i data-feather={showConfirmPassword ? "eye-off" : "eye"} className={
                              theme === "dark" ? "text-light" : "text-muted"
                            } style={{ width: "18px", height: "18px" }}></i>
                          </Button>
                        </div>
                        {fieldErrors.password_confirmation && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            <i data-feather="x-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                            {fieldErrors.password_confirmation}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Conseils de sécurité */}
                  <div className={`mt-4 p-3 rounded-3 ${
                    theme === "dark" ? "bg-info bg-opacity-10" : "bg-info bg-opacity-10"
                  }`}>
                    <div className="d-flex align-items-start">
                      <i data-feather="info" className="text-info me-2 mt-1" style={{ width: "16px", height: "16px" }}></i>
                      <div>
                        <small className={`fw-semibold text-info`}>Conseils pour un mot de passe sécurisé :</small>
                        <ul className={`small mb-0 mt-1 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          <li>Au moins 8 caractères</li>
                          <li>Majuscules et minuscules</li>
                          <li>Au moins un chiffre</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Conditions d'utilisation */}
                  <div className="mt-4">
                    <Form.Check
                      type="checkbox"
                      id="accept-terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      label={
                        <span className={theme === "dark" ? "text-light" : "text-dark"}>
                          J'accepte les{' '}
                          <Link to="/conditions" className="text-primary text-decoration-none fw-semibold">
                            conditions d'utilisation
                          </Link>
                          {' '}et la{' '}
                          <Link to="/confidentialite" className="text-primary text-decoration-none fw-semibold">
                            charte de vie privée
                          </Link>
                        </span>
                      }
                      className="user-select-none"
                      required
                    />
                  </div>

                  {/* Bouton d'inscription */}
                  <Button
                    type="submit"
                    variant="success"
                    disabled={isLoading || !acceptTerms}
                    className="w-100 py-3 fw-semibold text-white border-0 mt-4 position-relative"
                    style={{
                      background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                      boxShadow: "0 4px 15px rgba(40, 167, 69, 0.3)"
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Création du compte...
                      </>
                    ) : (
                      <>
                        {/* <FeatherIcon icon="user-plus" className="me-2" style={{ width: "18px", height: "18px" }} /> */}
                        Créer mon compte étudiant
                      </>
                    )}
                  </Button>
                </Form>

                {/* Séparateur */}
                <div className="text-center my-4">
                  <hr className={theme === "dark" ? "border-secondary" : ""} />
                  <span className={`px-3 small ${theme === "dark" ? "bg-dark text-light" : "bg-white text-muted"}`}>
                    Déjà inscrit ?
                  </span>
                </div>

                {/* Lien de connexion */}
                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="btn btn-outline-primary w-100 py-3 fw-semibold"
                  >
                    <i data-feather="log-in" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                    Se connecter à un compte existant
                  </Link>
                </div>
              </Card.Body>

              {/* Footer de la carte */}
              <Card.Footer className={`text-center py-3 border-0 ${
                theme === "dark" ? "bg-dark" : "bg-light"
              }`}>
                <Row className="g-2">
                  <Col>
                    <div className="d-flex align-items-center justify-content-center">
                      <i data-feather="shield" className="text-success me-2" style={{ width: "16px", height: "16px" }}></i>
                      <small className={`fw-semibold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Données sécurisées
                      </small>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex align-items-center justify-content-center">
                      <i data-feather="book" className="text-warning me-2" style={{ width: "16px", height: "16px" }}></i>
                      <small className={`fw-semibold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Enseignement de qualité
                      </small>
                    </div>
                  </Col>
                </Row>
              </Card.Footer>
            </Card>

            {/* Avantages de l'inscription */}
            <Row className="mt-4 g-3">
              <Col md={4}>
                <div className={`text-center p-3 rounded-3 h-100 ${
                  theme === "dark" ? "bg-primary bg-opacity-10" : "bg-primary bg-opacity-10"
                }`}>
                  <i data-feather="play-circle" className="text-primary mb-2" style={{ width: "32px", height: "32px" }}></i>
                  <div className="small fw-semibold text-primary mb-1">Cours en ligne</div>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Accédez à tous vos cours 24h/7j
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className={`text-center p-3 rounded-3 h-100 ${
                  theme === "dark" ? "bg-success bg-opacity-10" : "bg-success bg-opacity-10"
                }`}>
                  <i data-feather="users" className="text-success mb-2" style={{ width: "32px", height: "32px" }}></i>
                  <div className="small fw-semibold text-success mb-1">Classe virtuelle</div>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Interagissez avec vos professeurs
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className={`text-center p-3 rounded-3 h-100 ${
                  theme === "dark" ? "bg-info bg-opacity-10" : "bg-info bg-opacity-10"
                }`}>
                  <i data-feather="trending-up" className="text-info mb-2" style={{ width: "32px", height: "32px" }}></i>
                  <div className="small fw-semibold text-info mb-1">Suivi des progrès</div>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Suivez vos performances et réussites
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
