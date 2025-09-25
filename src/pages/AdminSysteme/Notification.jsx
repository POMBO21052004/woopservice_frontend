import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Table, Button, Form, Modal, Row, Col, Badge, Card, Toast, ToastContainer,
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";

export default function AdminSystemeNotifications() {
  // États
  const [notifications, setNotifications] = useState([]);
  const [checkedNotifications, setCheckedNotifications] = useState([]);
  const [auteurs, setAuteurs] = useState([]);
  const [typesEntites, setTypesEntites] = useState([]);
  const [statistics, setStatistics] = useState({
    total_notifications: 0,
    total_auteurs: 0,
    notifications_lues: 0,
    notifications_non_lues: 0,
    priorite_high: 0,
    priorite_medium: 0,
    priorite_low: 0,
    priorite_critical: 0,
    stats_actions: {}
  });

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [typeEntiteFilter, setTypeEntiteFilter] = useState("");
  const [typeActionFilter, setTypeActionFilter] = useState("");
  const [prioriteFilter, setPrioriteFilter] = useState("");
  const [statutLectureFilter, setStatutLectureFilter] = useState("");
  const [matriculeAuteurFilter, setMatriculeAuteurFilter] = useState("");

  // Modales
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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

  // Récupérer les notifications avec filtres
  const fetchNotifications = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (typeEntiteFilter) params.type_entite = typeEntiteFilter;
      if (typeActionFilter) params.type_action = typeActionFilter;
      if (prioriteFilter) params.priorite = prioriteFilter;
      if (statutLectureFilter) params.statut_lecture = statutLectureFilter;
      if (matriculeAuteurFilter) params.matricule_auteur = matriculeAuteurFilter;

      const res = await api.get("/admin-systeme/view/notifications", { params });
      setNotifications(res.data.notifications || []);
      setStatistics(res.data.statistics || {});
      setAuteurs(res.data.auteurs || []);
      setTypesEntites(res.data.types_entites || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications", err);
      showToastMessage("Erreur lors de la récupération des notifications", 'danger');
    }
  }, [search, createdAtFilter, typeEntiteFilter, typeActionFilter, prioriteFilter, statutLectureFilter, matriculeAuteurFilter]);

  useEffect(() => {
    feather.replace();
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    feather.replace();
  }, [notifications, checkedNotifications]);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/admin-systeme/notifications/${notificationId}/mark-as-read`);
      fetchNotifications();
      showToastMessage("Notification marquée comme lue", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du marquage", 'danger');
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const res = await api.put("/admin-systeme/notifications/mark-all-as-read");
      fetchNotifications();
      setShowMarkAllModal(false);
      showToastMessage(res.data.message, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du marquage", 'danger');
    }
  };

  // Gérer la suppression simple ou en lot
  const confirmDelete = (notificationId = null) => {
    setNotificationToDelete(notificationId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const idsToDelete = notificationToDelete ? [notificationToDelete] : checkedNotifications;
      
      if (notificationToDelete) {
        await api.delete(`/admin-systeme/destroy/notifications/${notificationToDelete}`);
      } else {
        await api.post(`/admin-systeme/notifications/destroy-group`, { ids: idsToDelete });
      }
      
      fetchNotifications();
      setShowDeleteModal(false);
      setCheckedNotifications([]);
      setNotificationToDelete(null);
      showToastMessage("Notification(s) supprimée(s) avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la suppression", 'danger');
    }
  };

  // Gérer les cases à cocher pour la suppression en lot
  const handleCheck = (event) => {
    const { value, checked } = event.target;
    const notificationId = parseInt(value);
    
    if (checked) {
      setCheckedNotifications(prev => [...prev, notificationId]);
    } else {
      setCheckedNotifications(prev => prev.filter(item => item !== notificationId));
    }
  };

  // Gérer la sélection globale
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setCheckedNotifications(notifications.map(notification => notification.id));
    } else {
      setCheckedNotifications([]);
    }
  };

  // Ouvrir modal de détails
  const openDetailsModal = (notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir la configuration du badge de priorité
  const getPrioriteBadge = (priorite) => {
    const prioriteConfig = {
      'critical': { variant: "danger", icon: "alert-triangle", label: "Critique" },
      'high': { variant: "warning", icon: "alert-circle", label: "Haute" },
      'medium': { variant: "info", icon: "info", label: "Moyenne" },
      'low': { variant: "secondary", icon: "minus-circle", label: "Basse" }
    };
    return prioriteConfig[priorite] || { variant: "secondary", icon: "help-circle", label: "Inconnue" };
  };

  // Types d'actions disponibles (déduits du controller)
  const typesActions = Object.keys(statistics.stats_actions || {});

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="bell" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Notifications
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Institut de Formation - Système de notifications
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
                        {statistics.total_notifications}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Notifications
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="bell" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.total_auteurs}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Auteurs Uniques
                      </small>
                    </div>
                    <div className="text-primary">
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
                      <h3 className="mb-0 text-success">
                        {statistics.notifications_lues}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Notifications Lues
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
                      <h3 className="mb-0 text-danger">
                        {statistics.notifications_non_lues}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Non Lues
                      </small>
                    </div>
                    <div className="text-danger">
                      <i data-feather="alert-triangle" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Cartes de statistiques par priorité */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-danger">
                        {statistics.priorite_critical}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Critique
                      </small>
                    </div>
                    <div className="text-danger">
                      <i data-feather="alert-triangle" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.priorite_high}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Haute
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="alert-circle" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.priorite_medium}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Moyenne
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="info" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.priorite_low}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Basse
                      </small>
                    </div>
                    <div className="text-secondary">
                      <i data-feather="minus-circle" style={{ width: "24px", height: "24px" }}></i>
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
                <i data-feather="bell" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Notifications Système
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                {checkedNotifications.length > 0 && (
                  <Button variant="danger" className="d-flex align-items-center" onClick={() => confirmDelete()}>
                    <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Supprimer ({checkedNotifications.length})
                  </Button>
                )}
                <Button 
                  variant="success" 
                  className="d-flex align-items-center" 
                  onClick={() => setShowMarkAllModal(true)}
                  disabled={statistics.notifications_non_lues === 0}
                >
                  <i data-feather="check-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Tout Marquer Lu
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
                    Recherche Générale
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Matricule, action, type..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="user" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Auteur
                  </Form.Label>
                  <Form.Select
                    value={matriculeAuteurFilter}
                    onChange={e => setMatriculeAuteurFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les auteurs</option>
                    {auteurs.map(auteur => (
                      <option key={auteur.matricule} value={auteur.matricule}>
                        {auteur.name}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="tag" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Type Entité
                  </Form.Label>
                  <Form.Select
                    value={typeEntiteFilter}
                    onChange={e => setTypeEntiteFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les types</option>
                    {typesEntites.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="activity" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Action
                  </Form.Label>
                  <Form.Select
                    value={typeActionFilter}
                    onChange={e => setTypeActionFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes les actions</option>
                    {typesActions.map(action => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="alert-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Priorité
                  </Form.Label>
                  <Form.Select
                    value={prioriteFilter}
                    onChange={e => setPrioriteFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes</option>
                    <option value="critical">Critique</option>
                    <option value="high">Haute</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </Form.Select>
                </div>
                <div className="col-md-1">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="eye" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut
                  </Form.Label>
                  <Form.Select
                    value={statutLectureFilter}
                    onChange={e => setStatutLectureFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous</option>
                    <option value="Lue">Lue</option>
                    <option value="Non lue">Non lue</option>
                  </Form.Select>
                </div>
              </div>
            </div>

            {/* Tableau des notifications */}
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
                        checked={notifications.length > 0 && checkedNotifications.length === notifications.length}
                        onChange={handleSelectAll}
                        className={theme === "dark" ? "text-light" : ""}
                      />
                    </th>
                    <th>
                      <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Notification
                    </th>
                    <th className="d-none d-md-table-cell">
                      <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Auteur
                    </th>
                    <th className="d-none d-lg-table-cell text-center">
                      <i data-feather="alert-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Priorité
                    </th>
                    <th className="d-none d-lg-table-cell text-center">
                      <i data-feather="eye" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Statut
                    </th>
                    <th className="text-center">
                      <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Date
                    </th>
                    <th className="text-center">
                      <i data-feather="settings" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => {
                      const prioriteConfig = getPrioriteBadge(notification.priorité);
                      const isUnread = notification.statut_lecture === "Non lue";
                      
                      return (
                        <tr 
                          key={notification.id} 
                          className={`${isUnread ? (theme === "dark" ? "table-warning" : "table-light") : ""} ${theme === "dark" ? "border-secondary" : ""}`}
                        >
                          <td className="text-center">
                            <Form.Check
                              type="checkbox"
                              value={notification.id}
                              checked={checkedNotifications.includes(notification.id)}
                              onChange={handleCheck}
                              className={theme === "dark" ? "text-light" : ""}
                            />
                          </td>
                          <td>
                            <div className="d-flex align-items-start">
                              <div className={`bg-${prioriteConfig.variant} bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0`}>
                                <i data-feather={prioriteConfig.icon} className={`text-${prioriteConfig.variant}`} style={{ width: "16px", height: "16px" }}></i>
                              </div>
                              <div>
                                <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {notification.type_action} - {notification.type_entité}
                                </div>
                                <small className={`${theme === "dark" ? "text-light" : "text-muted"} d-block`}>
                                  Entité: {notification.matricule_entité}
                                </small>
                                {notification.matricule_classroom && (
                                  <small className="text-info d-block">
                                    Classe: {notification.matricule_classroom}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {notification.user_auteur?.name || 'SYSTÈME'}
                            </div>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>
                              {notification.matricule_auteur}
                            </small>
                          </td>
                          <td className="d-none d-lg-table-cell text-center">
                            <Badge
                              bg={prioriteConfig.variant}
                              className="px-3 py-2"
                            >
                              <i
                                data-feather={prioriteConfig.icon}
                                className="me-1"
                                style={{ width: "12px", height: "12px" }}
                              ></i>
                              {prioriteConfig.label}
                            </Badge>
                          </td>
                          <td className="d-none d-lg-table-cell text-center">
                            <Badge
                              bg={notification.statut_lecture === "Lue" ? "success" : "warning"}
                              className="px-3 py-2"
                            >
                              <i
                                data-feather={notification.statut_lecture === "Lue" ? "check-circle" : "clock"}
                                className="me-1"
                                style={{ width: "12px", height: "12px" }}
                              ></i>
                              {notification.statut_lecture}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {formatDate(notification.created_at)}
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                size="sm"
                                variant="outline-info"
                                title="Voir les détails"
                                onClick={() => openDetailsModal(notification)}
                              >
                                <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                              </Button>
                              {isUnread && (
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  title="Marquer comme lue"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <i data-feather="check" style={{ width: "14px", height: "14px" }}></i>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline-danger"
                                title="Supprimer"
                                onClick={() => confirmDelete(notification.id)}
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
                          <i data-feather="bell" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                          <div>
                            <h6>Aucune notification trouvée</h6>
                            <p className="small mb-0">Aucune notification ne correspond à vos critères de recherche.</p>
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

        {/* Modal de détails de la notification */}
        <Modal 
          show={showDetailsModal} 
          onHide={() => setShowDetailsModal(false)} 
          centered 
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header 
            closeButton 
            className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
          >
            <Modal.Title>
              <i data-feather="info" className="me-2 text-primary" style={{ width: "20px", height: "20px" }}></i>
              Détails de la Notification - {selectedNotification?.matricule}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedNotification && (
              <Row className="g-3">
                <Col md={6}>
                  <Card className={`h-100 ${theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <h6 className="fw-bold text-primary">
                        <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Informations Générales
                      </h6>
                      <hr className="mt-1 mb-2" />
                      <p className="mb-1"><strong>Matricule :</strong> {selectedNotification.matricule}</p>
                      <p className="mb-1"><strong>Auteur :</strong> {selectedNotification.user_auteur?.name || 'SYSTÈME'}</p>
                      <p className="mb-1"><strong>Matricule Auteur :</strong> {selectedNotification.matricule_auteur}</p>
                      <p className="mb-1"><strong>Type d'Entité :</strong> {selectedNotification.type_entité}</p>
                      <p className="mb-1"><strong>Entité Concernée :</strong> {selectedNotification.matricule_entité}</p>
                      <p className="mb-1"><strong>Type d'Action :</strong> {selectedNotification.type_action}</p>
                      {selectedNotification.matricule_classroom && (
                        <p className="mb-1"><strong>Classe :</strong> {selectedNotification.matricule_classroom}</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className={`h-100 ${theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <h6 className="fw-bold text-info">
                        <i data-feather="clock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Informations de Suivi
                      </h6>
                      <hr className="mt-1 mb-2" />
                      <p className="mb-1">
                        <strong>Priorité :</strong> 
                        <Badge bg={getPrioriteBadge(selectedNotification.priorité).variant} className="ms-2">
                          {getPrioriteBadge(selectedNotification.priorité).label}
                        </Badge>
                      </p>
                      <p className="mb-1">
                        <strong>Statut de Lecture :</strong> 
                        <Badge 
                          bg={selectedNotification.statut_lecture === 'Lue' ? 'success' : 'warning'} 
                          className="ms-2"
                        >
                          {selectedNotification.statut_lecture}
                        </Badge>
                      </p>
                      <p className="mb-1"><strong>Date de Création :</strong> {formatDate(selectedNotification.created_at)}</p>
                      <p className="mb-1"><strong>Dernière Mise à Jour :</strong> {formatDate(selectedNotification.updated_at)}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            {selectedNotification?.statut_lecture === 'Non lue' && (
              <Button 
                variant="success" 
                onClick={() => {
                  markAsRead(selectedNotification.id);
                  setShowDetailsModal(false);
                }}
              >
                <i data-feather="check-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Marquer comme Lue
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de confirmation "Tout marquer lu" */}
        <Modal
          show={showMarkAllModal}
          onHide={() => setShowMarkAllModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header 
            closeButton 
            className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
          >
            <Modal.Title>
              <i data-feather="check-circle" className="me-2 text-success" style={{ width: "20px", height: "20px" }}></i>
              Confirmer l'action
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <p>Êtes-vous sûr de vouloir marquer toutes les notifications comme lues ?</p>
            <div className="alert alert-info">
              <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              {statistics.notifications_non_lues} notification(s) seront marquées comme lues.
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowMarkAllModal(false)}>
              Annuler
            </Button>
            <Button variant="success" onClick={markAllAsRead}>
              <i data-feather="check-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Confirmer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de confirmation de suppression */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header 
            closeButton 
            className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
          >
            <Modal.Title>
              <i data-feather="alert-triangle" className="me-2 text-warning" style={{ width: "20px", height: "20px" }}></i>
              Confirmer la Suppression
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {notificationToDelete
              ? "Êtes-vous sûr de vouloir supprimer cette notification ?"
              : `Êtes-vous sûr de vouloir supprimer les ${checkedNotifications.length} notifications sélectionnées ?`}
            <div className="alert alert-warning mt-3">
              <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Cette action est irréversible.
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
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
    </AdminSystemeLayout>
  );
}