import { Component } from '@angular/core';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent {
  currentPage: number = 1;

  startDate!: Date; // Déclaration de startDate
  startTime!: string;
  isPopupVisible: boolean = false;

  goToPage(pageNumber: number): void {
    this.currentPage = pageNumber;
  }

  ngOnInit(): void {
    this.startDate = new Date(); // Initialisation de startDate
    this.startTime = this.startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  showPopup(): void {
    this.isPopupVisible = true;
  }

  closePopup(): void {
    this.isPopupVisible = false;
  }
}
