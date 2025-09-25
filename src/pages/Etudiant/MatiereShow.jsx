import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Badge, Alert, Spinner, Toast, ToastContainer, 
  ProgressBar, Tab, Tabs, Table, Image
} from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';

export default function MatiereShowEtudiant() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");

  // États des données
  const [matiere, setMatiere] = useState(null);
  const [coursStats, setCoursStats] = useState({});
  const [evaluationStats, setEvaluationStats] = useState({});
  const [evolutionData, setEvolutionData] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [chartData, setChartData] = useState({});
  const [recentContent, setRecentContent] = useState({});

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

  // Charger les détails de la matière
  const fetchMatiereDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/etudiant/show/matiere/${id}`);
      
      if (response.data.status === 'success') {
        setMatiere(response.data.matiere);
        setCoursStats(response.data.cours_stats);
        setEvaluationStats(response.data.evaluation_stats);
        setEvolutionData(response.data.evolution_data);
        setSuggestions(response.data.suggestions);
        setChartData(response.data.chart_data);
        setRecentContent(response.data.recent_content);
      } else {
        setError(response.data.message || 'Erreur lors du chargement des détails');
      }
    } catch (err) {
      setError('Erreur lors du chargement des détails de la matière');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchMatiereDetails();
    }
  }, [fetchMatiereDetails]);

  useEffect(() => {
    feather.replace();
  }, [matiere, chartData]);

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

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'alert-triangle';
      case 'info': return 'info';
      default: return 'help-circle';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return 'trending-up';
      case 'declining': return 'trending-down';
      default: return 'minus';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'success';
      case 'declining': return 'danger';
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

  // Composants personnalisés pour les tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded shadow border ${theme === "dark" ? "bg-dark text-light border-secondary" : "bg-white"}`}>
          <p className="mb-1 fw-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.name.includes('%') || entry.name.includes('score') ? '%' : ''}`}
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
          <p className="mt-2">Chargement des détails de la matière...</p>
        </div>
      </EtudiantLayout>
    );
  }

  if (error || !matiere) {
    return (
      <EtudiantLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error || 'Matière introuvable'}
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" as={Link} to="/etudiant/view/matieres/my-classroom">
            <i data-feather="arrow-left" className="me-2" />
            Retour aux matières
          </Button>
          <Button variant="outline-primary" onClick={fetchMatiereDetails}>
            <i data-feather="refresh-cw" className="me-2" />
            Réessayer
          </Button>
        </div>
      </EtudiantLayout>
    );
  }

  return (
    <EtudiantLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className="d-flex align-items-center mb-2">
              <Button 
                variant="outline-secondary" 
                size="sm"
                as={Link} 
                to="/etudiant/view/matieres/my-classroom"
                className="me-3"
              >
                <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
                Retour
              </Button>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <Image
                    src={matiere.image_url}
                    alt={matiere.nom}
                    width="60"
                    height="60"
                    style={{ objectFit: 'cover' }}
                    className="rounded"
                  />
                </div>
                <div>
                  <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {matiere.nom}
                  </h1>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <small className="text-muted">{matiere.matricule}</small>
                    <Badge bg="success" className="px-2 py-1">
                      <i data-feather="check-circle" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {matiere.status}
                    </Badge>
                    <Badge bg="info" className="px-2 py-1">
                      Coeff. {matiere.coefficient}
                    </Badge>
                  </div>
                  <small className="text-muted">
                    <i data-feather="home" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                    {matiere.classroom?.name}
                  </small>
                </div>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary"
              onClick={fetchMatiereDetails}
              title="Actualiser"
            >
              <i data-feather="refresh-cw" style={{ width: "16px", height: "16px" }}></i>
            </Button>
          </div>
        </div>

        {/* Statistiques principales */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {coursStats.total_cours || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Cours disponibles
                    </small>
                  </div>
                  <div className="text-primary">
                    <i data-feather="book-open" style={{ width: "24px", height: "24px" }}></i>
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
                    <h3 className={`mb-0 text-${getPerformanceColor(evaluationStats.moyenne_generale).replace('#', '')}`}>
                      {evaluationStats.moyenne_generale || 0}%
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Moyenne générale
                    </small>
                  </div>
                  <div style={{ color: getPerformanceColor(evaluationStats.moyenne_generale) }}>
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
                      {evaluationStats.evaluations_participees || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Évaluations faites
                    </small>
                  </div>
                  <div className="text-success">
                    <i data-feather="check-square" style={{ width: "24px", height: "24px" }}></i>
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
                    <h3 className={`mb-0 text-${getTrendColor(evolutionData.trend)}`}>
                      <i data-feather={getTrendIcon(evolutionData.trend)} className="me-1" style={{ width: "20px", height: "20px" }}></i>
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Tendance
                    </small>
                  </div>
                  <div className={`text-${getTrendColor(evolutionData.trend)}`}>
                    <i data-feather="activity" style={{ width: "24px", height: "24px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Barre de progression générale */}
        {evaluationStats.moyenne_generale > 0 && (
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Performance globale dans cette matière
                </h6>
                <Badge 
                  style={{ backgroundColor: getPerformanceColor(evaluationStats.moyenne_generale) }}
                  className="px-3 py-1"
                >
                  {getPerformanceText(evaluationStats.moyenne_generale)}
                </Badge>
              </div>
              <ProgressBar 
                now={evaluationStats.moyenne_generale} 
                style={{ 
                  height: '12px',
                  backgroundColor: theme === "dark" ? "#495057" : "#e9ecef"
                }}
                className="mb-2"
              >
                <ProgressBar 
                  now={evaluationStats.moyenne_generale} 
                  style={{ backgroundColor: getPerformanceColor(evaluationStats.moyenne_generale) }}
                />
              </ProgressBar>
              <div className="d-flex justify-content-between small text-muted">
                <span>{evaluationStats.total_points_obtenus} points obtenus</span>
                <span>{evaluationStats.total_points_possibles} points possibles</span>
              </div>
            </Card.Body>
          </Card>
        )}

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
              <Tab eventKey="evolution" title={
                <span>
                  <i data-feather="trending-up" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Évolution
                </span>
              } />
              <Tab eventKey="suggestions" title={
                <span>
                  <i data-feather="lightbulb" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Suggestions
                </span>
              } />
              <Tab eventKey="content" title={
                <span>
                  <i data-feather="book" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Contenu récent
                </span>
              } />
            </Tabs>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Onglet Vue d'ensemble */}
            {activeTab === 'overview' && (
              <Row>
                <Col lg={8}>
                  {/* Graphique d'évolution des performances */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="activity" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Évolution de vos performances
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {chartData.evolution && chartData.evolution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData.evolution}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#495057" : "#e0e0e0"} />
                            <XAxis 
                              dataKey="name" 
                              stroke={theme === "dark" ? "#ffffff" : "#666666"}
                            />
                            <YAxis 
                              stroke={theme === "dark" ? "#ffffff" : "#666666"}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#007bff" 
                              fill="#007bff" 
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="bar-chart" className="text-muted mb-2" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted">Pas encore de données d'évolution</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="book" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Vos diffferents cours ({recentContent.recent_cours.length})
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {recentContent.recent_cours && recentContent.recent_cours.length > 0 ? (
                        <div className="d-grid gap-3">
                          {recentContent.recent_cours.map((cours) => (
                            <div key={cours.id} className={`p-3 border rounded ${theme === "dark" ? "border-secondary bg-dark" : "bg-white"}`}>
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                    {cours.titre}
                                  </h6>
                                  <small className="text-muted d-block mb-2">
                                    Code: {cours.matricule} • Publié le {formatDate(cours.created_at)}
                                  </small>
                                  {cours.description && (
                                    <p className={`small mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                      {cours.description.length > 100 ? 
                                        cours.description.substring(0, 100) + "..." : 
                                        cours.description
                                      }
                                    </p>
                                  )}
                                  <div className="d-flex gap-1">
                                    <Badge bg="success">Publié</Badge>
                                    {cours.fichiers_joints_1 && <Badge bg="info">Fichiers joints</Badge>}
                                    {cours.liens_externes && <Badge bg="warning">Liens externes</Badge>}
                                  </div>
                                </div>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  as={Link}
                                  to={`/etudiant/show/cours/${cours.id}`}
                                  className="ms-2"
                                >
                                  <i data-feather="eye" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                                  Consulter
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="book-open" className="text-muted mb-3" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted">Aucun cours récent dans cette matière</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Évaluations à venir */}
                  <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 d-flex align-items-center">
                          <i data-feather="clipboard" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                          Évaluations à venir ({evaluationStats.evaluations_en_attente})
                        </h6>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          as={Link}
                          to="/etudiant/view/evaluations/my-classroom"
                        >
                          <i data-feather="external-link" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                          Voir toutes
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      {recentContent.upcoming_evaluations && recentContent.upcoming_evaluations.length > 0 ? (
                        <div className="d-grid gap-3">
                          {recentContent.upcoming_evaluations.map((evaluation) => {
                            const dateEval = new Date(evaluation.date_debut);
                            const now = new Date();
                            const diffDays = Math.ceil((dateEval - now) / (1000 * 60 * 60 * 24));
                            
                            return (
                              <div key={evaluation.id} className={`p-3 border rounded ${theme === "dark" ? "border-secondary bg-dark" : "bg-white"}`}>
                                <div className="d-flex justify-content-between align-items-start">
                                  <div className="flex-grow-1">
                                    <h6 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                      {evaluation.titre}
                                    </h6>
                                    <small className="text-muted d-block mb-2">
                                      Code: {evaluation.matricule} • Programmée pour le {formatDate(evaluation.date_debut)}
                                    </small>
                                    {evaluation.description && (
                                      <p className={`small mb-2 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                        {evaluation.description.length > 80 ? 
                                          evaluation.description.substring(0, 80) + "..." : 
                                          evaluation.description
                                        }
                                      </p>
                                    )}
                                    <div className="d-flex gap-1">
                                      <Badge bg="primary">Programmée</Badge>
                                      <Badge 
                                        bg={diffDays <= 1 ? 'danger' : diffDays <= 3 ? 'warning' : 'info'}
                                      >
                                        {diffDays === 0 ? 'Aujourd\'hui' : 
                                         diffDays === 1 ? 'Demain' : 
                                         `Dans ${diffDays} jours`}
                                      </Badge>
                                      <Badge bg="secondary">
                                        {evaluation.duree_minutes} min
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    as={Link}
                                    to={`/etudiant/show/evaluation/${evaluation.id}`}
                                    className="ms-2"
                                  >
                                    <i data-feather="info" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                                    Détails
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i data-feather="calendar" className="text-muted mb-3" style={{ width: "32px", height: "32px" }}></i>
                          <p className="text-muted">Aucune évaluation programmée dans cette matière</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>

                </Col>

                <Col lg={4}>
                  {/* Activité récente */}
                  <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Card.Header className="border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <i data-feather="activity" className="me-2" style={{ width: "18px", height: "18px" }}></i>
                        Activité récente
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-3">
                        <span className="text-muted">Dernière publication :</span>
                        <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {coursStats.derniere_publication ? 
                            formatDate(coursStats.derniere_publication) : 
                            'Aucune'
                          }
                        </span>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-3">
                        <span className="text-muted">Cours ce mois :</span>
                        <Badge bg="info">{coursStats.cours_recents || 0}</Badge>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-3">
                        <span className="text-muted">Cours avec fichiers :</span>
                        <Badge bg="success">{coursStats.cours_avec_fichiers || 0}</Badge>
                      </div>
                      
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Cours avec liens :</span>
                        <Badge bg="warning">{coursStats.cours_avec_liens || 0}</Badge>
                      </div>
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
                          to="/etudiant/view/cours/my-classroom"
                        >
                          <i data-feather="book-open" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Voir tous les cours
                        </Button>
                        
                        <Button 
                          variant="success" 
                          size="sm"
                          as={Link}
                          to="/etudiant/view/evaluations/my-classroom"
                        >
                          <i data-feather="clipboard" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Mes évaluations
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
                          to="/etudiant/calendar"
                        >
                          <i data-feather="calendar" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Mon calendrier
                        </Button>
                      </div>
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