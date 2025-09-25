import React, { useEffect, useState } from "react";
import { Navbar, Button, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import feather from "feather-icons";
import { Link } from "react-router-dom";

export default function WaitingAreaNavbar({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");

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
  }, [theme]);

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
    <Navbar className="waiting-area-navbar fixed-top" expand={false}>
      {/* Partie gauche - Logo uniquement */}
      <div className="waiting-area-navbar-left">
        <div className="logo-container">
          <div className="logo">
            <span>WS</span>
          </div>
          <Navbar.Brand className="navbar-brand mb-0">
            Woop Service
          </Navbar.Brand>
        </div>
        
        {/* Badge de statut en attente */}
        <div className="waiting-status-badge">
          <i data-feather="clock" style={{ width: '16px', height: '16px' }} />
          <span>En attente d'approbation</span>
        </div>
      </div>

      {/* Partie droite - Actions utilisateur */}
      <div className="waiting-area-navbar-right">
        <Button 
          variant="link" 
          onClick={toggleTheme} 
          className="theme-toggle me-3"
          title={`Passer au thème ${theme === "dark" ? "clair" : "sombre"}`}
        >
          <i data-feather={theme === "dark" ? "sun" : "moon"} />
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
                <div className="text-warning small d-flex align-items-center">
                  <i data-feather="clock" style={{ width: '12px', height: '12px' }} className="me-1" />
                  En attente
                </div>
              </div>
            </div>

            <Dropdown.Item 
              as={Link} 
              to="/etudiant-espace-attente/view/profil" 
              className={`dropdown-item ${theme === "dark" ? "text-light" : ""}`}
            >
              <i data-feather="user" className="me-2" style={{ width: '16px', height: '16px' }} />
              Mon Profil
            </Dropdown.Item>
            
            <Dropdown.Item 
              className="dropdown-item d-flex align-items-center justify-content-between"
              style={{ cursor: 'default' }}
            >
              <span className="d-flex align-items-center">
                <i data-feather="info" className="me-2" style={{ width: '16px', height: '16px' }} />
                Statut du compte
              </span>
              <span className="badge bg-warning text-dark">Pending</span>
            </Dropdown.Item>
            
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