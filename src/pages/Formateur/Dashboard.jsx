import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Badge, Alert, Spinner, Table, 
  ProgressBar, Button, Modal, Collapse
} from "react-bootstrap";
import { Link } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function DashboardFormateur() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");
  const [dashboardData, setDashboardData] = useState({});
  const [error, setError] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
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

  // Charger les données du dashboard
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/formateur/dashboard');
      setDashboardData(response.data.dashboard || {});
      
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError('Erreur lors du chargement des données du dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    feather.replace();
  }, [dashboardData]);

  // Gérer l'accordion
  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Formatage des dates
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

  // Obtenir la couleur du badge de priorité
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  // Obtenir l'icône selon le type d'activité
  const getActivityIcon = (type) => {
    switch(type) {
      case 'inscription': return 'user-plus';
      case 'cours': return 'book-open';
      case 'evaluation': return 'clipboard';
      default: return 'activity';
    }
  };

  // Obtenir la couleur du statut d'évaluation
  const getEvaluationStatus = (evaluation) => {
    const now = new Date();
    const debut = new Date(evaluation.date_debut);
    const fin = new Date(debut.getTime() + (evaluation.duree_minutes * 60000));

    if (now < debut) return { variant: 'primary', text: 'À venir' };
    if (now >= debut && now <= fin) return { variant: 'success', text: 'En cours' };
    return { variant: 'secondary', text: 'Terminée' };
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du dashboard...</p>
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
        <Button variant="primary" onClick={fetchDashboardData}>
          <i data-feather="refresh-cw" className="me-2" />
          Réessayer
        </Button>
      </FormateurLayout>
    );
  }

  const { 
    stats_generales = {}, 
    activites_recentes = [], 
    notifications_non_lues = [], 
    evaluations_programmees = {},
    classes_actives = [],
    evolution_inscriptions = [],
    performance_evaluations = [],
    repartition_utilisateurs = {},
    matieres_populaires = [],
    alertes_systeme = []
  } = dashboardData;

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className={`h3 mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
              Dashboard Principal
            </h1>
            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Vue d'ensemble de votre plateforme éducative
            </p>
          </div>
          <Button variant="primary" onClick={fetchDashboardData}>
            <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
            Actualiser
          </Button>
        </div>

        {/* Alertes système */}
        {alertes_systeme.length > 0 && (
          <Row className="mb-4">
            {alertes_systeme.map((alerte, index) => (
              <Col key={index} md={6} lg={4} className="mb-3">
                <Alert 
                  variant={alerte.type === 'critical' ? 'danger' : alerte.type === 'warning' ? 'warning' : 'info'}
                  className="mb-0"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i data-feather="alert-triangle" className="me-2" style={{ width: '16px', height: '16px' }} />
                      <strong>{alerte.message}</strong>
                      {alerte.action_requise && (
                        <div className="small mt-1">Action requise</div>
                      )}
                    </div>
                    <Badge bg={getPriorityBadge(alerte.priority)}>
                      {alerte.priority}
                    </Badge>
                  </div>
                </Alert>
              </Col>
            ))}
          </Row>
        )}

        {/* Statistiques générales */}
        <Row className="mb-4">
          <Col md={6} lg={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {stats_generales.total_utilisateurs || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Total Utilisateurs
                    </small>
                  </div>
                  <div className="text-primary">
                    <i data-feather="users" style={{ width: "24px", height: "24px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="mb-0 text-info">
                      {stats_generales.total_classes || 0}
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
          <Col md={6} lg={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="mb-0 text-success">
                      {stats_generales.total_evaluations || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Évaluations
                    </small>
                  </div>
                  <div className="text-success">
                    <i data-feather="clipboard" style={{ width: "24px", height: "24px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="mb-0 text-warning">
                      {stats_generales.evaluations_en_cours || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      En Cours
                    </small>
                  </div>
                  <div className="text-warning">
                    <i data-feather="clock" style={{ width: "24px", height: "24px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Colonne principale */}
          <Col lg={8}>
            {/* Évaluations programmées */}
            <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header 
                className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
                onClick={() => toggleSection('evaluations')}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i data-feather="clipboard" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
                    <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Évaluations Programmées
                    </h5>
                  </div>
                  <i 
                    data-feather={openSections['evaluations'] ? "chevron-up" : "chevron-down"} 
                    className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                    style={{ width: "20px", height: "20px" }}
                  />
                </div>
              </Card.Header>
              <Collapse in={openSections['evaluations'] !== false}>
                <Card.Body>
                  {/* En cours */}
                  {evaluations_programmees.en_cours && evaluations_programmees.en_cours.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-success mb-3">
                        <i data-feather="play-circle" className="me-2" style={{ width: '16px', height: '16px' }} />
                        En cours ({evaluations_programmees.en_cours.length})
                      </h6>
                      <div className="table-responsive">
                        <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                          <thead>
                            <tr>
                              <th>Titre</th>
                              <th>Matière</th>
                              <th>Durée</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evaluations_programmees.en_cours.map((eval0, index) => (
                              <tr key={index}>
                                <td>
                                  <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {eval0.titre}
                                  </div>
                                  <Badge bg="success" className="me-2">EN COURS</Badge>
                                </td>
                                <td>
                                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                    {eval0.matiere?.nom} - {eval0.matiere?.classroom?.name}
                                  </small>
                                </td>
                                <td>
                                  <Badge bg="info">{eval0.duree_minutes} min</Badge>
                                </td>
                                <td>
                                  <Button 
                                    size="sm" 
                                    variant="outline-success"
                                    as={Link}
                                    to={`/formateur/show/evaluation/${eval0.id}`}
                                  >
                                    <i data-feather="eye" style={{ width: '12px', height: '12px' }} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* À venir */}
                  {evaluations_programmees.a_venir && evaluations_programmees.a_venir.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-primary mb-3">
                        <i data-feather="clock" className="me-2" style={{ width: '16px', height: '16px' }} />
                        À venir ({evaluations_programmees.a_venir.length})
                      </h6>
                      <div className="table-responsive">
                        <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                          <thead>
                            <tr>
                              <th>Titre</th>
                              <th>Date de début</th>
                              <th>Durée</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evaluations_programmees.a_venir.slice(0, 5).map((eval1, index) => (
                              <tr key={index}>
                                <td>
                                  <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {eval1.titre}
                                  </div>
                                  <small className="text-muted">
                                    {eval1.matiere?.nom}
                                  </small>
                                </td>
                                <td>
                                  <small className={theme === "dark" ? "text-light" : "text-dark"}>
                                    {formatDate(eval1.date_debut)}
                                  </small>
                                </td>
                                <td>
                                  <Badge bg="info">{eval1.duree_minutes} min</Badge>
                                </td>
                                <td>
                                  <Button 
                                    size="sm" 
                                    variant="outline-primary"
                                    as={Link}
                                    to={`/formateur/show/evaluation/${eval1.id}`}
                                  >
                                    <i data-feather="eye" style={{ width: '12px', height: '12px' }} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Terminées récemment */}
                  {evaluations_programmees.terminees_recemment && evaluations_programmees.terminees_recemment.length > 0 && (
                    <div>
                      <h6 className="text-secondary mb-3">
                        <i data-feather="check-circle" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Terminées récemment ({evaluations_programmees.terminees_recemment.length})
                      </h6>
                      <div className="table-responsive">
                        <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                          <thead>
                            <tr>
                              <th>Titre</th>
                              <th>Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evaluations_programmees.terminees_recemment.map((eval2, index) => (
                              <tr key={index}>
                                <td>
                                  <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {eval2.titre}
                                  </div>
                                  <Badge bg="secondary">TERMINÉE</Badge>
                                </td>
                                <td>
                                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                    {formatDate(eval2.created_at)}
                                  </small>
                                </td>
                                <td>
                                  <Button 
                                    size="sm" 
                                    variant="outline-info"
                                    as={Link}
                                    to={`/formateur/evaluation/${eval2.id}/resultats`}
                                  >
                                    <i data-feather="bar-chart-2" style={{ width: '12px', height: '12px' }} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {!evaluations_programmees.en_cours?.length && 
                   !evaluations_programmees.a_venir?.length && 
                   !evaluations_programmees.terminees_recemment?.length && (
                    <div className="text-center py-4">
                      <i data-feather="clipboard" className={`mb-3 ${theme === "dark" ? "text-light" : "text-muted"}`} style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                      <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                        Aucune évaluation programmée
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Collapse>
            </Card>

            {/* Performance des évaluations */}
            {performance_evaluations.length > 0 && (
              <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                  <div className="d-flex align-items-center">
                    <i data-feather="trending-up" className="text-info me-2" style={{ width: "20px", height: "20px" }}></i>
                    <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Performance des Évaluations Récentes
                    </h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                      <thead>
                        <tr>
                          <th>Évaluation</th>
                          <th className="text-center">Participants</th>
                          <th className="text-center">Taux de réussite</th>
                          <th className="text-center">Difficulté</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performance_evaluations.map((perf, index) => (
                          <tr key={index}>
                            <td>
                              <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {perf.evaluation.titre}
                              </div>
                              <small className="text-muted">
                                {perf.evaluation.matiere?.nom}
                              </small>
                            </td>
                            <td className="text-center">
                              <Badge bg="primary">{perf.participants}</Badge>
                            </td>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center">
                                <ProgressBar 
                                  now={perf.taux_reussite} 
                                  variant={perf.taux_reussite >= 70 ? 'success' : perf.taux_reussite >= 50 ? 'warning' : 'danger'}
                                  style={{ width: '60px', height: '8px' }}
                                  className="me-2"
                                />
                                <small>{perf.taux_reussite}%</small>
                              </div>
                            </td>
                            <td className="text-center">
                              <Badge 
                                bg={
                                  perf.difficulte_estimee === 'Facile' ? 'success' :
                                  perf.difficulte_estimee === 'Moyenne' ? 'warning' :
                                  perf.difficulte_estimee === 'Difficile' ? 'danger' : 'dark'
                                }
                              >
                                {perf.difficulte_estimee}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Classes les plus actives */}
            {classes_actives.length > 0 && (
              <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                  <div className="d-flex align-items-center">
                    <i data-feather="home" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
                    <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Classes les Plus Actives
                    </h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {classes_actives.map((classe, index) => (
                      <Col key={index} md={6} className="mb-3">
                        <Card className={`h-100 ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {classe.classe.name}
                                </h6>
                                <small className="text-muted">
                                  {classe.classe.users_count} étudiants
                                </small>
                              </div>
                              <Badge bg="success">{classe.score_activite} pts</Badge>
                            </div>
                            <div className="mt-2">
                              <div className="d-flex justify-content-between text-muted small">
                                <span>Évaluations: {classe.classe.evaluations_count}</span>
                                <span>Cours: {classe.classe.cours_count}</span>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Colonne latérale */}
          <Col lg={4}>
            {/* Notifications non lues */}
            <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i data-feather="bell" className="text-warning me-2" style={{ width: "18px", height: "18px" }}></i>
                    <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Notifications
                    </h6>
                  </div>
                  <Badge bg="warning">{notifications_non_lues.length}</Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications_non_lues.length > 0 ? (
                  notifications_non_lues.map((notif, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border-bottom cursor-pointer hover-bg ${theme === "dark" ? "border-secondary" : ""}`}
                      onClick={() => {
                        setSelectedNotification(notif);
                        setShowNotificationModal(true);
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className={`small fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {notif.message}
                          </div>
                          <small className="text-muted">
                            Par {notif.auteur} • {formatDate(notif.timestamp)}
                          </small>
                        </div>
                        <Badge bg={getPriorityBadge(notif.priorite)} className="ms-2">
                          {notif.priorite}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <i data-feather="bell" className={`mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`} style={{ width: "32px", height: "32px", opacity: 0.5 }}></i>
                    <p className={`mb-0 small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Aucune notification
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Activités récentes */}
            <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i data-feather="activity" className="text-info me-2" style={{ width: "18px", height: "18px" }}></i>
                    <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Activités Récentes
                    </h6>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowActivityModal(true)}
                    className="p-0"
                  >
                    Voir tout
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {activites_recentes.length > 0 ? (
                  activites_recentes.slice(0, 8).map((activite, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border-bottom d-flex align-items-center ${theme === "dark" ? "border-secondary" : ""}`}
                    >
                      <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                        <i 
                          data-feather={getActivityIcon(activite.type)} 
                          className="text-info" 
                          style={{ width: "14px", height: "14px" }}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {activite.message}
                        </div>
                        <small className="text-muted">
                          {formatDate(activite.timestamp)}
                        </small>
                      </div>
                      <Badge 
                        bg={getPriorityBadge(activite.priority)}
                        className="ms-2"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {activite.priority}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <i data-feather="activity" className={`mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`} style={{ width: "32px", height: "32px", opacity: 0.5 }}></i>
                    <p className={`mb-0 small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Aucune activité récente
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Matières populaires */}
            {matieres_populaires.length > 0 && (
              <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                  <div className="d-flex align-items-center">
                    <i data-feather="book" className="text-primary me-2" style={{ width: "18px", height: "18px" }}></i>
                    <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Matières Populaires
                    </h6>
                  </div>
                </Card.Header>
                <Card.Body>
                  {matieres_populaires.map((matiere, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <div className={`small fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {matiere.matiere.nom}
                        </div>
                        <small className="text-muted">
                          {matiere.matiere.cours_count} cours • {matiere.matiere.evaluations_count} évaluations
                        </small>
                      </div>
                      <Badge bg="primary">{matiere.score_popularite}</Badge>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}

            {/* Répartition des utilisateurs */}
            {Object.keys(repartition_utilisateurs).length > 0 && (
              <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                  <div className="d-flex align-items-center">
                    <i data-feather="pie-chart" className="text-success me-2" style={{ width: "18px", height: "18px" }}></i>
                    <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Répartition Utilisateurs
                    </h6>
                  </div>
                </Card.Header>
                <Card.Body>
                  {repartition_utilisateurs.par_role && (
                    <div className="mb-4">
                      <h6 className="small text-muted">Par rôle</h6>
                      <div className="row g-2">
                        <div className="col-6">
                          <div className="text-center">
                            <div className="h5 mb-0 text-info">
                              {repartition_utilisateurs.par_role.etudiants_actifs || 0}
                            </div>
                            <small className="text-muted">Étudiants</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="text-center">
                            <div className="h5 mb-0 text-success">
                              {repartition_utilisateurs.par_role.formateurs || 0}
                            </div>
                            <small className="text-muted">Formateurs</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {repartition_utilisateurs.par_statut && (
                    <div>
                      <h6 className="small text-muted mb-3">Par statut</h6>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between small">
                          <span className={theme === "dark" ? "text-light" : "text-dark"}>Actifs</span>
                          <span className="text-success fw-bold">
                            {repartition_utilisateurs.par_statut.actifs || 0}
                          </span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between small">
                          <span className={theme === "dark" ? "text-light" : "text-dark"}>Inactifs</span>
                          <span className="text-warning fw-bold">
                            {repartition_utilisateurs.par_statut.inactifs || 0}
                          </span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between small">
                          <span className={theme === "dark" ? "text-light" : "text-dark"}>Suspendus</span>
                          <span className="text-danger fw-bold">
                            {repartition_utilisateurs.par_statut.suspendus || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Évolution des inscriptions */}
        {evolution_inscriptions.length > 0 && (
          <Card className={`shadow-sm border-0 mt-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
              <div className="d-flex align-items-center">
                <i data-feather="trending-up" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Évolution des Inscriptions (30 derniers jours)
                </h5>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-center">Total</th>
                      <th className="text-center">Étudiants</th>
                      <th className="text-center">Formateurs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evolution_inscriptions
                      .filter(item => item.total > 0)
                      .slice(-10)
                      .map((item, index) => (
                      <tr key={index}>
                        <td>
                          <small className={theme === "dark" ? "text-light" : "text-dark"}>
                            {new Date(item.date).toLocaleDateString('fr-FR')}
                          </small>
                        </td>
                        <td className="text-center">
                          <Badge bg="primary">{item.total}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="info">{item.etudiants}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="success">{item.formateurs}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Modal Notifications */}
        <Modal
          show={showNotificationModal}
          onHide={() => setShowNotificationModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Détail de la notification</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedNotification && (
              <div>
                <div className="mb-3">
                  <Badge bg={getPriorityBadge(selectedNotification.priorite)} className="mb-2">
                    Priorité: {selectedNotification.priorite}
                  </Badge>
                  <p className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {selectedNotification.message}
                  </p>
                  <small className="text-muted">
                    Par {selectedNotification.auteur} • {formatDate(selectedNotification.timestamp)}
                  </small>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowNotificationModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal Activités */}
        <Modal
          show={showActivityModal}
          onHide={() => setShowActivityModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Toutes les activités récentes</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {activites_recentes.map((activite, index) => (
                <div 
                  key={index} 
                  className={`p-3 border-bottom d-flex align-items-center ${theme === "dark" ? "border-secondary" : ""}`}
                >
                  <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                    <i 
                      data-feather={getActivityIcon(activite.type)} 
                      className="text-info" 
                      style={{ width: "16px", height: "16px" }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {activite.message}
                    </div>
                    <small className="text-muted">
                      {formatDate(activite.timestamp)}
                    </small>
                  </div>
                  <Badge bg={getPriorityBadge(activite.priority)} className="ms-2">
                    {activite.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowActivityModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </FormateurLayout>
  );
}