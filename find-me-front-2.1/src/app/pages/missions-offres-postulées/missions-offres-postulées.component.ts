import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { MissionService } from '../../services/mission';
import { AuthService } from '../../services/auth.service';
import { CandidatureService } from '../../services/candidature';
import { catchError, forkJoin, map, of, Subscription } from 'rxjs';
import { DocumentServiceService } from '../../services/document-service.service';
import { ActivatedRoute } from '@angular/router';

interface Job {
  id: number;
  title: string;
  company: string;
  ville: string;     
  pays: string;         
  salary: string;
  ref: string;
  type: string;
  experience: string;
  description: string;
  logo: string;
  avantages: string;
  competences: string[];
  date_debut: string; 
  date_fin: string;
  langue: string;
  statut: string;
  isRemote: boolean;
  nbre_recruteurs: number;
  exigences: string;
  status: string;
  id_candidature: string;
}

@Component({
  selector: 'app-missions-offres-postulées',
  templateUrl: './missions-offres-postulées.component.html',
  styleUrls: ['./missions-offres-postulées.component.scss'] 
})
export class MissionsOffresPostulerComponent implements OnInit, OnDestroy {
  
  @Input() espace = this.route.snapshot.data['espace'] || '';
  jobs: Job[] = []; 
  filteredJobs: Job[] = [];
  selectedJob: Job | null = null;
  hasJobs = true;
  isLoading = false;
  countEnCours: number = 0;
  countAccepter: number = 0;
  countRefuser: number = 0;
  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentServiceService,
    private missionService: MissionService,
    private authService: AuthService,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    const userRole = this.authService.getRole();
    
