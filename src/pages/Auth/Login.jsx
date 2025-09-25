import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import feather from "feather-icons";
import FeatherIcon from "../../components/FeatherIcon";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
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
  }, [theme, error, isLoading]);

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
      const res = await api.post("/login", form);
      const { token, user } = res.data.data;
      login(user, token);

      const role = user.role;
      if (role === 0) navigate("/etudiant-espace-attente/dashboard");
      else if (role === 1) navigate("/etudiant/dashboard");
      else if (role === 2) navigate("/formateur/dashboard");
      else if (role === 3) navigate("/admin-systeme/dashboard");
      else navigate("/");
    } catch (err) {
      const response = err.response;
      if (response?.status === 422 && response.data?.errors) {
        setFieldErrors(response.data.errors);
      } else {
        setError(response?.data?.message || "Erreur de connexion");
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
          <Col xl={5} lg={6} md={8} sm={10}>
            {/* En-tête avec logo et branding éducatif */}
            <div className="text-center mb-4">
              
              <h1 className={`h3 fw-bold mb-2 ${
                theme === "dark" ? "text-light" : "text-dark"
              }`}>
                <i data-feather="book-open" className="text-primary me-2" style={{ width: "24px", height: "24px" }}></i>
                Woop Service
              </h1>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Plateforme d'apprentissage en ligne pour le secondaire et l'universitaire
              </p>
              <div className="d-flex justify-content-center align-items-center mt-2">
                <div className="badge bg-success bg-opacity-10 text-success px-3 py-1 rounded-pill me-2">
                  <i data-feather="award" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Certifié et reconnu
                </div>
                <div className="badge bg-info bg-opacity-10 text-info px-3 py-1 rounded-pill">
                  <i data-feather="book" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Apprentissage de qualité
                </div>
              </div>
            </div>

            {/* Carte principale de connexion */}
            <Card className={`shadow-lg border-0 overflow-hidden ${
              theme === "dark" ? "bg-dark" : "bg-white"
            }`}>
              {/* Barre de statut éducatif */}
              <div className="bg-primary" style={{ height: "4px" }}></div>
              
              <Card.Header className={`text-center py-4 border-0 ${
                theme === "dark" ? "bg-dark" : "bg-white"
              }`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className={`mb-1 fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Connexion à la plateforme
                    </h4>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Accédez à vos cours et ressources
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
                      <strong>Erreur de connexion</strong>
                      <div className="small mt-1">{error}</div>
                    </div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} className="needs-validation" noValidate>
                  {/* Email */}
                  <Form.Group className="mb-4">
                    <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Adresse email étudiante
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="prenom.nom@universite.fr"
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
                        <i data-feather="user" className={`${
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

                  {/* Mot de passe */}
                  <Form.Group className="mb-4">
                    <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="lock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Mot de passe
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

                  {/* Options */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                      type="checkbox"
                      id="remember-me"
                      label="Se souvenir de moi"
                      className={theme === "dark" ? "text-light" : "text-dark"}
                    />
                    <Link 
                      to="/forgot-password" 
                      className="text-primary text-decoration-none small fw-semibold"
                    >
                      <i data-feather="help-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  {/* Bouton de connexion */}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="w-100 py-3 fw-semibold text-white border-0 position-relative"
                    style={{
                      background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                      boxShadow: "0 4px 15px rgba(0, 123, 255, 0.3)"
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        {/* <FeatherIcon icon="log-in" className="me-2" style={{ width: "12px", height: "12px" }} /> */}
                        Accéder à la plateforme
                      </>
                    )}
                  </Button>
                </Form>

                {/* Séparateur */}
                <div className="text-center my-4">
                  <hr className={theme === "dark" ? "border-secondary" : ""} />
                  <span className={`px-3 small ${theme === "dark" ? "bg-dark text-light" : "bg-white text-muted"}`}>
                    Nouveau sur la plateforme ?
                  </span>
                </div>

                {/* Lien d'inscription */}
                <div className="text-center">
                  <Link 
                    to="/register" 
                    className="btn btn-outline-primary w-100 py-3 fw-semibold"
                  >
                    <i data-feather="user-plus" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                    Créer mon compte étudiant
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
                      <i data-feather="book" className="text-success me-2" style={{ width: "16px", height: "16px" }}></i>
                      <small className={`fw-semibold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Enseignement de qualité
                      </small>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex align-items-center justify-content-center">
                      <i data-feather="headphones" className="text-info me-2" style={{ width: "16px", height: "16px" }}></i>
                      <small className={`fw-semibold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Support étudiant
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
                En vous connectant, vous acceptez nos{' '}
                <Link to="/conditions" className="text-primary text-decoration-none">
                  conditions d'utilisation
                </Link>
                {' '}et notre{' '}
                <Link to="/confidentialite" className="text-primary text-decoration-none">
                  charte de vie privée
                </Link>
              </small>
            </div>

          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;