import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Form, Badge, 
  Spinner, Table, ProgressBar
} from "react-bootstrap";
import { Link } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function StatistiquesAvanceesResultats() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [statistiques, setStatistiques] = useState({});
  const [classrooms, setClassrooms] = useState([]);
  const [matieres, setMatieres] = useState([]);

  // États des filtres
  const [filters, setFilters] = useState({
    matricule_classroom: "",
    matricule_matiere: "",
    date_debut: "",
    date_fin: ""
  });

  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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

  // Charger les statistiques
  const fetchStatistiques = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]?.trim()) {
          params[key] = filters[key].trim();
        }
      });

      const [statsResponse, classroomsResponse, matieresResponse] = await Promise.all([
        api.get('/formateur/answers/statistics/advanced', { params }),
        api.get('/formateur/view/classroom'),
        api.get('/formateur/view/matiere')
      ]);
      
      setStatistiques(statsResponse.data.statistiques || {});
      setClassrooms(classroomsResponse.data.classrooms || []);
      setMatieres(matieresResponse.data.matieres || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStatistiques();
  }, [fetchStatistiques]);

  useEffect(() => {
    feather.replace();
  }, [statistiques]);

  // Préparer les données pour les graphiques
  const prepareChartData = () => {
    if (!statistiques.taux_reussite?.par_classe) return [];
    
    return Object.entries(statistiques.taux_reussite.par_classe).map(([classe, data]) => ({
      name: classe,
      taux: data.taux,
      total: data.total_reponses,
      correctes: data.reponses_correctes
    }));
  };

  const preparePieData = () => {
    if (!statistiques.par_type_question) return [];
    
    return [
      { name: 'QCM', value: statistiques.par_type_question.qcm },
      { name: 'Libre', value: statistiques.par_type_question.libre }
    ];
  };

  // Filtrer les matières selon la classe sélectionnée
  const matieresFiltrees = filters.matricule_classroom 
    ? matieres.filter(m => m.matricule_classroom === filters.matricule_classroom)
    : matieres;

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
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-warning bg-opacity-25" : "bg-warning bg-opacity-10"}`}>
              <i data-feather="trending-up" className="text-warning" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Statistiques Avancées
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Analyse détaillée des performances et tendances
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-4">
            <Link 
              to="/formateur/answers/results" 
              className="btn btn-outline-secondary btn-sm me-2"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '14px', height: '14px' }} />
              Retour aux résultats
            </Link>
            <Link 
              to="/formateur/view/evaluations" 
              className="btn btn-outline-primary btn-sm"
            >
              <i data-feather="clipboard" className="me-1" style={{ width: '14px', height: '14px' }} />
              Gestion des évaluations
            </Link>
          </div>

          {/* Statistiques générales */}
          {statistiques.general && (
            <Row className="mb-4">
              <Col md={3}>
                <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Body className="text-center">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {statistiques.general.total_reponses}
                        </h3>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          Réponses totales
                        </small>
                      </div>
                      <div className="text-primary">
                        <i data-feather="message-circle" style={{ width: "24px", height: "24px" }}></i>
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
                          {statistiques.general.total_etudiants}
                        </h3>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          Étudiants actifs
                        </small>
                      </div>
                      <div className="text-info">
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
                        <h3 className="mb-0 text-success">
                          {statistiques.general.total_evaluations}
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
              <Col md={3}>
                <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                  <Card.Body className="text-center">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h3 className="mb-0 text-warning">
                          {statistiques.taux_reussite?.global || 0}%
                        </h3>
                        <small className={theme === "dark" ? "text-light" : "text-muted"}>
                          Taux global
                        </small>
                      </div>
                      <div className="text-warning">
                        <i data-feather="trending-up" style={{ width: "24px", height: "24px" }}></i>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </div>

        {/* Filtres */}
        <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
              <i data-feather="filter" className="me-2" style={{ width: "20px", height: "20px" }}></i>
              Filtres d'analyse
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={3}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="home" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Classe
                </Form.Label>
                <Form.Select
                  value={filters.matricule_classroom}
                  onChange={e => setFilters({ ...filters, matricule_classroom: e.target.value, matricule_matiere: "" })}
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
                  <i data-feather="book" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Matière
                </Form.Label>
                <Form.Select
                  value={filters.matricule_matiere}
                  onChange={e => setFilters({ ...filters, matricule_matiere: e.target.value })}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                >
                  <option value="">Toutes les matières</option>
                  {matieresFiltrees.map(matiere => (
                    <option key={matiere.matricule} value={matiere.matricule}>
                      {matiere.nom}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Date début
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_debut}
                  onChange={e => setFilters({ ...filters, date_debut: e.target.value })}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                />
              </Col>
              <Col md={3}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
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

        {/* Graphiques et analyses */}
        <Row className="mb-4">
          {/* Évolution temporelle */}
          <Col md={8}>
            <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="trending-up" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  Évolution des Réponses (30 derniers jours)
                </h5>
              </Card.Header>
              <Card.Body>
                {statistiques.evolution_temporelle?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={statistiques.evolution_temporelle}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total_reponses" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Réponses"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="etudiants_actifs" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="Étudiants actifs"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">Pas assez de données pour afficher le graphique</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Répartition par type de question */}
          <Col md={4}>
            <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="pie-chart" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  Types de Questions
                </h5>
              </Card.Header>
              <Card.Body>
                {statistiques.par_type_question && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={preparePieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Taux de réussite par classe */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="bar-chart-2" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                  Taux de Réussite par Classe
                </h5>
              </Card.Header>
              <Card.Body>
                {prepareChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'taux' ? `${value}%` : value,
                          name === 'taux' ? 'Taux de réussite' : 
                          name === 'total' ? 'Total réponses' : 'Réponses correctes'
                        ]}
                      />
                      <Bar dataKey="taux" fill="#8884d8" name="taux" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">Aucune donnée disponible</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Top étudiants les plus actifs */}
        {statistiques.top_etudiants?.length > 0 && (
          <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                <i data-feather="users" className="me-2" style={{ width: "20px", height: "20px" }}></i>
                Top 10 des Étudiants les Plus Actifs
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                  <thead className="table-primary">
                    <tr>
                      <th width="60">#</th>
                      <th>Étudiant</th>
                      <th className="text-center">Réponses</th>
                      <th className="text-center">Correctes</th>
                      <th className="text-center">Taux de réussite</th>
                      <th className="text-center">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistiques.top_etudiants.map((etudiantStat, index) => (
                      <tr key={etudiantStat.etudiant?.matricule || index}>
                        <td className="text-center">
                          <div className={`bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center`} 
                               style={{ width: '32px', height: '32px' }}>
                            <small className="fw-bold">{index + 1}</small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className={`me-2 p-2 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                              <i data-feather="user" className="text-info" style={{ width: "16px", height: "16px" }}></i>
                            </div>
                            <div>
                              <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {etudiantStat.etudiant?.name || 'Étudiant inconnu'}
                              </div>
                              <small className="text-muted">
                                {etudiantStat.etudiant?.matricule}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <Badge bg="primary" className="px-2 py-1">
                            {etudiantStat.total_reponses}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="success" className="px-2 py-1">
                            {etudiantStat.reponses_correctes}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge 
                            bg={etudiantStat.taux_reussite >= 80 ? 'success' : 
                                etudiantStat.taux_reussite >= 60 ? 'warning' : 'danger'} 
                            className="px-2 py-1"
                          >
                            {etudiantStat.taux_reussite}%
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div style={{ width: '100px' }}>
                            <ProgressBar 
                              now={etudiantStat.taux_reussite} 
                              variant={etudiantStat.taux_reussite >= 80 ? 'success' : 
                                      etudiantStat.taux_reussite >= 60 ? 'warning' : 'danger'}
                              style={{ height: '8px' }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </FormateurLayout>
  );
}