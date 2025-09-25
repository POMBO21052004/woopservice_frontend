import React, { useState, useEffect } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Badge, 
  Table, 
  Button,
  Alert,
  Spinner,
  Modal
} from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Link } from "react-router-dom";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import api from "../../services/api";
import feather from "feather-icons";

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function DashboardAdminSysteme() {
  const [dashboardData, setDashboardData] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [systemActivity, setSystemActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

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
  useEffect(() => {
    fetchDashboardData();
    fetchQuickStats();
    fetchSystemActivity();
    
    // Actualiser les données toutes les 5 minutes
    const interval = setInterval(() => {
      fetchQuickStats();
      fetchSystemActivity();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    feather.replace();
  }, [dashboardData, quickStats, systemActivity]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin-systeme/dashboard');
      setDashboardData(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement des données du dashboard');
      console.error('Erreur dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickStats = async () => {
    try {
      const response = await api.get('/admin-systeme/dashboard/quick-stats');
      setQuickStats(response.data.data);
    } catch (err) {
      console.error('Erreur stats rapides:', err);
    }
  };

  const fetchSystemActivity = async () => {
    try {
      const response = await api.get('/admin-systeme/dashboard/system-activity');
      setSystemActivity(response.data.data);
    } catch (err) {
      console.error('Erreur activité système:', err);
    }
  };

  const showDetail = (type, data) => {
    setSelectedDetail({ type, data });
    setShowDetailModal(true);
  };

  // Configuration des graphiques
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#374151'
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
        },
        grid: {
          color: theme === 'dark' ? '#374151' : '#E5E7EB'
        }
      },
      y: {
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
        },
        grid: {
          color: theme === 'dark' ? '#374151' : '#E5E7EB'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#374151',
          padding: 20,
          usePointStyle: true
        }
      },
    },
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du tableau de bord...</p>
        </div>
      </AdminSystemeLayout>
    );
  }

  if (error) {
    return (
      <AdminSystemeLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
      </AdminSystemeLayout>
    );
  }

  const stats = dashboardData?.stats_generales || {};
  const activiteRecente = dashboardData?.activite_recente || {};
  const graphiques = dashboardData?.graphiques || {};
  const topClassrooms = dashboardData?.top_classrooms || [];

  // Données pour le graphique des inscriptions par jour
  const inscriptionsData = {
    labels: graphiques.inscriptions_par_jour?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Nouvelles inscriptions',
        data: graphiques.inscriptions_par_jour?.map(item => item.count) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Données pour le graphique de répartition des rôles
  const rolesData = {
    labels: graphiques.repartition_roles?.map(item => item.role) || [],
    datasets: [
      {
        data: graphiques.repartition_roles?.map(item => item.count) || [],
        backgroundColor: graphiques.repartition_roles?.map(item => item.color) || [],
        borderWidth: 1,
        borderColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      },
    ],
  };

  // Données pour le graphique des invitations par jour
  const invitationsData = {
    labels: graphiques.invitations_par_jour?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Invitations envoyées',
        data: graphiques.invitations_par_jour?.map(item => item.count) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  };

  // Données pour l'activité système (si disponible)
  const systemActivityData = systemActivity ? {
    labels: systemActivity.map(item => item.heure),
    datasets: [
      {
        label: 'Utilisateurs actifs',
        data: systemActivity.map(item => item.utilisateurs),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
      },
      {
        label: 'Logs système',
        data: systemActivity.map(item => item.logs),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
      },
    ],
  } : null;

  return (
    <AdminSystemeLayout>
      <Container fluid className="py-4">
        {/* En-tête */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className={`h3 mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
              Tableau de Bord Administrateur
            </h1>
            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Vue d'ensemble du système de gestion
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={fetchDashboardData}
              className="d-flex align-items-center"
            >
              <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
              Actualiser
            </Button>
            <Button 
              variant="primary" 
              className="d-flex align-items-center"
              as={Link} 
              to="/admin-systeme/statistics"
            >
              <i data-feather="bar-chart-2" className="me-2" style={{ width: '16px', height: '16px' }} />
              Statistiques Détaillées
            </Button>
          </div>
        </div>

        {/* Statistiques rapides */}
        {quickStats && (
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="text-success mb-0">{quickStats.utilisateurs_actifs_aujourd_hui}</h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Actifs aujourd'hui
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="activity" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="text-info mb-0">{quickStats.nouvelles_invitations}</h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Invitations aujourd'hui
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="mail" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="text-warning mb-0">{quickStats.notifications_urgentes}</h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Notifications urgentes
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="bell" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="text-danger mb-0">{quickStats.logs_critiques}</h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Logs critiques
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
        )}

        {/* Cartes de statistiques principales */}
        <Row className="mb-4">
          <Col md={3}>
            <Card 
              className={`border-0 shadow-sm h-100 cursor-pointer ${theme === "dark" ? "bg-dark" : "bg-white"}`}
              onClick={() => showDetail('users', stats)}
            >
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {stats.total_users}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Utilisateurs Total
                    </small>
                    <div className="mt-2">
                      <small className="text-success">
                        +{activiteRecente.nouveaux_utilisateurs_aujourd_hui} aujourd'hui
                      </small>
                    </div>
                  </div>
                  <div className="text-primary">
                    <i data-feather="users" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card 
              className={`border-0 shadow-sm h-100 cursor-pointer ${theme === "dark" ? "bg-dark" : "bg-white"}`}
              onClick={() => showDetail('classrooms', stats)}
            >
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="text-success mb-0">{stats.total_classrooms}</h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Classes Total
                    </small>
                    <div className="mt-2">
                      <small className="text-info">
                        {stats.classrooms_actives} actives
                      </small>
                    </div>
                  </div>
                  <div className="text-success">
                    <i data-feather="book-open" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card 
              className={`border-0 shadow-sm h-100 cursor-pointer ${theme === "dark" ? "bg-dark" : "bg-white"}`}
              onClick={() => showDetail('invitations', stats)}
            >
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="text-info mb-0">{stats.total_invitations}</h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Invitations
                    </small>
                    <div className="mt-2">
                      <small className="text-warning">
                        {stats.invitations_pendantes} en attente
                      </small>
                    </div>
                  </div>
                  <div className="text-info">
                    <i data-feather="mail" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card 
              className={`border-0 shadow-sm h-100 cursor-pointer ${theme === "dark" ? "bg-dark" : "bg-white"}`}
              onClick={() => showDetail('logs', stats)}
            >
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="text-warning mb-0">{stats.total_logs}</h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Logs Système
                    </small>
                    <div className="mt-2">
                      <small className="text-danger">
                        {stats.logs_non_lus} non lus
                      </small>
                    </div>
                  </div>
                  <div className="text-warning">
                    <i data-feather="file-text" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Graphiques */}
        <Row className="mb-4">
          {/* Évolution des inscriptions */}
          <Col lg={7} className="mb-4">
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="trending-up" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Évolution des Inscriptions (7 derniers jours)
                </h5>
              </Card.Header>
              <Card.Body>
                <Line data={inscriptionsData} options={chartOptions} />
              </Card.Body>
            </Card>
          </Col>

          {/* Répartition par rôles */}
          <Col lg={5} className="mb-4">
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="pie-chart" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Répartition des Utilisateurs par Rôle
                </h5>
              </Card.Header>
              <Card.Body >
                <Doughnut data={rolesData} options={doughnutOptions} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          {/* Invitations par jour */}
          <Col lg={6} className="mb-4">
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="mail" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Activité des Invitations (7 derniers jours)
                </h5>
              </Card.Header>
              <Card.Body>
                <Bar data={invitationsData} options={chartOptions} />
              </Card.Body>
            </Card>
          </Col>

          {/* Activité système */}
          {systemActivityData && (
            <Col lg={6} className="mb-4">
              <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="activity" className="me-2" style={{ width: '20px', height: '20px' }} />
                    Activité Système (24h)
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Line data={systemActivityData} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        <Row>
          {/* Top 5 des classes */}
          <Col lg={6} className="mb-4">
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="award" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Top 5 Classes (Plus d'Étudiants)
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover className={`align-middle ${theme === "dark" ? "table-dark" : ""}`}>
                    <thead>
                      <tr>
                        <th>Classe</th>
                        <th className="text-center">Étudiants</th>
                        <th className="text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topClassrooms.length ? (
                        topClassrooms.map((classroom, index) => (
                          <tr key={classroom.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <Badge bg="primary" className="me-2">#{index + 1}</Badge>
                                <div>
                                  <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {classroom.name}
                                  </div>
                                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                    {classroom.matricule}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td className="text-center">
                              <Badge bg="success" className="px-3">
                                {classroom.users_count}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge 
                                bg={classroom.status === 'Open' ? 'success' : 'secondary'}
                                className="px-3"
                              >
                                {classroom.status === 'Open' ? 'Ouverte' : 'Fermée'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center py-3">
                            <span className={theme === "dark" ? "text-light" : "text-muted"}>
                              Aucune classe disponible
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Notifications récentes */}
          <Col lg={6} className="mb-4">
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="bell" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Notifications Récentes
                </h5>
              </Card.Header>
              <Card.Body>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {activiteRecente.notifications_recentes?.length ? (
                    activiteRecente.notifications_recentes.map((notif) => (
                      <div key={notif.id} className="d-flex align-items-start mb-3 p-2 rounded border-start border-3 border-info">
                        <div className="flex-grow-1">
                          <div className={`small fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {notif.type_action} - {notif.type_entité}
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>
                              {notif.user_auteur?.name || 'Système'}
                            </small>
                            <Badge 
                              bg={notif.statut_lecture === 'Non lue' ? 'warning' : 'secondary'}
                              className="ms-2"
                            >
                              {notif.statut_lecture === 'Non lue' ? 'Non lue' : 'Lue'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`text-center ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Aucune notification récente
                    </p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal de détails */}
        <Modal 
          show={showDetailModal} 
          onHide={() => setShowDetailModal(false)}
          size="lg"
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>
              Détails - {selectedDetail?.type === 'users' ? 'Utilisateurs' : 
                        selectedDetail?.type === 'classrooms' ? 'Classes' :
                        selectedDetail?.type === 'invitations' ? 'Invitations' :
                        'Logs Système'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedDetail && (
              <Row>
                {selectedDetail.type === 'users' && (
                  <>
                    <Col md={6} className="mb-3">
                      <div className="text-center p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#2d3748" : "#f8f9fa" }}>
                        <h4 className="text-primary">{selectedDetail.data.etudiants_attente}</h4>
                        <small>Espace Attente</small>
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <div className="text-center p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#2d3748" : "#f8f9fa" }}>
                        <h4 className="text-success">{selectedDetail.data.etudiants}</h4>
                        <small>Étudiants</small>
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <div className="text-center p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#2d3748" : "#f8f9fa" }}>
                        <h4 className="text-info">{selectedDetail.data.formateurs}</h4>
                        <small>Formateurs</small>
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <div className="text-center p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#2d3748" : "#f8f9fa" }}>
                        <h4 className="text-warning">{selectedDetail.data.admin_systeme}</h4>
                        <small>Admin Système</small>
                      </div>
                    </Col>
                  </>
                )}
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AdminSystemeLayout>
  );
}