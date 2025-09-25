import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Form, Badge, Alert, ButtonGroup, 
  Spinner, Collapse, Table, Modal, Toast, ToastContainer
} from "react-bootstrap";
import { Link } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function CoursParClassroomEtudiant() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [classroom, setClassroom] = useState({});
  const [cours, setCours] = useState([]);
  const [coursGroupesParMatiere, setCoursGroupesParMatiere] = useState({});

  // États des filtres
  const [filters, setFilters] = useState({
    search: "",
    status: ""
  });

  // États de l'accordion
  const [openSections, setOpenSections] = useState({});

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

  // Charger les cours de la classe de l'étudiant connecté
  const fetchCoursParClassroom = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]?.trim()) {
          params[key] = filters[key].trim();
        }
      });

      const response = await api.get(`/etudiant/view/cours/my-classroom`, { params });
      
      if (response.data.status === 'success') {
        setClassroom(response.data.classroom || {});
        setCours(response.data.cours || []);
        setCoursGroupesParMatiere(response.data.cours_groupes_par_matiere || {});
      } else {
        showToastMessage(response.data.message || "Erreur lors du chargement des cours", 'danger');
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des cours:', err);
      const errorMessage = err.response?.data?.message || "Erreur lors du chargement des cours";
      showToastMessage(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCoursParClassroom();
  }, [fetchCoursParClassroom]);

  useEffect(() => {
    feather.replace();
  }, [coursGroupesParMatiere]);

  // Gérer l'accordion
  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Publié': return 'success';
      case 'Brouillon': return 'warning';
      case 'Archivé': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Publié': return 'check-circle';
      case 'Brouillon': return 'edit-3';
      case 'Archivé': return 'archive';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <EtudiantLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement de vos cours...</p>
        </div>
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
                <i data-feather="book-open" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Mes Cours - {classroom.name || 'Ma Classe'}
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Cours organisés par matière • {cours.length} cours disponibles
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques de la classe */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {cours.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total cours
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
                        {cours.filter(c => c.status === 'Publié').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Publiés
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
                      <h3 className="mb-0 text-info">
                        {Object.keys(coursGroupesParMatiere).length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Matières
                      </small>
                    </div>
                    <div className="text-info">
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
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {classroom.name ? classroom.name : 'N/A'}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Ma classe
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="users" style={{ width: "24px", height: "24px" }}></i>
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
                  Cours par Matière
                </span>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Rechercher un cours
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par titre, description..."
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </Col>
              </Row>
            </div>

            {/* Cours groupés par matière */}
            {Object.keys(coursGroupesParMatiere).length > 0 ? (
              <div className="cours-groups">
                {Object.entries(coursGroupesParMatiere).map(([nomMatiere, coursList]) => (
                  <Card key={nomMatiere} className={`mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header 
                      className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
                      onClick={() => toggleSection(`matiere-${nomMatiere}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i data-feather="book" className="text-success me-3" style={{ width: "20px", height: "20px" }}></i>
                          <div>
                            <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomMatiere}</h5>
                            <small className="text-muted">
                              {coursList.length} cours disponible{coursList.length > 1 ? 's' : ''}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="success">{coursList.length} cours</Badge>
                          <i 
                            data-feather={openSections[`matiere-${nomMatiere}`] ? "chevron-up" : "chevron-down"} 
                            className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                            style={{ width: "20px", height: "20px" }}
                          ></i>
                        </div>
                      </div>
                    </Card.Header>
                    
                    <Collapse in={openSections[`matiere-${nomMatiere}`] !== false}>
                      <Card.Body className={theme === "dark" ? "bg-dark" : ""}>
                        <Row className="g-3">
                          {coursList.map((cours) => (
                            <Col key={cours.id} md={6} lg={4}>
                              <Card className={`h-100 border ${theme === "dark" ? "bg-dark border-secondary" : "bg-white"}`}>
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <Badge bg={getStatusBadge(cours.status)} className="mb-2">
                                      <i data-feather={getStatusIcon(cours.status)} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                                      {cours.status}
                                    </Badge>
                                  </div>
                                  
                                  <h6 className={`${theme === "dark" ? "text-light" : "text-dark"} mb-2`}>
                                    {cours.titre.length > 45 ? 
                                      cours.titre.substring(0, 45) + "..." : 
                                      cours.titre
                                    }
                                  </h6>
                                  
                                  <small className="text-muted d-block mb-2">Code: {cours.matricule}</small>
                                  
                                  {cours.description && (
                                    <p className={`small ${theme === "dark" ? "text-light" : "text-muted"} mb-2`}>
                                      {cours.description.length > 80 ? 
                                        cours.description.substring(0, 80) + "..." : 
                                        cours.description
                                      }
                                    </p>
                                  )}
                                  
                                  <div className="small text-muted mb-3 d-flex align-items-center">
                                    <i data-feather="calendar" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                    Publié le {formatDate(cours.created_at)}
                                  </div>
                                  
                                  <div className="d-flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      as={Link}
                                      to={`/etudiant/show/cours/${cours.id}`}
                                      title="Consulter le cours"
                                      className="flex-fill"
                                    >
                                      <i data-feather="eye" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                                      Consulter
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Card.Body>
                    </Collapse>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="book-open" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucun cours disponible</h6>
                    <p className="small mb-0">
                      Votre classe n'a pas encore de cours publiés ou aucun cours ne correspond à vos critères de recherche.
                    </p>
                  </div>
                </div>
              </div>
            )}
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