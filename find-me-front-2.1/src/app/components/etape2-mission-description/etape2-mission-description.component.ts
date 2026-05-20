import { Component, OnInit } from '@angular/core';
import { Job } from '../../_model/Job';
import { JobPostingService } from '../../services/job-posting.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-etape2-mission-description',
  templateUrl: './etape2-mission-description.component.html',
  styleUrl: './etape2-mission-description.component.scss'
})
export class Etape2MissionDescriptionComponent implements OnInit {
  jobPostingForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.jobPostingForm = this.fb.group({
      jobType: ['', Validators.required],
      experienceLevel: ['', Validators.required],
      urgency: ['', Validators.required],
      status: ['', Validators.required],
      salary: ['', Validators.required],
      recruiterCount: ['', Validators.required],
      benefits: [''],
      tasks: [''],
      skills: ['']
    });
  }

  onSubmit() {
    if (this.jobPostingForm.valid) {
      // Save form data and navigate to next step
      //console.log('Form data:', this.jobPostingForm.value);
      this.router.navigate(['/job-posting/step2']);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.jobPostingForm.controls).forEach(key => {
        const control = this.jobPostingForm.get(key);
        control?.markAsTouched();
      });
    }
  }

}