import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import WaitingAreaNavbar from "./NavBar";
import feather from "feather-icons";
import '../../assets/theme.css';
import "../../assets/ZoneAttente/NavBar.css";

export default function WaitingAreaLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const [theme, setTheme] = useState("light");

  // Remplace les icônes feather au chargement et sur changement de route
  useEffect(() => {
    feather.replace();
  }, [location.pathname, theme]);

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

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar fixe en haut */}
      <WaitingAreaNavbar user={user} />
      
      {/* Contenu principal - padding-top pour compenser la navbar fixe */}
      <div className="flex-grow-1 waiting-area-content">
        {/* Zone de contenu avec padding approprié */}
        <main className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="waiting-area-main-content">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}