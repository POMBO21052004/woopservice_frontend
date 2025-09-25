import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import {
  Container, Table, Button, Form, Modal, Row, Col, Badge, Card, Toast, ToastContainer,
} from "react-bootstrap";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";

export default function Logs() {
  // États
  const [logs, setLogs] = useState([]);
  const [checkedLogs, setCheckedLogs] = useState([]);
  const [auteurs, setAuteurs] = useState([]);
  const [statistics, setStatistics] = useState({
    total_logs: 0,
    total_auteurs: 0,
    logs_lues: 0,
    logs_non_lues: 0
  });

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [statutLectureFilter, setStatutLectureFilter] = useState("");
  const [matriculeAuteurFilter, setMatriculeAuteurFilter] = useState("");

  // Modales
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAllModal, setShowMarkAllModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false); // Nouvelle variable d'état
  const [selectedLog, setSelectedLog] = useState(null);
  const [logToDelete, setLogToDelete] = useState(null);
  const [solution, setSolution] = useState("");

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // État du thème
  const [theme, setTheme] = useState("light");

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

  // Récupérer les logs avec filtres
  const fetchLogs = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (statutLectureFilter) params.statut_lecture = statutLectureFilter;
      if (matriculeAuteurFilter) params.matricule_auteur = matriculeAuteurFilter;

      const res = await api.get("/admin-systeme/view/logs", { params });
      setLogs(res.data.logs || []);
      setStatistics(res.data.statistics || {
        total_logs: 0,
        total_auteurs: 0,
        logs_lues: 0,
        logs_non_lues: 0
      });
      setAuteurs(res.data.auteurs || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des logs", err);
      showToastMessage("Erreur lors de la récupération des logs", 'danger');
    }
  }, [search, createdAtFilter, statutLectureFilter, matriculeAuteurFilter]);

  useEffect(() => {
    feather.replace();
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    feather.replace();
  }, [logs, checkedLogs]);

  // Marquer un log comme lu
  const markAsRead = async (logId) => {
    try {
      await api.put(`/admin-systeme/logs/${logId}/mark-read`);
      fetchLogs();
      showToastMessage("Log marqué comme lu", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du marquage", 'danger');
    }
  };

  // Marquer tous les logs comme lus
  const markAllAsRead = async () => {
    try {
      const res = await api.put("/admin-systeme/logs/mark-all-read");
      fetchLogs();
      setShowMarkAllModal(false);
      showToastMessage(res.data.message, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du marquage", 'danger');
    }
  };

  // Ajouter une solution
  const handleSolutionSubmit = async () => {
    try {
      await api.put(`/admin-systeme/logs/${selectedLog.id}/solution`, { solution });
      fetchLogs();
      setShowSolutionModal(false);
      setSolution("");
      setSelectedLog(null);
      showToastMessage("Solution ajoutée avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de l'ajout de la solution", 'danger');
    }
  };

  // Gérer la suppression simple ou en lot
  const confirmDelete = (logId = null) => {
    setLogToDelete(logId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const idsToDelete = logToDelete ? [logToDelete] : checkedLogs;
      
      if (logToDelete) {
        await api.delete(`/admin-systeme/destroy/logs/${logToDelete}`);
      } else {
        await api.post(`/admin-systeme/logs/destroy-group`, { ids: idsToDelete });
      }
      
      fetchLogs();
      setShowDeleteModal(false);
      setCheckedLogs([]);
      setLogToDelete(null);
      showToastMessage("Log(s) supprimé(s) avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la suppression", 'danger');
    }
  };

  // Gérer les cases à cocher pour la suppression en lot
  const handleCheck = (event) => {
    const { value, checked } = event.target;
    const logId = parseInt(value);
    
    if (checked) {
      setCheckedLogs(prev => [...prev, logId]);
    } else {
      setCheckedLogs(prev => prev.filter(item => item !== logId));
    }
  };

  // Gérer la sélection globale
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setCheckedLogs(logs.map(log => log.id));
    } else {
      setCheckedLogs([]);
    }
  };

  // Ouvrir modal solution
  const openSolutionModal = (log) => {
    setSelectedLog(log);
    setSolution(log.solution || "");
    setShowSolutionModal(true);
  };

  // Ouvrir modal de détails
  const openDetailsModal = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminSystemeLayout>
      <Container className="py-4">
        {/* En-tête et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-danger bg-opacity-25" : "bg-danger bg-opacity-10"}`}>
              <i data-feather="alert-circle" className="text-danger" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Logs
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Suivi et résolution des erreurs système
              </p>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {statistics.total_logs}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total Logs
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="file-text" style={{ width: "24px", height: "24px" }}></i>
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
                        {statistics.total_auteurs}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Auteurs Uniques
                      </small>
                    </div>
                    <div className="text-primary">
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
                        {statistics.logs_lues}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Logs Lues
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="check-circle" style={{ width: "24px", height: "24px" }}></i>
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
                      <h3 className="mb-0 text-danger">
                        {statistics.logs_non_lues}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Non Lues
                      </small>
                    </div>
                    <div className="text-danger">
                      <i data-feather="alert-triangle" style={{ width: "24px", height: "24px" }}></i>
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
                <i data-feather="list" className="text-danger me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Journal des Erreurs
                </span>
              </div>
              <div className="d-flex gap-2 mt-2 mt-md-0">
                {checkedLogs.length > 0 && (
                  <Button variant="danger" className="d-flex align-items-center" onClick={() => confirmDelete()}>
                    <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Supprimer ({checkedLogs.length})
                  </Button>
                )}
                <Button variant="success" className="d-flex align-items-center" onClick={() => setShowMarkAllModal(true)}>
                  <i data-feather="check-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Tout Marquer Lu
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <div className="row g-3">
                <div className="col-md-3">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche Générale
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Matricule, action, message..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-3">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="user" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Auteur
                  </Form.Label>
                  <Form.Select
                    value={matriculeAuteurFilter}
                    onChange={e => setMatriculeAuteurFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous les auteurs</option>
                    {auteurs.map(auteur => (
                      <option key={auteur.matricule} value={auteur.matricule}>
                        {auteur.name}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-3">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="eye" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Statut Lecture
                  </Form.Label>
                  <Form.Select
                    value={statutLectureFilter}
                    onChange={e => setStatutLectureFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous</option>
                    <option value="Lue">Lue</option>
                    <option value="Non lue">Non lue</option>
                  </Form.Select>
                </div>
                <div className="col-md-3">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={createdAtFilter}
                    onChange={e => setCreatedAtFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
              </div>
            </div>

            {/* Tableau des logs */}
            <div className="table-responsive">
              <Table
                hover
                className={`align-middle ${theme === "dark" ? "table-dark" : ""}`}
                style={{ borderRadius: "8px", overflow: "hidden" }}
              >
                <thead className="table-danger">
                  <tr>
                    <th className="text-center" style={{ width: "50px" }}>
                      <Form.Check
                        type="checkbox"
                        checked={logs.length > 0 && checkedLogs.length === logs.length}
                        onChange={handleSelectAll}
                        className={theme === "dark" ? "text-light" : ""}
                      />
                    </th>
                    <th>#</th>
                    <th>Auteur</th>
                    <th className="d-none d-lg-table-cell">Action</th>
                    <th className="d-none d-lg-table-cell">Statut</th>
                    <th>Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <tr key={log.id} className={log.statut_lecture === 'Non lue' ? 'table-warning' : ''}>
                        <td className="text-center">
                          <Form.Check
                            type="checkbox"
                            value={log.id}
                            checked={checkedLogs.includes(log.id)}
                            onChange={handleCheck}
                            className={theme === "dark" ? "text-light" : ""}
                          />
                        </td>
                        <td>
                          <Badge bg={theme === "dark" ? "secondary" : "dark"} className="fw-normal">
                            {index + 1}
                          </Badge>
                        </td>
                        <td>{log.user_auteur?.name || 'SYSTEM'}</td>
                        <td className="d-none d-lg-table-cell">{log.action}</td>
                        <td className="d-none d-lg-table-cell">
                          <Badge bg={log.statut_lecture === 'Lue' ? 'success' : 'danger'}>
                            {log.statut_lecture}
                          </Badge>
                        </td>
                        <td>{formatDate(log.created_at)}</td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <Button variant="outline-info" size="sm" onClick={() => openDetailsModal(log)}>
                                <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                            </Button>
                            {log.statut_lecture === 'Non lue' && (
                              <Button variant="outline-success" size="sm" onClick={() => markAsRead(log.id)}>
                                <i data-feather="check"style={{ width: "14px", height: "14px" }}></i>
                              </Button>
                            )}
                            <Button variant="outline-primary" size="sm" onClick={() => openSolutionModal(log)}>
                              <i data-feather="edit" style={{ width: "14px", height: "14px" }} ></i>
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => confirmDelete(log.id)}>
                              <i data-feather="trash-2" style={{ width: "14px", height: "14px" }}></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                          <i data-feather="alert-circle" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                          <div>
                            <h6>Aucun log trouvé</h6>
                            <p className="small mb-0">Aucun log ne correspond à vos critères de recherche.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Modal de détails du log */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="lg">
          <Modal.Header closeButton className={theme === "dark" ? "bg-dark text-light" : ""}>
            <Modal.Title>Détails du Log - {selectedLog?.matricule}</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {selectedLog && (
              <Row className="g-3">
                <Col md={6}>
                  <Card className={`h-100 ${theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <h6 className="fw-bold">Informations Générales</h6>
                      <hr className="mt-1 mb-2" />
                      <p className="mb-1"><strong>Auteur :</strong> {selectedLog.user_auteur?.name || 'SYSTEM'}</p>
                      <p className="mb-1"><strong>Controller :</strong> {selectedLog.name_controller}</p>
                      <p className="mb-1"><strong>Action :</strong> {selectedLog.action}</p>
                      <p className="mb-1"><strong>Date :</strong> {formatDate(selectedLog.created_at)}</p>
                      <p className="mb-1"><strong>Statut :</strong> 
                        <Badge bg={selectedLog.statut_lecture === 'Lue' ? 'success' : 'danger'} className="ms-2">
                          {selectedLog.statut_lecture}
                        </Badge>
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className={`h-100 ${theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <h6 className="fw-bold">Message d'Erreur</h6>
                      <hr className="mt-1 mb-2" />
                      <p>{selectedLog.message}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={12}>
                  <Card className={`h-100 ${theme === "dark" ? "bg-dark text-light border-secondary" : "bg-light"}`}>
                    <Card.Body>
                      <h6 className="fw-bold">Solution</h6>
                      <hr className="mt-1 mb-2" />
                      <p>{selectedLog.solution || "Aucune solution n'a encore été ajoutée."}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light" : ""}>
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Fermer</Button>
          </Modal.Footer>
        </Modal>

        {/* Modal pour ajouter une solution */}
        <Modal show={showSolutionModal} onHide={() => setShowSolutionModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Ajouter une Solution</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Solution</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={solution}
                  onChange={e => setSolution(e.target.value)}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSolutionModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSolutionSubmit}>
              Enregistrer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de confirmation de suppression */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirmer la Suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {logToDelete
              ? "Êtes-vous sûr de vouloir supprimer ce log ?"
              : `Êtes-vous sûr de vouloir supprimer les ${checkedLogs.length} logs sélectionnés ?`}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirmed}>
              Supprimer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de confirmation "Tout marquer lu" */}
        <Modal show={showMarkAllModal} onHide={() => setShowMarkAllModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirmer l'action</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Êtes-vous sûr de vouloir marquer tous les logs comme lus ?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMarkAllModal(false)}>
              Annuler
            </Button>
            <Button variant="success" onClick={markAllAsRead}>
              Confirmer
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Notifications Toast */}
        <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 1050 }}>
          <Toast
            onClose={() => setShowToast(false)}
            show={showToast}
            delay={3000}
            autohide
            bg={toastType}
          >
            <Toast.Header>
              <strong className="me-auto">Notification</strong>
            </Toast.Header>
            <Toast.Body className={toastType === 'success' ? 'text-white' : 'text-white'}>
              {toastMessage}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
    </AdminSystemeLayout>
  );
}