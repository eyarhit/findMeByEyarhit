import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SessionLoginComponent } from './pages/session-login/session-login.component';
import { MotDePasseOublierComponent } from './pages/mot-de-passe-oublier/mot-de-passe-oublier.component';
import { ReinitialiserMotPasseComponent } from './pages/reinitialiser-mot-passe/reinitialiser-mot-passe.component';
import { AcceuilFindMeComponent } from './pages/acceuil-find-me/acceuil-find-me.component';

import { QuizComponent } from './components/quiz/quiz.component';

import { RegisterCandidatTunisieComponent } from './pages/register-candidat/register-candidat-tunisie.component';

import { CvInformationPersonnellesComponent } from './pages/cv-information-personnelles/cv-information-personnelles.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { VerificationComponent } from './components/verification/verification.component';
import { QuizSeulepageComponent } from './components/quiz-seulepage/quiz-seulepage.component';
import { PopupSuccessQuizComponent } from './components/popup-success-quiz/popup-success-quiz.component';
import { PopupEchecQuizComponent } from './components/popup-echec-quiz/popup-echec-quiz.component';
import { UploadCvPdfComponent } from './pages/upload-cv-pdf/upload-cv-pdf.component';
import { InformationCvComponent } from './components/information-cv/information-cv.component';
import { CvManuelleComponent } from './pages/cv-manuelle/cv-manuelle.component';
import { ProfilComponent } from './components/profil/profil.component';
import { ProfilPageComponent } from './pages/profil-page/profil-page.component';
import { CometenceProfessionnelPopupComponent } from './components/cometence-professionnel-popup/cometence-professionnel-popup.component';
import { CertifDiplomeComponent } from './components/certif-diplome/certif-diplome.component';
import { ModelCvComponent } from './components/model-cv/model-cv.component';

import { CarteProfilCandiatComponent } from './components/carte-profil-candiat/carte-profil-candiat.component';
import { PopupCvComponent } from './components/popup-cv/popup-cv.component';
import { MissionDetailsComponent } from './pages/mission-details/mission-details.component';
import { MissionsPageComponent } from './pages/missions-page/missions-page.component';
import { ListDocumentComponent } from './components/list-document/list-document.component';



import { AuthGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { AlreadyAuthGuard } from './guards/AlreadyAuthGuard';
import { UploadCvComponent } from './components/upload-cv/upload-cv.component';
import { CreezCvComponent } from './components/creez-cv/creez-cv.component';
import { StatistiqueUtilisateurPageComponent } from './pages/statistique-utilisateur/statistique-utilisateur-page.component';
import { ListUtilisateurComponent } from './components/list-utilisateur/list-utilisateur.component';
import { RegisterFeelancerComponent } from './pages/register-freelancer/register-freelancer.component';
import { SidebarEspaceComponent } from './components/sidebar/sidebar.component';
import { Etape1MissionComponent } from './components/etape1-mission/etape1-mission.component';
import { Etape2MissionDescriptionComponent } from './components/etape2-mission-description/etape2-mission-description.component';
import { Etape3MissionComponent } from './components/etape3-mission/etape3-mission.component';
import { DossierCompetenceComponent } from './ESN_components/dossier-competence/dossier-competence.component';
import { ListesChargeDeRecrutementComponent } from './ESN_components/listes-charge-de-recrutement/listes-charge-de-recrutement.component';
import { ListeInterContratComponent } from './ESN_components/liste-inter-contrat/liste-inter-contrat.component';
import { InviterChargeDeRecrutementComponent } from './ESN_components/inviter-charge-de-recrutement/inviter-charge-de-recrutement.component';

import { InviterInterContratComponent } from './ESN_components/inviter-inter-contrat/inviter-inter-contrat.component';
import { DashboardESNComponent } from './ESN_components/dashboard-esn/dashboard-esn.component';
import { MissionsOffresPostulerComponent } from './pages/missions-offres-postulées/missions-offres-postulées.component';
import { OffresfavoriesComponent } from './components/offresfavories/offresfavories.component';
import { PublierContratComponent } from './components/publier_contrat/publier_contrat.component';
import { ChatComponent } from './components/chat/chat.component';


// Child components for SidebarEspaceComponent routes (make sure these are imported)

const routes: Routes = [
  // Public or unauthenticated routes
  { path: 'register-portage-salarial', component: RegisterFeelancerComponent, canActivate: [AlreadyAuthGuard],data: { role: 'PORTAGE_SALARIAL' } },
  { path: 'register-freelancer', component: RegisterFeelancerComponent, canActivate: [AlreadyAuthGuard],data: { role: 'FREELANCER' } },
  { path: 'register-ESN', component: RegisterFeelancerComponent, canActivate: [AlreadyAuthGuard],data: { role: 'ESN_ADMIN' } },
  { path: 'register-candidat', component: RegisterCandidatTunisieComponent, canActivate: [AlreadyAuthGuard] },
  { path: 'session-login', component: SessionLoginComponent, canActivate: [AlreadyAuthGuard] },
  { path: 'mot-de-passe-oublier', component: MotDePasseOublierComponent, canActivate: [AlreadyAuthGuard] },
  { path: 'reinitialiser-mot-passe', component: ReinitialiserMotPasseComponent, canActivate: [AlreadyAuthGuard] },
  { path: 'login', component: LoginPageComponent, canActivate: [AlreadyAuthGuard] },

  // Public pages
  { path: 'acceuil-find-me', component: AcceuilFindMeComponent },
  { path: 'quiz', component: QuizComponent },
  { path: 'verif', component: VerificationComponent },
  { path: 'quiz-popup', component: QuizSeulepageComponent },
  { path: 'pop-up-success-quiz', component: PopupSuccessQuizComponent },
  { path: 'pop-up-echec-quiz', component: PopupEchecQuizComponent },
  { path: 'popup-carriere-professionnel', component: CometenceProfessionnelPopupComponent },
  { path: 'etape1-mission', component: Etape1MissionComponent},
  { path: 'etape2-mission', component: Etape2MissionDescriptionComponent},
  { path: 'etape3-mission', component: Etape3MissionComponent},
  { path: 'dossier-competence', component: DossierCompetenceComponent},
  { path: 'listes-charge-de-recrutement', component: ListesChargeDeRecrutementComponent},
  { path: 'ListeInterContrat', component: ListeInterContratComponent},
  { path: 'inviter-charge-de-recrutement', component: InviterChargeDeRecrutementComponent},
  { path: 'inviter-inter-contrat', component: InviterInterContratComponent},
  { path: 'Dashboard-ESN', component:DashboardESNComponent},
  { path: 'chatMessage', component: ChatComponent},
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
  },


  // Authenticated routes with role guards and children
  {
    path: 'cv',
    component: SidebarEspaceComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER', 'ADMIN'] },
    children: [
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
      { path: 'accueil', component: CreezCvComponent },
      { path: 'remplir', component: InformationCvComponent},
      { path: 'importer', component: UploadCvComponent},
    ],
  },
    {
    path: 'gestion-employer',
    component: SidebarEspaceComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: ['ESN_ADMIN', 'ESN_COMMERCIAL'] },
    children: [
      { path: '', redirectTo: 'esn-commercial', pathMatch: 'full' },
      { path: 'esn-commercial', component: ListUtilisateurComponent,data: { userRole: 'ESN_COMMERCIAL' }},
      { path: 'charger-recrutement', component: ListUtilisateurComponent,data: { userRole: 'CHARGEDERECRUTEMENT' }},   
      // { path: 'ingenieuraffaire', component: ListUtilisateurComponent,data: { userRole: 'INGENIEURDAFFAIRE' }},
      { path: 'intercontrat', component: ListUtilisateurComponent,data: { userRole: 'INTERCONTRAT' }},
    ],
  },
  {
    path: 'Missions',
    component: SidebarEspaceComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: ['PORTAGE_SALARIAL','FREELANCER', 'ADMIN','ESN_ADMIN','ESN_COMMERCIAL'] },
    children: [
      { path: '', redirectTo: 'Liste', pathMatch: 'full' },
      { path: 'Liste', component: MissionsPageComponent,data: { espace: 'Liste Mission' } },
      { path: 'Postuler', component: MissionsOffresPostulerComponent,data: { espace: 'Mission' }  },
      { path: 'candidatures/:missionId', component: ListUtilisateurComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['ESN_ADMIN','ESN_COMMERCIAL'], espace: 'Mission publier' } },
      { path: 'missionsfavories', component: OffresfavoriesComponent,data: { espace: 'Mission' }  }, 
      { path: 'creer', component: PublierContratComponent,data: { espace: 'Mission' }},
      { path: 'publier', component: MissionsPageComponent,data: { espace: 'Mission publier' }},
    ],
  },
    {
    path: 'Offres',
    component: SidebarEspaceComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: ['CANDIDAT', 'ADMIN','ESN_ADMIN','ESN_COMMERCIAL','CHARGEDERECRUTEMENT'] },
    children: [
      { path: '', redirectTo: 'Liste', pathMatch: 'full' },
      { path: 'Liste', component: MissionsPageComponent,data: { espace: 'Liste Offres' } },
      { path: 'Postuler', component: MissionsOffresPostulerComponent,data: { espace: 'Offre' }  },
      { path: 'candidatures/:missionId', component: ListUtilisateurComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['ESN_ADMIN','ESN_COMMERCIAL','CHARGEDERECRUTEMENT'], espace: 'Offres publier' } },
      { path: 'offresfavories', component: OffresfavoriesComponent,data: { espace: 'Offre' }  },
      { path: 'creer', component: PublierContratComponent,data: { espace: "Offres d'emplois" }},
      { path: 'publier', component: MissionsPageComponent,data: { espace: 'Offres publier' }},
    ],
  },
  {
    path: 'profil',
    component: SidebarEspaceComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER', 'ADMIN', 'ESN_ADMIN','ESN_COMMERCIAL','CHARGEDERECRUTEMENT'] },
    children: [
      { path: '', component: ProfilComponent },
    ],
  },
  {
    path: 'utilisateur',
    component: SidebarEspaceComponent,
    canActivate: [AuthGuard, roleGuard],
    data: { expectedRole: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'accueil', pathMatch: 'full' },
      { path: 'accueil', component: StatistiqueUtilisateurPageComponent },
      {path: 'candidat', component: ListUtilisateurComponent,data: { userRole: 'CANDIDAT' }},      
      {path: 'entreprise', component: ListUtilisateurComponent,data: { userRole: 'ENTREPRISE' }},
      {path: 'chargerecrutement', component: ListUtilisateurComponent,data: { userRole: 'CHARGEDERECRUTEMENT' }},
      {path: 'ingenieuraffaire', component: ListUtilisateurComponent,data: { userRole: 'INGENIEURDAFFAIRE' }},
      {path: 'admin', component: ListUtilisateurComponent,data: { userRole: 'ADMIN' }},
      {
        path: 'bi',
        redirectTo: '/admin/bi-dashboard',
        pathMatch: 'full',
      },
    ],
  },
  // Other authenticated routes (no children)
  { path: 'sidebar-header-pages', component: CvInformationPersonnellesComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER'] } },
  { path: 'upload-cv', component: UploadCvPdfComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER'] } },
  { path: 'candidat-profil', component: ProfilComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER'] } },
  { path: 'profil-page', component: ProfilPageComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER'] } },
  { path: 'certif-diplome', component: CertifDiplomeComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER'] } },
  { path: 'model-cv', component: ModelCvComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER'] } },
  { path: 'carte-profil-candidat', component: CarteProfilCandiatComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT'] } },
  { path: 'popup-cv', component: PopupCvComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER', 'ADMIN'] } },
  { path: 'ListDocuments', component: ListDocumentComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER'] } },
  { path: 'information-cv', component: InformationCvComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER'] } },
  { path: 'cv-manuelle', component: CvManuelleComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','PORTAGE_SALARIAL','FREELANCER'] } },
  { path: 'MissionDetails/:jobId', component: MissionDetailsComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['PORTAGE_SALARIAL','FREELANCER','ESN_ADMIN','ESN_COMMERCIAL'], espace: 'Postuler Mission'  } },
 { path: 'OffreDetails/:jobId', component: MissionDetailsComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['CANDIDAT','ESN_ADMIN','ESN_COMMERCIAL','CHARGEDERECRUTEMENT'], espace: 'Postuler Offre'  } },
  { path: 'MissionPublierDetails/:jobId', component: MissionDetailsComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['ESN_ADMIN','ESN_COMMERCIAL'] , espace: 'Mission publier' } },
 { path: 'OffrePublierDetails/:jobId', component: MissionDetailsComponent, canActivate: [AuthGuard, roleGuard], data: { expectedRole: ['ESN_ADMIN','ESN_COMMERCIAL','CHARGEDERECRUTEMENT'] , espace: 'Offres publier' } },


  // Default and fallback routes
  { path: '', redirectTo: '/cv', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
