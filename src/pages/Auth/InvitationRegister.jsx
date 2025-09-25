import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import api from "../../services/api";
import feather from "feather-icons";

const InvitationRegister = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get("token");
  const email = new URLSearchParams(location.search).get("email");

  const [form, setForm] = useState({
    name: "",
    code_phone: "+237",
    phone: "",
    birthday: "",
    gender: "",
    password: "",
    password_confirmation: "",
    email: email || "",
    token: token || "",
  });

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  }, [theme, error, isLoading, successMessage]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      await api.post(`/register-invitation`, form);
      setSuccessMessage("Inscription réussie ! Redirection vers la connexion...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const response = err.response;
      if (response?.status === 422 && response.data?.errors) {
        setFieldErrors(response.data.errors);
      } else {
        setError(response?.data?.message || "Une erreur s'est produite");
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
          <Col xl={7} lg={8} md={10} sm={11}>
            {/* En-tête avec logo et branding éducatif */}
            <div className="text-center mb-4">
              <h1 className={`h3 fw-bold mb-2 ${
                theme === "dark" ? "text-light" : "text-dark"
              }`}>
                <i data-feather="book-open" className="text-primary me-2" style={{ width: "24px", height: "24px" }}></i>
                Invitation Woop Service
              </h1>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Finalisez votre inscription sur invitation à notre plateforme d'apprentissage
              </p>
              {email && (
                <div className="d-flex justify-content-center align-items-center mt-2">
                  <div className="badge bg-info bg-opacity-10 text-info px-3 py-1 rounded-pill">
                    <i data-feather="mail" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    {email}
                  </div>
                </div>
              )}
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
                      Finaliser l'inscription
                    </h4>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Complétez votre profil étudiant pour accéder à la plateforme
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

                    {/* Téléphone */}
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="flag" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Code pays *
                        </Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type="text"
                            name="code_phone"
                            placeholder="+237"
                            value={form.code_phone}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('code_phone')}
                            onBlur={() => setFocusedField(null)}
                            isInvalid={!!fieldErrors.code_phone}
                            max={new Date().toISOString().split('T')[0]}
                            className={`py-3 ps-5 ${
                              theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"
                            } ${focusedField === 'code_phone' ? 'border-primary shadow-sm' : ''}`}
                            required
                          />
                          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                            <i data-feather="globe" className={`${
                              focusedField === 'code_phone' ? 'text-primary' : (theme === "dark" ? 'text-light' : 'text-muted')
                            }`} style={{ width: "18px", height: "18px" }}></i>
                          </div>
                        </div>
                        {fieldErrors.code_phone && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            <i data-feather="x-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                            {fieldErrors.code_phone}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={8}>
                      <Form.Group>
                        <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="phone" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Numéro de téléphone *
                        </Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type="number"
                            name="phone"
                            placeholder="123456789"
                            value={form.phone}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            isInvalid={!!fieldErrors.phone}
                            className={`py-3 ps-5 ${
                              theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"
                            } ${focusedField === 'phone' ? 'border-primary shadow-sm' : ''}`}
                            required
                          />
                          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                            <i data-feather="phone" className={`${
                              focusedField === 'phone' ? 'text-primary' : (theme === "dark" ? 'text-light' : 'text-muted')
                            }`} style={{ width: "18px", height: "18px" }}></i>
                          </div>
                        </div>
                        {fieldErrors.phone && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            <i data-feather="x-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                            {fieldErrors.phone}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Date de naissance et Genre */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Date de naissance *
                        </Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type="date"
                            name="birthday"
                            value={form.birthday}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('birthday')}
                            onBlur={() => setFocusedField(null)}
                            isInvalid={!!fieldErrors.birthday}
                            className={`py-3 ps-5 ${
                              theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"
                            } ${focusedField === 'birthday' ? 'border-primary shadow-sm' : ''}`}
                            required
                          />
                          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                            <i data-feather="calendar" className={`${
                              focusedField === 'birthday' ? 'text-primary' : (theme === "dark" ? 'text-light' : 'text-muted')
                            }`} style={{ width: "18px", height: "18px" }}></i>
                          </div>
                        </div>
                        {fieldErrors.birthday && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            <i data-feather="x-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                            {fieldErrors.birthday}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Genre *
                        </Form.Label>
                        <div className="position-relative">
                          <Form.Select
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('gender')}
                            onBlur={() => setFocusedField(null)}
                            isInvalid={!!fieldErrors.gender}
                            className={`py-3 ps-5 ${
                              theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"
                            } ${focusedField === 'gender' ? 'border-primary shadow-sm' : ''}`}
                            required
                          >
                            <option value="">Sélectionner</option>
                            <option value="Masculin">Homme</option>
                            <option value="Feminin">Femme</option>
                            <option value="Autre">Autre</option>
                          </Form.Select>
                          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                            <i data-feather="user" className={`${
                              focusedField === 'gender' ? 'text-primary' : (theme === "dark" ? 'text-light' : 'text-muted')
                            }`} style={{ width: "18px", height: "18px" }}></i>
                          </div>
                        </div>
                        {fieldErrors.gender && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            <i data-feather="x-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                            {fieldErrors.gender}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    {/* Mots de passe */}
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
                        {fieldErrors.password && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            <i data-feather="x-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                            {fieldErrors.password}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          <i data-feather="shield" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Confirmation *
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

                  {/* Informations sur l'invitation */}
                  <div className={`mt-4 p-3 rounded-3 ${
                    theme === "dark" ? "bg-success bg-opacity-10" : "bg-success bg-opacity-10"
                  }`}>
                    <div className="d-flex align-items-start">
                      <i data-feather="mail" className="text-success me-2 mt-1" style={{ width: "16px", height: "16px" }}></i>
                      <div>
                        <small className={`fw-semibold text-success`}>Inscription sur invitation</small>
                        <div className={`small mt-1 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          Vous avez été invité(e) à rejoindre Woop Service. Complétez ce formulaire pour finaliser votre inscription et accéder à la plateforme.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton d'inscription */}
                  <Button
                    type="submit"
                    variant="success"
                    disabled={isLoading}
                    className="w-100 py-3 fw-semibold text-white border-0 mt-4 position-relative"
                    style={{
                      background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                      boxShadow: "0 4px 15px rgba(40, 167, 69, 0.3)"
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Finalisation...
                      </>
                    ) : (
                      <>
                        Finaliser l'inscription
                      </>
                    )}
                  </Button>
                </Form>
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
                        Inscription sécurisée
                      </small>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex align-items-center justify-content-center">
                      <i data-feather="book" className="text-info me-2" style={{ width: "16px", height: "16px" }}></i>
                      <small className={`fw-semibold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Invitation validée
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
                En finalisant votre inscription, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
              </small>
            </div>

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

export default InvitationRegister;