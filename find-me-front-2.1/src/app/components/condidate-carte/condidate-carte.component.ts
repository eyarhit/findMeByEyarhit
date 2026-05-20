import { Component, Input, Output, EventEmitter } from '@angular/core';
import {Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { CandidatureService } from '../../services/candidature';
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
  status:string;
  id_candidature:string;
}
@Component({
  selector: 'app-condidate-card',
  templateUrl: './condidate-carte.component.html',
  styleUrl: './condidate-carte.component.scss'
})

export class CandidateCarteComponent {
  @Input() job!: Job;
  @Output() jobSelected: EventEmitter<Job> = new EventEmitter<Job>();
  @Input() isSelected: boolean = false;
  constructor(private router: Router,private authService: AuthService,private candidatureService:CandidatureService){}
  selectJob(): void {
    this.jobSelected.emit(this.job);
  }
  ngOnInit(){
// console.log(this.job)
  }
  viewMission(jobId: number): void {
    if(this.authService.getRole ()==="FREELANCER"||this.authService.getRole ()==="PORTAGE_SALARIAL"){
    this.router.navigate(['/MissionDetails', jobId]);}
    else if(this.authService.getRole ()==="CANDIDAT"){
      this.router.navigate(['/OffreDetails', jobId]);}
  }
    deleteCandidature(candidatureId: string) {
       Swal.fire({
                      text: 'Veuillez patienter pendant la suppression de la candidature.',
                      allowOutsideClick: false,
                      allowEscapeKey: false,
                      didOpen: () => Swal.showLoading()
                    });
      this.candidatureService.deleteCandidature(Number(candidatureId)).subscribe(
        (response: any) => { 
          this.candidatureService.notifyCandidateUpdate()
          Swal.fire('Supprimé!', 'La candidature a été supprimé.', 'success');
          
        },
        (error: any) => {
          console.error('❌ Erreur lors de la récupération des missions', error);
        }
      );
  }
  confirmDeletePopup(candidatureId: string): void {
    Swal.fire({
      text:`Êtes-vous sûr de vouloir supprimer cette candidature ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteCandidature(candidatureId);   
      }
    });
  }
}
