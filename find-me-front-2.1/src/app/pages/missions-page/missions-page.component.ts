import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input } from '@angular/core';
import { MissionService } from '../../services/mission';
import { AuthService } from '../../services/auth.service';
import { CandidatureService } from '../../services/candidature';
import { apiRoutingServiceFlusk } from '../../services/api-routing-flusk.services';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subscription, timer, Observable, of, forkJoin } from 'rxjs';
import { switchMap, takeUntil, map, catchError, finalize } from 'rxjs/operators';
import { DocumentServiceService } from '../../services/document-service.service';

interface Job {
  id: number;
  user_id:number;
  title: string;
  poste: string;
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
  similarity?: number;
}

@Component({
  selector: 'app-missions-page',
  templateUrl: './missions-page.component.html',
  styleUrls: ['./missions-page.component.scss']
})
export class MissionsPageComponent implements OnInit, OnDestroy { 
  @Input() espace = this.route.snapshot.data['espace'] || '';
  @Input() profileId: any;
  isLoading = true;
  userId:any;
  jobs: Job[] = [];
  jobsRecommended: Job[] = []; 
  filteredJobs: Job[] = [];
  selectedJob: Job | null = null;
  hasJobs = true;
  candidatureMissionIds: number[] = [];
  userRole = '';
  private subscriptions = new Subscription();
  private autoScrollInterval: any;
  currentIndex = 0;
  isVisiteur:boolean=false;

  @ViewChild('carouselTrack') carouselTrack!: ElementRef;

  constructor(
    private documentService: DocumentServiceService,
    private route: ActivatedRoute,
    private missionService: MissionService,
    private authService: AuthService,
    private candidatureService: CandidatureService,
    private apiRoutingServiceFlusk: apiRoutingServiceFlusk
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.stopAutoScroll();
  }

  private initializeComponent(): void {
    
    if(this.profileId){this.userId=this.profileId;}
    else{this.userId = this.authService.getUserId();}
    if(this.profileId!=this.authService.getUserId()&&this.profileId){
      this.isVisiteur=true;
    }
    this.userRole = this.authService.getRole()!;
    if (this.userId) {
      this.isLoading = true;
      this.loadCandidatures(this.userId);
      this.loadMissionsBasedOnRole(this.userId);
    }
  }

  private loadCandidatures(userId: number): void {
    
    this.subscriptions.add(
      this.candidatureService.getCandidaturesByUserId(userId).subscribe({
        next: (response) => {
          this.candidatureMissionIds = response.map(c => c.mission.idMission);
        },
        error: (error) => console.error('❌ Error loading candidatures:', error)
      })
    );
  }

  private loadMissionsBasedOnRole(userId: number): void {
    this.isLoading = true;
    if (this.espace === 'Mission publier' || this.espace === 'Offres publier') {
      this.loadEsnEmployeeMissions(userId);
    } else if (
      this.espace === 'Liste Offres' &&
      ['CANDIDAT', 'ESN_COMMERCIAL', 'ESN_ADMIN', 'CHARGEDERECRUTEMENT', 'ADMIN'].includes(this.userRole)
    ) {
      // Anciennement getMissionsForUser : ne renvoyait que les offres liées au user (ex. créateur).
      // Catalogue marché : toutes les offres CDI/CDD/ALTERNANCE ouvertes, toutes sociétés.
      this.loadListeOffresEmploi();
    } else if (['CANDIDAT'].includes(this.userRole)) {
      this.loadUserMissions(userId);
    } else if (['FREELANCER', 'PORTAGE_SALARIAL'].includes(this.userRole)) {
      this.loadFreelancerMissions(userId);
    } else if (
      (this.userRole === 'ESN_COMMERCIAL' || this.userRole === 'ESN_ADMIN') &&
      this.espace === 'Liste Mission'
    ) {
      this.loadFreelancerMissions(userId);
    }
    if (
      (this.espace === 'Liste Offres' || this.espace === 'Liste Mission') &&
      this.isVisiteur === false
    ) {
      this.loadRecommendedMissions(userId);
    }
  }

