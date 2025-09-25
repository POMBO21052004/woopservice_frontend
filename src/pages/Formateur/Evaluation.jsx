import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Card, Badge, Button, Form, Modal, Row, Col, Accordion, 
  Toast, ToastContainer, Table, ButtonGroup, Alert, Collapse
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { Link } from "react-router-dom";

export default function EvaluationManagement() {
  // États
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationsGroupees, setEvaluationsGroupees] = useState({});
  const [classrooms, setClassrooms] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [matieresByClassroom, setMatieresByClassroom] = useState([]);
  const [checkedEvaluations, setCheckedEvaluations] = useState([]);
  const [viewMode, setViewMode] = useState("grouped"); // grouped ou list

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [matiereFilter, setMatiereFilter] = useState("");
  const [dateDebutFilter, setDateDebutFilter] = useState("");

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    titre: "",
    description: "",
    matricule_classroom: "",
    matricule_matiere: "",
    date_debut: "",
    duree_minutes: 60,
    status: "Brouillon"
  });

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

  // Récupérer les évaluations avec filtres
  const fetchEvaluations = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (statusFilter) params.status = statusFilter;
      if (classroomFilter) params.matricule_classroom = classroomFilter;
      if (matiereFilter) params.matricule_matiere = matiereFilter;
      if (dateDebutFilter) params.date_debut = dateDebutFilter;

      const res = await api.get("/formateur/view/evaluations", { params });
      setEvaluations(res.data.evaluations || []);
      setEvaluationsGroupees(res.data.evaluations_groupees || {});
      setClassrooms(res.data.classrooms || []);
      setMatieres(res.data.matieres || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des évaluations", err);
      showToastMessage("Erreur lors de la récupération des données", 'danger');
    }
  }, [search, createdAtFilter, statusFilter, classroomFilter, matiereFilter, dateDebutFilter]);

  // Récupérer les statistiques
  const fetchStatistics = useCallback(async () => {
    try {
      const res = await api.get("/formateur/evaluations/statistics");
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
      const res = await api.get(`/formateur/evaluations/matieres/${matriculeClassroom}`);
      setMatieresByClassroom(res.data.matieres || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des matières", err);
      setMatieresByClassroom([]);
    }
  }, []);

  useEffect(() => {
    feather.replace();
    fetchEvaluations();
    fetchStatistics();
  }, [fetchEvaluations, fetchStatistics]);

  useEffect(() => {
    feather.replace();
  }, [evaluations, checkedEvaluations, viewMode]);

  // Gérer le changement de classe dans le formulaire
  const handleClassroomChange = (matriculeClassroom) => {
    setForm({ ...form, matricule_classroom: matriculeClassroom, matricule_matiere: "" });
    fetchMatieresByClassroom(matriculeClassroom);
  };

  // Gérer la création d'évaluation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    try {
      await api.post("/formateur/store/evaluation", form);
      
      fetchEvaluations();
      fetchStatistics();
      setShowAddModal(false);
      setForm({
        titre: "",
        description: "",
        matricule_classroom: "",
        matricule_matiere: "",
        date_debut: "",
        duree_minutes: 60,
        status: "Brouillon"
      });
      setMatieresByClassroom([]);
      showToastMessage("Évaluation ajoutée avec succès", 'success');
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

  // Gérer la suppression
  const confirmDelete = (evaluationId = null) => {
    setEvaluationToDelete(evaluationId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      if (evaluationToDelete) {
        await api.delete(`/formateur/destroy/evaluation/${evaluationToDelete}`);
      }
      
      fetchEvaluations();
      fetchStatistics();
      setShowDeleteModal(false);
      setCheckedEvaluations([]);
      setEvaluationToDelete(null);
      showToastMessage("Évaluation supprimée avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
    }
  };

  // Gérer le changement de statut
  const handleToggleStatus = async (evaluationId) => {
    try {
      await api.patch(`/formateur/toggle-status/evaluation/${evaluationId}`);
      fetchEvaluations();
      fetchStatistics();
      showToastMessage("Statut mis à jour", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la mise à jour du statut", 'danger');
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
      case 'Programmée': return 'primary';
      case 'Brouillon': return 'warning';
      case 'Terminée': return 'success';
      case 'Annulée': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Programmée': return 'calendar';
      case 'Brouillon': return 'edit-3';
      case 'Terminée': return 'check-circle';
      case 'Annulée': return 'x-circle';
      default: return 'help-circle';
    }
  };

  const getEtatTemporelBadge = (etat) => {
    switch(etat) {
      case 'En cours': return 'success';
      case 'Future': return 'info';
      case 'Passée': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  // Render grouped view
  const renderGroupedView = () => {
    if (Object.keys(evaluationsGroupees).length === 0) {
      return (
        <div className="text-center py-5">
          <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
            <i data-feather="clipboard" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
            <div>
              <h6>Aucune évaluation trouvée</h6>
              <p className="small mb-0">Aucune évaluation ne correspond à vos critères de recherche.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="evaluation-groups">
        {Object.entries(evaluationsGroupees).map(([nomClasse, matieres]) => (
          <Card key={nomClasse} className={`mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header 
              className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
              onClick={() => toggleSection(nomClasse)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <i data-feather="home" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomClasse}</h5>
                  <Badge bg="info" className="ms-3">
                    {Object.values(matieres).reduce((total, evaluations) => total + evaluations.length, 0)} évaluations
                  </Badge>
                </div>
                <i 
                  data-feather={openSections[nomClasse] ? "chevron-up" : "chevron-down"} 
                  className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                  style={{ width: "20px", height: "20px" }}
                ></i>
              </div>
            </Card.Header>
            
            <Collapse in={openSections[nomClasse] !== false}>
              <Card.Body className={theme === "dark" ? "bg-dark" : ""}>
                {Object.entries(matieres).map(([nomMatiere, evaluations]) => (
                  <div key={nomMatiere} className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <i data-feather="book" className="text-success me-2" style={{ width: "18px", height: "18px" }}></i>
                      <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomMatiere}</h6>
                      <Badge bg="success" className="ms-2">{evaluations.length}</Badge>
                    </div>
                    
                    <Row className="g-3">
                      {evaluations.map((evaluation) => (
                        <Col key={evaluation.id} md={6} lg={4}>
                          <Card className={`h-100 border ${theme === "dark" ? "bg-dark border-secondary" : "bg-white"}`}>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className={`${theme === "dark" ? "text-light" : "text-dark"} mb-0`}>
                                  {evaluation.titre}
                                </h6>
                                <Badge bg={getStatusBadge(evaluation.status)} className="ms-2">
                                  <i data-feather={getStatusIcon(evaluation.status)} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                                  {evaluation.status}
                                </Badge>
                              </div>
                              
                              <small className="text-muted d-block mb-2">{evaluation.matricule}</small>
                              
                              {evaluation.description && (
                                <p className={`small ${theme === "dark" ? "text-light" : "text-muted"} mb-2`}>
                                  {evaluation.description.length > 60 ? 
                                    evaluation.description.substring(0, 60) + "..." : 
                                    evaluation.description
                                  }
                                </p>
                              )}
                              
                              <div className="d-flex flex-wrap gap-1 mb-2">
                                <Badge bg={getEtatTemporelBadge(evaluation.etat_temporel)} className="small">
                                  {evaluation.etat_temporel}
                                </Badge>
                                <Badge bg="secondary" className="small">
                                  {formatDuration(evaluation.duree_minutes)}
                                </Badge>
                                <Badge bg="info" className="small">
                                  {evaluation.questions_count} questions
                                </Badge>
                              </div>
                              
                              <div className="small text-muted mb-3">
                                <i data-feather="calendar" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                {formatDate(evaluation.date_debut)}
                              </div>
                              
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  as={Link}
                                  to={`/formateur/show/evaluation/${evaluation.id}`}
                                  title="Voir les détails"
                                >
                                  <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-warning"
                                  as={Link}
                                  to={`/formateur/edit/evaluation/${evaluation.id}`}
                                  title="Modifier"
                                >
                                  <i data-feather="edit" style={{ width: '14px', height: '14px' }}></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handleToggleStatus(evaluation.id)}
                                  title="Changer le statut"
                                >
                                  <i data-feather="refresh-cw" style={{ width: '14px', height: '14px' }}></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => confirmDelete(evaluation.id)}
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
              <i data-feather="clipboard" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Évaluation
            </th>
            <th className="d-none d-md-table-cell">
              <i data-feather="home" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Classe/Matière
            </th>
            <th className="d-none d-lg-table-cell">
              <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Date & Durée
            </th>
            <th className="text-center">
              <i data-feather="activity" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Statut
            </th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.length ? (
            evaluations.map((evaluation) => (
              <tr key={evaluation.id}>
                <td>
                  <div>
                    <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {evaluation.titre}
                    </div>
                    <small className="text-muted">{evaluation.matricule}</small>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      <Badge bg={getEtatTemporelBadge(evaluation.etat_temporel)} className="small">
                        {evaluation.etat_temporel}
                      </Badge>
                      <Badge bg="info" className="small">
                        {evaluation.questions_count} questions
                      </Badge>
                    </div>
                  </div>
                </td>
                <td className="d-none d-md-table-cell">
                  <div>
                    <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="home" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {evaluation.matiere?.classroom?.name || 'Non définie'}
                    </div>
                    <div className="small text-success">
                      <i data-feather="book" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {evaluation.matiere?.nom || 'Non définie'}
                    </div>
                  </div>
                </td>
                <td className="d-none d-lg-table-cell">
                  <div>
                    <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {formatDate(evaluation.date_debut)}
                    </div>
                    <div className="small text-muted">
                      Durée: {formatDuration(evaluation.duree_minutes)}
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <Badge bg={getStatusBadge(evaluation.status)} className="px-3 py-2">
                    <i data-feather={getStatusIcon(evaluation.status)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    {evaluation.status}
                  </Badge>
                </td>
                <td className="text-center">
                  <div className="d-flex gap-1 justify-content-center">
                    <Button
                      size="sm"
                      variant="outline-info"
                      as={Link}
                      to={`/formateur/show/evaluation/${evaluation.id}`}
                      title="Voir les détails"
                    >
                      <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      as={Link}
                      to={`/formateur/edit/evaluation/${evaluation.id}`}
                      title="Modifier"
                    >
                      <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleToggleStatus(evaluation.id)}
                      title="Changer le statut"
                    >
                      <i data-feather="refresh-cw" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => confirmDelete(evaluation.id)}
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
                  <i data-feather="clipboard" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucune évaluation trouvée</h6>
                    <p className="small mb-0">Aucune évaluation ne correspond à vos critères de recherche.</p>
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
              <i data-feather="clipboard" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Évaluations
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Administration des évaluations par classe et matière
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
                        {statistics.total_evaluations || evaluations.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="clipboard" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.programmee_evaluations || evaluations.filter(e => e.status === 'Programmée').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Programmées
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="calendar" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.brouillon_evaluations || evaluations.filter(e => e.status === 'Brouillon').length}
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
                      <h3 className="mb-0 text-success">
                        {statistics.terminee_evaluations || evaluations.filter(e => e.status === 'Terminée').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Terminées
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="check-circle" style={{ width: "24px", height: "24px" }}></i>
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
                <i data-feather="clipboard" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Évaluations
                </span>
                
                {/* Switch de vue */}
                <ButtonGroup className="ms-3">
                  <Button
                    variant="outline-success"
                    size="sm"
                    as={Link}
                    to={`/formateur/evaluation/statistics`}
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
                  Nouvelle Évaluation
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <div className="row g-3">
                <div className="col-md-4">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche Globale
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Titre, description, classe..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-2">
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
                    <option value="Programmée">Programmées</option>
                    <option value="Terminée">Terminées</option>
                    <option value="Annulée">Annulées</option>
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Date début
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={dateDebutFilter}
                    onChange={e => setDateDebutFilter(e.target.value)}
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
            setMatieresByClassroom([]);
          }}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Créer une Évaluation</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Titre de l'évaluation *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: Contrôle de mathématiques - Chapitre 5"
                      required
                      value={form.titre}
                      onChange={e => setForm({ ...form, titre: e.target.value })}
                      isInvalid={!!errors.titre}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.titre}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                
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

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Date et heure de début *</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      required
                      value={form.date_debut}
                      onChange={e => setForm({ ...form, date_debut: e.target.value })}
                      isInvalid={!!errors.date_debut}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <Form.Control.Feedback type="invalid">{errors.date_debut}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Durée (en minutes) *</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="480"
                      required
                      value={form.duree_minutes}
                      onChange={e => setForm({ ...form, duree_minutes: parseInt(e.target.value) })}
                      isInvalid={!!errors.duree_minutes}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Text className="text-muted">Maximum 8 heures (480 minutes)</Form.Text>
                    <Form.Control.Feedback type="invalid">{errors.duree_minutes}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
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
                      <option value="Programmée">Programmée</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Description (optionnelle)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Description de l'évaluation, consignes particulières..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      isInvalid={!!errors.description}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button variant="secondary" onClick={() => {
                setShowAddModal(false);
                setMatieresByClassroom([]);
              }}>
                Annuler
              </Button>
              <Button type="submit" variant="success">
                <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Créer l'Évaluation
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
            <p>Êtes-vous sûr de vouloir supprimer cette évaluation ?</p>
            <div className="alert alert-warning">
              <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Cette action est irréversible. Toutes les questions et réponses associées seront également supprimées.
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