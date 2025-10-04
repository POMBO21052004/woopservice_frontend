import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Composant de chargement
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div className="text-center">
      <div className="position-relative">
        <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
      <h5 className="mt-3 text-primary">Woop Service</h5>
      <p className="text-muted">Chargement de la page...</p>
    </div>
  </div>
);

// Composants chargés immédiatement (critiques)
import NotFound from "../pages/NotFound";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

// Pages publiques - Lazy load
const Welcome = lazy(() => import("../pages/Welcome"));
const Register = lazy(() => import("../pages/Auth/Register"));
const Login = lazy(() => import("../pages/Auth/Login"));
const InvitationRegister = lazy(() => import("../pages/Auth/InvitationRegister"));
const ForgotPassword = lazy(() => import("../pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/Auth/ResetPassword"));

// Etudiant en espace d'attente - Lazy load
const EtudiantEspaceAttenteDashboard = lazy(() => import("../pages/EtudiantEspaceAttente/Dashboard"));
const ProfilEtudiantEnAttente = lazy(() => import("../pages/EtudiantEspaceAttente/Profil"));
const ProfilEditEtudiantEnattente = lazy(() => import("../pages/EtudiantEspaceAttente/EditProfil"));

// Etudiant - Lazy load
const EtudiantDashboard = lazy(() => import("../pages/Etudiant/Dashboard"));
const StatistiquesEtudiant = lazy(() => import("../pages/Etudiant/Statistics"));
const ClassroomStats = lazy(() => import("../pages/Etudiant/ClassroomStats"));
const ProfilEtudiant = lazy(() => import("../pages/Etudiant/Profil"));
const ProfilEditEtudiant = lazy(() => import("../pages/Etudiant/EditProfil"));
const CalendrierEtudiant = lazy(() => import("../pages/Etudiant/CalendrierEtudiant"));
const CoursParClassroomEtudiant = lazy(() => import("../pages/Etudiant/Cours"));
const CoursShowEtudiant = lazy(() => import("../pages/Etudiant/CourShow"));
const MatieresEtudiant = lazy(() => import("../pages/Etudiant/Matieres"));
const MatiereShowEtudiant = lazy(() => import("../pages/Etudiant/MatiereShow"));
const EvaluationsEtudiant = lazy(() => import("../pages/Etudiant/Evaluation"));
const EvaluationStart = lazy(() => import("../pages/Etudiant/EvaluationStart"));
const EvaluationDetails = lazy(() => import("../pages/Etudiant/EvaluationDetails"));
const MesResultatsEtudiant = lazy(() => import("../pages/Etudiant/MesResultats"));
const ChatEtudiant = lazy(() => import("../pages/Etudiant/TchatEtudiant"));

