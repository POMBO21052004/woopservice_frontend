import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function AdminSystemeSidebar({ user, collapsed }) {
  const location = useLocation();
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

  // Menu organisé par sections pour une plateforme éducative
  const menuSections = [
    {
      title: "Tableau de bord",
      items: [
        { label: "Dashboard", icon: "grid", path: "/admin-systeme/dashboard" },
        { label: "Statistiques", icon: "bar-chart-2", path: "/admin-systeme/statistics" },
      ]
    },
    {
      title: "Gestion des utilisateurs",     
      items: [
        { label: "Étudiants", icon: "users", path: "/admin-systeme/view/etudiants" },
        { label: "Étudiants en Espace Attente", icon: "users", color: "text-warning", badge: "⏱", badgeColor: "bg-warning text-dark", path: "/admin-systeme/view/etudiants-espace-attente" },
        { label: "Formateurs", icon: "user-check", path: "/admin-systeme/view/formateur" },
      ]
    },
    {
      title: "Administration",
      items: [
        { label: "Administrateurs", icon: "shield", path: "/admin-systeme/view/admin-systeme" },
        { label: "Invitations", icon: "mail", path: "/admin-systeme/view/invitations", 
          badge: "3" 
        },
      ]
    },
    {
      title: "Outils & Communication",
      items: [
        { label: "Notifications", icon: "bell", path: "/admin-systeme/view/notifications" },
        { label: "Logs système", icon: "activity", path: "/admin-systeme/view/logs" },
        { label: "Support Technique", icon: "help-circle", path: "/admin-systeme/view/support-technique" },
      ]
    },
  ];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : "" }  ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}>
      {/* Header avec logo et informations */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span>WS</span>
          </div>
          <div className="sidebar-logo-text">
            <h6 className="sidebar-logo-title">Woop Service</h6>
            <p className="sidebar-logo-subtitle">Plateforme Éducative</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="sidebar-nav-section">
            <h6 className="sidebar-nav-section-title">{section.title}</h6>
            <ul className="list-unstyled mb-0">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="sidebar-nav-item">
                  <Link
                    to={item.path}
                    className={`sidebar-nav-link ${
                      location.pathname.startsWith(item.path) ? "active" : ""
                    }`}
                  >
                    <i 
                      data-feather={item.icon} 
                      className="sidebar-nav-icon"
                    />
                    <span className="sidebar-nav-text">{item.label}</span>
                    {item.badge && (
                      <span className="sidebar-nav-badge">{item.badge}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}