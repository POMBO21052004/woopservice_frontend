import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Spinner, Alert, Card, Badge, Row, Col, Tabs, Tab } from "react-bootstrap";
import feather from "feather-icons";
import api from "../../services/api";

export default function FileViewer({ show, onHide, cours, fileIndex, fileName, fileType, fileSize, fileUrl }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileContent, setFileContent] = useState(null);
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

  // Charger le contenu du fichier selon son type
  const loadFileContent = useCallback(async () => {
    if (!show || !cours?.id || !fileIndex) return;

    try {
      setLoading(true);
      setError(null);
      setFileContent(null);

      // Pour les images, utiliser directement l'URL
      if (isImageFile(fileType)) {
        setFileContent({ type: 'image', url: fileUrl });
        return;
      }

      // Pour les PDFs, utiliser un embed
      if (isPDFFile(fileType)) {
        setFileContent({ type: 'pdf', url: fileUrl });
        return;
      }

      // Pour les fichiers texte, essayer de les lire
      if (isTextFile(fileType)) {
        try {
          const response = await fetch(fileUrl);
          if (response.ok) {
            const text = await response.text();
            setFileContent({ type: 'text', content: text });
          } else {
            throw new Error('Fichier non accessible');
          }
        } catch (err) {
          setFileContent({ type: 'download-only', message: 'Prévisualisation non disponible' });
        }
        return;
      }

      // Pour les autres types, afficher un message d'info
      setFileContent({ 
        type: 'download-only', 
        message: 'Prévisualisation non supportée pour ce type de fichier' 
      });

    } catch (err) {
      setError('Erreur lors du chargement du fichier');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, [show, cours?.id, fileIndex, fileType, fileUrl]);

  useEffect(() => {
    if (show) {
      loadFileContent();
    }
  }, [loadFileContent, show]);

  useEffect(() => {
    feather.replace();
  }, [fileContent, loading]);

  // Fonctions utilitaires pour détecter le type de fichier
  const isImageFile = (type) => {
    return type?.includes('image') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
  };

  const isPDFFile = (type) => {
    return type?.includes('pdf') || /\.pdf$/i.test(fileName);
  };

  const isTextFile = (type) => {
    return type?.includes('text') || /\.(txt|md|csv)$/i.test(fileName);
  };

  const isOfficeFile = (type) => {
    return type?.includes('word') || type?.includes('excel') || type?.includes('powerpoint') ||
           /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(fileName);
  };

  const getFileIcon = (type) => {
    if (isImageFile(type)) return 'image';
    if (isPDFFile(type)) return 'file-text';
    if (type?.includes('word') || type?.includes('document')) return 'file-text';
    if (type?.includes('sheet') || type?.includes('excel')) return 'grid';
    if (type?.includes('presentation') || type?.includes('powerpoint')) return 'monitor';
    if (isTextFile(type)) return 'file-text';
    return 'file';
  };

  const getFileColor = (type) => {
    if (isImageFile(type)) return 'text-info';
    if (isPDFFile(type)) return 'text-danger';
    if (type?.includes('word') || type?.includes('document')) return 'text-primary';
    if (type?.includes('sheet') || type?.includes('excel')) return 'text-success';
    if (type?.includes('presentation') || type?.includes('powerpoint')) return 'text-warning';
    if (isTextFile(type)) return 'text-secondary';
    return 'text-muted';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Taille inconnue';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Télécharger le fichier
  const handleDownload = async () => {
    try {
      const response = await api.get(`/etudiant/download/cours/${cours.id}/file/${fileIndex}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
    }
  };

  // Rendu du contenu selon le type de fichier
  const renderFileContent = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du fichier...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="m-3">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
      );
    }

    if (!fileContent) return null;

    switch (fileContent.type) {
      case 'image':
        return (
          <div className="text-center p-3">
            <img 
              src={fileContent.url} 
              alt={fileName}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '70vh', 
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        );

      case 'pdf':
        return (
          <div style={{ height: '70vh' }}>
            <iframe
              src={`${fileContent.url}#toolbar=1&navpanes=1&scrollbar=1`}
              width="100%"
              height="100%"
              style={{ border: 'none', borderRadius: '8px' }}
              title={fileName}
            >
              <p>
                Votre navigateur ne supporte pas les PDFs. 
                <Button variant="link" onClick={handleDownload}>
                  Télécharger le fichier
                </Button>
              </p>
            </iframe>
          </div>
        );

      case 'text':
        return (
          <Card className={`m-3 ${theme === "dark" ? "bg-dark text-light" : ""}`}>
            <Card.Header>
              <i data-feather="file-text" className="me-2" />
              Contenu du fichier
            </Card.Header>
            <Card.Body>
              <pre 
                style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  maxHeight: '60vh',
                  overflow: 'auto',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}
                className={theme === "dark" ? "text-light" : "text-dark"}
              >
                {fileContent.content}
              </pre>
            </Card.Body>
          </Card>
        );

      case 'download-only':
        return (
          <div className="text-center py-5">
            <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
              <i 
                data-feather={getFileIcon(fileType)} 
                className={`mb-3 ${getFileColor(fileType)}`} 
                style={{ width: "64px", height: "64px" }}
              />
              <div>
                <h5>Prévisualisation non disponible</h5>
                <p>{fileContent.message}</p>
                {isOfficeFile(fileType) && (
                  <small className="text-muted">
                    Les fichiers Office nécessitent une application dédiée pour être visualisés.
                  </small>
                )}
                <div className="mt-3">
                  <Button variant="primary" onClick={handleDownload}>
                    <i data-feather="download" className="me-2" />
                    Télécharger le fichier
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
    >
      <Modal.Header 
        closeButton
        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
      >
        <Modal.Title className="d-flex align-items-center">
          <i 
            data-feather={getFileIcon(fileType)} 
            className={`me-2 ${getFileColor(fileType)}`}
            style={{ width: '24px', height: '24px' }}
          />
          {fileName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body 
        className={`p-0 ${theme === "dark" ? "bg-dark text-light" : ""}`}
        style={{ maxHeight: '80vh', overflow: 'auto' }}
      >
        {/* Informations sur le fichier */}
        <div className="p-3 border-bottom">
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center">
                <Badge bg="secondary" className="me-2">
                  {formatFileSize(fileSize)}
                </Badge>
                <small className="text-muted">
                  Cours: {cours?.titre}
                </small>
              </div>
            </Col>
            <Col md={4} className="text-end">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleDownload}
                className="me-2"
              >
                <i data-feather="download" className="me-1" style={{ width: '14px', height: '14px' }} />
                Télécharger
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={onHide}
              >
                <i data-feather="x" className="me-1" style={{ width: '14px', height: '14px' }} />
                Fermer
              </Button>
            </Col>
          </Row>
        </div>

        {/* Contenu du fichier */}
        {renderFileContent()}
      </Modal.Body>
    </Modal>
  );
}

// Hook personnalisé pour utiliser le FileViewer facilement
export const useFileViewer = () => {
  const [viewerState, setViewerState] = useState({
    show: false,
    cours: null,
    fileIndex: null,
    fileName: '',
    fileType: '',
    fileSize: 0,
    fileUrl: ''
  });

  const openFileViewer = (cours, fileIndex, fileName, fileType, fileSize, fileUrl) => {
    setViewerState({
      show: true,
      cours,
      fileIndex,
      fileName,
      fileType,
      fileSize,
      fileUrl
    });
  };

  const closeFileViewer = () => {
    setViewerState(prev => ({ ...prev, show: false }));
  };

  const FileViewerComponent = () => (
    <FileViewer
      show={viewerState.show}
      onHide={closeFileViewer}
      cours={viewerState.cours}
      fileIndex={viewerState.fileIndex}
      fileName={viewerState.fileName}
      fileType={viewerState.fileType}
      fileSize={viewerState.fileSize}
      fileUrl={viewerState.fileUrl}
    />
  );

  return {
    openFileViewer,
    closeFileViewer,
    FileViewerComponent
  };
};