// Formateur - Lazy load
const DashboardFormateur = lazy(() => import("../pages/Formateur/Dashboard"));
const StatisticsFormateur = lazy(() => import("../pages/Formateur/Statistics"));
const ProfilFormateur = lazy(() => import("../pages/Formateur/Profil"));
const ProfilEditFormateur = lazy(() => import("../pages/Formateur/EditProfil"));
const ViewEtudiantsByFormateurs = lazy(() => import("../pages/Formateur/Etudiant"));
const EtudiantShowByFormateurs = lazy(() => import("../pages/Formateur/EtudiantShow"));
const EtudiantEditByFormateurs = lazy(() => import("../pages/Formateur/EtudiantEdit"));
const ViewEtudiantsZoneAttenteByFormateurs = lazy(() => import("../pages/Formateur/EtudiantZoneAttente"));
const ShowEtudiantsZoneAttenteByFormateurs = lazy(() => import("../pages/Formateur/EtudiantZoneAttenteShow"));
const EditEtudiantsZoneAttenteByFormateurs = lazy(() => import("../pages/Formateur/EtudiantZoneAttenteEdit"));
const ViewFormateursByFormateurs = lazy(() => import("../pages/Formateur/Formateur"));
const FormateurShowByFormateurs = lazy(() => import("../pages/Formateur/FormateurShow"));
const FormateurEditByFormateurs = lazy(() => import("../pages/Formateur/FormateurEdit"));
const ClassroomManagement = lazy(() => import("../pages/Formateur/Classroom"));
const ClassroomShow = lazy(() => import("../pages/Formateur/ClassroomShow"));
const ClassroomEdit = lazy(() => import("../pages/Formateur/ClassroomEdit"));
const ClassroomUsers = lazy(() => import("../pages/Formateur/ClassroomUsers"));
const ClassroomUserProfile = lazy(() => import("../pages/Formateur/ClassroomUsersShow"));
const MatiereManagement = lazy(() => import("../pages/Formateur/Matiere"));
const MatiereByClassroom = lazy(() => import('../pages/Formateur/MatiereByClassroom'));
const MatiereEdit = lazy(() => import("../pages/Formateur/MatiereEdit"));
const MatiereShow = lazy(() => import("../pages/Formateur/MatieresShow"));
const CoursManagement = lazy(() => import("../pages/Formateur/Cour"));
const CoursParMatiere = lazy(() => import("../pages/Formateur/CourByMatiere"));
const CoursShow = lazy(() => import("../pages/Formateur/CourShow"));
const CoursEdit = lazy(() => import("../pages/Formateur/CourEdit"));
const CoursParClassroom = lazy(() => import("../pages/Formateur/CoursParClassroom"));
const EvaluationManagement = lazy(() => import("../pages/Formateur/Evaluation"));
const EvaluationEdit = lazy(() => import("../pages/Formateur/EvaluationEdit"));
const EvaluationShow = lazy(() => import("../pages/Formateur/EvaluationShow"));
const EvaluationQuestions = lazy(() => import("../pages/Formateur/EvaluationQuestions"));
const EvaluationResultats = lazy(() => import("../pages/Formateur/EvaluationResultats"));
const EvaluationDashboard = lazy(() => import("../pages/Formateur/EvaluationDashboard"));
const QuestionManagement = lazy(() => import("../pages/Formateur/Question"));
const ShowQuestion = lazy(() => import("../pages/Formateur/QuestionShow"));
const EditQuestion = lazy(() => import("../pages/Formateur/QuestionEdit"));
const QuestionsByEvaluation = lazy(() => import("../pages/Formateur/QuestionsByEvaluation"));
const CreateQuestion = lazy(() => import("../pages/Formateur/QuestionCreate"));
const QuestionStatistics = lazy(() => import("../pages/Formateur/QuestionStatistics"));
const ReponsesEtudiantEvaluation = lazy(() => import("../pages/Formateur/ResultatsByEtudiantByEvaluation"));
const ResultatsGeneral = lazy(() => import("../pages/Formateur/Resultats"));
const StatistiquesAvanceesResultats = lazy(() => import("../pages/Formateur/ResultatsStatistics"));
const ResultatsEvaluationEtudiants = lazy(() => import("../pages/Formateur/ResultatsByEvaluationByEtudiants"));
const ChatFormateur = lazy(() => import("../pages/Formateur/TchatFormateur"));
const CalendrierActivites = lazy(() => import("../pages/Formateur/CalendrierFormateur"));
const InvitationByFormateur = lazy(() => import("../pages/Formateur/Invitation"));
const NotificationsByFormateur = lazy(() => import("../pages/Formateur/Notification"));

