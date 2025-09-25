import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "../pages/Welcome"

import Register from "../pages/Auth/Register";
import Login from "../pages/Auth/Login";
import InvitationRegister from "../pages/Auth/InvitationRegister";

import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";


// ------------------------------------------------------------------------------
// ------------------------------------------------------------------------------

// Gerer par les etudiant en espace d'attente
import EtudiantEspaceAttenteDashboard from "../pages/EtudiantEspaceAttente/Dashboard";

import ProfilEtudiantEnAttente from "../pages/EtudiantEspaceAttente/Profil";
import ProfilEditEtudiantEnattente from "../pages/EtudiantEspaceAttente/EditProfil";

// ------------------------------------------------------------------------------
// ------------------------------------------------------------------------------

// Gerer par les etudiants
import EtudiantDashboard from "../pages/Etudiant/Dashboard";
import StatistiquesEtudiant from "../pages/Etudiant/Statistics";

import ClassroomStats from "../pages/Etudiant/ClassroomStats";

import ProfilEtudiant from "../pages/Etudiant/Profil";
import ProfilEditEtudiant from "../pages/Etudiant/EditProfil";

import CalendrierEtudiant from "../pages/Etudiant/CalendrierEtudiant";

import CoursParClassroomEtudiant from "../pages/Etudiant/Cours";
import CoursShowEtudiant from "../pages/Etudiant/CourShow";

import MatieresEtudiant from "../pages/Etudiant/Matieres";
import MatiereShowEtudiant from "../pages/Etudiant/MatiereShow";

import EvaluationsEtudiant from "../pages/Etudiant/Evaluation";
import EvaluationStart from "../pages/Etudiant/EvaluationStart";
import EvaluationDetails from "../pages/Etudiant/EvaluationDetails";

import MesResultatsEtudiant from "../pages/Etudiant/MesResultats";

import ChatEtudiant from "../pages/Etudiant/TchatEtudiant";

// ------------------------------------------------------------------------------
// ------------------------------------------------------------------------------

// Gerer par les formateurs
import DashboardFormateur from "../pages/Formateur/Dashboard";
import StatisticsFormateur from "../pages/Formateur/Statistics";

import ProfilFormateur from "../pages/Formateur/Profil";
import ProfilEditFormateur from "../pages/Formateur/EditProfil";

import ViewEtudiantsByFormateurs from "../pages/Formateur/Etudiant";
import EtudiantShowByFormateurs from "../pages/Formateur/EtudiantShow";
import EtudiantEditByFormateurs from "../pages/Formateur/EtudiantEdit";

import ViewEtudiantsZoneAttenteByFormateurs from "../pages/Formateur/EtudiantZoneAttente";
import ShowEtudiantsZoneAttenteByFormateurs from "../pages/Formateur/EtudiantZoneAttenteShow";
import EditEtudiantsZoneAttenteByFormateurs from "../pages/Formateur/EtudiantZoneAttenteEdit";

import ViewFormateursByFormateurs from "../pages/Formateur/Formateur";
import FormateurShowByFormateurs from "../pages/Formateur/FormateurShow";
import FormateurEditByFormateurs from "../pages/Formateur/FormateurEdit";

import ClassroomManagement from "../pages/Formateur/Classroom";
import ClassroomShow from "../pages/Formateur/ClassroomShow";
import ClassroomEdit from "../pages/Formateur/ClassroomEdit";
import ClassroomUsers from "../pages/Formateur/ClassroomUsers";
import ClassroomUserProfile from "../pages/Formateur/ClassroomUsersShow";

import MatiereManagement from "../pages/Formateur/Matiere";
import MatiereByClassroom from '../pages/Formateur/MatiereByClassroom';

import MatiereEdit from "../pages/Formateur/MatiereEdit";
import MatiereShow from "../pages/Formateur/MatieresShow";

import CoursManagement from "../pages/Formateur/Cour";
import CoursParMatiere from "../pages/Formateur/CourByMatiere";
import CoursShow from "../pages/Formateur/CourShow";
import CoursEdit from "../pages/Formateur/CourEdit";
import CoursParClassroom from "../pages/Formateur/CoursParClassroom";

import EvaluationManagement from "../pages/Formateur/Evaluation";
import EvaluationEdit from "../pages/Formateur/EvaluationEdit";
import EvaluationShow from "../pages/Formateur/EvaluationShow";
import EvaluationQuestions from "../pages/Formateur/EvaluationQuestions";
import EvaluationResultats from "../pages/Formateur/EvaluationResultats";
import EvaluationDashboard from "../pages/Formateur/EvaluationDashboard";

