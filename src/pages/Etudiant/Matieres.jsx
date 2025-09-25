import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Form, Badge, Alert, ButtonGroup, 
  Spinner, Table, Modal, Toast, ToastContainer, Image
} from "react-bootstrap";
import { Link } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function MatieresEtudiant() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [classroom, setClassroom] = useState({});
  const [matieres, setMatieres] = useState([]);
  const [viewMode, setViewMode] = useState("card");

  // États des filtres
  const [filters, setFilters] = useState({
    search: "",
    status: ""
  });

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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

  // Charger les matières de la classe de l'étudiant connecté
  const fetchMatieresParClassroom = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]?.trim()) {
          params[key] = filters[key].trim();
        }
      });

      const response = await api.get(`/etudiant/view/matieres/my-classroom`, { params });
      
      if (response.data.status === 'success') {
        setClassroom(response.data.classroom || {});
        setMatieres(response.data.matieres || []);
      } else {
        showToastMessage(response.data.message || "Erreur lors du chargement des matières", 'danger');
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des matières:', err);
      const errorMessage = err.response?.data?.message || "Erreur lors du chargement des matières";
      showToastMessage(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMatieresParClassroom();
  }, [fetchMatieresParClassroom]);

  useEffect(() => {
    feather.replace();
  }, [matieres, viewMode]);

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

  // Filtrer les matières selon les critères de recherche
  const filteredMatieres = matieres.filter(matiere => {
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = !searchTerm || 
      matiere.nom.toLowerCase().includes(searchTerm) ||
      matiere.matricule.toLowerCase().includes(searchTerm) ||
      (matiere.description && matiere.description.toLowerCase().includes(searchTerm));
    
    const matchesStatus = !filters.status || matiere.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  // Render card view
  const renderCardView = () => (
    <Row className="g-4">
      {filteredMatieres.length ? (
        filteredMatieres.map((matiere) => (
          <Col key={matiere.id} md={6} lg={4}>
            <Card className={`h-100 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"} position-relative`}>
              <div className="position-relative">
                <Card.Img 
                  variant="top" 
                  src={matiere.image_url || "/placeholder/matiere_placeholder.png"}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <Badge 
                  bg={getStatusBadge(matiere.status)}
                  className="position-absolute top-0 end-0 m-2"
                >
                  <i data-feather={getStatusIcon(matiere.status)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                  {matiere.status}
                </Badge>
              </div>
              
              <Card.Body className="d-flex flex-column">
                <div className="mb-auto">
                  <Card.Title className={`h5 mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
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
                    <div className="d-flex align-items-center">
                      <i data-feather="book-open" className="me-1 text-muted" style={{ width: '14px', height: '14px' }}></i>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        {matiere.cours_count || 0} cours
                      </small>
                    </div>
                    <div className="d-flex align-items-center">
                      <i data-feather="clipboard" className="me-1 text-muted" style={{ width: '14px', height: '14px' }}></i>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        {matiere.evaluations_count || 0} éval.
                      </small>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    as={Link}
                    to={`/etudiant/show/matiere/${matiere.id}`}
                    title="Consulter les details de la matière"
                  >
                    <i data-feather="eye" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                    Détails
                  </Button>
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
                <h6>Aucune matière disponible</h6>
                <p className="small mb-0">
                  {filters.search || filters.status ? 
                    "Aucune matière ne correspond à vos critères de recherche." :
                    "Votre classe n'a pas encore de matières actives assignées."
                  }
                </p>
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
      {filteredMatieres.length ? (
        filteredMatieres.map((matiere) => (
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
                    <Button
                      variant="primary"
                      size="sm"
                      title="Voir les cours de cette matière"
                    >
                      <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                    </Button>
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
                <h6>Aucune matière disponible</h6>
                <p className="small mb-0">
                  {filters.search || filters.status ? 
                    "Aucune matière ne correspond à vos critères de recherche." :
                    "Votre classe n'a pas encore de matières actives assignées."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <EtudiantLayout>
        <Container className="py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement de vos matières...</p>
          </div>
        </Container>
      </EtudiantLayout>
    );
  }

  return (
    <EtudiantLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                <i data-feather="book" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Mes Matières - {classroom.name || 'Ma Classe'}
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Matières de votre classe • {matieres.length} matière{matieres.length !== 1 ? 's' : ''} disponible{matieres.length !== 1 ? 's' : ''}
                </p>
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
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="layers" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Matières de ma classe
                </span>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <Row className="g-3">
                <Col md={8}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Rechercher une matière
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par nom, matricule, description..."
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="filter" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Filtrer par statut
                  </Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspendue">Suspendue</option>
                  </Form.Select>
                </Col>
              </Row>
            </div>

            {/* Affichage des résultats */}
            {viewMode === "card" ? renderCardView() : renderListView()}
          </Card.Body>
        </Card>

        {/* Notifications Toast */}
        <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 1050 }}>
          <Toast
            show={showToast}
            onClose={() => setShowToast(false)}
            delay={4000}
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
    </EtudiantLayout>
  );
}