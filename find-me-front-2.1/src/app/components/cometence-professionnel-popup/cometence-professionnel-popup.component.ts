import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ExperienceService } from '../../services/experience.service';
import { Experience } from '../../_model/Experience';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cometence-professionnel-popup',
  templateUrl: './cometence-professionnel-popup.component.html',
  styleUrls: ['./cometence-professionnel-popup.component.scss']
})
export class CometenceProfessionnelPopupComponent implements OnInit {

  isOpen = true;
  experienceForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private experienceService: ExperienceService,
    private authService: AuthService
  ) {
    this.experienceForm = this.fb.group({
      experiences: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error("Aucun utilisateur connecté !");
      return;
    }

    this.experienceService.getExperiencesByUserId(userId).subscribe({
      next: (data) => {
        //console.log('Données récupérées :', data);
        const array = this.getExperienceFormArray();
        if (data.length > 0) {
          data.forEach(exp => {
            array.push(this.mapExperienceToFormGroup(exp));
          });
        } else {
          this.addExperience();
        }
      },
      error: err => {
        console.error("Erreur lors du chargement des expériences :", err);
        this.addExperience();
      }
    });
  }

  formatDateToInput(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  mapExperienceToFormGroup(exp: Experience): FormGroup {
    return this.fb.group({
      id_experience: [exp.id_experience],
      dateDebut: [this.formatDateToInput(exp.dateDebut), Validators.required],
      dateFin: [this.formatDateToInput(exp.dateFin), Validators.required],
      poste: [exp.poste, Validators.required],
      nomProjet: [exp.nomProjet],
      entreprise: [exp.entreprise, Validators.required],
      client: [exp.client],
      equipe: [exp.equipe],
      travailRealise: [exp.travailRealise],
      environnement: [exp.environnement],
      description: [exp.description]
    });
  }

  createExperience(): FormGroup {
    return this.fb.group({
      id_experience: [null],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      poste: ['', Validators.required],
      nomProjet: [''],
      entreprise: ['', Validators.required],
      client: [''],
      equipe: [''],
      travailRealise: [''],
      environnement: [''],
      description: ['']
    });
  }

  getExperienceFormArray(): FormArray {
    return this.experienceForm.get('experiences') as FormArray;
  }

  addExperience(): void {
    this.getExperienceFormArray().push(this.createExperience());
  }

  removeExperience(index: number): void {
    this.getExperienceFormArray().removeAt(index);
  }

  onSubmit(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error("Utilisateur non connecté.");
      return;
    }

    if (this.experienceForm.valid) {
      const experiences: Experience[] = this.experienceForm.value.experiences;
      this.experienceService.updateExperiencesForUser(userId, experiences).subscribe({
        next: (res) => {
          //console.log('Expériences enregistrées avec succès :', res);
          this.closePopup();
        },
        error: (err) => {
          console.error('Erreur lors de la sauvegarde des expériences :', err);
        }
      });
    } else {
      this.getExperienceFormArray().controls.forEach(ctrl => ctrl.markAllAsTouched());
      console.error('Le formulaire est invalide');
    }
  }

  closePopup(): void {
    this.router.navigate(['/profil']); 
  }

  cancelPopup(): void {
    this.router.navigate(['/profil']);
  }
}
