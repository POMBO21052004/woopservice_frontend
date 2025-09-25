import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Table, Button, Form, Modal, Row, Col, Badge, Card, Pagination, Toast, ToastContainer
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";

export default function Help() {
  // États
  const [helps, setHelps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtres
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [helpToDelete, setHelpToDelete] = useState(null);
  const [selectedHelp, setSelectedHelp] = useState(null);
  const [errors, setErrors] = useState({});

  // États toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Fonctions de gestion des modals
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Formulaire d'ajout/édition
  const [form, setForm] = useState({
    titre: "",
    description: "",
    role: "",
    statut: "0",
    image: null
  });

  // État thème
  const [theme, setTheme] = useState("light");

  // Définition des rôles et statuts
  const roles = {
    "0": { label: "Zone Attente Etudiant", color: "primary", icon: "user" },
    "1": { label: "Etudiat", color: "success", icon: "user-check" },
    "2": { label: "Formateur", color: "warning", icon: "shield" },
    "3": { label: "Admin Système", color: "danger", icon: "settings" }
  };

  const statuts = {
    "0": { label: "Publiée", color: "success", icon: "check-circle" },
    "1": { label: "Non publiée", color: "secondary", icon: "x-circle" }
  };

  const category = {
    "Profil": { label: "Profil", color: "success", icon: "check-circle" },
    "Authentification": { label: "Authentification", color: "secondary", icon: "x-circle" },
    "Salle": { label: "Salle", color: "secondary", icon: "x-circle" },
    "Matiere": { label: "Matiere", color: "secondary", icon: "x-circle" },
    "Documents": { label: "Documents", color: "secondary", icon: "x-circle" },
    "Evaluation": { label: "Evaluation", color: "secondary", icon: "x-circle" },
    "Authentification": { label: "Authentification", color: "secondary", icon: "x-circle" }
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

  // Fonction fetch aides avec filtres et pagination
  const fetchHelps = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statutFilter) params.statut = statutFilter;
      if (createdAtFilter) params.created_at = createdAtFilter;

      const res = await api.get("/admin-systeme/view/aide", { params });
      setHelps(res.data.data.data || []);
      setCurrentPage(res.data.data.current_page || 1);
      setTotalPages(res.data.data.last_page || 1);
    } catch (err) {
      console.error("Erreur lors du chargement des aides", err);
      showToastMessage("Erreur lors du chargement des aides.", 'danger');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statutFilter, createdAtFilter]);

  useEffect(() => {
    fetchHelps(currentPage);
  }, [fetchHelps, currentPage]);

  useEffect(() => {
    feather.replace();
  }, [helps, showAddModal, showEditModal, showViewModal, showDeleteModal, loading]);

  // Reset form
  const resetForm = () => {
    setForm({
      titre: "",
      description: "",
      category: "",
      role: "",
      statut: "0",
      image: null
    });
    setErrors({});
    setSelectedHelp(null);
  };

  // Gestionnaire de changement pour les formulaires
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Ajout d'une aide
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('titre', form.titre);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('role', form.role);
      formData.append('statut', form.statut);
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post("/admin-systeme/store/aides", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      fetchHelps(currentPage);
      setShowAddModal(false);
      resetForm();
      showToastMessage("Aide ajoutée avec succès !", 'success');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error("Erreur lors de l'ajout de l'aide:", err);
      }
      showToastMessage("Erreur lors de l'ajout de l'aide.", 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Édition d'une aide
  const handleEdit = (help) => {
    setSelectedHelp(help);
    setForm({
      titre: help.titre,
      description: help.description,
      category: help.category,
      role: help.role.toString(),
      statut: help.statut.toString(),
      image: null
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('titre', form.titre);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('role', form.role);
      formData.append('statut', form.statut);
      formData.append('_method', 'PUT');
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post(`/admin-systeme/update/aide/${selectedHelp.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      fetchHelps(currentPage);
      setShowEditModal(false);
      resetForm();
      showToastMessage("Aide mise à jour avec succès !", 'success');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        console.error("Erreur lors de la mise à jour de l'aide:", err);
      }
      showToastMessage("Erreur lors de la mise à jour de l'aide.", 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Visualisation d'une aide
  const handleView = async (helpId) => {
    try {
      const res = await api.get(`/admin-systeme/show/aide/${helpId}`);
      setSelectedHelp(res.data.data);
      setShowViewModal(true);
    } catch (err) {
      console.error("Erreur lors du chargement de l'aide:", err);
      showToastMessage("Erreur lors du chargement de l'aide.", 'danger');
    }
  };

  // Suppression
  const confirmDelete = (helpId) => {
    setHelpToDelete(helpId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/admin-systeme/destroy/aide/${helpToDelete}`);
      fetchHelps(currentPage);
      setShowDeleteModal(false);
      showToastMessage("Aide supprimée avec succès !", 'success');
    } catch (err) {
      console.error("Erreur lors de la suppression de l'aide:", err);
      showToastMessage("Erreur lors de la suppression de l'aide.", 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Formatage de date
  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Props communes pour les modals
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
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête avec titre et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="help-circle" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion du support Techniques
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Institut de Formation -  Administration des articles d'aide pour tous les utilisateurs de la plateforme.
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
                        {helps.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Aides
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="help-circle" style={{ width: "24px", height: "24px" }}></i>
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
                        {helps.filter(help => help.statut == 0).length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Publiées
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
                      <h3 className="mb-0 text-secondary">
                        {helps.filter(help => help.statut == 1).length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Non publiées
                      </small>
                    </div>
                    <div className="text-secondary">
                      <i data-feather="x-circle" style={{ width: "24px", height: "24px" }}></i>
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
                        {Object.keys(roles).length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Types d'utilisateurs
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
                <i data-feather="list" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Liste des Articles d'Aide
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                <Button variant="success" className="d-flex align-items-center" onClick={() => setShowAddModal(true)}>
                  <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Nouvelle Aide
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
                    Recherche globale
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Titre, contenu..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchHelps(1)}
                    {...commonFormControlProps}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="users" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Rôle
                  </Form.Label>
                  <Form.Select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    {...commonFormControlProps}
                  >
                    <option value="">Tous les rôles</option>
                    {Object.entries(roles).map(([key, role]) => (
                      <option key={key} value={key}>{role.label}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="eye" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut
                  </Form.Label>
                  <Form.Select
                    value={statutFilter}
                    onChange={e => setStatutFilter(e.target.value)}
                    {...commonFormControlProps}
                  >
                    <option value="">Tous les statuts</option>
                    {Object.entries(statuts).map(([key, statut]) => (
                      <option key={key} value={key}>{statut.label}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={createdAtFilter}
                    onChange={e => setCreatedAtFilter(e.target.value)}
                    {...commonFormControlProps}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small opacity-0">Action</Form.Label>
                  <div>
                    <Button
                      variant={theme === "dark" ? "outline-light" : "outline-primary"}
                      className="w-100"
                      onClick={() => fetchHelps(1)}
                    >
                      <i data-feather="search" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                      Filtrer
                    </Button>
                  </div>
                </Col>
              </div>
            </div>

            {/* Affichage du contenu */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2 text-muted">Chargement des aides...</p>
              </div>
            ) : (
              <>
                {/* Affichage en cartes pour un style moderne */}
                <Row className="g-4 mb-4">
                  {helps.length > 0 ? (
                    helps.map((help) => (
                      <Col key={help.id} lg={6} xl={4}>
                        <Card className={`h-100 shadow-sm border-0 ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-white"}`}>
                          {help.image && (
                            <Card.Img
                              variant="top"
                              src={help.image_url}
                              alt={help.titre}
                              style={{ height: "200px", objectFit: "cover" }}
                            />
                          )}
                          <Card.Body className="d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <Badge bg={roles[help.role]?.color || "secondary"} className="px-2 py-1">
                                <i data-feather={roles[help.role]?.icon || "user"} className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {roles[help.role]?.label || "Inconnu"}
                              </Badge>
                              <Badge bg={statuts[help.statut]?.color || "secondary"} className="px-2 py-1">
                                <i data-feather={statuts[help.statut]?.icon || "circle"} className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {statuts[help.statut]?.label || "Inconnu"}
                              </Badge>
                            </div>
                            <Card.Title className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {help.titre}
                            </Card.Title>
                            {help.category && (
                            <Card.Title className={` ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <i data-feather="layers" className="me-1" style={{ width: "16px", height: "16px" }}></i> {help.category}
                            </Card.Title>
                            )}
                            <Card.Text className={`small text-muted flex-grow-1 ${theme === "dark" ? "text-light" : ""}`}>
                              {help.description.length > 100
                                ? `${help.description.substring(0, 100)}...`
                                : help.description}
                            </Card.Text>
                            <div className="d-flex justify-content-between align-items-center mt-auto">
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                <i data-feather="calendar" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {formatDate(help.created_at)}
                              </small>
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  title="Voir"
                                  onClick={() => handleView(help.id)}
                                >
                                  <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-warning"
                                  title="Modifier"
                                  onClick={() => handleEdit(help)}
                                >
                                  <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  title="Supprimer"
                                  onClick={() => confirmDelete(help.id)}
                                >
                                  <i data-feather="trash-2" style={{ width: "14px", height: "14px" }}></i>
                                </Button>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col xs={12}>
                      <div className="text-center py-5">
                        <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                          <i data-feather="help-circle" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                          <div>
                            <h6>Aucune aide trouvée</h6>
                            <p className="small mb-0">Aucune aide ne correspond à vos critères de recherche.</p>
                          </div>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center">
                    <Pagination>
                      <Pagination.First
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      />
                      <Pagination.Prev
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      />

                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (page === currentPage ||
                            (page >= currentPage - 2 && page <= currentPage + 2) ||
                            page === 1 || page === totalPages) {
                          return (
                            <Pagination.Item
                              key={page}
                              active={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        } else if (page === currentPage - 3 || page === currentPage + 3) {
                          return <Pagination.Ellipsis key={page} />;
                        }
                        return null;
                      })}

                      <Pagination.Next
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      />
                      <Pagination.Last
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>

        {/* Modal Ajout */}
        <Modal {...commonModalProps} show={showAddModal} onHide={() => {setShowAddModal(false); resetForm();}} size="lg">
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>
              <i data-feather="plus" className="me-2" style={{ width: "20px", height: "20px" }}></i>
              Ajouter une nouvelle aide
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={commonModalProps.contentClassName}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Titre de l'aide *</Form.Label>
                    <Form.Control
                      type="text"
                      name="titre"
                      placeholder="Entrez le titre de l'aide"
                      required
                      value={form.titre}
                      onChange={handleFormChange}
                      isInvalid={!!errors.titre}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.titre}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Type d'utilisateur *</Form.Label>
                    <Form.Select
                      name="role"
                      required
                      value={form.role}
                      onChange={handleFormChange}
                      isInvalid={!!errors.role}
                      {...commonFormControlProps}
                    >
                      <option value="">Sélectionnez un type</option>
                      {Object.entries(roles).map(([key, role]) => (
                        <option key={key} value={key}>{role.label}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.role}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Categorie</Form.Label>
                    <Form.Select
                      name="category"
                      required
                      value={form.category}
                      onChange={handleFormChange}
                      isInvalid={!!errors.category}
                      {...commonFormControlProps}
                    >
                      <option value="">Sélectionnez un type</option>
                      {Object.entries(category).map(([key, category]) => (
                        <option key={key} value={key}>{category.label}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Statut de publication</Form.Label>
                    <Form.Select
                      name="statut"
                      value={form.statut}
                      onChange={handleFormChange}
                      isInvalid={!!errors.statut}
                      {...commonFormControlProps}
                    >
                      {Object.entries(statuts).map(([key, statut]) => (
                        <option key={key} value={key}>{statut.label}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.statut}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Image d'illustration (Optionnel)</Form.Label>
                    <Form.Control
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleFormChange}
                      isInvalid={!!errors.image}
                      {...commonFormControlProps}
                    />
                    <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                      Formats acceptés: JPG, JPEG, PNG, WEBP (Max: 2MB)
                    </Form.Text>
                    <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Contenu de l'aide *</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      rows={6}
                      placeholder="Décrivez en détail le contenu de l'aide..."
                      required
                      value={form.description}
                      onChange={handleFormChange}
                      isInvalid={!!errors.description}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className={commonModalHeaderProps.className}>
              <Button variant="secondary" onClick={() => {setShowAddModal(false); resetForm();}}>
                Annuler
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                <i data-feather="save" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal Édition */}
        <Modal {...commonModalProps} show={showEditModal} onHide={() => {setShowEditModal(false); resetForm();}} size="lg">
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>
              <i data-feather="edit" className="me-2" style={{ width: "20px", height: "20px" }}></i>
              Modifier l'aide
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleUpdate}>
            <Modal.Body className={commonModalProps.contentClassName}>
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Titre de l'aide *</Form.Label>
                    <Form.Control
                      type="text"
                      name="titre"
                      placeholder="Entrez le titre de l'aide"
                      required
                      value={form.titre}
                      onChange={handleFormChange}
                      isInvalid={!!errors.titre}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.titre}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Type d'utilisateur *</Form.Label>
                    <Form.Select
                      name="role"
                      required
                      value={form.role}
                      onChange={handleFormChange}
                      isInvalid={!!errors.role}
                      {...commonFormControlProps}
                    >
                      <option value="">Sélectionnez un type</option>
                      {Object.entries(roles).map(([key, role]) => (
                        <option key={key} value={key}>{role.label}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.role}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Categorie</Form.Label>
                    <Form.Select
                      name="category"
                      required
                      value={form.category}
                      onChange={handleFormChange}
                      isInvalid={!!errors.category}
                      {...commonFormControlProps}
                    >
                      <option value="">Sélectionnez un type</option>
                      {Object.entries(category).map(([key, category]) => (
                        <option key={key} value={key}>{category.label}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Statut de publication</Form.Label>
                    <Form.Select
                      name="statut"
                      value={form.statut}
                      onChange={handleFormChange}
                      isInvalid={!!errors.statut}
                      {...commonFormControlProps}
                    >
                      {Object.entries(statuts).map(([key, statut]) => (
                        <option key={key} value={key}>{statut.label}</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.statut}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Image d'illustration</Form.Label>
                    {selectedHelp?.image && (
                      <div className="mb-2">
                        <img
                          src={selectedHelp.image_url}
                          alt="Image actuelle"
                          className="img-thumbnail"
                          style={{ maxHeight: "100px" }}
                        />
                        <small className={`d-block ${theme === "dark" ? "text-light" : "text-muted"}`}>
                          Image actuelle
                        </small>
                      </div>
                    )}
                    <Form.Control
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleFormChange}
                      isInvalid={!!errors.image}
                      {...commonFormControlProps}
                    />
                    <Form.Text className={theme === "dark" ? "text-light" : "text-muted"}>
                      Laissez vide pour conserver l'image actuelle. Formats acceptés: JPG, JPEG, PNG, WEBP (Max: 2MB)
                    </Form.Text>
                    <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Contenu de l'aide *</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      rows={6}
                      placeholder="Décrivez en détail le contenu de l'aide..."
                      required
                      value={form.description}
                      onChange={handleFormChange}
                      isInvalid={!!errors.description}
                      {...commonFormControlProps}
                    />
                    <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className={commonModalHeaderProps.className}>
              <Button variant="secondary" onClick={() => {setShowEditModal(false); resetForm();}}>
                Annuler
              </Button>
              <Button type="submit" variant="warning" disabled={submitting}>
                <i data-feather="save" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                {submitting ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modal Visualisation */}
        <Modal {...commonModalProps} show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>
              <i data-feather="eye" className="me-2" style={{ width: "20px", height: "20px" }}></i>
              Détails de l'aide
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={commonModalProps.contentClassName}>
            {selectedHelp && (
              <div>
                {/* En-tête avec badges */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <Badge bg={roles[selectedHelp.role]?.color || "secondary"} className="px-3 py-2 me-2">
                      <i data-feather={roles[selectedHelp.role]?.icon || "user"} className="me-1" style={{ width: "14px", height: "14px" }}></i>
                      {roles[selectedHelp.role]?.label || "Inconnu"}
                    </Badge>
                    <Badge bg={statuts[selectedHelp.statut]?.color || "secondary"} className="px-3 py-2">
                      <i data-feather={statuts[selectedHelp.statut]?.icon || "circle"} className="me-1" style={{ width: "14px", height: "14px" }}></i>
                      {statuts[selectedHelp.statut]?.label || "Inconnu"}
                    </Badge>
                  </div>
                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                    <i data-feather="calendar" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                    Créée le {formatDate(selectedHelp.created_at)}
                  </small>
                </div>

                {/* Titre */}
                <h4 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  {selectedHelp.titre}
                </h4>

                {/* Image si présente */}
                {selectedHelp.image && (
                  <div className="mb-4 text-center">
                    <img
                      src={selectedHelp.image_url}
                      alt={selectedHelp.titre}
                      className="img-fluid rounded shadow"
                      style={{ maxHeight: "300px" }}
                    />
                  </div>
                )}

                {/* Contenu */}
                <div className={`border-top pt-3 ${theme === "dark" ? "border-secondary" : ""}`}>
                  <h6 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Contenu de l'aide
                  </h6>
                  <div className={`${theme === "dark" ? "text-light" : "text-dark"}`} style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                    {selectedHelp.description}
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className={`mt-4 pt-3 border-top ${theme === "dark" ? "border-secondary" : ""}`}>
                  <Row>
                    <Col md={6}>
                      <small className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="hash" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                        Matricule: {selectedHelp.matricule}
                      </small>
                    </Col>
                    <Col md={6}>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        <i data-feather="clock" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                        Modifiée le {formatDate(selectedHelp.updated_at)}
                      </small>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={commonModalHeaderProps.className}>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
              Fermer
            </Button>
            {selectedHelp && (
              <>
                <Button
                  variant="warning"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(selectedHelp);
                  }}
                >
                  <i data-feather="edit" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                  Modifier
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowViewModal(false);
                    confirmDelete(selectedHelp.id);
                  }}
                >
                  <i data-feather="trash-2" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                  Supprimer
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>

        {/* Modal Confirmation Suppression */}
        <Modal {...commonModalProps} show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>
              <i data-feather="alert-triangle" className="me-2 text-danger" style={{ width: "20px", height: "20px" }}></i>
              Confirmation de suppression
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={commonModalProps.contentClassName}>
            <div className="text-center">
              <i data-feather="trash-2" className="text-danger mb-3" style={{ width: "48px", height: "48px" }}></i>
              <p className={theme === "dark" ? "text-light" : "text-dark"}>
                Êtes-vous sûr de vouloir supprimer cette aide ?
              </p>
              <p className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Cette action est irréversible et supprimera définitivement l'article d'aide.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className={commonModalHeaderProps.className}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirmed} disabled={submitting}>
              <i data-feather="trash-2" className="me-1" style={{ width: "16px", height: "16px" }}></i>
              {submitting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Toast pour les notifications */}
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
    </AdminSystemeLayout>
  );
}