  /** Offres d’emploi visibles par tous (candidats + ESN) : même logique que les favoris « Offre ». */
  private filterOffresEmploiPubliques(missions: any[]): any[] {
    const typesOffre = ['CDI', 'CDD', 'ALTERNANCE'];
    const list = Array.isArray(missions) ? missions : [];
    return list.filter((m) => {
      const tc = m?.descrip_mission?.typeContrat;
      if (!typesOffre.includes(tc)) return false;
      if (m.archived === true) return false;
      if (m.statusMission != null && m.statusMission !== 'OPEN') return false;
      return true;
    });
  }

  private loadListeOffresEmploi(): void {
    this.subscriptions.add(
      this.missionService
        .getAllMissions()
        .pipe(
          map((missions) => this.filterOffresEmploiPubliques(missions)),
          switchMap((missions) => this.processMissionsWithImages(missions)),
          finalize(() => (this.isLoading = false))
        )
        .subscribe({
          next: (jobs) => this.processMissionsResult(jobs),
          error: (error) => {
            console.error('❌ Error loading job offers catalogue:', error);
            this.isLoading = false;
          }
        })
    );
  }

 private loadEsnEmployeeMissions(userId: number): void {
    const espaceType = this.espace === 'Mission publier' ? 'Mission publier' : 'Offres publier';
    this.subscriptions.add(
      this.missionService.getMissionsForEsnEmployee(userId, espaceType)
        .pipe(
          switchMap(missions => this.processMissionsWithImages(missions)),
          finalize(() => this.isLoading = false) // Ensure loading is false when complete
        )
        .subscribe({
          next: (jobs) => this.processMissionsResult(jobs),
          error: (error) => {
            console.error('❌ Error loading ESN missions:', error);
            this.isLoading = false; // Also set to false on error
          }
        })
    );
  }

  private loadUserMissions(userId: number): void {
    this.subscriptions.add(
      this.missionService.getMissionsForUser(userId)
        .pipe(
          switchMap(missions => this.processMissionsWithImages(missions)),
          finalize(() => this.isLoading = false) // Ensure loading is false when complete
        )
        .subscribe({
          next: (jobs) => this.processMissionsResult(jobs),
          error: (error) => {
            console.error('❌ Error loading user missions:', error);
            this.isLoading = false; // Also set to false on error
          }
        })
    );
  }

  private loadFreelancerMissions(userId: number): void {
    this.subscriptions.add(
      this.missionService.getMissionsForFreelancer(userId)
        .pipe(
          switchMap(missions => this.processMissionsWithImages(missions)),
          finalize(() => this.isLoading = false) // Ensure loading is false when complete
        )
        .subscribe({
          next: (jobs) => this.processMissionsResult(jobs),
          error: (error) => {
            console.error('❌ Error loading freelancer missions:', error);
            this.isLoading = false; // Also set to false on error
          }
        })
    );
  }

private loadRecommendedMissions(userId: number): void {
    const params = new HttpParams()
      .set('user_role', this.userRole)
      .set('top_n', 4);
    //console.log('yoo')
    this.subscriptions.add(
      this.apiRoutingServiceFlusk.requestApiGet(`/recommendations/${userId}`, params)
        .pipe(
          switchMap((response: any) => {
            // Ensure response is an array
            const recommendations = Array.isArray(response) ? response : [];
            
            // Create an array of observables for each job with its image
            const jobsWithImages$ = recommendations.map((item: { 
              details: any; 
              similarity_score: number 
            }) => this.mapToJob(item.details, item.similarity_score));
            
            // Wait for all jobs to be processed
            return forkJoin(jobsWithImages$);
          }),
          catchError(error => {
            console.error('Error loading recommended missions:', error);
            return of([] as Job[]); // Return empty array on error
          })
        )
        .subscribe({
          next: (jobs: Job[]) => {
            this.jobsRecommended = jobs;
          },
          error: (error) => console.error('❌ Error loading recommended missions:', error)
        })
    );
}

  private processMissionsWithImages(missions: any[]): Observable<Job[]> {
    const jobsWithImages$ = missions.map(mission => this.mapToJob(mission));
    return forkJoin(jobsWithImages$);
  }

  private processMissionsResult(jobs: Job[]): void {
    this.jobs = jobs;
    //console.log('test1')
    this.filteredJobs = [...this.jobs];
    this.selectedJob = this.jobs[0] || null;
    this.checkJobs();
  }

