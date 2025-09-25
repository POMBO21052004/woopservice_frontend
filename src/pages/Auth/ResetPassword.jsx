import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ProgressBar } from "react-bootstrap";
import api from "../../services/api";
import feather from "feather-icons";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");
  const email = new URLSearchParams(location.search).get("email");

  const [form, setForm] = useState({
    email: email || "",
    token: token || "",
    password: "",
    password_confirmation: "",
  });

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Vérifier si le token et l'email sont présents
  useEffect(() => {
    if (!token || !email) {
      setError("Lien de réinitialisation invalide. Veuillez demander un nouveau lien.");
    }
  }, [token, email]);

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
  }, [theme, error, isLoading, successMessage]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await api.post("/reset-password", form);
      setSuccessMessage(res.data.message || "Mot de passe réinitialisé avec succès ! Redirection vers la connexion...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const response = err.response;
      if (response?.status === 422 && response.data?.errors) {
        setFieldErrors(response.data.errors);
      } else {
        setError(response?.data?.message || "Une erreur s'est produite lors de la réinitialisation");
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
                Nouveau mot de passe
              </h1>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Créez un nouveau mot de passe sécurisé pour votre compte
              </p>
              {email && (
                <div className="d-flex justify-content-center align-items-center mt-2">
                  <div className="badge bg-success bg-opacity-10 text-success px-3 py-1 rounded-pill">
                    <i data-feather="mail" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    {email}
                  </div>
                </div>
              )}
            </div>

            {/* Carte principale de réinitialisation */}
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
                      Réinitialisation du mot de passe
                    </h4>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Définissez un nouveau mot de passe fort et sécurisé
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
                {/* Alerte d'erreur */}
                {error && (
                  <Alert variant="danger" className="d-flex align-items-start mb-4">
                    <i data-feather="alert-circle" className="text-danger me-2 mt-1" style={{ width: "18px", height: "18px" }}></i>
                    <div>
                      <strong>Erreur de réinitialisation</strong>
                      <div className="small mt-1">{error}</div>
                    </div>
                  </Alert>
                )}

                {/* Message de succès */}
                {successMessage && (
                  <Alert variant="success" className="d-flex align-items-start mb-4">
                    <i data-feather="check-circle" className="text-success me-2 mt-1" style={{ width: "18px", height: "18px" }}></i>
                    <div>
                      <strong>Mot de passe réinitialisé !</strong>
                      <div className="small mt-1">{successMessage}</div>
                    </div>
                  </Alert>
                )}

                {!successMessage && !error && (
                  <Form onSubmit={handleSubmit} className="needs-validation" noValidate>
                    {/* Informations sur la réinitialisation */}
                    <div className={`mb-4 p-3 rounded-3 ${
                      theme === "dark" ? "bg-success bg-opacity-10" : "bg-success bg-opacity-10"
                    }`}>
                      <div className="d-flex align-items-start">
                        <i data-feather="shield-check" className="text-success me-2 mt-1" style={{ width: "16px", height: "16px" }}></i>
                        <div>
                          <small className={`fw-semibold text-success`}>Lien de réinitialisation valide</small>
                          <div className={`small mt-1 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                            Vous pouvez maintenant définir un nouveau mot de passe sécurisé pour votre compte étudiant.
                          </div>
                        </div>
                      </div>
                    </div>

                    <Row className="g-4">
                      {/* Nouveau mot de passe */}
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            <i data-feather="lock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Nouveau mot de passe *
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
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            <i data-feather="shield" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                            Confirmer le nouveau mot de passe *
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
                            <li>Différent de vos anciens mots de passe</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Bouton de réinitialisation */}
                    <Button
                      type="submit"
                      variant="success"
                      disabled={isLoading || !form.password || !form.password_confirmation}
                      className="w-100 py-3 fw-semibold text-white border-0 mt-4 position-relative"
                      style={{
                        background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                        boxShadow: "0 4px 15px rgba(40, 167, 69, 0.3)"
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Réinitialisation...
                        </>
                      ) : (
                        <>
                          {/* <i data-feather="check" className="me-2" style={{ width: "18px", height: "18px" }}></i> */}
                          Confirmer le nouveau mot de passe
                        </>
                      )}
                    </Button>
                  </Form>
                )}

                {error && (
                  <div className="text-center mt-4">
                    <Link 
                      to="/forgot-password" 
                      className="btn btn-outline-warning w-100 py-3 fw-semibold"
                    >
                      <i data-feather="refresh-cw" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                      Demander un nouveau lien
                    </Link>
                  </div>
                )}

                {/* Séparateur */}
                <div className="text-center my-4">
                  <hr className={theme === "dark" ? "border-secondary" : ""} />
                  <span className={`px-3 small ${theme === "dark" ? "bg-dark text-light" : "bg-white text-muted"}`}>
                    Vous vous souvenez de votre mot de passe ?
                  </span>
                </div>

                {/* Lien de retour à la connexion */}
                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="btn btn-outline-primary w-100 py-3 fw-semibold"
                  >
                    <i data-feather="arrow-left" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                    Retour à la connexion
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
                      <i data-feather="shield-check" className="text-success me-2" style={{ width: "16px", height: "16px" }}></i>
                      <small className={`fw-semibold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Réinitialisation sécurisée
                      </small>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex align-items-center justify-content-center">
                      <i data-feather="clock" className="text-info me-2" style={{ width: "16px", height: "16px" }}></i>
                      <small className={`fw-semibold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Lien à usage unique
                      </small>
                    </div>
                  </Col>
                </Row>
              </Card.Footer>
            </Card>

            {/* Footer informations légales */}
            <div className={`text-center mt-4 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              <small>
                <i data-feather="info" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                Une fois votre mot de passe réinitialisé, ce lien ne sera plus valide.
              </small>
            </div>

            {/* Conseils de sécurité */}
            <Row className="mt-4 g-3">
              <Col md={4}>
                <div className={`text-center p-3 rounded-3 h-100 ${
                  theme === "dark" ? "bg-success bg-opacity-10" : "bg-success bg-opacity-10"
                }`}>
                  <i data-feather="key" className="text-success mb-2" style={{ width: "32px", height: "32px" }}></i>
                  <div className="small fw-semibold text-success mb-1">Nouveau mot de passe</div>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Choisissez un mot de passe fort
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className={`text-center p-3 rounded-3 h-100 ${
                  theme === "dark" ? "bg-warning bg-opacity-10" : "bg-warning bg-opacity-10"
                }`}>
                  <i data-feather="clock" className="text-warning mb-2" style={{ width: "32px", height: "32px" }}></i>
                  <div className="small fw-semibold text-warning mb-1">Lien temporaire</div>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Valide une seule fois
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className={`text-center p-3 rounded-3 h-100 ${
                  theme === "dark" ? "bg-info bg-opacity-10" : "bg-info bg-opacity-10"
                }`}>
                  <i data-feather="shield" className="text-info mb-2" style={{ width: "32px", height: "32px" }}></i>
                  <div className="small fw-semibold text-info mb-1">Sécurité renforcée</div>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Processus chiffré
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

export default ResetPassword;