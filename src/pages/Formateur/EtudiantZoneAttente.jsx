import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import fileDownload from "js-file-download";
import {
  Container, Table, Button, Form, Modal, Row, Col, Dropdown, Badge, Card, Toast, ToastContainer,
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { Link } from "react-router-dom";

export default function ViewEtudiantsZoneAttenteByFormateurs() {
  // États
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [checkedUsers, setCheckedUsers] = useState([]);

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    name: "",
    email: "",
    matricule_classroom: "",
    password: "",
    password_confirmation: "",
  });
  
  const [inviteForm, setInviteForm] = useState({
    email: "",
    matricule_classroom: "",
    role: "0",
  });

  // États pour les nouvelles fonctions
  const [selectedRole, setSelectedRole] = useState("1");
  const [selectedClassroom, setSelectedClassroom] = useState("");

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

  // Récupérer les utilisateurs avec filtres
  const fetchUsers = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (statusFilter) params.status = statusFilter;
      if (genderFilter) params.gender = genderFilter;
      if (classroomFilter) params.matricule_classroom = classroomFilter;

      const res = await api.get("/formateur/view/etudiant-espace-attente", { params });
      setUsers(res.data.users || []);
      setClassrooms(res.data.classrooms || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs", err);
    }
  }, [search, createdAtFilter, statusFilter, genderFilter, classroomFilter]);

  useEffect(() => {
    feather.replace();
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    feather.replace();
  }, [users, checkedUsers]);

  // Gérer la création d'utilisateur
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      await api.post("/formateur/store/etudiant-espace-attente", form);
      fetchUsers();
      setShowAddModal(false);
      setForm({
        name: "",
        email: "",
        matricule_classroom: "",
        password: "",
        password_confirmation: "",
      });
      showToastMessage("Utilisateur ajouté avec succès", 'success');
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

  // Gérer l'invitation d'utilisateur
  const handleInvite = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      const res = await api.post("/formateur/invitation/users", inviteForm);
      showToastMessage(res.data.message || "Invitation envoyée avec succès", 'success');
      setShowInviteModal(false);
      setInviteForm({ email: "", matricule_classroom: "", role: "1" });
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        showToastMessage("Erreur lors de l'envoi de l'invitation", 'danger');
      } else {
        console.error("Erreur d'invitation", err);
        showToastMessage("Une erreur inattendue s'est produite lors de l'invitation", 'danger');
      }
    }
  };

  // Gérer la suppression simple ou en lot
  const confirmDelete = (userId = null) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const idsToDelete = userToDelete ? [userToDelete] : checkedUsers;
      
      if (userToDelete) {
        await api.delete(`/formateur/destroy/etudiant-espace-attente/${userToDelete}`);
      } else {
        await api.post(`/formateur/destroy-group/etudiant-espace-attente`, { ids: idsToDelete });
      }
      
      fetchUsers();
      setShowDeleteModal(false);
      setCheckedUsers([]);
      setUserToDelete(null);
      showToastMessage("Utilisateur(s) supprimé(s) avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la suppression", 'danger');
    }
  };

  // Gérer le changement de rôle individuel
  const handleToggleRole = async (userId) => {
    try {
      const res = await api.patch(`/formateur/toggle-role/etudiant-espace-attente/${userId}`);
      fetchUsers();
      showToastMessage(res.data.message, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du changement de rôle", 'danger');
    }
  };

  // Gérer le changement de rôle en lot
  const handleRoleGroupChange = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/formateur/toggle-role-group/etudiant-espace-attente`, {
        ids: checkedUsers,
        new_role: parseInt(selectedRole)
      });
      
      fetchUsers();
      setShowRoleModal(false);
      setCheckedUsers([]);
      showToastMessage(res.data.message, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du changement de rôle en lot", 'danger');
    }
  };

  // Gérer l'assignation de classe individuelle
  const handleAssignClassroom = async (userId, matriculeClassroom) => {
    try {
      const res = await api.patch(`/formateur/assign-classroom/etudiant-espace-attente/${userId}`, {
        matricule_classroom: matriculeClassroom
      });
      fetchUsers();
      showToastMessage(res.data.message, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de l'assignation de classe", 'danger');
    }
  };

  // Gérer l'assignation de classe en lot
  const handleClassroomGroupAssign = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/formateur/assign-classroom-group/etudiant-espace-attente`, {
        ids: checkedUsers,
        matricule_classroom: selectedClassroom
      });
      
      fetchUsers();
      setShowClassroomModal(false);
      setCheckedUsers([]);
      showToastMessage(res.data.message, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de l'assignation de classe en lot", 'danger');
    }
  };

  // Gérer les cases à cocher pour la suppression en lot
  const handleCheck = (event) => {
    const { value, checked } = event.target;
    const userId = parseInt(value);
    
    if (checked) {
      setCheckedUsers(prev => [...prev, userId]);
    } else {
      setCheckedUsers(prev => prev.filter(item => item !== userId));
    }
  };

  // Gérer la sélection globale
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setCheckedUsers(users.map(user => user.id));
    } else {
      setCheckedUsers([]);
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
      if (genderFilter) params.append('gender', genderFilter);
      if (classroomFilter) params.append('matricule_classroom', classroomFilter);

      const res = await api.get(`/formateur/download/liste/etudiant-espace-attente/pdf?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `rapport_utilisateurs_(etudiants-espace-attente)_${new Date().toISOString().slice(0, 10)}.pdf`;
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
      if (genderFilter) params.append('gender', genderFilter);
      if (classroomFilter) params.append('matricule_classroom', classroomFilter);

      const res = await api.get(`/formateur/download/liste/etudiant-espace-attente/excel?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `rapport_utilisateurs_(etudiants-espace-attente)_${new Date().toISOString().slice(0, 10)}.xlsx`;
      fileDownload(res.data, filename);
      showToastMessage("Le fichier Excel est en cours de téléchargement", 'success');
    } catch (err) {
      console.error("Erreur de téléchargement Excel:", err);
      showToastMessage("Échec du téléchargement Excel", 'danger');
    }
  };

  // Calculer les statistiques
  const activeUsers = users.filter(user => user.status === "Connecté");
  const pendingUsers = users.filter(user => user.status === "En attente");
  const offlineUsers = users.filter(user => user.status === "Déconnecté");
  const activeStudents = users.filter(user => user.role === 1);
  const waitingStudents = users.filter(user => user.role === 0);

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="users" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Étudiants En Espace d'Attente
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Institut de Formation - Administration centrale du système
              </p>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <Row className="mb-4">
            <Col md={2}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {users.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="users" style={{ width: "20px", height: "20px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-success">
                        {activeStudents.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Actifs
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="check-circle" style={{ width: "20px", height: "20px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-warning">
                        {waitingStudents.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Attente
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="pause-circle" style={{ width: "20px", height: "20px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-success">
                        {activeUsers.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        En Ligne
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="activity" style={{ width: "20px", height: "20px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-info">
                        {pendingUsers.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Pending
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="clock" style={{ width: "20px", height: "20px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-danger">
                        {offlineUsers.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Hors Ligne
                      </small>
                    </div>
                    <div className="text-danger">
                      <i data-feather="x-circle" style={{ width: "20px", height: "20px" }}></i>
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
                <i data-feather="users" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Étudiants
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                {/* {checkedUsers.length > 0 && (
                  <>
                    <Button variant="warning" className="d-flex align-items-center" onClick={() => setShowRoleModal(true)}>
                      <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Changer Rôle ({checkedUsers.length})
                    </Button>
                    <Button variant="info" className="d-flex align-items-center" onClick={() => setShowClassroomModal(true)}>
                      <i data-feather="layers" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Assigner Classe ({checkedUsers.length})
                    </Button>
                    <Button variant="danger" className="d-flex align-items-center" onClick={() => confirmDelete()}>
                      <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Supprimer ({checkedUsers.length})
                    </Button>
                  </>
                )} */}
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-primary"
                    className="d-flex align-items-center"
                    id="dropdown-export"
                  >
                    <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Exporter les Données
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow-lg border-0" style={{ minWidth: "350px" }}>
                    <div className="p-3">
                      <h6 className="text-primary mb-3">
                        <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Rapport PDF
                      </h6>
                      <Form onSubmit={handleDownloadPdf} className="mb-4">
                        <Form.Control
                          type="text"
                          placeholder="Rechercher par nom, email, téléphone..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className={`mb-2 ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                        />
                        <Form.Control
                          type="date"
                          value={createdAtFilter}
                          onChange={e => setCreatedAtFilter(e.target.value)}
                          className={`mb-2 ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                        />
                        <Form.Select
                          value={statusFilter}
                          onChange={e => setStatusFilter(e.target.value)}
                          className={`mb-2 ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                        >
                          <option value="">Tous les Statuts</option>
                          <option value="Connecté">En Ligne</option>
                          <option value="Déconnecté">Hors Ligne</option>
                          <option value="En attente">En Attente</option>
                        </Form.Select>
                        <Form.Select
                          value={genderFilter}
                          onChange={e => setGenderFilter(e.target.value)}
                          className={`mb-3 ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                        >
                          <option value="">Tous les Genres</option>
                          <option value="Masculin">Masculin</option>
                          <option value="Féminin">Féminin</option>
                          <option value="Autre">Autre</option>
                        </Form.Select>
                        <Form.Select
                          value={classroomFilter}
                          onChange={e => setClassroomFilter(e.target.value)}
                          className={`mb-3 ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                        >
                          <option value="">Toutes les classes</option>
                          {classrooms.map(classroom => (
                            <option key={classroom.matricule} value={classroom.matricule}>
                                {classroom.name}
                            </option>
                          ))}
                        </Form.Select>
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

                <Button variant="info" className="d-flex align-items-center" onClick={() => setShowInviteModal(true)}>
                  <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Inviter
                </Button>

                <Button variant="success" className="d-flex align-items-center" onClick={() => setShowAddModal(true)}>
                  <i data-feather="user-plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Nouvel Utilisateur
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
                    placeholder="Nom, email, téléphone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchUsers()}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-3">
                    <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="layers" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Niveau d'étude
                    </Form.Label>
                    <Form.Select
                        value={classroomFilter}
                        onChange={e => setClassroomFilter(e.target.value)}
                        className={`mb-3 ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                    >
                        <option value="">Toutes les classes</option>
                        {classrooms.map(classroom => (
                        <option key={classroom.matricule} value={classroom.matricule}>
                            {classroom.name}
                        </option>
                        ))}
                    </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={createdAtFilter}
                    onChange={e => setCreatedAtFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
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
                    <option value="Connecté">En Ligne</option>
                    <option value="Déconnecté">Hors Ligne</option>
                    <option value="En attente">En Attente</option>
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="user" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Genre
                  </Form.Label>
                  <Form.Select
                    value={genderFilter}
                    onChange={e => setGenderFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                    <option value="Autre">Autre</option>
                  </Form.Select>
                </div>
              </div>
            </div>
            
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center m-3">
              {checkedUsers.length > 0 && (
                <div className="d-flex align-items-center">
                  <i data-feather="shuffle" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                  <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Executer une action
                  </span>
                </div>
              )}
              <div className="d-flex gap-2 mt-2 mt-md-0">
                {checkedUsers.length > 0 && (
                  <>
                    <Button variant="warning" className="d-flex align-items-center" onClick={() => setShowRoleModal(true)}>
                      <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Changer Rôle ({checkedUsers.length})
                    </Button>
                    <Button variant="info" className="d-flex align-items-center" onClick={() => setShowClassroomModal(true)}>
                      <i data-feather="layers" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Assigner Classe ({checkedUsers.length})
                    </Button>
                    <Button variant="danger" className="d-flex align-items-center" onClick={() => confirmDelete()}>
                      <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Supprimer ({checkedUsers.length})
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Tableau des utilisateurs */}
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
                        checked={checkedUsers.length === users.length && users.length > 0}
                      />
                    </th>
                    <th>
                      <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Utilisateur
                    </th>
                    <th className="d-none d-md-table-cell">
                      <i data-feather="layers" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Classe
                    </th>
                    <th className="d-none d-md-table-cell">
                      <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Contact
                    </th>
                    <th className="d-none d-lg-table-cell text-center">
                      <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Rôle
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
                  {users.length ? (
                    users.map((user) => (
                      <tr key={user.id} className={theme === "dark" ? "border-secondary" : ""}>
                        <td className="text-center">
                          <Form.Check
                            type="checkbox"
                            value={user.id}
                            checked={checkedUsers.includes(user.id)}
                            onChange={handleCheck}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                {user?.profil_url ? (
                                    <img 
                                    src={user.profil_url} 
                                    alt={user.name || "Utilisateur"}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '2px solid rgba(255, 255, 255, 0.3)'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                    />
                                ) : 
                                    <i data-feather="user" className="text-primary" style={{ width: "16px", height: "16px" }}></i>
                                }
                            </div>
                            <div>
                              <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {user.name.length > 10 ? user.name.substring(0, 10) + "..." : user.name}
                              </div>
                              <small className={theme === "dark" ? "text-light" : "text-muted"} title={user.matricule || "Non spécifié"} >
                                {user.matricule ? (user.matricule.length > 10 ? user.matricule.substring(0, 10) + "..." : user.matricule) : 'Non spécifié'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <div>
                            <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <i data-feather="layers" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                              {user.classroom?.name? (user.classroom?.name?.length > 14 ? user.classroom?.name?.substring(0, 14) + "..." : user.classroom?.name ) : 'Non spécifié'}
                            </div>
                            {/* <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <i data-feather="book" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                              {user.classroom?.examen? (user.classroom?.examen?.length > 14 ? user.classroom.examen.substring(0, 14) + "..." : user.classroom?.examen ) : 'Non spécifié'}
                            </div> */}
                            <Dropdown className="mt-2">
                              <Dropdown.Toggle size="sm" variant="outline-primary" className="py-1 px-2">
                                <i data-feather="shuffle" style={{ width: "12px", height: "12px" }}></i>
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                              <div className="px-3 py-2 border-bottom">
                                <div className="fw-semibold">Select Classroom</div>
                              </div>
                              {
                                classrooms && classrooms.length > 0 ? (
                                classrooms.map(classroom => (
                                  <Dropdown.Item
                                    key={classroom.matricule}
                                    onClick={() => handleAssignClassroom(user.id, classroom.matricule)}
                                    className={user.matricule_classroom === classroom.matricule ? 'active' : ''}
                                  >
                                    {classroom.name}
                                  </Dropdown.Item>
                                ))
                              ) : (
                                <h6 className="small px-3">
                                  The list is empty
                                </h6>
                              )
                              } 
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <div>
                            <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <i data-feather="mail" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                              {user.email.length > 14 ? user.email.substring(0, 14) + "..." : user.email}
                            </div>
                            <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                              <i data-feather="phone" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                              {user.code_phone} {user.phone || "Non fourni"}
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-lg-table-cell text-center">
                          <Badge
                            bg={user.role === 1 ? "success" : "warning"}
                            className="px-3 py-2 cursor-pointer"
                            onClick={() => handleToggleRole(user.id)}
                            style={{ cursor: 'pointer' }}
                            title="Cliquer pour changer le rôle"
                          >
                            <i
                              data-feather={user.role === 1 ? "check-circle" : "pause-circle"}
                              className="me-1"
                              style={{ width: "12px", height: "12px" }}
                            ></i>
                            {user.role === 1 ? "Actif" : "Attente"}
                          </Badge>
                        </td>
                        <td className="d-none d-lg-table-cell text-center">
                          <Badge
                            bg={
                              user.status === "Connecté"
                                ? "success"
                                : user.status === "Déconnecté"
                                ? "secondary"
                                : "warning"
                            }
                            className="px-3 py-2"
                          >
                            <i
                              data-feather={
                                user.status === "Connecté"
                                  ? "check-circle"
                                  : user.status === "Déconnecté"
                                  ? "x-circle"
                                  : "clock"
                              }
                              className="me-1"
                              style={{ width: "12px", height: "12px" }}
                            ></i>
                            {user.status || "Indéfini"}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              size="sm"
                              variant="outline-info"
                              title="Voir les détails"
                              as={Link}
                              to={`/formateur/show/etudiant-espace-attente/${user.id}`}
                            >
                              <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-warning"
                              title="Modifier"
                              as={Link}
                              to={`/formateur/edit/etudiant-espace-attente/${user.id}`}
                            >
                              <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              title="Supprimer"
                              onClick={() => confirmDelete(user.id)}
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
                          <i data-feather="users" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                          <div>
                            <h6>Aucun Étudiant trouvé</h6>
                            <p className="small mb-0">Aucun étudiant ne correspond à vos critères de recherche.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Modale de changement de rôle en lot */}
        <Modal
          show={showRoleModal}
          onHide={() => setShowRoleModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Changer le Rôle des Étudiants</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleRoleGroupChange}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <p>Changer le rôle pour {checkedUsers.length} étudiant(s) sélectionné(s) :</p>
              <Form.Group className="mb-3">
                <Form.Label>Nouveau Rôle</Form.Label>
                <Form.Select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  required
                >
                  <option value="1">Étudiant Actif</option>
                  <option value="0">Étudiant en Zone d'Attente</option>
                </Form.Select>
                <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                  Les étudiants actifs peuvent accéder à toutes les fonctionnalités, 
                  ceux en zone d'attente ont un accès limité.
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button variant="secondary" onClick={() => setShowRoleModal(false)}>Annuler</Button>
              <Button type="submit" variant="warning">
                <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Appliquer les Changements
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modale d'assignation de classe en lot */}
        <Modal
          show={showClassroomModal}
          onHide={() => setShowClassroomModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Assigner une Classe</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleClassroomGroupAssign}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <p>Assigner une classe à {checkedUsers.length} étudiant(s) sélectionné(s) :</p>
              <Form.Group className="mb-3">
                <Form.Label>Sélectionner une Classe</Form.Label>
                <Form.Select
                  value={selectedClassroom}
                  onChange={e => setSelectedClassroom(e.target.value)}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  required
                >
                  <option value="">-- Choisir une classe --</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.matricule} value={classroom.matricule}>
                      {classroom.name} {classroom.examen && `(${classroom.examen})`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button variant="secondary" onClick={() => setShowClassroomModal(false)}>Annuler</Button>
              <Button type="submit" variant="info">
                <i data-feather="layers" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Assigner la Classe
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modale d'ajout */}
        <Modal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Ajouter un Étudiant</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nom Complet</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Entrez le nom complet"
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
                    <Form.Label>Adresse Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Entrez l'adresse email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      isInvalid={!!errors.email}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                        <i data-feather="book" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Niveau d'étude *
                    </Form.Label>
                    <Form.Select
                        name="matricule_classroom"
                        value={form.matricule_classroom}
                        onChange={e => setForm({ ...form, matricule_classroom: e.target.value })}
                        isInvalid={!!errors.matricule_classroom}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                    >
                        <option value="">Sélectionnez...</option>
                        {classrooms.map(classroom => (
                        <option key={classroom.matricule} value={classroom.matricule}>
                            {classroom.name}
                        </option>
                        ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid" className="d-block">{errors.matricule_classroom}</Form.Control.Feedback>
                </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Mot de Passe</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Entrez le mot de passe"
                      required
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      isInvalid={!!errors.password}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Confirmer le Mot de Passe</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirmez le mot de passe"
                      required
                      onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                      isInvalid={!!errors.password_confirmation}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
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

        {/* Modale d'invitation */}
        <Modal
          show={showInviteModal}
          onHide={() => setShowInviteModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Inviter un Étudiant</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleInvite}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Form.Group className="mb-3">
                <Form.Label>Adresse Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Entrez l'email de l'invité"
                  name="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  isInvalid={!!errors.email}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Fermer</Button>
              <Button type="submit" variant="primary">
                <i data-feather="send" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Envoyer
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modale de confirmation */}
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
            <p>Êtes-vous sûr de vouloir supprimer {userToDelete ? "cet utilisateur" : "ces utilisateurs"} ?</p>
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