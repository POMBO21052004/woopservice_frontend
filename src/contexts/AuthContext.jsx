import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true); // Nouvel état pour l'initialisation

  const login = async (userData, authToken) => {
    if (authToken) {
      setToken(authToken);
      localStorage.setItem("token", authToken);
      
      // Récupérer les infos utilisateur après avoir défini le token
      try {
        const response = await api.get("/me");
        setUser(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur après connexion :", error);
        // En cas d'erreur, on peut utiliser les données reçues en paramètre comme fallback
        if (userData) {
          setUser(userData);
        }
      }
    } else {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    }
  };

  const logout = async () => {
    try {
      // Appel API à Laravel pour se déconnecter
      if (token) {
        await api.post("/logout");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    } finally {
      // Nettoyage local
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    }
  };

  // Fonction pour récupérer les infos utilisateur depuis l'API
  const fetchUser = async (storedToken = null) => {
    const tokenToUse = storedToken || token;
    
    if (!tokenToUse) {
      setUser(null);
      setInitializing(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/me");
      setUser(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur :", error);
      
      // Si le token est invalide, on déconnecte l'utilisateur
      if (error.response?.status === 401) {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  // Fonction pour rafraîchir les données utilisateur
  const refreshUser = () => {
    fetchUser();
  };

  // Initialisation au chargement de l'application
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      
      if (storedToken) {
        setToken(storedToken);
        // Vérifier immédiatement le token
        await fetchUser(storedToken);
      } else {
        setInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      initializing, // Exposer l'état d'initialisation
      login, 
      logout, 
      refreshUser,
      fetchUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);