// Admin Système - Lazy load
const DashboardAdminSysteme = lazy(() => import("../pages/AdminSysteme/Dashboard"));
const Statistics = lazy(() => import("../pages/AdminSysteme/Statistics"));
const ProfilAdminSysteme = lazy(() => import("../pages/AdminSysteme/Profil"));
const ProfilEditAdminSysteme = lazy(() => import("../pages/AdminSysteme/EditProfil"));
const ViewAdminSysteme = lazy(() => import("../pages/AdminSysteme/AdminSysteme"));
const ShowAdminSysteme = lazy(() => import("../pages/AdminSysteme/AdminSystemeShow"));
const EditAdminSysteme = lazy(() => import("../pages/AdminSysteme/AdminSystemeEdit"));
const ViewFormateurs = lazy(() => import("../pages/AdminSysteme/Formateur"));
const ShowFormateur = lazy(() => import("../pages/AdminSysteme/FormateurShow"));
const EditFormateur = lazy(() => import("../pages/AdminSysteme/FormateurEdit"));
const ViewEtudiants = lazy(() => import("../pages/AdminSysteme/Etudiant"));
const EtudiantShow = lazy(() => import("../pages/AdminSysteme/EtudiantShow"));
const EtudiantEdit = lazy(() => import("../pages/AdminSysteme/EtudiantEdit"));
const ViewEtudiantsEspaceAttente = lazy(() => import("../pages/AdminSysteme/EtudiantZoneAttente"));
const EditEtudiantsZoneAttente = lazy(() => import("../pages/AdminSysteme/EtudiantZoneAttenteEdit"));
const ShowEtudiantsZoneAttente = lazy(() => import("../pages/AdminSysteme/EtudiantZoneAttenteShow"));
const Invitation = lazy(() => import("../pages/AdminSysteme/Invitation"));
const AdminSystemeNotifications = lazy(() => import("../pages/AdminSysteme/Notification"));
const SupportTechnique = lazy(() => import("../pages/AdminSysteme/SupportTechnique"));
const Logs = lazy(() => import("../pages/AdminSysteme/Logs"));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
          
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/invitation-register" element={<PublicRoute><InvitationRegister /></PublicRoute>} />

          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          {/* Etudiant en espace d'attente */}
          <Route path="/etudiant-espace-attente/dashboard" element={<PrivateRoute allowedRoles={[0]}><EtudiantEspaceAttenteDashboard /></PrivateRoute>} />
          <Route path="/etudiant-espace-attente/view/profil" element={<PrivateRoute allowedRoles={[0]}><ProfilEtudiantEnAttente /></PrivateRoute>} />
          <Route path="/etudiant-espace-attente/edit/profil" element={<PrivateRoute allowedRoles={[0]}><ProfilEditEtudiantEnattente /></PrivateRoute>} />
          
          {/* Etudiant */}
          <Route path="/etudiant/dashboard" element={<PrivateRoute allowedRoles={[1]}><EtudiantDashboard /></PrivateRoute>} />
          <Route path="/etudiant/statistics" element={<PrivateRoute allowedRoles={[1]}><StatistiquesEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/view/profil" element={<PrivateRoute allowedRoles={[1]}><ProfilEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/edit/profil" element={<PrivateRoute allowedRoles={[1]}><ProfilEditEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/view/statistics/my-classroom" element={<PrivateRoute allowedRoles={[1]}><ClassroomStats /></PrivateRoute>} />
          <Route path="/etudiant/view/my-cours" element={<PrivateRoute allowedRoles={[1]}><CoursParClassroomEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/show/cours/:id" element={<PrivateRoute allowedRoles={[1]}><CoursShowEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/view/my-matieres" element={<PrivateRoute allowedRoles={[1]}><MatieresEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/show/matiere/:id" element={<PrivateRoute allowedRoles={[1]}><MatiereShowEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/view/evaluations/my-classroom" element={<PrivateRoute allowedRoles={[1]}><EvaluationsEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/evaluation/:id/start" element={<PrivateRoute allowedRoles={[1]}><EvaluationStart /></PrivateRoute>} />
          <Route path="/etudiant/evaluation/:id/details" element={<PrivateRoute allowedRoles={[1]}><EvaluationDetails /></PrivateRoute>} />
          <Route path="/etudiant/view/my-resultats-evaluations" element={<PrivateRoute allowedRoles={[1]}><MesResultatsEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/view/calendar" element={<PrivateRoute allowedRoles={[1]}><CalendrierEtudiant /></PrivateRoute>} />
          <Route path="/etudiant/view/tchat" element={<PrivateRoute allowedRoles={[1]}><ChatEtudiant /></PrivateRoute>} />

          {/* Formateur */}
          <Route path="/formateur/dashboard" element={<PrivateRoute allowedRoles={[2]}><DashboardFormateur /></PrivateRoute>} />
          <Route path="/formateur/statistics" element={<PrivateRoute allowedRoles={[2]}><StatisticsFormateur /></PrivateRoute>} />
          <Route path="/formateur/view/profil" element={<PrivateRoute allowedRoles={[2]}><ProfilFormateur /></PrivateRoute>} />
          <Route path="/formateur/edit/profil" element={<PrivateRoute allowedRoles={[2]}><ProfilEditFormateur /></PrivateRoute>} />
          <Route path="/formateur/view/etudiants" element={<PrivateRoute allowedRoles={[2]}><ViewEtudiantsByFormateurs /></PrivateRoute>} />
          <Route path="/formateur/show/etudiant/:id" element={<PrivateRoute allowedRoles={[2]}><EtudiantShowByFormateurs /></PrivateRoute>} />
          <Route path="/formateur/edit/etudiant/:id" element={<PrivateRoute allowedRoles={[2]}><EtudiantEditByFormateurs /></PrivateRoute>} />
          <Route path="/formateur/view/etudiants-espace-attente" element={<PrivateRoute allowedRoles={[2]}><ViewEtudiantsZoneAttenteByFormateurs /></PrivateRoute>} />
          <Route path="/formateur/show/etudiant-espace-attente/:id" element={<PrivateRoute allowedRoles={[2]}><ShowEtudiantsZoneAttenteByFormateurs /></PrivateRoute>} />
          <Route path="/formateur/edit/etudiant-espace-attente/:id" element={<PrivateRoute allowedRoles={[2]}><EditEtudiantsZoneAttenteByFormateurs /></PrivateRoute>} />
          <Route path="/formateur/view/formateurs" element={<PrivateRoute allowedRoles={[2]}><ViewFormateursByFormateurs /></PrivateRoute>} />
          <Route path="/formateur/show/formateur/:id" element={<PrivateRoute allowedRoles={[2]}><FormateurShowByFormateurs /></PrivateRoute>} />
          <Route path="/formateur/edit/formateur/:id" element={<PrivateRoute allowedRoles={[2]}><FormateurEditByFormateurs /></PrivateRoute>} />
          <Route path="/formateur/view/classrooms" element={<PrivateRoute allowedRoles={[2]}><ClassroomManagement /></PrivateRoute>} />
          <Route path="/formateur/view/classroom/:id/users" element={<PrivateRoute allowedRoles={[2]}><ClassroomUsers /></PrivateRoute>} />
          <Route path="/formateur/view/classroom/user/:id" element={<PrivateRoute allowedRoles={[2]}><ClassroomUserProfile /></PrivateRoute>} />
          <Route path="/formateur/show/classroom/:id" element={<PrivateRoute allowedRoles={[2]}><ClassroomShow /></PrivateRoute>} />
          <Route path="/formateur/classroom/:id/edit" element={<PrivateRoute allowedRoles={[2]}><ClassroomEdit /></PrivateRoute>} />
          <Route path="/formateur/view/matieres" element={<PrivateRoute allowedRoles={[2]}><MatiereManagement /></PrivateRoute>} />
          <Route path="/formateur/matiere/by-classroom/:matricule_classroom" element={<PrivateRoute allowedRoles={[2]}><MatiereByClassroom /></PrivateRoute>} />
          <Route path="/formateur/show/matiere/:id" element={<PrivateRoute allowedRoles={[2]}><MatiereShow /></PrivateRoute>} />
          <Route path="/formateur/edit/matiere/:id" element={<PrivateRoute allowedRoles={[2]}><MatiereEdit /></PrivateRoute>} />
          <Route path="/formateur/view/cours" element={<PrivateRoute allowedRoles={[2]}><CoursManagement /></PrivateRoute>} />
          <Route path="/formateur/view/cours/matiere/:matricule_matiere" element={<PrivateRoute allowedRoles={[2]}><CoursParMatiere /></PrivateRoute>} />
          <Route path="/formateur/view/cours/classroom/:matricule_classroom" element={<PrivateRoute allowedRoles={[2]}><CoursParClassroom /></PrivateRoute>} />
          <Route path="/formateur/show/cours/:id" element={<PrivateRoute allowedRoles={[2]}><CoursShow /></PrivateRoute>} />
          <Route path="/formateur/edit/cours/:id" element={<PrivateRoute allowedRoles={[2]}><CoursEdit /></PrivateRoute>} />
          <Route path="/formateur/view/evaluations" element={<PrivateRoute allowedRoles={[2]}><EvaluationManagement /></PrivateRoute>} />
          <Route path="/formateur/show/evaluation/:id" element={<PrivateRoute allowedRoles={[2]}><EvaluationShow /></PrivateRoute>} />
          <Route path="/formateur/edit/evaluation/:id" element={<PrivateRoute allowedRoles={[2]}><EvaluationEdit /></PrivateRoute>} />
          <Route path="/formateur/evaluation/:evaluationId/questions" element={<PrivateRoute allowedRoles={[2]}><QuestionsByEvaluation /></PrivateRoute>} />
          <Route path="/formateur/evaluation/:evaluationId/resultats" element={<PrivateRoute allowedRoles={[2]}><EvaluationResultats /></PrivateRoute>} />
          <Route path="/formateur/evaluation/statistics" element={<PrivateRoute allowedRoles={[2]}><EvaluationDashboard /></PrivateRoute>} />
          <Route path="/formateur/view/questions" element={<PrivateRoute allowedRoles={[2]}><QuestionManagement /></PrivateRoute>} />
          <Route path="/formateur/create/questions" element={<PrivateRoute allowedRoles={[2]}><CreateQuestion /></PrivateRoute>} />
          <Route path="/formateur/show/question/:id" element={<PrivateRoute allowedRoles={[2]}><ShowQuestion /></PrivateRoute>} />
          <Route path="/formateur/edit/question/:id" element={<PrivateRoute allowedRoles={[2]}><EditQuestion /></PrivateRoute>} />
          <Route path="/formateur/view/question/by-evaluation/:evaluationId" element={<PrivateRoute allowedRoles={[2]}><QuestionsByEvaluation /></PrivateRoute>} />
          <Route path="/formateur/questions/statistics" element={<PrivateRoute allowedRoles={[2]}><QuestionStatistics /></PrivateRoute>} />
          <Route path="/formateur/view/answers/results" element={<PrivateRoute allowedRoles={[2]}><ResultatsGeneral /></PrivateRoute>} />
          <Route path="/formateur/answers/student/:matriculeEtudiant/evaluation/:matriculeEvaluation" element={<PrivateRoute allowedRoles={[2]}><ReponsesEtudiantEvaluation /></PrivateRoute>} />
          <Route path="/formateur/answers/evaluation/:evaluationId" element={<PrivateRoute allowedRoles={[2]}><ResultatsEvaluationEtudiants /></PrivateRoute>} />
          <Route path="/formateur/answers/statistics" element={<PrivateRoute allowedRoles={[2]}><StatistiquesAvanceesResultats /></PrivateRoute>} />
          <Route path="/formateur/view/calendar" element={<PrivateRoute allowedRoles={[2]}><CalendrierActivites /></PrivateRoute>} />
          <Route path="/formateur/view/tchat" element={<PrivateRoute allowedRoles={[2]}><ChatFormateur /></PrivateRoute>} />
          <Route path="/formateur/view/invitations" element={<PrivateRoute allowedRoles={[2]}><InvitationByFormateur /></PrivateRoute>} />
          <Route path="/formateur/view/notifications" element={<PrivateRoute allowedRoles={[2]}><NotificationsByFormateur /></PrivateRoute>} />

          {/* Admin Système */}
          <Route path="/admin-systeme/dashboard" element={<PrivateRoute allowedRoles={[3]}><DashboardAdminSysteme /></PrivateRoute>} />
          <Route path="/admin-systeme/statistics" element={<PrivateRoute allowedRoles={[3]}><Statistics /></PrivateRoute>} />
          <Route path="/admin-systeme/view/admin-systeme" element={<PrivateRoute allowedRoles={[3]}><ViewAdminSysteme /></PrivateRoute>} />
          <Route path="/admin-systeme/show/admin-systeme/:id" element={<PrivateRoute allowedRoles={[3]}><ShowAdminSysteme /></PrivateRoute>} /> 
          <Route path="/admin-systeme/edit/admin-systeme/:id" element={<PrivateRoute allowedRoles={[3]}><EditAdminSysteme /></PrivateRoute>} />
          <Route path="/admin-systeme/view/formateur" element={<PrivateRoute allowedRoles={[3]}><ViewFormateurs /></PrivateRoute>} />
          <Route path="/admin-systeme/show/formateur/:id" element={<PrivateRoute allowedRoles={[3]}><ShowFormateur /></PrivateRoute>} /> 
          <Route path="/admin-systeme/edit/formateur/:id" element={<PrivateRoute allowedRoles={[3]}><EditFormateur /></PrivateRoute>} />
          <Route path="/admin-systeme/view/etudiants" element={<PrivateRoute allowedRoles={[3]}><ViewEtudiants /></PrivateRoute>} />
          <Route path="/admin-systeme/show/etudiant/:id" element={<PrivateRoute allowedRoles={[3]}><EtudiantShow /></PrivateRoute>} />
          <Route path="/admin-systeme/edit/etudiant/:id" element={<PrivateRoute allowedRoles={[3]}><EtudiantEdit /></PrivateRoute>} />
          <Route path="/admin-systeme/view/etudiants-espace-attente" element={<PrivateRoute allowedRoles={[3]}><ViewEtudiantsEspaceAttente /></PrivateRoute>} />
          <Route path="/admin-systeme/show/etudiant-espace-attente/:id" element={<PrivateRoute allowedRoles={[3]}><ShowEtudiantsZoneAttente /></PrivateRoute>} />
          <Route path="/admin-systeme/edit/etudiant-espace-attente/:id" element={<PrivateRoute allowedRoles={[3]}><EditEtudiantsZoneAttente /></PrivateRoute>} />
          <Route path="/admin-systeme/view/invitations" element={<PrivateRoute allowedRoles={[3]}><Invitation /></PrivateRoute>} />
          <Route path="/admin-systeme/view/profil" element={<PrivateRoute allowedRoles={[3]}><ProfilAdminSysteme /></PrivateRoute>} />
          <Route path="/admin-systeme/edit/profil" element={<PrivateRoute allowedRoles={[3]}><ProfilEditAdminSysteme /></PrivateRoute>} />
          <Route path="/admin-systeme/view/notifications" element={<PrivateRoute allowedRoles={[3]}><AdminSystemeNotifications /></PrivateRoute>} />
          <Route path="/admin-systeme/view/Support-technique" element={<PrivateRoute allowedRoles={[3]}><SupportTechnique /></PrivateRoute>} /> 
          <Route path="/admin-systeme/view/logs" element={<PrivateRoute allowedRoles={[3]}><Logs /></PrivateRoute>} />

          {/* Catch-all pour les routes inexistantes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
