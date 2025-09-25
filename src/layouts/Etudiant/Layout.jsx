import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import EtudiantSidebar from "./SideBar";
import EtudiantNavbar from "./NavBar";
import feather from "feather-icons";
import '../../assets/theme.css';
import "../../assets/AdminSysteme/css/SideBar.css";
import "../../assets/AdminSysteme/css/NavBar.css";

export default function EtudiantLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [theme, setTheme] = useState("light");

  // Remplace les icônes feather au chargement et sur changement de route/sidebar
  useEffect(() => {
    feather.replace();
  }, [location.pathname, sidebarVisible, theme]);

  // Gère le thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-bs-theme", savedTheme);
    setTheme(savedTheme);
  }, []);

  // Détecte les changements de thème depuis le DOM
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute("data-theme") || "light";
      setTheme(newTheme);
      document.documentElement.setAttribute("data-bs-theme", newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Détection responsive
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarVisible(false); // auto close sidebar sur petit écran
      } else {
        setSidebarVisible(true);  // auto open sidebar sur grand écran
      }
    };

    handleResize(); // appel initial
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fermer la sidebar en cliquant sur un lien en mobile
  useEffect(() => {
    if (isMobile && sidebarVisible) {
      setSidebarVisible(false);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  return (
    <div className="d-flex min-vh-100">
      {/* Navbar fixe en haut */}
      <EtudiantNavbar toggleSidebar={toggleSidebar} />
      
      {/* Sidebar */}
      <EtudiantSidebar user={user} collapsed={!sidebarVisible} />
      
      {/* Overlay pour mobile */}
      {isMobile && sidebarVisible && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarVisible(false)}
        />
      )}
      
      {/* Contenu principal - Le padding-top est géré par le CSS */}
      <div className={`flex-grow-1 main-content ${!sidebarVisible ? "expanded" : ""}`}>
        {/* Zone de contenu avec padding approprié */}
        <main className="p-4">
          <div className="container-fluid py-2">
            <div className="py-4">
              <div className="py-4">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}