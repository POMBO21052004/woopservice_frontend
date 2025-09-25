import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import feather from "feather-icons";
import fileDownload from "js-file-download";
import {
  Container, Card, Badge, Button, Form, Modal, Row, Col, Accordion, 
  Toast, ToastContainer, Table, ButtonGroup, Alert, Collapse, Dropdown
} from "react-bootstrap";
import FormateurLayout from "../../layouts/Formateur/Layout";
import { Link } from "react-router-dom";

export default function QuestionManagement() {
  // États
  const [questions, setQuestions] = useState([]);
  const [questionsGroupees, setQuestionsGroupees] = useState({});
  const [classrooms, setClassrooms] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [viewMode, setViewMode] = useState("grouped"); // grouped ou list

  // Filtres
  const [search, setSearch] = useState("");
  const [createdAtFilter, setCreatedAtFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [matiereFilter, setMatiereFilter] = useState("");
  const [evaluationFilter, setEvaluationFilter] = useState("");

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [questionToDuplicate, setQuestionToDuplicate] = useState(null);
  const [errors, setErrors] = useState({});

  // États Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // États du formulaire
  const [form, setForm] = useState({
    enonce: "",
    type: "QCM",
    matricule_classroom: "",
    matricule_matiere: "",
    matricule_evaluation: "",
    choix_a: "",
    choix_b: "",
    choix_c: "",
    bonne_reponse_general: "",
    points: 1,
    explication: "",
    image: null
  });

  // États pour les cascades du formulaire
  const [matieresByClassroom, setMatieresByClassroom] = useState([]);
  const [evaluationsByMatiere, setEvaluationsByMatiere] = useState([]);

  // États pour la duplication
  const [duplicateForm, setDuplicateForm] = useState({
    matricule_evaluation: ""
  });

  // État des statistiques
  const [statistics, setStatistics] = useState({});

  // État du thème
  const [theme, setTheme] = useState("light");

  // États pour l'accordion
  const [openSections, setOpenSections] = useState({});

  // Gérer les changements de thème
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

  // Afficher les notifications toast
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Récupérer les questions avec filtres
  const fetchQuestions = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (createdAtFilter) params.created_at = createdAtFilter;
      if (typeFilter) params.type = typeFilter;
      if (classroomFilter) params.matricule_classroom = classroomFilter;
      if (matiereFilter) params.matricule_matiere = matiereFilter;
      if (evaluationFilter) params.matricule_evaluation = evaluationFilter;

      const res = await api.get("/formateur/view/questions", { params });
      setQuestions(res.data.questions || []);
      setQuestionsGroupees(res.data.questions_groupees || {});
      setClassrooms(res.data.classrooms || []);
      setMatieres(res.data.matieres || []);
      setEvaluations(res.data.evaluations || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des questions", err);
      showToastMessage("Erreur lors de la récupération des données", 'danger');
    }
  }, [search, createdAtFilter, typeFilter, classroomFilter, matiereFilter, evaluationFilter]);

  // Récupérer les statistiques
  const fetchStatistics = useCallback(async () => {
    try {
      const res = await api.get("/formateur/questions/statistics");
      setStatistics(res.data.statistics || {});
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques", err);
    }
  }, []);

  // Récupérer les matières d'une classe
  const fetchMatieresByClassroom = useCallback(async (matriculeClassroom) => {
    if (!matriculeClassroom) {
      setMatieresByClassroom([]);
      return;
    }
    
    try {
      const res = await api.get(`/formateur/questions/matieres/${matriculeClassroom}`);
      setMatieresByClassroom(res.data.matieres || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des matières", err);
      setMatieresByClassroom([]);
    }
  }, []);

  // Récupérer les évaluations d'une matière
  const fetchEvaluationsByMatiere = useCallback(async (matriculeMatiere) => {
    if (!matriculeMatiere) {
      setEvaluationsByMatiere([]);
      return;
    }
    
    try {
      const res = await api.get(`/formateur/questions/evaluations/${matriculeMatiere}`);
      setEvaluationsByMatiere(res.data.evaluations || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des évaluations", err);
      setEvaluationsByMatiere([]);
    }
  }, []);

  useEffect(() => {
    feather.replace();
    fetchQuestions();
    fetchStatistics();
  }, [fetchQuestions, fetchStatistics]);

  useEffect(() => {
    feather.replace();
  }, [questions, viewMode]);

  // Gérer le changement de classe dans le formulaire
  const handleClassroomChange = (matriculeClassroom) => {
    setForm({ 
      ...form, 
      matricule_classroom: matriculeClassroom, 
      matricule_matiere: "", 
      matricule_evaluation: "" 
    });
    fetchMatieresByClassroom(matriculeClassroom);
    setEvaluationsByMatiere([]);
  };

  // Gérer le changement de matière dans le formulaire
  const handleMatiereChange = (matriculeMatiere) => {
    setForm({ 
      ...form, 
      matricule_matiere: matriculeMatiere, 
      matricule_evaluation: "" 
    });
    fetchEvaluationsByMatiere(matriculeMatiere);
  };

  // Gérer la création de question
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const formData = new FormData();
      formData.append('enonce', form.enonce);
      formData.append('type', form.type);
      formData.append('matricule_evaluation', form.matricule_evaluation);
      formData.append('points', form.points);
      formData.append('bonne_reponse_general', form.bonne_reponse_general);
      
      if (form.type === 'QCM') {
        formData.append('choix_a', form.choix_a);
        formData.append('choix_b', form.choix_b);
        formData.append('choix_c', form.choix_c);
      }
      
      if (form.explication) {
        formData.append('explication', form.explication);
      }
      
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post("/formateur/store/question", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      fetchQuestions();
      fetchStatistics();
      setShowAddModal(false);
      resetForm();
      showToastMessage("Question ajoutée avec succès", 'success');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        showToastMessage("Erreur de validation", 'danger');
      } else {
        console.error(err);
        showToastMessage("Une erreur inattendue s'est produite", 'danger');
      }
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setForm({
      enonce: "",
      type: "QCM",
      matricule_classroom: "",
      matricule_matiere: "",
      matricule_evaluation: "",
      choix_a: "",
      choix_b: "",
      choix_c: "",
      bonne_reponse_general: "",
      points: 1,
      explication: "",
      image: null
    });
    setMatieresByClassroom([]);
    setEvaluationsByMatiere([]);
  };

  // Gérer la suppression
  const confirmDelete = (questionId) => {
    setQuestionToDelete(questionId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/formateur/destroy/question/${questionToDelete}`);
      
      fetchQuestions();
      fetchStatistics();
      setShowDeleteModal(false);
      setQuestionToDelete(null);
      showToastMessage("Question supprimée avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage(err.response?.data?.message || "Erreur lors de la suppression", 'danger');
    }
  };

  // Gérer la duplication
  const confirmDuplicate = (question) => {
    setQuestionToDuplicate(question);
    setDuplicateForm({ matricule_evaluation: "" });
    setShowDuplicateModal(true);
  };

  const handleDuplicateConfirmed = async () => {
    try {
      await api.post(`/formateur/duplicate/question/${questionToDuplicate.id}`, duplicateForm);
      
      fetchQuestions();
      fetchStatistics();
      setShowDuplicateModal(false);
      setQuestionToDuplicate(null);
      showToastMessage("Question dupliquée avec succès", 'success');
    } catch (err) {
      console.error(err);
      showToastMessage("Erreur lors de la duplication", 'danger');
    }
  };

  // Gérer l'accordion
  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'QCM': return 'primary';
      case 'Réponse_libre': return 'success';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'QCM': return 'check-square';
      case 'Réponse_libre': return 'edit-3';
      default: return 'help-circle';
    }
  };

  // Télécharger PDF
  const handleDownloadPdf = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (createdAtFilter) params.append('created_at', createdAtFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (classroomFilter) params.append('matricule_classroom', classroomFilter);
      if (matiereFilter) params.append('matricule_matiere', matiereFilter);
      if (evaluationFilter) params.append('matricule_evaluation', evaluationFilter);

      const res = await api.get(`/formateur/export/questions/pdf?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `questions_${new Date().toISOString().slice(0, 10)}.pdf`;
      fileDownload(res.data, filename);
      showToastMessage("Le rapport PDF est en cours de téléchargement", 'success');
    } catch (err) {
      console.error("Erreur de téléchargement PDF:", err);
      showToastMessage("Échec du téléchargement PDF", 'danger');
    }
  };

  // Télécharger Excel
  const handleDownloadExcel = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (createdAtFilter) params.append('created_at', createdAtFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (classroomFilter) params.append('matricule_classroom', classroomFilter);
      if (matiereFilter) params.append('matricule_matiere', matiereFilter);
      if (evaluationFilter) params.append('matricule_evaluation', evaluationFilter);

      const res = await api.get(`/formateur/export/questions/excel?${params.toString()}`, {
        responseType: "blob",
      });

      const filename = `questions_${new Date().toISOString().slice(0, 10)}.xlsx`;
      fileDownload(res.data, filename);
      showToastMessage("Le fichier Excel est en cours de téléchargement", 'success');
    } catch (err) {
      console.error("Erreur de téléchargement Excel:", err);
      showToastMessage("Échec du téléchargement Excel", 'danger');
    }
  };

  // Render grouped view
  const renderGroupedView = () => {
    if (Object.keys(questionsGroupees).length === 0) {
      return (
        <div className="text-center py-5">
          <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
            <i data-feather="help-circle" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
            <div>
              <h6>Aucune question trouvée</h6>
              <p className="small mb-0">Aucune question ne correspond à vos critères de recherche.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="questions-groups">
        {Object.entries(questionsGroupees).map(([nomClasse, classeData]) => (
          <Card key={nomClasse} className={`mb-4 border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <Card.Header 
              className={`${theme === "dark" ? "bg-dark border-secondary" : "bg-light"} cursor-pointer`}
              onClick={() => toggleSection(`classe-${nomClasse}`)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <i data-feather="home" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                  <h5 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomClasse}</h5>
                  <Badge bg="info" className="ms-3">
                    {Object.values(classeData.matieres).reduce((total, matiereData) => 
                      total + Object.values(matiereData.evaluations).reduce((evalTotal, evalData) => 
                        evalTotal + evalData.questions.length, 0), 0)} questions
                  </Badge>
                </div>
                <i 
                  data-feather={openSections[`classe-${nomClasse}`] ? "chevron-up" : "chevron-down"} 
                  className={`${theme === "dark" ? "text-light" : "text-muted"}`}
                  style={{ width: "20px", height: "20px" }}
                ></i>
              </div>
            </Card.Header>
            
            <Collapse in={openSections[`classe-${nomClasse}`] !== false}>
              <Card.Body className={theme === "dark" ? "bg-dark" : ""}>
                {Object.entries(classeData.matieres).map(([nomMatiere, matiereData]) => (
                  <div key={nomMatiere} className="mb-4">
                    <div 
                      className={`d-flex align-items-center mb-3 p-2 rounded cursor-pointer ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}
                      onClick={() => toggleSection(`matiere-${nomClasse}-${nomMatiere}`)}
                    >
                      <i data-feather="book" className="text-success me-2" style={{ width: "18px", height: "18px" }}></i>
                      <h6 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>{nomMatiere}</h6>
                      <Badge bg="success" className="ms-2">
                        {Object.values(matiereData.evaluations).reduce((total, evalData) => total + evalData.questions.length, 0)} questions
                      </Badge>
                      <i 
                        data-feather={openSections[`matiere-${nomClasse}-${nomMatiere}`] ? "chevron-up" : "chevron-down"} 
                        className={`ms-auto ${theme === "dark" ? "text-light" : "text-muted"}`}
                        style={{ width: "16px", height: "16px" }}
                      ></i>
                    </div>
                    
                    <Collapse in={openSections[`matiere-${nomClasse}-${nomMatiere}`] !== false}>
                      <div>
                        {Object.entries(matiereData.evaluations).map(([titreEvaluation, evalData]) => (
                          <div key={titreEvaluation} className="mb-3">
                            <div 
                              className={`d-flex align-items-center mb-2 p-2 rounded cursor-pointer ${theme === "dark" ? "bg-info bg-opacity-10" : "bg-info bg-opacity-10"}`}
                              onClick={() => toggleSection(`eval-${nomClasse}-${nomMatiere}-${titreEvaluation}`)}
                            >
                              <i data-feather="clipboard" className="text-info me-2" style={{ width: "16px", height: "16px" }}></i>
                              <span className={`fw-semibold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                                {titreEvaluation}
                              </span>
                              <Badge bg="info" className="ms-2">{evalData.questions.length} questions</Badge>
                              <i 
                                data-feather={openSections[`eval-${nomClasse}-${nomMatiere}-${titreEvaluation}`] ? "chevron-up" : "chevron-down"} 
                                className={`ms-auto ${theme === "dark" ? "text-light" : "text-muted"}`}
                                style={{ width: "14px", height: "14px" }}
                              ></i>
                            </div>
                            
                            <Collapse in={openSections[`eval-${nomClasse}-${nomMatiere}-${titreEvaluation}`] !== false}>
                              <Row className="g-3 ms-3">
                                {evalData.questions.map((question) => (
                                  <Col key={question.id} md={6} lg={4}>
                                    <Card className={`h-100 border ${theme === "dark" ? "bg-dark border-secondary" : "bg-white"}`}>
                                      <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                          <Badge bg={getTypeBadge(question.type)} className="mb-2">
                                            <i data-feather={getTypeIcon(question.type)} className="me-1" style={{ width: '12px', height: '12px' }}></i>
                                            {question.type}
                                          </Badge>
                                          <Badge bg="warning" className="mb-2">
                                            {question.points} pts
                                          </Badge>
                                        </div>
                                        
                                        <h6 className={`${theme === "dark" ? "text-light" : "text-dark"} mb-2`}>
                                          {question.enonce.length > 60 ? 
                                            question.enonce.substring(0, 60) + "..." : 
                                            question.enonce
                                          }
                                        </h6>
                                        
                                        <small className="text-muted d-block mb-2">{question.matricule}</small>
                                        
                                        {question.type === 'QCM' && (
                                          <div className="mb-2">
                                            <small className={`d-block ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                              A: {question.choix_a?.substring(0, 30)}...
                                            </small>
                                            <small className={`d-block ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                              B: {question.choix_b?.substring(0, 30)}...
                                            </small>
                                            <small className={`d-block ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                              C: {question.choix_c?.substring(0, 30)}...
                                            </small>
                                          </div>
                                        )}
                                        
                                        <div className="d-flex gap-1 mt-3">
                                          <Button
                                            size="sm"
                                            variant="outline-info"
                                            as={Link}
                                            to={`/formateur/show/question/${question.id}`}
                                            title="Voir les détails"
                                          >
                                            <i data-feather="eye" style={{ width: '14px', height: '14px' }}></i>
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline-warning"
                                            as={Link}
                                            to={`/formateur/edit/question/${question.id}`}
                                            title="Modifier"
                                          >
                                            <i data-feather="edit" style={{ width: '14px', height: '14px' }}></i>
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline-success"
                                            onClick={() => confirmDuplicate(question)}
                                            title="Dupliquer"
                                          >
                                            <i data-feather="copy" style={{ width: '14px', height: '14px' }}></i>
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => confirmDelete(question.id)}
                                            title="Supprimer"
                                          >
                                            <i data-feather="trash-2" style={{ width: '14px', height: '14px' }}></i>
                                          </Button>
                                        </div>
                                      </Card.Body>
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                            </Collapse>
                          </div>
                        ))}
                      </div>
                    </Collapse>
                  </div>
                ))}
              </Card.Body>
            </Collapse>
          </Card>
        ))}
      </div>
    );
  };

  // Render list view
  const renderListView = () => (
    <div className="table-responsive">
      <Table hover className={`align-middle ${theme === "dark" ? "table-dark" : ""}`}>
        <thead className="table-primary">
          <tr>
            <th>
              <i data-feather="help-circle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Question
            </th>
            <th className="d-none d-md-table-cell">
              <i data-feather="layers" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Contexte
            </th>
            <th className="d-none d-lg-table-cell text-center">
              <i data-feather="award" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Points
            </th>
            <th className="d-none d-lg-table-cell text-center">
              <i data-feather="users" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Réponses
            </th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.length ? (
            questions.map((question) => (
              <tr key={question.id}>
                <td>
                  <div>
                    <div className="d-flex align-items-center mb-2">
                      <Badge bg={getTypeBadge(question.type)} className="me-2">
                        <i data-feather={getTypeIcon(question.type)} className="me-1" style={{ width: '10px', height: '10px' }}></i>
                        {question.type}
                      </Badge>
                    </div>
                    <div className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      {question.enonce.length > 50 ? question.enonce.substring(0, 50) + "..." : question.enonce}
                    </div>
                    <small className="text-muted">{question.matricule}</small>
                  </div>
                </td>
                <td className="d-none d-md-table-cell">
                  <div>
                    <div className={`small ${theme === "dark" ? "text-light" : "text-dark"}`}>
                      <i data-feather="home" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {question.evaluation?.matiere?.classroom?.name || 'Non définie'}
                    </div>
                    <div className="small text-success">
                      <i data-feather="book" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {question.evaluation?.matiere?.nom || 'Non définie'}
                    </div>
                    <div className="small text-info">
                      <i data-feather="clipboard" className="me-1" style={{ width: '12px', height: '12px' }}></i>
                      {question.evaluation?.titre || 'Non définie'}
                    </div>
                  </div>
                </td>
                <td className="d-none d-lg-table-cell text-center">
                  <Badge bg="warning" className="px-3 py-2">
                    {question.points} pts
                  </Badge>
                </td>
                <td className="d-none d-lg-table-cell text-center">
                  <Badge bg="secondary" className="px-3 py-2">
                    {question.reponses_count || 0}
                  </Badge>
                </td>
                <td className="text-center">
                  <div className="d-flex gap-1 justify-content-center">
                    <Button
                      size="sm"
                      variant="outline-info"
                      as={Link}
                      to={`/formateur/show/question/${question.id}`}
                      title="Voir les détails"
                    >
                      <i data-feather="eye" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      as={Link}
                      to={`/formateur/edit/question/${question.id}`}
                      title="Modifier"
                    >
                      <i data-feather="edit" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => confirmDuplicate(question)}
                      title="Dupliquer"
                    >
                      <i data-feather="copy" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => confirmDelete(question.id)}
                      title="Supprimer"
                    >
                      <i data-feather="trash-2" style={{ width: "14px", height: "14px" }}></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-5">
                <div className={`${theme === "dark" ? "text-light" : "text-muted"}`}>
                  <i data-feather="help-circle" className="mb-3" style={{ width: "48px", height: "48px", opacity: 0.5 }}></i>
                  <div>
                    <h6>Aucune question trouvée</h6>
                    <p className="small mb-0">Aucune question ne correspond à vos critères de recherche.</p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );

  return (
    <FormateurLayout>
      <Container className="py-4">
        {/* En-tête et statistiques */}
        <div className="mb-4">
          <div className="d-flex align-items-center mb-3">
            <div className={`me-3 p-3 rounded-circle ${theme === "dark" ? "bg-primary bg-opacity-25" : "bg-primary bg-opacity-10"}`}>
              <i data-feather="help-circle" className="text-primary" style={{ width: "24px", height: "24px" }}></i>
            </div>
            <div>
              <h2 className={`mb-1 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                Gestion des Questions
              </h2>
              <p className={`mb-0 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                Administration des questions par classe, matière et évaluation
              </p>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className={`mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        {statistics.total_questions || questions.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Total
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="help-circle" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-primary">
                        {statistics.questions_qcm || questions.filter(q => q.type === 'QCM').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        QCM
                      </small>
                    </div>
                    <div className="text-primary">
                      <i data-feather="check-square" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-success">
                        {statistics.questions_libres || questions.filter(q => q.type === 'Réponse_libre').length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Libres
                      </small>
                    </div>
                    <div className="text-success">
                      <i data-feather="edit-3" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className={`border-0 shadow-sm ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0 text-info">
                        {classrooms.length}
                      </h3>
                      <small className={theme === "dark" ? "text-light" : "text-muted"}>
                        Classes
                      </small>
                    </div>
                    <div className="text-info">
                      <i data-feather="home" style={{ width: "24px", height: "24px" }}></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Panneau principal */}
        <Card className={`shadow-sm border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
          <Card.Header className={`border-0 ${theme === "dark" ? "bg-dark" : "bg-white"}`}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i data-feather="help-circle" className="text-primary me-2" style={{ width: "20px", height: "20px" }}></i>
                <span className={`fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                  Questions
                </span>
                
                {/* Switch de vue */}
                <ButtonGroup className="ms-3">
                    <Button
                        variant="outline-success"
                        size="sm"
                        as={Link}
                        to={`/formateur/questions/statistics`}
                    >
                        <i data-feather="bar-chart-2" style={{ width: "14px", height: "14px" }}></i>
                    </Button>

                  <Button
                    variant={viewMode === "grouped" ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={() => setViewMode("grouped")}
                    title="Vue groupée"
                  >
                    <i data-feather="layers" style={{ width: "14px", height: "14px" }}></i>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    title="Vue liste"
                  >
                    <i data-feather="list" style={{ width: "14px", height: "14px" }}></i>
                  </Button>
                </ButtonGroup>
              </div>
              
              <div className="d-flex gap-2 mt-2 mt-md-0">
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-primary"
                    className="d-flex align-items-center"
                    id="dropdown-export"
                  >
                    <i data-feather="download" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                    Exporter
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow-lg border-0" style={{ minWidth: "300px" }}>
                    <div className="p-3">
                      <h6 className="text-primary mb-3">
                        <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Rapport PDF
                      </h6>
                      <Form onSubmit={handleDownloadPdf} className="mb-3">
                        <Button type="submit" variant="primary" className="w-100">
                          <i data-feather="file-text" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Télécharger PDF
                        </Button>
                      </Form>

                      <hr />

                      <h6 className="text-success mb-3">
                        <i data-feather="file" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                        Fichier Excel
                      </h6>
                      <Form onSubmit={handleDownloadExcel}>
                        <Button type="submit" variant="success" className="w-100">
                          <i data-feather="file" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                          Télécharger Excel
                        </Button>
                      </Form>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>

                <Button variant="success" className="d-flex align-items-center" onClick={() => setShowAddModal(true)}>
                  <i data-feather="plus" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                  Nouvelle Question
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className={theme === "dark" ? "bg-dark" : "bg-white"}>
            {/* Filtres de recherche */}
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa" }}>
              <div className="row g-3">
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="search" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Recherche
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Énoncé, matricule..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="home" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Classe
                  </Form.Label>
                  <Form.Select
                    value={classroomFilter}
                    onChange={e => setClassroomFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes</option>
                    {classrooms.map(classroom => (
                      <option key={classroom.matricule} value={classroom.matricule}>
                        {classroom.name}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="book" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Matière
                  </Form.Label>
                  <Form.Select
                    value={matiereFilter}
                    onChange={e => setMatiereFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes</option>
                    {matieres.map(matiere => (
                      <option key={matiere.matricule} value={matiere.matricule}>
                        {matiere.nom}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="clipboard" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Évaluation
                  </Form.Label>
                  <Form.Select
                    value={evaluationFilter}
                    onChange={e => setEvaluationFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Toutes</option>
                    {evaluations.map(evaluation => (
                      <option key={evaluation.matricule} value={evaluation.matricule}>
                        {evaluation.titre}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="type" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Type
                  </Form.Label>
                  <Form.Select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  >
                    <option value="">Tous</option>
                    <option value="QCM">QCM</option>
                    <option value="Réponse_libre">Réponse libre</option>
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Label className={`small fw-bold ${theme === "dark" ? "text-light" : "text-dark"}`}>
                    <i data-feather="calendar" className="me-1" style={{ width: "14px", height: "14px" }}></i>
                    Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={createdAtFilter}
                    onChange={e => setCreatedAtFilter(e.target.value)}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                  />
                </div>
              </div>
            </div>

            {/* Affichage des résultats */}
            {viewMode === "grouped" ? renderGroupedView() : renderListView()}
          </Card.Body>
        </Card>

        {/* Modale d'ajout */}
        <Modal
          show={showAddModal}
          onHide={() => {
            setShowAddModal(false);
            resetForm();
          }}
          centered
          size="xl"
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Créer une Question</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              <Row className="g-3">
                {/* Sélection en cascade : Classe → Matière → Évaluation */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Classe *</Form.Label>
                    <Form.Select
                      value={form.matricule_classroom}
                      onChange={e => handleClassroomChange(e.target.value)}
                      isInvalid={!!errors.matricule_classroom}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    >
                      <option value="">Sélectionnez une classe</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.matricule} value={classroom.matricule}>
                          {classroom.name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.matricule_classroom}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Matière *</Form.Label>
                    <Form.Select
                      value={form.matricule_matiere}
                      onChange={e => handleMatiereChange(e.target.value)}
                      isInvalid={!!errors.matricule_matiere}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                      disabled={!form.matricule_classroom}
                    >
                      <option value="">
                        {form.matricule_classroom ? 'Sélectionnez une matière' : 'Choisissez d\'abord une classe'}
                      </option>
                      {matieresByClassroom.map(matiere => (
                        <option key={matiere.matricule} value={matiere.matricule}>
                          {matiere.nom}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.matricule_matiere}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Évaluation *</Form.Label>
                    <Form.Select
                      value={form.matricule_evaluation}
                      onChange={e => setForm({ ...form, matricule_evaluation: e.target.value })}
                      isInvalid={!!errors.matricule_evaluation}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                      disabled={!form.matricule_matiere}
                    >
                      <option value="">
                        {form.matricule_matiere ? 'Sélectionnez une évaluation' : 'Choisissez d\'abord une matière'}
                      </option>
                      {evaluationsByMatiere.map(evaluation => (
                        <option key={evaluation.matricule} value={evaluation.matricule}>
                          {evaluation.titre}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.matricule_evaluation}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Énoncé de la question *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Saisissez l'énoncé de votre question..."
                      required
                      value={form.enonce}
                      onChange={e => setForm({ ...form, enonce: e.target.value })}
                      isInvalid={!!errors.enonce}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.enonce}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Type *</Form.Label>
                    <Form.Select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      isInvalid={!!errors.type}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      required
                    >
                      <option value="QCM">QCM</option>
                      <option value="Réponse_libre">Réponse libre</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.type}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Points *</Form.Label>
                    <Form.Control
                      type="number"
                      min="0.5"
                      max="20"
                      step="0.5"
                      required
                      value={form.points}
                      onChange={e => setForm({ ...form, points: parseFloat(e.target.value) })}
                      isInvalid={!!errors.points}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.points}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {/* Champs spécifiques aux QCM */}
                {form.type === 'QCM' && (
                  <>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Choix A *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Premier choix"
                          required
                          value={form.choix_a}
                          onChange={e => setForm({ ...form, choix_a: e.target.value })}
                          isInvalid={!!errors.choix_a}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">{errors.choix_a}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Choix B *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Deuxième choix"
                          required
                          value={form.choix_b}
                          onChange={e => setForm({ ...form, choix_b: e.target.value })}
                          isInvalid={!!errors.choix_b}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">{errors.choix_b}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Choix C *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Troisième choix"
                          required
                          value={form.choix_c}
                          onChange={e => setForm({ ...form, choix_c: e.target.value })}
                          isInvalid={!!errors.choix_c}
                          className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        />
                        <Form.Control.Feedback type="invalid">{errors.choix_c}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </>
                )}

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      {form.type === 'QCM' ? 'Bonne réponse (sélectionnez le choix) *' : 'Réponse attendue *'}
                    </Form.Label>
                    {form.type === 'QCM' ? (
                      <Form.Select
                        value={form.bonne_reponse_general}
                        onChange={e => setForm({ ...form, bonne_reponse_general: e.target.value })}
                        isInvalid={!!errors.bonne_reponse_general}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                        required
                      >
                        <option value="">Choisissez la bonne réponse</option>
                        {form.choix_a && <option value={form.choix_a}>A: {form.choix_a}</option>}
                        {form.choix_b && <option value={form.choix_b}>B: {form.choix_b}</option>}
                        {form.choix_c && <option value={form.choix_c}>C: {form.choix_c}</option>}
                      </Form.Select>
                    ) : (
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Saisissez la réponse attendue ou les mots-clés..."
                        required
                        value={form.bonne_reponse_general}
                        onChange={e => setForm({ ...form, bonne_reponse_general: e.target.value })}
                        className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                      />
                    )}
                    <Form.Control.Feedback type="invalid">{errors.bonne_reponse_general}</Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Image (optionnelle)</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={e => setForm({ ...form, image: e.target.files[0] })}
                      isInvalid={!!errors.image}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      JPG, PNG, WEBP - Max 2MB
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Explication (optionnelle)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Explication de la réponse ou commentaire pour les étudiants..."
                      value={form.explication}
                      onChange={e => setForm({ ...form, explication: e.target.value })}
                      isInvalid={!!errors.explication}
                      className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    />
                    <Form.Control.Feedback type="invalid">{errors.explication}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
              <Button variant="secondary" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                Annuler
              </Button>
              <Button type="submit" variant="success">
                <i data-feather="save" className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Créer la Question
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Modale de duplication */}
        <Modal
          show={showDuplicateModal}
          onHide={() => setShowDuplicateModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Dupliquer la Question</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            {questionToDuplicate && (
              <>
                <div className="mb-3">
                  <h6>Question à dupliquer :</h6>
                  <div className={`p-3 rounded ${theme === "dark" ? "bg-secondary bg-opacity-25" : "bg-light"}`}>
                    <Badge bg={getTypeBadge(questionToDuplicate.type)} className="mb-2">
                      {questionToDuplicate.type}
                    </Badge>
                    <div className={theme === "dark" ? "text-light" : "text-dark"}>
                      {questionToDuplicate.enonce}
                    </div>
                    <small className="text-muted">
                      {questionToDuplicate.points} points
                    </small>
                  </div>
                </div>
                
                <Form.Group>
                  <Form.Label>Évaluation de destination *</Form.Label>
                  <Form.Select
                    value={duplicateForm.matricule_evaluation}
                    onChange={e => setDuplicateForm({ ...duplicateForm, matricule_evaluation: e.target.value })}
                    className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}
                    required
                  >
                    <option value="">Sélectionnez une évaluation</option>
                    {evaluations.map(evaluation => (
                      <option key={evaluation.matricule} value={evaluation.matricule}>
                        {evaluation.titre} ({evaluation.matiere?.nom} - {evaluation.matiere?.classroom?.name})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    La question sera copiée avec le préfixe [COPIE]
                  </Form.Text>
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDuplicateModal(false)}>
              Annuler
            </Button>
            <Button 
              variant="success" 
              onClick={handleDuplicateConfirmed}
              disabled={!duplicateForm.matricule_evaluation}
            >
              <i data-feather="copy" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Dupliquer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modale de confirmation de suppression */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
          contentClassName={theme === "dark" ? "bg-dark text-light" : ""}
        >
          <Modal.Header className={theme === "dark" ? "bg-dark text-light border-secondary" : ""} closeButton>
            <Modal.Title>Confirmation de Suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
            <p>Êtes-vous sûr de vouloir supprimer cette question ?</p>
            <div className="alert alert-warning">
              <i data-feather="alert-triangle" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Cette action est irréversible. Si des réponses sont associées à cette question, 
              la suppression sera refusée.
            </div>
          </Modal.Body>
          <Modal.Footer className={theme === "dark" ? "bg-dark text-light border-secondary" : ""}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDeleteConfirmed}>
              <i data-feather="trash-2" className="me-2" style={{ width: "16px", height: "16px" }}></i>
              Supprimer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Notifications Toast */}
        <ToastContainer position="bottom-end" className="p-3 position-fixed" style={{ zIndex: 1050 }}>
          <Toast
            show={showToast}
            onClose={() => setShowToast(false)}
            delay={3000}
            autohide
            bg={toastType === 'success' ? 'success' : 'danger'}
            className={theme === "dark" ? "text-light" : "text-white"}
          >
            <Toast.Header
              closeButton={false}
              className={`${toastType === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}`}
            >
              <strong className="me-auto">
                <i data-feather={toastType === 'success' ? 'check-circle' : 'x-circle'} className="me-2" style={{ width: "16px", height: "16px" }}></i>
                Notification
              </strong>
            </Toast.Header>
            <Toast.Body className={theme === "dark" ? "bg-dark text-light" : ""}>
              {toastMessage}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
    </FormateurLayout>
  );
}