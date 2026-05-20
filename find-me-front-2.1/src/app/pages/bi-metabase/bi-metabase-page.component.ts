import { Component } from '@angular/core';

@Component({
  selector: 'app-bi-metabase-page',
  templateUrl: './bi-metabase-page.component.html',
  styleUrl: './bi-metabase-page.component.css',
})
export class BiMetabasePageComponent {
  readonly metabaseUrl = 'http://localhost:3030';
}
