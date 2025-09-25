import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Badge, Alert, Spinner, Toast, ToastContainer, 
  Collapse, ProgressBar, Table
} from "react-bootstrap";
import { Link } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function MesResultatsEtudiant() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [classroom, setClassroom] = useState({});
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationsGroupees, setEvaluationsGroupees] = useState({});

  // États de l'accordion
  const [openSections, setOpenSections] = useState({});

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

  // Charger les évaluations auxquelles l'étudiant a participé
  const fetchMesResultats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/etudiant/view/evaluations/my-classroom');
      
      if (response.data.status === 'success') {
        setClassroom(response.data.classroom || {});
        
        // Filtrer uniquement les évaluations auxquelles l'étudiant a participé
        const evaluationsParticipees = (response.data.evaluations || []).filter(eva => eva.a_participe);
        setEvaluations(evaluationsParticipees);
        
        // Regrouper par matière
        const groupes = {};
        evaluationsParticipees.forEach(evaluation => {
          const nomMatiere = evaluation.matiere?.nom || 'Matière non définie';
          if (!groupes[nomMatiere]) {
            groupes[nomMatiere] = [];
          }
          groupes[nomMatiere].push(evaluation);
        });
        
        setEvaluationsGroupees(groupes);
      } else {
        showToastMessage(response.data.message || "Erreur lors du chargement des résultats", 'danger');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des résultats:', err);
      const errorMessage = err.response?.data?.message || "Erreur lors du chargement des résultats";
      showToastMessage(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMesResultats();
  }, [fetchMesResultats]);

  useEffect(() => {
    feather.replace();
  }, [evaluationsGroupees]);

  // Gérer l'accordion
  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getScoreBadge = (pourcentage) => {
    if (pourcentage >= 80) return 'success';
    if (pourcentage >= 60) return 'primary';
    if (pourcentage >= 40) return 'warning';
    return 'danger';
  };

  const getScoreText = (pourcentage) => {
    if (pourcentage >= 80) return 'Excellent';
    if (pourcentage >= 60) return 'Bien';
    if (pourcentage >= 40) return 'Passable';
    return 'Insuffisant';
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

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  // Calculer les statistiques générales
  const calculateStats = () => {
    if (evaluations.length === 0) {
      return {
        totalEvaluations: 0,
        moyenneGenerale: 0,
        excellentCount: 0,
        totalPoints: 0,
        pointsObtenus: 0
      };
    }

    const evaluationsAvecScore = evaluations.filter(e => e.pourcentage !== undefined);
    const moyenneGenerale = evaluationsAvecScore.length > 0 
      ? evaluationsAvecScore.reduce((sum, e) => sum + e.pourcentage, 0) / evaluationsAvecScore.length 
      : 0;
    
    const excellentCount = evaluationsAvecScore.filter(e => e.pourcentage >= 80).length;
    const totalPoints = evaluations.reduce((sum, e) => sum + (e.total_points || 0), 0);
    const pointsObtenus = evaluations.reduce((sum, e) => sum + (e.score_obtenu || 0), 0);

    return {
      totalEvaluations: evaluations.length,
      moyenneGenerale: Math.round(moyenneGenerale * 100) / 100,
      excellentCount,
      totalPoints,
      pointsObtenus
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <EtudiantLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement de vos résultats...</p>
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
              <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
                <i data-feather="award" className="text-success" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Mes Résultats d'Évaluations
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Historique de vos performances • {classroom.name || 'Ma Classe'}
                </p>
              </div>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary"
                onClick={fetchMesResultats}
                title="Actualiser"
              >
                <i data-feather="refresh-cw" style={{ width: "16px", height: "16px" }}></i>
              </Button>
              <Button 
                variant="outline-secondary"
                as={Link}
                to="/etudiant/view/evaluations/my-classroom"
                title="Toutes les évaluations"
              >
                <i data-feather="list" className="me-1" style={{ width: "16px", height: "16px" }}></i>
                Toutes
              </Button>
            </div>
          </div>

          {/* Statistiques générales */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {stats.totalEvaluations}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Évaluations faites
                      </small>
                    </div>
                    <div className="text-primary">
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
                      <h3 className={`mb-0 text-${getScoreBadge(stats.moyenneGenerale)}`}>
                        {stats.moyenneGenerale}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Moyenne générale
                      </small>
                    </div>
                    <div className={`text-${getScoreBadge(stats.moyenneGenerale)}`}>
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
                        {stats.excellentCount}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Excellents résultats
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
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {stats.pointsObtenus}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Points obtenus
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

          {/* Barre de progression générale */}
          {stats.totalPoints > 0 && (
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    Performance globale
                  </h6>
                  <Badge bg={getScoreBadge(stats.moyenneGenerale)} className="px-3 py-1">
                    {getScoreText(stats.moyenneGenerale)}
                  </Badge>
                </div>
                <ProgressBar 
                  now={stats.moyenneGenerale} 
                  variant={getScoreBadge(stats.moyenneGenerale)}
                  style={{ height: '12px' }}
                  className="mb-2"
                />
                <div className="d-flex justify-content-between small text-muted">
                  <span>{stats.pointsObtenus} points obtenus</span>
                  <span>{stats.totalPoints} points total</span>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>

        {/* Contenu principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex align-items-center">
              <i data-feather="layers" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
              <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Résultats par Matière
              </span>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Résultats groupés par matière */}
            {Object.keys(evaluationsGroupees).length > 0 ? (
              <div className="resultats-groups">
                {Object.entries(evaluationsGroupees).map(([nomMatiere, evaluationsList]) => {
                  // Calculer les statistiques de la matière
                  const evaluationsAvecScore = evaluationsList.filter(e => e.pourcentage !== undefined);
                  const moyenneMatiere = evaluationsAvecScore.length > 0 
                    ? evaluationsAvecScore.reduce((sum, e) => sum + e.pourcentage, 0) / evaluationsAvecScore.length 
                    : 0;
                  const totalPointsMatiere = evaluationsList.reduce((sum, e) => sum + (e.total_points || 0), 0);
                  const pointsObtenusMatiere = evaluationsList.reduce((sum, e) => sum + (e.score_obtenu || 0), 0);

                  return (
                    <Card key={nomMatiere} className={`mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                      <Card.Header 
                        className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
                        onClick={() => toggleSection(`matiere-${nomMatiere}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <i data-feather="book" className="text-success me-3" style={{ width: "20px", height: "20px" }}></i>
                            <div>
                              <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomMatiere}</h5>
                              <small className="text-muted">
                                {evaluationsList.length} évaluation{evaluationsList.length > 1 ? 's' : ''} • 
                                Moyenne: <span className={`fw-bold text-${getScoreBadge(moyenneMatiere)}`}>
                                  {Math.round(moyenneMatiere * 100) / 100}%
                                </span>
                              </small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Badge bg={getScoreBadge(moyenneMatiere)}>{Math.round(moyenneMatiere)}%</Badge>
                            <Badge bg="info">{pointsObtenusMatiere}/{totalPointsMatiere} pts</Badge>
                            <i 
                              data-feather={openSections[`matiere-${nomMatiere}`] ? "chevron-up" : "chevron-down"} 
                              className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                              style={{ width: "20px", height: "20px" }}
                            ></i>
                          </div>
                        </div>
                      </Card.Header>
                      
                      <Collapse in={openSections[`matiere-${nomMatiere}`] !== false}>
                        <Card.Body className={theme === "dark" ? "bg-dark" : ""}>
                          {/* Barre de progression de la matière */}
                          <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <small className="text-muted">Performance dans cette matière</small>
                              <Badge bg={getScoreBadge(moyenneMatiere)}>
                                {getScoreText(moyenneMatiere)}
                              </Badge>
                            </div>
                            <ProgressBar 
                              now={moyenneMatiere} 
                              variant={getScoreBadge(moyenneMatiere)}
                              style={{ height: '8px' }}
                            />
                          </div>

                          {/* Liste des évaluations */}
                          <div className="table-responsive">
                            <Table className={`align-middle ${theme === "dark" ? "table-dark" : ""}`} hover>
                              <thead className="table-light">
                                <tr>
                                  <th>Évaluation</th>
                                  <th className="text-center">Date</th>
                                  <th className="text-center">Score</th>
                                  <th className="text-center">Appréciation</th>
                                  <th className="text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {evaluationsList.map((evaluation) => (
                                  <tr key={evaluation.id}>
                                    <td>
                                      <div>
                                        <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                          {evaluation.titre}
                                        </div>
                                        <small className="text-muted">{evaluation.matricule}</small>
                                        <div className="d-flex flex-wrap gap-1 mt-1">
                                          <Badge bg="info" className="small">
                                            {evaluation.questions_count} questions
                                          </Badge>
                                          <Badge bg="secondary" className="small">
                                            {formatDuration(evaluation.duree_minutes)}
                                          </Badge>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="text-center">
                                      <div className="small">
                                        {formatDate(evaluation.date_debut)}
                                      </div>
                                    </td>
                                    <td className="text-center">
                                      <div>
                                        <div className={`fw-bold text-${getScoreBadge(evaluation.pourcentage || 0)}`}>
                                          {evaluation.score_obtenu || 0}/{evaluation.total_points || 0}
                                        </div>
                                        <small className={`text-${getScoreBadge(evaluation.pourcentage || 0)}`}>
                                          {evaluation.pourcentage || 0}%
                                        </small>
                                      </div>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg={getScoreBadge(evaluation.pourcentage || 0)} className="px-2 py-1">
                                        {getScoreText(evaluation.pourcentage || 0)}
                                      </Badge>
                                    </td>
                                    <td className="text-center">
                                      <Button
                                        size="sm"
                                        variant="outline-primary"
                                        as={Link}
                                        to={`/etudiant/evaluation/${evaluation.id}/details`}
                                        title="Voir les détails"
                                      >
                                        <i data-feather="eye" className="me-1" style={{ width: '14px', height: '14px' }}></i>
                                        Détails
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </Card.Body>
                      </Collapse>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="award" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucun résultat disponible</h6>
                    <p className="small mb-3">
                      Vous n'avez pas encore participé à d'évaluations ou vos résultats ne sont pas encore disponibles.
                    </p>
                    <Button 
                      variant="primary"
                      as={Link}
                      to="/etudiant/view/evaluations/my-classroom"
                    >
                      <i data-feather="clipboard" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                      Voir les évaluations disponibles
                    </Button>
                  </div>
                </div>
              </div>
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