import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Badge, Alert, Spinner, Toast, ToastContainer, 
  ProgressBar, Image, Table
} from "react-bootstrap";
import { Link } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from "../../contexts/AuthContext";

export default function DashboardEtudiant() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [classroom, setClassroom] = useState({});
  const [generalStats, setGeneralStats] = useState({});
  const [upcomingEvaluations, setUpcomingEvaluations] = useState([]);
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [recentCours, setRecentCours] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [chartData, setChartData] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [myRanking, setMyRanking] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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

  // Charger les données du dashboard
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/etudiant/dashboard');
      
      if (response.data.status === 'success') {
        setClassroom(response.data.classroom);
        setGeneralStats(response.data.general_stats);
        setUpcomingEvaluations(response.data.upcoming_evaluations);
        setRecentEvaluations(response.data.recent_evaluations);
        setRecentCours(response.data.recent_cours);
        setRecentActivity(response.data.recent_activity);
        setSubjectProgress(response.data.subject_progress);
        setNotifications(response.data.notifications);
        setChartData(response.data.chart_data);
        setCalendarEvents(response.data.calendar_events);
        setMyRanking(response.data.my_ranking);
      } else {
        showToastMessage(response.data.message || "Erreur lors du chargement du dashboard", 'danger');
      }
    } catch (err) {
      console.error('Erreur dashboard:', err);
      showToastMessage("Erreur lors du chargement des données", 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    feather.replace();
  }, [generalStats, upcomingEvaluations, recentActivity]);

  // Fonctions utilitaires
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPerformanceColor = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'info';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'evaluation_completed': return 'check-circle';
      case 'cours_published': return 'book-open';
      case 'evaluation_started': return 'play-circle';
      default: return 'activity';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return 'alert-triangle';
      case 'info': return 'info';
      case 'success': return 'check-circle';
      default: return 'bell';
    }
  };

  // Configuration des graphiques
  const chartColors = {
    primary: '#007bff',
    success: '#28a745',
    info: '#17a2b8',
    warning: '#ffc107',
    danger: '#dc3545'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded shadow border ${theme === "dark" ? "bg-dark text-light border-secondary" : "bg-white"}`}>
          <p className="mb-1 fw-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.name.includes('score') || entry.name.includes('moyenne') ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <EtudiantLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement de votre dashboard...</p>
        </div>
      </EtudiantLayout>
    );
  }

  return (
    <EtudiantLayout>
      <Container className="py-4">
        {/* Header avec salutation */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h1 className={`h3 mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                {getGreeting()}, {user?.name}! 👋
              </h1>
              <p className={`mb-1 ${theme === 'dark' ? 'text-light' : 'text-muted'}`}>
                <span className="">Nous sommes </span>
                {currentTime.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} et il est  {currentTime.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Voici un aperçu de votre progression • {classroom.name}
              </p>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary"
                onClick={fetchDashboardData}
                title="Actualiser"
                size="sm"
              >
                <i data-feather="refresh-cw" style={{ width: "16px", height: "16px" }}></i>
              </Button>
            </div>
          </div>

          {/* Notifications importantes */}
          {notifications.length > 0 && (
            <Alert variant="info" className="mt-3 mb-0">
              <div className="d-flex align-items-start">
                <i data-feather="bell" className="me-2 mt-1" style={{ width: "16px", height: "16px" }}></i>
                <div className="flex-grow-1">
                  <h6 className="mb-2">Notifications importantes</h6>
                  {notifications.slice(0, 3).map((notification, index) => (
                    <div key={index} className="mb-2 pb-2 border-bottom border-light">
                      <div className="d-flex align-items-center">
                        <i 
                          data-feather={getNotificationIcon(notification.type)} 
                          className="me-2" 
                          style={{ width: "14px", height: "14px" }}
                        ></i>
                        <strong>{notification.title}</strong>
                      </div>
                      <small className="text-muted d-block mt-1">{notification.message}</small>
                      {notification.action_url && (
                        <div className="mt-1">
                          <Button 
                            as={Link} 
                            to={notification.action_url} 
                            variant="outline-info" 
                            size="sm"
                          >
                            {notification.action_text}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Alert>
          )}
        </div>

        {/* Statistiques principales */}
        <Row className="g-4 mb-4">
          <Col md={3}>
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avatar-sm rounded-circle bg-primary d-flex align-items-center justify-content-center">
                      <i data-feather="clipboard" className="text-white" style={{ width: "20px", height: "20px" }}></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h4 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {generalStats.total_evaluations || 0}
                    </h4>
                    <p className="text-muted mb-0">Évaluations totales</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avatar-sm rounded-circle bg-success d-flex align-items-center justify-content-center">
                      <i data-feather="trending-up" className="text-white" style={{ width: "20px", height: "20px" }}></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h4 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {generalStats.moyenne_generale || 0}%
                    </h4>
                    <p className="text-muted mb-0">Moyenne générale</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avatar-sm rounded-circle bg-info d-flex align-items-center justify-content-center">
                      <i data-feather="award" className="text-white" style={{ width: "20px", height: "20px" }}></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h4 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      #{myRanking.my_rank || '--'}
                    </h4>
                    <p className="text-muted mb-0">Rang dans la classe</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avatar-sm rounded-circle bg-warning d-flex align-items-center justify-content-center">
                      <i data-feather="activity" className="text-white" style={{ width: "20px", height: "20px" }}></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h4 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {generalStats.taux_participation || 0}%
                    </h4>
                    <p className="text-muted mb-0">Taux participation</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          {/* Colonne principale */}
          <Col lg={8}>
            {/* Graphique d'évolution */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="trending-up" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  Évolution de vos performances
                </h5>
              </Card.Header>
              <Card.Body>
                {chartData.monthly_evolution && chartData.monthly_evolution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.monthly_evolution}>
                      <defs>
                        <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#495057' : '#e9ecef'} />
                      <XAxis 
                        dataKey="month" 
                        stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="average" 
                        stroke={chartColors.primary} 
                        fillOpacity={1} 
                        fill="url(#colorAverage)" 
                        name="Moyenne"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5">
                    <i data-feather="trending-up" className="text-muted mb-2" style={{ width: "48px", height: "48px" }}></i>
                    <p className="text-muted">Pas encore assez de données pour afficher l'évolution</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Progression par matière */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="bar-chart-2" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  Performance par matière
                </h5>
              </Card.Header>
              <Card.Body>
                {subjectProgress && subjectProgress.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={subjectProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#495057' : '#e9ecef'} />
                      <XAxis 
                        dataKey="nom" 
                        stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                      />
                      <YAxis 
                        stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="moyenne" 
                        fill={chartColors.success}
                        name="Moyenne"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5">
                    <i data-feather="bar-chart-2" className="text-muted mb-2" style={{ width: "48px", height: "48px" }}></i>
                    <p className="text-muted">Aucune donnée de performance par matière</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Activité récente */}
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="activity" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  Activité récente
                </h5>
              </Card.Header>
              <Card.Body>
                {recentActivity.length > 0 ? (
                  <div className="timeline">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="timeline-item d-flex mb-3">
                        <div className="flex-shrink-0">
                          <div className="avatar-xs rounded-circle bg-light d-flex align-items-center justify-content-center">
                            <i 
                              data-feather={getActivityIcon(activity.type)} 
                              className="text-muted" 
                              style={{ width: "14px", height: "14px" }}
                            ></i>
                          </div>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {activity.title}
                          </div>
                          <p className="text-muted mb-1">{activity.description}</p>
                          <small className="text-muted">
                            {activity.matiere} • {formatTime(activity.date)}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i data-feather="activity" className="text-muted mb-2" style={{ width: "32px", height: "32px" }}></i>
                    <p className="text-muted mb-0">Aucune activité récente</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Colonne sidebar */}
          <Col lg={4}>
            {/* Évaluations à venir */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="clock" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  Prochaines évaluations
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {upcomingEvaluations.length > 0 ? (
                  upcomingEvaluations.map((evaluation, index) => (
                    <div key={evaluation.id} className={`p-3 ${index < upcomingEvaluations.length - 1 ? 'border-bottom' : ''}`}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {evaluation.titre}
                        </h6>
                        <Badge bg="warning" className="ms-2">
                          {evaluation.temps_avant_debut_human}
                        </Badge>
                      </div>
                      <p className="text-muted mb-1">{evaluation.matiere?.nom}</p>
                      <small className="text-muted">
                        {formatTime(evaluation.date_debut)} • {evaluation.duree_minutes} min
                      </small>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center">
                    <i data-feather="clock" className="text-muted mb-2" style={{ width: "32px", height: "32px" }}></i>
                    <p className="text-muted mb-0">Aucune évaluation prochaine</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Cours récents */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="book-open" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  Cours récents
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {recentCours.length > 0 ? (
                  recentCours.map((cours, index) => (
                    <div key={cours.id} className={`p-3 ${index < recentCours.length - 1 ? 'border-bottom' : ''}`}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {cours.titre.length > 30 ? cours.titre.substring(0, 30) + "..." : cours.titre}
                          </h6>
                          <p className="text-muted mb-1">{cours.matiere?.nom}</p>
                          <small className="text-muted">{cours.temps_depuis_publication}</small>
                        </div>
                        <Button 
                          as={Link} 
                          to={`/etudiant/show/cours/${cours.id}`}
                          variant="outline-primary" 
                          size="sm"
                        >
                          <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center">
                    <i data-feather="book-open" className="text-muted mb-2" style={{ width: "32px", height: "32px" }}></i>
                    <p className="text-muted mb-0">Aucun cours récent</p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Mon classement */}
            {myRanking.my_rank && (
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Header className="border-0">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i data-feather="award" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                    Mon classement
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center mb-3">
                    <h2 className="text-primary mb-0">#{myRanking.my_rank}</h2>
                    <p className="text-muted">sur {myRanking.total_students} étudiants</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Ma moyenne</small>
                      <small className={`fw-bold text-${getPerformanceColor(myRanking.my_average)}`}>
                        {myRanking.my_average}%
                      </small>
                    </div>
                    <ProgressBar 
                      now={myRanking.my_average} 
                      variant={getPerformanceColor(myRanking.my_average)}
                      style={{ height: '6px' }}
                    />
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Moyenne de classe:</span>
                    <span className={theme === "dark" ? "text-light" : "text-dark"}>
                      {myRanking.class_average}%
                    </span>
                  </div>

                  {myRanking.top_3 && (
                    <div>
                      <h6 className={theme === "dark" ? "text-light" : "text-dark"}>Top 3 de la classe</h6>
                      {myRanking.top_3.map((student, index) => (
                        <div key={student.student_id} className="d-flex align-items-center mb-2">
                          <Badge bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'info'} className="me-2">
                            #{index + 1}
                          </Badge>
                          <span className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {student.name} ({student.average}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

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