import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CvService } from './cv.service';
import { Cv } from '../_model/Cv';


@Injectable({
  providedIn: 'root'
})
export class StepTrackerService {

  private _completedSteps = new BehaviorSubject<Set<number>>(new Set());
  public completedSteps$ = this._completedSteps.asObservable();

  constructor(private cvService: CvService) {}

  // Charge les étapes complétées depuis le backend
  loadCompletedSteps(userId: number): void {
    // 1. Charge depuis localStorage
    const savedSteps = localStorage.getItem(`completedSteps_${userId}`);
    if (savedSteps) {
      const steps = new Set(JSON.parse(savedSteps) as number[]);
      this._completedSteps.next(steps);
    }

    // 2. Synchronise avec le backend
    this.cvService.getCvByUserId(userId).subscribe({
      next: (cv) => {
        if (cv?.completedSteps) {
          const backendSteps = new Set(cv.completedSteps);
          const currentSteps = new Set(this._completedSteps.value);
          
          // Fusionne les étapes
          backendSteps.forEach(step => currentSteps.add(step));
          
          this._completedSteps.next(currentSteps);
          this.persistSteps(userId, currentSteps);
        }
      },
      error: (err) => console.error('Error loading steps:', err)
    });
  }

    // Sauvegarde dans le localStorage et le backend
    private saveToLocalStorage(userId: number, steps: Set<number>): void {
      localStorage.setItem(`completedSteps_${userId}`, JSON.stringify(Array.from(steps)));
    }

  // Marque une étape comme complétée et sauvegarde
  completeStep(userId: number, stepNumber: number, cvData?: any): void {
    const currentSteps = this._completedSteps.value;
    currentSteps.add(stepNumber);
    this._completedSteps.next(currentSteps);

    this.updateCompletedSteps(currentSteps, userId);
  }

  // Vérifie si une étape est complétée
  isStepCompleted(stepNumber: number): boolean {
    return this._completedSteps.value.has(stepNumber);
  }

  // Met à jour les étapes complétées
  updateCompletedSteps(steps: Set<number>, userId: number): void {
    this._completedSteps.next(steps);
    this.persistSteps(userId, steps);
    
    // Met à jour le backend
    this.updateBackendSteps(userId, steps);
  }

  private updateBackendSteps(userId: number, steps: Set<number>): void {
    this.cvService.getCvByUserId(userId).subscribe({
      next: (cv) => {
        const updatedCv = {
          ...(cv || this.createEmptyCv(userId)),
          completedSteps: Array.from(steps)
        };
        this.cvService.saveCv(userId, updatedCv).subscribe();
      },
      error: (err) => console.error('Error updating CV:', err)
    });
  }

  private createEmptyCv(userId: number): Cv {
    return {
      userId: userId,
      competences: [],
      educations: [],
      experiences: [],
      langues: []
    };
  }


  private persistSteps(userId: number, steps: Set<number>): void {
    localStorage.setItem(`completedSteps_${userId}`, JSON.stringify(Array.from(steps)));
  }
  
}