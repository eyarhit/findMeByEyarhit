import { DocumentServiceService } from '../../services/document-service.service';
import { AuthService } from '../../services/auth.service';
import { Component, Inject, PLATFORM_ID, OnInit, Input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiRoutingServiceUser } from '../../services/api-routing-user.service';
import { User } from '../../models/User.model';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ExperienceService } from '../../services/experience.service';


@Component({
  selector: 'app-carte-profil-candiat',
  templateUrl: './carte-profil-candiat.component.html',
  styleUrls: ['./carte-profil-candiat.component.scss']
})
export class CarteProfilCandiatComponent implements OnInit {
  @Input()  profileRole : string =""
  @Input()  profileEmail : string =""
  @Input() profileId : number | null = null;
  email: string = '';
  role: string = '';
  profilePicture: string = '';
  profileTitre: string = 'Titre';
  profileSocieter: string = '';
  profileName: string = 'Nom';
  profilePrenom: string= 'prenom';
  profilePhone: string = 'Non spécifié';
  profileLinkedIn: string = 'Entrer lien de LinkedIn';
  profileLocation: string = 'Non spécifié';
  profileBirthDate: string = 'Année-moi-jour';
  profileDescription: string = 'Non spécifié';
  profileSexe: any;
  titreDeProfilControl = new FormControl('');
  totalYears: number = 0;
  userId!: number;
  

 
  isEditingContact: boolean = false;
  isEditingLocation: boolean = false;
  isEditingPersonal: boolean = false;
  isSavedContact: boolean = false;
  isSavedLocation: boolean = false;
  isSavedPersonal: boolean = false;
  isEditingTitle: boolean = false;
  isSavedTitre: boolean = false;
  showAcademicPopup: boolean = false;

  
  selectedFile: File | null = null;
  isUploading: boolean = false;

