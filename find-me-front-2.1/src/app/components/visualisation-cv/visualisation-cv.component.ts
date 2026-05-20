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
    // console.log("aziiiiiiz",this.selectedTemplate?.cvData)
    return this.selectedTemplate?.cvData;
  }
}
