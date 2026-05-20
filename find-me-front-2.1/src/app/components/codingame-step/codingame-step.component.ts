import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AnswerRequest, CodingameService, StartSessionRequest } from '../../services/codingame.service';
import { StepTrackerService } from '../../services/step-tracker.service';

@Component({
  selector: 'app-codingame-step',
  templateUrl: './codingame-step.component.html',
  styleUrls: ['./codingame-step.component.scss']
})
export class CodingameStepComponent implements OnInit, OnDestroy {
  @Output() finish = new EventEmitter<void>();
  @Output() resultsChange = new EventEmitter<any[]>();

  steps = [
    'Niveau',
    'Domaine',
    'Framework',
    'Questions',
    'Résultat'
  ];
  
  levels = [
    { id: 3, label: 'Junior : 0–2 ans' },
    { id: 1, label: 'Senior : 3–5 ans' },
    { id: 2, label: 'Expert : 5 ans et +' }
  ];
  
  domains = [
    { id: 1, name: 'Front-end' },
    { id: 2, name: 'Back-end' },
    { id: 3, name: 'Data engineer' },
    { id: 4, name: 'Cybersecurity' },
    { id: 5, name: 'DevOps' },
    { id: 6, name: 'Full-stack' },
    { id: 7, name: 'Data scientist' },
    { id: 8, name: 'Autre' }
  ];

  frameworks = [
    { id: 1, name: 'Java' },
    { id: 2, name: 'Angular' },
    { id: 3, name: 'C++' },
    { id: 4, name: '.NET' }
  ];

  currentStep = 1;
  levelId: number | null = null;
  domainId: number | null = null;
  frameworkId: number | null = null;

  sessionId: number | null = null;

  questions: any[] = [];
  currentQuestionIndex = 0;
  userResponses: { [questionId: number]: string } = {};

  results: any[] = [];
  elapsedTime: number = 0;
  intervalId: any;
  timeSpent: number = 0;
  circleOffset: number = 0;
  private totalTime: number = 15;
  alertSound = new Audio('assets/sounds/alert_beep.wav');
  private hasPlayedAlert = false;
  
  isLoading = false;
  errorMessage = '';
  totalQuestions = 0;
  answeredQuestions = 0;
  progressPercentage = 0;

  constructor(private codingameService: CodingameService, private authService: AuthService,
    private stepTracker: StepTrackerService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = "Veuillez vous connecter pour accéder au test technique.";
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  selectLevel(levelId: number) {
    this.levelId = levelId;
    this.nextStep();
  }

  selectDomain(domainId: number) {
    this.domainId = domainId;
    this.nextStep();
  }

  selectFramework(frameworkId: number) {
    this.frameworkId = frameworkId;
    this.startSession();
  }

  nextStep() {
    this.currentStep++;
  }

  previousStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  startSession() {
    if (!this.levelId || !this.domainId) {
      this.errorMessage = "Veuillez sélectionner un niveau et un domaine.";
      return;
    }
    
    this.isLoading = true;
    //console.log('✅ userId utilisé :', this.authService.getUserId());

    const request: StartSessionRequest = {
      levelId: this.levelId,
      domainId: this.domainId
    };

    this.codingameService.startSession(request).subscribe({
      next: (session) => {
        this.sessionId = session.id;
        this.getQuestions();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = "Erreur lors du démarrage de la session. Veuillez réessayer.";
        console.error('Erreur de session:', error);
      }
    });
  }

  startGlobalTimer() {
    this.elapsedTime = this.totalTime; // Commence à 15
    this.timeSpent = 0;
    this.hasPlayedAlert = false;
    this.updateCircle();
  
    this.intervalId = setInterval(() => {
      this.elapsedTime--; // Descend de 15 vers 0
      this.timeSpent++;
      this.updateCircle();
  
      if (this.elapsedTime <= 5 && this.elapsedTime > 0 && !this.hasPlayedAlert) {
        this.alertSound.play().catch(err => console.error('Erreur audio:', err));
        this.hasPlayedAlert = true;
      }
  
      if (this.elapsedTime <= 0) {
        clearInterval(this.intervalId);
        this.finishTest(); //  directement on finit le test
      }
      
    }, 1000);
  }
  
  
  
  updateCircle() {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const progress = this.elapsedTime / this.totalTime; 
    this.circleOffset = circumference * (1 - progress);
  }
  
  
  getQuestions() {
    if (!this.levelId || !this.domainId || !this.frameworkId) {
      this.isLoading = false;
      this.errorMessage = "Paramètres manquants pour charger les questions.";
      return;
    }
    
    this.codingameService.getQuestions(this.levelId, this.domainId, this.frameworkId)
      .subscribe({
        next: (qs) => {
          if (!qs || qs.length === 0) {
            this.isLoading = false;
            this.errorMessage = "Aucune question disponible pour cette combinaison.";
            return;
          }
          
          this.questions = qs;
          this.totalQuestions = qs.length;
          this.isLoading = false;
          this.nextStep();
          this.startGlobalTimer();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = "Erreur lors du chargement des questions. Veuillez réessayer.";
          console.error('Erreur de chargement des questions:', error);
        }
      });
  }

  submitCurrentAnswer(isTimeout: boolean = false) {
    if (!this.currentQuestion) {
      console.error('Question courante non définie');
      return;
    }
  
    const question = this.currentQuestion;
    const response = this.userResponses[question.id] || '';
  
    const answer: AnswerRequest = {
      questionId: question.id,
      userResponse: response
    };
  
    this.codingameService.submitAnswer(this.sessionId!, answer).subscribe({
      next: () => {
        this.answeredQuestions++;
        this.progressPercentage = (this.answeredQuestions / this.totalQuestions) * 100;
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.questions.length) {
          this.finishTest(); // test fini
        }
      },
      error: (error) => {
        console.error('Erreur réponse:', error);
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.questions.length) {
          this.finishTest();
        }
      }
    });
  }
  

  finishTest() {
    if (!this.sessionId) {
      this.errorMessage = "Session invalide. Veuillez redémarrer le test.";
      return;
    }
    
    clearInterval(this.intervalId);
    this.timeSpent = Math.max(1, this.totalTime - this.elapsedTime);
    this.isLoading = true;
  
    this.codingameService.finishSession(this.sessionId).subscribe({
      next: (res) => {
        this.results = res;
        this.resultsChange.emit(res);
        this.nextStep();
        this.isLoading = false;
        
        // Marquer l'étape 3 comme complétée
        const userId = this.authService.getUserId();
        if (userId) {
          this.stepTracker.completeStep(userId, 3);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = "Erreur lors de la finalisation du test. Veuillez réessayer.";
        console.error('Erreur de finalisation:', error);
      }
    });
  }
  
  restartTest() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.currentStep = 1;
    this.questions = [];
    this.userResponses = {};
    this.results = [];
    this.currentQuestionIndex = 0;
    this.elapsedTime = 0;
    this.hasPlayedAlert = false;
    this.errorMessage = '';
    this.levelId = null;
    this.domainId = null;
    this.frameworkId = null;
    this.sessionId = null;
    this.answeredQuestions = 0;
    this.progressPercentage = 0;
  }

  get currentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }
}