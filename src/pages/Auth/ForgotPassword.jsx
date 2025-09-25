import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import api from "../../services/api";
import feather from "feather-icons";

const ForgotPassword = () => {
  const [form, setForm] = useState({ email: "" });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
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
      const res = await api.post("/forgot-password", form);
      setSuccessMessage(
        res.data.message || 
        "Un email de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception."
      );
    } catch (err) {
      const response = err.response;
      if (response?.status === 422 && response.data?.errors) {
        setFieldErrors(response.data.errors);
      } else {
        setError(response?.data?.message || "Une erreur s'est produite lors de l'envoi");
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
                Récupération de compte
              </h1>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Réinitialisez votre mot de passe pour accéder à vos cours
              </p>
              <div className="d-flex justify-content-center align-items-center mt-2">
                <div className="badge bg-warning bg-opacity-10 text-warning px-3 py-1 rounded-pill">
                  <i data-feather="key" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Récupération sécurisée
                </div>
              </div>
            </div>

            {/* Carte principale de récupération */}
            <Card className={`shadow-lg border-0 overflow-hidden ${
              theme === "dark" ? "bg-dark" : "bg-white"
            }`}>
              {/* Barre de statut éducatif */}
              <div className="bg-warning" style={{ height: "4px" }}></div>
              
              <Card.Header className={`text-center py-4 border-0 ${
                theme === "dark" ? "bg-dark" : "bg-white"
              }`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className={`mb-1 fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Mot de passe oublié
                    </h4>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Saisissez votre email pour recevoir un lien de réinitialisation
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
                      <strong>Erreur de récupération</strong>
                      <div className="small mt-1">{error}</div>
                    </div>
                  </Alert>
                )}

                {/* Message de succès */}
                {successMessage && (
                  <Alert variant="success" className="d-flex align-items-start mb-4">
                    <i data-feather="check-circle" className="text-success me-2 mt-1" style={{ width: "18px", height: "18px" }}></i>
                    <div>
                      <strong>Email envoyé !</strong>
                      <div className="small mt-1">{successMessage}</div>
                    </div>
                  </Alert>
                )}

                {!successMessage && (
                  <Form onSubmit={handleSubmit} className="needs-validation" noValidate>
                    {/* Instructions */}
                    <div className={`mb-4 p-3 rounded-3 ${
                      theme === "dark" ? "bg-info bg-opacity-10" : "bg-info bg-opacity-10"
                    }`}>
                      <div className="d-flex align-items-start">
                        <i data-feather="info" className="text-info me-2 mt-1" style={{ width: "16px", height: "16px" }}></i>
                        <div>
                          <small className={`fw-semibold text-info`}>Comment ça fonctionne :</small>
                          <ul className={`small mb-0 mt-1 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                            <li>Saisissez l'adresse email de votre compte</li>
                            <li>Cliquez sur "Envoyer le lien"</li>
                            <li>Consultez votre boîte email</li>
                            <li>Suivez le lien pour créer un nouveau mot de passe</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <Form.Group className="mb-4">
                      <Form.Label className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Adresse email du compte
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="votre.email@domaine.com"
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

                    {/* Bouton d'envoi */}
                    <Button
                      type="submit"
                      variant="warning"
                      disabled={isLoading}
                      className="w-100 py-3 fw-semibold text-dark border-0 position-relative"
                      style={{
                        background: "linear-gradient(135deg, #ffc107 0%, #ffb300 100%)",
                        boxShadow: "0 4px 15px rgba(255, 193, 7, 0.3)"
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          {/* <i data-feather="send" className="me-2" style={{ width: "18px", height: "18px" }}></i> */}
                          Envoyer le lien de réinitialisation
                        </>
                      )}
                    </Button>
                  </Form>
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
                      <i data-feather="shield" className="text-success me-2" style={{ width: "16px", height: "16px" }}></i>
                      <small className={`fw-semibold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Processus sécurisé
                      </small>
                    </div>
                  </Col>
                  <Col>
                    <div className="d-flex align-items-center justify-content-center">
                      <i data-feather="clock" className="text-info me-2" style={{ width: "16px", height: "16px" }}></i>
                      <small className={`fw-semibold ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Lien valide 1 heure
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
                Si vous ne recevez pas l'email, vérifiez votre dossier spam ou contactez le support.
              </small>
            </div>

            {/* Conseils de sécurité */}
            <Row className="mt-4 g-3">
              <Col md={6}>
                <div className={`text-center p-3 rounded-3 h-100 ${
                  theme === "dark" ? "bg-success bg-opacity-10" : "bg-success bg-opacity-10"
                }`}>
                  <i data-feather="shield" className="text-success mb-2" style={{ width: "32px", height: "32px" }}></i>
                  <div className="small fw-semibold text-success mb-1">Sécurité renforcée</div>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Lien temporaire et chiffré
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className={`text-center p-3 rounded-3 h-100 ${
                  theme === "dark" ? "bg-warning bg-opacity-10" : "bg-warning bg-opacity-10"
                }`}>
                  <i data-feather="clock" className="text-warning mb-2" style={{ width: "32px", height: "32px" }}></i>
                  <div className="small fw-semibold text-warning mb-1">Expiration rapide</div>
                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    Le lien expire après 1 heure
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

export default ForgotPassword;