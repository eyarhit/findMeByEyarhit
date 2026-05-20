import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CarteProfilCandiatComponent } from "../carte-profil-candiat/carte-profil-candiat.component";
import { ListDocumentComponent } from "../list-document/list-document.component";
import { CvService } from '../../services/cv.service';
import { AuthService } from '../../services/auth.service';
import { Education } from '../../_model/Education';
import { Cv } from '../../_model/Cv';
import { Competence } from '../../_model/Competence';
import { Langue } from '../../_model/Langue';
import { Experience } from '../../_model/Experience';
import { CodingameService } from '../../services/codingame.service';
import Chart from 'chart.js/auto';
import { LanguesService } from '../../services/langues.service';
import { EducationService } from '../../services/education.service';
import { ExperienceService } from '../../services/experience.service';
import { CompetenceService } from '../../services/competence.service';


@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss'],
})
export class ProfilComponent implements OnInit {
  /** Désactivé : masque la carte et la popup Codingame sur le profil (passer à true pour réactiver). */
  readonly showCodingameOnProfil = false;

  @Input()  profileRole : string =""
  @Input()  profileEmail : string =""
  @Input() profileId : number | null = null;
  cvData!: Cv;
  role: string | null = null;
  showAcademicPopup: boolean = false;
  cvCompetence!: Competence;
  cvLangues: Langue[] = [];
  form: FormGroup;
  languageFormArray: FormArray;

  showLanguagePopup: boolean = false;
  languageForm: FormGroup;
  languages: string[] = ['Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien'];
  showProfessionalExperiencePopup: boolean = false;
  professionalExperienceForm: FormGroup;
  codingameResults: any[] = [];
  showCodingameResultsPopup: boolean = false;
  frameworkFilter: string = '';
  levelFilter: string = '';
  sortBy: string = 'date';
  filteredCodingameResults: any[] = [];
  totalYears: number = 0;
  userId: number = 0;
 

  constructor(public fb: FormBuilder, private router: Router, private cvService: CvService,
    private authService: AuthService, private codingameService: CodingameService ,   private educationService: EducationService,
    private languesService: LanguesService  , private experienceService: ExperienceService,   private competenceService: CompetenceService


  ) {

    
    
    this.form = this.fb.group({
      academicFormations: this.fb.array([])
    });

    this.languageForm = this.fb.group({
      language: ['', Validators.required],
      level: ['', Validators.required]
    });

    this.professionalExperienceForm = this.fb.group({
      professionalExperiences: this.fb.array([])
    });

    this.languageFormArray = this.fb.array([]);

  }

  ngOnInit(): void {
   let id: number | null;

if (this.profileId) {
  id = this.profileId;
} else {
  id = this.authService.getUserId();
}

this.role = this.authService.getRole();

if (id !== null) {
  this.userId = id;
if((this.role!='ESN_ADMIN' && this.role!='ESN_COMMERCIAL') || (this.profileRole!='ESN_ADMIN'&& this.profileRole!='ESN_COMMERCIAL' && this.profileRole!='')){
  this.gettotalexperience()  
  this.loadCv();
    this.addAcademicFormation();
    this.loadEducations();
    this.loadCompetence();
    this.loadLangues();

    
    this.languageFormArray = this.fb.array([]);
   
}
} else {
  console.warn('⚠️ Aucun utilisateur connecté. ID introuvable.');
  return; // Stop execution
}
  



  }
 


  loadEducations(): void {

    if (!this.userId) return;
  
    this.educationService.getEducationsByUserId(this.userId).subscribe({
      next: (educations) => {
        this.populateAcademicFormations(educations);
      },
      error: (err) => {
        console.error("Erreur chargement formations :", err);
      }
    });
  }


  gettotalexperience(): void {
    if (!this.userId) return;
    this.experienceService.getTotalExperienceYears(this.userId).subscribe({
      next: (years) => this.totalYears = years,
      error: (err) => console.error('Erreur lors de la récupération du total:', err)
    });
  }
  saveEducations(): void {
  
    if (!this.userId) return;
  
    const educations: Education[] = this.academicFormations.controls.map(group => ({
      id_education: group.get('id_education')?.value,
      university: group.get('university')?.value,
      diplome: group.get('diplome')?.value,
      dateDebut: group.get('dateDebut')?.value,
      dateFin: group.get('dateFin')?.value
    }));
  
    this.educationService.updateEducationsForUser(this.userId, educations).subscribe({
      next: (updated) => {
        //console.log('Formations mises à jour :', updated);
        this.closeAcademicPopup();
      },
      error: (err) => {
        console.error('Erreur MAJ formations', err);
      }
    });
  }
  
  
  
