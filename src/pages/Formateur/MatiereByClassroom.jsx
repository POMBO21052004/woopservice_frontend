import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Button, Row, Col, Badge, Alert, Spinner, Image, ButtonGroup, Modal, Toast, ToastContainer
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function MatiereByClassroom() {
  const { matricule_classroom } = useParams();
  const navigate = useNavigate();
  
  // États
  const [matieres, setMatieres] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  
  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // État du thème
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

  // Afficher les notifications toast
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Récupérer les matières de la classe
  const fetchMatieresByClassroom = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/formateur/matiere/by-classroom/${matricule_classroom}`);
      setMatieres(response.data.matieres || []);
      
      // Récupérer aussi les infos de la classe
      const classroomResponse = await api.get("/formateur/view/matiere");
      const allClassrooms = classroomResponse.data.classrooms || [];
      const currentClassroom = allClassrooms.find(c => c.matricule === matricule_classroom);
      setClassroom(currentClassroom);
    } catch (err) {
      console.error("Erreur lors de la récupération des matières", err);
      setError("Erreur lors de la récupération des matières de cette classe");
      showToastMessage("Erreur lors de la récupération des données", 'danger');
    } finally {
      setLoading(false);
    }
  }, [matricule_classroom]);

  useEffect(() => {
    feather.replace();
    if (matricule_classroom) {
      fetchMatieresByClassroom();
    }
  }, [fetchMatieresByClassroom]);

  useEffect(() => {
    feather.replace();
  }, [classroom,matieres, viewMode]);

  // Gérer le changement de statut d'une matière
  const handleToggleStatus = async (matiereId) => {
    try {
      await api.patch(`/formateur/toggle-status/matiere/${matiereId}`);
      fetchMatieresByClassroom();
      showToastMessage("Statut de la matière mis à jour", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la mise à jour du statut", 'danger');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active': return 'success';
      case 'Inactive': return 'warning';
      case 'Suspendue': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Active': return 'check-circle';
      case 'Inactive': return 'pause-circle';
      case 'Suspendue': return 'x-circle';
      default: return 'help-circle';
    }
  };

  // Render card view
  const renderCardView = () => (
    <Row className="g-4">
      {matieres.length ? (
        matieres.map((matiere) => (
          <Col key={matiere.id} md={6} lg={3}>
            <Card className={`h-100 mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"} position-relative`}>
              <div className="position-relative">
                <Card.Img 
                  variant="top" 
                  src={matiere.image_url || "/placeholder/matiere_placeholder.png"}
                  style={{ height: '140px', objectFit: 'cover' }}
                />
                <Badge 
                  bg={getStatusBadge(matiere.status)}
                  className="position-absolute top-0 end-0 m-2"
                >
                  <i data-feather={getStatusIcon(matiere.status)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                  {matiere.status}
                </Badge>
              </div>
              
              <Card.Body className="d-flex flex-column p-3">
                <div className="mb-auto">
                  <Card.Title className={`h6 mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {matiere.nom}
                  </Card.Title>
                  <Card.Text className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="hash" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    {matiere.matricule}
                  </Card.Text>
                  <Card.Text className={theme === "dark" ? "text-light" : "text-dark"}>
                    {matiere.description ? 
                      (matiere.description.length > 80 ? matiere.description.substring(0, 80) + "..." : matiere.description)
                      : 'Aucune description'
                    }
                  </Card.Text>
                  <Card.Text className="small text-secondary">
                    <i data-feather="award" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    Coefficient: {matiere.coefficient || 1}
                  </Card.Text>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="d-flex align-items-center" title="ses cours">
                      <i data-feather="book-open" className="me-1 text-muted" style={{ width: '14px', height: '14px' }}></i>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        {matiere.cours_count || 0} 
                      </small>
                    </div>
                    <div className="d-flex align-items-center" title="ses evalautions">
                      <i data-feather="clipboard" className="me-1 text-muted" style={{ width: '14px', height: '14px' }}></i>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        {matiere.evaluations_count || 0}
                      </small>
                    </div>
                  </div>
                  
                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-info"
                      as={Link}
                      to={`/formateur/show/matiere/${matiere.id}`}
                      title="Voir les détails"
                    >
                      <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                    </Button>
                    <Button
                      variant="outline-warning"
                      as={Link}
                      to={`/formateur/edit/matiere/${matiere.id}`}
                      title="Modifier"
                    >
                      <i data-feather="edit" style={{ width: '14px', height: '14px' }}></i>
                    </Button>
                    <Button
                      variant={getStatusBadge(matiere.status) === 'success' ? "outline-warning" : "outline-success"}
                      title="Changer le statut"
                      onClick={() => handleToggleStatus(matiere.id)}
                    >
                      <i data-feather="refresh-cw" style={{ width: '14px', height: '14px' }}></i>
                    </Button>
                  </ButtonGroup>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))
      ) : (
        <Col xs={12}>
          <div className="text-center py-5">
            <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
              <i data-feather="book" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
              <div>
                <h6>Aucune matière active dans cette classe</h6>
                <p className="small mb-0">Cette classe n'a pas encore de matières actives assignées.</p>
                <Button 
                  variant="primary" 
                  className="mt-3"
                  as={Link}
                  to="/formateur/view/matieres"
                >
                  <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Créer une matière
                </Button>
              </div>
            </div>
          </div>
        </Col>
      )}
    </Row>
  );

  // Render list view
  const renderListView = () => (
    <div className="row g-3">
      {matieres.length ? (
        matieres.map((matiere) => (
          <div key={matiere.id} className="col-12">
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={2} className="text-center">
                    <Image
                      src={matiere.image_url || "/placeholder/matiere_placeholder.png"}
                      alt={matiere.nom}
                      style={{
                        width: '80px',
                        height: '60px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                  </Col>
                  <Col md={4}>
                    <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {matiere.nom}
                    </h6>
                    <small className="text-muted">{matiere.matricule}</small>
                    <p className={`small mb-0 mt-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {matiere.description ? 
                        (matiere.description.length > 100 ? matiere.description.substring(0, 100) + "..." : matiere.description)
                        : 'Aucune description'
                      }
                    </p>
                  </Col>
                  <Col md={2} className="text-center">
                    <Badge bg="info" className="px-2 py-1">
                      Coef. {matiere.coefficient || 1}
                    </Badge>
                  </Col>
                  <Col md={2} className="text-center">
                    <div className="d-flex flex-column gap-1">
                      <small className="text-primary">
                        <i data-feather="book-open" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        {matiere.cours_count || 0} cours
                      </small>
                      <small className="text-success">
                        <i data-feather="clipboard" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        {matiere.evaluations_count || 0} éval.
                      </small>
                    </div>
                  </Col>
                  <Col md={1} className="text-center">
                    <Badge bg={getStatusBadge(matiere.status)} className="px-2 py-1">
                      <i data-feather={getStatusIcon(matiere.status)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {matiere.status}
                    </Badge>
                  </Col>
                  <Col md={1} className="text-center">
                    <ButtonGroup size="sm">
                      <Button
                        variant="outline-info"
                        as={Link}
                        to={`/formateur/show/matiere/${matiere.id}`}
                        title="Voir les détails"
                      >
                        <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                      </Button>
                      <Button
                        variant="outline-warning"
                        as={Link}
                        to={`/formateur/edit/matiere/${matiere.id}`}
                        title="Modifier"
                      >
                        <i data-feather="edit" style={{ width: '14px', height: '14px' }}></i>
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </div>
        ))
      ) : (
        <div className="col-12">
          <div className="text-center py-5">
            <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
              <i data-feather="book" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
              <div>
                <h6>Aucune matière active dans cette classe</h6>
                <p className="small mb-0">Cette classe n'a pas encore de matières actives assignées.</p>
                <Button 
                  variant="primary" 
                  className="mt-3"
                  as={Link}
                  to="/formateur/view/matieres"
                >
                  <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Créer une matière
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <FormateurLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement des matières...</p>
          </div>
        </Container>
      </FormateurLayout>
    );
  }

  if (error) {
    return (
      <FormateurLayout>
        <Container className="py-4">
          <Alert variant="danger" className="mb-4">
            <i data-feather="alert-circle" className="me-2" />
            {error}
          </Alert>
          <div className="d-flex gap-2">
            <Button variant="secondary" as={Link} to="/formateur/view/matieres">
              <i data-feather="arrow-left" className="me-2" />
              Retour à la liste générale
            </Button>
            <Button variant="outline-primary" onClick={fetchMatieresByClassroom}>
              <i data-feather="refresh-cw" className="me-2" />
              Réessayer
            </Button>
          </div>
        </Container>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                size="sm"
                as={Link} 
                to="/formateur/view/matieres"
                className="me-3"
              >
                <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
                Retour
              </Button>
              <div>
                <div className="d-flex align-items-center">
                  <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                    <i data-feather="home" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
                  </div>
                  <div>
                    <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Matières de la classe
                    </h2>
                    <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      {classroom?.name || 'Classe non trouvée'} - {matieres.length} matière{matieres.length !== 1 ? 's' : ''} active{matieres.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="d-flex gap-2">
              {/* Switch de vue */}
              <ButtonGroup>
                <Button
                  variant={viewMode === "card" ? "primary" : "outline-secondary"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                >
                  <i data-feather="grid" style={{ width: "14px", height: "14px" }}></i>
                </Button>
                <Button
                  variant={viewMode === "list" ? "primary" : "outline-secondary"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <i data-feather="list" style={{ width: "14px", height: "14px" }}></i>
                </Button>
              </ButtonGroup>
              
              <Button 
                variant="success" 
                as={Link} 
                to="/formateur/view/matieres"
                className="d-flex align-items-center"
              >
                <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Nouvelle Matière
              </Button>
            </div>
          </div>

          {/* Statistiques rapides */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {matieres.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Matières
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="book" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-success">
                        {matieres.filter(m => m.status === 'Active').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Actives
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="check-circle" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-primary">
                        {matieres.reduce((total, m) => total + (m.cours_count || 0), 0)}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Cours
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="book-open" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-success">
                        {matieres.reduce((total, m) => total + (m.evaluations_count || 0), 0)}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Évaluations
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="clipboard" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Panneau principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex align-items-center">
              <i data-feather="book" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Matières de la classe {classroom?.name}
              </span>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Affichage des résultats */}
            {viewMode === "card" ? renderCardView() : renderListView()}
          </Card.Body>
        </Card>

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
      </Container>
    </FormateurLayout>
  );
}