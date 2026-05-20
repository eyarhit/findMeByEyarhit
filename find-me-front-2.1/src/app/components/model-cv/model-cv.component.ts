import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TemplateService } from '../../services/template.service';
import { Router } from '@angular/router';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { HttpParams } from '@angular/common/http';
import { CvService } from '../../services/cv.service';
import { PdfService } from '../../services/pdf.service';
import { AuthService } from '../../services/auth.service';


interface Language {
  name: string;
  level: string;
}
interface Education {
  diploma: string;
  institution: string;
  year: string;
  dateDebut: string 
  dateFin: string ;
}
interface Competences {
  langages_balisage: string[];
  programmation: string[];
  frameworks: string[];
  bibliotheques: string[];
  api: string[];
  base_donnees: string[];
  systeme_exploitation: string[];
  conception: string[];
  methodologies: string[];
  design_patterns: string[];
  architectures: string[];
  outils: string[];
}
@Component({
  selector: 'app-model-cv',
  templateUrl: './model-cv.component.html',
  styleUrls: ['./model-cv.component.scss']
})
export class ModelCvComponent implements OnInit {
  showConfirmation = false;
  userData: any;
  cvData: any;
  selectedTemplate: any = null;
  currentStep: 'selection' | 'preview' = 'preview';
  headerImageUrl = 'assets/images/Modele-cv/DPC-1-BLEU.PNG';
  userId: number | null = null;
  email: any;

  templates = [
    // {
    //   id: 1,
    //   name: 'Développeur Full Stack',
    //   description: 'Modèle pour développeurs Java/JEE',
    //   thumbnail: 'developpeur',
    //   selected: false,
    //   headerImage: 'assets/images/Modele-cv/DPC-1-BLEU.PNG'
    // },
    {
      id: 1,
      name: 'Développeur Full Stack',
      description: 'Modèle pour développeurs ',
      thumbnail: 'devops',
      selected: false,
      headerImage: 'assets/images/Modele-cv/DPC-2-GOLD.PNG'
    }
  ];

  private selectedTemplateSubject = new BehaviorSubject<any>(null);
  selectedTemplate$ = this.selectedTemplateSubject.asObservable();

  constructor(
    private templateService: TemplateService,
    private router: Router,
    private apiRoutingServiceUser: ApiRoutingServiceUser,
    private cvService: CvService,
    private pdfService: PdfService
    , private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const decoded = this.authService.getDecodedToken();
    this.userId = decoded?.userId ?? null;
    this.email = decoded?.email ?? null;    
    console.error("email",this.email);
    
    if (this.email) {
      this.loadUser(this.email);
    }   
    
    if (this.userId) {
      this.loadCv(this.userId);
      
      // S'abonner aux mises à jour du CV
      this.cvService.cvUpdated.subscribe(updatedCv => {
        if (updatedCv.userId === this.userId) {
          this.cvData = updatedCv;
          this.updateCvDataWithUserInfo();
        }
      });
    }
    
    if (this.templates.length > 0) {
      const defaultTemplate = this.templates[0];
      this.selectTemplate(defaultTemplate);
    }
  }

  private loadUser(email: string): void {
    this.apiRoutingServiceUser.requestGetApi(
      '/find-user-by-email', 
      new HttpParams().set('email', this.email)
    ).subscribe({
      next: (response) => {
        this.userData = response;
        this.updateCvDataWithUserInfo();   
        //console.log('User loaded:', response);
      },
      error: (error) => {
        console.error('Failed to get user information:', error);
      }
    });
  }

  private loadCv(userId: number): void {
    this.cvService.getCvByUserId(userId).subscribe({
      next: (response) => {
       // console.log('CV loaded:', response);
        this.cvData = response;
        this.updateCvDataWithUserInfo(); 
      },
      error: (error) => console.error('Error loading CV:', error)
    });
  }

  

  
  private formatEducationYear(dateDebut: string | null, dateFin: string | null): string {
    if (!dateDebut && !dateFin) return '';
    const startYear = dateDebut ? new Date(dateDebut).getFullYear() : '';
    const endYear = dateFin ? new Date(dateFin).getFullYear() : 'Présent';
    return startYear ? `${startYear} - ${endYear}` : endYear.toString();
  }

