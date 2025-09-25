import React, { useState, useEffect, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Table, Badge, Alert, 
  Spinner, ProgressBar, Modal, Form, ButtonGroup, Tabs, Tab
} from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function ResultatsEvaluationEtudiants() {
  const { evaluationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [evaluation, setEvaluation] = useState(null);
  const [resultatsParEtudiant, setResultatsParEtudiant] = useState([]);
  const [statistiques, setStatistiques] = useState({});
  const [metadonnees, setMetadonnees] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);

  // États des filtres et tri
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rang"); // rang, name, score, participation
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterParticipation, setFilterParticipation] = useState("tous"); // tous, participants, absents

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
      
      const response = await api.get(`/formateur/answers/evaluation/${evaluationId}/results-by-student`);
      setEvaluation(response.data.evaluation);
      setResultatsParEtudiant(response.data.resultats_par_etudiant || []);
      setStatistiques(response.data.statistiques || {});
      setMetadonnees(response.data.metadonnees || {});
      
    } catch (err) {
      console.error('Erreur lors du chargement des résultats:', err);
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    if (evaluationId) {
      fetchResultats();
    }
  }, [fetchResultats]);

  useEffect(() => {
    feather.replace();
  }, [resultatsParEtudiant]);

  // Filtrer et trier les résultats
  const filteredAndSortedResults = resultatsParEtudiant
    .filter(result => {
      // Filtre de recherche
      const matchSearch = !searchTerm || 
        result.etudiant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.etudiant?.matricule?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtre de participation
      const matchParticipation = filterParticipation === "tous" || 
        (filterParticipation === "participants" && result.a_participe) ||
        (filterParticipation === "absents" && !result.a_participe);

      return matchSearch && matchParticipation;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a.etudiant?.name || "").localeCompare(b.etudiant?.name || "");
          break;
        case "score":
          comparison = a.pourcentage - b.pourcentage;
          break;
        case "participation":
          comparison = (a.a_participe ? 1 : 0) - (b.a_participe ? 1 : 0);
          break;
        case "rang":
        default:
          if (!a.rang && !b.rang) comparison = 0;
          else if (!a.rang) comparison = 1;
          else if (!b.rang) comparison = -1;
          else comparison = a.rang - b.rang;
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

  const getPourcentageColor = (pourcentage) => {
    if (pourcentage >= 80) return 'success';
    if (pourcentage >= 60) return 'warning';
    if (pourcentage >= 40) return 'primary';
    return 'danger';
  };

  const getRangBadge = (rang, aParticipe) => {
    if (!aParticipe) return { bg: 'secondary', icon: 'user-x', text: 'white' };
    if (rang === 1) return { bg: 'warning', icon: 'award', text: 'white' };
    if (rang === 2) return { bg: 'secondary', icon: 'award', text: 'white' };  
    if (rang === 3) return { bg: 'info', icon: 'award', text: 'white' };
    return { bg: 'outline-primary', icon: 'user', text: 'primary' };
  };

  const getStatutBadge = (aParticipe, pourcentage) => {
    if (!aParticipe) return { bg: 'secondary', text: 'Absent', icon: 'user-x' };
    if (pourcentage >= 80) return { bg: 'success', text: 'Excellent', icon: 'check-circle' };
    if (pourcentage >= 60) return { bg: 'warning', text: 'Bien', icon: 'check' };
    if (pourcentage >= 40) return { bg: 'primary', text: 'Passable', icon: 'minus' };
    return { bg: 'danger', text: 'Insuffisant', icon: 'x-circle' };
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

  const openDetailModal = (resultat) => {
    setSelectedEtudiant(resultat);
    setShowDetailModal(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

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

  if (!evaluation) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          Évaluation introuvable
        </Alert>
        <Button variant="secondary" as={Link} to="/formateur/answers/results">
          <i data-feather="arrow-left" className="me-2" />
          Retour aux résultats
        </Button>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className="d-flex align-items-center mb-2">
              <Button 
                variant="outline-secondary" 
                size="sm"
                as={Link} 
                to="/formateur/answers/results"
                className="me-3"
              >
                <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
                Retour
              </Button>
              <div>
                <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Résultats par Étudiant
                </h1>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  {evaluation.titre} - {filteredAndSortedResults.length} résultat(s) affiché(s)
                </p>
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <Button 
              variant="outline-info"
              as={Link}
              to={`/formateur/evaluation/${evaluationId}/questions`}
            >
              <i data-feather="help-circle" className="me-2" style={{ width: '16px', height: '16px' }} />
              Questions
            </Button>
            <Button 
              variant="outline-success"
              onClick={() => window.print()}
            >
              <i data-feather="printer" className="me-2" style={{ width: '16px', height: '16px' }} />
              Imprimer
            </Button>
          </div>
        </div>

        {/* Statistiques avec onglets */}
        <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body>
            <Tabs defaultActiveKey="general" className="mb-3">
              <Tab eventKey="general" title="Statistiques Générales">
                <Row>
                  <Col md={2}>
                    <div className="text-center p-3">
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {statistiques.nombre_participants || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>Participants</small>
                      <div className="small text-muted mt-1">
                        / {statistiques.nombre_inscrits || 0} inscrits
                      </div>
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="text-center p-3">
                      <h3 className="mb-0 text-info">
                        {statistiques.taux_participation || 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>Participation</small>
                      <ProgressBar 
                        now={statistiques.taux_participation || 0} 
                        variant="info"
                        style={{ height: '4px' }}
                        className="mt-2"
                      />
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="text-center p-3">
                      <h3 className="mb-0 text-primary">
                        {statistiques.moyenne || 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>Moyenne</small>
                      <div className="small text-muted mt-1">
                        Médiane: {statistiques.mediane || 0}%
                      </div>
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="text-center p-3">
                      <h3 className="mb-0 text-success">
                        {statistiques.meilleur_score || 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>Meilleur</small>
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="text-center p-3">
                      <h3 className="mb-0 text-warning">
                        {statistiques.plus_faible_score || 0}%
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>Plus faible</small>
                    </div>
                  </Col>
                  <Col md={2}>
                    <div className="text-center p-3">
                      <h3 className="mb-0 text-secondary">
                        {statistiques.ecart_type || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>Écart-type</small>
                    </div>
                  </Col>
                </Row>
              </Tab>
              
              <Tab eventKey="distribution" title="Distribution">
                {statistiques.distribution_notes && (
                  <Row>
                    {Object.entries(statistiques.distribution_notes).map(([tranche, nombre]) => (
                      <Col md={3} key={tranche}>
                        <div className="text-center p-3">
                          <div className={`h4 mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                            {nombre}
                          </div>
                          <div className="small text-muted mb-2">{tranche}</div>
                          <ProgressBar 
                            now={statistiques.nombre_participants > 0 ? (nombre / statistiques.nombre_participants) * 100 : 0}
                            style={{ height: '4px' }}
                          />
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </Tab>
              
              <Tab eventKey="questions" title="Analyse Questions">
                {statistiques.questions_les_plus_difficiles && (
                  <Row>
                    <Col md={6}>
                      <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Questions les plus difficiles
                      </h6>
                      {statistiques.questions_les_plus_difficiles.map((stat, index) => (
                        <div key={index} className="d-flex align-items-center mb-2">
                          <Badge bg="danger" className="me-2">Q{stat.numero}</Badge>
                          <div className="flex-grow-1">
                            <div className="small">{stat.question.enonce.substring(0, 50)}...</div>
                            <ProgressBar now={stat.taux_reussite} variant="danger" style={{ height: '4px' }} />
                          </div>
                          <span className="text-danger ms-2">{stat.taux_reussite}%</span>
                        </div>
                      ))}
                    </Col>
                    <Col md={6}>
                      <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        Questions les plus faciles
                      </h6>
                      {statistiques.questions_les_plus_faciles && statistiques.questions_les_plus_faciles.map((stat, index) => (
                        <div key={index} className="d-flex align-items-center mb-2">
                          <Badge bg="success" className="me-2">Q{stat.numero}</Badge>
                          <div className="flex-grow-1">
                            <div className="small">{stat.question.enonce.substring(0, 50)}...</div>
                            <ProgressBar now={stat.taux_reussite} variant="success" style={{ height: '4px' }} />
                          </div>
                          <span className="text-success ms-2">{stat.taux_reussite}%</span>
                        </div>
                      ))}
                    </Col>
                  </Row>
                )}
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>

        {/* Informations de l'évaluation */}
        <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body>
            <Row className="align-items-center">
              <Col md={8}>
                <div className="d-flex align-items-center">
                  <div className={`me-3 p-2 rounded-circle ${theme === "dark" ? "bg-success bg-opacity-25" : "bg-success bg-opacity-10"}`}>
                    <i data-feather="clipboard" className="text-success" style={{ width: "20px", height: "20px" }}></i>
                  </div>
                  <div>
                    <h5 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {evaluation.titre}
                    </h5>
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <small className="text-muted">{evaluation.matricule}</small>
                      <Badge bg="success">{evaluation.status}</Badge>
                      <small className="text-muted">•</small>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        <i data-feather="users" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        {evaluation.matiere?.classroom?.name}
                      </small>
                      <small className="text-muted">•</small>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        <i data-feather="book" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                        {evaluation.matiere?.nom}
                      </small>
                    </div>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-end">
                  <div className={`h4 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    {evaluation.questions?.length || 0} questions
                  </div>
                  <small className={theme === "dark" ? "text-light" : "text-muted"}>
                    {formatDate(evaluation.date_debut)} • {evaluation.duree_minutes}min
                  </small>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Contrôles de recherche et tri */}
        <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Rechercher un étudiant
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nom ou matricule de l'étudiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                />
              </Col>
              <Col md={3}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="filter" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Participation
                </Form.Label>
                <Form.Select
                  value={filterParticipation}
                  onChange={(e) => setFilterParticipation(e.target.value)}
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                >
                  <option value="tous">Tous les étudiants</option>
                  <option value="participants">Participants seulement</option>
                  <option value="absents">Absents seulement</option>
                </Form.Select>
              </Col>
              <Col md={5}>
                <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  <i data-feather="sort-asc" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                  Trier par
                </Form.Label>
                <div className="d-flex gap-2">
                  <ButtonGroup>
                    <Button
                      variant={sortBy === "rang" ? "primary" : "outline-secondary"}
                      size="sm"
                      onClick={() => handleSort("rang")}
                    >
                      Rang 
                      {/* {sortBy === "rang" && (
                        <i data-feather={sortOrder === "asc" ? "arrow-up" : "arrow-down"} 
                           style={{ width: '12px', height: '12px' }} className="ms-1" />
                      )} */}
                    </Button>
                    <Button
                      variant={sortBy === "name" ? "primary" : "outline-secondary"}
                      size="sm"
                      onClick={() => handleSort("name")}
                    >
                      Nom 
                      {/* {sortBy === "name" && (
                        <i data-feather={sortOrder === "asc" ? "arrow-up" : "arrow-down"} 
                           style={{ width: '12px', height: '12px' }} className="ms-1" />
                      )} */}
                    </Button>
                    <Button
                      variant={sortBy === "score" ? "primary" : "outline-secondary"}
                      size="sm"
                      onClick={() => handleSort("score")}
                    >
                      Score 
                      {/* {sortBy === "score" && (
                        <i data-feather={sortOrder === "asc" ? "arrow-up" : "arrow-down"} 
                           style={{ width: '12px', height: '12px' }} className="ms-1" />
                      )} */}
                    </Button>
                    <Button
                      variant={sortBy === "participation" ? "primary" : "outline-secondary"}
                      size="sm"
                      onClick={() => handleSort("participation")}
                    >
                      Participation 
                      {/* {sortBy === "participation" && (
                        <i data-feather={sortOrder === "asc" ? "arrow-up" : "arrow-down"} 
                           style={{ width: '12px', height: '12px' }} className="ms-1" />
                      )} */}
                    </Button>
                  </ButtonGroup>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Tableau des résultats par étudiant */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="users" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Classement et Résultats
                </span>
              </div>
              <div className="d-flex gap-2">
                <Badge bg="info" className="px-3 py-2">
                  {filteredAndSortedResults.length} résultat(s)
                </Badge>
                <Badge bg="success" className="px-3 py-2">
                  {filteredAndSortedResults.filter(r => r.a_participe).length} participant(s)
                </Badge>
                {filteredAndSortedResults.filter(r => !r.a_participe).length > 0 && (
                  <Badge bg="secondary" className="px-3 py-2">
                    {filteredAndSortedResults.filter(r => !r.a_participe).length} absent(s)
                  </Badge>
                )}
              </div>
            </div>
          </Card.Header>

          <Card.Body className={`p-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            {filteredAndSortedResults.length > 0 ? (
              <div className="table-responsive">
                <Table hover className={`align-middle mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                  <thead className="table-primary">
                    <tr>
                      <th width="80" className="text-center">Rang</th>
                      <th>Étudiant</th>
                      <th className="text-center">Score</th>
                      <th className="text-center">Progression</th>
                      <th className="text-center">Questions</th>
                      <th className="text-center">Temps</th>
                      <th className="text-center">Statut</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedResults.map((resultat, index) => {
                      const rangBadge = getRangBadge(resultat.rang, resultat.a_participe);
                      const statutBadge = getStatutBadge(resultat.a_participe, resultat.pourcentage);
                      
                      return (
                        <tr key={resultat.etudiant?.matricule || index} 
                            className={!resultat.a_participe ? 'table-secondary opacity-75' : ''}>
                          <td className="text-center">
                            {resultat.a_participe && resultat.rang ? (
                              <div className={`d-inline-flex align-items-center justify-content-center rounded-circle`} 
                                   style={{ 
                                     width: '35px', 
                                     height: '35px',
                                     backgroundColor: resultat.rang <= 3 ? (
                                       resultat.rang === 1 ? '#ffd700' : 
                                       resultat.rang === 2 ? '#c0c0c0' : '#cd7f32'
                                     ) : 'transparent',
                                     border: resultat.rang > 3 ? '2px solid #0d6efd' : 'none'
                                   }}>
                                <strong className={resultat.rang <= 3 ? 'text-white' : 'text-primary'}>
                                  #{resultat.rang}
                                </strong>
                              </div>
                            ) : (
                              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary" 
                                   style={{ width: '35px', height: '35px' }}>
                                <i data-feather="user-x" className="text-white" style={{ width: '16px', height: '16px' }}></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className={`me-2 p-2 rounded-circle ${theme === "dark" ? "bg-info bg-opacity-25" : "bg-info bg-opacity-10"}`}>
                                <i data-feather={resultat.a_participe ? "user" : "user-x"} 
                                   className={resultat.a_participe ? "text-info" : "text-secondary"} 
                                   style={{ width: "16px", height: "16px" }}></i>
                              </div>
                              <div>
                                <div className={`fw-medium ${theme === "dark" ? "text-light" : "text-dark"} ${!resultat.a_participe ? 'text-muted' : ''}`}>
                                  {resultat.etudiant?.name || 'Étudiant inconnu'}
                                </div>
                                <small className="text-muted">
                                  {resultat.etudiant?.matricule || 'N/A'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            {resultat.a_participe ? (
                              <div>
                                <Badge bg={getPourcentageColor(resultat.pourcentage)} className="px-3 py-2 mb-1">
                                  {resultat.pourcentage.toFixed(1)}%
                                </Badge>
                                <div className="small text-muted">
                                  {resultat.points_obtenus}/{resultat.total_points_possibles} pts
                                </div>
                              </div>
                            ) : (
                              <Badge bg="secondary" className="px-3 py-2">
                                Non participé
                              </Badge>
                            )}
                          </td>
                          <td className="text-center">
                            {resultat.a_participe ? (
                              <div style={{ width: '100px' }}>
                                <ProgressBar 
                                  now={resultat.pourcentage} 
                                  variant={getPourcentageColor(resultat.pourcentage)}
                                  style={{ height: '8px' }}
                                />
                                <small className="text-muted d-block mt-1">
                                  {resultat.pourcentage.toFixed(0)}%
                                </small>
                              </div>
                            ) : (
                              <div className="text-muted">
                                <i data-feather="minus" style={{ width: '16px', height: '16px' }}></i>
                              </div>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="small">
                              <div className="mb-1">
                                <Badge bg={resultat.a_participe ? "primary" : "secondary"}>
                                  {resultat.questions_repondues}/{resultat.total_questions}
                                </Badge>
                              </div>
                              {resultat.a_participe && resultat.reponses_correctes > 0 && (
                                <div className="text-success small">
                                  <i data-feather="check" className="me-1" style={{ width: '10px', height: '10px' }}></i>
                                  {resultat.reponses_correctes} correctes
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>
                              {resultat.temps_total || 'N/A'}
                            </small>
                          </td>
                          <td className="text-center">
                            <Badge bg={statutBadge.bg} className="px-2 py-1">
                              <i data-feather={statutBadge.icon} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                              {statutBadge.text}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => openDetailModal(resultat)}
                                title="Voir le détail des réponses"
                              >
                                <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                              </Button>
                              {resultat.a_participe && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  as={Link}
                                  to={`/formateur/answers/student/${resultat.etudiant?.matricule}/evaluation/${evaluation.matricule}`}
                                  title="Analyse complète"
                                >
                                  <i data-feather="bar-chart" style={{ width: '14px', height: '14px' }}></i>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="users" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucun résultat trouvé</h6>
                    <p className="small mb-0">
                      {searchTerm || filterParticipation !== "tous" ? 
                        'Aucun étudiant ne correspond à vos critères de recherche.' : 
                        'Aucun étudiant inscrit dans cette classe.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Informations supplémentaires */}
        {metadonnees && Object.keys(metadonnees).length > 0 && (
          <Card className={`shadow-sm border-0 mt-4 ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-4">
                  <div>
                    <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    <strong>Total inscrits:</strong> {metadonnees.total_inscrits}
                  </div>
                  <div>
                    <i data-feather="user-check" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    <strong>Participants:</strong> {metadonnees.total_participants}
                  </div>
                  <div>
                    <i data-feather="user-x" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    <strong>Absents:</strong> {metadonnees.total_absents}
                  </div>
                </div>
                <div>
                  <small className="text-muted">
                    Généré le {new Date(metadonnees.date_generation).toLocaleString('fr-FR')}
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Modal de détail d'un étudiant */}
        <Modal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>
              Détail des réponses - {selectedEtudiant?.etudiant?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedEtudiant && (
              <div>
                {/* Résumé de performance */}
                <Card className={`mb-4 ${theme === "dark" ? "bg-secondary" : "bg-light"}`}>
                  <Card.Body>
                    {selectedEtudiant.a_participe ? (
                      <Row className="text-center">
                        <Col md={3}>
                          <div className="mb-2">
                            <h4 className="text-primary mb-0">
                              {selectedEtudiant.pourcentage.toFixed(1)}%
                            </h4>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>Score</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-2">
                            <h4 className="text-success mb-0">
                              {selectedEtudiant.points_obtenus}
                            </h4>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>Points obtenus</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-2">
                            <h4 className="text-info mb-0">
                              {selectedEtudiant.questions_repondues}
                            </h4>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>Questions répondues</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="mb-2">
                            <h4 className="text-warning mb-0">
                              #{selectedEtudiant.rang || 'N/A'}
                            </h4>
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>Rang</small>
                          </div>
                        </Col>
                      </Row>
                    ) : (
                      <div className="text-center">
                        <div className="mb-3">
                          <i data-feather="user-x" className="text-secondary" style={{ width: "48px", height: "48px" }}></i>
                        </div>
                        <h5 className="text-secondary">Étudiant absent</h5>
                        <p className="text-muted mb-0">
                          Cet étudiant n'a pas participé à l'évaluation.
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Détail par question */}
                {selectedEtudiant.detail_reponses && selectedEtudiant.detail_reponses.length > 0 && (
                  <div>
                    <h6 className={`mb-3 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Détail par question
                    </h6>
                    <div className="table-responsive">
                      <Table size="sm" className={`${theme === "dark" ? "table-dark" : ""}`}>
                        <thead>
                          <tr>
                            <th width="60">#</th>
                            <th>Question</th>
                            <th className="text-center">Type</th>
                            <th className="text-center">Points</th>
                            <th className="text-center">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEtudiant.detail_reponses.map((detail, index) => (
                            <tr key={index}>
                              <td className="text-center">
                                <Badge bg="secondary">{index + 1}</Badge>
                              </td>
                              <td>
                                <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {detail.question.enonce.length > 80 ? 
                                    detail.question.enonce.substring(0, 80) + "..." : 
                                    detail.question.enonce
                                  }
                                </div>
                                <small className="text-muted">
                                  {detail.question.points} point(s) • {detail.question.type}
                                </small>
                              </td>
                              <td className="text-center">
                                <Badge bg={detail.question.type === 'QCM' ? 'info' : 'success'}>
                                  {detail.question.type}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg="primary">
                                  {detail.points_obtenus}/{detail.question.points}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg={
                                  detail.statut === 'Non répondue' ? 'secondary' :
                                  detail.est_correcte === true ? 'success' : 
                                  detail.est_correcte === false ? 'danger' : 'warning'
                                }>
                                  {detail.statut === 'Non répondue' ? 'Non répondue' :
                                   detail.est_correcte === true ? 'Correct' : 
                                   detail.est_correcte === false ? 'Incorrect' : 
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
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            {selectedEtudiant?.a_participe && (
              <Button 
                variant="outline-success" 
                as={Link}
                to={`/formateur/answers/student/${selectedEtudiant?.etudiant?.matricule}/evaluation/${evaluation.matricule}`}
                onClick={() => setShowDetailModal(false)}
              >
                <i data-feather="external-link" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Analyse complète
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </FormateurLayout>
  );
}       