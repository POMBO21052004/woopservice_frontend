import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Button, Row, Col, Badge, Alert, Spinner, Toast, ToastContainer, ButtonGroup, Form
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { Link, useParams } from "react-router-dom";

export default function CoursParMatiere() {
  const { matricule_matiere } = useParams();
  
  // États
  const [cours, setCours] = useState([]);
  const [matiere, setMatiere] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const [viewMode, setViewMode] = useState("card"); // card ou table

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Filtres locaux (optionnels)
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  // Récupérer les cours de la matière
  const fetchCoursParMatiere = useCallback(async () => {
    if (!matricule_matiere) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Appel API pour récupérer les cours de cette matière
      const response = await api.get(`/formateur/view/cours/matiere/${matricule_matiere}`);
      setCours(response.data.cours || []);
      
      // Si on a des cours, récupérer les infos de la matière depuis le premier cours
      if (response.data.cours && response.data.cours.length > 0) {
        setMatiere(response.data.cours[0].matiere);
      } else {
        // Sinon essayer de récupérer les infos de la matière directement
        try {
          const matiereResponse = await api.get("/formateur/view/matiere");
          const foundMatiere = matiereResponse.data.matieres?.find(m => m.matricule === matricule_matiere);
          setMatiere(foundMatiere || null);
        } catch (matiereErr) {
          console.error("Erreur lors de la récupération de la matière:", matiereErr);
        }
      }
    } catch (err) {
      setError('Erreur lors de la récupération des cours');
      console.error('Erreur:', err);
      showToastMessage("Erreur lors du chargement des cours", 'danger');
    } finally {
      setLoading(false);
    }
  }, [matricule_matiere]);

  useEffect(() => {
    fetchCoursParMatiere();
  }, [fetchCoursParMatiere]);

  useEffect(() => {
    feather.replace();
  }, [cours, viewMode]);

  // Gérer le changement de statut d'un cours
  const handleToggleStatus = async (coursId) => {
    try {
      await api.patch(`/formateur/toggle-status/cours/${coursId}`);
      fetchCoursParMatiere(); // Recharger les cours
      showToastMessage("Statut du cours mis à jour", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la mise à jour du statut", 'danger');
    }
  };

  // Filtrer les cours localement
  const filteredCours = cours.filter(cours => {
    const matchSearch = !search.trim() || 
      cours.titre.toLowerCase().includes(search.toLowerCase()) ||
      cours.matricule.toLowerCase().includes(search.toLowerCase()) ||
      (cours.description && cours.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchStatus = !statusFilter || cours.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

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
      case 'Publié': return 'eye';
      case 'Brouillon': return 'edit-3';
      case 'Archivé': return 'archive';
      default: return 'help-circle';
    }
  };

  // Render card view
  const renderCardView = () => (
    <Row className="g-4">
      {filteredCours.length ? (
        filteredCours.map((cours) => (
          <Col key={cours.id} md={6} lg={4}>
            <Card className={`h-100 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"} position-relative`}>
              <div className="position-relative">
                <div className="bg-primary bg-opacity-10 p-4 text-center">
                  <i data-feather="book-open" className="text-primary" style={{ width: '48px', height: '48px' }}></i>
                </div>
                <Badge 
                  bg={getStatusBadge(cours.status)}
                  className="position-absolute top-0 end-0 m-2"
                >
                  <i data-feather={getStatusIcon(cours.status)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                  {cours.status}
                </Badge>
              </div>
              
              <Card.Body className="d-flex flex-column">
                <div className="mb-auto">
                  <Card.Title className={`h5 mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {cours.titre}
                  </Card.Title>
                  <Card.Text className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="hash" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    {cours.matricule}
                  </Card.Text>
                  <Card.Text className={theme === "dark" ? "text-light" : "text-dark"}>
                    {cours.description ? 
                      (cours.description.length > 80 ? cours.description.substring(0, 80) + "..." : cours.description)
                      : 'Aucune description'
                    }
                  </Card.Text>
                  <Card.Text className="small text-muted">
                    <i data-feather="calendar" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    Créé le {new Date(cours.created_at).toLocaleDateString('fr-FR')}
                  </Card.Text>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex align-items-center gap-2">
                    {cours.fichiers_joints_1 && (
                      <small className="text-primary">
                        <i data-feather="paperclip" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        Fichier 1
                      </small>
                    )}
                    {cours.fichiers_joints_2 && (
                      <small className="text-success">
                        <i data-feather="paperclip" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        Fichier 2
                      </small>
                    )}
                  </div>
                  
                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-info"
                      as={Link}
                      to={`/formateur/show/cours/${cours.id}`}
                      title="Voir les détails"
                    >
                      <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                    </Button>
                    <Button
                      variant="outline-warning"
                      as={Link}
                      to={`/formateur/edit/cours/${cours.id}`}
                      title="Modifier"
                    >
                      <i data-feather="edit" style={{ width: '14px', height: '14px' }}></i>
                    </Button>
                    <Button
                      variant="outline-primary"
                      title="Changer le statut"
                      onClick={() => handleToggleStatus(cours.id)}
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
              <i data-feather="book-open" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
              <div>
                <h6>Aucun cours trouvé</h6>
                <p className="small mb-0">Aucun cours ne correspond à vos critères de recherche.</p>
              </div>
            </div>
          </div>
        </Col>
      )}
    </Row>
  );

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des cours...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (error) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" as={Link} to="/formateur/view/cours">
            <i data-feather="arrow-left" className="me-2" />
            Retour aux cours
          </Button>
          <Button variant="outline-primary" onClick={fetchCoursParMatiere}>
            <i data-feather="refresh-cw" className="me-2" />
            Réessayer
          </Button>
        </div>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <Button 
              variant="outline-secondary" 
              size="sm"
              as={Link} 
              to="/formateur/view/cours"
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="book" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                {matiere ? `Cours de ${matiere.nom}` : 'Cours de la matière'}
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                {matiere?.classroom?.name && `Classe: ${matiere.classroom.name} • `}
                {filteredCours.length} cours {filteredCours.length > 1 ? 'trouvés' : 'trouvé'}
              </p>
            </div>
          </div>

          {/* Statistiques rapides */}
          {cours.length > 0 && (
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
                          {cours.filter(c => c.status === 'Publié').length}
                        </h3>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          Publiés
                        </small>
                      </div>
                      <div className="text-success">
                        <i data-feather="eye" style={{ width: "24px", height: "24px" }}></i>
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
                        <h3 className="mb-0 text-warning">
                          {cours.filter(c => c.status === 'Brouillon').length}
                        </h3>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          Brouillons
                        </small>
                      </div>
                      <div className="text-warning">
                        <i data-feather="edit-3" style={{ width: "24px", height: "24px" }}></i>
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
                        <h3 className="mb-0 text-secondary">
                          {cours.filter(c => c.status === 'Archivé').length}
                        </h3>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          Archivés
                        </small>
                      </div>
                      <div className="text-secondary">
                        <i data-feather="archive" style={{ width: "24px", height: "24px" }}></i>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </div>

        {/* Panneau principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="list" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Cours de la matière
                </span>
                
                {/* Switch de vue */}
                <ButtonGroup className="ms-3">
                  <Button
                    variant={viewMode === "card" ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                  >
                    <i data-feather="grid" style={{ width: "14px", height: "14px" }}></i>
                  </Button>
                </ButtonGroup>
              </div>
              
              <div className="d-flex gap-2 mt-2 mt-md-0">
                <Button 
                  variant="success" 
                  as={Link}
                  to="/formateur/view/cours"
                  className="d-flex align-items-center"
                >
                  <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Nouveau Cours
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Titre, matricule, description..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-6">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="activity" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut
                  </Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous</option>
                    <option value="Publié">Publiés</option>
                    <option value="Brouillon">Brouillons</option>
                    <option value="Archivé">Archivés</option>
                  </Form.Select>
                </div>
              </div>
            </div>

            {/* Affichage des résultats */}
            {renderCardView()}

            {/* Message d'aide si aucun cours */}
            {cours.length === 0 && (
              <div className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="book-open" className="mb-3" style={{ width: "64px", height: "64px", opacity: 0.3 }}></i>
                  <div>
                    <h5>Aucun cours pour cette matière</h5>
                    <p className="mb-3">
                      Cette matière n'a pas encore de cours associés.
                    </p>
                    <Button 
                      variant="primary" 
                      as={Link}
                      to="/formateur/view/cours"
                    >
                      <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Créer le premier cours
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Information sur la matière */}
        {matiere && (
          <Card className={`shadow-sm border-0 mt-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="info" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                Informations sur la matière
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className={theme === "dark" ? "text-light" : "text-dark"}>
                      {matiere.nom}
                    </strong>
                    <div className="small text-muted">
                      <i data-feather="hash" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {matiere.matricule}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  {matiere.classroom && (
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <i data-feather="home" className="me-2" style={{ width: '16px', height: '16px' }}></i>
                        <span className={theme === "dark" ? "text-light" : "text-dark"}>
                          {matiere.classroom.name}
                        </span>
                      </div>
                    </div>
                  )}
                </Col>
                {matiere.description && (
                  <Col md={12}>
                    <div className="mb-0">
                      <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {matiere.description}
                      </p>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        )}

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