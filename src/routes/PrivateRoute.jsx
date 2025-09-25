import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Composant de chargement personnalisé (optionnel)
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div className="text-center">
      <div className="position-relative">
        <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
          <span className="visually-hidden">Chargement...</span>
        </div>
        <i className="fas fa-heartbeat position-absolute top-50 start-50 translate-middle text-primary" style={{ fontSize: '1.5rem' }}></i>
      </div>
      <h5 className="mt-3 text-primary">Institut de Formation</h5>
      <p className="text-muted">Vérification de votre session...</p>
    </div>
  </div>
);

export default function PublicRoute({ children, allowedRoles }) {
  const { user, initializing } = useAuth();

  // Afficher le spinner pendant l'initialisation
  if (initializing) {
    return <LoadingSpinner />;
  }

  // Pas connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si le rôle ne correspond pas, on redirige vers SON dashboard
  if (!allowedRoles.includes(user.role)) {
    const dashboards = {
        0: "/etudiant-espace-attente/dashboard",
        1: "/etudiant/dashboard",
        2: "/formateur/dashboard",
        3: "/admin-systeme/dashboard",
    };
    return <Navigate to={dashboards[user.role] || "/"} replace />;
  }

  return children;
}