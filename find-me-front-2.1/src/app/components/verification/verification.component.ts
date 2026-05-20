import { Component } from '@angular/core';

@Component({
  selector: 'app-verification',
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.scss'
})
export class VerificationComponent {

  isModalOpen = false;
  options = [
    'Ingénieur Logiciel',
    'IA Ingénieur',
    'Cloud Ingénieur',
    'DevOps Ingénieur',
    'Développeur Frontend',
    'Développeur Backend',  
  ];
  selectedOption: string[] = [];

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  submitSelection() {
    //console.log('Selected Options:', this.selectedOption);
    this.closeModal();
  }
}
