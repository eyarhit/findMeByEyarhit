import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PreviewDialogComponent } from '../../ESN_components/preview-dialog/preview-dialog.component';

@Component({
  selector: 'app-etape3-mission',
  templateUrl: './etape3-mission.component.html',
  styleUrl: './etape3-mission.component.scss'
})
export class Etape3MissionComponent implements OnInit {
  jobPostingForm!: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog

  ) {}
  
  ngOnInit() {
    this.initForm();
  }
  
  initForm() {
    this.jobPostingForm = this.fb.group({
      description: ['', Validators.required],
      responsibilities: [''],
      qualifications: [''],
      jobType: [''],
      experienceLevel: [''],
      urgency: [''],
      status: [''],
      salary: [''],
      recruiterCount: [''],
      benefits: ['']
    });
  }
  
  formatText(format: string) {
    const textarea = document.getElementById('description') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
    }
    
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    
    // Update the form control value
    this.jobPostingForm.get('description')?.setValue(newValue);
    
    // Set focus back to textarea and position cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  }
  
  getCharacterCount(): number {
    return this.jobPostingForm.get('description')?.value?.length || 0;
  }
  
  onSubmit() {
    if (this.jobPostingForm.valid) {
      // Save form data and navigate to next step
      //console.log('Form data:', this.jobPostingForm.value);
      this.router.navigate(['/dashboard']);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.jobPostingForm.controls).forEach(key => {
        const control = this.jobPostingForm.get(key);
        control?.markAsTouched();
      });
    }
  }

openPreview() {
  //console.log('Attempting to open dialog'); // Check if this logs
  
  try {
    const dialogRef = this.dialog.open(PreviewDialogComponent, {
      width: '800px',
      data: {
        formData: this.jobPostingForm.value,
        companyInfo: {
          name: 'OLX',
          location: 'Tunis, Gouvernorat Tunis, Tunisie',
          type: 'Sur site',
          status: 'Enregistré en tant que brouillon'
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      //console.log('Dialog closed', result);
      if (result) {
        this.onSubmit();
      }
    });
  } catch (error) {
    console.error('Error opening dialog', error);
  }
}
}