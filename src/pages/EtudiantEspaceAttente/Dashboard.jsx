import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Badge, Alert, Spinner, Toast, ToastContainer, 
  ProgressBar, Tab, Tabs, Table, Image, Modal
} from "react-bootstrap";
import feather from "feather-icons";
import api from "../../services/api";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import WaitingAreaLayout from "../../layouts/EtudiantEspaceAttente/Layout";

export default function PendingStudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [user, setUser] = useState({});
  const [classroom, setClassroom] = useState({});
  const [studentInfo, setStudentInfo] = useState({});
  const [platformOverview, setPlatformOverview] = useState({});
  const [classroomPreview, setClassroomPreview] = useState({});
  const [platformStats, setPlatformStats] = useState({});
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [userGuide, setUserGuide] = useState({});
  const [waitingTimeEstimate, setWaitingTimeEstimate] = useState({});
  const [chartData, setChartData] = useState({});

  // États UI
  const [activeTab, setActiveTab] = useState('status');
  const [showGuideModal, setShowGuideModal] = useState(false);

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
      const response = await api.get('/etudiant/pending/dashboard');
      
      if (response.data.status === 'success') {
        setUser(response.data.user);
        setClassroom(response.data.classroom);
        setStudentInfo(response.data.student_info);
        setPlatformOverview(response.data.platform_overview);
        setClassroomPreview(response.data.classroom_preview);
        setPlatformStats(response.data.platform_stats);
        setAvailableFeatures(response.data.available_features);
        setUserGuide(response.data.user_guide);
        setWaitingTimeEstimate(response.data.waiting_time_estimate);
        setChartData(response.data.chart_data);
      } else {
        showToastMessage(response.data.message || "Erreur lors du chargement", 'danger');
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

  useEffect(() => {
    feather.replace();
  }, [studentInfo, platformStats, availableFeatures]);

  // Configuration des graphiques
  const chartColors = {
    primary: '#007bff',
    success: '#28a745',
    info: '#17a2b8',
    warning: '#ffc107',
    danger: '#dc3545',
    secondary: '#6c757d'
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
      <WaitingAreaLayout>
      <div className={`min-vh-100 ${theme === "dark" ? "bg-dark" : "bg-light"}`}>
        <Container className="py-5">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement de votre espace d'attente...</p>
          </div>
        </Container>
      </div>
      </WaitingAreaLayout>
    );
  }

  return (
    <WaitingAreaLayout>
      <div className={`min-vh-100 ${theme === "dark" ? "bg-dark" : "bg-light"}`}>
        <Container className="py-4">
          {/* Header de bienvenue */}
          <div className="mb-4">
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center">
                  <div className={`me-4 p-3 rounded-circle ${theme === "dark" ? "bg-warning bg-opacity-25" : "bg-warning bg-opacity-10"}`}>
                    <i data-feather="clock" className="text-warning" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                  <div className="flex-grow-1">
                    <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Bienvenue, {studentInfo.name}!
                    </h2>
                    <p className={`mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                      Votre compte est en cours d'approbation • {classroom.name}
                    </p>
                    <Badge bg="warning" className="px-3 py-2">
                      <i data-feather="clock" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                      En attente d'approbation
                    </Badge>
                  </div>
                  <div className="text-end">
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
              </Card.Body>
            </Card>
          </div>

          {/* Barre de progression principale */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="trending-up" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  Progression de votre approbation
                </h5>
                <Badge bg="info" className="px-3 py-2">
                  {studentInfo.progress_percentage}% complété
                </Badge>
              </div>
              
              <ProgressBar 
                now={studentInfo.progress_percentage} 
                variant="info"
                style={{ height: '12px' }}
                className="mb-3"
              />
              
              <div className="d-flex justify-content-between small text-muted">
                <span>Inscription soumise</span>
                <span>Approbation finale</span>
              </div>
            </Card.Body>
          </Card>

          {/* Étapes d'approbation */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0">
                <i data-feather="list" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                Étapes du processus d'approbation
              </h5>
            </Card.Header>
            <Card.Body>
              {studentInfo.approval_steps && studentInfo.approval_steps.map((step, index) => (
                <div key={step.step} className={`d-flex align-items-center mb-3 ${index < studentInfo.approval_steps.length - 1 ? 'pb-3 border-bottom' : ''}`}>
                  <div className={`me-3 rounded-circle d-flex align-items-center justify-content-center ${
                    step.completed 
                      ? 'bg-success text-white' 
                      : step.step === studentInfo.current_step 
                        ? 'bg-warning text-white' 
                        : 'bg-light text-muted'
                  }`} style={{ width: '40px', height: '40px' }}>
                    {step.completed ? (
                      <i data-feather="check" style={{ width: "20px", height: "20px" }}></i>
                    ) : step.step === studentInfo.current_step ? (
                      <i data-feather="clock" style={{ width: "20px", height: "20px" }}></i>
                    ) : (
                      <span className="fw-bold">{step.step}</span>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {step.title}
                    </h6>
                    <p className="text-muted mb-0">{step.description}</p>
                    {step.date && (
                      <small className="text-success">
                        <i data-feather="check-circle" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                        Complété le {new Date(step.date).toLocaleDateString('fr-FR')}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Temps d'attente estimé */}
          {waitingTimeEstimate.estimated_days_remaining && (
            <Alert variant="info" className="mb-4">
              <div className="d-flex align-items-center">
                <i data-feather="info" className="me-3" style={{ width: "24px", height: "24px" }}></i>
                <div>
                  <h6 className="mb-2">Temps d'attente estimé</h6>
                  <p className="mb-1">
                    <strong>{waitingTimeEstimate.estimated_days_remaining} jour{waitingTimeEstimate.estimated_days_remaining > 1 ? 's' : ''}</strong> restant{waitingTimeEstimate.estimated_days_remaining > 1 ? 's' : ''} avant l'approbation
                  </p>
                  <small className="text-muted">
                    Position dans la file d'attente: #{waitingTimeEstimate.current_queue_position} • 
                    Confiance: {waitingTimeEstimate.confidence_level}%
                  </small>
                </div>
              </div>
            </Alert>
          )}

          {/* Onglets principaux */}
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Tabs 
                activeKey={activeTab} 
                onSelect={(k) => setActiveTab(k)}
                className="border-0"
              >
                <Tab eventKey="status" title={
                  <span>
                    <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Mon Statut
                  </span>
                } />
                <Tab eventKey="platform" title={
                  <span>
                    <i data-feather="monitor" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    La Plateforme
                  </span>
                } />
                <Tab eventKey="classroom" title={
                  <span>
                    <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Ma Classe
                  </span>
                } />
                <Tab eventKey="features" title={
                  <span>
                    <i data-feather="star" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Fonctionnalités
                  </span>
                } />
              </Tabs>
            </Card.Header>

            <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
              {/* Onglet Mon Statut */}
              {activeTab === 'status' && (
                <Row>
                  <Col lg={8}>
                    <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Informations de votre compte</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row className="g-3">
                          <Col md={6}>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Matricule:</span>
                              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {studentInfo.matricule}
                              </span>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Email:</span>
                              <span className={theme === "dark" ? "text-light" : "text-dark"}>
                                {studentInfo.email}
                              </span>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Classe assignée:</span>
                              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {studentInfo.classroom_name}
                              </span>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Date d'inscription:</span>
                              <span className={theme === "dark" ? "text-light" : "text-dark"}>
                                {new Date(studentInfo.registration_date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Facteurs influençant le délai</h6>
                      </Card.Header>
                      <Card.Body>
                        {waitingTimeEstimate.factors_affecting_delay && waitingTimeEstimate.factors_affecting_delay.map((factor, index) => (
                          <div key={index} className={`d-flex justify-content-between align-items-center mb-2 ${index < waitingTimeEstimate.factors_affecting_delay.length - 1 ? 'pb-2 border-bottom' : ''}`}>
                            <div>
                              <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {factor.factor}
                              </div>
                              <small className="text-muted">{factor.description}</small>
                            </div>
                            <Badge bg={
                              factor.impact === 'Élevée' ? 'danger' : 
                              factor.impact === 'Modérée' ? 'warning' : 'success'
                            }>
                              {factor.impact}
                            </Badge>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={4}>
                    <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Progression visuelle</h6>
                      </Card.Header>
                      <Card.Body>
                        {chartData.classroom_capacity && (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={chartData.classroom_capacity}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                dataKey="value"
                              >
                                {chartData.classroom_capacity.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                        <div className="mt-3">
                          {chartData.classroom_capacity && chartData.classroom_capacity.map((item, index) => (
                            <div key={index} className="d-flex align-items-center mb-2">
                              <div 
                                className="rounded me-2"
                                style={{ 
                                  width: '12px', 
                                  height: '12px', 
                                  backgroundColor: item.color 
                                }}
                              ></div>
                              <small className={theme === "dark" ? "text-light" : "text-dark"}>
                                {item.name}: {item.value}
                              </small>
                            </div>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>

                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Actions recommandées</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-grid gap-2">
                          <Button 
                            variant="outline-info"
                            onClick={() => setShowGuideModal(true)}
                            size="sm"
                          >
                            <i data-feather="book-open" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                            Consulter le guide
                          </Button>
                          <Button 
                            variant="outline-secondary"
                            onClick={fetchDashboardData}
                            size="sm"
                          >
                            <i data-feather="refresh-cw" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                            Vérifier le statut
                          </Button>
                        </div>
                        
                        <div className="mt-3 p-3 rounded bg-info bg-opacity-10">
                          <small className={theme === "dark" ? "text-light" : "text-dark"}>
                            <i data-feather="info" className="me-2" style={{ width: "12px", height: "12px" }}></i>
                            Vous recevrez un email dès que votre compte sera approuvé.
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Onglet Plateforme */}
              {activeTab === 'platform' && (
                <Row>
                  <Col lg={8}>
                    <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Présentation de la plateforme</h6>
                      </Card.Header>
                      <Card.Body>
                        <h5 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {platformOverview.name} v{platformOverview.version}
                        </h5>
                        <p className={theme === "dark" ? "text-light" : "text-dark"}>
                          {platformOverview.description}
                        </p>
                        
                        <div className="mb-4">
                          <h6 className={theme === "dark" ? "text-light" : "text-dark"}>Fonctionnalités principales:</h6>
                          <Row className="g-2">
                            {platformOverview.features && platformOverview.features.map((feature, index) => (
                              <Col key={index} md={6}>
                                <div className="d-flex align-items-center">
                                  <i data-feather="check" className="text-success me-2" style={{ width: "16px", height: "16px" }}></i>
                                  <small className={theme === "dark" ? "text-light" : "text-dark"}>{feature}</small>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </div>

                        <div className="mb-4">
                          <h6 className={theme === "dark" ? "text-light" : "text-dark"}>Avantages pour vous:</h6>
                          <Row className="g-2">
                            {platformOverview.benefits && platformOverview.benefits.map((benefit, index) => (
                              <Col key={index} md={6}>
                                <div className="d-flex align-items-center">
                                  <i data-feather="star" className="text-warning me-2" style={{ width: "16px", height: "16px" }}></i>
                                  <small className={theme === "dark" ? "text-light" : "text-dark"}>{benefit}</small>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      </Card.Body>
                    </Card>

                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Activité de la plateforme (dernières semaines)</h6>
                      </Card.Header>
                      <Card.Body>
                        {chartData.weekly_platform_activity && (
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData.weekly_platform_activity}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#495057' : '#e9ecef'} />
                              <XAxis 
                                dataKey="week" 
                                stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                              />
                              <YAxis 
                                stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="cours_published" stackId="1" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.6} name="Cours publiés" />
                              <Area type="monotone" dataKey="evaluations_completed" stackId="1" stroke={chartColors.success} fill={chartColors.success} fillOpacity={0.6} name="Évaluations réalisées" />
                              <Area type="monotone" dataKey="students_active" stackId="1" stroke={chartColors.info} fill={chartColors.info} fillOpacity={0.6} name="Étudiants actifs" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={4}>
                    <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Statistiques globales</h6>
                      </Card.Header>
                      <Card.Body>
                        {platformStats.global_stats && (
                          <div className="d-grid gap-3">
                            <div className="text-center p-3 rounded bg-primary bg-opacity-10">
                              <h4 className="text-primary mb-0">{platformStats.global_stats.total_students?.toLocaleString()}</h4>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Étudiants inscrits</small>
                            </div>
                            <div className="text-center p-3 rounded bg-success bg-opacity-10">
                              <h4 className="text-success mb-0">{platformStats.global_stats.total_teachers}</h4>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Formateurs actifs</small>
                            </div>
                            <div className="text-center p-3 rounded bg-info bg-opacity-10">
                              <h4 className="text-info mb-0">{platformStats.global_stats.total_cours?.toLocaleString()}</h4>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Cours disponibles</small>
                            </div>
                            <div className="text-center p-3 rounded bg-warning bg-opacity-10">
                              <h4 className="text-warning mb-0">{platformStats.global_stats.total_evaluations?.toLocaleString()}</h4>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Évaluations créées</small>
                            </div>
                          </div>
                        )}
                      </Card.Body>
                    </Card>

                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Performances</h6>
                      </Card.Header>
                      <Card.Body>
                        {platformStats.performance_stats && (
                          <div className="d-grid gap-2">
                            <div className="d-flex justify-content-between">
                              <small className="text-muted">Taux de réussite moyen:</small>
                              <small className="text-success fw-bold">{platformStats.performance_stats.average_success_rate}%</small>
                            </div>
                            <div className="d-flex justify-content-between">
                              <small className="text-muted">Complétion des cours:</small>
                              <small className="text-info fw-bold">{platformStats.performance_stats.course_completion_rate}%</small>
                            </div>
                            <div className="d-flex justify-content-between">
                              <small className="text-muted">Satisfaction étudiants:</small>
                              <small className="text-warning fw-bold">{platformStats.performance_stats.student_satisfaction}/5</small>
                            </div>
                            <div className="d-flex justify-content-between">
                              <small className="text-muted">Disponibilité:</small>
                              <small className="text-success fw-bold">{platformStats.performance_stats.platform_uptime}%</small>
                            </div>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Onglet Ma Classe */}
              {activeTab === 'classroom' && (
                <Row>
                  <Col lg={8}>
                    <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Aperçu de votre classe: {classroom.name}</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row className="g-3 mb-4">
                          <Col md={4}>
                            <div className="text-center p-3 rounded bg-primary bg-opacity-10">
                              <h4 className="text-primary mb-0">{classroomPreview.students_stats?.active_students}</h4>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Étudiants actifs</small>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center p-3 rounded bg-success bg-opacity-10">
                              <h4 className="text-success mb-0">{classroomPreview.academic_content?.total_subjects}</h4>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Matières</small>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center p-3 rounded bg-info bg-opacity-10">
                              <h4 className="text-info mb-0">{classroomPreview.academic_content?.total_cours}</h4>
                              <small className={theme === "dark" ? "text-light" : "text-muted"}>Cours disponibles</small>
                            </div>
                          </Col>
                        </Row>

                        <div className="mb-4">
                          <h6 className={theme === "dark" ? "text-light" : "text-dark"}>Matières de votre classe:</h6>
                          <Row className="g-3">
                            {classroomPreview.subjects_preview && classroomPreview.subjects_preview.map((subject) => (
                              <Col key={subject.id} md={6}>
                                <Card className={`border ${theme === "dark" ? "bg-dark border-secondary" : "bg-white"} h-100`}>
                                  <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                        {subject.name}
                                      </h6>
                                      <Badge bg="info">Coef. {subject.coefficient}</Badge>
                                    </div>
                                    <div className="d-flex gap-3 text-center">
                                      <div>
                                        <small className="text-muted d-block">Cours</small>
                                        <small className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                          {subject.cours_count}
                                        </small>
                                      </div>
                                      <div>
                                        <small className="text-muted d-block">Éval.</small>
                                        <small className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                          {subject.evaluations_count}
                                        </small>
                                      </div>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      </Card.Body>
                    </Card>

                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Progression moyenne de la classe</h6>
                      </Card.Header>
                      <Card.Body>
                        {chartData.class_progression && (
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData.class_progression}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#495057' : '#e9ecef'} />
                              <XAxis 
                                dataKey="month" 
                                stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                              />
                              <YAxis 
                                stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Line type="monotone" dataKey="average" stroke={chartColors.success} strokeWidth={3} name="Moyenne de classe" />
                              <Line type="monotone" dataKey="participation" stroke={chartColors.info} strokeWidth={2} name="Taux de participation" />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={4}>
                    <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Répartition des matières</h6>
                      </Card.Header>
                      <Card.Body>
                        {chartData.subject_coefficients && (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={chartData.subject_coefficients}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                dataKey="value"
                              >
                                {chartData.subject_coefficients.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                        <div className="mt-3">
                          {chartData.subject_coefficients && chartData.subject_coefficients.slice(0, 5).map((item, index) => (
                            <div key={index} className="d-flex align-items-center justify-content-between mb-2">
                              <div className="d-flex align-items-center">
                                <div 
                                  className="rounded me-2"
                                  style={{ 
                                    width: '12px', 
                                    height: '12px', 
                                    backgroundColor: item.color 
                                  }}
                                ></div>
                                <small className={theme === "dark" ? "text-light" : "text-dark"}>
                                  {item.name}
                                </small>
                              </div>
                              <Badge bg="secondary" className="small">
                                Coef. {item.value}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </Card.Body>
                    </Card>

                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Activité récente de la classe</h6>
                      </Card.Header>
                      <Card.Body>
                        {classroomPreview.classroom_activity && (
                          <div className="d-grid gap-2">
                            <div className="d-flex justify-content-between">
                              <small className="text-muted">Cours récents:</small>
                              <small className={`fw-bold text-success`}>
                                {classroomPreview.classroom_activity.recent_cours_published}
                              </small>
                            </div>
                            <div className="d-flex justify-content-between">
                              <small className="text-muted">Évaluations à venir:</small>
                              <small className={`fw-bold text-info`}>
                                {classroomPreview.classroom_activity.upcoming_evaluations}
                              </small>
                            </div>
                            <div className="d-flex justify-content-between">
                              <small className="text-muted">Discussions actives:</small>
                              <small className={`fw-bold text-primary`}>
                                {classroomPreview.classroom_activity.active_discussions}
                              </small>
                            </div>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Onglet Fonctionnalités */}
              {activeTab === 'features' && (
                <Row>
                  <Col lg={12}>
                    {availableFeatures.map((category, categoryIndex) => (
                      <Card key={categoryIndex} className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                        <Card.Header className="border-0">
                          <h6 className="mb-0 d-flex align-items-center">
                            <i data-feather={category.icon} className="me-2" style={{ width: "20px", height: "20px" }}></i>
                            {category.category}
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <Row className="g-4">
                            {category.features.map((feature, featureIndex) => (
                              <Col key={featureIndex} md={6}>
                                <Card className={`border h-100 ${theme === "dark" ? "bg-dark border-secondary" : "bg-white"}`}>
                                  <Card.Body className="p-3">
                                    <h6 className={`mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                      {feature.name}
                                    </h6>
                                    <p className="text-muted mb-3 small">
                                      {feature.description}
                                    </p>
                                    <div className="d-flex flex-wrap gap-1">
                                      {feature.benefits.map((benefit, benefitIndex) => (
                                        <Badge key={benefitIndex} bg="outline-info" className="small">
                                          {benefit}
                                        </Badge>
                                      ))}
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* Modal Guide d'utilisation */}
          <Modal
            show={showGuideModal}
            onHide={() => setShowGuideModal(false)}
            size="lg"
            centered
            contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
          >
            <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
              <Modal.Title>
                <i data-feather="book-open" className="me-2" style={{ width: "20px", height: "20px" }} />
                Guide d'utilisation
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Tabs defaultActiveKey="getting-started" className="mb-3">
                <Tab eventKey="getting-started" title="Premiers pas">
                  <div className="mb-4">
                    <h6 className={theme === "dark" ? "text-light" : "text-dark"}>
                      Étapes après approbation:
                    </h6>
                    {userGuide.getting_started && userGuide.getting_started.map((step, index) => (
                      <div key={index} className="d-flex align-items-start mb-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '30px', height: '30px', fontSize: '14px' }}>
                          {step.step}
                        </div>
                        <div>
                          <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {step.title}
                          </h6>
                          <p className="text-muted mb-1">{step.description}</p>
                          <small className="text-info">Durée estimée: {step.duration}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </Tab>
                <Tab eventKey="best-practices" title="Bonnes pratiques">
                  <div className="mb-4">
                    <h6 className={theme === "dark" ? "text-light" : "text-dark"}>
                      Conseils pour bien utiliser la plateforme:
                    </h6>
                    {userGuide.best_practices && userGuide.best_practices.map((practice, index) => (
                      <div key={index} className="d-flex align-items-start mb-2">
                        <i data-feather="check" className="text-success me-2 mt-1" style={{ width: "16px", height: "16px" }}></i>
                        <small className={theme === "dark" ? "text-light" : "text-dark"}>{practice}</small>
                      </div>
                    ))}
                  </div>
                </Tab>
                <Tab eventKey="technical" title="Prérequis techniques">
                  <div className="mb-4">
                    <h6 className={theme === "dark" ? "text-light" : "text-dark"}>
                      Configuration minimale requise:
                    </h6>
                    {userGuide.technical_requirements && userGuide.technical_requirements.map((req, index) => (
                      <div key={index} className="d-flex align-items-start mb-2">
                        <i data-feather="monitor" className="text-info me-2 mt-1" style={{ width: "16px", height: "16px" }}></i>
                        <small className={theme === "dark" ? "text-light" : "text-dark"}>{req}</small>
                      </div>
                    ))}
                  </div>
                </Tab>
              </Tabs>

              <div className="p-3 rounded bg-info bg-opacity-10">
                <h6 className="text-info mb-2">
                  <i data-feather="help-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Besoin d'aide?
                </h6>
                <p className="mb-2 small">Des ressources d'aide seront disponibles après l'activation de votre compte:</p>
                {userGuide.support_resources && userGuide.support_resources.map((resource, index) => (
                  <div key={index} className="mb-1">
                    <i data-feather={resource.type === 'document' ? 'file-text' : resource.type === 'video' ? 'video' : 'message-circle'} 
                      className="me-2 text-muted" 
                      style={{ width: "12px", height: "12px" }}></i>
                    <small className={theme === "dark" ? "text-light" : "text-dark"}>
                      <strong>{resource.title}</strong> - {resource.description}
                    </small>
                  </div>
                ))}
              </div>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button variant="primary" onClick={() => setShowGuideModal(false)}>
                Compris
              </Button>
            </Modal.Footer>
          </Modal>

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
      </div>
    </WaitingAreaLayout>
  );
}