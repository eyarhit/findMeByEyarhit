import { NgModule } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InfoCardsComponent } from './components/info-cards/info-cards.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './components/Navbar/Navbar.component'; 
import { CompteCreerWithSucessComponent } from './components/Pop-Up-CompteCreerWithSucess/CompteCreerWithSucess.component';
import { SessionLoginComponent } from './pages/session-login/session-login.component';
import { MotDePasseOublierComponent } from './pages/mot-de-passe-oublier/mot-de-passe-oublier.component';
import { ReinitialiserMotPasseComponent } from './pages/reinitialiser-mot-passe/reinitialiser-mot-passe.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { RegisterCandidatTunisieComponent } from './pages/register-candidat/register-candidat-tunisie.component';
import { CreezCvComponent } from './components/creez-cv/creez-cv.component';
import { LoginComponent } from './components/login/login.component';
import { PopupEchecQuizComponent } from './components/popup-echec-quiz/popup-echec-quiz.component';
import { PopupSuccessQuizComponent } from './components/popup-success-quiz/popup-success-quiz.component';
import { QuizSeulepageComponent } from './components/quiz-seulepage/quiz-seulepage.component';
import { VerificationComponent } from './components/verification/verification.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { CvInformationPersonnellesComponent } from './pages/cv-information-personnelles/cv-information-personnelles.component';
import { UploadCvComponent } from './components/upload-cv/upload-cv.component';
import { UploadCvPdfComponent } from './pages/upload-cv-pdf/upload-cv-pdf.component';
import { InformationCvComponent } from './components/information-cv/information-cv.component';
import { CvManuelleComponent } from './pages/cv-manuelle/cv-manuelle.component';
import { ProfilComponent } from './components/profil/profil.component';
import { AuthService } from './services/auth.service';
import { ProfilPageComponent } from './pages/profil-page/profil-page.component';
import { CometenceProfessionnelPopupComponent } from './components/cometence-professionnel-popup/cometence-professionnel-popup.component';
import { CertifDiplomeComponent } from './components/certif-diplome/certif-diplome.component';
import { ModelCvComponent } from './components/model-cv/model-cv.component';
import { ListDocumentComponent } from './components/list-document/list-document.component';
import { CarteProfilCandiatComponent } from './components/carte-profil-candiat/carte-profil-candiat.component';
import { VisualisationCvComponent } from './components/visualisation-cv/visualisation-cv.component';
import { SauvegardeCvComponent } from './components/sauvegarde-cv/sauvegarde-cv.component';
import { PopupCvComponent } from './components/popup-cv/popup-cv.component';
import { MissionDetailsComponent } from './pages/mission-details/mission-details.component';
import { MissionsPageComponent } from './pages/missions-page/missions-page.component';
import { SearchFilterMissionComponent } from './components/search-filter-mission/search-filter-mission.component';
import { MissionCarteComponent } from './components/mission-carte/mission-carte.component';
import { MissionDescriptionComponent } from './components/mission-description/mission-description.component';
import { CodingameStepComponent } from './components/codingame-step/codingame-step.component';
import { TypeSejourComponent } from './components/type_sejour/type_sejour.component';
import { InterfaceCertifComponent } from './components/interface-certif/interface-certif.component';
import { CarteTypeSejourComponent } from './components/carte-type-sejour/carte-type-sejour.component';
import { ListUtilisateurComponent } from './components/list-utilisateur/list-utilisateur.component';
import { StatistiqueUtilisateurPageComponent } from './pages/statistique-utilisateur/statistique-utilisateur-page.component';
import { BiMetabasePageComponent } from './pages/bi-metabase/bi-metabase-page.component';
import { NotificationBellComponent } from './components/NotificationBell/NotificationBell.component';
import { RegisterFeelancerComponent } from './pages/register-freelancer/register-freelancer.component';
import { SidebarEspaceComponent } from './components/sidebar/sidebar.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Etape1MissionComponent } from './components/etape1-mission/etape1-mission.component';
import { Etape2MissionDescriptionComponent } from './components/etape2-mission-description/etape2-mission-description.component';
import { ShowMissionComponent } from './components/show-mission/show-mission.component';
import { Etape3MissionComponent } from './components/etape3-mission/etape3-mission.component';
import { PreviewDialogComponent } from './ESN_components/preview-dialog/preview-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DossierCompetenceComponent } from './ESN_components/dossier-competence/dossier-competence.component';
import { ListesChargeDeRecrutementComponent } from './ESN_components/listes-charge-de-recrutement/listes-charge-de-recrutement.component';
import { ListeInterContratComponent } from './ESN_components/liste-inter-contrat/liste-inter-contrat.component';
import { InviterChargeDeRecrutementComponent } from './ESN_components/inviter-charge-de-recrutement/inviter-charge-de-recrutement.component';