import QuestionManagement from "../pages/Formateur/Question";
import ShowQuestion from "../pages/Formateur/QuestionShow";
import EditQuestion from "../pages/Formateur/QuestionEdit";
import QuestionsByEvaluation from "../pages/Formateur/QuestionsByEvaluation";
import CreateQuestion from "../pages/Formateur/QuestionCreate";
import QuestionStatistics from "../pages/Formateur/QuestionStatistics";

import ReponsesEtudiantEvaluation from "../pages/Formateur/ResultatsByEtudiantByEvaluation";
import ResultatsGeneral from "../pages/Formateur/Resultats";
import StatistiquesAvanceesResultats from "../pages/Formateur/ResultatsStatistics";
import ResultatsEvaluationEtudiants from "../pages/Formateur/ResultatsByEvaluationByEtudiants";

import ChatFormateur from "../pages/Formateur/TchatFormateur";

import CalendrierActivites from "../pages/Formateur/CalendrierFormateur";

import InvitationByFormateur from "../pages/Formateur/Invitation";

import NotificationsByFormateur from "../pages/Formateur/Notification";

// ------------------------------------------------------------------------------
// ------------------------------------------------------------------------------

// Gerer par l'administrateur systeme
import DashboardAdminSysteme from "../pages/AdminSysteme/Dashboard";
import Statistics from "../pages/AdminSysteme/Statistics";

import ProfilAdminSysteme from "../pages/AdminSysteme/Profil";
import ProfilEditAdminSysteme from "../pages/AdminSysteme/EditProfil";

import ViewAdminSysteme from "../pages/AdminSysteme/AdminSysteme";
import ShowAdminSysteme from "../pages/AdminSysteme/AdminSystemeShow";
import EditAdminSysteme from "../pages/AdminSysteme/AdminSystemeEdit";

import ViewFormateurs from "../pages/AdminSysteme/Formateur";
import ShowFormateur from "../pages/AdminSysteme/FormateurShow";
import EditFormateur from "../pages/AdminSysteme/FormateurEdit";

import ViewEtudiants from "../pages/AdminSysteme/Etudiant";
import EtudiantShow from "../pages/AdminSysteme/EtudiantShow";
import EtudiantEdit from "../pages/AdminSysteme/EtudiantEdit";

import ViewEtudiantsEspaceAttente from "../pages/AdminSysteme/EtudiantZoneAttente";
import EditEtudiantsZoneAttente from "../pages/AdminSysteme/EtudiantZoneAttenteEdit";
import ShowEtudiantsZoneAttente from "../pages/AdminSysteme/EtudiantZoneAttenteShow";

import Invitation from "../pages/AdminSysteme/Invitation";

import AdminSystemeNotifications from "../pages/AdminSysteme/Notification";
import SupportTechnique from "../pages/AdminSysteme/SupportTechnique"
import Logs from "../pages/AdminSysteme/Logs";

// ------------------------------------------------------------------------------
// ------------------------------------------------------------------------------

