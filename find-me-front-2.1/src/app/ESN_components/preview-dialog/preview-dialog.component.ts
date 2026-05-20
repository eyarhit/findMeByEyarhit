import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-preview-dialog',
  templateUrl: './preview-dialog.component.html',
  styleUrls: ['./preview-dialog.component.scss']
})
export class PreviewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  formatDescription(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•\s(.*?)(\n|$)/g, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  }
}