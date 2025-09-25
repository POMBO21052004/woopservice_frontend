import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import feather from "feather-icons";

export default function NotFound() {
  useEffect(() => {
    feather.replace(); // Initialise les icônes Feather
  }, []);

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center px-3">
      {/* Icône Feather */}
      <div className="mb-4">
        <i
          data-feather="alert-triangle"
          style={{ width: "64px", height: "64px", color: "#dc3545" }}
        ></i>
      </div>

      {/* Titre et message */}
      <h1 className="display-4 fw-bold text-danger">404</h1>
      <h3 className="mb-2">Page introuvable</h3>
      <p className="text-muted mb-4">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>

      {/* Bouton de retour */}
      <Link to="/" className="btn btn-primary px-4 py-2">
        Retour à l'accueil
      </Link>
    </div>
  );
}
