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
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function StatistiquesEtudiant() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données du contrôleur
  const [classroom, setClassroom] = useState({});
  const [personalStats, setPersonalStats] = useState({});
  const [temporalEvolution, setTemporalEvolution] = useState({});
  const [subjectAnalysis, setSubjectAnalysis] = useState([]);
  const [classComparison, setClassComparison] = useState({});
  const [skillsAnalysis, setSkillsAnalysis] = useState({});
  const [trends, setTrends] = useState({});
  const [performanceDetails, setPerformanceDetails] = useState([]);
  const [advancedChartData, setAdvancedChartData] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);

  // États de l'interface
  const [activeTab, setActiveTab] = useState('overview');

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

  // Charger les statistiques détaillées
  const fetchDetailedStatistics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/etudiant/statistics');
      
      if (response.data.status === 'success') {
        setClassroom(response.data.classroom);
        setPersonalStats(response.data.personal_stats);
        setTemporalEvolution(response.data.temporal_evolution);
        setSubjectAnalysis(response.data.subject_analysis);
        setClassComparison(response.data.class_comparison);
        setSkillsAnalysis(response.data.skills_analysis);
        setTrends(response.data.trends);
        setPerformanceDetails(response.data.performance_details);
        setAdvancedChartData(response.data.advanced_chart_data);
        setRecommendations(response.data.recommendations);
        setFullHistory(response.data.full_history);
      } else {
        showToastMessage(response.data.message || "Erreur lors du chargement des statistiques", 'danger');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      const errorMessage = err.response?.data?.message || "Erreur lors du chargement des statistiques";
      showToastMessage(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetailedStatistics();
  }, [fetchDetailedStatistics]);

  useEffect(() => {
    feather.replace();
  }, [personalStats, subjectAnalysis, skillsAnalysis]);

  // Fonctions utilitaires
  const getPerformanceColor = (percentage) => {
    if (percentage >= 85) return 'success';
    if (percentage >= 70) return 'info';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const getPerformanceText = (percentage) => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 70) return 'Bien';
    if (percentage >= 50) return 'Passable';
    return 'À améliorer';
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
      case 'improving': return 'success';
      case 'declining': return 'danger';
      default: return 'secondary';
    }
  };

  const getSkillLevel = (level) => {
    switch(level) {
      case 'Expert': return 'success';
      case 'Avancé': return 'info';
      case 'Intermédiaire': return 'warning';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Configuration des graphiques
  const chartColors = ['#007bff', '#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6c757d'];
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded shadow border ${theme === "dark" ? "bg-dark text-light border-secondary" : "bg-white"}`}>
          <p className="mb-1 fw-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.name.includes('score') || entry.name.includes('%') ? '%' : ''}`}
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
          <p className="mt-2">Chargement de vos statistiques détaillées...</p>
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
                <i data-feather="bar-chart-2" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Mes Statistiques Détaillées
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Analyse complète de vos performances • {classroom.name || 'Ma Classe'}
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline-primary"
              onClick={fetchDetailedStatistics}
              title="Actualiser"
            >
              <i data-feather="refresh-cw" style={{ width: "16px", height: "16px" }}></i>
            </Button>
          </div>

          {/* Statistiques personnelles globales */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {personalStats.total_evaluations_completed || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Évaluations faites
                      </small>
                    </div>
                    <div className="text-primary">
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
                      <h3 className={`mb-0 text-${getPerformanceColor(personalStats.overall_average)}`}>
                        {personalStats.overall_average || 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Moyenne générale
                      </small>
                    </div>
                    <div className={`text-${getPerformanceColor(personalStats.overall_average)}`}>
                      <i data-feather="trending-up" style={{ width: "24px", height: "24px" }}></i>
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
                        {personalStats.perfect_scores_count || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Scores parfaits
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="award" style={{ width: "24px", height: "24px" }}></i>
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
                        {personalStats.consistency_score || 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Régularité
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="target" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
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
              <Tab eventKey="temporal" title={
                <span>
                  <i data-feather="trending-up" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Évolution temporelle
                </span>
              } />
              <Tab eventKey="subjects" title={
                <span>
                  <i data-feather="book" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Analyse par matière
                </span>
              } />
              <Tab eventKey="skills" title={
                <span>
                  <i data-feather="target" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Compétences
                </span>
              } />
              <Tab eventKey="comparison" title={
                <span>
                  <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Comparaison classe
                </span>
              } />
            </Tabs>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Onglet Vue d'ensemble */}
            {activeTab === 'overview' && (
              <Row>
                <Col lg={8}>
                  {/* Évolution globale */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="activity" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Évolution de vos performances (6 derniers mois)
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {temporalEvolution.monthly_evolution && temporalEvolution.monthly_evolution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={temporalEvolution.monthly_evolution}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#495057' : '#e9ecef'} />
                            <XAxis 
                              dataKey="period" 
                              stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                            />
                            <YAxis 
                              stroke={theme === 'dark' ? '#ffffff' : '#666666'}
                            />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Line 
                              type="monotone" 
                              dataKey="average_score" 
                              stroke="#007bff" 
                              strokeWidth={3}
                              dot={{ fill: '#007bff', strokeWidth: 2, r: 6 }}
                              name="Score moyen"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="participation_rate" 
                              stroke="#28a745" 
                              strokeWidth={2}
                              dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                              name="Taux de participation"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="activity" className="text-muted mb-2" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted">Pas encore de données d'évolution</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Recommandations personnalisées */}
                  <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="lightbulb" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Recommandations personnalisées
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {recommendations.length > 0 ? (
                        <div className="d-grid gap-3">
                          {recommendations.map((recommendation, index) => (
                            <Card key={index} className={`border-start border-4 border-${recommendation.priority === 'high' ? 'danger' : recommendation.priority === 'medium' ? 'warning' : 'info'} ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                              <Card.Body className="py-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {recommendation.title}
                                  </h6>
                                  <Badge bg={recommendation.priority === 'high' ? 'danger' : recommendation.priority === 'medium' ? 'warning' : 'info'}>
                                    {recommendation.priority === 'high' ? 'Urgent' : recommendation.priority === 'medium' ? 'Important' : 'Suggestion'}
                                  </Badge>
                                </div>
                                <p className="text-muted mb-2">{recommendation.description}</p>
                                <div className="small">
                                  <strong>Actions recommandées :</strong>
                                  <ul className="mb-0 mt-1">
                                    {recommendation.actions.map((action, actionIndex) => (
                                      <li key={actionIndex} className="text-muted">{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="lightbulb" className="text-success mb-2" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-success mb-0">Excellent travail ! Continuez ainsi.</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  {/* Tendances et prédictions */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="trending-up" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Tendances et prédictions
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted">Tendance performance:</span>
                          <Badge bg={getTrendColor(trends.performance_trend)}>
                            <i data-feather={getTrendIcon(trends.performance_trend)} className="me-1" style={{ width: "12px", height: "12px" }}></i>
                            {trends.performance_trend === 'improving' ? 'En progression' : 
                             trends.performance_trend === 'declining' ? 'En baisse' : 'Stable'}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted">Efficacité temps:</span>
                          <Badge bg={getTrendColor(trends.time_efficiency_trend)}>
                            {trends.time_efficiency_trend === 'improving' ? 'S\'améliore' : 
                             trends.time_efficiency_trend === 'declining' ? 'Diminue' : 'Stable'}
                          </Badge>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted">Momentum:</span>
                          <span className={`fw-bold ${trends.momentum > 0 ? 'text-success' : trends.momentum < 0 ? 'text-danger' : 'text-muted'}`}>
                            {trends.momentum > 0 ? '+' : ''}{trends.momentum || 0}%
                          </span>
                        </div>
                      </div>

                      <hr />

                      <div>
                        <h6 className={theme === "dark" ? "text-light" : "text-dark"}>Prédictions</h6>
                        <div className="mb-2">
                          <small className="text-muted">Prochain score estimé:</small>
                          <div className={`fw-bold text-${getPerformanceColor(trends.predictions?.next_score || 0)}`}>
                            {trends.predictions?.next_score || 0}%
                            <small className="text-muted ms-1">
                              (Confiance: {trends.predictions?.confidence || 0}%)
                            </small>
                          </div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">Volatilité:</small>
                          <div className={theme === "dark" ? "text-light" : "text-dark"}>
                            {trends.volatility || 0}%
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Patterns saisonniers */}
                  {trends.seasonal_patterns && (
                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0 d-flex align-items-center">
                          <i data-feather="clock" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                          Vos meilleurs moments
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="text-center mb-3">
                          <div className="mb-2">
                            <i data-feather="calendar" className="text-primary me-2" style={{ width: "16px", height: "16px" }}></i>
                            <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {trends.seasonal_patterns.best_day}
                            </span>
                            <small className="text-muted d-block">Meilleur jour de la semaine</small>
                          </div>
                          <div>
                            <i data-feather="clock" className="text-info me-2" style={{ width: "16px", height: "16px" }}></i>
                            <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {trends.seasonal_patterns.best_hour}h
                            </span>
                            <small className="text-muted d-block">Meilleure heure</small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                </Col>
              </Row>
            )}

            {/* Onglet Évolution temporelle */}
            {activeTab === 'temporal' && (
              <div>
                <Row className="mb-4">
                  <Col lg={8}>
                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Évolution mensuelle détaillée</h6>
                      </Card.Header>
                      <Card.Body>
                        {temporalEvolution.monthly_evolution && temporalEvolution.monthly_evolution.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={temporalEvolution.monthly_evolution}>
                              <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#007bff" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#007bff" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorParticipation" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#28a745" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#495057' : '#e9ecef'} />
                              <XAxis dataKey="period" stroke={theme === 'dark' ? '#ffffff' : '#666666'} />
                              <YAxis stroke={theme === 'dark' ? '#ffffff' : '#666666'} />
                              <RechartsTooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="average_score" stackId="1" stroke="#007bff" fill="url(#colorScore)" name="Score moyen" />
                              <Area type="monotone" dataKey="participation_rate" stackId="2" stroke="#28a745" fill="url(#colorParticipation)" name="Participation" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center py-5">
                            <i data-feather="trending-up" className="text-muted" style={{ width: "48px", height: "48px" }}></i>
                            <p className="text-muted mt-2">Pas de données d'évolution temporelle</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={4}>
                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Activité hebdomadaire</h6>
                      </Card.Header>
                      <Card.Body>
                        {temporalEvolution.weekly_evolution && temporalEvolution.weekly_evolution.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={temporalEvolution.weekly_evolution}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#495057' : '#e9ecef'} />
                              <XAxis dataKey="period" stroke={theme === 'dark' ? '#ffffff' : '#666666'} />
                              <YAxis stroke={theme === 'dark' ? '#ffffff' : '#666666'} />
                              <RechartsTooltip content={<CustomTooltip />} />
                              <Bar dataKey="evaluations_count" fill="#17a2b8" name="Évaluations" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center py-4">
                            <i data-feather="bar-chart" className="text-muted" style={{ width: "32px", height: "32px" }}></i>
                            <p className="text-muted mt-2">Pas de données hebdomadaires</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Activité quotidienne */}
                <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                  <Card.Header className="border-0">
                    <h6 className="mb-0">Activité des 30 derniers jours</h6>
                  </Card.Header>
                  <Card.Body>
                    {temporalEvolution.daily_activity && temporalEvolution.daily_activity.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={temporalEvolution.daily_activity}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#495057' : '#e9ecef'} />
                          <XAxis dataKey="date" stroke={theme === 'dark' ? '#ffffff' : '#666666'} />
                          <YAxis stroke={theme === 'dark' ? '#ffffff' : '#666666'} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="evaluations_count" stroke="#ffc107" fill="#ffc107" fillOpacity={0.6} name="Évaluations" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-4">
                        <i data-feather="calendar" className="text-muted" style={{ width: "32px", height: "32px" }}></i>
                        <p className="text-muted mt-2">Pas de données d'activité quotidienne</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Onglet Analyse par matière */}
            {activeTab === 'subjects' && (
              <div>
                <Row className="g-4">
                  {subjectAnalysis.map((subject, index) => (
                    <Col key={subject.subject_id} lg={6}>
                      <Card className={`h-100 border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                        <Card.Header className="border-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">{subject.name}</h6>
                            <div className="d-flex gap-2">
                              <Badge bg={getPerformanceColor(subject.average_score)}>
                                {subject.average_score}%
                              </Badge>
                              <Badge bg={getTrendColor(subject.trend)}>
                                <i data-feather={getTrendIcon(subject.trend)} className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {subject.trend === 'improving' ? 'Progression' : 
                                 subject.trend === 'declining' ? 'Baisse' : 'Stable'}
                              </Badge>
                            </div>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <small className="text-muted">Performance globale</small>
                              <small className={`fw-bold text-${getPerformanceColor(subject.average_score)}`}>
                                {getPerformanceText(subject.average_score)}
                              </small>
                            </div>
                            <ProgressBar 
                              now={subject.average_score} 
                              variant={getPerformanceColor(subject.average_score)}
                              style={{ height: '8px' }}
                            />
                          </div>

                          <Row className="g-2 mb-3">
                            <Col xs={6}>
                              <div className="text-center p-2 rounded bg-opacity-10 bg-primary">
                                <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {subject.evaluations_count}
                                </div>
                                <small className="text-muted">Évaluations</small>
                              </div>
                            </Col>
                            <Col xs={6}>
                              <div className="text-center p-2 rounded bg-opacity-10 bg-success">
                                <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {subject.consistency}%
                                </div>
                                <small className="text-muted">Régularité</small>
                              </div>
                            </Col>
                          </Row>

                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span className="small text-muted">Meilleur score:</span>
                              <span className="small fw-bold text-success">{subject.best_score}%</span>
                            </div>
                            <div className="d-flex justify-content-between mb-1">
                              <span className="small text-muted">Score le plus bas:</span>
                              <span className="small fw-bold text-danger">{subject.worst_score}%</span>
                            </div>
                          </div>

                          <div className="mb-3">
                            <h6 className="small fw-bold text-success">Points forts:</h6>
                            <div className="d-flex flex-wrap gap-1 mb-2">
                              {subject.strengths.map((strength, idx) => (
                                <Badge key={idx} bg="success" className="small">{strength}</Badge>
                              ))}
                            </div>

                            <h6 className="small fw-bold text-warning">À améliorer:</h6>
                            <div className="d-flex flex-wrap gap-1">
                              {subject.weaknesses.map((weakness, idx) => (
                                <Badge key={idx} bg="warning" className="small">{weakness}</Badge>
                              ))}
                            </div>
                          </div>

                          {subject.recent_performance && subject.recent_performance.length > 0 && (
                            <div>
                              <h6 className="small mb-2">5 dernières évaluations:</h6>
                              <div className="d-flex justify-content-between">
                                {subject.recent_performance.map((score, idx) => (
                                  <div key={idx} className="text-center">
                                    <div className={`small fw-bold text-${getPerformanceColor(score)}`}>
                                      {score}%
                                    </div>
                                    <small className="text-muted">#{idx + 1}</small>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {subjectAnalysis.length === 0 && (
                  <div className="text-center py-5">
                    <i data-feather="book" className="text-muted mb-3" style={{ width: "48px", height: "48px" }}></i>
                    <h6 className="text-muted">Aucune donnée d'analyse par matière</h6>
                    <p className="text-muted">Participez à des évaluations pour voir vos analyses détaillées</p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Compétences */}
            {activeTab === 'skills' && (
              <Row>
                <Col lg={8}>
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="target" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Radar des compétences
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {skillsAnalysis.detailed_skills ? (
                        <ResponsiveContainer width="100%" height={400}>
                          <RadarChart data={[
                            { skill: 'Résolution problèmes', value: skillsAnalysis.detailed_skills.problem_solving?.success_rate || 0 },
                            { skill: 'Compréhension', value: skillsAnalysis.detailed_skills.comprehension?.success_rate || 0 },
                            { skill: 'Analyse', value: skillsAnalysis.detailed_skills.analysis?.success_rate || 0 },
                            { skill: 'Mémorisation', value: skillsAnalysis.detailed_skills.memorization?.success_rate || 0 }
                          ]}>
                            <PolarGrid stroke={theme === 'dark' ? '#495057' : '#e9ecef'} />
                            <PolarAngleAxis dataKey="skill" tick={{ fill: theme === 'dark' ? '#ffffff' : '#666666' }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: theme === 'dark' ? '#ffffff' : '#666666' }} />
                            <Radar name="Niveau de compétence" dataKey="value" stroke="#007bff" fill="#007bff" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5">
                          <i data-feather="target" className="text-muted" style={{ width: "48px", height: "48px" }}></i>
                          <p className="text-muted mt-2">Pas encore de données de compétences</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0">Détail des compétences</h6>
                    </Card.Header>
                    <Card.Body>
                      {skillsAnalysis.detailed_skills ? (
                        <Row className="g-3">
                          {Object.entries(skillsAnalysis.detailed_skills).map(([skillKey, skillData]) => (
                            <Col key={skillKey} md={6}>
                              <Card className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                      {skillKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </h6>
                                    <Badge bg={getSkillLevel(skillData.level)}>
                                      {skillData.level}
                                    </Badge>
                                  </div>
                                  <div className="mb-2">
                                    <div className="d-flex justify-content-between mb-1">
                                      <small className="text-muted">Taux de réussite</small>
                                      <small className={`fw-bold text-${getPerformanceColor(skillData.success_rate)}`}>
                                        {skillData.success_rate}%
                                      </small>
                                    </div>
                                    <ProgressBar 
                                      now={skillData.success_rate} 
                                      variant={getPerformanceColor(skillData.success_rate)}
                                      style={{ height: '6px' }}
                                    />
                                  </div>
                                  <div className="small text-muted">
                                    <div>Questions traitées: {skillData.total}</div>
                                    <div>Réponses correctes: {skillData.correct}</div>
                                    <div>Temps moyen: {Math.round(skillData.avg_time)}s</div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="target" className="text-muted" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted mt-2">Aucune donnée de compétence disponible</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  {/* Forces */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="trending-up" className="me-2 text-success" style={{ width: "18px", height: "18px" }}></i>
                        Vos forces
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {skillsAnalysis.strengths && skillsAnalysis.strengths.length > 0 ? (
                        <div className="d-grid gap-2">
                          {skillsAnalysis.strengths.map((strength, index) => (
                            <div key={index} className={`p-2 rounded border-start border-4 border-success ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                              <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {strength.skill.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="d-flex justify-content-between">
                                <small className="text-success">{strength.score}% de réussite</small>
                                <Badge bg="success" className="small">{strength.level}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <i data-feather="trending-up" className="text-muted" style={{ width: "24px", height: "24px" }}></i>
                          <p className="text-muted small mb-0">Continuez à progresser pour identifier vos forces</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Faiblesses */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="trending-down" className="me-2 text-warning" style={{ width: "18px", height: "18px" }}></i>
                        Points à améliorer
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {skillsAnalysis.weaknesses && skillsAnalysis.weaknesses.length > 0 ? (
                        <div className="d-grid gap-2">
                          {skillsAnalysis.weaknesses.map((weakness, index) => (
                            <div key={index} className={`p-2 rounded border-start border-4 border-warning ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                              <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {weakness.skill.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className="d-flex justify-content-between">
                                <small className="text-warning">{weakness.score}% de réussite</small>
                                <Badge bg="warning" className="small">{weakness.level}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <i data-feather="check-circle" className="text-success" style={{ width: "24px", height: "24px" }}></i>
                          <p className="text-success small mb-0">Excellent ! Aucune faiblesse majeure détectée</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Recommandations compétences */}
                  <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="lightbulb" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Conseils d'amélioration
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {skillsAnalysis.recommendations && skillsAnalysis.recommendations.length > 0 ? (
                        <ul className="list-unstyled mb-0">
                          {skillsAnalysis.recommendations.map((recommendation, index) => (
                            <li key={index} className="mb-2 pb-2 border-bottom border-light">
                              <small className={theme === "dark" ? "text-light" : "text-dark"}>
                                {recommendation}
                              </small>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-3">
                          <i data-feather="star" className="text-success" style={{ width: "24px", height: "24px" }}></i>
                          <p className="text-success small mb-0">Continuez votre excellent travail !</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Onglet Comparaison classe */}
            {activeTab === 'comparison' && (
              <Row>
                <Col lg={8}>
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="users" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Comparaison avec la classe
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="text-center mb-4">
                        <Row>
                          <Col md={4}>
                            <div className="mb-2">
                              <h3 className={`text-${getPerformanceColor(classComparison.my_average)} mb-0`}>
                                {classComparison.my_average || 0}%
                              </h3>
                              <small className="text-muted">Ma moyenne</small>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="mb-2">
                              <h3 className={`${theme === "dark" ? "text-light" : "text-dark"} mb-0`}>
                                {classComparison.class_average || 0}%
                              </h3>
                              <small className="text-muted">Moyenne de classe</small>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="mb-2">
                              <h3 className={`${classComparison.difference_from_average >= 0 ? 'text-success' : 'text-danger'} mb-0`}>
                                {classComparison.difference_from_average >= 0 ? '+' : ''}{classComparison.difference_from_average || 0}%
                              </h3>
                              <small className="text-muted">Différence</small>
                            </div>
                          </Col>
                        </Row>
                      </div>

                      <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted">Ma position dans la classe</span>
                          <Badge bg="primary" className="px-3 py-2">
                            #{classComparison.my_rank || 0} / {classComparison.total_students || 0}
                          </Badge>
                        </div>
                        <ProgressBar 
                          now={classComparison.my_percentile || 0} 
                          variant="info"
                          style={{ height: '10px' }}
                        />
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted">0ème percentile</small>
                          <small className="text-info fw-bold">{classComparison.my_percentile || 0}ème percentile</small>
                          <small className="text-muted">100ème percentile</small>
                        </div>
                      </div>

                      {classComparison.subject_comparisons && classComparison.subject_comparisons.length > 0 && (
                        <div>
                          <h6 className={theme === "dark" ? "text-light" : "text-dark"}>Comparaison par matière</h6>
                          <div className="table-responsive">
                            <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                              <thead>
                                <tr>
                                  <th>Matière</th>
                                  <th className="text-center">Mon score</th>
                                  <th className="text-center">Moyenne classe</th>
                                  <th className="text-center">Différence</th>
                                  <th className="text-center">Position</th>
                                </tr>
                              </thead>
                              <tbody>
                                {classComparison.subject_comparisons.map((subject, index) => (
                                  <tr key={index}>
                                    <td className={theme === "dark" ? "text-light" : "text-dark"}>
                                      {subject.subject_name}
                                    </td>
                                    <td className="text-center">
                                      <Badge bg={getPerformanceColor(subject.my_score)}>
                                        {subject.my_score}%
                                      </Badge>
                                    </td>
                                    <td className="text-center text-muted">
                                      {subject.class_average}%
                                    </td>
                                    <td className={`text-center ${subject.difference >= 0 ? 'text-success' : 'text-danger'}`}>
                                      {subject.difference >= 0 ? '+' : ''}{subject.difference}%
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="info">#{subject.position}</Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={4}>
                  {/* Catégories de performance */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0">Répartition de la classe</h6>
                    </Card.Header>
                    <Card.Body>
                      {classComparison.performance_categories ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Excellent', value: classComparison.performance_categories.excellent, fill: '#28a745' },
                                { name: 'Bien', value: classComparison.performance_categories.good, fill: '#007bff' },
                                { name: 'Moyen', value: classComparison.performance_categories.average, fill: '#ffc107' },
                                { name: 'À améliorer', value: classComparison.performance_categories.needs_improvement, fill: '#dc3545' }
                              ]}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                            />
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="pie-chart" className="text-muted" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted mt-2">Pas de données de répartition</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Top performers */}
                  {classComparison.top_performers && (
                    <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                      <Card.Header className="border-0">
                        <h6 className="mb-0">Top 3 de la classe</h6>
                      </Card.Header>
                      <Card.Body>
                        {classComparison.top_performers.map((student, index) => (
                          <div key={index} className="d-flex align-items-center mb-2 pb-2 border-bottom border-light">
                            <Badge 
                              bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'info'} 
                              className="me-3 px-2 py-1"
                            >
                              #{index + 1}
                            </Badge>
                            <div className="flex-grow-1">
                              <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {student.name}
                              </div>
                              <small className="text-muted">
                                {student.average_score}% • {student.evaluations_count} évaluations
                              </small>
                            </div>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  )}
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