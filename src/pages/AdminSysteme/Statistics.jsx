import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Badge, 
  Table, 
  Alert,
  Spinner,
  ButtonGroup,
  Dropdown,
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
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie, Radar } from 'react-chartjs-2';
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import api from "../../services/api";
import feather from "feather-icons";
import fileDownload from "js-file-download";

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
  ArcElement,
  RadialLinearScale
);

export default function Statistics() {
  const [statisticsData, setStatisticsData] = useState(null);
  const [evolutionData, setEvolutionData] = useState(null);
  const [activiteData, setActiviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  
  // États des filtres
  const [periode, setPeriode] = useState(30);
  const [evolutionType, setEvolutionType] = useState('utilisateurs');
  const [evolutionGroupBy, setEvolutionGroupBy] = useState('day');
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

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

  // Charger les données
  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin-systeme/statistics`, {
        params: { periode }
      });
      setStatisticsData(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Erreur statistiques:', err);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  const fetchEvolution = useCallback(async () => {
    try {
      const response = await api.get(`/admin-systeme/statistics/evolution`, {
        params: { 
          type: evolutionType, 
          periode: periode,
          group_by: evolutionGroupBy
        }
      });
      setEvolutionData(response.data.data);
    } catch (err) {
      console.error('Erreur évolution:', err);
    }
  }, [evolutionType, periode, evolutionGroupBy]);

  const fetchActivite = useCallback(async () => {
    try {
      const response = await api.get(`/admin-systeme/statistics/activite-utilisateurs`, {
        params: { periode }
      });
      setActiviteData(response.data.data);
    } catch (err) {
      console.error('Erreur activité:', err);
    }
  }, [periode]);

  useEffect(() => {
    fetchStatistics();
    fetchEvolution();
    fetchActivite();
  }, [fetchStatistics, fetchEvolution, fetchActivite]);

  useEffect(() => {
    feather.replace();
  }, [statisticsData, evolutionData, activiteData]);

  // Export des données
  const handleExport = async (format, type) => {
    try {
      setExportLoading(true);
      const response = await api.get('/admin-systeme/statistics/export', {
        params: { format, type, periode },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const filename = `statistiques_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
        fileDownload(response.data, filename);
      } else {
        const filename = `statistiques_${type}_${new Date().toISOString().slice(0, 10)}.json`;
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        fileDownload(blob, filename);
      }
      
      setShowExportModal(false);
    } catch (err) {
      console.error('Erreur export:', err);
    } finally {
      setExportLoading(false);
    }
  };

  // Configuration des graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#374151',
          padding: 20,
          usePointStyle: true
        }
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
    maintainAspectRatio: false,
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
          <p className="mt-2">Chargement des statistiques...</p>
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

  const stats = statisticsData || {};

  // Données pour le graphique d'évolution
  const evolutionChartData = evolutionData ? {
    labels: evolutionData.map(item => item.periode),
    datasets: [
      {
        label: `Évolution des ${evolutionType}`,
        data: evolutionData.map(item => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  // Données pour la répartition par sexe
  const genderData = stats.utilisateurs?.par_sexe ? {
    labels: ['Masculin', 'Féminin', 'Autre', 'Non renseigné'],
    datasets: [
      {
        data: [
          stats.utilisateurs.par_sexe.masculin,
          stats.utilisateurs.par_sexe.feminin,
          stats.utilisateurs.par_sexe.autre,
          stats.utilisateurs.par_sexe.non_renseigne
        ],
        backgroundColor: ['#3B82F6', '#EC4899', '#8B5CF6', '#6B7280'],
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      },
    ],
  } : null;

  // Données pour la répartition par rôle
  const roleData = stats.utilisateurs?.par_role ? {
    labels: ['Espace Attente', 'Étudiants', 'Formateurs', 'Admin Système'],
    datasets: [
      {
        data: [
          stats.utilisateurs.par_role.espace_attente,
          stats.utilisateurs.par_role.etudiants,
          stats.utilisateurs.par_role.formateurs,
          stats.utilisateurs.par_role.admin_systeme
        ],
        backgroundColor: ['#FFA500', '#4CAF50', '#2196F3', '#FF5722'],
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      },
    ],
  } : null;

  // Données pour l'activité par jour de la semaine
  const activiteJourData = activiteData?.activite_par_jour ? {
    labels: activiteData.activite_par_jour.map(item => item.jour_fr),
    datasets: [
      {
        label: 'Activité utilisateurs',
        data: activiteData.activite_par_jour.map(item => item.activite),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
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
              Statistiques Détaillées
            </h1>
            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Analyses approfondies du système - Période : {periode} derniers jours
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-success" 
              onClick={() => setShowExportModal(true)}
              className="d-flex align-items-center"
            >
              <i data-feather="download" className="me-2" style={{ width: '16px', height: '16px' }} />
              Exporter
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={() => {
                fetchStatistics();
                fetchEvolution();
                fetchActivite();
              }}
              className="d-flex align-items-center"
            >
              <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Contrôles de filtrage */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body>
                <Row className="align-items-end">
                  <Col md={3}>
                    <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Période d'analyse
                    </Form.Label>
                    <Form.Select
                      value={periode}
                      onChange={(e) => setPeriode(parseInt(e.target.value))}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    >
                      <option value={7}>7 derniers jours</option>
                      <option value={30}>30 derniers jours</option>
                      <option value={90}>90 derniers jours</option>
                      <option value={365}>1 année</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Type d'évolution
                    </Form.Label>
                    <Form.Select
                      value={evolutionType}
                      onChange={(e) => setEvolutionType(e.target.value)}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    >
                      <option value="utilisateurs">Utilisateurs</option>
                      <option value="invitations">Invitations</option>
                      <option value="notifications">Notifications</option>
                      <option value="logs">Logs système</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Grouper par
                    </Form.Label>
                    <Form.Select
                      value={evolutionGroupBy}
                      onChange={(e) => setEvolutionGroupBy(e.target.value)}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    >
                      <option value="day">Jour</option>
                      <option value="week">Semaine</option>
                      <option value="month">Mois</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Button 
                      variant="primary" 
                      className="w-100"
                      onClick={() => {
                        fetchStatistics();
                        fetchEvolution();
                        fetchActivite();
                      }}
                    >
                      <i data-feather="filter" className="me-2" style={{ width: '16px', height: '16px' }} />
                      Appliquer les filtres
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Métriques principales */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {stats.utilisateurs?.total || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Total Utilisateurs
                    </small>
                    <div className="mt-2">
                      <small className="text-success">
                        +{stats.utilisateurs?.nouveaux_periode || 0} sur la période
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
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="text-success mb-0">{stats.classes?.total || 0}</h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Classes Totales
                    </small>
                    <div className="mt-2">
                      <small className="text-info">
                        {stats.classes?.actives || 0} actives
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
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="text-info mb-0">{stats.invitations?.total || 0}</h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Invitations
                    </small>
                    <div className="mt-2">
                      <small className="text-warning">
                        {stats.invitations?.taux_acceptation || 0}% acceptées
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
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="text-warning mb-0">{stats.logs?.total || 0}</h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Logs Système
                    </small>
                    <div className="mt-2">
                      <small className="text-danger">
                        {stats.logs?.par_statut_lecture?.non_lus || 0} non lus
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

        {/* Graphiques d'évolution et répartitions */}
        <Row className="mb-4">
          {/* Évolution temporelle */}
          <Col lg={8} className="mb-4">
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="trending-up" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Évolution - {evolutionType} ({evolutionGroupBy === 'day' ? 'par jour' : evolutionGroupBy === 'week' ? 'par semaine' : 'par mois'})
                </h5>
              </Card.Header>
              <Card.Body>
                <div style={{ height: '350px' }}>
                  {evolutionChartData && (
                    <Line data={evolutionChartData} options={chartOptions} />
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Répartition par genre */}
          <Col lg={4} className="mb-4">
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="users" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Répartition par Genre
                </h5>
              </Card.Header>
              <Card.Body>
                <div style={{ height: '300px' }}>
                  {genderData && (
                    <Doughnut data={genderData} options={doughnutOptions} />
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          {/* Répartition par rôles */}
          <Col lg={6} className="mb-4">
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="shield" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Répartition par Rôles
                </h5>
              </Card.Header>
              <Card.Body>
                <div style={{ height: '300px' }}>
                  {roleData && (
                    <Pie data={roleData} options={doughnutOptions} />
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Activité par jour de la semaine */}
          <Col lg={6} className="mb-4">
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="calendar" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Activité par Jour de la Semaine
                </h5>
              </Card.Header>
              <Card.Body>
                <div style={{ height: '300px' }}>
                  {activiteJourData && (
                    <Bar data={activiteJourData} options={chartOptions} />
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tableaux détaillés */}
        <Row className="mb-4">
          {/* Classes les plus populaires */}
          <Col lg={6} className="mb-4">
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="award" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Classes Populaires
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table hover className={`align-middle ${theme === "dark" ? "table-dark" : ""}`}>
                    <thead>
                      <tr>
                        <th>Classe</th>
                        <th className="text-center">Étudiants</th>
                        <th className="text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.classes?.classes_plus_populaires?.length ? (
                        stats.classes.classes_plus_populaires.map((classroom, index) => (
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
                              Aucune donnée disponible
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

          {/* Controllers les plus actifs */}
          <Col lg={6} className="mb-4">
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="server" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Controllers les Plus Actifs
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table hover className={`align-middle ${theme === "dark" ? "table-dark" : ""}`}>
                    <thead>
                      <tr>
                        <th>Controller</th>
                        <th className="text-center">Logs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.logs?.par_controller?.length ? (
                        stats.logs.par_controller.map((controller, index) => (
                          <tr key={index}>
                            <td>
                              <div className="d-flex align-items-center">
                                <Badge bg="info" className="me-2">#{index + 1}</Badge>
                                <div>
                                  <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {controller.name_controller}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center">
                              <Badge bg="warning" className="px-3">
                                {controller.count}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center py-3">
                            <span className={theme === "dark" ? "text-light" : "text-muted"}>
                              Aucune donnée disponible
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
        </Row>

        {/* Modal d'export */}
        <Modal 
          show={showExportModal} 
          onHide={() => setShowExportModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Exporter les Statistiques</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <p>Choisissez le format et le type de données à exporter :</p>
            <div className="d-grid gap-2">
              <Button 
                variant="outline-primary" 
                onClick={() => handleExport('json', 'general')}
                disabled={exportLoading}
                className="d-flex justify-content-between align-items-center"
              >
                <span>
                  <i data-feather="file-text" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Statistiques Générales (JSON)
                </span>
                {exportLoading && <Spinner size="sm" />}
              </Button>
              
              <Button 
                variant="outline-success" 
                onClick={() => handleExport('csv', 'general')}
                disabled={exportLoading}
                className="d-flex justify-content-between align-items-center"
              >
                <span>
                  <i data-feather="download" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Statistiques Générales (CSV)
                </span>
                {exportLoading && <Spinner size="sm" />}
              </Button>

              <Button 
                variant="outline-info" 
                onClick={() => handleExport('json', 'activite')}
                disabled={exportLoading}
                className="d-flex justify-content-between align-items-center"
              >
                <span>
                  <i data-feather="activity" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Données d'Activité (JSON)
                </span>
                {exportLoading && <Spinner size="sm" />}
              </Button>

              <Button 
                variant="outline-warning" 
                onClick={() => handleExport('csv', 'evolution')}
                disabled={exportLoading}
                className="d-flex justify-content-between align-items-center"
              >
                <span>
                  <i data-feather="trending-up" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Données d'Évolution (CSV)
                </span>
                {exportLoading && <Spinner size="sm" />}
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Statistiques détaillées par sections */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="bar-chart-2" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Résumé Statistique Détaillé
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {/* Section Utilisateurs */}
                  <Col md={3} className="mb-4">
                    <div className="border-start border-4 border-primary ps-3">
                      <h6 className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="users" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Utilisateurs
                      </h6>
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Total :</span>
                          <strong>{stats.utilisateurs?.total || 0}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Étudiants :</span>
                          <span className="text-success">{stats.utilisateurs?.par_role?.etudiants || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Formateurs :</span>
                          <span className="text-info">{stats.utilisateurs?.par_role?.formateurs || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Actifs :</span>
                          <span className="text-primary">{stats.utilisateurs?.par_statut?.actif || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Section Invitations */}
                  <Col md={3} className="mb-4">
                    <div className="border-start border-4 border-info ps-3">
                      <h6 className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="mail" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Invitations
                      </h6>
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Total :</span>
                          <strong>{stats.invitations?.total || 0}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Acceptées :</span>
                          <span className="text-success">{stats.invitations?.par_statut?.acceptees || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>En attente :</span>
                          <span className="text-warning">{stats.invitations?.par_statut?.en_attente || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Taux :</span>
                          <span className="text-primary">{stats.invitations?.taux_acceptation || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Section Notifications */}
                  <Col md={3} className="mb-4">
                    <div className="border-start border-4 border-warning ps-3">
                      <h6 className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="bell" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Notifications
                      </h6>
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Total :</span>
                          <strong>{stats.notifications?.total || 0}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Non lues :</span>
                          <span className="text-danger">{stats.notifications?.par_statut_lecture?.non_lues || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Haute priorité :</span>
                          <span className="text-warning">{stats.notifications?.par_priorite?.high || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Période :</span>
                          <span className="text-primary">{stats.notifications?.periode || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* Section Aide */}
                  <Col md={3} className="mb-4">
                    <div className="border-start border-4 border-success ps-3">
                      <h6 className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="help-circle" className="me-2" style={{ width: '16px', height: '16px' }} />
                        Aide & Support
                      </h6>
                      <div className="small">
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Total :</span>
                          <strong>{stats.aide?.total || 0}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Publiées :</span>
                          <span className="text-success">{stats.aide?.publiees || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>En attente :</span>
                          <span className="text-warning">{stats.aide?.non_publiees || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className={theme === "dark" ? "text-light" : "text-muted"}>Ratio :</span>
                          <span className="text-primary">
                            {stats.aide?.total ? Math.round((stats.aide.publiees / stats.aide.total) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Utilisateurs les plus actifs */}
        {activiteData?.utilisateurs_actifs && (
          <Row className="mb-4">
            <Col md={12}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="user-check" className="me-2" style={{ width: '20px', height: '20px' }} />
                    Utilisateurs les Plus Actifs ({periode} derniers jours)
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover className={`align-middle ${theme === "dark" ? "table-dark" : ""}`}>
                      <thead>
                        <tr>
                          <th>Rang</th>
                          <th>Utilisateur</th>
                          <th>Email</th>
                          <th>Rôle</th>
                          <th className="text-center">Dernière Activité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activiteData.utilisateurs_actifs.slice(0, 10).map((user, index) => (
                          <tr key={user.id}>
                            <td>
                              <Badge 
                                bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : index === 2 ? 'success' : 'primary'} 
                                className="me-2"
                              >
                                #{index + 1}
                              </Badge>
                            </td>
                            <td>
                              <div>
                                <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {user.name}
                                </div>
                                <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                  {user.matricule}
                                </small>
                              </div>
                            </td>
                            <td>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                {user.email}
                              </small>
                            </td>
                            <td>
                              <Badge 
                                bg={
                                  user.role === 0 ? 'warning' :
                                  user.role === 1 ? 'success' :
                                  user.role === 2 ? 'info' :
                                  'danger'
                                }
                              >
                                {
                                  user.role === 0 ? 'Attente' :
                                  user.role === 1 ? 'Étudiant' :
                                  user.role === 2 ? 'Formateur' :
                                  'Admin'
                                }
                              </Badge>
                            </td>
                            <td className="text-center">
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                {new Date(user.updated_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </AdminSystemeLayout>
  );
}