  private mapToJob(item: any, similarity?: number): Observable<Job> {
    console.log('[DEBUG] mapToJob full item:', JSON.stringify(item));
    const societerId = item.id_societer ?? item.idSocieter ?? item.societeId ?? item.userId ?? item.user_id;
    console.log('[DEBUG] societerId resolved:', societerId);
    return this.documentService.getDocumentsByUserAndFolder(societerId, "ProfileImage").pipe(
      map(response => {
        const presignedUrl = response[0]?.presignedUrl || '';
        return this.createJobObject(item, similarity, presignedUrl);
      }),
      catchError(error => {
        console.error('Error fetching profile image:', error);
        return of(this.createJobObject(item, similarity, ''));
      })
    );
  }

  private createJobObject(item: any, similarity: number | undefined, logoUrl: string): Job {
    console.log(item)
    return {
      id: item.idMission,
      user_id: item.user_id, 
      title: item.descrip_mission?.mission_name || '',
      poste: item.descrip_mission?.poste || '',
      ville: item.ville?.nomdeville || '',
      pays: item.ville?.pays?.nom || '',
      salary: item.descrip_mission?.salaire || '',
      ref: item.reference_code || '',
      type: item.descrip_mission?.typeContrat || '',
      experience: item.profilDemande?.annees_experiences ? 
        `${item.profilDemande.annees_experiences} ans d'expériences` : '',
      description: item.descrip_mission?.description || '',
      avantages: item.descrip_mission?.avantages || '',
      competences: item.descrip_mission?.competencesRequises || [],
      date_debut: item.descrip_mission?.date_debut || '',
      date_fin: item.descrip_mission?.date_fin || '',
      langue: item.descrip_mission?.langue || '',
      isRemote: item.descrip_mission?.isRemote || false,
      statut: item.descrip_mission?.statut || '',
      nbre_recruteurs: item.descrip_mission?.nbre_recruteurs || 0,
      exigences: item.profilDemande?.exigences || '',
      logo: logoUrl,
      similarity
    };
  }

  // UI Interaction Methods
  onJobSelected(job: Job): void {
    this.selectedJob = job;
  }

  onSearchCriteria(criteria: any): void {
    const searchText = criteria.searchText?.toLowerCase() || '';
    const city = criteria.city?.toLowerCase() || '';
    const experience = criteria.experience?.toLowerCase() || '';
    
    this.filteredJobs = this.jobs.filter(job => {
      const titleMatch = job.title.toLowerCase().includes(searchText);
      const posteMatch = job.poste.toLowerCase().includes(searchText);
      const locationMatch = 
        job.ville.toLowerCase().includes(city) ||
        job.pays.toLowerCase().includes(city) ||
        city === '';
      const experienceMatch = job.experience.toLowerCase().includes(experience) || experience === '';
      const salaryMatch = job.salary === criteria.salary || !criteria.salary;
      const typeContratMatch = !criteria.typeContrat || job.type === criteria.typeContrat;
      
      return (titleMatch || posteMatch) && 
             locationMatch && 
             experienceMatch && 
             salaryMatch && 
             typeContratMatch;
    });
    //console.log('test')
    this.checkJobs();
  }

  checkJobs(): void {
    this.hasJobs = this.filteredJobs.length > 0;
    this.isLoading = false;
  }

  // Carousel Methods
  startAutoScroll(): void {
    this.autoScrollInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.filteredJobs.length;
      this.scrollToIndex(this.currentIndex);
    }, 5000);
  }

  stopAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  scrollLeft(): void {
    this.stopAutoScroll();
    this.currentIndex = Math.max(0, this.currentIndex - 1);
    this.scrollToIndex(this.currentIndex);
    this.startAutoScroll();
  }

  scrollRight(): void {
    this.stopAutoScroll();
    this.currentIndex = Math.min(this.filteredJobs.length - 1, this.currentIndex + 1);
    this.scrollToIndex(this.currentIndex);
    this.startAutoScroll();
  }

  scrollToIndex(index: number): void {
    if (this.espace === '' && this.carouselTrack?.nativeElement) {
      const cards = this.carouselTrack.nativeElement.querySelectorAll('app-job-card');
      if (cards[index]) {
        cards[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        });
      }
    }
  }
}