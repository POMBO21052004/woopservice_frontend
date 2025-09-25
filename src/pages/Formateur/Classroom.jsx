import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import fileDownload from "js-file-download";
import {
  Container, Table, Button, Form, Modal, Row, Col, Dropdown, Badge, Card, Toast, ToastContainer, ButtonGroup
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { Link } from "react-router-dom";

export default function ClassroomManagement() {
  // États
  const [classrooms, setClassrooms] = useState([]);
  const [checkedClassrooms, setCheckedClassrooms] = useState([]);
  const [viewMode, setViewMode] = useState("card"); // card ou table

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    name: "",
    description: "",
    examen: "",
    status: "Open",
    image: null
  });

  // État des statistiques
  const [statistics, setStatistics] = useState({});

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

  // Récupérer les salles de classe avec filtres
  const fetchClassrooms = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/formateur/view/classroom", { params });
      setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des salles de classe", err);
      showToastMessage("Erreur lors de la récupération des données", 'danger');
    }
  }, [search, createdAtFilter, statusFilter]);

  // Récupérer les statistiques
  const fetchStatistics = useCallback(async () => {
    try {
      const res = await api.get("/formateur/view/classroom/statistics");
      setStatistics(res.data.statistics || {});
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques", err);
    }
  }, []);

  useEffect(() => {
    feather.replace();
    fetchClassrooms();
    fetchStatistics();
  }, [fetchClassrooms, fetchStatistics]);

  useEffect(() => {
    feather.replace();
  }, [classrooms, checkedClassrooms, viewMode]);

  // Gérer la création de salle de classe
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('examen', form.examen);
      formData.append('status', form.status);
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post("/formateur/store/classroom", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      fetchClassrooms();
      fetchStatistics();
      setShowAddModal(false);
      setForm({
        name: "",
        description: "",
        examen: "",
        status: "Open",
        image: null
      });
      showToastMessage("Salle de classe ajoutée avec succès", 'success');
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

  // Gérer la suppression simple ou en lot
  const confirmDelete = (classroomId = null) => {
    setClassroomToDelete(classroomId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const idsToDelete = classroomToDelete ? [classroomToDelete] : checkedClassrooms;
      
      if (classroomToDelete) {
        await api.delete(`/formateur/destroy/classroom/${classroomToDelete}`);
      } else {
        await api.post(`/formateur/classroom/destroy-group`, { ids: idsToDelete });
      }
      
      fetchClassrooms();
      fetchStatistics();
      setShowDeleteModal(false);
      setCheckedClassrooms([]);
      setClassroomToDelete(null);
      showToastMessage("Salle(s) de classe supprimée(s) avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
    }
  };

  // Gérer le changement de statut en lot
  const handleStatusChange = async (newStatus) => {
    try {
      await api.post('/formateur/classroom/toggle-status-group', {
        ids: checkedClassrooms,
        new_status: newStatus
      });
      
      fetchClassrooms();
      fetchStatistics();
      setCheckedClassrooms([]);
      setShowStatusModal(false);
      showToastMessage(`Statut des salles mis à jour vers ${newStatus}`, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la mise à jour du statut", 'danger');
    }
  };

  // Gérer les cases à cocher
  const handleCheck = (event) => {
    const { value, checked } = event.target;
    const classroomId = parseInt(value);
    
    if (checked) {
      setCheckedClassrooms(prev => [...prev, classroomId]);
    } else {
      setCheckedClassrooms(prev => prev.filter(item => item !== classroomId));
    }
  };

  // Gérer la sélection globale
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setCheckedClassrooms(classrooms.map(classroom => classroom.id));
    } else {
      setCheckedClassrooms([]);
    }
  };

  // Télécharger PDF
  const handleDownloadPdf = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (createdAtFilter) params.append('created_at', createdAtFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/formateur/classroom/export/pdf?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `salles_classe_${new Date().toISOString().slice(0, 10)}.pdf`;
      fileDownload(res.data, filename);
      showToastMessage("Le rapport PDF est en cours de téléchargement", 'success');
    } catch (err) {
      console.error("Erreur de téléchargement PDF:", err);
      showToastMessage("Échec du téléchargement PDF", 'danger');
    }
  };

  // Télécharger Excel
  const handleDownloadExcel = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (createdAtFilter) params.append('created_at', createdAtFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/formateur/classroom/export/excel?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `salles_classe_${new Date().toISOString().slice(0, 10)}.xlsx`;
      fileDownload(res.data, filename);
      showToastMessage("Le fichier Excel est en cours de téléchargement", 'success');
    } catch (err) {
      console.error("Erreur de téléchargement Excel:", err);
      showToastMessage("Échec du téléchargement Excel", 'danger');
    }
  };

  // Render card view
  const renderCardView = () => (
    <Row className="g-4">
      {classrooms.length ? (
        classrooms.map((classroom) => (
          <Col key={classroom.id} md={6} lg={3}>
            <Card className={`h-100 mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"} position-relative`}>
              {checkedClassrooms.length > 0 && (
                <div className="position-absolute top-0 start-0 p-2" style={{ zIndex: 10 }}>
                  <Form.Check
                    type="checkbox"
                    value={classroom.id}
                    checked={checkedClassrooms.includes(classroom.id)}
                    onChange={handleCheck}
                  />
                </div>
              )}
              
              <div className="position-relative">
                <Card.Img 
                  variant="top" 
                  src={classroom.image_url || "/placeholder/classroom_placeholder.png"}
                  style={{ height: '140px', objectFit: 'cover' }}
                />
                <Badge 
                  bg={classroom.status === 'Open' ? 'success' : 'danger'}
                  className="position-absolute top-0 end-0 m-2"
                >
                  {classroom.status === 'Open' ? 'Ouverte' : 'Fermée'}
                </Badge>
              </div>
              
              <Card.Body className="d-flex flex-column p-3">
                <div className="mb-2">
                  <Card.Title className={`h6 mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`} title={classroom.name}>
                    {(classroom.name.length > 15 ? classroom.name.substring(0, 15) + "..." : classroom.name)}
                  </Card.Title>
                  <Card.Text className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                    <i data-feather="hash" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    {classroom.matricule}
                  </Card.Text>
                  <Card.Text className={theme === "dark" ? "text-light" : "text-dark"}>
                    {classroom.description ? 
                      (classroom.description.length > 50 ? classroom.description.substring(0, 50) + "..." : classroom.description)
                      : 'Aucune description'
                    }
                  </Card.Text>
                  {classroom.examen? (
                    <Card.Text className="small text-info" title={classroom.examen}>
                      <i data-feather="file-text" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {/* {classroom.examen} */}
                      {(classroom.examen.length > 15 ? classroom.examen.substring(0, 15) + "..." : classroom.examen)}
                    </Card.Text>
                  )
                  : 
                  (
                    <Card.Text className="small text-info" title={classroom.examen}>
                      <i data-feather="file-text" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      Aucun Examen
                    </Card.Text>
                  )
                  }
                </div>
                
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="d-flex align-items-center">
                    <i data-feather="users" className="me-1 text-muted" style={{ width: '14px', height: '14px' }}></i>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      {classroom.users_count || 0} etudiant(s)
                    </small>
                  </div>
                </div>
                  
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-info"
                      as={Link}
                      to={`/formateur/show/classroom/${classroom.id}`}
                      title="Voir les détails"
                    >
                      <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                    </Button>
                    <Button
                      variant="outline-warning"
                      as={Link}
                      to={`/formateur/classroom/${classroom.id}/edit`}
                      title="Modifier"
                    >
                      <i data-feather="edit" style={{ width: '14px', height: '14px' }}></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      title="Supprimer"
                      onClick={() => confirmDelete(classroom.id)}
                    >
                      <i data-feather="trash-2" style={{ width: '14px', height: '14px' }}></i>
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
              <i data-feather="home" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
              <div>
                <h6>Aucune salle de classe trouvée</h6>
                <p className="small mb-0">Aucune salle ne correspond à vos critères de recherche.</p>
              </div>
            </div>
          </div>
        </Col>
      )}
    </Row>
  );

  // Render table view
  const renderTableView = () => (
    <div className="table-responsive">
      <Table
        hover
        className={`align-middle ${theme === "dark" ? "table-dark" : ""}`}
        style={{ borderRadius: "8px", overflow: "hidden" }}
      >
        <thead className="table-primary">
          <tr>
            <th className="text-center" style={{ width: "50px" }}>
              <Form.Check
                type="checkbox"
                onChange={handleSelectAll}
                checked={checkedClassrooms.length === classrooms.length && classrooms.length > 0}
              />
            </th>
            <th>
              <i data-feather="home" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Salle de classe
            </th>
            <th className="d-none d-md-table-cell">
              <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Description
            </th>
            <th className="d-none d-lg-table-cell">
              <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Utilisateurs
            </th>
            <th className="d-none d-lg-table-cell text-center">
              <i data-feather="activity" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Statut
            </th>
            <th className="text-center">
              <i data-feather="settings" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {classrooms.length ? (
            classrooms.map((classroom) => (
              <tr key={classroom.id} className={theme === "dark" ? "border-secondary" : ""}>
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    value={classroom.id}
                    checked={checkedClassrooms.includes(classroom.id)}
                    onChange={handleCheck}
                  />
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <img 
                        src={classroom.image_url || "/placeholder/classroom_placeholder.png"}
                        alt={classroom.name}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '2px solid rgba(255, 255, 255, 0.1)'
                        }}
                      />
                    </div>
                    <div>
                      <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {classroom.name.length > 20 ? classroom.name.substring(0, 20) + "..." : classroom.name}
                      </div>
                      <small className={theme === "dark" ? "text-light" : "text-muted"} title={classroom.matricule}>
                        {classroom.matricule}
                      </small>
                      {classroom.examen && (
                        <div>
                          <small className="text-info">
                            <i data-feather="file-text" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                            {classroom.examen}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="d-none d-md-table-cell">
                  <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {classroom.description ? 
                      (classroom.description.length > 50 ? classroom.description.substring(0, 50) + "..." : classroom.description)
                      : 'Aucune description'
                    }
                  </div>
                </td>
                <td className="d-none d-lg-table-cell">
                  <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="users" className="me-2 text-primary" style={{ width: '16px', height: '16px' }}></i>
                    <span className="fw-bold">{classroom.users_count || 0}</span>
                  </div>
                </td>
                <td className="d-none d-lg-table-cell text-center">
                  <Badge
                    bg={classroom.status === "Open" ? "success" : "danger"}
                    className="px-3 py-2"
                  >
                    <i
                      data-feather={classroom.status === "Open" ? "unlock" : "lock"}
                      className="me-1"
                      style={{ width: "12px", height: "12px" }}
                    ></i>
                    {classroom.status === "Open" ? "Ouverte" : "Fermée"}
                  </Badge>
                </td>
                <td className="text-center">
                  <div className="d-flex gap-1 justify-content-center">
                    <Button
                      size="sm"
                      variant="outline-info"
                      title="Voir les détails"
                      as={Link}
                      to={`/formateur/show/classroom/${classroom.id}`}
                    >
                      <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      title="Modifier"
                      as={Link}
                      to={`/formateur/classroom/${classroom.id}/edit`}
                    >
                      <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      title="Supprimer"
                      onClick={() => confirmDelete(classroom.id)}
                    >
                      <i data-feather="trash-2" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="home" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucune salle de classe trouvée</h6>
                    <p className="small mb-0">Aucune salle ne correspond à vos critères de recherche.</p>
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
              <i data-feather="home" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Salles de Classe
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Administration des espaces de formation
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
                        {statistics.total_classrooms || classrooms.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Salles
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="home" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.open_classrooms || classrooms.filter(c => c.status === 'Open').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Ouvertes
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="unlock" style={{ width: "24px", height: "24px" }}></i>
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
                      <h3 className="mb-0 text-danger">
                        {statistics.close_classrooms || classrooms.filter(c => c.status === 'Close').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Fermées
                      </small>
                    </div>
                    <div className="text-danger">
                      <i data-feather="lock" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.total_users_in_classrooms || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Utilisateurs
                      </small>
                    </div>
                    <div className="text-info">
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
                <i data-feather="home" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Salles de Classe
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
                  <Button
                    variant={viewMode === "table" ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <i data-feather="list" style={{ width: "14px", height: "14px" }}></i>
                  </Button>
                </ButtonGroup>
              </div>
              
              <div className="d-flex gap-2 mt-2 mt-md-0">
                {checkedClassrooms.length > 0 && (
                  <>
                    <Button 
                      variant="warning" 
                      className="d-flex align-items-center" 
                      onClick={() => setShowStatusModal(true)}
                    >
                      <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Statut ({checkedClassrooms.length})
                    </Button>
                    <Button 
                      variant="danger" 
                      className="d-flex align-items-center" 
                      onClick={() => confirmDelete()}
                    >
                      <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Supprimer ({checkedClassrooms.length})
                    </Button>
                  </>
                )}
                
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-primary"
                    className="d-flex align-items-center"
                    id="dropdown-export"
                  >
                    <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Exporter
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow-lg border-0" style={{ minWidth: "300px" }}>
                    <div className="p-3">
                      <h6 className="text-primary mb-3">
                        <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Rapport PDF
                      </h6>
                      <Form onSubmit={handleDownloadPdf} className="mb-3">
                        <Button type="submit" variant="primary" className="w-100">
                          <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Télécharger PDF
                        </Button>
                      </Form>

                      <hr />

                      <h6 className="text-success mb-3">
                        <i data-feather="file" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Fichier Excel
                      </h6>
                      <Form onSubmit={handleDownloadExcel}>
                        <Button type="submit" variant="success" className="w-100">
                          <i data-feather="file" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Télécharger Excel
                        </Button>
                      </Form>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>

                <Button variant="success" className="d-flex align-items-center" onClick={() => setShowAddModal(true)}>
                  <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Nouvelle Salle
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
                    Recherche Globale
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nom, matricule, description..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchClassrooms()}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-3">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Date de création
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={createdAtFilter}
                    onChange={e => setCreatedAtFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-3">
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
                    <option value="Open">Ouvertes</option>
                    <option value="Close">Fermées</option>
                  </Form.Select>
                </div>
              </div>
              
              {checkedClassrooms.length > 0 && (
                <div className="mt-3 p-2 bg-primary bg-opacity-10 rounded">
                  <small className="text-primary fw-bold">
                    {checkedClassrooms.length} salle(s) sélectionnée(s)
                  </small>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={() => setCheckedClassrooms([])}
                  >
                    Désélectionner tout
                  </Button>
                </div>
              )}
            </div>

            {/* Affichage des résultats */}
            {viewMode === "card" ? renderCardView() : renderTableView()}
          </Card.Body>
        </Card>

        {/* Modale d'ajout */}
        <Modal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Ajouter une Salle de Classe</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nom de la salle *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: Salle A101"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      isInvalid={!!errors.name}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
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
                      <option value="Open">Ouverte</option>
                      <option value="Close">Fermée</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Examen (optionnel)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: Examen final 2024"
                      value={form.examen}
                      onChange={e => setForm({ ...form, examen: e.target.value })}
                      isInvalid={!!errors.examen}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.examen}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Image de la salle</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={e => setForm({ ...form, image: e.target.files[0] })}
                      isInvalid={!!errors.image}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      JPG, PNG, WEBP - Max 2MB
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Description de la salle de classe..."
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
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Annuler</Button>
              <Button type="submit" variant="success">
                <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Enregistrer
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modale de changement de statut */}
        <Modal
          show={showStatusModal}
          onHide={() => setShowStatusModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Changer le statut des salles</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <p>Vous allez modifier le statut de {checkedClassrooms.length} salle(s) sélectionnée(s).</p>
            <div className="d-grid gap-2">
              <Button variant="success" onClick={() => handleStatusChange('Open')}>
                <i data-feather="unlock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Ouvrir les salles
              </Button>
              <Button variant="danger" onClick={() => handleStatusChange('Close')}>
                <i data-feather="lock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Fermer les salles
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Annuler</Button>
          </Modal.Footer>
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
            <p>Êtes-vous sûr de vouloir supprimer {classroomToDelete ? "cette salle" : "ces salles"} ?</p>
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
        <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 1050 }} >
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