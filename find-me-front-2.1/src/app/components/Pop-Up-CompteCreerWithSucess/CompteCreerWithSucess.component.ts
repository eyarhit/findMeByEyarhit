import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-CompteCreerWithSucess',
  templateUrl: './CompteCreerWithSucess.component.html',
  styleUrls: ['./CompteCreerWithSucess.component.scss'] // Corrected styleUrl to styleUrls
})
export class CompteCreerWithSucessComponent {

  @Input() successMessage: string = 'votre compte a été créé avec succès';
  @Input() link: string = '/';
}
