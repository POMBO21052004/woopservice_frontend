import React, { useState, useEffect, useCallback } from "react";
import { Container, Card, Row, Col, Table, Badge, Button, ProgressBar, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function EvaluationDashboard() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [statistiques, setStatistiques] = useState({});
  const [evaluationsRecentes, setEvaluationsRecentes] = useState([]);
  const [evaluationsEnCours, setEvaluationsEnCours] = useState([]);
  const [evaluationsProchaines, setEvaluationsProchaines] = useState([]);

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
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques
      const statsRes = await api.get("/formateur/evaluations/statistics");
      setStatistiques(statsRes.data.statistics || {});
      
      // Charger les évaluations avec filtres
      const evaluationsRes = await api.get("/formateur/view/evaluations");
      const evaluations = evaluationsRes.data.evaluations || [];
      
      // Trier et filtrer les évaluations
      const now = new Date();
      
      const enCours = evaluations.filter(e => e.etat_temporel === 'En cours');
      const prochaines = evaluations.filter(e => e.etat_temporel === 'Future').slice(0, 5);
      const recentes = evaluations.slice(0, 8); // 8 plus récentes
      
      setEvaluationsEnCours(enCours);
      setEvaluationsProchaines(prochaines);
      setEvaluationsRecentes(recentes);
      
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    feather.replace();
  }, [statistiques, evaluationsRecentes]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Programmée': return 'primary';
      case 'Brouillon': return 'warning';
      case 'Terminée': return 'success';
      case 'Annulée': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Programmée': return 'calendar';
      case 'Brouillon': return 'edit-3';
      case 'Terminée': return 'check-circle';
      case 'Annulée': return 'x-circle';
      default: return 'help-circle';
    }
  };

  const getEtatTemporelBadge = (etat) => {
    switch(etat) {
      case 'En cours': return 'success';
      case 'Future': return 'info';
      case 'Passée': return 'secondary';
      default: return 'secondary';
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
          <p className="mt-2">Chargement du tableau de bord...</p>
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
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="bar-chart-2" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Tableau de bord des évaluations
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Vue d'ensemble de vos évaluations et statistiques
              </p>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button 
              variant="primary"
              as={Link}
              to="/formateur/view/evaluations"
            >
              <i data-feather="list" className="me-2" style={{ width: '16px', height: '16px' }} />
              Voir toutes les évaluations
            </Button>
          </div>
        </div>

        {/* Évaluations en cours (alerte) */}
        {evaluationsEnCours.length > 0 && (
          <Alert variant="info" className="mb-4">
            <div className="d-flex align-items-center">
              <i data-feather="clock" className="me-2" style={{ width: '20px', height: '20px' }} />
              <strong>Évaluations en cours : </strong>
              <span className="ms-2">
                {evaluationsEnCours.map((evalCours, index) => (
                  <span key={evalCours.id}>
                    <Link to={`/formateur/show/evaluation/${evalCours.id}`} className="text-decoration-none">
                      {evalCours.titre}
                    </Link>
                    {index < evaluationsEnCours.length - 1 && ', '}
                  </span>
                ))}
              </span>
            </div>
          </Alert>
        )}

        {/* Cartes de statistiques */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body className="text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {statistiques.total_evaluations || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Total évaluations
                    </small>
                  </div>
                  <div className="text-primary">
                    <i data-feather="clipboard" style={{ width: "32px", height: "32px" }}></i>
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
                      {statistiques.terminee_evaluations || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Terminées
                    </small>
                  </div>
                  <div className="text-success">
                    <i data-feather="check-circle" style={{ width: "32px", height: "32px" }}></i>
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
                      {statistiques.programmee_evaluations || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Programmées
                    </small>
                  </div>
                  <div className="text-primary">
                    <i data-feather="calendar" style={{ width: "32px", height: "32px" }}></i>
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
                      {statistiques.brouillon_evaluations || 0}
                    </h3>
                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                      Brouillons
                    </small>
                  </div>
                  <div className="text-warning">
                    <i data-feather="edit-3" style={{ width: "32px", height: "32px" }}></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Évaluations prochaines */}
          <Col lg={6}>
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i data-feather="calendar" className="text-info me-2" style={{ width: "20px", height: "20px" }}></i>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Prochaines évaluations
                    </span>
                  </div>
                  <Badge bg="info" className="px-3 py-2">
                    {evaluationsProchaines.length}
                  </Badge>
                </div>
              </Card.Header>
              
              <Card.Body className={`p-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                {evaluationsProchaines.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                      <tbody>
                        {evaluationsProchaines.map((evaluation) => (
                          <tr key={evaluation.id}>
                            <td>
                              <div>
                                <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  <Link 
                                    to={`/formateur/show/evaluation/${evaluation.id}`}
                                    className="text-decoration-none"
                                  >
                                    {evaluation.titre}
                                  </Link>
                                </div>
                                <small className="text-muted">
                                  {evaluation.matiere?.classroom?.name} - {evaluation.matiere?.nom}
                                </small>
                              </div>
                            </td>
                            <td className="text-end">
                              <div className="small text-muted">
                                {formatDate(evaluation.date_debut)}
                              </div>
                              <Badge bg={getEtatTemporelBadge(evaluation.etat_temporel)} className="small">
                                {evaluation.etat_temporel}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <i data-feather="calendar" className="mb-2" style={{ width: "32px", height: "32px", opacity: 0.5 }}></i>
                      <div>
                        <h6>Aucune évaluation prochaine</h6>
                        <p className="small mb-0">Toutes vos évaluations sont à jour</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
              
              {evaluationsProchaines.length > 0 && (
                <Card.Footer className="text-center">
                  <Button 
                    variant="outline-info" 
                    size="sm"
                    as={Link}
                    to="/formateur/view/evaluations?status=Programmée"
                  >
                    Voir toutes les évaluations programmées
                  </Button>
                </Card.Footer>
              )}
            </Card>
          </Col>

          {/* Évaluations récentes */}
          <Col lg={6}>
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i data-feather="clock" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Évaluations récentes
                    </span>
                  </div>
                  <Badge bg="primary" className="px-3 py-2">
                    {evaluationsRecentes.length}
                  </Badge>
                </div>
              </Card.Header>
              
              <Card.Body className={`p-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                {evaluationsRecentes.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                      <tbody>
                        {evaluationsRecentes.map((evaluation) => (
                          <tr key={evaluation.id}>
                            <td>
                              <div>
                                <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  <Link 
                                    to={`/formateur/show/evaluation/${evaluation.id}`}
                                    className="text-decoration-none"
                                  >
                                    {evaluation.titre}
                                  </Link>
                                </div>
                                <small className="text-muted">
                                  {evaluation.questions_count} questions - {evaluation.total_points || 0} pts
                                </small>
                              </div>
                            </td>
                            <td className="text-end">
                              <Badge bg={getStatusBadge(evaluation.status)} className="mb-1">
                                <i data-feather={getStatusIcon(evaluation.status)} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                                {evaluation.status}
                              </Badge>
                              <div className="small text-muted">
                                {formatDate(evaluation.created_at)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                      <i data-feather="clipboard" className="mb-2" style={{ width: "32px", height: "32px", opacity: 0.5 }}></i>
                      <div>
                        <h6>Aucune évaluation</h6>
                        <p className="small mb-3">Commencez par créer votre première évaluation</p>
                        <Button 
                          variant="primary" 
                          size="sm"
                          as={Link}
                          to="/formateur/view/evaluations"
                        >
                          <i data-feather="plus" className="me-1" style={{ width: '14px', height: '14px' }} />
                          Créer une évaluation
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
              
              {evaluationsRecentes.length > 0 && (
                <Card.Footer className="text-center">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    as={Link}
                    to="/formateur/view/evaluations"
                  >
                    Voir toutes les évaluations
                  </Button>
                </Card.Footer>
              )}
            </Card>
          </Col>
        </Row>

        {/* Top matières par nombre d'évaluations */}
        {statistiques.evaluations_par_matiere && statistiques.evaluations_par_matiere.length > 0 && (
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <div className="d-flex align-items-center">
                <i data-feather="trending-up" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Top 5 des matières
                </span>
                <small className={`ms-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  (par nombre d'évaluations)
                </small>
              </div>
            </Card.Header>
            
            <Card.Body>
              <Row>
                {statistiques.evaluations_par_matiere.slice(0, 5).map((item, index) => (
                  <Col key={item.matricule_matiere} md={6} lg={4} className="mb-3">
                    <div className="d-flex align-items-center">
                      <div className={`me-3 p-2 rounded-circle ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-info' : 'bg-secondary'} bg-opacity-10`}>
                        <i data-feather="award" className={`${index === 0 ? 'text-warning' : index === 1 ? 'text-info' : 'text-secondary'}`} style={{ width: "16px", height: "16px" }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                          {item.matiere?.nom || 'Matière inconnue'}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {item.matiere?.classroom?.name || 'Classe inconnue'}
                          </small>
                          <Badge bg="primary">{item.total}</Badge>
                        </div>
                        <ProgressBar 
                          now={(item.total / statistiques.total_evaluations) * 100} 
                          style={{ height: '4px' }}
                          className="mt-1"
                          variant={index === 0 ? 'warning' : index === 1 ? 'info' : 'secondary'}
                        />
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        )}
      </Container>
    </FormateurLayout>
  );
}