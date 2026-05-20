// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import {Router } from '@angular/router';
// import { AuthService } from '../../services/auth.service';
// import { CandidatureService } from '../../services/candidature';
// interface Job {
//   id: number;
//   title: string;
//   poste: string;
//   ville: string;     
//   pays: string;
//   salary: string;
//   ref: string;
//   type: string;
//   experience: string;
//   description: string;
//   logo: string;
// }
// @Component({
//   selector: 'app-job-card',
//   templateUrl: './mission-carte.component.html',
//   styleUrl: './mission-carte.component.scss'
// })

// export class MissionCarteComponent {
//   missionId:string='';
//   candidature:boolean=false;
//   IsMission:boolean=false;
//   // CardCandidature
//   @Input() espace ="";
//   @Input() visiteur:boolean=false;
//   @Input() typeCard?: string;  
//   @Input() role?:string;
//   @Input() job!: Job;
//   @Output() jobSelected: EventEmitter<Job> = new EventEmitter<Job>();
//   @Input() isSelected: boolean = false;
//   @Input() candidatureMissionIds: number[] = [];
//   type_contrat:string ='annonce';
//     storedtargetmarket: string | null = null;
//   constructor(private router: Router,private authService: AuthService,private candidatureService:CandidatureService){}

  
//   selectJob(): void {
//     this.jobSelected.emit(this.job);
//   }
//    ngOnInit(): void {
//       const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
//   this.storedtargetmarket = profile.targetmarket || '';
//     // console.log(this.espace)
//     // console.log(this.visiteur)
//   //console.log("yoo aiz check",this.job);
//   // if(this.role==="FREELANCER" || this.role==="PORTAGE_SALARIAL"){
//   //   this.type_contrat="Mission"
//   // }else{this.type_contrat="Offre"}
//    }

// viewCandidature(jobId: number): void {
//   this.candidature=true
//   this.missionId=String(jobId)
//   //console.log(this.espace,jobId)
// }
//   viewMission(jobId: number): void {
//     if(this.espace==='Mission publier' )
//       if(this.visiteur){this.IsMission=true}else{this.router.navigate(['/MissionPublierDetails', jobId]);} 
//     else if(this.espace==='Offres publier')
//       {if(this.visiteur){this.IsMission=true}else{this.router.navigate(['/OffrePublierDetails', jobId]);}}
//     else if(this.espace==='Liste Mission')
//       {if(this.visiteur){this.IsMission=true}else{this.router.navigate(['/MissionDetails', jobId]);}}
//     else if(this.espace==='Liste Offres')
//       {if(this.visiteur){this.IsMission=true}else{this.router.navigate(['/OffreDetails', jobId]);}}
//   }
// }


// new ts with contact in the cart

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CandidatureService } from '../../services/candidature';

interface Job {
  id: number;
  user_id: number;
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
}

@Component({
  selector: 'app-job-card',
  templateUrl: './mission-carte.component.html',
  styleUrls: ['./mission-carte.component.scss']
})
export class MissionCarteComponent {
  missionId: string = '';
  candidature: boolean = false;
  IsMission: boolean = false;
  showContactForm: boolean = false;
  selectedJob: Job | null = null;
  messageContent: string = '';
  fakeMessages: { text: string; sent: boolean }[] = [];
  jobOwnerId!: number; // ID du recruteur


  @Input() espace = "";
  @Input() visiteur: boolean = false;
  @Input() typeCard?: string;
  @Input() role?: string;
  @Input() job!: Job;
  @Output() jobSelected: EventEmitter<Job> = new EventEmitter<Job>();
  @Input() isSelected: boolean = false;
  @Input() candidatureMissionIds: number[] = [];

  type_contrat: string = 'annonce';
  storedtargetmarket: string | null = null;


  constructor(
    private router: Router,
    private authService: AuthService,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    const profile = JSON.parse(sessionStorage.getItem('profile') || '{}');
    this.storedtargetmarket = profile.targetmarket || '';
  }

  selectJob(): void {
    this.jobSelected.emit(this.job);
  }

  viewCandidature(jobId: number): void {
    this.candidature = true;
    this.missionId = String(jobId);
  }

  viewMission(jobId: number): void {
    if (this.espace === 'Mission publier') {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/MissionPublierDetails', jobId]);
    } else if (this.espace === 'Offres publier') {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/OffrePublierDetails', jobId]);
    } else if (this.espace === 'Liste Mission') {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/MissionDetails', jobId]);
    } else if (this.espace === 'Liste Offres') {
      if (this.visiteur) this.IsMission = true;
      else this.router.navigate(['/OffreDetails', jobId]);
    }
  }

 

  openContactForm(job: Job): void {
    // console.log(job)
    this.selectedJob = job;
    this.jobOwnerId=job.user_id
    this.showContactForm = true;
    this.fakeMessages = [
      { text: "Bonjour, j’ai vu votre mission.", sent: true },
      { text: "Bonjour, en quoi puis-je vous aider ?", sent: false },
    ];
  }

  closeContactForm(): void {
    this.selectedJob = null;
    this.showContactForm = false;
    this.messageContent = '';
    this.fakeMessages = [];
  }

  sendMessageToCompany(): void {
    if (!this.messageContent.trim()) return;

    this.fakeMessages.push({ text: this.messageContent, sent: true });
    this.messageContent = '';
    // MessageService.sendMessage(...) ici si besoin
  }

  openMessenger() {
  this.showContactForm = true;
}
}