  private splitCompetences(input: string | string[] | undefined): string[] {
    if (!input) return [];
    
    // If it's already an array, return it
    if (Array.isArray(input)) return input;
    
    // Split by comma first, then flatten any splits from spaces
    return input.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  private formatExperiencePeriod(dateDebut: string, dateFin: string): string {
    if (!dateDebut && !dateFin) return '';
    
    const frenchMonths = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    
    const startDate = dateDebut ? new Date(dateDebut) : null;
    const endDate = dateFin ? new Date(dateFin) : null;
    
    const startMonth = startDate ? frenchMonths[startDate.getMonth()] : '';
    const startYear = startDate ? startDate.getFullYear() : '';
    const endMonth = endDate ? frenchMonths[endDate.getMonth()] : '';
    const endYear = endDate ? endDate.getFullYear() : '';
    
    const startStr = startDate ? `${startMonth} ${startYear}` : '';
    const endStr = endDate ? 
      (dateFin === 'Present' ? 'Présent' : `${endMonth} ${endYear}`) : 
      'Présent';
      
    return startStr ? `${startStr} - ${endStr}` : endStr;
  }
  private updateCvDataWithUserInfo(): void {
    if (this.userData) {
      if (this.cvData?.titreDeProfil) {
      this.cvDataDevOps.title=this.cvData.titreDeProfil;
    }
      // console.log("bile",this.cvDataDevOps.title)
      this.cvDataDevOps.user = {
        firstname: this.userData.firstName,
        lastname: this.userData.lastName,
        address: this.cvDataDevOps.user.address, // Keep existing address
        phone: this.userData.phone,     // Keep existing phone
        email: this.email|| this.cvDataDevOps.user.email, // Use API email or fallback
        linkedin: this.cvDataDevOps.user.linkedin, // Keep existing linkedin
        github: this.cvDataDevOps.user.github    // Keep existing github
      };

      
            
      if (this.cvData?.educations) {
        const educations: Education[] = this.cvData.educations.map((edu: any) => ({
          diploma: edu.diplome,
          institution: edu.university,
          year: this.formatEducationYear(edu.dateDebut, edu.dateFin),
          dateDebut: edu.dateDebut,
          dateFin: edu.dateFin
        }));
        this.cvDataDev.educations = [...educations];
        this.cvDataDevOps.educations = [...educations];
      }
      if (this.cvData?.langues) {
        const languages: Language[] = this.cvData.langues.map((lang: any) => ({
          name: lang.name,
          level: lang.niveau
        }));
        this.cvDataDevOps.languages = [...languages];  
      }

      if (this.cvData?.competences && this.cvData?.competences.length > 0) {
        const transformedCompetences: Competences = {
          langages_balisage: this.splitCompetences(this.cvData.competences[0].langageBallsage),
          programmation: this.splitCompetences(this.cvData.competences[0].languageProgrammation),
          frameworks: this.splitCompetences(this.cvData.competences[0].framework),
          bibliotheques: this.splitCompetences(this.cvData.competences[0].bibliotheque),
          api: this.splitCompetences(this.cvData.competences[0].api),
          base_donnees: this.splitCompetences(this.cvData.competences[0].db),
          systeme_exploitation: this.splitCompetences(this.cvData.competences[0].systemExploitation),
          conception: this.splitCompetences(this.cvData.competences[0].conception),
          methodologies: this.splitCompetences(this.cvData.competences[0].methodologie),
          design_patterns: this.splitCompetences(this.cvData.competences[0].designPattern),
          architectures: this.splitCompetences(this.cvData.competences[0].architechture),
          outils: this.splitCompetences(this.cvData.competences[0].outils)
        };
      
        this.cvDataDevOps.competences = transformedCompetences;
      }      
      if (this.cvData?.experiences) {
        const experiences = (this.cvData.experiences || []).map((exp: any) => ({
          company: exp.entreprise || '',
          client: exp.client || '',
          period: this.formatExperiencePeriod(exp.dateDebut, exp.dateFin),
          projects: [
            {
              name: exp.nomProjet || '',
              description: exp.description || '',
              workDone: exp.travailRealise || '',
              environment: exp.environnement || '',
              technologies: exp.technologies || '' ,
              equipe:exp.equipe || '',// Add if available in your data
            }
          ]
        }));
    
        this.cvDataDev.experiences = [...experiences];
        this.cvDataDevOps.experiences = [...experiences];
    
      }
    }
  }

  // CV Data
  cvDataDev = {
    user: {
      firstname: '',
      lastname: ''
    },
    title: 'Développeur Java, JEE',
    experienceYears: 3,
    competences: {
      developpement: ['Java', 'JEE', 'HTML', 'CSS', 'Typescript', 'Spring boot', 'Spring Security', 'API REST', 'SOAP'],
      bdd: ['MySQL', 'PostgreSQL'],
      integration: ['GIT', 'GITLAB', 'GITHUB'],
      methodes: ['Agile', 'Scrum'],
      outils: ['VS Code', 'Postman', 'Eclipse', 'IntelliJ', 'Swagger']
    },
    projets: [
      {
        name: 'CVThèque',
        description: 'Développement d\'une plateforme en ligne permettant aux candidats de déposer facilement leur CV'
      },
      {
        name: 'SMARTSCHOOL',
        description: 'Application web pour gérer des établissements primaires pédagogiques et administratifs'
      }
    ],
    experiences: [
      {
        position: 'Ingénieur Full Stack',
        company: 'Digital Power Consulting',
        period: 'Déc. 2021 - présent',
        description: 'Développement d\'applications web full stack',
        projects: [
          {
            name: 'CVThèque',
            description: 'Plateforme de gestion de CV en ligne',
            technologies: 'Angular, Spring Boot, MySQL'
          }
        ]
      }
    ],
    educations: [
      {
        diploma: 'Diplôme d\'ingénieur en Informatique',
        institution: 'Ecole Supérieure d\'Ingénierie et de Technologies Tunis',
        year: 'Depuis 2022'
      },
      {
        diploma: 'Licence Fondamentale en science de L\'informatique',
        institution: 'ISTIC',
        year: '2022'
      },
      {
        diploma: 'Etude préparatoires à l\'ingénierie en mathématique et en physique',
        institution: 'IPEIN',
        year: '2019'
      }
    ],
    languages: [] as Language[] // Initialize as empty array
  };

  cvDataDevOps = {
    user: {
      firstname: 'Nom',
      lastname: 'Prénom',
      email: 'Champ Email',
      phone: 'Champ Numéro',
      address: '',
      linkedin: '',
      github: ''
    },
    title: '',
    profil: ``,
    competences: {
      langages_balisage: ['HTML5', 'XML'],
      programmation: ['PHP5', 'PHP7', 'PHP8', 'JavaScript', 'Java', 'Node.js'],
      frameworks: [
        'Laravel',
        'PHPUnit',
        'REST API',
        'AUTH',
        'Symfony',
        'API Platform',
        'Bootstrap',
        'CSS3',
        'Angular',
        'Zend'
      ],
      bibliotheques: ['ReactJs', 'PDFJs', 'Ajax', 'jQuery', 'FullCalendar', 'Axios'],
      api: [
        'REST (Google, Facebook, Firebase, Tableau, Payment Gateway, SMS, CloudConvert, Monetico)',
        'GRAPH (SharePoint API)',
        'SOAP'
      ],
      base_donnees: ['MySQL', 'SQLite', 'PostgreSQL', 'MongoDB', 'Firebase'],
      systeme_exploitation: ['Windows', 'Ubuntu', 'macOS'],
      conception: ['UML'],
      methodologies: ['Agile Scrum'],
      design_patterns: ['MVC', 'SOLID'],
      architectures: ['MVC', 'Microservice'],
      outils: [
        'Git',
        'GitHub',
        'Bitbucket',
        'SVN',
        'CodeCommit AWS',
        'JIRA',
        'MySQL Workbench',
        'Composer',
        'NPM',
        'VSCode',
        'PHPStorm',
        'MAMP',
        'XAMPP',
        'FileZilla',
        'Docker'
      ]
    },
    languages: [
      { name: "Anglais", level: "Technique" }
    ],
    educations: [
      {
        diploma: "Licence développement des systèmes d'Informations",
        institution: "Institut Supérieur des études Technologiques",
        year: "2018"
      }
    ],
    experiences: [
      {
        company: "Nostatik Media",
        period: "Décembre 2021 - Présent",
        projects: [
          {
            name: "Migration de la plateforme web Symmetryk de Javascript vers React",
            description:
              `- Découpage des interfaces en composants indépendants.
               - Migration des interfaces utilisateurs (Authentification, Création fichier PDF, …).
               - Migration du module Digital Assets utilisant Tree-React.
               - Amélioration de l'expérience utilisateur avec mises à jour dynamiques.
               - Implémentation du rendu virtuel et du chargement progressif.`,
            environment:
              "Laravel 9, Javascript, Axios, React 18, Tailwind CSS, Docker, GIT, JIRA, PHPStorme, Redux",
            equipe:""
          },
         
        ]
      }]
    
  };
  
  selectTemplate(template: any): void {
    this.templates.forEach(t => t.selected = false);
    template.selected = true;
    this.selectedTemplate = template;
    this.currentStep = 'preview';
    
    this.selectedTemplate.cvData = template.thumbnail === 'developpeur' 
      ? this.cvDataDev 
      : this.cvDataDevOps;
      
    this.templateService.setSelectedTemplate(template);
  }

  prevStep(): void {
    this.currentStep = 'selection';
  }



  getFullName(): string {
    const data = this.selectedTemplate?.thumbnail === 'developpeur' 
      ? this.cvDataDev 
      : this.cvDataDevOps;
    return `${data.user?.firstname} ${data.user?.lastname}`;
  }

  getCurrentData(): any {
    return this.selectedTemplate?.thumbnail === 'developpeur' 
      ? this.cvDataDev 
      : this.cvDataDevOps;
  }
}