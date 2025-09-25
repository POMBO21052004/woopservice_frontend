import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import fileDownload from "js-file-download";
import {
  Container, Table, Button, Form, Modal, Row, Col, Dropdown, Badge, Card, Toast, ToastContainer, ButtonGroup, Collapse
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { Link } from "react-router-dom";

export default function MatiereManagement() {
  // États
  const [matieres, setMatieres] = useState([]);
  const [matieresGroupees, setMatieresGroupees] = useState({});
  const [classrooms, setClassrooms] = useState([]);
  const [checkedMatieres, setCheckedMatieres] = useState([]);
  const [viewMode, setViewMode] = useState("grouped"); // grouped ou table

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [matiereToDelete, setMatiereToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    nom: "",
    description: "",
    matricule_classroom: "",
    coefficient: 1,
    status: "Active",
    image: null
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

  // Récupérer les matières avec filtres
  const fetchMatieres = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (statusFilter) params.status = statusFilter;
      if (classroomFilter) params.matricule_classroom = classroomFilter;

      const res = await api.get("/formateur/view/matiere", { params });
      setMatieres(res.data.matieres || []);
      setClassrooms(res.data.classrooms || []);

      // Grouper les matières par classe
      const grouped = (res.data.matieres || []).reduce((acc, matiere) => {
        const classeName = matiere.classroom?.name || 'Classe non définie';
        if (!acc[classeName]) {
          acc[classeName] = {
            classroom: matiere.classroom,
            matieres: []
          };
        }
        acc[classeName].matieres.push(matiere);
        return acc;
      }, {});

      setMatieresGroupees(grouped);
    } catch (err) {
      console.error("Erreur lors de la récupération des matières", err);
      showToastMessage("Erreur lors de la récupération des données", 'danger');
    }
  }, [search, createdAtFilter, statusFilter, classroomFilter]);

  // Récupérer les statistiques
  const fetchStatistics = useCallback(async () => {
    try {
      const res = await api.get("/formateur/matiere/statistics");
      setStatistics(res.data.statistics || {});
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques", err);
    }
  }, []);

  useEffect(() => {
    feather.replace();
    fetchMatieres();
    fetchStatistics();
  }, [fetchMatieres, fetchStatistics]);

  useEffect(() => {
    feather.replace();
  }, [matieres, checkedMatieres, viewMode]);

  // Gérer l'accordion
  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Gérer la création de matière
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const formData = new FormData();
      formData.append('nom', form.nom);
      formData.append('description', form.description);
      formData.append('matricule_classroom', form.matricule_classroom);
      formData.append('coefficient', form.coefficient);
      formData.append('status', form.status);
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post("/formateur/store/matiere", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      fetchMatieres();
      fetchStatistics();
      setShowAddModal(false);
      setForm({
        nom: "",
        description: "",
        matricule_classroom: "",
        coefficient: 1,
        status: "Active",
        image: null
      });
      showToastMessage("Matière ajoutée avec succès", 'success');
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
  const confirmDelete = (matiereId = null) => {
    setMatiereToDelete(matiereId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const idsToDelete = matiereToDelete ? [matiereToDelete] : checkedMatieres;
      
      if (matiereToDelete) {
        await api.delete(`/formateur/destroy/matiere/${matiereToDelete}`);
      } else {
        // Pour les suppressions en lot, il faudrait ajouter une route dans le contrôleur
        for (const id of idsToDelete) {
          await api.delete(`/formateur/destroy/matiere/${id}`);
        }
      }
      
      fetchMatieres();
      fetchStatistics();
      setShowDeleteModal(false);
      setCheckedMatieres([]);
      setMatiereToDelete(null);
      showToastMessage("Matière(s) supprimée(s) avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
    }
  };

  // Gérer le changement de statut en lot
  const handleStatusChange = async (newStatus) => {
    try {
      for (const id of checkedMatieres) {
        await api.patch(`/formateur/toggle-status/matiere/${id}`);
      }
      
      fetchMatieres();
      fetchStatistics();
      setCheckedMatieres([]);
      setShowStatusModal(false);
      showToastMessage(`Statut des matières mis à jour`, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la mise à jour du statut", 'danger');
    }
  };

  // Gérer les cases à cocher
  const handleCheck = (event) => {
    const { value, checked } = event.target;
    const matiereId = parseInt(value);
    
    if (checked) {
      setCheckedMatieres(prev => [...prev, matiereId]);
    } else {
      setCheckedMatieres(prev => prev.filter(item => item !== matiereId));
    }
  };

  // Gérer la sélection globale
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setCheckedMatieres(matieres.map(matiere => matiere.id));
    } else {
      setCheckedMatieres([]);
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
      if (classroomFilter) params.append('matricule_classroom', classroomFilter);

      const res = await api.get(`/formateur/download/liste/matiere/pdf?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `matieres_${new Date().toISOString().slice(0, 10)}.pdf`;
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
      if (classroomFilter) params.append('matricule_classroom', classroomFilter);

      const res = await api.get(`/formateur/download/liste/matiere/excel?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `matieres_${new Date().toISOString().slice(0, 10)}.xlsx`;
      fileDownload(res.data, filename);
      showToastMessage("Le fichier Excel est en cours de téléchargement", 'success');
    } catch (err) {
      console.error("Erreur de téléchargement Excel:", err);
      showToastMessage("Échec du téléchargement Excel", 'danger');
    }
  };

  // Render grouped view
  const renderGroupedView = () => {
    if (Object.keys(matieresGroupees).length === 0) {
      return (
        <div className="text-center py-5">
          <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
            <i data-feather="book" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
            <div>
              <h6>Aucune matière trouvée</h6>
              <p className="small mb-0">Aucune matière ne correspond à vos critères de recherche.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="matieres-groupees">
        {Object.entries(matieresGroupees).map(([nomClasse, classroomData]) => (
          <Card key={nomClasse} className={`mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header 
              className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
              onClick={() => toggleSection(`classe-${nomClasse}`)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <i data-feather="home" className="text-primary me-3" style={{ width: "20px", height: "20px" }}></i>
                  <div>
                    <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomClasse}</h5>
                    <small className="text-muted">
                      {classroomData.matieres.length} matière{classroomData.matieres.length > 1 ? 's' : ''} 
                      {classroomData.classroom && ` • Matricule: ${classroomData.classroom.matricule}`}
                    </small>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="info">{classroomData.matieres.length}</Badge>
                  <i 
                    data-feather={openSections[`classe-${nomClasse}`] ? "chevron-up" : "chevron-down"} 
                    className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                    style={{ width: "20px", height: "20px" }}
                  ></i>
                </div>
              </div>
            </Card.Header>
            
            <Collapse in={openSections[`classe-${nomClasse}`] !== false}>
              <Card.Body className={theme === "dark" ? "bg-dark" : ""}>
                <Row className="g-3">
                  {classroomData.matieres.map((matiere) => (
                    <Col key={matiere.id} md={6} lg={3}>
                      <Card className={`h-100 border-0 shadow-sm position-relative ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-white border"}`}>
                        {checkedMatieres.length > 0 && (
                          <div className="position-absolute top-0 start-0 p-2" style={{ zIndex: 10 }}>
                            <h1>v</h1>
                            <Form.Check
                              type="checkbox"
                              value={matiere.id}
                              checked={checkedMatieres.includes(matiere.id)}
                              onChange={handleCheck}
                            />
                          </div>
                        )}
                        
                        <div className="position-relative">
                          <Card.Img 
                            variant="top" 
                            src={matiere.image_url || "/placeholder/matiere_placeholder.png"}
                            style={{ height: '140px', objectFit: 'cover' }}
                          />
                          <Badge 
                            bg={matiere.status === 'Active' ? 'success' : matiere.status === 'Inactive' ? 'warning' : 'danger'}
                            className="position-absolute top-0 end-0 m-2"
                          >
                            {matiere.status}
                          </Badge>
                        </div>
                        
                        <Card.Body className="d-flex flex-column p-3">
                          <div className="mb-auto">
                            <Card.Title className={`h6 mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {matiere.nom.length > 25 ? matiere.nom.substring(0, 25) + "..." : matiere.nom}
                            </Card.Title>
                            <Card.Text className={`small ${theme === "dark" ? "text-light" : "text-muted"} mb-2`}>
                              <i data-feather="hash" className="me-1" style={{ width: '10px', height: '10px' }}></i>
                              {matiere.matricule}
                            </Card.Text>
                            {matiere.description && (
                              <Card.Text className={`small ${theme === "dark" ? "text-light" : "text-dark"} mb-2`}>
                                {matiere.description.length > 50 ? matiere.description.substring(0, 50) + "..." : matiere.description}
                              </Card.Text>
                            )}
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <small className="text-info">
                                <i data-feather="award" className="me-1" style={{ width: '10px', height: '10px' }}></i>
                                Coef: {matiere.coefficient || 1}
                              </small>
                            </div>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <div className="d-flex align-items-center gap-1">
                              <div className="d-flex align-items-center" title="ses cours">
                                <i data-feather="book-open" className="me-1 text-muted" style={{ width: '12px', height: '12px' }}></i>
                                <small className={`${theme === "dark" ? "text-light" : "text-muted"} me-2`} >
                                  {matiere.cours_count || 0}
                                </small>
                              </div>
                              <div className="d-flex align-items-center" title="ses evalautions">
                                <i data-feather="clipboard" className="me-1 text-muted" style={{ width: '12px', height: '12px' }}></i>
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
                                <i data-feather="eye" style={{ width: '12px', height: '12px' }}></i>
                              </Button>
                              <Button
                                variant="outline-warning"
                                as={Link}
                                to={`/formateur/edit/matiere/${matiere.id}`}
                                title="Modifier"
                              >
                                <i data-feather="edit" style={{ width: '12px', height: '12px' }}></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                title="Supprimer"
                                onClick={() => confirmDelete(matiere.id)}
                              >
                                <i data-feather="trash-2" style={{ width: '12px', height: '12px' }}></i>
                              </Button>
                            </ButtonGroup>
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
    );
  };

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
                checked={checkedMatieres.length === matieres.length && matieres.length > 0}
              />
            </th>
            <th>
              <i data-feather="book" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Matière
            </th>
            <th className="d-none d-md-table-cell">
              <i data-feather="home" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Classe
            </th>
            <th className="d-none d-lg-table-cell">
              <i data-feather="award" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Coef.
            </th>
            <th className="d-none d-lg-table-cell">
              <i data-feather="bar-chart" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Contenu
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
          {matieres.length ? (
            matieres.map((matiere) => (
              <tr key={matiere.id} className={theme === "dark" ? "border-secondary" : ""}>
                <td className="text-center">
                  <Form.Check
                    type="checkbox"
                    value={matiere.id}
                    checked={checkedMatieres.includes(matiere.id)}
                    onChange={handleCheck}
                  />
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <img 
                        src={matiere.image_url || "/placeholder/matiere_placeholder.png"}
                        alt={matiere.nom}
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
                        {matiere.nom.length > 20 ? matiere.nom.substring(0, 20) + "..." : matiere.nom}
                      </div>
                      <small className={theme === "dark" ? "text-light" : "text-muted"} title={matiere.matricule}>
                        {matiere.matricule}
                      </small>
                    </div>
                  </div>
                </td>
                <td className="d-none d-md-table-cell">
                  <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {matiere.classroom?.name || 'Non définie'}
                  </div>
                </td>
                <td className="d-none d-lg-table-cell">
                  <Badge bg="info" className="px-2 py-1">
                    {matiere.coefficient || 1}
                  </Badge>
                </td>
                <td className="d-none d-lg-table-cell">
                  <div className="d-flex gap-2">
                    <small className="text-primary">
                      <i data-feather="book-open" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {matiere.cours_count || 0} cours
                    </small>
                    <small className="text-success">
                      <i data-feather="clipboard" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {matiere.evaluations_count || 0} éval.
                    </small>
                  </div>
                </td>
                <td className="d-none d-lg-table-cell text-center">
                  <Badge
                    bg={matiere.status === "Active" ? "success" : matiere.status === "Inactive" ? "warning" : "danger"}
                    className="px-3 py-2"
                  >
                    {matiere.status}
                  </Badge>
                </td>
                <td className="text-center">
                  <div className="d-flex gap-1 justify-content-center">
                    <Button
                      size="sm"
                      variant="outline-info"
                      title="Voir les détails"
                      as={Link}
                      to={`/formateur/show/matiere/${matiere.id}`}
                    >
                      <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      title="Modifier"
                      as={Link}
                      to={`/formateur/edit/matiere/${matiere.id}`}
                    >
                      <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      title="Supprimer"
                      onClick={() => confirmDelete(matiere.id)}
                    >
                      <i data-feather="trash-2" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="book" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucune matière trouvée</h6>
                    <p className="small mb-0">Aucune matière ne correspond à vos critères de recherche.</p>
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
              <i data-feather="book" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Matières
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Administration des matières d'enseignement par classe
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
                        {statistics.total_matieres || matieres.length}
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
                        {statistics.active_matieres || matieres.filter(m => m.status === 'Active').length}
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
                      <h3 className="mb-0 text-warning">
                        {statistics.inactive_matieres || matieres.filter(m => m.status === 'Inactive').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Inactives
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="pause-circle" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.suspendues_matieres || matieres.filter(m => m.status === 'Suspendue').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Suspendues
                      </small>
                    </div>
                    <div className="text-danger">
                      <i data-feather="x-circle" style={{ width: "24px", height: "24px" }}></i>
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
                <i data-feather="book" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Matières par Classe
                </span>
                
                {/* Switch de vue */}
                <ButtonGroup className="ms-3">
                  <Button
                    variant={viewMode === "grouped" ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={() => setViewMode("grouped")}
                  >
                    <i data-feather="layers" style={{ width: "14px", height: "14px" }}></i>
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
                {checkedMatieres.length > 0 && (
                  <>
                    <Button 
                      variant="warning" 
                      className="d-flex align-items-center" 
                      onClick={() => setShowStatusModal(true)}
                    >
                      <i data-feather="edit" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Statut ({checkedMatieres.length})
                    </Button>
                    <Button 
                      variant="danger" 
                      className="d-flex align-items-center" 
                      onClick={() => confirmDelete()}
                    >
                      <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Supprimer ({checkedMatieres.length})
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
                  Nouvelle Matière
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <div className="row g-3">
                <div className="col-md-3">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche Globale
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nom, matricule, description..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchMatieres()}
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
                    <option value="">Toutes les classes</option>
                    {classrooms.map(classroom => (
                      <option key={classroom.matricule} value={classroom.matricule}>
                        {classroom.name}
                      </option>
                    ))}
                  </Form.Select>
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
                    <option value="Active">Actives</option>
                    <option value="Inactive">Inactives</option>
                    <option value="Suspendue">Suspendues</option>
                  </Form.Select>
                </div>
              </div>
              
              {checkedMatieres.length > 0 && (
                <div className="mt-3 p-2 bg-primary bg-opacity-10 rounded">
                  <small className="text-primary fw-bold">
                    {checkedMatieres.length} matière(s) sélectionnée(s)
                  </small>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={() => setCheckedMatieres([])}
                  >
                    Désélectionner tout
                  </Button>
                </div>
              )}
            </div>

            {/* Affichage des résultats */}
            {viewMode === "grouped" ? renderGroupedView() : renderTableView()}
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
            <Modal.Title>Ajouter une Matière</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nom de la matière *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: Mathématiques, Français..."
                      required
                      value={form.nom}
                      onChange={e => setForm({ ...form, nom: e.target.value })}
                      isInvalid={!!errors.nom}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.nom}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Classe *</Form.Label>
                    <Form.Select
                      value={form.matricule_classroom}
                      onChange={e => setForm({ ...form, matricule_classroom: e.target.value })}
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
                    <Form.Label>Coefficient</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="10"
                      value={form.coefficient}
                      onChange={e => setForm({ ...form, coefficient: parseInt(e.target.value) })}
                      isInvalid={!!errors.coefficient}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.coefficient}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Entre 1 et 10 (défaut: 1)
                    </Form.Text>
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
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspendue">Suspendue</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.status}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Image de la matière</Form.Label>
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
                      placeholder="Description de la matière..."
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
            <Modal.Title>Changer le statut des matières</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <p>Vous allez modifier le statut de {checkedMatieres.length} matière(s) sélectionnée(s).</p>
            <div className="d-grid gap-2">
              <Button variant="success" onClick={() => handleStatusChange('Active')}>
                <i data-feather="check-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Activer les matières
              </Button>
              <Button variant="warning" onClick={() => handleStatusChange('Inactive')}>
                <i data-feather="pause-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Désactiver les matières
              </Button>
              <Button variant="danger" onClick={() => handleStatusChange('Suspendue')}>
                <i data-feather="x-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Suspendre les matières
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
            <p>Êtes-vous sûr de vouloir supprimer {matiereToDelete ? "cette matière" : "ces matières"} ?</p>
            <div className="alert alert-warning">
              <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Cette action est irréversible. Les cours et évaluations associés doivent être supprimés au préalable.
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