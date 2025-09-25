import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Container, Card, Row, Col, Form, Badge, 
  Spinner, Table, ProgressBar, Button, Modal, Collapse, Alert,
  CardHeader
} from "react-bootstrap";
import { Link } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import rrulePlugin from '@fullcalendar/rrule';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function CalendarDashboard() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [filterData, setFilterData] = useState({ classrooms: [], types_events: {} });
  const [matieresByClassroom, setMatieresByClassroom] = useState([]); // Nouvelles matières filtrées
  const [loadingMatieres, setLoadingMatieres] = useState(false);
  const [filters, setFilters] = useState({
    view: 'all',
    matricule_classroom: '',
    matricule_matiere: ''
  });
  const [eventDetails, setEventDetails] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const calendarRef = useRef(null);

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

  // Charger les données de filtres
  const fetchFilterData = useCallback(async () => {
    try {
      const response = await api.get('/formateur/calendar/filter-data');
      setFilterData(response.data || { classrooms: [], types_events: {} });
    } catch (err) {
      console.error('Erreur lors du chargement des filtres:', err);
      setError('Erreur lors du chargement des données de filtres');
    }
  }, []);

  // Charger les matières d'une classe spécifique
  const fetchMatieresByClassroom = useCallback(async (matricule_classroom) => {
    if (!matricule_classroom) {
      setMatieresByClassroom([]);
      return;
    }

    setLoadingMatieres(true);
    try {
      const response = await api.get(`/formateur/calendar/matieres/${matricule_classroom}`);
      setMatieresByClassroom(response.data.matieres || []);
    } catch (err) {
      console.error('Erreur lors du chargement des matières:', err);
      setError('Erreur lors du chargement des matières de la classe');
      setMatieresByClassroom([]);
    } finally {
      setLoadingMatieres(false);
    }
  }, []);

  // Charger les statistiques
  const fetchStatistics = useCallback(async () => {
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      const response = await api.get('/formateur/calendar/statistics', { params });
      setStatistics(response.data.statistics || {});
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Erreur lors du chargement des statistiques');
    }
  }, [filters]);

  // Fonction pour fetch les événements
  const fetchEvents = useCallback((fetchInfo, successCallback, failureCallback) => {
    const { start, end } = fetchInfo;
    api.get('/formateur/calendar/events', {
      params: {
        start: start.toISOString(),
        end: end.toISOString(),
        view: filters.view,
        matricule_classroom: filters.matricule_classroom,
        matricule_matiere: filters.matricule_matiere
      }
    })
      .then(response => {
        setCalendarEvents(response.data.events || []);
        successCallback(response.data.events || []);
      })
      .catch(err => {
        console.error('Erreur lors du chargement des événements:', err);
        setError('Erreur lors du chargement des événements du calendrier');
        failureCallback(err);
      });
  }, [filters]);

  // Gérer le changement de classe
  const handleClassroomChange = useCallback((matricule_classroom) => {
    setFilters(prev => ({ 
      ...prev, 
      matricule_classroom,
      matricule_matiere: '' // Reset matière
    }));
    
    // Charger les matières de la nouvelle classe
    fetchMatieresByClassroom(matricule_classroom);
  }, [fetchMatieresByClassroom]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchFilterData(), fetchStatistics()]);
      setLoading(false);
    };
    loadInitialData();
  }, [fetchFilterData, fetchStatistics]);

  // Recharger stats et events quand filters changent
  useEffect(() => {
    fetchStatistics();
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  }, [filters, fetchStatistics]);

  useEffect(() => {
    feather.replace();
  }, [statistics, filterData]);

  // Gérer le clic sur un événement
  const handleEventClick = async (info) => {
    const { extendedProps } = info.event;
    const type = extendedProps.type;
    const id = info.event.id.split('_')[1]; // Ex: eval_123 -> 123

    try {
      const response = await api.get(`/formateur/calendar/event-details/${type}/${id}`);
      setEventDetails(response.data.details);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      setError('Erreur lors du chargement des détails de l\'événement');
    }
  };

  // Préparer les données pour les charts
  const prepareEvolutionData = () => {
    return statistics?.evolution_7_jours?.map(item => ({
      date: item.date,
      evaluations: item.evaluations,
      cours: item.cours,
      inscriptions: item.inscriptions,
      reponses: item.reponses
    })) || [];
  };

  const preparePieData = () => {
    if (!statistics) return [];
    return [
      { name: 'Évaluations', value: statistics.evaluations?.total || 0 },
      { name: 'Cours', value: statistics.cours?.total || 0 },
      { name: 'Inscriptions', value: statistics.inscriptions?.total || 0 },
      { name: 'Activités', value: statistics.activite?.total_reponses || 0 }
    ];
  };

  // Gérer l'accordion
  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du calendrier...</p>
        </div>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      <Container fluid className="py-4">
        {/* En-tête */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="calendar" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Calendrier des Activités
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Récapitulatif des événements et statistiques de la plateforme
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-4">
            <Link 
              to="/formateur/dashboard" 
              className="btn btn-outline-secondary btn-sm me-2"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '14px', height: '14px' }} />
              Retour au dashboard
            </Link>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => calendarRef.current?.getApi().refetchEvents()}
            >
              <i data-feather="refresh-cw" className="me-1" style={{ width: '14px', height: '14px' }} />
              Actualiser
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            <i data-feather="alert-circle" className="me-2" />
            {error}
          </Alert>
        )}

        {/* Filtres */}
        <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Type d'événement</Form.Label>
                  <Form.Select 
                    value={filters.view}
                    onChange={(e) => setFilters(prev => ({ ...prev, view: e.target.value }))}
                  >
                    {Object.entries(filterData.types_events || {}).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Classe</Form.Label>
                  <Form.Select 
                    value={filters.matricule_classroom}
                    onChange={(e) => handleClassroomChange(e.target.value)}
                  >
                    <option value="">Toutes les classes</option>
                    {filterData.classrooms?.map(classroom => (
                      <option key={classroom.matricule} value={classroom.matricule}>
                        {classroom.name} ({classroom.matricule})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>
                    Matière
                    {loadingMatieres && (
                      <Spinner animation="border" size="sm" className="ms-2" />
                    )}
                  </Form.Label>
                  <Form.Select 
                    value={filters.matricule_matiere}
                    onChange={(e) => setFilters(prev => ({ ...prev, matricule_matiere: e.target.value }))}
                    disabled={!filters.matricule_classroom || loadingMatieres}
                  >
                    <option value="">
                      {!filters.matricule_classroom 
                        ? 'Sélectionnez d\'abord une classe' 
                        : 'Toutes les matières'
                      }
                    </option>
                    {matieresByClassroom.map(matiere => (
                      <option key={matiere.matricule} value={matiere.matricule}>
                        {matiere.nom} ({matiere.matricule})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row className="mb-4">
          <Card className={`border-0 shadow-sm h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                <i data-feather="trending-up" className="me-2" style={{ width: '20px', height: '20px' }} />
                Statistiques Globales
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {/* Statistiques Période */}
                <Col md={12} lg={4}>
                  <Card className={`shadow-sm border-0 h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                      <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="bar-chart-2" className="me-2" style={{ width: "20px", height: "20px" }} />
                        Statistiques Période
                      </h5>
                    </Card.Header>
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <span>Évaluations</span>
                          <Badge bg="primary">{statistics.evaluations?.total || 0}</Badge>
                        </div>
                        <ProgressBar
                          now={(statistics.evaluations?.total / (statistics.evaluations?.total + statistics.cours?.total + statistics.inscriptions?.total || 1)) * 100 || 0}
                          variant="primary"
                          style={{ height: '8px' }}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <span>Cours</span>
                          <Badge bg="success">{statistics.cours?.total || 0}</Badge>
                        </div>
                        <ProgressBar
                          now={(statistics.cours?.total / (statistics.evaluations?.total + statistics.cours?.total + statistics.inscriptions?.total || 1)) * 100 || 0}
                          variant="success"
                          style={{ height: '8px' }}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between">
                          <span>Inscriptions</span>
                          <Badge bg="info">{statistics.inscriptions?.total || 0}</Badge>
                        </div>
                        <ProgressBar
                          now={(statistics.inscriptions?.total / (statistics.evaluations?.total + statistics.cours?.total + statistics.inscriptions?.total || 1)) * 100 || 0}
                          variant="info"
                          style={{ height: '8px' }}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <span>Activité (réponses)</span>
                          <Badge bg="warning">{statistics.activite?.total_reponses || 0}</Badge>
                        </div>
                        <ProgressBar now={100} variant="warning" style={{ height: '8px' }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Pie Chart Répartition */}
                <Col md={12} lg={4}>
                  <Card className={`shadow-sm border-0 h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                      <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="pie-chart" className="me-2" style={{ width: "20px", height: "20px" }} />
                        Répartition des Événements
                      </h5>
                    </Card.Header>
                    <Card.Body className="d-flex flex-column">
                      <div className="flex-grow-1">
                        <ResponsiveContainer width="100%" height={250}>
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
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Line Chart Évolution */}
                <Col md={12} lg={4}>
                  <Card className={`shadow-sm border-0 h-100 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                    <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                      <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        <i data-feather="trending-up" className="me-2" style={{ width: "20px", height: "20px" }} />
                        Évolution sur 7 jours
                      </h5>
                    </Card.Header>
                    <Card.Body className="d-flex flex-column">
                      <div className="flex-grow-1">
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={prepareEvolutionData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            />
                            <YAxis />
                            <Tooltip
                              labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                            />
                            <Line type="monotone" dataKey="evaluations" stroke="#8884d8" name="Évaluations" />
                            <Line type="monotone" dataKey="cours" stroke="#82ca9d" name="Cours" />
                            <Line type="monotone" dataKey="inscriptions" stroke="#ffc658" name="Inscriptions" />
                            <Line type="monotone" dataKey="reponses" stroke="#ff7300" name="Réponses" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Row>

        {/* Calendrier - Pleine largeur */}
        <Card className={`shadow-sm border-0 mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
              <i data-feather="calendar" className="me-2" style={{ width: "20px", height: "20px" }}></i>
              Calendrier des Événements
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            <div style={{ height: '70vh', minHeight: '600px' }}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, rrulePlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                editable={false}
                selectable={true}
                events={fetchEvents}
                eventClick={handleEventClick}
                locale="fr"
                buttonText={{
                  today: 'Aujourd\'hui',
                  month: 'Mois',
                  week: 'Semaine',
                  day: 'Jour',
                  list: 'Liste'
                }}
                contentHeight="auto"
                aspectRatio={1.8}
                dayMaxEventRows={3}
                eventDisplay="block"
                dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true }}
              />
            </div>
          </Card.Body>
        </Card>

        {/* Modal Détails Événement */}
        <Modal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          centered
          size="lg"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Détails de l'Événement</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {eventDetails && (
              <div>
                {eventDetails.evaluation && (
                  <>
                    <h5>{eventDetails.evaluation.titre}</h5>
                    <p>{eventDetails.evaluation.description}</p>
                    <Badge bg="info">
                      Matière: {eventDetails.evaluation.matiere?.nom || eventDetails.evaluation.matricule_matiere || 'N/A'}
                    </Badge>
                    <Badge bg="secondary" className="ms-2">
                      Classe: {eventDetails.evaluation.classroom?.nom || eventDetails.evaluation.matricule_classroom || 'N/A'}
                    </Badge>
                    <div className="mt-3">
                      <h6>Statistiques</h6>
                      <Table size="sm">
                        <tbody>
                          <tr>
                            <td>Participants</td>
                            <td>{eventDetails.statistiques?.participants || 0}</td>
                          </tr>
                          <tr>
                            <td>Taux de réussite</td>
                            <td>{eventDetails.statistiques?.taux_reussite || 0}%</td>
                          </tr>
                          <tr>
                            <td>Questions</td>
                            <td>{eventDetails.statistiques?.questions_count || 0}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </>
                )}
                {eventDetails.cours && (
                  <>
                    <h5>{eventDetails.cours.titre}</h5>
                    <p>{eventDetails.cours.description}</p>
                    <Badge bg="info">
                      Matière: {eventDetails.cours.matiere?.nom || eventDetails.cours.matricule_matiere || 'N/A'}
                    </Badge>
                    <Badge bg="secondary" className="ms-2">
                      Classe: {eventDetails.cours.classroom?.nom || eventDetails.cours.matricule_classroom || 'N/A'}
                    </Badge>
                  </>
                )}
                {eventDetails.user && (
                  <>
                    <h5>{eventDetails.user.name}</h5>
                    <p>Email: {eventDetails.user.email}</p>
                    <Badge bg={eventDetails.role_text === 'Étudiant' ? 'success' : 'warning'}>
                      {eventDetails.role_text}
                    </Badge>
                  </>
                )}
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