    if (userId && userRole) {
      this.loadData(userId, userRole);
      
      this.subscription = this.candidatureService.candidateStateChange.subscribe(() => {
        this.loadData(userId, userRole);
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  calculateStatusCounts(): void {
    this.countEnCours = this.jobs.filter(job => job?.status === 'ENCOURS').length;
    this.countAccepter = this.jobs.filter(job => job?.status === 'ACCEPTER').length;
    this.countRefuser = this.jobs.filter(job => job?.status === 'REFUSER').length;
  }

  loadData(userId: number, userRole: string): void {
    if (!["CANDIDAT", "FREELANCER", "PORTAGE_SALARIAL", "ESN_ADMIN", "ESN_COMMERCIAL"].includes(userRole)) {
      return;
    }

    this.isLoading = true;

    this.candidatureService.getCandidaturesByUserId(userId).pipe(
      catchError(error => {
        console.error('Error loading candidatures:', error);
        this.handleEmptyJobs();
        this.isLoading = false;
        return of([]);
      })
    ).subscribe({
      next: (response: any) => {
        if (!response || response.length === 0) {
          this.handleEmptyJobs();
          this.isLoading = false;
          return;
        }

        const filteredMissions = response.filter((item: any) => {
          if (!item?.mission?.descrip_mission?.typeContrat) return false;
          
          const typeContrat = item.mission.descrip_mission.typeContrat;
          
          if (this.espace === "Offre") {
            return ['CDI', 'CDD', 'ALTERNANCE'].includes(typeContrat);
          } else if (this.espace === "Mission") {
            return ['MISSION_CDI', 'FREELANCE'].includes(typeContrat);
          }
          return true;
        });
        
        if (filteredMissions.length === 0) {
          this.handleEmptyJobs();
          this.isLoading = false;
          return;
        }

        const missionObservables = filteredMissions.map((item: any) => {
          const m = item?.mission;
          const companyId = m?.id_societer ?? m?.idSociete ?? m?.societeId ?? m?.userId ?? m?.user_id;
          const logoDirect =
            m?.logo && (String(m.logo).startsWith('http') || String(m.logo).startsWith('data:'))
              ? m.logo
              : null;
          if (!companyId) {
            return of(this.createJobObject(item, logoDirect || 'assets/images/default-company.png'));
          }

          return this.documentService.getDocumentsByUserAndFolder(companyId, "ProfileImage").pipe(
            map(logoResponse => {
              const presignedUrl = logoResponse[0]?.presignedUrl || logoDirect || 'assets/images/default-company.png';
              return this.createJobObject(item, presignedUrl);
            }),
            catchError(error => {
              console.error('Error fetching logo:', error);
              return of(this.createJobObject(item, logoDirect || 'assets/images/default-company.png'));
            })
          );
        });

        forkJoin<Job[]>(missionObservables).subscribe({
          next: (processedMissions: Job[]) => {
            this.jobs = processedMissions.filter(job => job !== null);
            this.filteredJobs = [...this.jobs];
            this.selectedJob = this.jobs[0] || null;
            this.calculateStatusCounts();
            this.checkJobs();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error processing missions:', error);
            this.handleEmptyJobs();
            this.isLoading = false;
          }
        });
      }
    });
  }

  private handleEmptyJobs(): void {
    this.jobs = [];
    this.filteredJobs = [];
    this.selectedJob = null;
    this.countEnCours = 0;
    this.countAccepter = 0;
    this.countRefuser = 0;
    this.hasJobs = false;
    this.isLoading = false;
  }

  private createJobObject(item: any, logoUrl: string): Job {
    if (!item?.mission) {
      return null as any;
    }

    return {
      id: item.mission.idMission,
      title: item.mission.descrip_mission?.mission_name || 'No title',
      company: item.mission.descrip_mission?.poste || 'No company',
      ville: item.mission.ville?.nomdeville || '',
      pays: item.mission.pays?.nom || '',
      salary: item.mission.descrip_mission?.salaire || '',
      ref: item.mission.reference_code || '',
      type: item.mission.descrip_mission?.typeContrat || '',
      experience: `${item.mission.profilDemande?.annees_experiences || 0} ans d'expériences`,
      description: item.mission.descrip_mission?.description || '',
      avantages: item.mission.descrip_mission?.avantages || '',
      competences: item.mission.descrip_mission?.competencesRequises || [],
      date_debut: item.mission.descrip_mission?.date_debut || '',
      date_fin: item.mission.descrip_mission?.date_fin || '',
      langue: item.mission.descrip_mission?.langue || '',
      isRemote: item.mission.descrip_mission?.isRemote || false,
      statut: item.mission.descrip_mission?.statut || '',
      nbre_recruteurs: item.mission.descrip_mission?.nbre_recruteurs || 0,
      exigences: item.mission.profilDemande?.exigences || '',
      logo: logoUrl,
      status: item.statutCandidature || 'ENCOURS',
      id_candidature: item.idCandidature?.toString() || ''
    };
  }

  onJobSelected(job: Job): void {
    this.selectedJob = job;
  }

  onSearchCriteria(criteria: any): void {
    if (!criteria || this.isEmptyCriteria(criteria)) {
      this.filteredJobs = [...this.jobs];
      this.checkJobs();
      return;
    }

    const searchText = this.normalizeString(criteria.searchText);
    const city = this.normalizeString(criteria.city);
    const experience = this.normalizeString(criteria.experience);
    const salary = criteria.salary?.toString().trim() || '';
    const typeContrat = criteria.typeContrat?.trim() || '';

    this.filteredJobs = this.jobs.filter(job => {
      if (!job) return false;

      const textMatch = this.isEmpty(searchText) || 
        this.normalizeString(job.title).includes(searchText) || 
        this.normalizeString(job.company).includes(searchText);

      const locationMatch = this.isEmpty(city) || 
        this.normalizeString(job.ville).includes(city) || 
        this.normalizeString(job.pays).includes(city);

      const experienceMatch = this.isEmpty(experience) || 
        this.normalizeString(job.experience).includes(experience);

      const salaryMatch = this.isEmpty(salary) || 
        this.normalizeString(job.salary).includes(salary.toLowerCase()) ||
        job.salary?.toString() === salary;

      const typeContratMatch = this.isEmpty(typeContrat) || 
        job.type === typeContrat;

      return textMatch && locationMatch && experienceMatch && salaryMatch && typeContratMatch;
    });

    this.checkJobs();
  }

  private isEmptyCriteria(criteria: any): boolean {
    if (!criteria) return true;
    
    return this.isEmpty(criteria.searchText) && 
           this.isEmpty(criteria.city) && 
           this.isEmpty(criteria.experience) && 
           this.isEmpty(criteria.salary) && 
           this.isEmpty(criteria.typeContrat);
  }

  private isEmpty(value: any): boolean {
    return !value || value.toString().trim() === '';
  }

  private normalizeString(value: any): string {
    if (!value) return '';
    return value.toString().toLowerCase().trim();
  }

  checkJobs(): void {
    this.hasJobs = this.filteredJobs.length > 0;
    
    if (this.selectedJob && !this.filteredJobs.includes(this.selectedJob)) {
      this.selectedJob = this.filteredJobs[0] || null;
    }
  }
}
