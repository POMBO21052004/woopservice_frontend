import React, { useState, useEffect } from "react";
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Badge, 
  Alert, 
  Spinner, 
  Table,
  Modal,
  Form,
  InputGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import FeatherIcon from "../../components/FeatherIcon";

export default function ClassroomUsers() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [classroom, setClassroom] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // États pour les modals
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBulkRemoveModal, setShowBulkRemoveModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
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

  // Charger les données
  useEffect(() => {
    const fetchClassroomUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/formateur/view/classroom/${id}/users`);
        setClassroom(response.data.classroom);
        setUsers(response.data.users || []);
        setFilteredUsers(response.data.users || []);
      } catch (err) {
        setError('Erreur lors du chargement des utilisateurs de la salle');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClassroomUsers();
    }
  }, [id]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [users, filteredUsers, selectedUsers]);

  // Filtrer les utilisateurs
  useEffect(() => {
    let filtered = users;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Filtre par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
    
    // Réinitialiser les sélections si les utilisateurs filtrés changent
    setSelectedUsers([]);
    setSelectAll(false);
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Gestion de la sélection
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
    setSelectAll(!selectAll);
  };

  // Gestion de la suppression d'un utilisateur
  const handleRemoveUser = async () => {
    try {
      await api.delete(`/formateur/classroom/${id}/remove-user/${selectedUser.id}`);
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setSuccess(`${selectedUser.name} a été retiré de la salle avec succès`);
      setShowRemoveModal(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du retrait de l\'utilisateur');
      setShowRemoveModal(false);
    }
  };

  // Gestion de la suppression en lot
  const handleBulkRemove = async () => {
    try {
      await api.post(`/formateur/classroom/${id}/remove-users`, {
        user_ids: selectedUsers
      });
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSuccess(`${selectedUsers.length} utilisateur(s) retiré(s) de la salle avec succès`);
      setSelectedUsers([]);
      setSelectAll(false);
      setShowBulkRemoveModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du retrait des utilisateurs');
      setShowBulkRemoveModal(false);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch(role) {
      case 0: return 'warning';  // Etudiant en zone d'attente
      case 1: return 'info';     // Étudiant
      default: return 'secondary';
    }
  };

  const getRoleText = (role) => {
    switch(role) {
      case 0: return 'Étudiant En Zone d\'attente';
      case 1: return 'Étudiant';
      default: return 'Non défini';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch(status) {
      case 'Connecté': return 'success';
      case 'Déconnecté': return 'secondary';
      case 'En ligne': return 'success';
      case 'Hors ligne': return 'secondary';
      default: return 'warning';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseigné';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des utilisateurs...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (error && !classroom) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
        <Button variant="secondary" as={Link} to="/formateur/view/classrooms">
          <i data-feather="arrow-left" className="me-2" />
          Retour à la liste
        </Button>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center mb-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              as={Link} 
              to={`/formateur/show/classroom/${id}`}
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour à la salle
            </Button>
            <h1 className="h3 mb-0">Utilisateurs de {classroom?.name}</h1>
            <Badge bg="primary" className="ms-3 px-3 py-2">
              <i data-feather="users" className="me-1" style={{ width: '14px', height: '14px' }} />
              {filteredUsers.length} utilisateur(s)
            </Badge>
          </div>
          <p className="text-muted mb-0">
            <i data-feather="hash" className="me-1" style={{ width: '14px', height: '14px' }} />
            {classroom?.matricule}
          </p>
        </div>
        
        <div className="d-flex gap-2">
          {selectedUsers.length > 0 && (
            <Button 
              variant="outline-danger"
              onClick={() => setShowBulkRemoveModal(true)}
              className="d-flex align-items-center"
            >
              <i data-feather="user-minus" className="me-2" style={{ width: '16px', height: '16px' }} />
              Retirer ({selectedUsers.length})
            </Button>
          )}
          <Button 
            variant="outline-primary" 
            as={Link} 
            to={`/formateur/view/etudiants`}
            className="d-flex align-items-center"
          >
            <i data-feather="user-plus" className="me-2" style={{ width: '16px', height: '16px' }} />
            Ajouter des utilisateurs
          </Button>
        </div>
      </div>

      {/* Alertes */}
      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4" dismissible onClose={() => setSuccess(null)}>
          <i data-feather="check-circle" className="me-2" />
          {success}
        </Alert>
      )}

      <Row>
        {/* Liste des utilisateurs */}
        <Col lg={9} className="mb-4">
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0 d-flex align-items-center">
                    <i data-feather="users" className="me-2" style={{ width: '20px', height: '20px' }} />
                    Liste des utilisateurs ({filteredUsers.length})
                  </h5>
                </Col>
                <Col xs="auto">
                  <InputGroup size="sm" style={{ width: '250px' }}>
                    <InputGroup.Text>
                      <i data-feather="search" style={{ width: '14px', height: '14px' }} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                  </InputGroup>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <i data-feather="users" style={{ width: '48px', height: '48px' }} />
                  </div>
                  <h5 className={theme === "dark" ? "text-light" : "text-muted"}>
                    {users.length === 0 ? "Aucun utilisateur dans cette salle" : "Aucun utilisateur trouvé"}
                  </h5>
                  <p className={theme === "dark" ? "text-light" : "text-muted"}>
                    {users.length === 0 
                      ? "Cette salle de classe ne contient encore aucun utilisateur."
                      : "Essayez de modifier vos critères de recherche."
                    }
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className={`mb-0 ${theme === "dark" ? "table-dark" : ""}`}>
                    <thead className="table-light">
                      <tr>
                        <th width="40px">
                          <Form.Check
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            disabled={filteredUsers.length === 0}
                          />
                        </th>
                        <th>
                          <i data-feather="user" className="me-1" style={{ width: '14px', height: '14px' }} />
                          Utilisateur
                        </th>
                        <th className="d-none d-lg-table-cell">
                          <i data-feather="shield" className="me-1" style={{ width: '14px', height: '14px' }} />
                          Rôle
                        </th>
                        <th className="text-center">
                          <i data-feather="activity" className="me-1" style={{ width: '14px', height: '14px' }} />
                          Statut
                        </th>
                        <th className="d-none d-md-table-cell text-center">
                          <i data-feather="calendar" className="me-1" style={{ width: '14px', height: '14px' }} />
                          Ajouté le
                        </th>
                        <th className="text-center" width="120px">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                            />
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-3">
                                {user?.profil_url ? (
                                  <img 
                                    src={user.profil_url} 
                                    alt={user.name || "Utilisateur"}
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '40px', height: '40px' }}
                                  >
                                    <i data-feather="user" className="text-muted" style={{ width: '16px', height: '16px' }} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                  {user.name}
                                </div>
                                <div className={`small ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                  {user.email}
                                </div>
                                <small className={`text-muted font-monospace`}>
                                  {user.matricule || 'Non spécifié'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <Badge bg={getRoleBadgeVariant(user.role)} className="px-2 py-1">
                              {getRoleText(user.role)}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge
                              bg={getStatusBadgeVariant(user.status)}
                              className="px-2 py-1"
                            >
                              {user.status || "Indéfini"}
                            </Badge>
                          </td>
                          <td className="d-none d-md-table-cell text-center">
                            <small className={theme === "dark" ? "text-light" : "text-muted"}>
                              {formatDate(user.created_at)}
                            </small>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-1">
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Voir le profil</Tooltip>}
                              >
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  as={Link}
                                  to={`/formateur/view/classroom/user/${user.id}`}
                                >
                                  <i data-feather="eye" style={{ width: "14px", height: "14px" }} />
                                </Button>
                              </OverlayTrigger>
                              
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Retirer de la salle</Tooltip>}
                              >
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowRemoveModal(true);
                                  }}
                                >
                                  <i data-feather="user-minus" style={{ width: "14px", height: "14px" }} />
                                </Button>
                              </OverlayTrigger>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Colonne latérale */}
        <Col lg={3}>
          {/* Filtres */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="filter" className="me-2" style={{ width: '20px', height: '20px' }} />
                Filtres
              </h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  size="sm"
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="Connecté">Connecté</option>
                  <option value="Déconnecté">Déconnecté</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Rôle</Form.Label>
                <Form.Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  size="sm"
                  className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                >
                  <option value="all">Tous les rôles</option>
                  <option value="0">Étudiant en Espace d'attente</option>
                  <option value="1">Étudiant</option>
                </Form.Select>
              </Form.Group>

              <Button
                variant="outline-secondary"
                size="sm"
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                }}
              >
                <i data-feather="x" className="me-2" style={{ width: '14px', height: '14px' }} />
                Réinitialiser
              </Button>
            </Card.Body>
          </Card>

          {/* Statistiques */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="bar-chart-2" className="me-2 text-info" style={{ width: '20px', height: '20px' }} />
                Statistiques
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div className="text-primary mb-2">
                  <i data-feather="users" style={{ width: '32px', height: '32px' }} />
                </div>
                <h4 className="text-primary mb-0">{users.length}</h4>
                <small className={theme === "dark" ? "text-light" : "text-muted"}>
                  Utilisateur(s) total
                </small>
              </div>
              
              <hr className="my-3" />
              
              <div className="small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Etudiants en Espace d'attente :</span>
                  <span className={`fw-bold text-warning`}>
                    {users.filter(u => u.role === '0').length}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Étudiants :</span>
                  <span className={`fw-bold text-info`}>
                    {users.filter(u => u.role === '1').length}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Connectés :</span>
                  <span className={`fw-bold text-success`}>
                    {users.filter(u => u.status === 'Connecté' || u.status === 'En ligne').length}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Déconnectés :</span>
                  <span className={`fw-bold text-success`}>
                    {users.filter(u => u.status === 'Déconnecté' || u.status === 'Hors ligne').length}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Actions rapides */}
          <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="settings" className="me-2" style={{ width: '20px', height: '20px' }} />
                Actions rapides
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  as={Link} 
                  to={`/formateur/view/etudiants`}
                  className="d-flex align-items-center justify-content-center"
                  size="sm"
                >
                  <i data-feather="user-plus" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Ajouter des utilisateurs
                </Button>
                
                <Button 
                  variant="outline-info" 
                  as={Link} 
                  to={`/formateur/show/classroom/${id}`}
                  className="d-flex align-items-center justify-content-center"
                  size="sm"
                >
                  <i data-feather="home" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Retour à la salle
                </Button>
                
                <Button 
                  variant="outline-secondary" 
                  as={Link} 
                  to="/formateur/view/classrooms"
                  className="d-flex align-items-center justify-content-center"
                  size="sm"
                >
                  <i data-feather="list" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Toutes les salles
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de suppression individuelle */}
      <Modal
        show={showRemoveModal}
        onHide={() => setShowRemoveModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>
            <i data-feather="user-minus" className="me-2 text-warning" style={{ width: "20px", height: "20px" }} />
            Retirer l'utilisateur
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>
            Êtes-vous sûr de vouloir retirer <strong>"{selectedUser?.name}"</strong> de la salle <strong>"{classroom?.name}"</strong> ?
          </p>
          <div className="alert alert-warning">
            <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            L'utilisateur ne pourra plus accéder à cette salle de classe, mais son compte reste actif.
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleRemoveUser}>
            <i data-feather="user-minus" className="me-2" style={{ width: "16px", height: "16px" }} />
            Retirer de la salle
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de suppression en lot */}
      <Modal
        show={showBulkRemoveModal}
        onHide={() => setShowBulkRemoveModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>
            <i data-feather="users" className="me-2 text-warning" style={{ width: "20px", height: "20px" }} />
            Retirer plusieurs utilisateurs
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>
            Êtes-vous sûr de vouloir retirer <strong>{selectedUsers.length} utilisateur(s)</strong> de la salle <strong>"{classroom?.name}"</strong> ?
          </p>
          <div className="alert alert-warning">
            <i data-feather="info" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Les utilisateurs sélectionnés ne pourront plus accéder à cette salle de classe.
          </div>
          <div className="mt-3">
            <strong>Utilisateurs sélectionnés :</strong>
            <ul className="mt-2">
              {users.filter(u => selectedUsers.includes(u.id)).map(user => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowBulkRemoveModal(false)}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleBulkRemove}>
            <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }} />
            Retirer ({selectedUsers.length})
          </Button>
        </Modal.Footer>
      </Modal>
    </FormateurLayout>
  );
}