  // Méthodes pour les filtres
  applyFilters(): void {
    
    let results = [...this.codingameResults];
        if (this.frameworkFilter) {
      results = results.filter(r => r.framework === this.frameworkFilter);
    }
 
    if (this.levelFilter) {
      results = results.filter(r => r.level === this.levelFilter);
    }
   
    switch(this.sortBy) {
      case 'date':
        results.sort((a, b) => b.date.getTime() - a.date.getTime());
        break;
      case 'dateAsc':
        results.sort((a, b) => a.date.getTime() - b.date.getTime());
        break;
      case 'score':
        results.sort((a, b) => b.score - a.score);
        break;
      case 'scoreAsc':
        results.sort((a, b) => a.score - b.score);
        break;
    }
    
    this.filteredCodingameResults = results;
  }

  resetFilters(): void {
    this.frameworkFilter = '';
    this.levelFilter = '';
    this.sortBy = 'date';
    this.applyFilters();
  }

  getUniqueFrameworks(): string[] {
    return [...new Set(this.codingameResults.map(r => r.framework))];
  }

  getUniqueLevels(): string[] {
    return [...new Set(this.codingameResults.map(r => r.level))];
  }
  
  loadCodingameResults(): void {
    if (!this.userId) return;
  
    this.codingameService.getResultsForUser(this.userId).subscribe({
      next: (results) => {
        this.codingameResults = results.map(result => ({
          date: new Date(...(result.date.slice(0, 6) as [number, number, number, number, number, number])),
          duration: result.duration?.toFixed(2) + ' s',
          framework: result.framework,
          score: result.score,
          level: result.level,
          domain: result.domain
        }));
        
        this.filteredCodingameResults = [...this.codingameResults];
        this.renderPerformanceChart();
      },
      error: (err) => console.error('Erreur chargement résultats Codingame', err)
    });
  }
  