import { InviterInterContratComponent } from './ESN_components/inviter-inter-contrat/inviter-inter-contrat.component';
import { DashboardESNComponent } from './ESN_components/dashboard-esn/dashboard-esn.component';




import { MissionsOffresPostulerComponent } from './pages/missions-offres-postulées/missions-offres-postulées.component';
import { CandidateCarteComponent } from './components/condidate-carte/condidate-carte.component';
import { OffresfavoriesComponent } from './components/offresfavories/offresfavories.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { InviterEmployerESNComponent } from './components/inviter-employer-esn/inviter-employer-esn.component';
import { PublierContratComponent } from './components/publier_contrat/publier_contrat.component';
import { DossierCompetencesComponent } from './components/dossier-competences/dossier-competences.component';
import { ChatComponent } from './components/chat/chat.component';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { MessengerChatComponent } from './components/messenger-chat/messenger-chat.component';




@NgModule({  
  declarations: [
    AppComponent,
    NavbarComponent,
    InfoCardsComponent,
    RegisterCandidatTunisieComponent,
    CompteCreerWithSucessComponent,
    SessionLoginComponent,
    MotDePasseOublierComponent,
    ReinitialiserMotPasseComponent,
    QuizComponent,
    CreezCvComponent,
    LoginComponent,
    PopupEchecQuizComponent,
    PopupSuccessQuizComponent,
    QuizSeulepageComponent,
    VerificationComponent,
    LoginPageComponent,
    CvInformationPersonnellesComponent,
    UploadCvComponent,
    UploadCvPdfComponent,
    InformationCvComponent,
    CvManuelleComponent,
    ProfilComponent,
    ProfilPageComponent,
    CometenceProfessionnelPopupComponent,
    CertifDiplomeComponent,
    ModelCvComponent,
    ListDocumentComponent,
    CarteProfilCandiatComponent,
    VisualisationCvComponent,
    SauvegardeCvComponent,
    PopupCvComponent,
    MissionDetailsComponent,
    MissionsPageComponent,
    SearchFilterMissionComponent,
    MissionCarteComponent,
    MissionDescriptionComponent,
    TypeSejourComponent , 
    CodingameStepComponent,
    SidebarEspaceComponent,
    InterfaceCertifComponent,
    CarteTypeSejourComponent,
    ListUtilisateurComponent,
    StatistiqueUtilisateurPageComponent,
    BiMetabasePageComponent,
    NotificationBellComponent,
    RegisterFeelancerComponent,
    Etape1MissionComponent,
    Etape2MissionDescriptionComponent,
    ShowMissionComponent,
    Etape3MissionComponent,
    PreviewDialogComponent,
    DossierCompetenceComponent,
    ListesChargeDeRecrutementComponent,
    ListeInterContratComponent,
    InviterInterContratComponent,
    InviterChargeDeRecrutementComponent,
    DashboardESNComponent,
    MissionsOffresPostulerComponent,
    CandidateCarteComponent,
    OffresfavoriesComponent,
    InviterEmployerESNComponent,
    PublierContratComponent,DossierCompetencesComponent,
    ChatComponent,
    MessengerChatComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    BrowserModule,
    PickerModule,


    
],

  exports: [
    InformationCvComponent
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    AuthService,
    provideAnimationsAsync(),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
