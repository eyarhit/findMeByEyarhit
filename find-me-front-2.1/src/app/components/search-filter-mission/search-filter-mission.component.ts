import { Component, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter-mission.component.html',
  styleUrls: ['./search-filter-mission.component.scss']
})
export class SearchFilterMissionComponent {
  searchText: string = '';
  selectedExperience: string = '';
  selectedCity: string = '';
  selectedSalary: string = '';
  selectedSkills: string = '';
  typeContrat: string = '';
  userRole: string | null = null;
email: string | null = null;
targetmarket: string | null = null;
  @Output() searchCriteria = new EventEmitter<any>();
constructor(private authService: AuthService,private apiRoutingServiceUser: ApiRoutingServiceUser) {}

  ngOnInit(): void {
    
    this.userRole = this.authService.getRole(); 
    this.email = this.authService.getEmail();
    const params = new HttpParams().set('email', this.email!);
   this.apiRoutingServiceUser.requestGetApi('/find-user-by-email', params).subscribe({
  next: (response) => {
    this.targetmarket=response.targetmarket
    //console.log(response.targetmarket)
  },
  error: (error) => {
    console.error(error);
  }
});
  }
  onSearchInput() {
    this.emitSearchCriteria();
  }

  onFilterChange() {
    this.emitSearchCriteria();
  }

  onSearch() {
    this.emitSearchCriteria();
  }

  emitSearchCriteria() {
    this.searchCriteria.emit({
      searchText: this.searchText,
      experience: this.selectedExperience,
      city: this.selectedCity,
      salary: this.selectedSalary,
      skills: this.selectedSkills,
      typeContrat: this.typeContrat
    });
  }
}
