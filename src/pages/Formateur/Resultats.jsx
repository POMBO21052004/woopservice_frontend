import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Form, Badge, Alert, ButtonGroup, 
  Spinner, Collapse, Table, ProgressBar, Modal
} from "react-bootstrap";
import { Link } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function ResultatsGeneral() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [resultatsGroupes, setResultatsGroupes] = useState({});
  const [statistiquesGenerales, setStatistiquesGenerales] = useState({});
  const [classrooms, setClassrooms] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  // États des filtres
  const [filters, setFilters] = useState({
    search: "",
    matricule_classroom: "",
    matricule_matiere: "",
    matricule_evaluation: ""
  });

  // États de l'accordion
  const [openSections, setOpenSections] = useState({});

  // Modal de détail
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

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

  // Charger les résultats
  const fetchResultats = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]?.trim()) {
          params[key] = filters[key].trim();
        }
      });

      const response = await api.get('/formateur/answers/results-grouped', { params });
      
      setResultatsGroupes(response.data.resultats_groupes || {});
      setStatistiquesGenerales(response.data.statistiques_generales || {});
      setClassrooms(response.data.classrooms || []);
      setMatieres(response.data.matieres || []);
      setEvaluations(response.data.evaluations || []);
      
    } catch (err) {
      console.error('Erreur lors du chargement des résultats:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchResultats();
  }, [fetchResultats]);

  useEffect(() => {
    feather.replace();
  }, [resultatsGroupes]);

  // Gérer l'accordion
  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Ouvrir le modal de détail d'une question
  const openQuestionDetail = (question) => {
    setSelectedQuestion(question);
    setShowDetailModal(true);
  };

  // Obtenir la couleur du badge selon le taux de réussite
  const getSuccessBadge = (taux) => {
    if (taux >= 80) return 'success';
    if (taux >= 60) return 'warning';
    if (taux >= 40) return 'primary';
    return 'danger';
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
          <p className="mt-2">Chargement des résultats...</p>
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
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
              <i data-feather="bar-chart-2" className="text-success" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Résultats des Étudiants
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Vue d'ensemble des résultats groupés par classe, matière et évaluation
              </p>
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
                        {statistiquesGenerales.total_reponses || 0}
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
                        {statistiquesGenerales.total_etudiants || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Étudiants
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
                        {statistiquesGenerales.total_evaluations || 0}
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
                        {statistiquesGenerales.total_classes || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Classes
                      </small>
                    </div>
                    <div className="text-warning">
                      <i data-feather="home" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Panneau principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="bar-chart-2" className="text-success me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Résultats Détaillés
                </span>

                <ButtonGroup className="ms-3">
                    <Button
                        variant="outline-success"
                        size="sm"
                        as={Link}
                        to={`/formateur/answers/statistics`}
                    >
                        <i data-feather="bar-chart-2" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                </ButtonGroup>

              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </Col>
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
                    <i data-feather="clipboard" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Évaluation
                  </Form.Label>
                  <Form.Select
                    value={filters.matricule_evaluation}
                    onChange={e => setFilters({ ...filters, matricule_evaluation: e.target.value })}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes les évaluations</option>
                    {evaluations.map(evaluation => (
                      <option key={evaluation.matricule} value={evaluation.matricule}>
                        {evaluation.titre}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </div>

            {/* Résultats groupés */}
            {Object.keys(resultatsGroupes).length > 0 ? (
              <div className="results-grouped">
                {Object.entries(resultatsGroupes).map(([nomClasse, classroomData]) => (
                  <Card key={nomClasse} className={`mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header 
                      className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
                      onClick={() => toggleSection(`classe-${nomClasse}`)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <i data-feather="home" className="text-primary me-3" style={{ width: "20px", height: "20px" }}></i>
                          <div>
                            <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomClasse}</h5>
                            <small className="text-muted">
                              {classroomData.stats.total_reponses} réponses • {Object.keys(classroomData.matieres).length} matières
                            </small>
                          </div>
                        </div>
                        <i 
                          data-feather={openSections[`classe-${nomClasse}`] ? "chevron-up" : "chevron-down"} 
                          className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                          style={{ width: "20px", height: "20px" }}
                        ></i>
                      </div>
                    </Card.Header>
                    
                    <Collapse in={openSections[`classe-${nomClasse}`] !== false}>
                      <Card.Body className={theme === "dark" ? "bg-dark" : ""}>
                        {Object.entries(classroomData.matieres).map(([nomMatiere, matiereData]) => (
                          <div key={nomMatiere} className="mb-4">
                            <div 
                              className={`p-3 rounded mb-3 cursor-pointer ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}
                              onClick={() => toggleSection(`matiere-${nomClasse}-${nomMatiere}`)}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                  <i data-feather="book" className="text-success me-2" style={{ width: "18px", height: "18px" }}></i>
                                  <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomMatiere}</h6>
                                  <Badge bg="success" className="ms-2">
                                    {matiereData.stats.total_reponses} réponses
                                  </Badge>
                                </div>
                                <i 
                                  data-feather={openSections[`matiere-${nomClasse}-${nomMatiere}`] ? "chevron-up" : "chevron-down"} 
                                  className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                                  style={{ width: "18px", height: "18px" }}
                                ></i>
                              </div>
                            </div>
                            
                            <Collapse in={openSections[`matiere-${nomClasse}-${nomMatiere}`] !== false}>
                              <div>
                                {Object.entries(matiereData.evaluations).map(([titreEvaluation, evaluationData]) => (
                                  <div key={titreEvaluation} className="mb-3">
                                    <div 
                                      className={`p-3 rounded mb-2 cursor-pointer ${theme === "dark" ? "bg-info bg-opacity-10" : "bg-info bg-opacity-5"}`}
                                      onClick={() => toggleSection(`evaluation-${nomClasse}-${nomMatiere}-${titreEvaluation}`)}
                                    >
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                          <i data-feather="clipboard" className="text-info me-2" style={{ width: "16px", height: "16px" }}></i>
                                          <span className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                            {titreEvaluation}
                                          </span>
                                          <Badge bg="info" className="ms-2">
                                            {Object.keys(evaluationData.questions).length} questions
                                          </Badge>
                                          <Badge bg={getSuccessBadge(evaluationData.stats.taux_reussite || 0)} className="ms-1">
                                            {(evaluationData.stats.taux_reussite || 0).toFixed(1)}% réussite
                                          </Badge>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                          <Button
                                            variant="outline-info"
                                            size="sm"
                                            as={Link}
                                            to={`/formateur/answers/evaluation/${evaluationData.evaluation?.matricule}/results`}
                                            onClick={(e) => e.stopPropagation()}
                                            title="Voir les résultats détaillés"
                                          >
                                            <i data-feather="eye" style={{ width: '12px', height: '12px' }}></i>
                                          </Button>
                                          <i 
                                            data-feather={openSections[`evaluation-${nomClasse}-${nomMatiere}-${titreEvaluation}`] ? "chevron-up" : "chevron-down"} 
                                            className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                                            style={{ width: "16px", height: "16px" }}
                                          ></i>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <Collapse in={openSections[`evaluation-${nomClasse}-${nomMatiere}-${titreEvaluation}`] !== false}>
                                      <div className="ps-4">
                                        <Table size="sm" className={`${theme === "dark" ? "table-dark" : ""} mb-0`}>
                                          <thead>
                                            <tr>
                                              <th width="50">#</th>
                                              <th>Question</th>
                                              <th className="text-center">Réponses</th>
                                              <th className="text-center">Taux de réussite</th>
                                              <th className="text-center">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {Object.entries(evaluationData.questions).map(([enonce, questionData], index) => (
                                              <tr key={index}>
                                                <td className="text-center">
                                                  <Badge bg="secondary">{index + 1}</Badge>
                                                </td>
                                                <td>
                                                  <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                                                    {enonce.length > 60 ? enonce.substring(0, 60) + "..." : enonce}
                                                  </div>
                                                  <small className="text-muted">
                                                    {questionData.question?.points} points • Type: {questionData.question?.type}
                                                  </small>
                                                </td>
                                                <td className="text-center">
                                                  <Badge bg="primary">
                                                    {questionData.stats.total_reponses}
                                                  </Badge>
                                                </td>
                                                <td className="text-center">
                                                  <div className="d-flex align-items-center justify-content-center">
                                                    <ProgressBar 
                                                      now={questionData.stats.taux_reussite || 0} 
                                                      variant={getSuccessBadge(questionData.stats.taux_reussite || 0)}
                                                      style={{ width: '80px', height: '8px' }}
                                                      className="me-2"
                                                    />
                                                    <small>{(questionData.stats.taux_reussite || 0).toFixed(1)}%</small>
                                                  </div>
                                                </td>
                                                <td className="text-center">
                                                  <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => openQuestionDetail(questionData)}
                                                    title="Voir les détails"
                                                  >
                                                    <i data-feather="users" style={{ width: '12px', height: '12px' }}></i>
                                                  </Button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </Table>
                                      </div>
                                    </Collapse>
                                  </div>
                                ))}
                              </div>
                            </Collapse>
                          </div>
                        ))}
                      </Card.Body>
                    </Collapse>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="bar-chart-2" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucun résultat trouvé</h6>
                    <p className="small mb-0">Aucun résultat ne correspond à vos critères de recherche.</p>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Modal de détail d'une question */}
        <Modal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Détail des réponses par question</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedQuestion && (
              <div>
                <div className="mb-3">
                  <h6 className={theme === "dark" ? "text-light" : "text-dark"}>
                    {selectedQuestion.question?.enonce}
                  </h6>
                  <div className="d-flex gap-2 mb-3">
                    <Badge bg="info">Type: {selectedQuestion.question?.type}</Badge>
                    <Badge bg="primary">{selectedQuestion.question?.points} points</Badge>
                    <Badge bg={getSuccessBadge(selectedQuestion.stats?.taux_reussite || 0)}>
                      {(selectedQuestion.stats?.taux_reussite || 0).toFixed(1)}% réussite
                    </Badge>
                  </div>
                </div>
                
                <div className="table-responsive">
                  <Table className={`${theme === "dark" ? "table-dark" : ""}`}>
                    <thead>
                      <tr>
                        <th>Étudiant</th>
                        <th>Réponse donnée</th>
                        <th className="text-center">Points obtenus</th>
                        <th className="text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuestion.etudiants && Object.entries(selectedQuestion.etudiants).map(([nomEtudiant, etudiantData]) => (
                        <tr key={nomEtudiant}>
                          <td>
                            <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {nomEtudiant}
                            </div>
                            <small className="text-muted">
                              {etudiantData.etudiant?.matricule}
                            </small>
                          </td>
                          <td>
                            <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                              {selectedQuestion.question?.type === 'QCM' 
                                ? etudiantData.reponse?.choix_selectionne_qcm || 'Non répondu'
                                : etudiantData.reponse?.reponse_donnee || 'Non répondu'
                              }
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge bg="primary">
                              {etudiantData.points_obtenus || 0}/{selectedQuestion.question?.points}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg={etudiantData.est_correcte ? 'success' : etudiantData.est_correcte === false ? 'danger' : 'secondary'}>
                              {etudiantData.est_correcte === true ? 'Correct' : 
                               etudiantData.est_correcte === false ? 'Incorrect' : 
                               'À corriger'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </FormateurLayout>
  );
}