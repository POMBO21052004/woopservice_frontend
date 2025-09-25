import React, { useEffect, useState } from "react";
import { Navbar, Button, Dropdown, Badge } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import feather from "feather-icons";
import api from "../../services/api";

export default function EtudiantNavbar({ toggleSidebar }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState("light");
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Détecte le thème au montage et sur changement du DOM
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

  // Fonction pour récupérer le nombre de messages non lus
  const fetchUnreadMessagesCount = async () => {
    try {
      const res = await api.get("/etudiant/chat/unread-count");
      setUnreadMessagesCount(res.data.unread_messages_count || 0);
    } catch (err) {
      console.error("Erreur lors de la récupération du compteur de messages", err);
    }
  };

  // Charger les compteurs au montage et les actualiser périodiquement
  useEffect(() => {
    fetchUnreadMessagesCount();

    // Actualiser les compteurs toutes les 30 secondes
    const interval = setInterval(() => {
      fetchUnreadMessagesCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Actualiser les compteurs quand on change de page
  useEffect(() => {
    if (location.pathname === "/etudiant/view/tchat") {
      setTimeout(() => {
        fetchUnreadMessagesCount();
      }, 1000);
    }
  }, [location.pathname]);

  // Écouter les événements de mise à jour des messages
  useEffect(() => {
    const handleMessagesUpdate = () => {
      fetchUnreadMessagesCount();
    };

    window.addEventListener('messagesRead', handleMessagesUpdate);
    window.addEventListener('messageSent', handleMessagesUpdate);

    return () => {
      window.removeEventListener('messagesRead', handleMessagesUpdate);
      window.removeEventListener('messageSent', handleMessagesUpdate);
    };
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newTheme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Fonction pour obtenir les initiales (fallback si pas d'image)
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Fonction pour tronquer le nom
  const truncateName = (name, maxLength = 15) => {
    if (!name) return "";
    return name.length > maxLength ? name.slice(0, maxLength - 3) + "..." : name;
  };

  useEffect(() => {
    feather.replace();
  }, [theme, unreadMessagesCount]);

  // Gestionnaire de clic pour le toggle avec vérification
  const handleToggleSidebar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Toggle sidebar clicked"); // Debug
    if (typeof toggleSidebar === 'function') {
      toggleSidebar();
    } else {
      console.warn("toggleSidebar function not provided or not a function");
    }
  };

  // Composant réutilisable pour l'avatar utilisateur
  const UserAvatar = ({ size = 32, showBorder = true }) => (
    <div className="user-avatar" style={{ position: 'relative' }}>
      {user?.profil_url ? (
        <img 
          src={user.profil_url} 
          alt={user.name || "Utilisateur"}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            objectFit: 'cover',
            border: showBorder ? '2px solid rgba(255, 255, 255, 0.3)' : 'none'
          }}
          onError={(e) => {
            // Si l'image ne charge pas, afficher les initiales
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        style={{
          display: user?.profil_url ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${size}px`,
          height: `${size}px`,
          fontSize: size > 40 ? '1.1rem' : '0.75rem',
          fontWeight: '600',
          backgroundColor: theme === 'dark' ? '#495057' : '#6c757d',
          color: 'white',
          borderRadius: '50%'
        }}
      >
        {getInitials(user?.name)}
      </div>
    </div>
  );

  return (
    <Navbar className="navbar fixed-top" expand={false}>
      {/* Partie gauche - Logo et bouton toggle */}
      <div className="navbar-left">
        <Button 
          variant="link" 
          onClick={handleToggleSidebar}
          className="toggle-btn me-3"
          title="Toggle Sidebar"
          style={{
            display: 'flex !important',
            visibility: 'visible !important',
            opacity: '1 !important',
            position: 'relative',
            zIndex: 1031,
            border: 'none',
            background: 'transparent',
            padding: '8px 12px',
            borderRadius: '10px',
            minWidth: '44px',
            minHeight: '44px',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i 
            data-feather="menu" 
            style={{ 
              width: '20px', 
              height: '20px',
              strokeWidth: '2.5'
            }} 
          />
        </Button>
        
        <div className="logo-container">
          <div className="logo">
            <span>WS</span>
          </div>
          <Navbar.Brand className="navbar-brand mb-0">
            Woop Service
          </Navbar.Brand>
        </div>
      </div>

      {/* Partie droite - Actions utilisateur */}
      <div className="navbar-right">
        {/* Bouton Messages avec compteur */}
        <div className="position-relative me-3">
          <Button 
            variant="link" 
            as={Link}
            to="/etudiant/view/tchat"
            className="navbar-action-btn"
            title={`Messages (${unreadMessagesCount} non lus)`}
            style={{
              position: 'relative',
              border: 'none',
              background: 'transparent',
              padding: '8px 12px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme === 'dark' ? '#fff' : '#000',
              transition: 'all 0.2s ease'
            }}
          >
            <i data-feather="message-circle" style={{ width: '20px', height: '20px' }} />
            {unreadMessagesCount > 0 && (
              <Badge 
                bg="primary" 
                pill 
                className="position-absolute"
                style={{
                  top: '2px',
                  right: '2px',
                  fontSize: '0.65em',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </Badge>
            )}
          </Button>
        </div>

        <Button 
          variant="link" 
          onClick={toggleTheme} 
          className="theme-toggle me-3"
          title={`Passer au thème ${theme === "dark" ? "clair" : "sombre"}`}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '8px 12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme === 'dark' ? '#fff' : '#000'
          }}
        >
          <i data-feather={theme === "dark" ? "sun" : "moon"} style={{ width: '20px', height: '20px' }} />
        </Button>

        <Dropdown align="end" className="user-dropdown" onToggle={(isOpen) => {
          if (isOpen) {
            // Remplace les icônes quand le dropdown s'ouvre
            setTimeout(() => feather.replace(), 0);
          }
        }}>
          <Dropdown.Toggle 
            variant="primary" 
            id="dropdown-user" 
            className="dropdown-toggle"
          >
            <UserAvatar size={32} showBorder={true} />
            <span className="user-name d-none d-sm-inline">
              {truncateName(user?.name || "Utilisateur")}
            </span>
            <i data-feather="chevron-down" style={{ width: '16px', height: '16px' }} />
          </Dropdown.Toggle>

          <Dropdown.Menu className={`dropdown-menu ${theme === "dark" ? "bg-dark border-secondary" : ""}`}>
            
            <div className="px-3 py-2 border-bottom d-flex align-items-center">
              <div className="me-3">
                <UserAvatar size={48} showBorder={false} />
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold">{user?.name || "Utilisateur"}</div>
                <div className="text-muted small">{user?.email || "etudiant@woopservice.com"}</div>
                <div className="text-primary small">Étudiant</div>
              </div>
            </div>
            
            <Dropdown.Item 
              as={Link} 
              to="/etudiant/view/profil" 
              className={`dropdown-item ${theme === "dark" ? "text-light" : ""}`}
            >
              <i data-feather="user" className="me-2" style={{ width: '16px', height: '16px' }} />
              Mon Profil
            </Dropdown.Item>
            
            <Dropdown.Item 
              as={Link} 
              to="/etudiant/view/statistics/my-classroom" 
              className={`dropdown-item ${theme === "dark" ? "text-light" : ""}`}
            >
              <i data-feather="book" className="me-2" style={{ width: '16px', height: '16px' }} />
              Ma salle de classe
            </Dropdown.Item>
            
            <Dropdown.Divider className={theme === "dark" ? "border-secondary" : ""} />
            
            {/* Section rapide avec compteur messages */}
            <div className="px-3 py-2 border-bottom">
              <div className="small text-muted mb-2">Accès rapide</div>
              <div className="d-flex gap-2">
                <Button 
                  as={Link} 
                  to="/etudiant/view/tchat"
                  variant="outline-primary" 
                  size="sm" 
                  className="position-relative flex-fill"
                >
                  <i data-feather="message-circle" className="me-1" style={{ width: '12px', height: '12px' }} />
                  Messages
                  {unreadMessagesCount > 0 && (
                    <Badge bg="primary" pill className="ms-1" style={{ fontSize: '0.6em' }}>
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
            
            <Dropdown.Divider className={theme === "dark" ? "border-secondary" : ""} />
            
            <Dropdown.Item 
              onClick={handleLogout} 
              className="dropdown-item text-danger"
            >
              <i data-feather="log-out" className="me-2" style={{ width: '16px', height: '16px' }} />
              Déconnexion
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </Navbar>
  );
}