// Autres
import NotFound from "../pages/NotFound";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/" element={<PublicRoute> <Welcome /> </PublicRoute>} />
        
        <Route path="/register" element={<PublicRoute> <Register /> </PublicRoute>} />
        <Route path="/login" element={<PublicRoute> <Login /> </PublicRoute>} />
        <Route path="/invitation-register" element={<PublicRoute> <InvitationRegister /> </PublicRoute>} />

        <Route path="/forgot-password" element={<PublicRoute> <ForgotPassword /> </PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute> <ResetPassword /> </PublicRoute>} />

        {/* Protégées */}

        {/* Etudiant en epace d'attente */}
        <Route path="/etudiant-espace-attente/dashboard" element={ <PrivateRoute allowedRoles={[0]}> <EtudiantEspaceAttenteDashboard /> </PrivateRoute> } />

        <Route path="/etudiant-espace-attente/view/profil" element={ <PrivateRoute allowedRoles={[0]}> <ProfilEtudiantEnAttente /> </PrivateRoute> } />
        <Route path="/etudiant-espace-attente/edit/profil" element={ <PrivateRoute allowedRoles={[0]}> <ProfilEditEtudiantEnattente /> </PrivateRoute>} />
        
        {/* Etudiant en epace d'attente */}
        <Route path="/etudiant/dashboard" element={ <PrivateRoute allowedRoles={[1]}> <EtudiantDashboard /> </PrivateRoute> } />
        <Route path="/etudiant/statistics" element={ <PrivateRoute allowedRoles={[1]}> <StatistiquesEtudiant /> </PrivateRoute> } />

        <Route path="/etudiant/view/profil" element={ <PrivateRoute allowedRoles={[1]}> <ProfilEtudiant /> </PrivateRoute> } />
        <Route path="/etudiant/edit/profil" element={ <PrivateRoute allowedRoles={[1]}> <ProfilEditEtudiant /> </PrivateRoute>} />

        <Route path="/etudiant/view/statistics/my-classroom" element={<PrivateRoute allowedRoles={[1]}> <ClassroomStats /> </PrivateRoute>} />

        <Route path="/etudiant/view/my-cours" element={<PrivateRoute allowedRoles={[1]}> <CoursParClassroomEtudiant /> </PrivateRoute>} />
        <Route path="/etudiant/show/cours/:id" element={<PrivateRoute allowedRoles={[1]}> <CoursShowEtudiant /> </PrivateRoute>} />

        <Route path="/etudiant/view/my-matieres" element={<PrivateRoute allowedRoles={[1]}> <MatieresEtudiant /> </PrivateRoute>} />
        <Route path="/etudiant/show/matiere/:id" element={<PrivateRoute allowedRoles={[1]}> <MatiereShowEtudiant /> </PrivateRoute>} />

        <Route path="/etudiant/view/evaluations/my-classroom" element={<PrivateRoute allowedRoles={[1]}> <EvaluationsEtudiant /> </PrivateRoute>} />
        <Route path="/etudiant/evaluation/:id/start" element={<PrivateRoute allowedRoles={[1]}> <EvaluationStart /> </PrivateRoute>} />
        <Route path="/etudiant/evaluation/:id/details" element={<PrivateRoute allowedRoles={[1]}> <EvaluationDetails /> </PrivateRoute>} />

        <Route path="/etudiant/view/my-resultats-evaluations" element={<PrivateRoute allowedRoles={[1]}> <MesResultatsEtudiant /> </PrivateRoute>} />

        <Route path="/etudiant/view/calendar" element={<PrivateRoute allowedRoles={[1]}> <CalendrierEtudiant /> </PrivateRoute>} />

        <Route path="/etudiant/view/tchat" element={<PrivateRoute allowedRoles={[1]}> <ChatEtudiant /> </PrivateRoute>} />

        {/* Formateur */}
        <Route path="/formateur/dashboard" element={ <PrivateRoute allowedRoles={[2]}><DashboardFormateur /></PrivateRoute>} />
        <Route path="/formateur/statistics" element={<PrivateRoute allowedRoles={[2]}><StatisticsFormateur /></PrivateRoute>} />

        <Route path="/formateur/view/profil" element={ <PrivateRoute allowedRoles={[2]}> <ProfilFormateur /> </PrivateRoute> } />
        <Route path="/formateur/edit/profil" element={ <PrivateRoute allowedRoles={[2]}> <ProfilEditFormateur /> </PrivateRoute>} />

        <Route path="/formateur/view/etudiants" element={ <PrivateRoute allowedRoles={[2]}> <ViewEtudiantsByFormateurs /> </PrivateRoute>} />
        <Route path="/formateur/show/etudiant/:id" element={ <PrivateRoute allowedRoles={[2]}> <EtudiantShowByFormateurs /> </PrivateRoute>} />
        <Route path="/formateur/edit/etudiant/:id" element={ <PrivateRoute allowedRoles={[2]}> <EtudiantEditByFormateurs /> </PrivateRoute>} />

        <Route path="/formateur/view/etudiants-espace-attente" element={ <PrivateRoute allowedRoles={[2]}> <ViewEtudiantsZoneAttenteByFormateurs /> </PrivateRoute>} />
        <Route path="/formateur/show/etudiant-espace-attente/:id" element={ <PrivateRoute allowedRoles={[2]}> <ShowEtudiantsZoneAttenteByFormateurs /> </PrivateRoute>} />
        <Route path="/formateur/edit/etudiant-espace-attente/:id" element={ <PrivateRoute allowedRoles={[2]}> <EditEtudiantsZoneAttenteByFormateurs /> </PrivateRoute>} />

        <Route path="/formateur/view/formateurs" element={<PrivateRoute allowedRoles={[2]}> <ViewFormateursByFormateurs /> </PrivateRoute>} />
        <Route path="/formateur/show/formateur/:id" element={<PrivateRoute allowedRoles={[2]}> <FormateurShowByFormateurs /> </PrivateRoute>} />
        <Route path="/formateur/edit/formateur/:id" element={<PrivateRoute allowedRoles={[2]}> <FormateurEditByFormateurs /> </PrivateRoute>} />

        <Route path="/formateur/view/classrooms" element={<PrivateRoute allowedRoles={[2]}> <ClassroomManagement /> </PrivateRoute>} />
        <Route path="/formateur/view/classroom/:id/users" element={<PrivateRoute allowedRoles={[2]}> <ClassroomUsers /> </PrivateRoute>} />
        <Route path="/formateur/view/classroom/user/:id" element={<PrivateRoute allowedRoles={[2]}> <ClassroomUserProfile /> </PrivateRoute>} />
        <Route path="/formateur/show/classroom/:id" element={<PrivateRoute allowedRoles={[2]}> <ClassroomShow /> </PrivateRoute>} />
        <Route path="/formateur/classroom/:id/edit" element={<PrivateRoute allowedRoles={[2]}> <ClassroomEdit /> </PrivateRoute>} />

        <Route path="/formateur/view/matieres" element={<PrivateRoute allowedRoles={[2]}> <MatiereManagement /> </PrivateRoute>} />
        <Route path="/formateur/matiere/by-classroom/:matricule_classroom" element={<PrivateRoute allowedRoles={[2]}> <MatiereByClassroom /> </PrivateRoute>}  />
        <Route path="/formateur/show/matiere/:id" element={<PrivateRoute allowedRoles={[2]}> <MatiereShow /> </PrivateRoute>} />
        <Route path="/formateur/edit/matiere/:id" element={<PrivateRoute allowedRoles={[2]}> <MatiereEdit /> </PrivateRoute>} />

        <Route path="/formateur/view/cours" element={<PrivateRoute allowedRoles={[2]}> <CoursManagement /> </PrivateRoute>} />
        <Route path="/formateur/view/cours/matiere/:matricule_matiere" element={<PrivateRoute allowedRoles={[2]}> <CoursParMatiere /> </PrivateRoute>} />
        <Route path="/formateur/view/cours/classroom/:matricule_classroom" element={<PrivateRoute allowedRoles={[2]}> <CoursParClassroom /> </PrivateRoute>} />
        <Route path="/formateur/show/cours/:id" element={<PrivateRoute allowedRoles={[2]}> <CoursShow /> </PrivateRoute>} />
        <Route path="/formateur/edit/cours/:id" element={<PrivateRoute allowedRoles={[2]}> <CoursEdit /> </PrivateRoute>} />

        <Route path="/formateur/view/evaluations" element={<PrivateRoute allowedRoles={[2]}> <EvaluationManagement /> </PrivateRoute>} />
        <Route path="/formateur/show/evaluation/:id" element={<PrivateRoute allowedRoles={[2]}> <EvaluationShow /> </PrivateRoute>} />
        <Route path="/formateur/edit/evaluation/:id" element={<PrivateRoute allowedRoles={[2]}> <EvaluationEdit /> </PrivateRoute>} />
        <Route path="/formateur/evaluation/:evaluationId/questions" element={<PrivateRoute allowedRoles={[2]}> <QuestionsByEvaluation /> </PrivateRoute>} />
        <Route path="/formateur/evaluation/:evaluationId/resultats" element={<PrivateRoute allowedRoles={[2]}> <EvaluationResultats /> </PrivateRoute>} />
        <Route path="/formateur/evaluation/statistics" element={<PrivateRoute allowedRoles={[2]}> <EvaluationDashboard /> </PrivateRoute>} />

        <Route path="/formateur/view/questions" element={<PrivateRoute allowedRoles={[2]}> <QuestionManagement /> </PrivateRoute>} />
        <Route path="/formateur/create/questions" element={<PrivateRoute allowedRoles={[2]}> <CreateQuestion /> </PrivateRoute>} />
        <Route path="/formateur/show/question/:id" element={<PrivateRoute allowedRoles={[2]}> <ShowQuestion /> </PrivateRoute>} />
        <Route path="/formateur/edit/question/:id" element={<PrivateRoute allowedRoles={[2]}> <EditQuestion /> </PrivateRoute>} />
        <Route path="/formateur/view/question/by-evaluation/:evaluationId" element={<PrivateRoute allowedRoles={[2]}> <QuestionsByEvaluation /> </PrivateRoute>}  />
        <Route path="/formateur/questions/statistics" element={<PrivateRoute allowedRoles={[2]}> <QuestionStatistics /> </PrivateRoute>} />

        <Route path="/formateur/view/answers/results" element={<PrivateRoute allowedRoles={[2]}> <ResultatsGeneral /> </PrivateRoute>} />
        <Route path="/formateur/answers/student/:matriculeEtudiant/evaluation/:matriculeEvaluation" element={<PrivateRoute allowedRoles={[2]}> <ReponsesEtudiantEvaluation /> </PrivateRoute>} />
        <Route path="/formateur/answers/evaluation/:evaluationId" element={<PrivateRoute allowedRoles={[2]}> <ResultatsEvaluationEtudiants /> </PrivateRoute>} />
        <Route path="/formateur/answers/statistics" element={<PrivateRoute allowedRoles={[2]}> <StatistiquesAvanceesResultats /> </PrivateRoute>} />

        <Route path="/formateur/view/calendar" element={<PrivateRoute allowedRoles={[2]}> <CalendrierActivites /> </PrivateRoute>} />

        <Route path="/formateur/view/tchat" element={<PrivateRoute allowedRoles={[2]}> <ChatFormateur /> </PrivateRoute>} />

        <Route path="/formateur/view/invitations" element={<PrivateRoute allowedRoles={[2]}> <InvitationByFormateur /> </PrivateRoute>} />

        <Route path="/formateur/view/notifications" element={<PrivateRoute allowedRoles={[2]}> <NotificationsByFormateur /> </PrivateRoute>} />


        {/* Admin Système */}
        <Route path="/admin-systeme/dashboard" element={<PrivateRoute allowedRoles={[3]}><DashboardAdminSysteme /></PrivateRoute>} />
        <Route path="/admin-systeme/statistics" element={<PrivateRoute allowedRoles={[3]}><Statistics /></PrivateRoute>} />

        <Route path="/admin-systeme/view/admin-systeme" element={<PrivateRoute allowedRoles={[3]}> <ViewAdminSysteme /> </PrivateRoute>} />
        <Route path="/admin-systeme/show/admin-systeme/:id" element={<PrivateRoute allowedRoles={[3]}> <ShowAdminSysteme />  </PrivateRoute>} /> 
        <Route path="/admin-systeme/edit/admin-systeme/:id" element={<PrivateRoute allowedRoles={[3]}> <EditAdminSysteme />  </PrivateRoute>} />

        <Route path="/admin-systeme/view/formateur" element={<PrivateRoute allowedRoles={[3]}> <ViewFormateurs /> </PrivateRoute>} />
        <Route path="/admin-systeme/show/formateur/:id" element={<PrivateRoute allowedRoles={[3]}> <ShowFormateur />  </PrivateRoute>} /> 
        <Route path="/admin-systeme/edit/formateur/:id" element={<PrivateRoute allowedRoles={[3]}> <EditFormateur />  </PrivateRoute>} />

        <Route path="/admin-systeme/view/etudiants" element={<PrivateRoute allowedRoles={[3]}> <ViewEtudiants /> </PrivateRoute>} />
        <Route path="/admin-systeme/show/etudiant/:id" element={<PrivateRoute allowedRoles={[3]}> <EtudiantShow />  </PrivateRoute>} />
        <Route path="/admin-systeme/edit/etudiant/:id" element={<PrivateRoute allowedRoles={[3]}> <EtudiantEdit />  </PrivateRoute>} />

        <Route path="/admin-systeme/view/etudiants-espace-attente" element={<PrivateRoute allowedRoles={[3]}> <ViewEtudiantsEspaceAttente /> </PrivateRoute>} />
        <Route path="/admin-systeme/show/etudiant-espace-attente/:id" element={<PrivateRoute allowedRoles={[3]}> <ShowEtudiantsZoneAttente />  </PrivateRoute>} />
        <Route path="/admin-systeme/edit/etudiant-espace-attente/:id" element={<PrivateRoute allowedRoles={[3]}> <EditEtudiantsZoneAttente />  </PrivateRoute>} />

        <Route path="/admin-systeme/view/invitations" element={<PrivateRoute allowedRoles={[3]}> <Invitation /> </PrivateRoute>} />

        <Route path="/admin-systeme/view/profil" element={<PrivateRoute allowedRoles={[3]}> <ProfilAdminSysteme /> </PrivateRoute>} />
        <Route path="/admin-systeme/edit/profil" element={<PrivateRoute allowedRoles={[3]}> <ProfilEditAdminSysteme /> </PrivateRoute>} />

        <Route path="/admin-systeme/view/notifications" element={ <PrivateRoute allowedRoles={[3]}> <AdminSystemeNotifications /> </PrivateRoute>} />
        <Route path="/admin-systeme/view/Support-technique" element={<PrivateRoute allowedRoles={[3]}> <SupportTechnique /> </PrivateRoute>} /> 
        <Route path="/admin-systeme/view/logs" element={<PrivateRoute allowedRoles={[3]}> <Logs /> </PrivateRoute>} />

        {/* Catch-all pour les routes inexistantes */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