  renderPerformanceChart(): void {
    if (!this.codingameResults || this.codingameResults.length <= 1) return;
    
    setTimeout(() => {
      const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
      if (!ctx) return;
      
      const sortedResults = [...this.codingameResults].sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      );
      
      const labels = sortedResults.map(r => new Date(r.date).toLocaleDateString());
      const scores = sortedResults.map(r => r.score);
      
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Score (%)',
            data: scores,
            fill: false,
            borderColor: '#f2bb13',
            tension: 0.1,
            backgroundColor: 'rgba(242, 187, 19, 0.2)',
            borderWidth: 2,
            pointBackgroundColor: '#0c3068',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Score (%)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });
    }, 300);
  }
  
  openCodingameResults(): void {
    if (!this.showCodingameOnProfil) return;
    this.loadCodingameResults();
    this.showCodingameResultsPopup = true;
  }
  
  closeCodingameResults(): void {
    this.showCodingameResultsPopup = false;
  }
  
  formatDuration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
  
    const [, h, m, s] = match;
    const parts = [];
    if (h) parts.push(`${h} h`);
    if (m) parts.push(`${m} min`);
    if (s) parts.push(`${s} s`);
    return parts.join(' ');
  }
  
  // Méthode pour calculer le score moyen
  getAverageScore(): number {
    if (!this.codingameResults || this.codingameResults.length === 0) return 0;
    const sum = this.codingameResults.reduce((acc, result) => acc + result.score, 0);
    return sum / this.codingameResults.length;
  }

  // Méthode pour obtenir la date du test le plus récent
  getMostRecentTest(): Date | null {
    if (!this.codingameResults || this.codingameResults.length === 0) return null;
    return new Date(Math.max(...this.codingameResults.map(r => r.date.getTime())));
  }

  // Méthode pour obtenir la classe CSS en fonction du niveau
  getLevelClass(level: string): string {
    if (!level) return '';
    level = level.toLowerCase();
    if (level.includes('facile') || level.includes('easy')) return 'level-easy';
    if (level.includes('moyen') || level.includes('medium')) return 'level-medium';
    if (level.includes('difficile') || level.includes('hard')) return 'level-hard';
    return '';
  }
  
  // Méthodes pour les badges
  getHighestScore(): number {
    if (!this.codingameResults || this.codingameResults.length === 0) return 0;
    return Math.max(...this.codingameResults.map(r => r.score));
  }

  getConsecutiveTests(): number {
    if (!this.codingameResults || this.codingameResults.length <= 1) return 0;
    
    // Trier par date
    const sortedResults = [...this.codingameResults].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    // Vérifier les tests consécutifs (moins de 14 jours d'écart)
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    
    for (let i = 1; i < sortedResults.length; i++) {
      const daysDiff = (sortedResults[i].date.getTime() - sortedResults[i-1].date.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 14) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }
    
    return maxConsecutive;
  }
  
  // Méthodes existantes pour le CV
  loadCv(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.warn('Aucun utilisateur connecté.');
      return;
    }
    this.languesService.getLanguesByUserId(userId).subscribe({
      next: (langues) => {
        this.cvLangues = langues;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des langues :", err);
      }
    });
   
    
  }
  
  populateAcademicFormations(educations: Education[]): void {
    const academicArray = this.form.get('academicFormations') as FormArray;
    academicArray.clear();
    for (const edu of educations) {
      academicArray.push(this.fb.group({
        id_education: [edu.id_education],
        dateDebut: [edu.dateDebut, Validators.required],
        dateFin: [edu.dateFin, Validators.required],
        university: [edu.university, Validators.required],
        diplome: [edu.diplome, Validators.required]
      }));
      
      
    }
  }
  // Academic Formations
  get academicFormations(): FormArray {
    return this.form.get('academicFormations') as FormArray;
  }

  newAcademicFormation(): FormGroup {
    return this.fb.group({
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      university: ['', Validators.required],
      diplome: ['', Validators.required]
    });
  }

  addAcademicFormation(): void {
    this.academicFormations.push(this.newAcademicFormation());
  }

  removeAcademicFormation(index: number): void {
    this.academicFormations.removeAt(index);
  }

  // Function to open the popup
  openAcademicPopup() {
    this.showAcademicPopup = true;
  }

  // Function to close the popup
  closeAcademicPopup() {
    this.showAcademicPopup = false;
  }

  // Fonction pour déclencher l'upload de l'image
  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  showSkillsPopup: boolean = false;

  skills: Competence = {
    id_competence: undefined,
    langageBallsage: '',
    languageProgrammation: '',
    framework: '',
    bibliotheque: '',
    api: '',
    db: '',
    systemExploitation: '',
    conception: '',
    methodologie: '',
    designPattern: '',
    architechture: '',
    outils: ''
  };

  openSkillsPopup() {
    //console.log("Skills avant affichage :", this.skills);
    this.showSkillsPopup = true;
  }
  

  closeSkillsPopup() {
    this.showSkillsPopup = false;
  }

  loadCompetence(): void {
    if (!this.userId) return;
  
    this.competenceService.getCompetenceByUserId(this.userId).subscribe({
      next: (compList: Competence[]) => {
        if (compList && compList.length > 0) {
          this.skills = compList[0]; // Prend le premier objet du tableau
        }
      },
      error: (err) => {
        console.error("Erreur chargement compétence :", err);
      }
    });
    
  }
  

  saveCompetence(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.competenceService.updateCompetenceByUserId(userId, this.skills).subscribe({
      next: (updated) => {
        //console.log("Compétence mise à jour :", updated);
        this.skills = updated;
        this.closeSkillsPopup();
      },
      error: (err) => {
        console.error("Erreur sauvegarde compétences :", err);
      }
    });
  }
  getSkillValue(key: string): string {
    return (this.skills as any)[key] || '';
  }
  
  setSkillValue(key: string, value: string): void {
    (this.skills as any)[key] = value;
  }
  
  
    // Language popup functions
    openLanguagePopup() {
      this.showLanguagePopup = true;
    }
    
    closeLanguagePopup() {
      this.showLanguagePopup = false;
      this.languageForm.reset();
    }
    
    loadLangues(): void {
      
      if (!this.userId) return;
    
      this.languesService.getLanguesByUserId(this.userId).subscribe({
        next: (langues) => {
          this.cvLangues = langues;
          this.languageFormArray.clear();
          for (let lang of langues) {
            this.languageFormArray.push(this.fb.group({
              name: [lang.name, Validators.required],
              niveau: [lang.niveau, Validators.required]
            }));
          }
        },
        error: (err) => {
          console.error("Erreur chargement langues :", err);
        }
      });
      
    }
    
    populateLanguageForm(langues: Langue[]): void {
      this.languageFormArray.clear();
    
      langues.forEach(lang => {
        this.languageFormArray.push(this.fb.group({
          id_langue: [lang.id_langue],
          name: [lang.name, Validators.required],
          niveau: [lang.niveau, Validators.required]
        }));
      });
    }
    
    addLanguage(): void {
      this.languageFormArray.push(this.fb.group({
        name: ['', Validators.required],
        niveau: ['', Validators.required]
      }));
    }
    
    removeLanguage(index: number): void {
      this.languageFormArray.removeAt(index);
    }
    
    saveLangues(): void {
      const userId = this.authService.getUserId();
      if (!userId) return;
    
      const langues: Langue[] = this.languageFormArray.value;
      this.languesService.updateLangues(userId, langues).subscribe({
        next: (updatedLangues) => {
          this.cvLangues = updatedLangues;
          this.closeLanguagePopup();
        },
        error: (err) => {
          console.error("Erreur sauvegarde langues :", err);
        }
      });
    }
    
    
  openProfessionalExperiencePage(): void {
    this.router.navigate(['/popup-carriere-professionnel']); // Rediriger vers la route souhaitée
  }




}
