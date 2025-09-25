import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Button, Alert, Spinner, Badge, Modal, Toast, ToastContainer, Image } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import FormateurLayout from "../../layouts/Formateur/Layout";
import feather from "feather-icons";
import api from "../../services/api";
import { useFileViewer } from "./CourFileWiewer";

export default function CoursShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cours, setCours] = useState(null);
  const [theme, setTheme] = useState("light");

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modal pour confirmation suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Hook pour le visualiseur de fichiers
  const { openFileViewer, FileViewerComponent } = useFileViewer();

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

  // Charger les données du cours
  const fetchCours = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/formateur/show/cours/${id}`);
      setCours(response.data.cours);
    } catch (err) {
      setError('Erreur lors du chargement du cours');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCours();
    }
  }, [fetchCours]);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [cours]);

  // Gérer le changement de statut
  const handleToggleStatus = async () => {
    try {
      await api.patch(`/formateur/toggle-status/cours/${id}`);
      fetchCours();
      showToastMessage("Statut du cours mis à jour", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la mise à jour du statut", 'danger');
    }
  };

  // Gérer la suppression
  const handleDelete = async () => {
    try {
      await api.delete(`/formateur/destroy/cours/${id}`);
      showToastMessage("Cours supprimé avec succès", 'success');
      setTimeout(() => {
        navigate('/formateur/view/cours');
      }, 1500);
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
    }
    setShowDeleteModal(false);
  };

  // Télécharger un fichier joint
  const handleDownloadFile = async (fileIndex, fichierNom) => {
    try {
      const response = await api.get(`/formateur/download/cours/${id}/file/${fileIndex}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = fichierNom ||`fichier_${fileIndex}.pdf`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToastMessage(`Téléchargement de ${fileName} démarré`, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors du téléchargement", 'danger');
    }
  };

  // Ouvrir le visualiseur de fichier
  const handleViewFile = (fileIndex, fichier) => {
    openFileViewer(
      cours,
      fileIndex,
      fichier.nom,
      fichier.type,
      fichier.taille,
      fichier.url
    );
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Publié': return 'success';
      case 'Brouillon': return 'warning';
      case 'Archivé': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Publié': return 'eye';
      case 'Brouillon': return 'edit-3';
      case 'Archivé': return 'archive';
      default: return 'help-circle';
    }
  };

  // Fonction pour détecter le type de fichier et son icône
  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return 'file-text';
    if (type?.includes('word') || type?.includes('document')) return 'file-text';
    if (type?.includes('sheet') || type?.includes('excel')) return 'grid';
    if (type?.includes('presentation') || type?.includes('powerpoint')) return 'monitor';
    if (type?.includes('image')) return 'image';
    if (type?.includes('text')) return 'file-text';
    return 'file';
  };

  const getFileColor = (type) => {
    if (type?.includes('pdf')) return 'text-danger';
    if (type?.includes('word') || type?.includes('document')) return 'text-primary';
    if (type?.includes('sheet') || type?.includes('excel')) return 'text-success';
    if (type?.includes('presentation') || type?.includes('powerpoint')) return 'text-warning';
    if (type?.includes('image')) return 'text-info';
    return 'text-secondary';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fonction pour prévisualiser une image
  const canPreviewImage = (type) => {
    return type?.includes('image');
  };

  if (loading) {
    return (
      <FormateurLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du cours...</p>
        </div>
      </FormateurLayout>
    );
  }

  if (error || !cours) {
    return (
      <FormateurLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error || 'Cours introuvable'}
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" as={Link} to="/formateur/view/cours">
            <i data-feather="arrow-left" className="me-2" />
            Retour à la liste
          </Button>
          <Button variant="outline-primary" onClick={fetchCours}>
            <i data-feather="refresh-cw" className="me-2" />
            Réessayer
          </Button>
        </div>
      </FormateurLayout>
    );
  }

  return (
    <FormateurLayout>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              as={Link} 
              to="/formateur/view/cours"
              className="me-3"
            >
              <i data-feather="arrow-left" className="me-1" style={{ width: '16px', height: '16px' }} />
              Retour
            </Button>
            <div>
              <h1 className={`h3 mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                {cours.titre}
              </h1>
              <div className="d-flex align-items-center gap-2 mt-1">
                <small className="text-muted">{cours.matricule}</small>
                <Badge bg={getStatusBadge(cours.status)} className="px-2 py-1">
                  <i data-feather={getStatusIcon(cours.status)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                  {cours.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary"
            onClick={handleToggleStatus}
            title="Changer le statut"
          >
            <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
            Changer statut
          </Button>
          <Button 
            variant="warning" 
            as={Link} 
            to={`/formateur/edit/cours/${id}`}
          >
            <i data-feather="edit" className="me-2" style={{ width: '16px', height: '16px' }} />
            Modifier
          </Button>
          <Button 
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <i data-feather="trash-2" className="me-2" style={{ width: '16px', height: '16px' }} />
            Supprimer
          </Button>
        </div>
      </div>

      <Row>
        {/* Contenu principal */}
        <Col lg={8}>
          {/* Informations du cours */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="info" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations du cours
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-4">
                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">TITRE</label>
                    <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {cours.titre}
                    </div>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">MATIÈRE</label>
                    <div className={`d-flex align-items-center ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="book" className="me-2" style={{ width: '16px', height: '16px' }} />
                      {cours.matiere?.nom || 'Non définie'}
                    </div>
                    {cours.matiere?.classroom && (
                      <small className="text-muted">
                        <i data-feather="home" className="me-1" style={{ width: '12px', height: '12px' }} />
                        {cours.matiere.classroom.name}
                      </small>
                    )}
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">MATRICULE</label>
                    <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <code className="px-2 py-1 bg-primary bg-opacity-10 rounded text-primary">
                        {cours.matricule}
                      </code>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">DATE DE CRÉATION</label>
                    <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {new Date(cours.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </Col>

                {cours.description && (
                  <Col md={12}>
                    <div className="mb-3">
                      <label className="small fw-bold text-muted">DESCRIPTION</label>
                      <div className={`${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {cours.description}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Contenu du cours */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="file-text" className="me-2" style={{ width: '20px', height: '20px' }} />
                Contenu du cours
              </h5>
            </Card.Header>
            <Card.Body>
              <div 
                className={`${theme === "dark" ? "text-light" : "text-dark"}`}
                style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
              >
                {cours.contenu}
              </div>
            </Card.Body>
          </Card>

          {/* Liens externes */}
          {cours.liens_externes_decoded && cours.liens_externes_decoded.length > 0 && (
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="external-link" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Liens externes
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-column gap-2">
                  {cours.liens_externes_decoded.map((lien, index) => (
                    <div key={index} className="d-flex align-items-center">
                      <i data-feather="link" className="me-2 text-primary" style={{ width: '16px', height: '16px' }} />
                      <a 
                        href={lien} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary text-decoration-none"
                      >
                        {lien}
                      </a>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Statut et actions */}
          <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="settings" className="me-2" style={{ width: '20px', height: '20px' }} />
                Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary"
                  onClick={handleToggleStatus}
                >
                  <i data-feather="refresh-cw" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Changer le statut
                </Button>
                <Button 
                  variant="warning"
                  as={Link}
                  to={`/formateur/edit/cours/${id}`}
                >
                  <i data-feather="edit" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Modifier le cours
                </Button>
                <Button 
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <i data-feather="trash-2" className="me-2" style={{ width: '16px', height: '16px' }} />
                  Supprimer le cours
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Fichiers joints avec visualiseur */}
          {(cours.fichiers_joints_1_decoded || cours.fichiers_joints_2_decoded) && (
            <Card className={`border-0 shadow-sm mb-4 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="paperclip" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Fichiers joints
                </h5>
              </Card.Header>
              <Card.Body>
                {cours.fichiers_joints_1_decoded && (
                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-2 d-block">FICHIER 1</label>
                    {cours.fichiers_joints_1_decoded.map((fichier, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="d-flex align-items-start justify-content-between">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <i 
                                data-feather={getFileIcon(fichier.type)} 
                                className={`me-2 ${getFileColor(fichier.type)}`} 
                                style={{ width: '20px', height: '20px' }} 
                              />
                              <strong className={theme === "dark" ? "text-light" : "text-dark"}>
                                {fichier.nom}
                              </strong>
                            </div>
                            <div className="small text-muted mb-2">
                              Taille: {formatFileSize(fichier.taille)}
                            </div>
                            {canPreviewImage(fichier.type) && (
                              <div className="mt-2">
                                <Image
                                  src={fichier.url}
                                  alt={fichier.nom}
                                  thumbnail
                                  style={{ maxWidth: '150px', maxHeight: '100px', cursor: 'pointer' }}
                                  onClick={() => handleViewFile(1, fichier)}
                                />
                              </div>
                            )}
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleViewFile(1, fichier)}
                              title="Visualiser"
                            >
                              <i data-feather="eye" style={{ width: '14px', height: '14px' }} />
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleDownloadFile(1, fichier.nom)}
                              title="Télécharger"
                            >
                              <i data-feather="download" style={{ width: '14px', height: '14px' }} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cours.fichiers_joints_2_decoded && (
                  <div>
                    <label className="small fw-bold text-muted mb-2 d-block">FICHIER 2</label>
                    {cours.fichiers_joints_2_decoded.map((fichier, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="d-flex align-items-start justify-content-between">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <i 
                                data-feather={getFileIcon(fichier.type)} 
                                className={`me-2 ${getFileColor(fichier.type)}`} 
                                style={{ width: '20px', height: '20px' }} 
                              />
                              <strong className={theme === "dark" ? "text-light" : "text-dark"}>
                                {fichier.nom}
                              </strong>
                            </div>
                            <div className="small text-muted mb-2">
                              Taille: {formatFileSize(fichier.taille)}
                            </div>
                            {canPreviewImage(fichier.type) && (
                              <div className="mt-2">
                                <Image
                                  src={fichier.url}
                                  alt={fichier.nom}
                                  thumbnail
                                  style={{ maxWidth: '150px', maxHeight: '100px', cursor: 'pointer' }}
                                  onClick={() => handleViewFile(2, fichier)}
                                />
                              </div>
                            )}
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleViewFile(2, fichier)}
                              title="Visualiser"
                            >
                              <i data-feather="eye" style={{ width: '14px', height: '14px' }} />
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleDownloadFile(2, fichier.nom)}
                              title="Télécharger"
                            >
                              <i data-feather="download" style={{ width: '14px', height: '14px' }} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Informations sur la matière */}
          {cours.matiere && (
            <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
              <Card.Header className="border-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i data-feather="book" className="me-2" style={{ width: '20px', height: '20px' }} />
                  Matière
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong className={theme === "dark" ? "text-light" : "text-dark"}>
                    {cours.matiere.nom}
                  </strong>
                  {cours.matiere.description && (
                    <p className="small text-muted mt-1 mb-0">
                      {cours.matiere.description}
                    </p>
                  )}
                </div>
                
                {cours.matiere.classroom && (
                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted">
                      <i data-feather="home" className="me-2" style={{ width: '16px', height: '16px' }} />
                      <small>Classe: {cours.matiere.classroom.name}</small>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge bg="info" className="px-2 py-1">
                      Coeff. {cours.matiere.coefficient || 1}
                    </Badge>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    as={Link}
                    to={`/formateur/view/cours/matiere/${cours.matiere.matricule}`}
                  >
                    <i data-feather="list" className="me-1" style={{ width: '14px', height: '14px' }} />
                    Autres cours
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Modal de confirmation de suppression */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
      >
        <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
          <Modal.Title>Confirmation de Suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
          <p>Êtes-vous sûr de vouloir supprimer ce cours ?</p>
          <div className="alert alert-warning">
            <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Cette action est irréversible. Le cours "{cours.titre}" et tous ses fichiers joints seront définitivement supprimés.
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>
            <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
            Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Visualiseur de fichiers */}
      <FileViewerComponent />

      {/* Notifications Toast */}
      <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 1050 }}>
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
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
    </FormateurLayout>
  );
}