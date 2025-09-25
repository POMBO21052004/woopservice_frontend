import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Container, Card, Row, Col, Button, Badge, Alert, Spinner, Toast, ToastContainer, 
  Modal, ButtonGroup, Dropdown
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import EtudiantLayout from "../../layouts/Etudiant/Layout";
import feather from "feather-icons";
import api from "../../services/api";

// Imports FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

// Localisation française
import frLocale from '@fullcalendar/core/locales/fr';

export default function CalendrierEtudiant() {
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // États des données
  const [events, setEvents] = useState([]);
  const [classroom, setClassroom] = useState({});
  const [stats, setStats] = useState({});
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // États de la vue calendrier
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // États des modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);

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

  // Charger les événements du calendrier
  const fetchCalendarEvents = useCallback(async (start, end) => {
    try {
      setLoading(true);
      const params = {};
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await api.get('/etudiant/calendar/events', { params });
      
      if (response.data.status === 'success') {
        setEvents(response.data.events || []);
        setClassroom(response.data.classroom || {});
        setStats(response.data.stats || {});
      } else {
        showToastMessage(response.data.message || "Erreur lors du chargement du calendrier", 'danger');
      }
    } catch (err) {
      console.error('Erreur lors du chargement du calendrier:', err);
      const errorMessage = err.response?.data?.message || "Erreur lors du chargement du calendrier";
      showToastMessage(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les événements à venir
  const fetchUpcomingEvents = useCallback(async () => {
    try {
      const response = await api.get('/etudiant/calendar/upcoming-events', { 
        params: { limit: 5 } 
      });
      
      if (response.data.status === 'success') {
        setUpcomingEvents(response.data.upcoming_evaluations || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des événements à venir:', err);
    }
  }, []);

  useEffect(() => {
    fetchCalendarEvents();
    fetchUpcomingEvents();
  }, [fetchCalendarEvents, fetchUpcomingEvents]);

  useEffect(() => {
    feather.replace();
  }, [events, upcomingEvents]);

  // Gérer le clic sur un événement
  const handleEventClick = async (eventInfo) => {
    const event = eventInfo.event;
    const extendedProps = event.extendedProps;

    if (!extendedProps.clickable) {
      showToastMessage("Cet événement n'est plus accessible", 'warning');
      return;
    }

    if (extendedProps.redirect_url) {
      navigate(extendedProps.redirect_url);
    } else {
      // Afficher les détails dans un modal
      setSelectedEvent(event);
      setShowEventModal(true);
      
      // Charger les détails si nécessaire
      if (extendedProps.type === 'evaluation' || extendedProps.type === 'cours') {
        try {
          const eventId = event.id.split('_')[1]; // Extraire l'ID après le préfixe
          const response = await api.get(`/etudiant/calendar/event-details/${extendedProps.type}/${eventId}`);
          if (response.data.status === 'success') {
            setEventDetails(response.data.event);
          }
        } catch (err) {
          console.error('Erreur lors du chargement des détails:', err);
        }
      }
    }
  };

  // Gérer les changements de vue
  const handleViewChange = (view) => {
    setCurrentView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  // Gérer la navigation dans le calendrier
  const handleDateChange = (direction) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      if (direction === 'prev') {
        calendarApi.prev();
      } else if (direction === 'next') {
        calendarApi.next();
      } else if (direction === 'today') {
        calendarApi.today();
      }
    }
  };

  // Formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
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

  // Obtenir l'icône selon le type d'événement
  const getEventIcon = (type) => {
    switch (type) {
      case 'evaluation': return 'clipboard';
      case 'cours': return 'book-open';
      case 'important': return 'star';
      default: return 'calendar';
    }
  };

  // Obtenir le badge d'état pour les évaluations
  const getEtatBadge = (etat, aParticipe) => {
    switch (etat) {
      case 'En cours': return { variant: 'success', text: 'En cours' };
      case 'Future': return { variant: 'info', text: 'À venir' };
      case 'Passée': 
        return aParticipe 
          ? { variant: 'secondary', text: 'Terminée' }
          : { variant: 'danger', text: 'Manquée' };
      default: return { variant: 'secondary', text: etat };
    }
  };

  if (loading) {
    return (
      <EtudiantLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du calendrier...</p>
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
                <i data-feather="calendar" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
              </div>
              <div>
                <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Mon Calendrier Académique
                </h2>
                <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                  Planning des évaluations et cours • {classroom.name || 'Ma Classe'}
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline-primary"
              onClick={() => fetchCalendarEvents()}
              title="Actualiser"
            >
              <i data-feather="refresh-cw" style={{ width: "16px", height: "16px" }}></i>
            </Button>
          </div>

          {/* Statistiques rapides */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {stats.total_events || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Événements totaux
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="calendar" style={{ width: "24px", height: "24px" }}></i>
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
                        {stats.evaluations_count || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Évaluations
                      </small>
                    </div>
                    <div className="text-warning">
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
                      <h3 className="mb-0 text-info">
                        {stats.cours_count || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Nouveaux cours
                      </small>
                    </div>
                    <div className="text-info">
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
                      <h3 className="mb-0 text-success">
                        {stats.evaluations_en_cours || 0}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        En cours
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="play-circle" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        <Row>
          {/* Calendrier principal */}
          <Col lg={9}>
            <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i data-feather="calendar" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                    <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      Calendrier
                    </span>
                  </div>
                  
                  <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                    {/* Navigation */}
                    <ButtonGroup size="sm">
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleDateChange('prev')}
                        title="Mois précédent"
                      >
                        <i data-feather="chevron-left" style={{ width: "14px", height: "14px" }}></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        onClick={() => handleDateChange('today')}
                        title="Aujourd'hui"
                      >
                        Aujourd'hui
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => handleDateChange('next')}
                        title="Mois suivant"
                      >
                        <i data-feather="chevron-right" style={{ width: "14px", height: "14px" }}></i>
                      </Button>
                    </ButtonGroup>

                    {/* Sélecteur de vue */}
                    <Dropdown
                        onToggle={(isOpen) => {
                            if (isOpen) {
                            // Remplace les icônes quand le dropdown s'ouvre
                            setTimeout(() => feather.replace(), 0);
                            }
                        }}
                    >
                      <Dropdown.Toggle variant="outline-info" size="sm">
                        <i data-feather="eye" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                        Vue
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item
                          active={currentView === 'dayGridMonth'}
                          onClick={() => handleViewChange('dayGridMonth')}
                        >
                          <i data-feather="calendar" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Mois
                        </Dropdown.Item>
                        <Dropdown.Item
                          active={currentView === 'timeGridWeek'}
                          onClick={() => handleViewChange('timeGridWeek')}
                        >
                          <i data-feather="columns" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Semaine
                        </Dropdown.Item>
                        <Dropdown.Item
                          active={currentView === 'timeGridDay'}
                          onClick={() => handleViewChange('timeGridDay')}
                        >
                          <i data-feather="square" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Jour
                        </Dropdown.Item>
                        <Dropdown.Item
                          active={currentView === 'listWeek'}
                          onClick={() => handleViewChange('listWeek')}
                        >
                          <i data-feather="list" className="me-2" style={{ width: "14px", height: "14px" }}></i>
                          Liste
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
              </Card.Header>

              <Card.Body className={`${theme === "dark" ? "bg-dark" : "bg-white"} p-3`}>
                <div className={`calendar-container ${theme === "dark" ? "dark-calendar" : ""}`}>
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView={currentView}
                    locale={frLocale}
                    events={events}
                    eventClick={handleEventClick}
                    headerToolbar={false} // On utilise nos propres contrôles
                    height="auto"
                    aspectRatio={1.35}
                    eventDisplay="block"
                    displayEventTime={true}
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }}
                    slotLabelFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }}
                    dayHeaderFormat={{ weekday: 'long' }}
                    eventContent={(eventInfo) => {
                      const props = eventInfo.event.extendedProps;
                      return (
                        <div className="fc-event-content-custom">
                          <div className="fc-event-title-container">
                            <i 
                              data-feather={getEventIcon(props.type)} 
                              style={{ width: "12px", height: "12px", marginRight: "4px" }}
                            ></i>
                            <span className="fc-event-title">{eventInfo.event.title}</span>
                          </div>
                          {props.type === 'evaluation' && (
                            <div className="fc-event-meta">
                              <small>{props.duree_minutes}min • {props.questions_count}Q</small>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar avec événements à venir */}
          <Col lg={3}>
            {/* Événements à venir */}
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h6 className="mb-0 d-flex align-items-center">
                  <i data-feather="clock" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Prochains événements
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                {upcomingEvents.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {upcomingEvents.map((evaluation, index) => {
                      const dateDebut = new Date(evaluation.date_debut);
                      const now = new Date();
                      const diffMs = dateDebut - now;
                      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={evaluation.id} className={`list-group-item border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-white"}`}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                <i data-feather="clipboard" className="me-2 text-warning" style={{ width: "14px", height: "14px" }}></i>
                                <strong className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {evaluation.titre}
                                </strong>
                              </div>
                              <div className="small text-muted mb-1">
                                <i data-feather="book" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {evaluation.matiere?.nom}
                              </div>
                              <div className="small text-muted">
                                <i data-feather="calendar" className="me-1" style={{ width: "12px", height: "12px" }}></i>
                                {dateDebut.toLocaleDateString('fr-FR', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <Badge 
                              bg={diffDays <= 1 ? 'danger' : diffDays <= 3 ? 'warning' : 'info'} 
                              className="ms-2"
                            >
                              {diffDays === 0 ? 'Aujourd\'hui' : 
                               diffDays === 1 ? 'Demain' : 
                               `${diffDays}j`}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center text-muted">
                    <i data-feather="calendar" className="mb-2" style={{ width: "32px", height: "32px" }}></i>
                    <div>
                      <small>Aucun événement à venir dans les 7 prochains jours</small>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Légende des couleurs */}
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <h6 className="mb-0 d-flex align-items-center">
                  <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Légende
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <div className="d-flex align-items-center">
                    <div className="me-2 rounded" style={{ width: "16px", height: "16px", backgroundColor: "#28a745" }}></div>
                    <small className={theme === "dark" ? "text-light" : "text-dark"}>Évaluation en cours</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="me-2 rounded" style={{ width: "16px", height: "16px", backgroundColor: "#007bff" }}></div>
                    <small className={theme === "dark" ? "text-light" : "text-dark"}>Évaluation à venir</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="me-2 rounded" style={{ width: "16px", height: "16px", backgroundColor: "#6c757d" }}></div>
                    <small className={theme === "dark" ? "text-light" : "text-dark"}>Évaluation terminée</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="me-2 rounded" style={{ width: "16px", height: "16px", backgroundColor: "#dc3545" }}></div>
                    <small className={theme === "dark" ? "text-light" : "text-dark"}>Évaluation manquée</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="me-2 rounded" style={{ width: "16px", height: "16px", backgroundColor: "#17a2b8" }}></div>
                    <small className={theme === "dark" ? "text-light" : "text-dark"}>Nouveau cours</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="me-2 rounded" style={{ width: "16px", height: "16px", backgroundColor: "#ffc107" }}></div>
                    <small className={theme === "dark" ? "text-light" : "text-dark"}>Événement important</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal de détails d'événement */}
        <Modal
          show={showEventModal}
          onHide={() => setShowEventModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>
              {selectedEvent && (
                <div className="d-flex align-items-center">
                  <i 
                    data-feather={getEventIcon(selectedEvent.extendedProps.type)} 
                    className="me-2" 
                    style={{ width: "20px", height: "20px" }} 
                  />
                  Détails de l'événement
                </div>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedEvent && (
              <div>
                <h5 className={theme === "dark" ? "text-light" : "text-dark"}>
                  {selectedEvent.title}
                </h5>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Type :</span>
                    <Badge bg="primary">
                      {selectedEvent.extendedProps.type === 'evaluation' ? 'Évaluation' : 
                       selectedEvent.extendedProps.type === 'cours' ? 'Cours' : 'Événement'}
                    </Badge>
                  </div>
                  
                  {selectedEvent.extendedProps.matiere && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Matière :</span>
                      <span className={theme === "dark" ? "text-light" : "text-dark"}>
                        {selectedEvent.extendedProps.matiere}
                      </span>
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Date :</span>
                    <span className={theme === "dark" ? "text-light" : "text-dark"}>
                      {formatDate(selectedEvent.start)}
                    </span>
                  </div>
                  
                  {selectedEvent.extendedProps.type === 'evaluation' && (
                    <>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Durée :</span>
                        <span className={theme === "dark" ? "text-light" : "text-dark"}>
                          {formatDuration(selectedEvent.extendedProps.duree_minutes)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Questions :</span>
                        <span className={theme === "dark" ? "text-light" : "text-dark"}>
                          {selectedEvent.extendedProps.questions_count}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Points :</span>
                        <span className={theme === "dark" ? "text-light" : "text-dark"}>
                          {selectedEvent.extendedProps.total_points}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">État :</span>
                        <Badge bg={getEtatBadge(selectedEvent.extendedProps.etat_temporel, selectedEvent.extendedProps.a_participe).variant}>
                          {getEtatBadge(selectedEvent.extendedProps.etat_temporel, selectedEvent.extendedProps.a_participe).text}
                        </Badge>
                      </div>
                    </>
                  )}
                  
                  {selectedEvent.extendedProps.description && (
                    <div className="mt-3">
                      <span className="text-muted d-block mb-2">Description :</span>
                      <div className={`p-2 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                        {selectedEvent.extendedProps.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowEventModal(false)}>
              Fermer
            </Button>
            {selectedEvent?.extendedProps.clickable && selectedEvent?.extendedProps.redirect_url && (
              <Button 
                variant="primary" 
                onClick={() => {
                  navigate(selectedEvent.extendedProps.redirect_url);
                  setShowEventModal(false);
                }}
              >
                <i data-feather="external-link" className="me-2" style={{ width: "16px", height: "16px" }} />
                Accéder
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Styles CSS personnalisés */}
        <style jsx="true" >{`
          .calendar-container .fc {
            font-family: inherit;
          }
          
          .calendar-container .fc-toolbar {
            margin-bottom: 1rem;
          }
          
          .calendar-container .fc-event {
            cursor: pointer;
            border-radius: 4px;
            padding: 2px 4px;
            margin-bottom: 1px;
          }
          
          .calendar-container .fc-event:hover {
            opacity: 0.8;
            transform: translateY(-1px);
            transition: all 0.2s ease;
          }
          
          .fc-event-content-custom {
            padding: 2px;
          }
          
          .fc-event-title-container {
            display: flex;
            align-items: center;
            font-weight: 500;
            font-size: 11px;
            line-height: 1.2;
          }
          
          .fc-event-meta {
            font-size: 9px;
            opacity: 0.8;
            margin-top: 1px;
          }
          
          .dark-calendar .fc-theme-standard td,
          .dark-calendar .fc-theme-standard th {
            border-color: #495057;
          }
          
          .dark-calendar .fc-theme-standard .fc-scrollgrid {
            border-color: #495057;
          }
          
          .dark-calendar .fc-col-header-cell {
            background-color: transparent;
            color: ${theme === "dark" ? "#ffffff" : "#000000"};
          }
          
          .dark-calendar .fc-daygrid-day {
            background-color: transparent;
            color: ${theme === "dark" ? "#ffffff" : "#000000"};
          }
          
          .dark-calendar .fc-day-today {
            background-color: ${theme === "dark" ? "#495057" : "#fff3cd"} !important;
          }
        `}</style>

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