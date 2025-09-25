import React, { useEffect, useState } from "react";
import { Navbar, Button, Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import feather from "feather-icons";

export default function AdminSystemeNavbar({ toggleSidebar }) {
  const { logout, user } = useAuth();
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
            <div className="user-avatar">
              {user?.profil_url ? (
                <img 
                  src={user.profil_url} 
                  alt={user.name || "Utilisateur"}
                  style={{
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
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
                  width: '32px',
                  height: '32px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}
              >
                {getInitials(user?.name)}
              </div>
            </div>
            <span className="user-name d-none d-sm-inline">
              {truncateName(user?.name || "Utilisateur")}
            </span>
            <i data-feather="chevron-down" style={{ width: '16px', height: '16px' }} />
          </Dropdown.Toggle>

          <Dropdown.Menu className={`dropdown-menu ${theme === "dark" ? "bg-dark border-secondary" : ""}`}>
            
            <div className="px-3 py-2 border-bottom">
              <div className="fw-semibold">{user?.name || "Utilisateur"}</div>
              <div className="text-muted small">{user?.email || "admin@Woop Service.com"}</div>
              <div className="text-primary small">Administrateur Système</div>
            </div>
            
            <Dropdown.Item 
              as={Link} 
              to="/admin-systeme/view/profil" 
              className={`dropdown-item ${theme === "dark" ? "text-light" : ""}`}
            >
              <i data-feather="user" className="me-2" style={{ width: '16px', height: '16px' }} />
              Mon Profil
            </Dropdown.Item>
            
            {/* <Dropdown.Item 
              as={Link} 
              to="/admin-systeme/view/compte" 
              className={`dropdown-item ${theme === "dark" ? "text-light" : ""}`}
            >
              <i data-feather="settings" className="me-2" style={{ width: '16px', height: '16px' }} />
              Gestion de compte
            </Dropdown.Item> */}
            
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