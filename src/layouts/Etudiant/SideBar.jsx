import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";

export default function EtudiantSidebar({ user, collapsed }) {
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

  // Actualiser le compteur quand on change de page
  useEffect(() => {
    // Si on arrive sur la page du tchat, actualiser le compteur
    if (location.pathname === "/etudiant/view/tchat") {
      setTimeout(() => {
        fetchUnreadMessagesCount();
      }, 1000);
    }
  }, [location.pathname]);

  const menuSections = [
    {
      title: "Tableau de bord",
      items: [
        { label: "Dashboard", icon: "home", path: "/etudiant/dashboard" },
        { label: "Statistiques", icon: "bar-chart-2", path: "/etudiant/statistics" },
      ]
    },
    {
      title: "Gestion du contenu",
      items: [
        { label: "Matières", icon: "book", path: "/etudiant/view/my-matieres" },
        { label: "Cours", icon: "play-circle", path: "/etudiant/view/my-cours" },
      ]
    },
    {
      title: "Planification et suivi des évaluations",
      items: [
        { label: "Calendrier", icon: "calendar", path: "/etudiant/view/calendar" },
        { label: "Évaluations", icon: "file-text", path: "/etudiant/view/evaluations/my-classroom" },
        { label: "Resultats", icon: "bar-chart-2", path: "/etudiant/view/my-resultats-evaluations" },
      ]
    },
    {
      title: "Communication",
      items: [
        { 
          label: "Tchat", 
          icon: "message-circle", 
          path: "/etudiant/view/tchat",
          badge: unreadMessagesCount > 0 ? unreadMessagesCount.toString() : null,
          badgeColor: unreadMessagesCount > 0 ? "bg-primary text-white" : null
        },
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
                      <span className={`sidebar-nav-badge ${item.badgeColor || 'bg-primary text-white'}`}>
                        {item.badge}
                      </span>
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