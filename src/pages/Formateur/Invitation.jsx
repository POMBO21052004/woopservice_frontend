import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Table, Button, Form, Modal, Row, Col, Badge, Card, Toast, ToastContainer,
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";

export default function InvitationByFormateur() {
  // États
  const [invitations, setInvitations] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkedInvitations, setCheckedInvitations] = useState([]);

  // Filtres
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState(null);
  const [errors, setErrors] = useState({});

  // Formulaire d'invitation
  const [form, setForm] = useState({
    email: "",
    role: "",
    matricule_classroom: "",
  });

  // État thème
  const [theme, setTheme] = useState("light");

  // États toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Rôles disponibles
  const roles = {
    0: "Espace Attente",
    1: "Étudiant",
    2: "Formateur",
  };

  // Fonction de gestion des toasts
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Détecte thème au chargement et sur changement DOM
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

  // Fonction fetch invitations avec filtres
  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (classroomFilter) params.matricule_classroom = classroomFilter;
      if (statusFilter !== "") params.status = statusFilter;

      const res = await api.get("/formateur/view/invitations", { params });
      setInvitations(res.data.invitations || []);
      setClassrooms(res.data.classroom || []);
      setStats(res.data.stats || {});
    } catch (err) {
      console.error("Erreur lors du chargement des invitations", err);
      showToastMessage("Échec du chargement des invitations.", 'danger');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, classroomFilter, statusFilter]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  useEffect(() => {
    feather.replace();
  }, [invitations, showAddModal, showDeleteModal, loading, checkedInvitations]);

  // Envoi invitation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const res = await api.post("/formateur/invitation/users", form);
      fetchInvitations();
      setShowAddModal(false);
      setForm({
        email: "",
        role: "",
        matricule_classroom: "",
      });
      showToastMessage(res.data.message || "Invitation envoyée avec succès", 'success');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error(err);
        showToastMessage("Erreur lors de l'envoi de l'invitation.", 'danger');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Suppression simple ou en lot
  const confirmDelete = (invitationId = null) => {
    setInvitationToDelete(invitationId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    setSubmitting(true);
    try {
      const idsToDelete = invitationToDelete ? [invitationToDelete] : checkedInvitations;
      
      if (invitationToDelete) {
        // Suppression d'une invitation unique
        await api.delete(`/formateur/destroy/invitations/${invitationToDelete}`);
      } else {
        // Suppression en lot
        await api.post(`/formateur/invitations/destroy-group`, { ids: idsToDelete });
      }
      
      fetchInvitations();
      setShowDeleteModal(false);
      setCheckedInvitations([]);
      setInvitationToDelete(null);
      showToastMessage("Invitation(s) supprimée(s) avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la suppression de l'invitation.", 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Gérer les cases à cocher pour la suppression en lot
  const handleCheck = (event) => {
    const { value, checked } = event.target;
    const invitationId = parseInt(value);
    
    if (checked) {
      setCheckedInvitations(prev => [...prev, invitationId]);
    } else {
      setCheckedInvitations(prev => prev.filter(item => item !== invitationId));
    }
  };

  // Gérer la sélection globale
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setCheckedInvitations(invitations.map(invitation => invitation.id));
    } else {
      setCheckedInvitations([]);
    }
  };

  // Fonction pour obtenir le badge du rôle
  const getRoleBadge = (role) => {
    const roleConfig = {
      0: { variant: "warning", icon: "clock", label: "Espace Attente" },
      1: { variant: "success", icon: "user", label: "Étudiant" },
      2: { variant: "info", icon: "users", label: "Formateur" },
    };
    return roleConfig[role] || { variant: "secondary", icon: "user", label: "Inconnu" };
  };

  // Vérifier si le rôle peut être assigné à une classe
  const canHaveClassroom = (role) => {
    return role === 0 || role === 1; // Seulement Espace Attente et Étudiant
  };

  // Props communes pour les Modals et Form Controls pour la gestion du thème
  const commonModalProps = {
    centered: true,
    contentClassName: theme === "dark" ? "bg-dark text-light" : "",
  };

  const commonModalHeaderProps = {
    className: theme === "dark" ? "bg-dark text-light border-secondary" : "",
    closeButton: true,
  };

  const commonFormControlProps = {
    className: theme === "dark" ? "bg-dark text-light border-secondary" : "",
  };

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête avec titre et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="mail" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Invitations
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Institut de Formation - Système d'invitations pour l'enseignement
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
                        {stats.total || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Invitations
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="mail" style={{ width: "24px", height: "24px" }}></i>
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
                        {stats.etudiant || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Étudiants
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="user" style={{ width: "24px", height: "24px" }}></i>
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
                        {stats.formateur || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Formateurs
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="users" style={{ width: "24px", height: "24px" }}></i>
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
                        {stats.admin_systeme || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Administrateur systeme
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="shield" style={{ width: "24px", height: "24px" }}></i>
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
                <i data-feather="send" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Invitations Système
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                {checkedInvitations.length > 0 && (
                  <Button variant="danger" className="d-flex align-items-center" onClick={() => confirmDelete()}>
                    <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Supprimer ({checkedInvitations.length})
                  </Button>
                )}
                <Button variant="success" className="d-flex align-items-center" onClick={() => setShowAddModal(true)}>
                  <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Nouvelle Invitation
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <div className="row g-3">
                <Col md={4}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche par email
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Email ou nom de classe..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchInvitations()}
                    {...commonFormControlProps}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="user-check" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Rôle
                  </Form.Label>
                  <Form.Select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    {...commonFormControlProps}
                  >
                    <option value="">Tous les rôles</option>
                    {Object.entries(roles).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="layers" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Classe
                  </Form.Label>
                  <Form.Select
                    value={classroomFilter}
                    onChange={e => setClassroomFilter(e.target.value)}
                    {...commonFormControlProps}
                  >
                    <option value="">Toutes les classes</option>
                    {classrooms.map(classroom => (
                      <option key={classroom.id} value={classroom.matricule}>{classroom.name}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="info" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut
                  </Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    {...commonFormControlProps}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="Acceptée">Acceptée</option>
                    <option value="En attente">En attente</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="small opacity-0">Action</Form.Label>
                  <div>
                    <Button
                      variant={theme === "dark" ? "outline-light" : "outline-primary"}
                      className="w-100"
                      onClick={fetchInvitations}
                    >
                      <i data-feather="search" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Filtrer
                    </Button>
                  </div>
                </Col>
              </div>
            </div>

            {/* Affichage du message de chargement */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2 text-muted">Chargement des invitations...</p>
              </div>
            ) : (
              /* Tableau des données */
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
                          checked={checkedInvitations.length === invitations.length && invitations.length > 0}
                        />
                      </th>
                      <th>
                        <i data-feather="mail" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Email
                      </th>
                      <th className="d-none d-md-table-cell">
                        <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Rôle
                      </th>
                      <th className="d-none d-md-table-cell">
                        <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Statut
                      </th>
                      <th className="d-none d-lg-table-cell">
                        <i data-feather="layers" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Classe
                      </th>
                      <th className="d-none d-lg-table-cell text-center">
                        <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Date d'envoi
                      </th>
                      <th className="text-center">
                        <i data-feather="settings" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.length ? (
                      invitations.map((invitation, index) => {
                        const roleConfig = getRoleBadge(invitation.role);
                        const isAccepted = invitation.status !== null;
                        return (
                          <tr key={invitation.id} className={theme === "dark" ? "border-secondary" : ""}>
                            <td className="text-center">
                              <Form.Check
                                type="checkbox"
                                value={invitation.id}
                                checked={checkedInvitations.includes(invitation.id)}
                                onChange={handleCheck}
                              />
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                  <i data-feather="mail" className="text-primary" style={{ width: "16px", height: "16px" }}></i>
                                </div>
                                <div>
                                  <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {invitation.email.length > 20 ? invitation.email.substring(0, 20) + "..." : invitation.email}
                                  </div>
                                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                    {invitation.matricule}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td className="d-none d-md-table-cell">
                              <Badge
                                bg={roleConfig.variant}
                                className="px-3 py-2"
                              >
                                <i
                                  data-feather={roleConfig.icon}
                                  className="me-1"
                                  style={{ width: "12px", height: "12px" }}
                                ></i>
                                {roleConfig.label}
                              </Badge>
                            </td>
                            <td className="d-none d-md-table-cell">
                              {isAccepted ? (
                                <Badge bg="success" className="px-3 py-2">
                                  <i data-feather="check-circle" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                  Acceptée
                                </Badge>
                              ) : (
                                <Badge bg="secondary" className="px-3 py-2">
                                  <i data-feather="clock" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                  En attente
                                </Badge>
                              )}
                            </td>
                            <td className="d-none d-lg-table-cell">
                              <div className="d-flex align-items-center">
                                <div className="bg-info bg-opacity-10 rounded-circle p-1 me-2">
                                  <i data-feather="layers" className="text-info" style={{ width: "14px", height: "14px" }}></i>
                                </div>
                                <span className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {invitation.classroom?.name || "Non assignée"}
                                </span>
                              </div>
                            </td>
                            <td className="d-none d-lg-table-cell text-center">
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                              </small>
                            </td>
                            <td className="text-center">
                              <div className="d-flex gap-1 justify-content-center">
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  title="Supprimer"
                                  onClick={() => confirmDelete(invitation.id)}
                                  disabled={submitting}
                                >
                                  <i data-feather="trash-2" style={{ width: "14px", height: "14px" }}></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                            <i data-feather="mail" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                            <div>
                              <h6>Aucune invitation trouvée</h6>
                              <p className="small mb-0">Aucune invitation ne correspond à vos critères de recherche.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Modal Ajout */}
        <Modal
          {...commonModalProps}
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          size="lg"
        >
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>
              <i data-feather="mail" className="me-2" style={{ width: "20px", height: "20px" }}></i>
              Envoyer une invitation
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={commonModalProps.contentClassName}>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>
                      <i data-feather="mail" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Adresse email *
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Entrez l'adresse email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      isInvalid={!!errors.email}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      <i data-feather="user-check" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Rôle *
                    </Form.Label>
                    <Form.Select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value, matricule_classroom: "" })}
                      isInvalid={!!errors.role}
                      {...commonFormControlProps}
                      required
                    >
                      <option value="">Choisir un rôle</option>
                      {Object.entries(roles).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.role}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      <i data-feather="layers" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Classe {canHaveClassroom(parseInt(form.role)) ? "(Optionnelle)" : "(Non applicable)"}
                    </Form.Label>
                    <Form.Select
                      value={form.matricule_classroom}
                      onChange={e => setForm({ ...form, matricule_classroom: e.target.value })}
                      isInvalid={!!errors.matricule_classroom}
                      {...commonFormControlProps}
                      disabled={!canHaveClassroom(parseInt(form.role))}
                    >
                      <option value="">
                        {canHaveClassroom(parseInt(form.role)) ? "Aucune classe" : "Non applicable"}
                      </option>
                      {canHaveClassroom(parseInt(form.role)) && classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.matricule}>
                          {classroom.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.matricule_classroom}</Form.Control.Feedback>
                    {canHaveClassroom(parseInt(form.role)) && (
                      <Form.Text className="text-muted">
                        Seuls les étudiants et personnes en espace d'attente peuvent être assignés à une classe.
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className={commonModalHeaderProps.className}>
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                <i data-feather="send" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                {submitting ? "Envoi..." : "Envoyer l'invitation"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal Confirmation Suppression */}
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
            <p>Êtes-vous sûr de vouloir supprimer {invitationToDelete ? "cet invitation" : "ces invitations"} ?</p>
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

        {/* Toast pour les notifications */}
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