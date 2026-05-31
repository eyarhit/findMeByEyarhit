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

function createEmptyCompetences(): Competences {
  return {
    langages_balisage: [],
    programmation: [],
    frameworks: [],
    bibliotheques: [],
    api: [],
    base_donnees: [],
    systeme_exploitation: [],
    conception: [],
    methodologies: [],
    design_patterns: [],
    architectures: [],
    outils: [],
  };
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
      this.cvDataDevOps.user = {
        firstname: this.userData.firstName ?? '',
        lastname: this.userData.lastName ?? '',
        address: this.userData.address ?? '',
        phone: this.userData.phone ?? '',
        email: this.email || this.userData.email || '',
        linkedin: this.userData.linkedinUrl ?? '',
        github: this.userData.githubUrl ?? '',
      };
      this.cvDataDev.user = {
        firstname: this.userData.firstName ?? '',
        lastname: this.userData.lastName ?? '',
      };
    }

    if (this.cvData?.titreDeProfil) {
      this.cvDataDevOps.title = this.cvData.titreDeProfil;
      this.cvDataDev.title = this.cvData.titreDeProfil;
    }

    const competenceSource = Array.isArray(this.cvData?.competences)
      ? this.cvData.competences[0]
      : this.cvData?.competences;

    if (competenceSource) {
      this.cvDataDevOps.competences = {
        langages_balisage: this.splitCompetences(competenceSource.langageBallsage),
        programmation: this.splitCompetences(competenceSource.languageProgrammation),
        frameworks: this.splitCompetences(competenceSource.framework),
        bibliotheques: this.splitCompetences(competenceSource.bibliotheque),
        api: this.splitCompetences(competenceSource.api),
        base_donnees: this.splitCompetences(competenceSource.db),
        systeme_exploitation: this.splitCompetences(competenceSource.systemExploitation),
        conception: this.splitCompetences(competenceSource.conception),
        methodologies: this.splitCompetences(competenceSource.methodologie),
        design_patterns: this.splitCompetences(competenceSource.designPattern),
        architectures: this.splitCompetences(competenceSource.architechture),
        outils: this.splitCompetences(competenceSource.outils),
      };
    } else {
      this.cvDataDevOps.competences = createEmptyCompetences();
    }

    if (this.cvData?.educations?.length) {
      const educations: Education[] = this.cvData.educations.map((edu: any) => ({
        diploma: edu.diplome,
        institution: edu.university,
        year: this.formatEducationYear(edu.dateDebut, edu.dateFin),
        dateDebut: edu.dateDebut,
        dateFin: edu.dateFin,
      }));
      this.cvDataDev.educations = [...educations];
      this.cvDataDevOps.educations = [...educations];
    } else {
      this.cvDataDev.educations = [];
      this.cvDataDevOps.educations = [];
    }

    if (this.cvData?.langues?.length) {
      const languages: Language[] = this.cvData.langues.map((lang: any) => ({
        name: lang.name,
        level: lang.niveau,
      }));
      this.cvDataDevOps.languages = [...languages];
    } else {
      this.cvDataDevOps.languages = [];
    }

    if (this.cvData?.experiences?.length) {
      const experiences = this.cvData.experiences.map((exp: any) => ({
        company: exp.entreprise || '',
        client: exp.client || '',
        period: this.formatExperiencePeriod(exp.dateDebut, exp.dateFin),
        projects: [
          {
            name: exp.nomProjet || '',
            description: exp.description || '',
            workDone: exp.travailRealise || '',
            environment: exp.environnement || '',
            technologies: exp.technologies || '',
            equipe: exp.equipe || '',
          },
        ],
      }));
      this.cvDataDev.experiences = [...experiences];
      this.cvDataDevOps.experiences = [...experiences];
    } else {
      this.cvDataDev.experiences = [];
      this.cvDataDevOps.experiences = [];
    }

    this.syncSelectedTemplateCvData();
  }

  private syncSelectedTemplateCvData(): void {
    if (!this.selectedTemplate) {
      return;
    }
    this.selectedTemplate.cvData =
      this.selectedTemplate.thumbnail === 'developpeur'
        ? this.cvDataDev
        : this.cvDataDevOps;
    this.templateService.setSelectedTemplate(this.selectedTemplate);
  }

  // CV Data — valeurs vides par défaut ; remplies depuis l'API dans updateCvDataWithUserInfo()
  cvDataDev = {
    user: {
      firstname: '',
      lastname: '',
    },
    title: '',
    experienceYears: 0,
    competences: {
      developpement: [] as string[],
      bdd: [] as string[],
      integration: [] as string[],
      methodes: [] as string[],
      outils: [] as string[],
    },
    projets: [] as { name: string; description: string }[],
    experiences: [] as any[],
    educations: [] as Education[],
    languages: [] as Language[],
  };

  cvDataDevOps = {
    user: {
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      github: '',
    },
    title: '',
    profil: '',
    competences: createEmptyCompetences(),
    languages: [] as Language[],
    educations: [] as Education[],
    experiences: [] as any[],
  };
  
  selectTemplate(template: any): void {
    this.templates.forEach(t => t.selected = false);
    template.selected = true;
    this.selectedTemplate = template;
    this.currentStep = 'preview';
    
    this.syncSelectedTemplateCvData();
    this.templateService.setSelectedTemplate(this.selectedTemplate);
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