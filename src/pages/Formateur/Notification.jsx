import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Table, Button, Form, Modal, Row, Col, Badge, Card, Toast, ToastContainer,
  Dropdown, Accordion, Alert
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { Link } from "react-router-dom";

export default function NotificationsByFormateur() {
  // États
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [classrooms, setClassrooms] = useState([]);
  const [typesEntités, setTypesEntités] = useState([]);
  const [typesActions, setTypesActions] = useState([]);
  const [priorités, setPriorités] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkedNotifications, setCheckedNotifications] = useState([]);

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [typeEntitéFilter, setTypeEntitéFilter] = useState("");
  const [typeActionFilter, setTypeActionFilter] = useState("");
  const [prioritéFilter, setPrioritéFilter] = useState("");
  const [statutLectureFilter, setStatutLectureFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  // État thème
  const [theme, setTheme] = useState("light");

  // États toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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

  // Fonction fetch notifications avec filtres
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (typeEntitéFilter) params.type_entité = typeEntitéFilter;
      if (typeActionFilter) params.type_action = typeActionFilter;
      if (prioritéFilter) params.priorité = prioritéFilter;
      if (statutLectureFilter !== "") params.statut_lecture = statutLectureFilter;
      if (classroomFilter) params.matricule_classroom = classroomFilter;

      const res = await api.get("/formateur/view/notifications", { params });
      setNotifications(res.data.notifications.data || []);
      setStats(res.data.stats || {});
      setClassrooms(res.data.classrooms || []);
      setTypesEntités(res.data.types_entités || []);
      setTypesActions(res.data.types_actions || []);
      setPriorités(res.data.priorités || []);
    } catch (err) {
      console.error("Erreur lors du chargement des notifications", err);
      showToastMessage("Échec du chargement des notifications.", 'danger');
    } finally {
      setLoading(false);
    }
  }, [search, createdAtFilter, typeEntitéFilter, typeActionFilter, prioritéFilter, statutLectureFilter, classroomFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    feather.replace();
  }, [notifications, showDeleteModal, loading, checkedNotifications]);

  // Marquer comme lue
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/formateur/notifications/${id}/mark-as-read`);
      fetchNotifications();
      showToastMessage("Notification marquée comme lue", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du marquage de la notification", 'danger');
    }
  };

  // Marquer toutes comme lues
  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.put("/formateur/notifications/mark-all-as-read");
      fetchNotifications();
      showToastMessage(res.data.message || "Toutes les notifications ont été marquées comme lues", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du marquage des notifications", 'danger');
    }
  };

  // Marquer en lot comme lues
  const handleMarkGroupAsRead = async () => {
    try {
      const res = await api.put("/formateur/notifications/mark-group-as-read", {
        ids: checkedNotifications
      });
      fetchNotifications();
      setCheckedNotifications([]);
      showToastMessage(res.data.message || "Notifications marquées comme lues", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du marquage en lot", 'danger');
    }
  };

  // Suppression simple ou en lot
  const confirmDelete = (notificationId = null) => {
    setNotificationToDelete(notificationId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    setSubmitting(true);
    try {
      const idsToDelete = notificationToDelete ? [notificationToDelete] : checkedNotifications;
      
      if (notificationToDelete) {
        await api.delete(`/formateur/notifications/${notificationToDelete}`);
      } else {
        await api.post(`/formateur/notifications/destroy-group`, { ids: idsToDelete });
      }
      
      fetchNotifications();
      setShowDeleteModal(false);
      setCheckedNotifications([]);
      setNotificationToDelete(null);
      showToastMessage("Notification(s) supprimée(s) avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la suppression", 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // Gérer les cases à cocher
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

  // Fonction pour obtenir le badge de priorité
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'low': { variant: "secondary", icon: "minus", label: "Basse" },
      'medium': { variant: "primary", icon: "alert-circle", label: "Moyenne" },
      'high': { variant: "warning", icon: "alert-triangle", label: "Élevée" },
      'critical': { variant: "danger", icon: "alert-octagon", label: "Critique" },
    };
    return priorityConfig[priority] || { variant: "secondary", icon: "help-circle", label: priority };
  };

  // Fonction pour obtenir le badge de statut de lecture
  const getReadStatusBadge = (status) => {
    return status === 'Lue' 
      ? { variant: "success", icon: "check-circle", label: "Lue" }
      : { variant: "warning", icon: "eye", label: "Non lue" };
  };

  // Props communes pour les Modals
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

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête avec titre et statistiques */}
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
                Institut de Formation - Centre de notifications système
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
                        Total
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
                      <h3 className="mb-0 text-warning">
                        {stats.non_lues || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Non Lues
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="eye-off" style={{ width: "24px", height: "24px" }}></i>
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
                        {stats.lues || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Lues
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
                        {stats.critique || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Critique
                      </small>
                    </div>
                    <div className="text-danger">
                      <i data-feather="alert-octagon" style={{ width: "24px", height: "24px" }}></i>
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
                  <>
                    <Button variant="info" className="d-flex align-items-center" onClick={handleMarkGroupAsRead}>
                      <i data-feather="check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Marquer lues ({checkedNotifications.length})
                    </Button>
                    <Button variant="danger" className="d-flex align-items-center" onClick={() => confirmDelete()}>
                      <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Supprimer ({checkedNotifications.length})
                    </Button>
                  </>
                )}
                <Button variant="success" className="d-flex align-items-center" onClick={handleMarkAllAsRead}>
                  <i data-feather="check-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Marquer toutes lues
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <Accordion className="mb-4">
              <Accordion.Item eventKey="0" className={theme === "dark" ? "bg-dark border-secondary" : ""}>
                <Accordion.Header className={theme === "dark" ? "bg-dark text-light" : ""}>
                  <i data-feather="filter" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Filtres de recherche
                </Accordion.Header>
                <Accordion.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Recherche globale
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Matricule, entité, action..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && fetchNotifications()}
                        {...commonFormControlProps}
                      />
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
                      <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="package" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Entité
                      </Form.Label>
                      <Form.Select
                        value={typeEntitéFilter}
                        onChange={e => setTypeEntitéFilter(e.target.value)}
                        {...commonFormControlProps}
                      >
                        <option value="">Toutes</option>
                        {typesEntités.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="activity" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Action
                      </Form.Label>
                      <Form.Select
                        value={typeActionFilter}
                        onChange={e => setTypeActionFilter(e.target.value)}
                        {...commonFormControlProps}
                      >
                        <option value="">Toutes</option>
                        {typesActions.map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="alert-circle" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Priorité
                      </Form.Label>
                      <Form.Select
                        value={prioritéFilter}
                        onChange={e => setPrioritéFilter(e.target.value)}
                        {...commonFormControlProps}
                      >
                        <option value="">Toutes</option>
                        {priorités.map(priorité => (
                          <option key={priorité} value={priorité}>{priorité}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={6}>
                      <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="eye" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Statut de lecture
                      </Form.Label>
                      <Form.Select
                        value={statutLectureFilter}
                        onChange={e => setStatutLectureFilter(e.target.value)}
                        {...commonFormControlProps}
                      >
                        <option value="">Tous</option>
                        <option value="Lue">Lue</option>
                        <option value="Non lue">Non lue</option>
                      </Form.Select>
                    </Col>
                    <Col md={6}>
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
                          <option key={classroom.matricule} value={classroom.matricule}>
                            {classroom.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            {/* Affichage du message de chargement */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2 text-muted">Chargement des notifications...</p>
              </div>
            ) : (
              /* Tableau des notifications */
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
                          checked={checkedNotifications.length === notifications.length && notifications.length > 0}
                        />
                      </th>
                      <th>
                        <i data-feather="message-square" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Message
                      </th>
                      {/* <th className="d-none d-md-table-cell">
                        <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Auteur
                      </th> */}
                      <th className="d-none d-lg-table-cell text-center">
                        <i data-feather="alert-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Priorité
                      </th>
                      <th className="d-none d-lg-table-cell text-center">
                        <i data-feather="eye" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Statut
                      </th>
                      <th className="d-none d-lg-table-cell text-center">
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
                    {notifications.length ? (
                      notifications.map((notification) => {
                        const priorityConfig = getPriorityBadge(notification.priorité);
                        const readStatusConfig = getReadStatusBadge(notification.statut_lecture);
                        const isUnread = notification.statut_lecture === 'Non lue';
                        
                        return (
                          <tr 
                            key={notification.id} 
                            className={`${theme === "dark" ? "border-secondary" : ""} ${isUnread ? 'table-warning' : ''}`}
                            style={{ backgroundColor: isUnread && theme === "dark" ? 'rgba(255, 193, 7, 0.1)' : undefined }}
                          >
                            <td className="text-center">
                              <Form.Check
                                type="checkbox"
                                value={notification.id}
                                checked={checkedNotifications.includes(notification.id)}
                                onChange={handleCheck}
                              />
                            </td>
                            <td>
                              <div className="d-flex align-items-start">
                                <div className={`me-3 p-2 rounded-circle ${
                                  priorityConfig.variant === 'danger' ? 'bg-danger bg-opacity-10' :
                                  priorityConfig.variant === 'warning' ? 'bg-warning bg-opacity-10' :
                                  'bg-primary bg-opacity-10'
                                }`}>
                                  <i 
                                    data-feather={priorityConfig.icon} 
                                    className={`text-${priorityConfig.variant}`} 
                                    style={{ width: "16px", height: "16px" }}
                                  ></i>
                                </div>
                                <div className="flex-grow-1">
                                  <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"} ${isUnread ? 'fw-bold' : ''}`}>
                                    {notification.message_professionnel || 'Message indisponible'}
                                  </div>
                                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                    <span className="me-3">
                                      <i data-feather="package" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                      {notification.type_entité}
                                    </span>
                                    <span className="me-3">
                                      <i data-feather="activity" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                      {notification.type_action}
                                    </span>
                                    {notification.classroom && (
                                      <span>
                                        <i data-feather="layers" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                        {notification.classroom.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* <td className="d-none d-md-table-cell">
                              <div className="d-flex align-items-center">
                                <div className="bg-info bg-opacity-10 rounded-circle p-2 me-2">
                                  <i data-feather="user" className="text-info" style={{ width: "14px", height: "14px" }}></i>
                                </div>
                                <div>
                                  <div className={`small fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {notification.user_auteur?.name || 'Système'}
                                  </div>
                                  <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                    {notification.matricule_auteur}
                                  </div>
                                </div>
                              </div>
                            </td> */}
                            <td className="d-none d-lg-table-cell text-center">
                              <Badge
                                bg={priorityConfig.variant}
                                className="px-3 py-2"
                              >
                                <i
                                  data-feather={priorityConfig.icon}
                                  className="me-1"
                                  style={{ width: "12px", height: "12px" }}
                                ></i>
                                {priorityConfig.label}
                              </Badge>
                            </td>
                            <td className="d-none d-lg-table-cell text-center">
                              <Badge
                                bg={readStatusConfig.variant}
                                className="px-3 py-2"
                                style={{ cursor: isUnread ? 'pointer' : 'default' }}
                                onClick={isUnread ? () => handleMarkAsRead(notification.id) : undefined}
                                title={isUnread ? "Cliquer pour marquer comme lue" : ""}
                              >
                                <i
                                  data-feather={readStatusConfig.icon}
                                  className="me-1"
                                  style={{ width: "12px", height: "12px" }}
                                ></i>
                                {readStatusConfig.label}
                              </Badge>
                            </td>
                            <td className="d-none d-lg-table-cell text-center">
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                {formatDate(notification.created_at)}
                              </small>
                            </td>
                            <td className="text-center">
                              <div className="d-flex gap-1 justify-content-center">
                                {isUnread && (
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    title="Marquer comme lue"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                  >
                                    <i data-feather="check" style={{ width: "14px", height: "14px" }}></i>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  title="Voir les détails"
                                  onClick={() => {/* TODO: Implémenter modal de détails */}}
                                >
                                  <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                                </Button>
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
            )}
          </Card.Body>
        </Card>

        {/* Modal Confirmation Suppression */}
        <Modal
          {...commonModalProps}
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
        >
          <Modal.Header {...commonModalHeaderProps}>
            <Modal.Title>Confirmation de Suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body className={commonModalProps.contentClassName}>
            <p>Êtes-vous sûr de vouloir supprimer {notificationToDelete ? "cette notification" : "ces notifications"} ?</p>
            <div className="alert alert-warning">
              <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Cette action est irréversible.
            </div>
          </Modal.Body>
          <Modal.Footer className={commonModalHeaderProps.className}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDeleteConfirmed} disabled={submitting}>
              <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              {submitting ? "Suppression..." : "Supprimer"}
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
                            