import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Badge, Alert, Spinner, Image } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AdminSystemeLayout from "../../layouts/AdminSysteme/Layout";
import feather from "feather-icons";
import api from "../../services/api";

export default function ProfilAdminSysteme() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données du profil
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/me');
        setUser(response.data);
      } catch (err) {
        setError('Erreur lors du chargement du profil');
        console.error('Erreur profil:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Remplacer les icônes Feather après le rendu
  useEffect(() => {
    feather.replace();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseigné';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getGenderBadge = (gender) => {
    const variants = {
      'Masculin': 'primary',
      'Féminin': 'info',
      'Autre': 'secondary'
    };
    return variants[gender] || 'secondary';
  };

  if (loading) {
    return (
      <AdminSystemeLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement du profil...</p>
        </div>
      </AdminSystemeLayout>
    );
  }

  if (error) {
    return (
      <AdminSystemeLayout>
        <Alert variant="danger" className="mb-4">
          <i data-feather="alert-circle" className="me-2" />
          {error}
        </Alert>
      </AdminSystemeLayout>
    );
  }

  return (
    <AdminSystemeLayout>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Mon Profil Personnel</h1>
          <p className="text-muted mb-0">
            Consultez et gérez vos informations professionnelles
          </p>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          as={Link} 
          to="/admin-systeme/edit/profil"
          className="d-flex align-items-center"
        >
          <i data-feather="edit-2" className="me-2" style={{ width: '20px', height: '20px' }} />
          Modifier le profil
        </Button>
      </div>

      <Row>
        {/* Informations principales */}
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="user-check" className="me-2" style={{ width: '20px', height: '20px' }} />
                Informations professionnelles
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="align-items-center mb-4">
                <Col md={3} className="text-center">
                  <div className="position-relative d-inline-block">
                    {user?.profil ? (
                      <Image
                        src={user.profil_url}
                        alt="Photo de profil"
                        className="rounded-circle"
                        width="120"
                        height="120"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                        style={{ width: '120px', height: '120px' }}
                      >
                        <i data-feather="user-check" className="text-muted" style={{ width: '48px', height: '48px' }} />
                      </div>
                    )}
                    <Badge 
                      bg="success" 
                      className="position-absolute bottom-0 end-0 rounded-circle p-2"
                      style={{ transform: 'translate(25%, 25%)' }}
                    >
                      <i data-feather="stethoscope" style={{ width: '12px', height: '12px' }} />
                    </Badge>
                  </div>
                </Col>
                <Col md={9}>
                  <h4 className="mb-2">{user?.name || 'Nom non renseigné'}</h4>
                  <p className="text-muted mb-2">
                    <i data-feather="mail" className="me-2" style={{ width: '16px', height: '16px' }} />
                    {user?.email || 'Email non renseigné'}
                  </p>
                  {user?.phone && (
                    <p className="text-muted mb-2">
                      <i data-feather="phone" className="me-2" style={{ width: '16px', height: '16px' }} />
                      {user.code_phone && `${user.code_phone} `}{user.phone}
                    </p>
                  )}
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <Badge bg="success" className="me-2">Conpte Vérifié</Badge>
                    {user?.gender && (
                      <Badge bg={getGenderBadge(user.gender)}>{user.gender}</Badge>
                    )}
                  </div>
                </Col>
              </Row>

              <hr className="my-4" />

              <Row>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Nom complet :</span>
                    <span className="fw-medium">{user?.name || 'Non renseigné'}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Email :</span>
                    <span className="fw-medium">{user?.email || 'Non renseigné'}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Date de naissance :</span>
                    <span className="fw-medium">{formatDate(user?.birthday)}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Genre :</span>
                    <span className="fw-medium">{user?.gender || 'Non renseigné'}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Indicatif pays :</span>
                    <span className="fw-medium">{user?.code_phone || 'Non renseigné'}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Téléphone :</span>
                    <span className="fw-medium">{user?.phone || 'Non renseigné'}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Membre depuis :</span>
                    <span className="fw-medium">{formatDate(user?.created_at)}</span>
                  </div>
                </Col>
                <Col md={6} className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Dernière mise à jour :</span>
                    <span className="fw-medium">{formatDate(user?.updated_at)}</span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Colonne latérale */}
        <Col lg={4}>
          {/* Actions rapides */}
          <Card className="border-0 shadow-sm mb-4">
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
                  to="/admin-systeme/edit/profil"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather="edit-2" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Modifier le profil
                </Button>
                <Button 
                  variant="outline-primary" 
                  as={Link} 
                  to="/admin-systeme/profil/securite"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather="shield" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Sécurité du compte
                </Button>
                <Button 
                  variant="outline-info" 
                  as={Link} 
                  to="/admin-systeme/dashboard"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i data-feather="grid" className="me-2" style={{ width: '18px', height: '18px' }} />
                  Retour au Dashboard
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Statistiques du compte */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="activity" className="me-2" style={{ width: '20px', height: '20px' }} />
                Activité professionnelle
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div className="text-primary mb-2">
                  <i data-feather="users" style={{ width: '32px', height: '32px' }} />
                </div>
                <h6 className="mb-0">Evolution du compte</h6>
                <h4 className="text-primary mb-0">
                    {user?.profil && user?.birthday && user?.phone && user?.gender ? '100%' : 
                     user?.name && user?.email && user?.gender ? '85%' : 
                     user?.name && user?.email ? '70%' : '50%'}
                </h4>
                <small className="text-muted">
                {user?.profil && user?.birthday && user?.phone && user?.gender ? 'Complété' : 
                     user?.name && user?.email && user?.gender ? 'En cours de progression' : 
                     user?.name && user?.email ? 'En attente' : 'En attente'}
                </small>
              </div>
              
              <hr className="my-3" />
              
              <div className="small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Profil complété :</span>
                  <span className="fw-bold text-success">
                    {user?.profil && user?.birthday && user?.phone && user?.gender ? '100%' : 
                     user?.name && user?.email && user?.gender ? '85%' : 
                     user?.name && user?.email ? '70%' : '50%'}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Dernière connexion :</span>
                  <span>{formatDate(user?.updated_at)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Type de compte :</span>
                  <Badge bg="success">Administrateur Systeme</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Informations professionnelles */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="border-0">
              <h5 className="mb-0 d-flex align-items-center">
                <i data-feather="award" className="me-2 text-success" style={{ width: '20px', height: '20px' }} />
                Informations professionnelles
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="small">
                <div className="d-flex align-items-start mb-3">
                  <i data-feather="check-circle" className="text-success me-2 mt-1" style={{ width: '16px', height: '16px' }} />
                  <div>
                    <div className="fw-medium">Compte vérifié</div>
                    <div className="text-muted">Identité confirmée</div>
                  </div>
                </div>
                <div className="d-flex align-items-start mb-3">
                  <i data-feather="clock" className="text-info me-2 mt-1" style={{ width: '16px', height: '16px' }} />
                  <div>
                    <div className="fw-medium">Disponibilité</div>
                    <div className="text-muted">Lun-Ven: 8h-18h</div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AdminSystemeLayout>
  );
}