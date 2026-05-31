import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-visualisation-cv',
  templateUrl: './visualisation-cv.component.html',
  styleUrl: './visualisation-cv.component.scss'
})
export class VisualisationCvComponent {
  
  @Input() selectedTemplate: any = null; 
  getFullName(): string {
    return `${this.selectedTemplate?.cvData?.user?.firstname}.${this.selectedTemplate?.cvData?.user?.lastname}`;
  }

  constructor(private sanitizer: DomSanitizer,private router: Router) {}
  

  formatTextWithLineBreaks(text: string): SafeHtml {
    if (!text) return '';
    const formattedText = text.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(formattedText);
  }

  getCurrentData(): any {
    return this.selectedTemplate?.cvData;
  }

  hasTechnicalSkills(): boolean {
    const comp = this.getCurrentData()?.competences;
    if (!comp) {
      return false;
    }
    const groups = [
      'langages_balisage',
      'programmation',
      'frameworks',
      'bibliotheques',
      'api',
      'base_donnees',
      'systeme_exploitation',
      'conception',
      'methodologies',
      'design_patterns',
      'architectures',
      'outils',
    ];
    return groups.some((key) => Array.isArray(comp[key]) && comp[key].length > 0);
  }
}
