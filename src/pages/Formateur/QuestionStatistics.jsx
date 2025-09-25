import React, { useState, useEffect, useCallback } from "react";
import { Container, Card, Row, Col, Table, Badge, ProgressBar, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function QuestionStatistics() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [statistiques, setStatistiques] = useState({});
  const [questionsRecentes, setQuestionsRecentes] = useState([]);
  const [questionsPopulaires, setQuestionsPopulaires] = useState([]);
  const [repartitionParType, setRepartitionParType] = useState([]);

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

  // Charger les données statistiques
  const fetchStatisticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques générales
      const statsRes = await api.get("/formateur/questions/statistics");
      setStatistiques(statsRes.data.statistics || {});
      
      // Charger les questions avec filtres pour analyses
      const questionsRes = await api.get("/formateur/view/questions");
      const questions = questionsRes.data.questions || [];
      
      // Analyser les données
      const recentes = questions.slice(0, 10); // 10 plus récentes
      
      // Questions les plus "populaires" (avec le plus de réponses)
      const populaires = [...questions]
        .sort((a, b) => (b.reponses_count || 0) - (a.reponses_count || 0))
        .slice(0, 8);
      
      // Répartition par type
      const typeCount = questions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
      }, {});
      
      const typeRepartition = Object.entries(typeCount).map(([type, count]) => ({
        type,
        count,
        pourcentage: questions.length > 0 ? ((count / questions.length) * 100).toFixed(1) : 0
      }));
      
      setQuestionsRecentes(recentes);
      setQuestionsPopulaires(populaires);
      setRepartitionParType(typeRepartition);
      
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatisticsData();
  }, [fetchStatisticsData]);

  useEffect(() => {
    feather.replace();
  }, [statistiques, questionsRecentes]);

  const getTypeBadge = (type) => {
    switch(type) {
      case 'QCM': return 'primary';
      case 'Réponse_libre': return 'success';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'QCM': return 'check-square';
      case 'Réponse_libre': return 'edit-3';
      default: return 'help-circle';
    }
  };

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

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
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
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
              <i data-feather="trending-up" className="text-info" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Statistiques des Questions
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Analyse et aperçu de vos questions d'évaluation
              </p>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques générales */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {statistiques.total_questions || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Total questions
                    </small>
                  </div>
                  <div className="text-primary">
                    <i data-feather="help-circle" style={{ width: "32px", height: "32px" }}></i>
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
                      {statistiques.questions_qcm || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Questions QCM
                    </small>
                  </div>
                  <div className="text-primary">
                    <i data-feather="check-square" style={{ width: "32px", height: "32px" }}></i>
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
                      {statistiques.questions_libres || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Réponses libres
                    </small>
                  </div>
                  <div className="text-success">
                    <i data-feather="edit-3" style={{ width: "32px", height: "32px" }}></i>
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
                      {statistiques.questions_par_evaluation?.length || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Évaluations
                    </small>
                  </div>
                  <div className="text-warning">
                    <i data-feather="clipboard" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Répartition par type */}
          <Col lg={4}>
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex align-items-center">
                  <i data-feather="pie-chart" className="text-info me-2" style={{ width: "20px", height: "20px" }}></i>
                  <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Répartition par type
                  </span>
                </div>
              </Card.Header>
              
              <Card.Body className={theme === "dark" ? "bg-dark" : ""}>
                {repartitionParType.length > 0 ? (
                  <div>
                    {repartitionParType.map((item) => (
                      <div key={item.type} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            <Badge bg={getTypeBadge(item.type)} className="me-2">
                              <i data-feather={getTypeIcon(item.type)} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                              {item.type}
                            </Badge>
                            <span className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                              {item.count} questions
                            </span>
                          </div>
                          <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {item.pourcentage}%
                          </span>
                        </div>
                        <ProgressBar 
                          now={parseFloat(item.pourcentage)} 
                          variant={getTypeBadge(item.type)}
                          style={{ height: '6px' }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <i data-feather="pie-chart" className="mb-2" style={{ width: "24px", height: "24px", opacity: 0.5 }}></i>
                      <p className="small mb-0">Aucune donnée disponible</p>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Questions récentes */}
          <Col lg={8}>
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i data-feather="clock" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Questions récentes
                    </span>
                  </div>
                  <Badge bg="primary" className="px-3 py-2">
                    {questionsRecentes.length}
                  </Badge>
                </div>
              </Card.Header>
              
              <Card.Body className={`p-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                {questionsRecentes.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                      <thead className="table-light">
                        <tr>
                          <th>Question</th>
                          <th className="text-center">Type</th>
                          <th className="text-center">Points</th>
                          <th className="text-center">Réponses</th>
                          <th>Date création</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questionsRecentes.map((question) => (
                          <tr key={question.id}>
                            <td>
                              <div>
                                <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  <Link 
                                    to={`/formateur/show/question/${question.id}`}
                                    className="text-decoration-none"
                                  >
                                    {question.enonce.length > 50 ? 
                                      question.enonce.substring(0, 50) + "..." : 
                                      question.enonce
                                    }
                                  </Link>
                                </div>
                                <small className="text-muted">
                                  {question.evaluation?.matiere?.classroom?.name} - {question.evaluation?.matiere?.nom}
                                </small>
                              </div>
                            </td>
                            <td className="text-center">
                              <Badge bg={getTypeBadge(question.type)} className="px-2 py-1">
                                <i data-feather={getTypeIcon(question.type)} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                                {question.type}
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge bg="warning" className="px-2 py-1">
                                {question.points} pts
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge bg="secondary" className="px-2 py-1">
                                {question.reponses_count || 0}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {formatDate(question.created_at)}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <i data-feather="clock" className="mb-2" style={{ width: "32px", height: "32px", opacity: 0.5 }}></i>
                      <div>
                        <h6>Aucune question récente</h6>
                        <p className="small mb-0">Créez votre première question</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Questions les plus populaires */}
        <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="trending-up" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Questions les plus répondues
                </span>
              </div>
              <Badge bg="success" className="px-3 py-2">
                Top {questionsPopulaires.length}
              </Badge>
            </div>
          </Card.Header>
          
          <Card.Body className={`p-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            {questionsPopulaires.length > 0 ? (
              <div className="table-responsive">
                <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                  <thead className="table-success">
                    <tr>
                      <th width="50">#</th>
                      <th>Question</th>
                      <th>Contexte</th>
                      <th className="text-center">Type</th>
                      <th className="text-center">Points</th>
                      <th className="text-center">Réponses</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionsPopulaires.map((question, index) => (
                      <tr key={question.id}>
                        <td className="text-center">
                          <div className={`bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center ${index < 3 ? 'fw-bold' : ''}`} style={{ width: '30px', height: '30px' }}>
                            {index + 1}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {question.enonce.length > 60 ? 
                                question.enonce.substring(0, 60) + "..." : 
                                question.enonce
                              }
                            </div>
                            <small className="text-muted">{question.matricule}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                              <i data-feather="home" className="me-1" style={{ width: '10px', height: '10px' }}></i>
                              {question.evaluation?.matiere?.classroom?.name || 'N/A'}
                            </div>
                            <div className="small text-success">
                              <i data-feather="book" className="me-1" style={{ width: '10px', height: '10px' }}></i>
                              {question.evaluation?.matiere?.nom || 'N/A'}
                            </div>
                            <div className="small text-info">
                              <i data-feather="clipboard" className="me-1" style={{ width: '10px', height: '10px' }}></i>
                              {question.evaluation?.titre || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <Badge bg={getTypeBadge(question.type)} className="px-2 py-1">
                            <i data-feather={getTypeIcon(question.type)} className="me-1" style={{ width: '8px', height: '8px' }}></i>
                            {question.type}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="warning" className="px-2 py-1">
                            {question.points} pts
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Badge bg="success" className="px-3 py-2 fw-bold">
                            {question.reponses_count || 0}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Link
                            to={`/formateur/show/question/${question.id}`}
                            className="btn btn-outline-info btn-sm"
                            title="Voir les détails"
                          >
                            <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="trending-up" className="mb-2" style={{ width: "32px", height: "32px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucune donnée de popularité</h6>
                    <p className="small mb-0">Les statistiques apparaîtront quand les étudiants répondront</p>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Statistiques par jour */}
        {statistiques.questions_par_jour && statistiques.questions_par_jour.length > 0 && (
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <div className="d-flex align-items-center">
                <i data-feather="bar-chart" className="text-warning me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Activité des 7 derniers jours
                </span>
              </div>
            </Card.Header>
            
            <Card.Body>
              <div className="row">
                {statistiques.questions_par_jour.map((jour, index) => (
                  <div key={jour.date} className="col-md-3 mb-3">
                    <div className="text-center">
                      <div className={`h5 mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {jour.nombre}
                      </div>
                      <small className="text-muted">
                        {new Date(jour.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </small>
                      <ProgressBar 
                        now={jour.nombre} 
                        max={Math.max(...statistiques.questions_par_jour.map(j => j.nombre))} 
                        variant="warning"
                        style={{ height: '4px' }}
                        className="mt-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </FormateurLayout>
  );
}