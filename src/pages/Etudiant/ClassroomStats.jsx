import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Badge, Alert, Spinner, Toast, ToastContainer, 
  ProgressBar, Table, Tab, Tabs, Image, Tooltip, OverlayTrigger
} from "react-bootstrap";
import { Link } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, Pie } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler
);

export default function ClassroomStats() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [classroom, setClassroom] = useState({});
  const [generalStats, setGeneralStats] = useState({});
  const [studentsRanking, setStudentsRanking] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [classEvolution, setClassEvolution] = useState({});
  const [participationStats, setParticipationStats] = useState({});
  const [myPerformance, setMyPerformance] = useState({});
  const [chartData, setChartData] = useState({});
  const [recentActivity, setRecentActivity] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // État de l'onglet actif
  const [activeTab, setActiveTab] = useState('overview');

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

  // Charger les statistiques de la classe
  const fetchClassroomStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/etudiant/classroom/stats');
      
      if (response.data.status === 'success') {
        setClassroom(response.data.classroom);
        setGeneralStats(response.data.general_stats);
        setStudentsRanking(response.data.students_ranking);
        setSubjectStats(response.data.subject_stats);
        setClassEvolution(response.data.class_evolution);
        setParticipationStats(response.data.participation_stats);
        setMyPerformance(response.data.my_performance);
        setChartData(response.data.chart_data);
        setRecentActivity(response.data.recent_activity);
      } else {
        showToastMessage(response.data.message || "Erreur lors du chargement", 'danger');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des stats:', err);
      const errorMessage = err.response?.data?.message || "Erreur lors du chargement des statistiques";
      showToastMessage(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassroomStats();
  }, [fetchClassroomStats]);

  useEffect(() => {
    feather.replace();
  }, [studentsRanking, subjectStats]);

  // Fonctions utilitaires
  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#007bff';
    if (percentage >= 40) return '#ffc107';
    return '#dc3545';
  };

  const getPerformanceText = (percentage) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Bien';
    if (percentage >= 40) return 'Passable';
    return 'À améliorer';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'success';
    if (rank <= 3) return 'warning';
    if (rank <= 10) return 'info';
    return 'secondary';
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving': return 'trending-up';
      case 'declining': return 'trending-down';
      default: return 'minus';
    }
  };

  const getTrendColor = (trend) => {
    switch(trend) {
      case 'improving': return 'text-success';
      case 'declining': return 'text-danger';
      default: return 'text-muted';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  };

  // Configuration des graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#666666',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#343a40' : '#ffffff',
        titleColor: theme === 'dark' ? '#ffffff' : '#000000',
        bodyColor: theme === 'dark' ? '#ffffff' : '#666666',
        borderColor: theme === 'dark' ? '#6c757d' : '#dee2e6',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: theme === 'dark' ? '#495057' : '#e9ecef'
        },
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#666666'
        }
      },
      y: {
        grid: {
          color: theme === 'dark' ? '#495057' : '#e9ecef'
        },
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#666666'
        }
      }
    }
  };

  // Données pour le graphique de distribution des performances
  const performanceDistributionData = {
    labels: ['Excellent (≥80%)', 'Bien (60-79%)', 'Passable (40-59%)', 'Insuffisant (<40%)'],
    datasets: [{
      data: chartData.performance_distribution || [0, 0, 0, 0],
      backgroundColor: ['#28a745', '#007bff', '#ffc107', '#dc3545'],
      borderColor: theme === 'dark' ? '#6c757d' : '#ffffff',
      borderWidth: 2
    }]
  };

  // Données pour le graphique d'évolution mensuelle
  const monthlyEvolutionData = {
    labels: (classEvolution.monthly_evolution || []).map(item => item.period),
    datasets: [{
      label: 'Moyenne de classe (%)',
      data: (classEvolution.monthly_evolution || []).map(item => item.average),
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#007bff',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6
    }]
  };

  // Données pour le graphique radar des matières
  const subjectRadarData = {
    labels: subjectStats.slice(0, 6).map(subject => subject.name),
    datasets: [{
      label: 'Moyenne par matière (%)',
      data: subjectStats.slice(0, 6).map(subject => subject.average_score),
      borderColor: '#17a2b8',
      backgroundColor: 'rgba(23, 162, 184, 0.2)',
      pointBackgroundColor: '#17a2b8',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2
    }]
  };

  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: theme === 'dark' ? '#495057' : '#e9ecef'
        },
        pointLabels: {
          color: theme === 'dark' ? '#ffffff' : '#666666'
        },
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#666666'
        }
      }
    }
  };

  if (loading) {
    return (
      <EtudiantLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des statistiques de classe...</p>
        </div>
      </EtudiantLayout>
    );
  }

  return (
    <EtudiantLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
                <i data-feather="users" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Ma Classe - {classroom.name || 'Classe'}
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Statistiques et classement • {generalStats.total_students || 0} étudiants
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline-primary"
              onClick={fetchClassroomStats}
              title="Actualiser"
            >
              <i data-feather="refresh-cw" style={{ width: "16px", height: "16px" }}></i>
            </Button>
          </div>

          {/* Statistiques générales */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {generalStats.total_students || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Étudiants
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
                      <h3 className={`mb-0 text-${generalStats.class_average >= 60 ? 'success' : 'warning'}`}>
                        {generalStats.class_average || 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Moyenne classe
                      </small>
                    </div>
                    <div className={`text-${generalStats.class_average >= 60 ? 'success' : 'warning'}`}>
                      <i data-feather="bar-chart-2" style={{ width: "24px", height: "24px" }}></i>
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
                        {generalStats.total_evaluations || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Évaluations
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="clipboard" style={{ width: "24px", height: "24px" }}></i>
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
                        {generalStats.participation_rate || 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Participation
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="activity" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Ma position dans la classe */}
          {myPerformance.my_ranking && (
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Ma position dans la classe
                  </h6>
                  <Badge bg={getRankBadge(myPerformance.my_ranking.rank)} className="px-3 py-1">
                    #{myPerformance.my_ranking.rank} / {myPerformance.my_ranking.total_students}
                  </Badge>
                </div>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <ProgressBar 
                      now={(myPerformance.my_ranking.total_students - myPerformance.my_ranking.rank + 1) / myPerformance.my_ranking.total_students * 100} 
                      variant={getRankBadge(myPerformance.my_ranking.rank)}
                      style={{ height: '8px' }}
                    />
                  </div>
                  <div className="ms-3 text-end">
                    <small className={`${myPerformance.comparison_to_class?.status === 'above' ? 'text-success' : 'text-danger'}`}>
                      {myPerformance.comparison_to_class?.status === 'above' ? '+' : ''}{myPerformance.comparison_to_class?.difference || 0}% 
                      {myPerformance.comparison_to_class?.status === 'above' ? ' au-dessus' : ' en-dessous'} de la moyenne
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>

        {/* Onglets principaux */}
        <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Tabs 
              activeKey={activeTab} 
              onSelect={(k) => setActiveTab(k)}
              className="border-0"
            >
              <Tab eventKey="overview" title={
                <span>
                  <i data-feather="grid" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Vue d'ensemble
                </span>
              } />
              <Tab eventKey="ranking" title={
                <span>
                  <i data-feather="award" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Classement
                </span>
              } />
              <Tab eventKey="subjects" title={
                <span>
                  <i data-feather="book" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Matières
                </span>
              } />
              <Tab eventKey="charts" title={
                <span>
                  <i data-feather="bar-chart-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Graphiques
                </span>
              } />
            </Tabs>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Onglet Vue d'ensemble */}
            {activeTab === 'overview' && (
              <Row>
                <Col lg={8}>
                  {/* Évolution mensuelle de la classe */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="trending-up" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Évolution de la classe (6 derniers mois)
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {classEvolution.monthly_evolution && classEvolution.monthly_evolution.length > 0 ? (
                        <div style={{ height: '300px' }}>
                          <Line data={monthlyEvolutionData} options={chartOptions} />
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="trending-up" className="text-muted mb-2" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted">Pas encore de données d'évolution</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Top performers de la semaine */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="star" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Top 5 de la classe
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {studentsRanking.length > 0 ? (
                        <div className="d-grid gap-3">
                          {studentsRanking.slice(0, 5).map((student, index) => (
                            <div key={student.student_id} className={`p-3 border rounded ${theme === "dark" ? "border-secondary bg-dark" : "bg-white"}`}>
                              <div className="d-flex align-items-center">
                                <div className="me-3 position-relative">
                                  {student.profil_url ? (
                                    <Image
                                      src={student.profil_url}
                                      alt="Profil"
                                      width="40"
                                      height="40"
                                      className="rounded-circle"
                                      style={{ objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div 
                                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                      style={{ width: '40px', height: '40px' }}
                                    >
                                      <i data-feather="user" className="text-white" style={{ width: '20px', height: '20px' }} />
                                    </div>
                                  )}
                                  <Badge 
                                    bg={getRankBadge(student.rank)}
                                    className="position-absolute top-0 end-0 rounded-circle"
                                    style={{ transform: 'translate(25%, -25%)' }}
                                  >
                                    {student.rank}
                                  </Badge>
                                </div>
                                <div className="flex-grow-1">
                                  <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {student.name}
                                  </div>
                                  <div className="d-flex align-items-center gap-2 mt-1">
                                    <Badge bg="success" className="small">
                                      {student.average_score}% moyenne
                                    </Badge>
                                    <Badge bg="info" className="small">
                                      {student.points_obtained} pts
                                    </Badge>
                                    <Badge bg="primary" className="small">
                                      {student.participation_rate}% participation
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-end">
                                  <div className={`small ${getTrendColor(student.trend)}`}>
                                    <i data-feather={getTrendIcon(student.trend)} style={{ width: "14px", height: "14px" }}></i>
                                  </div>
                                  <div className="small text-muted">
                                    Grade {student.grade}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="users" className="text-muted mb-3" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted">Aucune donnée de classement disponible</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  {/* Mes statistiques personnelles */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="user" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Mes performances
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {myPerformance.my_stats ? (
                        <div>
                          <div className="text-center mb-3">
                            <h4 className={`text-${getPerformanceColor(myPerformance.my_stats.average_score).replace('#', '')}`}>
                              {myPerformance.my_stats.average_score}%
                            </h4>
                            <small className="text-muted">Ma moyenne générale</small>
                          </div>
                          
                          <div className="d-grid gap-2">
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Évaluations faites :</span>
                              <span className={theme === "dark" ? "text-light" : "text-dark"}>
                                {myPerformance.my_stats.evaluations_completed}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Taux participation :</span>
                              <span className={theme === "dark" ? "text-light" : "text-dark"}>
                                {myPerformance.my_stats.participation_rate}%
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Points obtenus :</span>
                              <span className={theme === "dark" ? "text-light" : "text-dark"}>
                                {myPerformance.my_stats.points_obtained}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Matière forte :</span>
                              <Badge bg="success">{myPerformance.my_stats.best_subject}</Badge>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">À améliorer :</span>
                              <Badge bg="warning">{myPerformance.my_stats.weakest_subject}</Badge>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="user" className="text-muted mb-2" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted">Données non disponibles</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Distribution des performances */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="pie-chart" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Distribution classe
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {chartData.performance_distribution ? (
                        <div style={{ height: '250px' }}>
                          <Doughnut data={performanceDistributionData} options={{ 
                            ...chartOptions, 
                            plugins: { 
                              ...chartOptions.plugins,
                              legend: { 
                                position: 'bottom',
                                labels: {
                                  color: theme === 'dark' ? '#ffffff' : '#666666',
                                  usePointStyle: true,
                                  padding: 10,
                                  font: { size: 10 }
                                }
                              }
                            }
                          }} />
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="pie-chart" className="text-muted mb-2" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted">Pas de données de distribution</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Actions rapides */}
                  <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="zap" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Actions rapides
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-grid gap-2">
                        <Button 
                          variant="primary" 
                          size="sm"
                          as={Link}
                          to="/etudiant/view/evaluations/my-classroom"
                        >
                          <i data-feather="clipboard" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Mes évaluations
                        </Button>
                        
                        <Button 
                          variant="success" 
                          size="sm"
                          as={Link}
                          to="/etudiant/view/cours/my-classroom"
                        >
                          <i data-feather="book-open" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Cours de la classe
                        </Button>
                        
                        <Button 
                          variant="info" 
                          size="sm"
                          as={Link}
                          to="/etudiant/view/resultats/my-classroom"
                        >
                          <i data-feather="bar-chart-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Mes résultats
                        </Button>
                        
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          as={Link}
                          to="/etudiant/view/matieres/my-classroom"
                        >
                          <i data-feather="layers" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Nos matières
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Onglet Classement complet */}
            {activeTab === 'ranking' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Classement général de la classe
                  </h5>
                  <Badge bg="primary" className="px-3 py-2">
                    {studentsRanking.length} étudiants classés
                  </Badge>
                </div>

                <div className="table-responsive">
                  <Table className={`align-middle ${theme === "dark" ? "table-dark" : ""}`} hover>
                    <thead className="table-light">
                      <tr>
                        <th>Rang</th>
                        <th>Étudiant</th>
                        <th className="text-center">Moyenne</th>
                        <th className="text-center">Participation</th>
                        <th className="text-center">Points</th>
                        <th className="text-center">Grade</th>
                        <th className="text-center">Tendance</th>
                        <th className="text-center">Matière forte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsRanking.map((student) => (
                        <tr key={student.student_id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <Badge 
                                bg={getRankBadge(student.rank)}
                                className="me-2"
                                style={{ minWidth: '30px' }}
                              >
                                #{student.rank}
                              </Badge>
                              {student.rank_change !== 0 && (
                                <small className={`text-${student.rank_change > 0 ? 'success' : 'danger'}`}>
                                  {student.rank_change > 0 ? '+' : ''}{student.rank_change}
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {student.profil_url ? (
                                <Image
                                  src={student.profil_url}
                                  alt="Profil"
                                  width="32"
                                  height="32"
                                  className="rounded-circle me-2"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <div 
                                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
                                  style={{ width: '32px', height: '32px' }}
                                >
                                  <i data-feather="user" className="text-white" style={{ width: '16px', height: '16px' }} />
                                </div>
                              )}
                              <div>
                                <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {student.name}
                                </div>
                                <small className="text-muted">{student.matricule}</small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <div>
                              <div className={`fw-bold text-${student.average_score >= 60 ? 'success' : 'warning'}`}>
                                {student.average_score}%
                              </div>
                              <small className="text-muted">
                                {getPerformanceText(student.average_score)}
                              </small>
                            </div>
                          </td>
                          <td className="text-center">
                            <div>
                              <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {student.participation_rate}%
                              </div>
                              <small className="text-muted">
                                {student.evaluations_completed}/{student.total_evaluations}
                              </small>
                            </div>
                          </td>
                          <td className="text-center">
                            <div>
                              <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {student.points_obtained}
                              </div>
                              <small className="text-muted">
                                /{student.total_points}
                              </small>
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge bg={student.grade === 'A+' || student.grade === 'A' ? 'success' : 
                                       student.grade === 'B+' || student.grade === 'B' ? 'primary' : 
                                       student.grade === 'C+' || student.grade === 'C' ? 'warning' : 'danger'}>
                              {student.grade}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <div className={getTrendColor(student.trend)}>
                              <i data-feather={getTrendIcon(student.trend)} style={{ width: "16px", height: "16px" }}></i>
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge bg="info" className="small">
                              {student.best_subject}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}

            {/* Onglet Matières */}
            {activeTab === 'subjects' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Performance par matière
                  </h5>
                  <Badge bg="info" className="px-3 py-2">
                    {subjectStats.length} matières
                  </Badge>
                </div>

                <Row className="g-4">
                  {subjectStats.map((subject, index) => (
                    <Col key={subject.matiere_id} md={6} lg={4}>
                      <Card className={`h-100 border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                        <Card.Body>
                          <div className="d-flex align-items-center mb-3">
                            {subject.image_url ? (
                              <Image
                                src={subject.image_url}
                                alt={subject.name}
                                width="40"
                                height="40"
                                className="rounded me-3"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                className="rounded bg-primary d-flex align-items-center justify-content-center me-3"
                                style={{ width: '40px', height: '40px' }}
                              >
                                <i data-feather="book" className="text-white" style={{ width: '20px', height: '20px' }} />
                              </div>
                            )}
                            <div className="flex-grow-1">
                              <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {subject.name}
                              </h6>
                              <small className="text-muted">Coeff. {subject.coefficient}</small>
                            </div>
                            <Badge bg={index < 3 ? 'success' : index < 6 ? 'primary' : 'secondary'}>
                              #{index + 1}
                            </Badge>
                          </div>

                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-muted">Moyenne classe</small>
                              <small className={`fw-bold text-${subject.average_score >= 60 ? 'success' : 'warning'}`}>
                                {subject.average_score}%
                              </small>
                            </div>
                            <ProgressBar 
                              now={subject.average_score} 
                              variant={subject.average_score >= 60 ? 'success' : 'warning'}
                              style={{ height: '6px' }}
                            />
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Participation:</small>
                            <small className={theme === "dark" ? "text-light" : "text-dark"}>
                              {subject.participation_rate}%
                            </small>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <small className="text-muted">Difficulté:</small>
                            <Badge 
                              bg={subject.difficulty_level === 'Facile' ? 'success' : 
                                  subject.difficulty_level === 'Modérée' ? 'warning' : 'danger'}
                              className="small"
                            >
                              {subject.difficulty_level}
                            </Badge>
                          </div>

                          <div className="d-flex gap-2">
                            <div className="d-flex align-items-center">
                              <i data-feather="clipboard" className="me-1 text-muted" style={{ width: '12px', height: '12px' }}></i>
                              <small className="text-muted">{subject.total_evaluations}</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <i data-feather="book-open" className="me-1 text-muted" style={{ width: '12px', height: '12px' }}></i>
                              <small className="text-muted">{subject.total_cours}</small>
                            </div>
                            <div className={`d-flex align-items-center ${getTrendColor(subject.trend)}`}>
                              <i data-feather={getTrendIcon(subject.trend)} style={{ width: '12px', height: '12px' }}></i>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Onglet Graphiques */}
            {activeTab === 'charts' && (
              <Row>
                <Col lg={6} className="mb-4">
                  <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="activity" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Évolution mensuelle
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {classEvolution.monthly_evolution && classEvolution.monthly_evolution.length > 0 ? (
                        <div style={{ height: '300px' }}>
                          <Line data={monthlyEvolutionData} options={chartOptions} />
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i data-feather="activity" className="text-muted" style={{ width: "48px", height: "48px" }}></i>
                          <p className="text-muted mt-2">Pas de données d'évolution</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={6} className="mb-4">
                  <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="pie-chart" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Répartition des performances
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {chartData.performance_distribution ? (
                        <div style={{ height: '300px' }}>
                          <Pie data={performanceDistributionData} options={{
                            ...chartOptions,
                            plugins: {
                              ...chartOptions.plugins,
                              legend: {
                                position: 'bottom',
                                labels: {
                                  color: theme === 'dark' ? '#ffffff' : '#666666',
                                  usePointStyle: true,
                                  padding: 15
                                }
                              }
                            }
                          }} />
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i data-feather="pie-chart" className="text-muted" style={{ width: "48px", height: "48px" }}></i>
                          <p className="text-muted mt-2">Pas de données de répartition</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={8} className="mb-4">
                  <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="target" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Performance par matière (Radar)
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {subjectStats.length > 0 ? (
                        <div style={{ height: '400px' }}>
                          <Radar data={subjectRadarData} options={radarOptions} />
                        </div>
                      ) : (
                        <div className="text-center py-5">
                          <i data-feather="target" className="text-muted" style={{ width: "48px", height: "48px" }}></i>
                          <p className="text-muted mt-2">Pas de données de matières</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4} className="mb-4">
                  <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="users" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Participation classe
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {participationStats.distribution ? (
                        <div>
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-success">Excellente (+90%)</small>
                              <small className="fw-bold">{participationStats.distribution.excellent || 0}</small>
                            </div>
                            <ProgressBar 
                              now={(participationStats.distribution.excellent / generalStats.total_students) * 100} 
                              variant="success" 
                              style={{ height: '4px' }} 
                            />
                          </div>
                          
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-primary">Bonne (70-90%)</small>
                              <small className="fw-bold">{participationStats.distribution.good || 0}</small>
                            </div>
                            <ProgressBar 
                              now={(participationStats.distribution.good / generalStats.total_students) * 100} 
                              variant="primary" 
                              style={{ height: '4px' }} 
                            />
                          </div>

                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-warning">Moyenne (50-70%)</small>
                              <small className="fw-bold">{participationStats.distribution.average || 0}</small>
                            </div>
                            <ProgressBar 
                              now={(participationStats.distribution.average / generalStats.total_students) * 100} 
                              variant="warning" 
                              style={{ height: '4px' }} 
                            />
                          </div>

                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-danger">Faible (-50%)</small>
                              <small className="fw-bold">{participationStats.distribution.poor || 0}</small>
                            </div>
                            <ProgressBar 
                              now={(participationStats.distribution.poor / generalStats.total_students) * 100} 
                              variant="danger" 
                              style={{ height: '4px' }} 
                            />
                          </div>

                          <hr className="my-3" />
                          
                          <div className="text-center">
                            <h5 className="text-primary mb-0">
                              {participationStats.class_participation_rate}%
                            </h5>
                            <small className="text-muted">Participation moyenne classe</small>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="users" className="text-muted" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted mt-2">Pas de données de participation</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Notifications Toast */}
        <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 1050 }}>
          <Toast
            show={showToast}
            onClose={() => setShowToast(false)}
            delay={4000}
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
    </EtudiantLayout>
  );
}