import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-quiz-seulepage',
  templateUrl: './quiz-seulepage.component.html',
  styleUrl: './quiz-seulepage.component.scss'
})
export class QuizSeulepageComponent implements OnInit {

  startDate!: Date;
  startTime!: string;
  showPopup = true;
  showSuccessPopup = false;
  answers: any = {};

  quizForm = new FormGroup({
    quiz1: new FormControl('', Validators.required),
    quiz2: new FormControl('', Validators.required),
    quiz3: new FormControl('', Validators.required),
    quiz4: new FormControl('', Validators.required),
    quiz5: new FormControl('', Validators.required),
    quiz6: new FormControl('', Validators.required),
  });

  constructor() { }

  ngOnInit(): void {
    this.startDate = new Date();
    this.startTime = this.startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    // Subscribe to form value changes to update progress
    this.quizForm.valueChanges.subscribe(() => {
      this.getCompletionPercentage();
    });
  }

  isFormValid(): boolean {
    return this.quizForm.valid;
  }

  submitQuiz(): void {
    if (this.isFormValid()) {
      //console.log('Quiz submitted with answers:', this.quizForm.value);
      // Show success popup
      this.showSuccessPopup = true;
    } else {
      // Highlight unanswered questions
      Object.keys(this.quizForm.controls).forEach(key => {
        const control = this.quizForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      alert('Veuillez répondre à toutes les questions!');
    }
  }

  closeQuizPopup(): void {
    this.showPopup = false;
  }
  
  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
    this.showPopup = false;
  }
  
  // Calculate completion percentage for progress bar
  getCompletionPercentage(): number {
    const totalQuestions = Object.keys(this.quizForm.controls).length;
    let answeredQuestions = 0;
    
    Object.keys(this.quizForm.controls).forEach(key => {
      if (this.quizForm.get(key)?.value) {
        answeredQuestions++;
      }
    });
    
    return Math.round((answeredQuestions / totalQuestions) * 100);
  }
}
