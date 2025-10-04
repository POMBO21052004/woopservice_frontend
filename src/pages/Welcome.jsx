import React, { useState, useEffect } from 'react';
import ImageHero from '../assets/images/site/imageHero.jpg'
import Structure1 from '../assets/images/site/structure1.webp'
import Structure2 from '../assets/images/site/structure2.png'
import Structure3 from '../assets/images/site/structure3.webp'
import Structure4 from '../assets/images/site/structure4.webp'
import Structure5 from '../assets/images/site/structure5.webp'
import User1 from '../assets/images/site/user1.jpg'
import User2 from '../assets/images/site/user2.jpg'
import User3 from '../assets/images/site/user3.jpg'
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Navbar,
  Nav,
  Form,
  Badge
} from 'react-bootstrap';
import {
  FaGraduationCap,
  FaArrowRight,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaBookOpen,
  FaVideo,
  FaChalkboardTeacher,
  FaDesktop,
  FaLaptop,
  FaUserGraduate,
  FaPhoneAlt,
  FaWhatsapp,
  FaUserShield,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaStar,
  FaSchool,
  FaUsers,
  FaCertificate,
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaTrophy,
  FaRocket,
  FaLightbulb,
  FaFlask,
  FaCalculator,
  FaHistory,
  FaGlobe,
  FaLanguage,
  FaCode
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const WoopServiceLanding = () => {
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Gestion du scroll pour la navbar
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'services-preview', 'services', 'institutions', 'matieres', 'testimonials', 'cta', 'contact'];
      const scrollPosition = window.scrollY + 100;

      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const height = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + height) {
            setActiveNavItem(section);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  // Navbar Component
  const NavigationBar = () => (
    <Navbar
      expand="lg"
      fixed="top"
      className="py-3 bg-white shadow-sm"
      style={{ transition: 'all 0.3s ease' }}
    >
      <Container className="bg-white">
        <Navbar.Brand onClick={() => scrollToSection('home')} className="fw-bold d-flex align-items-center" style={{ cursor: 'pointer' }}>
          <FaGraduationCap className="me-2 text-primary" size={28} />
          <span className="fs-4 text-dark">Woop Service</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          <Nav className="mx-auto gap-3">
            {[
              { id: 'home', label: 'Accueil' },
              { id: 'services', label: 'Services' },
              { id: 'institutions', label: 'Partenaires' },
              { id: 'matieres', label: 'Matières' },
              { id: 'contact', label: 'Contact' }
            ].map(item => (
              <Nav.Link
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-3 fw-medium ${activeNavItem === item.id ? 'text-primary border-bottom border-primary border-2' : 'text-dark'}`}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
              >
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              className="fw-medium px-4"
              as={Link}
              to={`/login`}
            >
              Se connecter
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="fw-medium px-4"
              as={Link}
              to={`/register`}
            >
              S'inscrire
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );

  // Hero Section
  const HeroSection = () => (
    <section id="home" className="pt-5 mt-5" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '90vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="position-absolute w-100 h-100" style={{ 
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.3
      }}></div>
      <Container className="py-5 position-relative" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '90vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Row className="align-items-center min-vh-75 g-5">
          <Col lg={6} className="text-white">
            <Badge bg="light" text="primary" className="mb-4 px-3 py-2 fs-6">
              <FaCertificate className="me-2" />
              Plateforme certifiée et reconnue
            </Badge>
            <h1 className="display-3 fw-bold mb-4 lh-1">
              Votre réussite,<br />
              <span className="text-warning">notre mission</span>
            </h1>
            <p className="lead mb-4 opacity-90">
              Découvrez la meilleure plateforme d'apprentissage en ligne du Cameroun.
              Accédez à vos cours 24h/24 avec nos enseignants qualifiés et nos ressources pédagogiques de qualité.
            </p>
            <div className="d-flex flex-column flex-md-row gap-3 mb-5">
              <Button 
                variant="warning" 
                size="lg" 
                className="fw-medium px-4 py-3 shadow"
                style={{ borderRadius: '50px' }}
              >
                <FaRocket className="me-2" />
                Commencer maintenant
              </Button>
              <Button 
                variant="outline-light" 
                size="lg" 
                className="fw-medium px-4 py-3"
                style={{ borderRadius: '50px' }}
              >
                Découvrir les cours
                <FaArrowRight className="ms-2" />
              </Button>
            </div>
            
            {/* Stats */}
            <Row className="g-4">
              <Col xs={4}>
                <div className="text-center">
                  <div className="display-6 fw-bold text-warning">100+</div>
                  <small className="opacity-75">Étudiants actifs</small>
                </div>
              </Col>
              <Col xs={4}>
                <div className="text-center">
                  <div className="display-6 fw-bold text-warning">200+</div>
                  <small className="opacity-75">Cours disponibles</small>
                </div>
              </Col>
              <Col xs={4}>
                <div className="text-center">
                  <div className="display-6 fw-bold text-warning">95%</div>
                  <small className="opacity-75">Taux de réussite</small>
                </div>
              </Col>
            </Row>
          </Col>
          <Col lg={6}>
            <div className="position-relative">
              <Card className="shadow-lg rounded-4 overflow-hidden border-0">
                <img
                  src={ImageHero}
                  alt="Étudiants en ligne"
                  className="card-img-top w-100"
                  style={{ height: '400px', objectFit: 'cover' }}
                />
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                  <Button 
                    variant="light" 
                    size="lg" 
                    className="rounded-circle shadow"
                    style={{ width: '80px', height: '80px' }}
                  >
                    <FaPlay className="text-primary" size={24} />
                  </Button>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );

  // Services Preview Section
  const ServicesPreview = () => {
    const steps = [
      {
        icon: <FaUserGraduate size={32} />,
        title: "Inscrivez-vous et choisissez vos cours",
        description: "Créez votre profil étudiant et sélectionnez les matières qui vous intéressent"
      },
      {
        icon: <FaBookOpen size={32} />,
        title: "Suivez vos cours en ligne",
        description: "Accédez aux vidéos, exercices et ressources pédagogiques de qualité"
      },
      {
        icon: <FaTrophy size={32} />,
        title: "Obtenez votre certification",
        description: "Validez vos acquis avec nos évaluations et obtenez vos certificats"
      }
    ];

    return (
      <section id="services-preview" className="py-5 bg-light">
        <Container className="py-5">
          <div className="text-center mb-5">
            <Badge bg="primary" className="mb-3 px-3 py-2 fs-6">Comment ça marche</Badge>
            <h2 className="display-5 fw-bold mb-3">Apprendre en 3 étapes</h2>
            <p className="lead text-muted col-lg-8 mx-auto">
              Notre méthode d'apprentissage simple et efficace vous permet de progresser à votre rythme
            </p>
          </div>
          <Row className="g-4">
            {steps.map((step, index) => (
              <Col key={index} md={4}>
                <Card className="h-100 border-0 shadow-sm p-4 position-relative" style={{ borderRadius: '20px' }}>
                  <div className="position-absolute top-0 start-50 translate-middle">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                      <span className="fw-bold fs-4">{index + 1}</span>
                    </div>
                  </div>
                  <Card.Body className="pt-5 text-center">
                    <div className="text-primary mb-3 d-flex justify-content-center">
                      {step.icon}
                    </div>
                    <h4 className="fw-bold mb-3">{step.title}</h4>
                    <p className="text-muted">{step.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    );
  };

  // Services Section
  const ServicesSection = () => {
    const services = [
      {
        icon: <FaVideo size={40} />,
        title: "Cours intuitifs",
        description: "Des leçons interactives avec nos meilleurs professeurs dans un environnement numérique moderne.",
        features: ["Vidéos HD de qualité", "Supports pédagogiques", "Suivi personnalisé"],
        color: "primary"
      },
      {
        icon: <FaDesktop size={40} />,
        title: "Classe virtuelle",
        description: "Participez à des sessions en direct avec vos enseignants et vos camarades.",
        features: ["Sessions interactives", "Questions en temps réel", "Échanges enrichissants"],
        color: "success"
      },
      {
        icon: <FaCalendarAlt size={40} />,
        title: "Planning flexible",
        description: "Organisez votre temps d'apprentissage selon vos disponibilités.",
        features: ["Horaires adaptables", "Rappels automatiques", "Progression suivie"],
        color: "info"
      }
    ];

    return (
      <section id="services" className="py-5">
        <Container className="py-5">
          <div className="text-center mb-5">
            <Badge bg="primary" className="mb-3 px-3 py-2 fs-6">Nos Services</Badge>
            <h2 className="display-5 fw-bold mb-3">Un apprentissage adapté à vos besoins</h2>
            <p className="lead text-muted col-lg-8 mx-auto">
              Choisissez le mode d'apprentissage qui vous convient le mieux parmi notre gamme de services éducatifs
            </p>
          </div>
          <Row className="g-4">
            {services.map((service, index) => (
              <Col key={index} lg={4} md={6}>
                <Card className="h-100 border-0 shadow-sm position-relative overflow-hidden" style={{ borderRadius: '20px' }}>
                  <div className={`position-absolute top-0 end-0 bg-${service.color} opacity-10`} style={{ width: '100px', height: '100px', borderRadius: '0 20px 0 100%' }}></div>
                  <Card.Body className="p-4">
                    <div className={`text-${service.color} mb-3`}>
                      {service.icon}
                    </div>
                    <h4 className="fw-bold mb-3">{service.title}</h4>
                    <p className="text-muted mb-4">{service.description}</p>
                    <ul className="list-unstyled">
                      {service.features.map((feature, i) => (
                        <li key={i} className="d-flex align-items-center mb-2">
                          <FaStar className="text-warning me-2" size={12} />
                          <span className="text-muted">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant={`outline-${service.color}`} className="mt-3">
                      En savoir plus
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    );
  };

  // Institutions partenaires Section
  const InstitutionsSection = () => {
    const institutions = [
      {
        name: "Université de Douala",
        type: "Université publique",
        specialites: ["Sciences", "Lettres", "Économie"],
        image: Structure1,
        rating: 4.8,
        etudiants: 450
      },
      {
        name: "École Supérieure de Commerce",
        type: "École privée",
        specialites: ["Management", "Finance", "Marketing"],
        image: Structure2,
        rating: 4.9,
        etudiants: 280
      },
      {
        name: "Institut des Sciences Appliquées",
        type: "Institut spécialisé",
        specialites: ["Informatique", "Ingénierie", "Recherche"],
        image: Structure4,
        rating: 4.6,
        etudiants: 320
      },
      {
        name: "Centre de Formation Continue",
        type: "Centre de formation",
        specialites: ["Professionnalisation", "Certifications", "Reconversion"],
        image: Structure5,
        rating: 4.8,
        etudiants: 180
      },
      {
        name: "Lycée Technique de Douala",
        type: "Établissement secondaire",
        specialites: ["Sciences", "Littéraire", "Technique"],
        image: Structure3,
        rating: 4.7,
        etudiants: 850
      }
    ];

    return (
      <section id="institutions" className="py-5 bg-light">
        <Container className="py-5">
          <div className="text-center mb-5">
            <Badge bg="success" className="mb-3 px-3 py-2 fs-6">Nos Partenaires</Badge>
            <h2 className="display-5 fw-bold mb-3">Institutions éducatives partenaires</h2>
            <p className="lead text-muted col-lg-8 mx-auto">
              Découvrez notre réseau d'établissements d'enseignement certifiés et reconnus dans la région du Littoral
            </p>
          </div>
          
          <div className="position-relative">
            <div className="d-flex overflow-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>
                {`.d-flex.overflow-auto::-webkit-scrollbar { display: none; }`}
              </style>
              {institutions.map((institution, index) => (
                <div key={index} className="flex-shrink-0 me-4" style={{ minWidth: '350px' }}>
                  <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
                    <div className="position-relative">
                      <img
                        src={institution.image}
                        alt={institution.name}
                        className="card-img-top"
                        style={{ height: '200px', objectFit: 'cover', borderRadius: '20px 20px 0 0' }}
                      />
                      <Badge bg="success" className="position-absolute top-0 end-0 mt-3 me-3">
                        {institution.type}
                      </Badge>
                    </div>
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="fw-bold mb-0">{institution.name}</h5>
                        <div className="d-flex align-items-center">
                          <FaStar className="text-warning me-1" size={14} />
                          <span className="fw-medium">{institution.rating}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        {institution.specialites.map((spec, i) => (
                          <Badge key={i} bg="light" text="primary" className="me-2 mb-2">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center text-muted">
                          <FaUsers className="me-2" size={14} />
                          <small>{institution.etudiants} étudiants</small>
                        </div>
                        <div className="d-flex align-items-center text-muted">
                          <FaCertificate className="me-2" size={14} />
                          <small>Certifiée</small>
                        </div>
                      </div>
                      
                      <Button variant="primary" className="w-100" style={{ borderRadius: '50px' }}>
                        <FaBookOpen className="me-2" />
                        Découvrir les cours
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
            
            {/* Navigation arrows */}
            <Button 
              variant="light" 
              className="position-absolute top-50 start-0 translate-middle-y shadow rounded-circle"
              style={{ width: '50px', height: '50px', zIndex: 10 }}
            >
              <FaChevronLeft className="me-2" size={14} />
            </Button>
            <Button 
              variant="light" 
              className="position-absolute top-50 end-0 translate-middle-y shadow rounded-circle"
              style={{ width: '50px', height: '50px', zIndex: 10 }}
            >
              <FaChevronRight className="me-2" size={14} />
            </Button>
          </div>

          {/* <div className="text-center mt-5">
            <Button 
              variant="outline-success" 
              size="lg" 
              className="fw-medium px-5 py-3" 
              style={{ borderRadius: '50px' }}
              as={Link}
              to={`/devenir-partenaire`}
            >
              <FaSchool className="me-2" />
              Rejoindre notre réseau de partenaires
            </Button>
          </div> */}

        </Container>
      </section>
    );
  };

  // Subjects Section
  const SubjectsSection = () => {
    const matieres = [
      { name: "Mathématiques", icon: <FaCalculator /> },
      { name: "Sciences Physiques", icon: <FaFlask />},
      { name: "Français", icon: <FaLanguage />},
      { name: "Anglais", icon: <FaGlobe />,},
      { name: "Histoire-Géographie", icon: <FaHistory />},
      { name: "Informatique", icon: <FaCode />},
      { name: "Philosophie", icon: <FaLightbulb />},
      { name: "Économie", icon: <FaChalkboardTeacher />
        // , count: "14+ cours" 
      }
    ];

    return (
      <section id="matieres" className="py-5">
        <Container className="py-5">
          <div className="text-center mb-5">
            <Badge bg="info" className="mb-3 px-3 py-2 fs-6">Matières disponibles</Badge>
            <h2 className="display-5 fw-bold mb-3">Trouvez votre matière</h2>
            <p className="lead text-muted col-lg-8 mx-auto">
              Plus de 150 cours disponibles dans toutes les disciplines académiques pour tous les niveaux
            </p>
          </div>
          <Row className="g-4">
            {matieres.map((matiere, index) => (
              <Col key={index} lg={3} md={4} sm={6}>
                <Card className="h-100 border-0 shadow-sm text-center p-4 matiere-card" style={{ borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                  <Card.Body>
                    <div className="text-primary mb-3 fs-1">
                      {matiere.icon}
                    </div>
                    <h5 className="fw-bold mb-2">{matiere.name}</h5>
                    <p className="text-muted small mb-3">{matiere.count}</p>
                    <Button variant="outline-primary" size="sm" style={{ borderRadius: '50px' }}>
                      Explorer
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          <style>
            {`
              .matiere-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
              }
            `}
          </style>
        </Container>
      </section>
    );
  };

  // Testimonials Section
  // const TestimonialsSection = () => {
  //   const testimonials = [
  //     {
  //       quote: "Interface très intuitive ! J'ai pu accéder à mes cours en moins de 5 minutes. La qualité des vidéos est exceptionnelle.",
  //       author: "Marie Dupont",
  //       role: "Étudiante en Terminale",
  //       rating: 5,
  //       avatar: User1
  //     },
  //     {
  //       quote: "Les cours en ligne m'ont permis de rattraper mon retard en mathématiques. Les professeurs sont très pédagogues !",
  //       author: "Jean-Claude Mballa",
  //       role: "Étudiant universitaire",
  //       rating: 5,
  //       avatar: User2
  //     },
  //     {
  //       quote: "Excellente plateforme qui nous permet de mieux organiser nos cours et d'offrir un enseignement de qualité à nos étudiants.",
  //       author: "Dr. Sophie Ngako",
  //       role: "Enseignante partenaire",
  //       rating: 5,
  //       avatar: User3
  //     }
  //   ];

  //   return (
  //     <section id="testimonials" className="py-5 bg-light">
  //       <Container className="py-5">
  //         <div className="text-center mb-5">
  //           <Badge bg="warning" className="mb-3 px-3 py-2 fs-6">Témoignages</Badge>
  //           <h2 className="display-5 fw-bold mb-3">Ils nous font confiance</h2>
  //           <p className="lead text-muted col-lg-8 mx-auto">
  //             Découvrez l'expérience de nos étudiants et partenaires qui utilisent Woop Service au quotidien
  //           </p>
  //         </div>
  //         <Row className="g-4">
  //           {testimonials.map((testimonial, index) => (
  //             <Col key={index} lg={4} md={6}>
  //               <Card className="h-100 border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
  //                 <Card.Body>
  //                   <div className="d-flex mb-3">
  //                     {[...Array(testimonial.rating)].map((_, i) => (
  //                       <FaStar key={i} className="text-warning me-1" size={16} />
  //                     ))}
  //                   </div>
  //                   <blockquote className="blockquote mb-4">
  //                     <p className="text-muted fst-italic">"{testimonial.quote}"</p>
  //                   </blockquote>
  //                   <div className="d-flex align-items-center">
  //                     <img 
  //                       src={testimonial.avatar} 
  //                       alt={testimonial.author}
  //                       className="rounded-circle me-3"
  //                       style={{ width: '50px', height: '50px', objectFit: 'cover' }}
  //                     />
  //                     <div>
  //                       <div className="fw-bold">{testimonial.author}</div>
  //                       <small className="text-primary">{testimonial.role}</small>
  //                     </div>
  //                   </div>
  //                 </Card.Body>
  //               </Card>
  //             </Col>
  //           ))}
  //         </Row>
  //       </Container>
  //     </section>
  //   );
  // };

  // CTA Section
  const CTASection = () => (
    <section id="cta" className="py-5" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="position-absolute w-100 h-100" style={{
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.3
      }}></div>
      <Container className="py-5 position-relative" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="text-center text-white">
          <FaUserShield size={60} className="mb-4 text-warning" />
          <h2 className="display-5 fw-bold mb-3">
            Besoin d'aide pour <span className="text-warning">votre apprentissage</span> ?
          </h2>
          <p className="lead mb-5 col-lg-8 mx-auto opacity-90">
            Notre équipe pédagogique est disponible 24h/24 pour vous accompagner dans votre parcours d'apprentissage
          </p>
          <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mb-5">
            <Button variant="warning" size="lg" className="fw-medium px-4 py-3" style={{ borderRadius: '50px' }}>
              <FaBookOpen className="me-2" />
              Commencer mes cours
            </Button>
            <Button variant="outline-light" size="lg" className="fw-medium px-4 py-3" style={{ borderRadius: '50px' }}>
              <FaPhoneAlt className="me-2" />
              Être rappelé gratuitement
            </Button>
            <Button variant="success" size="lg" className="fw-medium px-4 py-3" style={{ borderRadius: '50px' }}>
              <FaWhatsapp className="me-2" />
              Support WhatsApp
            </Button>
          </div>
          <Card className="bg-white bg-opacity-10 border-0 text-center p-4 mx-auto" style={{ maxWidth: '700px', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>
            <p className="mb-2 fw-medium text-warning fs-5">
              Accompagnement pédagogique gratuit
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-4 text-white">
              <span className="d-flex align-items-center opacity-90">
                <span className="rounded-circle bg-warning me-2" style={{ width: '8px', height: '8px' }}></span>
                Aide au choix des matières
              </span>
              <span className="d-flex align-items-center opacity-90">
                <span className="rounded-circle bg-warning me-2" style={{ width: '8px', height: '8px' }}></span>
                Planning personnalisé
              </span>
              <span className="d-flex align-items-center opacity-90">
                <span className="rounded-circle bg-warning me-2" style={{ width: '8px', height: '8px' }}></span>
                Support technique 24h/24
              </span>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );

  // Contact Section
  const ContactSection = () => (
    <section id="contact" className="py-5">
      <Container className="py-5">
        <div className="text-center mb-5">
          <Badge bg="primary" className="mb-3 px-3 py-2 fs-6">Contact</Badge>
          <h2 className="display-5 fw-bold mb-3">Restons en contact</h2>
          <p className="lead text-muted col-lg-8 mx-auto">
            Notre équipe pédagogique est à votre écoute pour répondre à toutes vos questions et vous accompagner
          </p>
        </div>
        <Row className="g-5">
          <Col lg={6}>
            <Card className="h-100 border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
              <Card.Body>
                <h3 className="h4 fw-bold mb-4">Informations de contact</h3>
                
                <div className="d-flex align-items-start mb-4 p-3 bg-light rounded-3">
                  <div className="bg-primary text-white rounded-circle p-2 me-3 flex-shrink-0">
                    <FaMapMarkerAlt size={20} />
                  </div>
                  <div>
                    <h5 className="fw-medium mb-1">Siège social</h5>
                    <p className="text-muted mb-0">
                      {/* Rue 1.234, Quartier Papas Mont Sinai<br /> */}
                      Douala, Région du Littoral
                      <br />Cameroun</p>
                  </div>
                </div>

                <div className="d-flex align-items-start mb-4 p-3 bg-light rounded-3">
                  <div className="bg-success text-white rounded-circle p-2 me-3 flex-shrink-0">
                    <FaPhone size={20} />
                  </div>
                  <div>
                    <h5 className="fw-medium mb-1">Téléphone</h5>
                    <p className="text-muted mb-0">+237 621 09 04 90</p>
                  </div>
                </div>

                <div className="d-flex align-items-start mb-4 p-3 bg-light rounded-3">
                  <div className="bg-info text-white rounded-circle p-2 me-3 flex-shrink-0">
                    <FaEnvelope size={20} />
                  </div>
                  <div>
                    <h5 className="fw-medium mb-1">Email</h5>
                    <p className="text-muted mb-0">
                      woopsadi@gmail.com
                      {/* <br />support@woopservice.cm */}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <h5 className="fw-medium mb-3">Suivez-nous</h5>
                  <div className="d-flex gap-3">
                    <Button variant="outline-primary" className="rounded-circle" style={{ width: '45px', height: '45px' }}>
                      <FaFacebook size={20} />
                    </Button>
                    <Button variant="outline-info" className="rounded-circle" style={{ width: '45px', height: '45px' }}>
                      <FaTwitter size={20} />
                    </Button>
                    <Button variant="outline-primary" className="rounded-circle" style={{ width: '45px', height: '45px' }}>
                      <FaLinkedin size={20} />
                    </Button>
                    <Button variant="outline-danger" className="rounded-circle" style={{ width: '45px', height: '45px' }}>
                      <FaInstagram size={20} />
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card className="h-100 border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
              <Card.Body>
                <h3 className="h4 fw-bold mb-4">Envoyez-nous un message</h3>
                <Form>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Nom complet</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="Votre nom complet"
                          className="py-3"
                          style={{ borderRadius: '10px' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Email</Form.Label>
                        <Form.Control 
                          type="email" 
                          placeholder="votreemail@gmail.com"
                          className="py-3"
                          style={{ borderRadius: '10px' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Téléphone</Form.Label>
                        <Form.Control 
                          type="tel" 
                          placeholder="+237 6XX XXX XXX"
                          className="py-3"
                          style={{ borderRadius: '10px' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Type de demande</Form.Label>
                        <Form.Select className="py-3" style={{ borderRadius: '10px' }}>
                          <option>Choisir le type</option>
                          <option>Orientation scolaire</option>
                          <option>Support technique</option>
                          <option>Partenariat</option>
                          <option>Autre</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Message</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={5} 
                      placeholder="Décrivez votre demande en détail..."
                      style={{ borderRadius: '10px' }}
                    />
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-100 fw-medium py-3"
                    style={{ borderRadius: '50px' }}
                  >
                    <FaEnvelope className="me-2" />
                    Envoyer le message
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );

  // Footer Component
  const FooterSection = () => (
    <footer className="py-5 text-white" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Container className="py-4" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Row className="g-4 mb-4">
          <Col lg={4} md={6}>
            <div className="d-flex align-items-center mb-3">
              <FaGraduationCap className="text-primary me-2" size={32} />
              <h3 className="h4 fw-bold mb-0">Woop Service</h3>
            </div>
            <p className="text-light opacity-75 mb-4">
              La première plateforme d'apprentissage en ligne au Cameroun. 
              Connectant étudiants et enseignants pour une éducation de qualité accessible à tous.
            </p>
            <div className="d-flex gap-3">
              <Button variant="outline-light" size="sm" className="rounded-circle" style={{ width: '40px', height: '40px' }}>
                <FaFacebook />
              </Button>
              <Button variant="outline-light" size="sm" className="rounded-circle" style={{ width: '40px', height: '40px' }}>
                <FaTwitter />
              </Button>
              <Button variant="outline-light" size="sm" className="rounded-circle" style={{ width: '40px', height: '40px' }}>
                <FaLinkedin />
              </Button>
              <Button variant="outline-light" size="sm" className="rounded-circle" style={{ width: '40px', height: '40px' }}>
                <FaInstagram />
              </Button>
            </div>
          </Col>
          
          <Col lg={2} md={6}>
            <h4 className="h6 fw-bold mb-3 text-warning">Navigation</h4>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a 
                  href="#home" 
                  onClick={() => scrollToSection('home')} 
                  className="text-light opacity-75 text-decoration-none"
                  style={{ cursor: 'pointer' }}
                >
                  Accueil
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="#services" 
                  onClick={() => scrollToSection('services')} 
                  className="text-light opacity-75 text-decoration-none"
                  style={{ cursor: 'pointer' }}
                >
                  Services
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="#institutions" 
                  onClick={() => scrollToSection('institutions')} 
                  className="text-light opacity-75 text-decoration-none"
                  style={{ cursor: 'pointer' }}
                >
                  Partenaires
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="#matieres" 
                  onClick={() => scrollToSection('matieres')} 
                  className="text-light opacity-75 text-decoration-none"
                  style={{ cursor: 'pointer' }}
                >
                  Matières
                </a>
              </li>
            </ul>
          </Col>

          <Col lg={3} md={6}>
            <h4 className="h6 fw-bold mb-3 text-warning">Services</h4>
            <ul className="list-unstyled">
              <li className="mb-2">
                <span className="text-light opacity-75">Cours en vidéo</span>
              </li>
              <li className="mb-2">
                <span className="text-light opacity-75">Classes virtuelles</span>
              </li>
              <li className="mb-2">
                <span className="text-light opacity-75">Suivi personnalisé</span>
              </li>
              <li className="mb-2">
                <span className="text-light opacity-75">Certifications</span>
              </li>
              <li className="mb-2">
                <span className="text-light opacity-75">Support pédagogique</span>
              </li>
            </ul>
          </Col>

          <Col lg={3} md={6}>
            <h4 className="h6 fw-bold mb-3 text-warning">Contact</h4>
            <div className="text-light opacity-75">
              <div className="d-flex align-items-center mb-2">
                <FaMapMarkerAlt className="me-2 text-primary" />
                <small>Papas, Douala, Cameroun</small>
              </div>
              <div className="d-flex align-items-center mb-2">
                <FaEnvelope className="me-2 text-primary" />
                <small>woopsadi@gmail.com</small>
              </div>
              <div className="d-flex align-items-center mb-2">
                <FaPhone className="me-2 text-primary" />
                <small+237 621 09 04 90</small>
              </div>
              <div className="d-flex align-items-center">
                <FaWhatsapp className="me-2 text-success" />
                <small>Support WhatsApp 24h/24</small>
              </div>
            </div>
          </Col>
        </Row>
        
        <hr className="border-secondary my-4" />
        
        <Row className="align-items-center">
          <Col md={6}>
            <p className="text-light opacity-75 mb-0">
              &copy; {new Date().getFullYear()} Woop Service Cameroun. Tous droits réservés.
            </p>
          </Col>
          <Col md={6}>
            <div className="d-flex justify-content-md-end gap-4">
              <a href="#" className="text-light opacity-75 text-decoration-none small">
                Politique de confidentialité
              </a>
              <a href="#" className="text-light opacity-75 text-decoration-none small">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-light opacity-75 text-decoration-none small">
                Mentions légales
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );

  return (
    <>
      <NavigationBar />
      <HeroSection />
      <ServicesPreview />
      <ServicesSection />
      <InstitutionsSection />
      <SubjectsSection />
      <TestimonialsSection />
      <CTASection />
      <ContactSection />
      <FooterSection />
    </>
  );
};

export default WoopServiceLanding;
