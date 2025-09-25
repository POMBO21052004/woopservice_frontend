import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Badge, Button, Form, Modal, Row, Col, Accordion, 
  Toast, ToastContainer, Table, ButtonGroup, Alert, Collapse
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { Link } from "react-router-dom";

export default function CoursManagement() {
  // États
  const [cours, setCours] = useState([]);
  const [coursGroupes, setCoursGroupes] = useState({});
  const [classrooms, setClassrooms] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [viewMode, setViewMode] = useState("grouped"); // grouped ou list

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [matiereFilter, setMatiereFilter] = useState("");

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [coursToDelete, setCoursToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    titre: "",
    description: "",
    contenu: "",
    matricule_classroom: "",
    matricule_matiere: "",
    fichiers_joints_1: null,
    fichiers_joints_2: null,
    liens_externes: "",
    status: "Brouillon"
  });

  // États pour les cascades du formulaire
  const [matieresByClassroom, setMatieresByClassroom] = useState([]);

  // État des statistiques
  const [statistics, setStatistics] = useState({});

  // État du thème
  const [theme, setTheme] = useState("light");

  // États pour l'accordion
  const [openSections, setOpenSections] = useState({});

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

  // Récupérer les cours avec filtres
  const fetchCours = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (statusFilter) params.status = statusFilter;
      if (classroomFilter) params.matricule_classroom = classroomFilter;
      if (matiereFilter) params.matricule_matiere = matiereFilter;

      const res = await api.get("/formateur/view/cours", { params });
      setCours(res.data.cours || []);
      setCoursGroupes(res.data.cours_groupes || {});
      setClassrooms(res.data.classrooms || []);
      setMatieres(res.data.matieres || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des cours", err);
      showToastMessage("Erreur lors de la récupération des données", 'danger');
    }
  }, [search, createdAtFilter, statusFilter, classroomFilter, matiereFilter]);

  // Récupérer les statistiques
  const fetchStatistics = useCallback(async () => {
    try {
      const res = await api.get("/formateur/cours/statistics");
      setStatistics(res.data.statistics || {});
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques", err);
    }
  }, []);

  // Récupérer les matières d'une classe
  const fetchMatieresByClassroom = useCallback(async (matriculeClassroom) => {
    if (!matriculeClassroom) {
      setMatieresByClassroom([]);
      return;
    }
    
    try {
      const res = await api.get(`/formateur/data/formulaire/cours/matieres/${matriculeClassroom}`);
      setMatieresByClassroom(res.data.matieres || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des matières", err);
      setMatieresByClassroom([]);
    }
  }, []);

  useEffect(() => {
    feather.replace();
    fetchCours();
    fetchStatistics();
  }, [fetchCours, fetchStatistics]);

  useEffect(() => {
    feather.replace();
  }, [cours, viewMode]);

  // Gérer le changement de classe dans le formulaire
  const handleClassroomChange = (matriculeClassroom) => {
    setForm({ 
      ...form, 
      matricule_classroom: matriculeClassroom, 
      matricule_matiere: ""
    });
    fetchMatieresByClassroom(matriculeClassroom);
  };

  // Gérer la création de cours
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const formData = new FormData();
      formData.append('titre', form.titre);
      formData.append('description', form.description);
      formData.append('contenu', form.contenu);
      formData.append('matricule_classroom', form.matricule_classroom);
      formData.append('matricule_matiere', form.matricule_matiere);
      formData.append('status', form.status);
      
      if (form.fichiers_joints_1) {
        formData.append('fichiers_joints_1', form.fichiers_joints_1);
      }
      
      if (form.fichiers_joints_2) {
        formData.append('fichiers_joints_2', form.fichiers_joints_2);
      }
      
      if (form.liens_externes) {
        formData.append('liens_externes', form.liens_externes);
      }

      await api.post("/formateur/store/cours", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      fetchCours();
      fetchStatistics();
      setShowAddModal(false);
      resetForm();
      showToastMessage("Cours ajouté avec succès", 'success');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        showToastMessage("Erreur de validation", 'danger');
      } else {
        console.error(err);
        showToastMessage("Une erreur inattendue s'est produite", 'danger');
      }
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setForm({
      titre: "",
      description: "",
      contenu: "",
      matricule_classroom: "",
      matricule_matiere: "",
      fichiers_joints_1: null,
      fichiers_joints_2: null,
      liens_externes: "",
      status: "Brouillon"
    });
    setMatieresByClassroom([]);
  };

  // Gérer la suppression
  const confirmDelete = (coursId) => {
    setCoursToDelete(coursId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/formateur/destroy/cours/${coursToDelete}`);
      
      fetchCours();
      fetchStatistics();
      setShowDeleteModal(false);
      setCoursToDelete(null);
      showToastMessage("Cours supprimé avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
    }
  };

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

  // Render grouped view
  const renderGroupedView = () => {
    if (Object.keys(coursGroupes).length === 0) {
      return (
        <div className="text-center py-5">
          <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
            <i data-feather="book-open" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
            <div>
              <h6>Aucun cours trouvé</h6>
              <p className="small mb-0">Aucun cours ne correspond à vos critères de recherche.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="cours-groups">
        {Object.entries(coursGroupes).map(([nomClasse, matieres]) => (
          <Card key={nomClasse} className={`mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header 
              className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
              onClick={() => toggleSection(`classe-${nomClasse}`)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <i data-feather="home" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomClasse}</h5>
                  <Badge bg="info" className="ms-3">
                    {Object.values(matieres).reduce((total, coursList) => total + coursList.length, 0)} cours
                  </Badge>
                </div>
                <i 
                  data-feather={openSections[`classe-${nomClasse}`] ? "chevron-up" : "chevron-down"} 
                  className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                  style={{ width: "20px", height: "20px" }}
                ></i>
              </div>
            </Card.Header>
            
            <Collapse in={openSections[`classe-${nomClasse}`] !== false}>
              <Card.Body className={theme === "dark" ? "bg-dark" : ""}>
                {Object.entries(matieres).map(([nomMatiere, coursList]) => (
                  <div key={nomMatiere} className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <i data-feather="book" className="text-success me-2" style={{ width: "18px", height: "18px" }}></i>
                        <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomMatiere}</h6>
                        <Badge bg="success" className="ms-2">{coursList.length}</Badge>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        as={Link}
                        to={`/formateur/view/cours/classroom/${coursList[0]?.matiere?.matricule_classroom}`}
                      >
                        <i data-feather="eye" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Voir tous
                      </Button>
                    </div>
                    
                    <Row className="g-3">
                      {coursList.slice(0, 6).map((cours) => (
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
                                {cours.titre.length > 40 ? 
                                  cours.titre.substring(0, 40) + "..." : 
                                  cours.titre
                                }
                              </h6>
                              
                              <small className="text-muted d-block mb-2">{cours.matricule}</small>
                              
                              {cours.description && (
                                <p className={`small ${theme === "dark" ? "text-light" : "text-muted"} mb-2`}>
                                  {cours.description.length > 60 ? 
                                    cours.description.substring(0, 60) + "..." : 
                                    cours.description
                                  }
                                </p>
                              )}
                              
                              <div className="d-flex gap-1 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  as={Link}
                                  to={`/formateur/show/cours/${cours.id}`}
                                  title="Voir les détails"
                                >
                                  <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-warning"
                                  as={Link}
                                  to={`/formateur/edit/cours/${cours.id}`}
                                  title="Modifier"
                                >
                                  <i data-feather="edit" style={{ width: '14px', height: '14px' }}></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => confirmDelete(cours.id)}
                                  title="Supprimer"
                                >
                                  <i data-feather="trash-2" style={{ width: '14px', height: '14px' }}></i>
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                    
                    {coursList.length > 6 && (
                      <div className="text-center mt-3">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          as={Link}
                          to={`/formateur/cours/classroom/${coursList[0]?.matiere?.matricule_classroom}`}
                        >
                          Voir les {coursList.length - 6} autres cours
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Collapse>
          </Card>
        ))}
      </div>
    );
  };

  // Render list view
  const renderListView = () => (
    <div className="table-responsive">
      <Table hover className={`align-middle ${theme === "dark" ? "table-dark" : ""}`}>
        <thead className="table-primary">
          <tr>
            <th>
              <i data-feather="book-open" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Cours
            </th>
            <th className="d-none d-md-table-cell">
              <i data-feather="layers" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Contexte
            </th>
            <th className="d-none d-lg-table-cell text-center">
              <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Date création
            </th>
            <th className="text-center">
              <i data-feather="activity" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Statut
            </th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cours.length ? (
            cours.map((cours) => (
              <tr key={cours.id}>
                <td>
                  <div>
                    <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {cours.titre.length > 50 ? cours.titre.substring(0, 50) + "..." : cours.titre}
                    </div>
                    <small className="text-muted">{cours.matricule}</small>
                  </div>
                </td>
                <td className="d-none d-md-table-cell">
                  <div>
                    <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="home" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {cours.matiere?.classroom?.name || 'Non définie'}
                    </div>
                    <div className="small text-success">
                      <i data-feather="book" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {cours.matiere?.nom || 'Non définie'}
                    </div>
                  </div>
                </td>
                <td className="d-none d-lg-table-cell">
                  <small className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {new Date(cours.created_at).toLocaleDateString('fr-FR')}
                  </small>
                </td>
                <td className="text-center">
                  <Badge bg={getStatusBadge(cours.status)} className="px-3 py-2">
                    <i data-feather={getStatusIcon(cours.status)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    {cours.status}
                  </Badge>
                </td>
                <td className="text-center">
                  <div className="d-flex gap-1 justify-content-center">
                    <Button
                      size="sm"
                      variant="outline-info"
                      as={Link}
                      to={`/formateur/show/cours/${cours.id}`}
                      title="Voir les détails"
                    >
                      <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      as={Link}
                      to={`/formateur/edit/cours/${cours.id}`}
                      title="Modifier"
                    >
                      <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => confirmDelete(cours.id)}
                      title="Supprimer"
                    >
                      <i data-feather="trash-2" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="book-open" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucun cours trouvé</h6>
                    <p className="small mb-0">Aucun cours ne correspond à vos critères de recherche.</p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="book-open" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Cours
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Administration des cours par classe et matière
              </p>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {statistics.total_cours || cours.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total
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
                        {statistics.cours_publies || cours.filter(c => c.status === 'Publié').length}
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
                      <h3 className="mb-0 text-warning">
                        {statistics.cours_brouillons || cours.filter(c => c.status === 'Brouillon').length}
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
                      <h3 className="mb-0 text-info">
                        {classrooms.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Classes
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="home" style={{ width: "24px", height: "24px" }}></i>
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
                <i data-feather="book-open" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Cours
                </span>
                
                {/* Switch de vue */}
                <ButtonGroup className="ms-3">
                  <Button
                    variant="outline-success"
                    size="sm"
                    as={Link}
                    to={`/formateur/cours/statistics`}
                  >
                    <i data-feather="bar-chart-2" style={{ width: "14px", height: "14px" }}></i>
                  </Button>
                  <Button
                    variant={viewMode === "grouped" ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={() => setViewMode("grouped")}
                    title="Vue groupée"
                  >
                    <i data-feather="layers" style={{ width: "14px", height: "14px" }}></i>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    title="Vue liste"
                  >
                    <i data-feather="list" style={{ width: "14px", height: "14px" }}></i>
                  </Button>
                </ButtonGroup>
              </div>
              
              <div className="d-flex gap-2 mt-2 mt-md-0">
                <Button variant="success" className="d-flex align-items-center" onClick={() => setShowAddModal(true)}>
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

                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Titre, description, classe..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>

                <div className="col-md-3">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="home" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Classe
                  </Form.Label>
                  <Form.Select
                    value={classroomFilter}
                    onChange={e => setClassroomFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes</option>
                    {classrooms.map(classroom => (
                      <option key={classroom.matricule} value={classroom.matricule}>
                        {classroom.name}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="book" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Matière
                  </Form.Label>
                  <Form.Select
                    value={matiereFilter}
                    onChange={e => setMatiereFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes</option>
                    {matieres.map(matiere => (
                      <option key={matiere.matricule} value={matiere.matricule}>
                        {matiere.nom}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div className="col-md-2">
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
                    <option value="Brouillon">Brouillons</option>
                    <option value="Publié">Publiés</option>
                    <option value="Archivé">Archivés</option>
                  </Form.Select>
                </div>

                <div className="col-md-3">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Date création
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={createdAtFilter}
                    onChange={e => setCreatedAtFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>

              </div>
            </div>

            {/* Affichage des résultats */}
            {viewMode === "grouped" ? renderGroupedView() : renderListView()}
          </Card.Body>
        </Card>

        {/* Modale d'ajout */}
        <Modal
          show={showAddModal}
          onHide={() => {
            setShowAddModal(false);
            resetForm();
          }}
          centered
          size="xl"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Créer un Cours</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Row className="g-3">
                {/* Sélection en cascade : Classe → Matière */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Classe *</Form.Label>
                    <Form.Select
                      value={form.matricule_classroom}
                      onChange={e => handleClassroomChange(e.target.value)}
                      isInvalid={!!errors.matricule_classroom}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    >
                      <option value="">Sélectionnez une classe</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.matricule} value={classroom.matricule}>
                          {classroom.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.matricule_classroom}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Matière *</Form.Label>
                    <Form.Select
                      value={form.matricule_matiere}
                      onChange={e => setForm({ ...form, matricule_matiere: e.target.value })}
                      isInvalid={!!errors.matricule_matiere}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                      disabled={!form.matricule_classroom}
                    >
                      <option value="">
                        {form.matricule_classroom ? 'Sélectionnez une matière' : 'Choisissez d\'abord une classe'}
                      </option>
                      {matieresByClassroom.map(matiere => (
                        <option key={matiere.matricule} value={matiere.matricule}>
                          {matiere.nom}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.matricule_matiere}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Titre du cours *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Saisissez le titre du cours..."
                      required
                      value={form.titre}
                      onChange={e => setForm({ ...form, titre: e.target.value })}
                      isInvalid={!!errors.titre}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.titre}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Statut *</Form.Label>
                    <Form.Select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                      isInvalid={!!errors.status}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    >
                      <option value="Brouillon">Brouillon</option>
                      <option value="Publié">Publié</option>
                      <option value="Archivé">Archivé</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Description (optionnelle)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Description courte du cours..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      isInvalid={!!errors.description}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Contenu du cours *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      placeholder="Saisissez le contenu détaillé du cours..."
                      required
                      value={form.contenu}
                      onChange={e => setForm({ ...form, contenu: e.target.value })}
                      isInvalid={!!errors.contenu}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.contenu}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fichier joint 1 (optionnel)</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                      onChange={e => setForm({ ...form, fichiers_joints_1: e.target.files[0] })}
                      isInvalid={!!errors.fichiers_joints_1}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.fichiers_joints_1}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      PDF, DOC, PPT, XLS, Images - Max 2MB
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fichier joint 2 (optionnel)</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                      onChange={e => setForm({ ...form, fichiers_joints_2: e.target.files[0] })}
                      isInvalid={!!errors.fichiers_joints_2}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.fichiers_joints_2}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      PDF, DOC, PPT, XLS, Images - Max 2MB
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Liens externes (optionnels)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder='Saisissez les liens au format JSON: {"titre": "URL", "ressource": "https://example.com"}'
                      value={form.liens_externes}
                      onChange={e => setForm({ ...form, liens_externes: e.target.value })}
                      isInvalid={!!errors.liens_externes}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.liens_externes}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Format JSON pour les liens externes
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button variant="secondary" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button type="submit" variant="success">
                <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Créer le Cours
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modale de confirmation de suppression */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Confirmation de Suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <p>Êtes-vous sûr de vouloir supprimer ce cours ?</p>
            <div className="alert alert-warning">
              <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Cette action est irréversible.
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDeleteConfirmed}>
              <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Supprimer
            </Button>
          </Modal.Footer>
        </Modal>

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
    
                    