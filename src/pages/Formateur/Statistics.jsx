import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Badge, Button, Form, Modal, Spinner, 
  Alert, ProgressBar, Table, Collapse, Toast, ToastContainer, 
  ButtonGroup, Dropdown, OverlayTrigger, Tooltip, Tab, Tabs
} from "react-bootstrap";
import { Link } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

export default function StatisticsFormateur() {
  const [loading, setLoading] = useState(true);
  const [realTimeLoading, setRealTimeLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [activeTab, setActiveTab] = useState("overview");
  
  // États des données
  const [statistiques, setStatistiques] = useState({});
  const [statsTempsReel, setStatsTempsReel] = useState({});
  const [statsClasse, setStatsClasse] = useState({});
  const [rapportEtudiant, setRapportEtudiant] = useState({});
  
  // États des filtres
  const [filters, setFilters] = useState({
    periode: 30,
    matricule_classroom: "",
    matricule_matiere: "",
    date_debut: "",
    date_fin: ""
  });
  
  // Données de référence
  const [classrooms, setClassrooms] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  
  // États des modales
  const [showExportModal, setShowExportModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("");
  
  // États des notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // États d'expansion des sections
  const [expandedSections, setExpandedSections] = useState({
    evolution: false,
    performance: true,
    comparaisons: false,
    tendances: false
  });

  // Configuration des couleurs pour les graphiques
  const chartColors = {
    primary: "#0d6efd",
    success: "#198754", 
    warning: "#ffc107",
    danger: "#dc3545",
    info: "#0dcaf0",
    secondary: "#6c757d"
  };

  // Gestion du thème
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

  // Afficher les notifications
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Charger les statistiques principales
  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/formateur/statistics?${params.toString()}`);
      setStatistiques(response.data.statistiques || {});
      
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      showToastMessage('Erreur lors du chargement des statistiques', 'danger');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Charger les statistiques temps réel
  const fetchRealTimeStats = useCallback(async () => {
    try {
      setRealTimeLoading(true);
      const response = await api.get('/formateur/statistics/real-time');
      setStatsTempsReel(response.data.stats_temps_reel || {});
    } catch (err) {
      console.error('Erreur stats temps réel:', err);
    } finally {
      setRealTimeLoading(false);
    }
  }, []);

  // Charger les données de référence
  const fetchReferenceData = useCallback(async () => {
    try {
      // Chargement des classes, matières et étudiants depuis les autres endpoints
      const [classroomsRes, matieresRes, etudiantsRes] = await Promise.all([
        api.get('/formateur/view/classroom'),
        api.get('/formateur/view/matiere'),
        api.get('/formateur/view/etudiant')
      ]);
      
      setClassrooms(classroomsRes.data.classrooms || []);
      setMatieres(matieresRes.data.matieres || []);
      setEtudiants(etudiantsRes.data.users || []);
    } catch (err) {
      console.error('Erreur lors du chargement des données de référence:', err);
    }
  }, []);

  // Charger les statistiques détaillées d'une classe
  const fetchClassroomStats = async (matricule_classroom) => {
    try {
      const response = await api.get(`/formateur/statistics/classroom/${matricule_classroom}`, {
        params: { periode: filters.periode }
      });
      setStatsClasse(response.data.statistiques_classe || {});
      setShowClassroomModal(true);
    } catch (err) {
      console.error('Erreur stats classe:', err);
      showToastMessage('Erreur lors du chargement des stats de classe', 'danger');
    }
  };

  // Charger le rapport d'un étudiant
  const fetchStudentReport = async (matricule_etudiant) => {
    try {
      const response = await api.get(`/formateur/statistics/student/${matricule_etudiant}`, {
        params: { periode: filters.periode || 90 }
      });
      setRapportEtudiant(response.data.rapport_etudiant || {});
      setShowStudentModal(true);
    } catch (err) {
      console.error('Erreur rapport étudiant:', err);
      showToastMessage('Erreur lors du chargement du rapport étudiant', 'danger');
    }
  };

  // Exporter les statistiques
  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/formateur/statistics/export/${format}?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statistiques_${new Date().toISOString().slice(0, 10)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToastMessage(`Export ${format.toUpperCase()} démarré`, 'success');
      setShowExportModal(false);
    } catch (err) {
      console.error('Erreur export:', err);
      showToastMessage('Erreur lors de l\'export', 'danger');
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchReferenceData();
  }, [fetchStatistics, fetchReferenceData]);

  useEffect(() => {
    const interval = setInterval(fetchRealTimeStats, 30000); // Mise à jour toutes les 30s
    fetchRealTimeStats();
    return () => clearInterval(interval);
  }, [fetchRealTimeStats]);

  useEffect(() => {
    feather.replace();
  }, [statistiques, statsTempsReel]);

  // Toggle sections
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Formatage des données pour les graphiques
  const formatEvolutionData = () => {
    if (!statistiques.evolution_temporelle?.donnees_quotidiennes) return [];
    
    return statistiques.evolution_temporelle.donnees_quotidiennes.map(day => ({
      date: new Date(day.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      inscriptions: day.inscriptions,
      reponses: day.reponses,
      etudiants_actifs: day.etudiants_actifs,
      taux_reussite: day.taux_reussite_journalier
    }));
  };

  const formatPerformanceData = () => {
    if (!statistiques.analyses_performances?.performance_par_matiere) return [];
    
    return statistiques.analyses_performances.performance_par_matiere.map(item => ({
      matiere: item.matiere?.substring(0, 15) + '...' || 'N/A',
      taux_reussite: item.taux_reussite,
      evaluations: item.nombre_evaluations,
      cours: item.nombre_cours
    }));
  };

  const formatDistributionNotes = () => {
    if (!statistiques.analyses_performances?.distribution_notes) return [];
    
    const distribution = statistiques.analyses_performances.distribution_notes;
    return [
      { name: '0-5', value: distribution['0-5'], color: chartColors.danger },
      { name: '5-10', value: distribution['5-10'], color: chartColors.warning },
      { name: '10-15', value: distribution['10-15'], color: chartColors.info },
      { name: '15-20', value: distribution['15-20'], color: chartColors.success }
    ];
  };

  const formatEngagementRadar = () => {
    const comparaisons = statistiques.comparaisons?.indices_performance || {};
    return [
      {
        subject: 'Engagement',
        value: comparaisons.indice_engagement || 0,
        fullMark: 100
      },
      {
        subject: 'Satisfaction',
        value: comparaisons.indice_satisfaction || 0,
        fullMark: 100
      },
      {
        subject: 'Efficacité',
        value: comparaisons.indice_efficacite || 0,
        fullMark: 100
      },
      {
        subject: 'Participation',
        value: statistiques.statistiques_principales?.activite?.taux_participation || 0,
        fullMark: 100
      },
      {
        subject: 'Réussite',
        value: statistiques.statistiques_principales?.performance_globale?.taux_reussite_moyen || 0,
        fullMark: 100
      }
    ];
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des statistiques...</p>
        </div>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className={`h3 mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
              Statistiques et Analytics
            </h1>
            <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
              Analyse complète des données de votre plateforme éducative
            </p>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={() => setShowExportModal(true)}
            >
              <i data-feather="download" className="me-2" style={{ width: '16px', height: '16px' }} />
              Exporter
            </Button>
            <Button variant="primary" onClick={fetchStatistics}>
              <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body>
            <Row className="g-3">
              <Col md={2}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Période (jours)
                </Form.Label>
                <Form.Select
                  value={filters.periode}
                  onChange={e => setFilters({ ...filters, periode: parseInt(e.target.value) })}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                >
                  <option value={7}>7 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={90}>90 jours</option>
                  <option value={365}>1 an</option>
                </Form.Select>
              </Col>
              
              <Col md={3}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Classe
                </Form.Label>
                <Form.Select
                  value={filters.matricule_classroom}
                  onChange={e => setFilters({ ...filters, matricule_classroom: e.target.value })}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                >
                  <option value="">Toutes les classes</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.matricule} value={classroom.matricule}>
                      {classroom.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Matière
                </Form.Label>
                <Form.Select
                  value={filters.matricule_matiere}
                  onChange={e => setFilters({ ...filters, matricule_matiere: e.target.value })}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                >
                  <option value="">Toutes les matières</option>
                  {matieres.map(matiere => (
                    <option key={matiere.matricule} value={matiere.matricule}>
                      {matiere.nom}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={2}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Date début
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_debut}
                  onChange={e => setFilters({ ...filters, date_debut: e.target.value })}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                />
              </Col>

              <Col md={2}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Date fin
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_fin}
                  onChange={e => setFilters({ ...filters, date_fin: e.target.value })}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Statistiques temps réel */}
        {statsTempsReel.timestamp && (
          <Alert variant="info" className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <i data-feather="activity" className="me-2" style={{ width: '16px', height: '16px' }} />
              <strong>Temps réel:</strong> {statsTempsReel.utilisateurs_en_ligne} utilisateurs en ligne • 
              {statsTempsReel.activite_temps_reel?.reponses_derniere_heure} réponses cette heure
              {realTimeLoading && <Spinner size="sm" className="ms-2" />}
            </div>
            <small>Dernière MAJ: {new Date(statsTempsReel.timestamp).toLocaleTimeString()}</small>
          </Alert>
        )}

        {/* Statistiques principales */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {statistiques.statistiques_principales?.utilisateurs?.total_nouveaux || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Nouveaux utilisateurs
                    </small>
                    <div className="mt-1">
                      <Badge bg={
                        (statistiques.statistiques_principales?.utilisateurs?.taux_croissance || 0) >= 0 ? 'success' : 'danger'
                      }>
                        {(statistiques.statistiques_principales?.utilisateurs?.taux_croissance || 0).toFixed(1)}%
                      </Badge>
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
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="mb-0 text-success">
                      {statistiques.statistiques_principales?.activite?.total_reponses || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Réponses totales
                    </small>
                    <div className="mt-1">
                      <small className="text-muted">
                        {(statistiques.statistiques_principales?.activite?.reponses_par_jour || 0).toFixed(1)} /jour
                      </small>
                    </div>
                  </div>
                  <div className="text-success">
                    <i data-feather="message-circle" style={{ width: "32px", height: "32px" }}></i>
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
                      {(statistiques.statistiques_principales?.performance_globale?.taux_reussite_moyen || 0).toFixed(1)}%
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Taux de réussite
                    </small>
                    <div className="mt-1">
                      <small className="text-muted">
                        Note: {statistiques.statistiques_principales?.performance_globale?.note_moyenne || 0}/20
                      </small>
                    </div>
                  </div>
                  <div className="text-info">
                    <i data-feather="trending-up" style={{ width: "32px", height: "32px" }}></i>
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
                      {(statistiques.statistiques_principales?.activite?.taux_participation || 0).toFixed(1)}%
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Participation
                    </small>
                    <div className="mt-1">
                      <small className="text-muted">
                        {statistiques.statistiques_principales?.activite?.etudiants_actifs || 0} actifs
                      </small>
                    </div>
                  </div>
                  <div className="text-warning">
                    <i data-feather="activity" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Onglets principaux */}
        <Tabs
          activeKey={activeTab}
          onSelect={setActiveTab}
          className="mb-4"
        >
          <Tab eventKey="overview" title="Vue d'ensemble">
            <Row>
              <Col lg={8}>
                {/* Évolution temporelle */}
                <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Header 
                    className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
                    onClick={() => toggleSection('evolution')}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <i data-feather="trending-up" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                        <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          Évolution temporelle
                        </h5>
                      </div>
                      <i 
                        data-feather={expandedSections.evolution ? "chevron-up" : "chevron-down"} 
                        className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                        style={{ width: "20px", height: "20px" }}
                      />
                    </div>
                  </Card.Header>
                  <Collapse in={expandedSections.evolution}>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={formatEvolutionData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Line 
                            type="monotone" 
                            dataKey="inscriptions" 
                            stroke={chartColors.primary} 
                            strokeWidth={2}
                            name="Inscriptions"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="reponses" 
                            stroke={chartColors.success} 
                            strokeWidth={2}
                            name="Réponses"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="etudiants_actifs" 
                            stroke={chartColors.warning} 
                            strokeWidth={2}
                            name="Étudiants actifs"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Collapse>
                </Card>

                {/* Performance par matière */}
                <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                    <div className="d-flex align-items-center">
                      <i data-feather="bar-chart-2" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
                      <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Performance par matière
                      </h5>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formatPerformanceData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="matiere" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="taux_reussite" fill={chartColors.success} name="Taux de réussite %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                {/* Distribution des notes */}
                <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                    <div className="d-flex align-items-center">
                      <i data-feather="pie-chart" className="text-info me-2" style={{ width: "20px", height: "20px" }}></i>
                      <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Distribution des Notes
                      </h5>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={formatDistributionNotes()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {formatDistributionNotes().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>

                {/* Radar des indicateurs de performance */}
                <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                    <div className="d-flex align-items-center">
                      <i data-feather="target" className="text-warning me-2" style={{ width: "20px", height: "20px" }}></i>
                      <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Indices de Performance
                      </h5>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={formatEngagementRadar()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Performance"
                          dataKey="value"
                          stroke={chartColors.primary}
                          fill={chartColors.primary}
                          fillOpacity={0.6}
                        />
                        <RechartsTooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>

                {/* Top étudiants */}
                {statistiques.analyses_performances?.top_etudiants && (
                  <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                      <div className="d-flex align-items-center">
                        <i data-feather="award" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
                        <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          Top Étudiants
                        </h5>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {statistiques.analyses_performances.top_etudiants.map((etudiant, index) => (
                        <div 
                          key={index}
                          className={`p-3 border-bottom d-flex justify-content-between align-items-center ${theme === "dark" ? "border-secondary" : ""}`}
                        >
                          <div>
                            <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              #{index + 1} {etudiant.etudiant}
                            </div>
                            <small className="text-muted">
                              {etudiant.classe} • {etudiant.total_reponses} réponses
                            </small>
                          </div>
                          <div className="text-end">
                            <Badge bg={etudiant.taux_reussite >= 80 ? 'success' : etudiant.taux_reussite >= 60 ? 'warning' : 'danger'}>
                              {etudiant.taux_reussite}%
                            </Badge>
                            <div className="small text-muted">
                              {etudiant.note_estimee}/20
                            </div>
                          </div>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                )}

                {/* Questions difficiles */}
                {Array.isArray(statistiques.analyses_performances?.questions_difficiles) && 
                statistiques.analyses_performances.questions_difficiles.length > 0 && (
                  <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                      <div className="d-flex align-items-center">
                        <i data-feather="alert-triangle" className="text-danger me-2" style={{ width: "20px", height: "20px" }}></i>
                        <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          Questions Difficiles
                        </h5>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {statistiques.analyses_performances.questions_difficiles.map((question, index) => (
                        <div 
                          key={index}
                          className={`p-3 border-bottom ${theme === "dark" ? "border-secondary" : ""}`}
                        >
                          <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {question.question}
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <small className="text-muted">
                              {question.matiere} • {question.total_reponses} réponses
                            </small>
                            <Badge bg="danger">
                              {question.taux_reussite}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="detailed" title="Analyses détaillées">
            <Row>
              <Col lg={6}>
                {/* Statistiques par entité */}
                {statistiques.statistiques_par_entite && (
                  <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header 
                      className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
                      onClick={() => toggleSection('entites')}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i data-feather="layers" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                          <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            Statistiques par Entité
                          </h5>
                        </div>
                        <i 
                          data-feather={expandedSections.entites ? "chevron-up" : "chevron-down"} 
                          className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                          style={{ width: "20px", height: "20px" }}
                        />
                      </div>
                    </Card.Header>
                    <Collapse in={expandedSections.entites}>
                      <Card.Body>
                        <Tabs defaultActiveKey="classes" className="mb-3">
                          <Tab eventKey="classes" title="Par Classe">
                            <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                              <thead>
                                <tr>
                                  <th>Classe</th>
                                  <th className="text-center">Étudiants</th>
                                  <th className="text-center">Matières</th>
                                  <th className="text-center">Taux Réussite</th>
                                </tr>
                              </thead>
                              <tbody>
                                {statistiques.statistiques_par_entite.par_classe?.map((classe, index) => (
                                  <tr key={index}>
                                    <td>
                                      <Button
                                        variant="link"
                                        className="p-0 text-start"
                                        onClick={() => fetchClassroomStats(classe.matricule_classroom)}
                                      >
                                        {classe.classe}
                                      </Button>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="info">{classe.etudiants}</Badge>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="success">{classe.matieres}</Badge>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg={classe.taux_reussite_moyen >= 70 ? 'success' : classe.taux_reussite_moyen >= 50 ? 'warning' : 'danger'}>
                                        {classe.taux_reussite_moyen}%
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Tab>

                          <Tab eventKey="matieres" title="Par Matière">
                            <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                              <thead>
                                <tr>
                                  <th>Matière</th>
                                  <th className="text-center">Cours</th>
                                  <th className="text-center">Évaluations</th>
                                  <th className="text-center">Difficulté</th>
                                </tr>
                              </thead>
                              <tbody>
                                {statistiques.statistiques_par_entite.par_matiere?.map((matiere, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div className={theme === "dark" ? "text-light" : "text-dark"}>
                                        {matiere.matiere}
                                      </div>
                                      <small className="text-muted">{matiere.classe}</small>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="primary">{matiere.cours}</Badge>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="info">{matiere.evaluations}</Badge>
                                    </td>
                                    <td className="text-center">
                                      <Badge 
                                        bg={
                                          matiere.difficulte === 'Facile' ? 'success' :
                                          matiere.difficulte === 'Moyenne' ? 'warning' :
                                          matiere.difficulte === 'Difficile' ? 'danger' : 'dark'
                                        }
                                      >
                                        {matiere.difficulte}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Tab>

                          <Tab eventKey="formateurs" title="Par Formateur">
                            <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                              <thead>
                                <tr>
                                  <th>Formateur</th>
                                  <th className="text-center">Cours Créés</th>
                                  <th className="text-center">Évaluations</th>
                                  <th className="text-center">Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {statistiques.statistiques_par_entite.par_formateur?.map((formateur, index) => (
                                  <tr key={index}>
                                    <td className={theme === "dark" ? "text-light" : "text-dark"}>
                                      {formateur.formateur}
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="success">{formateur.cours_crees}</Badge>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="info">{formateur.evaluations_creees}</Badge>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="primary">{formateur.activite_score}</Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Tab>
                        </Tabs>
                      </Card.Body>
                    </Collapse>
                  </Card>
                )}
              </Col>

              <Col lg={6}>
                {/* Tendances et prédictions */}
                {statistiques.tendances && (
                  <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header 
                      className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
                      onClick={() => toggleSection('tendances')}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i data-feather="trending-up" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
                          <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            Tendances & Prédictions
                          </h5>
                        </div>
                        <i 
                          data-feather={expandedSections.tendances ? "chevron-up" : "chevron-down"} 
                          className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                          style={{ width: "20px", height: "20px" }}
                        />
                      </div>
                    </Card.Header>
                    <Collapse in={expandedSections.tendances}>
                      <Card.Body>
                        <div className="mb-4">
                          <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>Croissance</h6>
                          <div className="row g-2">
                            <div className="col-6">
                              <div className="text-center p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
                                <div className="h6 mb-1 text-primary">
                                  {statistiques.tendances.croissance_utilisateurs?.evolution_pourcentage || 0}%
                                </div>
                                <small className="text-muted">Utilisateurs</small>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
                                <div className="h6 mb-1 text-success">
                                  {statistiques.tendances.evolution_activite?.evolution_pourcentage || 0}%
                                </div>
                                <small className="text-muted">Activité</small>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>Prédictions</h6>
                          <Alert variant="info" className="mb-3">
                            <i data-feather="info" className="me-2" style={{ width: '16px', height: '16px' }} />
                            <strong>Semaine prochaine:</strong>
                            <div className="mt-1">
                              • {statistiques.tendances.predictions?.inscriptions_prevues || 0} nouvelles inscriptions
                            </div>
                            <div>
                              • {statistiques.tendances.predictions?.activite_prevue || 0} réponses attendues
                            </div>
                          </Alert>

                          {statistiques.tendances.predictions?.recommandations?.length > 0 && (
                            <div>
                              <h6 className="small text-muted mb-2">Recommandations</h6>
                              {statistiques.tendances.predictions.recommandations.map((rec, index) => (
                                <Alert key={index} variant="warning" className="py-2">
                                  <i data-feather="lightbulb" className="me-2" style={{ width: '14px', height: '14px' }} />
                                  {rec}
                                </Alert>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Collapse>
                  </Card>
                )}

                {/* Comparaisons */}
                {statistiques.comparaisons && (
                  <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header 
                      className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
                      onClick={() => toggleSection('comparaisons')}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i data-feather="bar-chart-2" className="text-warning me-2" style={{ width: "20px", height: "20px" }}></i>
                          <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            Comparaisons
                          </h5>
                        </div>
                        <i 
                          data-feather={expandedSections.comparaisons ? "chevron-up" : "chevron-down"} 
                          className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                          style={{ width: "20px", height: "20px" }}
                        />
                      </div>
                    </Card.Header>
                    <Collapse in={expandedSections.comparaisons}>
                      <Card.Body>
                        <Tabs defaultActiveKey="periode" className="mb-3">
                          <Tab eventKey="periode" title="Période précédente">
                            <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                              <tbody>
                                <tr>
                                  <td>Inscriptions</td>
                                  <td className="text-end">
                                    <Badge bg={
                                      (statistiques.comparaisons.periode_precedente?.inscriptions?.evolution_pourcentage || 0) >= 0 ? 
                                      'success' : 'danger'
                                    }>
                                      {statistiques.comparaisons.periode_precedente?.inscriptions?.evolution_pourcentage || 0}%
                                    </Badge>
                                  </td>
                                </tr>
                                <tr>
                                  <td>Activité</td>
                                  <td className="text-end">
                                    <Badge bg={
                                      (statistiques.comparaisons.periode_precedente?.activite?.evolution_pourcentage || 0) >= 0 ? 
                                      'success' : 'danger'
                                    }>
                                      {statistiques.comparaisons.periode_precedente?.activite?.evolution_pourcentage || 0}%
                                    </Badge>
                                  </td>
                                </tr>
                                <tr>
                                  <td>Performance</td>
                                  <td className="text-end">
                                    <Badge bg={
                                      (statistiques.comparaisons.periode_precedente?.performance?.evolution_pourcentage || 0) >= 0 ? 
                                      'success' : 'danger'
                                    }>
                                      {statistiques.comparaisons.periode_precedente?.performance?.evolution_pourcentage || 0}%
                                    </Badge>
                                  </td>
                                </tr>
                              </tbody>
                            </Table>
                          </Tab>

                          <Tab eventKey="benchmark" title="Benchmark système">
                            <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                              <tbody>
                                <tr>
                                  <td>Taux de réussite</td>
                                  <td className="text-end">
                                    <span className={`${
                                      (statistiques.comparaisons.benchmark_systeme?.taux_reussite?.ecart || 0) >= 0 ? 
                                      'text-success' : 'text-danger'
                                    }`}>
                                      {statistiques.comparaisons.benchmark_systeme?.taux_reussite?.ecart >= 0 ? '+' : ''}
                                      {statistiques.comparaisons.benchmark_systeme?.taux_reussite?.ecart || 0}%
                                    </span>
                                  </td>
                                </tr>
                                <tr>
                                  <td>Participation</td>
                                  <td className="text-end">
                                    <span className={`${
                                      (statistiques.comparaisons.benchmark_systeme?.participation?.ecart || 0) >= 0 ? 
                                      'text-success' : 'text-danger'
                                    }`}>
                                      {statistiques.comparaisons.benchmark_systeme?.participation?.ecart >= 0 ? '+' : ''}
                                      {statistiques.comparaisons.benchmark_systeme?.participation?.ecart || 0}%
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </Table>
                          </Tab>
                        </Tabs>
                      </Card.Body>
                    </Collapse>
                  </Card>
                )}
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="reports" title="Rapports">
            <Row>
              <Col md={6}>
                <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                    <div className="d-flex align-items-center">
                      <i data-feather="users" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                      <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Rapport Étudiant
                      </h5>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Sélectionner un étudiant</Form.Label>
                      <Form.Select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      >
                        <option value="">Choisir un étudiant...</option>
                        {etudiants.map(etudiant => (
                          <option key={etudiant.matricule} value={etudiant.matricule}>
                            {etudiant.name} - {etudiant.classroom?.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Button
                      variant="primary"
                      onClick={() => selectedStudent && fetchStudentReport(selectedStudent)}
                      disabled={!selectedStudent}
                      className="w-100"
                    >
                      <i data-feather="user" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Générer le Rapport
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Header className={theme === "dark" ? "bg-dark border-secondary" : "bg-light"}>
                    <div className="d-flex align-items-center">
                      <i data-feather="home" className="text-info me-2" style={{ width: "20px", height: "20px" }}></i>
                      <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Statistiques de Classe
                      </h5>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Sélectionner une classe</Form.Label>
                      <Form.Select
                        value={selectedClassroom}
                        onChange={(e) => setSelectedClassroom(e.target.value)}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      >
                        <option value="">Choisir une classe...</option>
                        {classrooms.map(classroom => (
                          <option key={classroom.matricule} value={classroom.matricule}>
                            {classroom.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Button
                      variant="info"
                      onClick={() => selectedClassroom && fetchClassroomStats(selectedClassroom)}
                      disabled={!selectedClassroom}
                      className="w-100"
                    >
                      <i data-feather="home" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Analyser la Classe
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>

        {/* Modal rapport étudiant */}
        <Modal
          show={showStudentModal}
          onHide={() => setShowStudentModal(false)}
          centered
          size="xl"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Rapport de Performance - {rapportEtudiant.etudiant?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {rapportEtudiant.resume_performance && (
              <Row className="mb-4">
                <Col md={3}>
                  <Card className={`text-center ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body>
                      <h4 className="text-success">{rapportEtudiant.resume_performance.taux_reussite}%</h4>
                      <small>Taux de Réussite</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`text-center ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body>
                      <h4 className="text-info">{rapportEtudiant.resume_performance.note_moyenne_estimee}/20</h4>
                      <small>Note Moyenne</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`text-center ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body>
                      <h4 className="text-warning">{rapportEtudiant.resume_performance.total_questions_repondues}</h4>
                      <small>Questions Répondues</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`text-center ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body>
                      <h4 className="text-primary">{rapportEtudiant.resume_performance.total_evaluations_participees}</h4>
                      <small>Évaluations</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {rapportEtudiant.performance_par_matiere && (
              <div className="mb-4">
                <h6 className={theme === "dark" ? "text-light" : "text-dark"}>Performance par Matière</h6>
                <Table size="sm" className={theme === "dark" ? "table-dark" : ""}>
                  <thead>
                    <tr>
                      <th>Matière</th>
                      <th className="text-center">Réponses</th>
                      <th className="text-center">Taux Réussite</th>
                      <th className="text-center">Note/20</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapportEtudiant.performance_par_matiere.map((perf, index) => (
                      <tr key={index}>
                        <td className={theme === "dark" ? "text-light" : "text-dark"}>
                          {perf.matiere}
                        </td>
                        <td className="text-center">
                          <Badge bg="info">{perf.total_reponses}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg={perf.taux_reussite >= 70 ? 'success' : perf.taux_reussite >= 50 ? 'warning' : 'danger'}>
                            {perf.taux_reussite}%
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg={perf.note_estimee >= 14 ? 'success' : perf.note_estimee >= 10 ? 'warning' : 'danger'}>
                            {perf.note_estimee}/20
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {rapportEtudiant.points_forts_faibles && (
              <Row>
                <Col md={6}>
                  <h6 className="text-success">Points Forts</h6>
                  {rapportEtudiant.points_forts_faibles.points_forts.map((fort, index) => (
                    <Alert key={index} variant="success" className="py-2">
                      <strong>{fort.matiere}</strong> - {fort.taux_reussite}%
                    </Alert>
                  ))}
                </Col>
                <Col md={6}>
                  <h6 className="text-danger">Points à Améliorer</h6>
                  {rapportEtudiant.points_forts_faibles.points_faibles.map((faible, index) => (
                    <Alert key={index} variant="warning" className="py-2">
                      <strong>{faible.matiere}</strong> - {faible.taux_reussite}%
                    </Alert>
                  ))}
                </Col>
              </Row>
            )}

            {rapportEtudiant.recommandations && rapportEtudiant.recommandations.length > 0 && (
              <div className="mt-4">
                <h6 className={theme === "dark" ? "text-light" : "text-dark"}>Recommandations</h6>
                {rapportEtudiant.recommandations.map((rec, index) => (
                  <Alert key={index} variant="info" className="py-2">
                    <i data-feather="lightbulb" className="me-2" style={{ width: '14px', height: '14px' }} />
                    {rec}
                  </Alert>
                ))}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowStudentModal(false)}>
              Fermer
            </Button>
            <Button variant="primary" onClick={() => handleExport('pdf')}>
              <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Exporter PDF
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal statistiques de classe */}
        <Modal
          show={showClassroomModal}
          onHide={() => setShowClassroomModal(false)}
          centered
          size="xl"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Statistiques Détaillées - {statsClasse.informations_classe?.classe?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {statsClasse.etudiants && (
              <Row className="mb-4">
                <Col md={3}>
                  <Card className={`text-center ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body>
                      <h4 className="text-primary">{statsClasse.etudiants.total_etudiants}</h4>
                      <small>Étudiants Inscrits</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`text-center ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body>
                      <h4 className="text-success">{statsClasse.etudiants.etudiants_actifs}</h4>
                      <small>Étudiants Actifs</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`text-center ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body>
                      <h4 className="text-warning">{statsClasse.etudiants.taux_participation}%</h4>
                      <small>Taux Participation</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className={`text-center ${theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}`}>
                    <Card.Body>
                      <h4 className="text-info">{Math.round(statsClasse.etudiants.moyenne_reponses_par_etudiant || 0)}</h4>
                      <small>Moy. Réponses/Étudiant</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            <Tabs defaultActiveKey="matieres" className="mb-3">
              <Tab eventKey="matieres" title="Matières">
                {statsClasse.matieres && (
                  <Table className={theme === "dark" ? "table-dark" : ""}>
                    <thead>
                      <tr>
                        <th>Matière</th>
                        <th className="text-center">Cours</th>
                        <th className="text-center">Évaluations</th>
                        <th className="text-center">Taux Réussite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsClasse.matieres.map((matiere, index) => (
                        <tr key={index}>
                          <td className={theme === "dark" ? "text-light" : "text-dark"}>
                            {matiere.matiere}
                          </td>
                          <td className="text-center">
                            <Badge bg="primary">{matiere.cours}</Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg="info">{matiere.evaluations}</Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg={matiere.taux_reussite >= 70 ? 'success' : matiere.taux_reussite >= 50 ? 'warning' : 'danger'}>
                              {matiere.taux_reussite}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab>

              <Tab eventKey="evaluations" title="Évaluations">
                {statsClasse.evaluations && (
                  <div>
                    <Row className="mb-3">
                      <Col md={4}>
                        <div className="text-center">
                          <h5 className="text-primary">{statsClasse.evaluations.total_evaluations}</h5>
                          <small>Total Évaluations</small>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h5 className="text-success">{statsClasse.evaluations.evaluations_par_statut?.programmees || 0}</h5>
                          <small>Programmées</small>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h5 className="text-info">{statsClasse.evaluations.evaluations_par_statut?.terminees || 0}</h5>
                          <small>Terminées</small>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
              </Tab>

              <Tab eventKey="performance" title="Performance">
                {statsClasse.performance && (
                  <Row>
                    <Col md={6}>
                      <Card className={theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}>
                        <Card.Body>
                          <h6>Taux de Réussite Moyen</h6>
                          <div className="d-flex align-items-center">
                            <ProgressBar 
                              now={statsClasse.performance.taux_reussite_moyen} 
                              variant={statsClasse.performance.taux_reussite_moyen >= 70 ? 'success' : statsClasse.performance.taux_reussite_moyen >= 50 ? 'warning' : 'danger'}
                              className="flex-grow-1 me-3"
                            />
                            <span className="fw-bold">{statsClasse.performance.taux_reussite_moyen}%</span>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className={theme === "dark" ? "bg-secondary bg-opacity-10" : "bg-light"}>
                        <Card.Body>
                          <h6>Note Moyenne Estimée</h6>
                          <div className="text-center">
                            <h4 className={
                              statsClasse.performance.note_moyenne_estimee >= 14 ? 'text-success' :
                              statsClasse.performance.note_moyenne_estimee >= 10 ? 'text-warning' : 'text-danger'
                            }>
                              {statsClasse.performance.note_moyenne_estimee}/20
                            </h4>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowClassroomModal(false)}>
              Fermer
            </Button>
            <Button variant="primary" onClick={() => handleExport('pdf')}>
              <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Exporter PDF
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal d'exportation */}
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
            <p className={theme === "dark" ? "text-light" : "text-dark"}>
              Choisissez le format d'exportation pour vos statistiques :
            </p>
            <div className="d-grid gap-2">
              <Button 
                variant="outline-danger" 
                onClick={() => handleExport('pdf')}
                className="d-flex align-items-center justify-content-center"
              >
                <i data-feather="file-text" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                Exporter en PDF
                <small className="ms-auto text-muted">Rapport détaillé</small>
              </Button>
              <Button 
                variant="outline-success" 
                onClick={() => handleExport('xlsx')}
                className="d-flex align-items-center justify-content-center"
              >
                <i data-feather="grid" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                Exporter en Excel
                <small className="ms-auto text-muted">Données brutes</small>
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              Annuler
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
    </FormateurLayout>
  );
}