  userData!: User;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiServiceUser: ApiRoutingServiceUser,
    private authService: AuthService,
    private documentService: DocumentServiceService ,
    private experienceService: ExperienceService,
  ) {}

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {
      const storedImage = sessionStorage.getItem('ImageProfile');
      if (storedImage && this.profileEmail==="") {

        this.profilePicture = storedImage;
      }
    }

    this.userId = this.authService.getUserId() || 0;
    this.role = this.authService.getRole() || "";
    this.loadUserData();

    
    if (this.userId) {
      if((this.role!='ESN_ADMIN' && this.role!='ESN_COMMERCIAL') || (this.profileRole!='ESN_ADMIN'&& this.profileRole!='ESN_COMMERCIAL' && this.profileRole!='')){

   

      this.experienceService.getTotalExperienceYears(this.userId).subscribe({
        next: (years) => this.totalYears = years,
        // error: (err) => console.error('Erreur lors de la récupération du total:', err)
      });
    } else {
      // console.error('Impossible de récupérer les années d\'expérience: userId est null');
    }
  }}

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')) {
        this.selectedFile = file;

        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            this.profilePicture = e.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert('Seules les images JPG, JPEG ou PNG sont autorisées.');
        this.selectedFile = null;
      }
    }
  }

  uploadProfilePicture(): void {
    if (!this.selectedFile) {
      alert('Veuillez sélectionner un fichier avant de sauvegarder.');
      return;
    }

    this.isUploading = true;
    const userId: number | null = this.authService.getUserId();
    const fileName = `profile_${userId}_${Date.now()}`;

    if (userId !== null) {
      this.documentService.getDocumentsByUserAndFolder(userId, "ProfileImage").subscribe({
        next: (response) => {
          if (response.length > 0) {
            this.documentService.deleteDocument(response[0].document).subscribe();
          }
        }
      }); 
    }

    this.documentService.uploadDocument(this.selectedFile, fileName, "ProfileImage").subscribe({
      next: (response) => {
        //console.log('Document uploaded successfully:', response.presignedUrl);
        sessionStorage.setItem("ImageProfile", response.presignedUrl);
        this.selectedFile = null;
        this.isUploading = false;
        this.authService.notifyProfileUpdate();
      },
      error: (error) => {
        console.error('Error during document upload:', error);
        this.isUploading = false;
      }
    });
  }

  loadUserData(): void {
    if(this.profileId!=null)
      {this.userId = this.profileId;}else{
      this.userId = this.authService.getUserId() || 0;
    }
    const token = this.authService.getToken();
    
    if(this.profileEmail!=""){
      //console.log(this.email)
      this.email = this.profileEmail
          this.documentService.getDocumentsByUserAndFolder(this.userId, "ProfileImage").subscribe({
        next: (response) => {
          if(response.length > 0){
          this.profilePicture=response[0].presignedUrl}

        }
      });
    
    }
    else{
    this.email = this.authService.getEmailFromToken();}


    if (this.email && token) {
      this.apiServiceUser.getUserByEmail(this.email, token).subscribe({
        next: (user: User) => {
          this.userData = user;
          //console.log(user)
          this.updateProfile();
        
          // Maintenant que nous avons les données utilisateur, récupérer les années d'expérience
          if (this.userId && this.role!="ESN_ADMIN") {
            this.experienceService.getTotalExperienceYears(this.userId).subscribe({
              next: (years) => this.totalYears = years,
              error: (err) => console.error('Erreur lors de la récupération du total:', err)
            });
          }
        },
        error: (err) => {
          console.error('Failed to fetch user data:', err);
        }
      });
    }
  }
  
  formatExperience(years: number): string {
    if (years === 0) {
      return "0 ans";
    } else if (years === 1) {
      return "1 an (Junior)";
    } else if (years <= 2) {
      return "1-2 ans (Junior)";
    } else if (years <= 4) {
      return "2-4 ans (Senior)";
    } else {
      return "4+ ans (Expert)";
    }
  }

  
    private setDefaultBirthDate(): void {
    // Set default to 18 years ago
    const defaultDate = 'Non spécifié';
    this.profileBirthDate = defaultDate;
  }
  

  updateProfile(): void {
    if (this.userData) {
      this.profileSocieter = this.userData.nomSociete 
      this.profileName = this.userData.lastName;
      this.profilePrenom= this.userData.firstName ;
      this.profileEmail = this.userData.email || 'Non spécifié';
      this.profilePhone = this.userData.phone || 'Non spécifié';
      this.profileLinkedIn = this.userData.linkedinUrl || 'Entrer lien de LinkedIn';
      this.profileLocation = this.userData.address || 'Non spécifié';
      this.profileBirthDate = this.userData.dateOfBirth ? this.formatDate(this.userData.dateOfBirth) :this.formatDate(Date.now().toString());
      this.profileDescription = this.userData.sexe || 'Non spécifié';
    this.setDefaultBirthDate()
    }
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  }

  updateUserData(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No token available');
      return;
    }

    const updatedData = {
      firstName: this.userData.firstName,
      lastName: this.userData.lastName,
      phone: this.userData.phone,
      linkedinUrl: this.userData.linkedinUrl,
      address: this.userData.address,
      dateOfBirth: this.userData.dateOfBirth instanceof Date ?
        this.userData.dateOfBirth.toISOString() :
        this.userData.dateOfBirth,
      sexe: this.userData.sexe,
      nomSociete: this.userData.nomSociete
    };

    this.apiServiceUser.updateUserByEmail(this.userData.email, updatedData, token).subscribe({
      next: (response) => {
        //console.log('User updated successfully:', response);
        const storedProfile = sessionStorage.getItem('profile');
const existingProfile = storedProfile ? JSON.parse(storedProfile) : {};

existingProfile.firstName = updatedData.firstName;
existingProfile.lastName = updatedData.lastName;

sessionStorage.setItem('profile', JSON.stringify(existingProfile));

        
        this.authService.notifyProfileUpdate();
        this.loadUserData();
      },
      error: (error) => {
        console.error('Error updating user:', error);
      }
    });
  }

  editBlock(block: string): void {
    if (block === 'contact') {
      this.isEditingContact = !this.isEditingContact;
      this.isSavedContact = false;
    } else if (block === 'location') {
      this.isEditingLocation = !this.isEditingLocation;
      this.isSavedLocation = false;
    } else if (block === 'personal') {
      this.isEditingPersonal = !this.isEditingPersonal;
      this.isSavedPersonal = false;
    }
  }

  editInfo(field: string): void {
    let newValue = prompt(`Veuillez entrer la nouvelle valeur pour ${field}`);
    if (newValue !== null) {
      if (field === 'Titre') {
        this.userData.nomSociete = newValue;
        this.profileTitre = newValue;
      } else if (field === 'name') {
        this.profileName = this.userData.lastName;
        this.profilePrenom = this.userData.firstName;
      } else if (field === 'birthdate') {
     
        this.userData.dateOfBirth = new Date(newValue);
        this.profileBirthDate = newValue;
      } else if (field === 'description') {
        this.userData.sexe = newValue;
        this.profileDescription = newValue;
      } else if (field === 'phone') {
        this.userData.phone = newValue;
        this.profilePhone = newValue;
      } else if (field === 'linkedin') {
        this.userData.linkedinUrl = newValue;
        this.profileLinkedIn = newValue;
      } else if (field === 'address') {
        this.userData.address = newValue;
        this.profileLocation = newValue;
      }
 
      this.updateUserData();
    }
  }

  saveBlock(block: string): void {
    if (!this.userData) return;
  
    if (block === 'Titre') {
      this.isSavedTitre = true;
      this.isEditingTitle = false;
      this.userData.nomSociete = this.profileTitre;
    } else if (block === 'contact') {
      this.isSavedContact = true;
      this.isEditingContact = false;
      this.userData.email = this.profileEmail;  
      this.userData.phone = this.profilePhone;
      this.userData.linkedinUrl = this.profileLinkedIn;
    } else if (block === 'location') {
      this.isSavedLocation = true;
      this.isEditingLocation = false;
      this.userData.address = this.profileLocation;
    } else if (block === 'personal') {
      this.isSavedPersonal = true;
      this.isEditingPersonal = false;
  
      this.userData.firstName = this.profilePrenom;
      this.userData.lastName = this.profileName;
      this.userData.dateOfBirth = this.profileBirthDate as any;
      this.userData.sexe = this.profileDescription;
      this.userData.email = this.profileEmail; 
    }
  
    this.updateUserData();
  }
    formatDisplayDate(dateString: string): string {
    if (!dateString) return 'Non spécifiée';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return dateString; // Return raw string if parsing fails
    }
  }
  
}
