import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";

export default function AdminSystemeSidebar({ user, collapsed }) {
  const location = useLocation();
  const [theme, setTheme] = useState("light");
  const [notificationCount, setNotificationCount] = useState(0);
  const [invitationCount, setInvitationCount] = useState(0);
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

  // Fonction pour récupérer le nombre de notifications non lues
  const fetchNotificationCount = async () => {
    try {
      const res = await api.get("/formateur/notifications/unread-count");
      setNotificationCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Erreur lors de la récupération du compteur de notifications", err);
    }
  };

  // Fonction pour récupérer le nombre d'invitations en attente
  const fetchInvitationCount = async () => {
    try {
      const res = await api.get("/formateur/view/invitations", { 
        params: { status: null } 
      });
      // Compter les invitations en attente
      const pendingInvitations = res.data.invitations?.filter(
        invitation => invitation.status !== "Acceptée"
      ) || [];
      setInvitationCount(pendingInvitations.length);
    } catch (err) {
      console.error("Erreur lors de la récupération du compteur d'invitations", err);
    }
  };

  // Fonction pour récupérer le nombre de messages non lus
  const fetchUnreadMessagesCount = async () => {
    try {
      const res = await api.get("/formateur/chat/unread-count");
      setUnreadMessagesCount(res.data.unread_messages_count || 0);
    } catch (err) {
      console.error("Erreur lors de la récupération du compteur de messages", err);
    }
  };

  // Charger les compteurs au montage et les actualiser périodiquement
  useEffect(() => {
    fetchNotificationCount();
    fetchInvitationCount();
    fetchUnreadMessagesCount();

    // Actualiser les compteurs toutes les 30 secondes
    const interval = setInterval(() => {
      fetchNotificationCount();
      fetchInvitationCount();
      fetchUnreadMessagesCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Actualiser le compteur quand on change de page
  useEffect(() => {
    // Si on arrive sur la page des notifications, actualiser le compteur
    if (location.pathname === "/formateur/view/notifications") {
      setTimeout(() => {
        fetchNotificationCount();
      }, 1000);
    }
    // Si on arrive sur la page des invitations, actualiser le compteur
    if (location.pathname === "/formateur/view/invitations") {
      setTimeout(() => {
        fetchInvitationCount();
      }, 1000);
    }
    // Si on arrive sur la page du tchat, actualiser le compteur
    if (location.pathname === "/formateur/view/tchat") {
      setTimeout(() => {
        fetchUnreadMessagesCount();
      }, 1000);
    }
  }, [location.pathname]);

  const menuSections = [
    {
      title: "Tableau de bord",
      items: [
        { label: "Dashboard", icon: "home", path: "/formateur/dashboard" },
        { label: "Statistiques", icon: "bar-chart-2", path: "/formateur/statistics" },
      ]
    },
    {
      title: "Gestion des utilisateurs",
      items: [
        { label: "Étudiants", icon: "users", path: "/formateur/view/etudiants" },
        { 
          label: "Étudiants en Espace Attente", 
          icon: "users", 
          color: "text-warning", 
          badge: "⏱", 
          badgeColor: "bg-warning text-dark", 
          path: "/formateur/view/etudiants-espace-attente" 
        },
        { label: "Administrateurs", icon: "user-check", path: "/formateur/view/formateurs" },
      ]
    },
    {
      title: "Administration",
      items: [
        { label: "Classes/Groupes", icon: "layers", path: "/formateur/view/classrooms" },
        { label: "Matières", icon: "book", path: "/formateur/view/matieres" },
        { label: "Calendrier", icon: "calendar", path: "/formateur/view/calendar" },
      ]
    },
    {
      title: "Gestion du contenu",
      items: [
        { label: "Cours", icon: "play-circle", path: "/formateur/view/cours" },
        { label: "Évaluations", icon: "file-text", path: "/formateur/view/evaluations" },
        { label: "Questions", icon: "help-circle", path: "/formateur/view/questions" },
        { label: "Resultats", icon: "bar-chart-2", path: "/formateur/view/answers/results" },
      ]
    },
    {
      title: "Communication",
      items: [
        { 
          label: "Tchat", 
          icon: "message-circle", 
          path: "/formateur/view/tchat",
          badge: unreadMessagesCount > 0 ? unreadMessagesCount.toString() : null,
          badgeColor: unreadMessagesCount > 0 ? "bg-primary text-white" : null
        },
        { 
          label: "Invitations", 
          icon: "mail", 
          path: "/formateur/view/invitations", 
          badge: invitationCount > 0 ? invitationCount.toString() : null,
          badgeColor: invitationCount > 0 ? "bg-info text-white" : null
        },
        { 
          label: "Notifications", 
          icon: "bell", 
          path: "/formateur/view/notifications",
          badge: notificationCount > 0 ? notificationCount.toString() : null,
          badgeColor: notificationCount > 0 ? "bg-danger text-white" : null
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