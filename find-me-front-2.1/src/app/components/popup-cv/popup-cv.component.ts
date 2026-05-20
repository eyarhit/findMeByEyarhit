import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-popup-cv',
  templateUrl: './popup-cv.component.html',
  styleUrl: './popup-cv.component.scss'
})
export class PopupCvComponent {
  isVisible = true;

  closePopup() {
    this.isVisible = false;
  }
}