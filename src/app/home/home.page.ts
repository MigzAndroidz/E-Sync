import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonCheckbox,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  LoadingController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  mailOutline,
  lockClosedOutline,
  personOutline,
  logInOutline,
  personAddOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  arrowForwardOutline,
  logOutOutline,
  shieldCheckmarkOutline,
  keyOutline,
  schoolOutline
} from 'ionicons/icons';
import { AuthService, SafeUser } from '../services/auth';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonCheckbox,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner
  ]
})
export class HomePage implements OnInit {
  activeSegment: 'login' | 'signup' = 'login';

  loginForm!: FormGroup;
  signUpForm!: FormGroup;

  showLoginPassword = false;
  showSignUpPassword = false;

  isLoading = false;
  loginSubmitted = false;
  signUpSubmitted = false;

  currentUser: SafeUser | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline,
      mailOutline,
      lockClosedOutline,
      personOutline,
      logInOutline,
      personAddOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      arrowForwardOutline,
      logOutOutline,
      shieldCheckmarkOutline,
      keyOutline,
      schoolOutline
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.checkRememberedEmail();
    this.subscribeToCurrentUser();
  }

  /**
   * Initialize Reactive Forms with strict validations
   */
  private initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.signUpForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Prefill remembered email if available
   */
  private checkRememberedEmail(): void {
    const rememberedEmail = this.authService.getRememberedEmail();
    if (rememberedEmail) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        rememberMe: true
      });
    }
  }

  /**
   * Track session changes
   */
  private subscribeToCurrentUser(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  /**
   * Handle segment switch between 'login' and 'signup'
   */
  onSegmentChange(event: any): void {
    const nextSegment = event.detail?.value || event.target?.value;
    if (nextSegment === 'login' || nextSegment === 'signup') {
      this.activeSegment = nextSegment;
      this.loginSubmitted = false;
      this.signUpSubmitted = false;
    }
  }

  /**
   * Switch active segment programmatically
   */
  switchSegment(segment: 'login' | 'signup'): void {
    this.activeSegment = segment;
    this.loginSubmitted = false;
    this.signUpSubmitted = false;
  }

  /**
   * Toggle password input visibility in Login form
   */
  toggleLoginPassword(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  /**
   * Toggle password input visibility in Sign Up form
   */
  toggleSignUpPassword(): void {
    this.showSignUpPassword = !this.showSignUpPassword;
  }

  /**
   * Helper to evaluate field error display
   */
  isFieldInvalid(form: FormGroup, fieldName: string, isSubmitted: boolean): boolean {
    const control = form.get(fieldName);
    if (!control) return false;
    return control.invalid && (control.dirty || control.touched || isSubmitted);
  }

  /**
   * Authenticate user & route based on role ('admin' -> /admin-dashboard, 'student' -> /student-dashboard)
   */
  async onLogin(): Promise<void> {
    this.loginSubmitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      await this.showWarningToast('Please complete all required fields correctly.');
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;

    const loading = await this.loadingCtrl.create({
      message: 'Authenticating with E-Sync...',
      spinner: 'crescent'
    });
    await loading.present();
    this.isLoading = true;

    this.authService.login({ email, password, rememberMe }).subscribe({
      next: async (res) => {
        this.isLoading = false;
        await loading.dismiss();
        await this.showSuccessToast(res.message);

        this.loginSubmitted = false;

        // Post-Login Role-Based Routing
        if (res.user.role === 'admin') {
          await this.router.navigate(['/admin-dashboard']);
        } else {
          await this.router.navigate(['/student-dashboard']);
        }
      },
      error: async (err) => {
        this.isLoading = false;
        await loading.dismiss();
        await this.showErrorToast(err.message || 'Login failed. Please try again.');
      }
    });
  }

  /**
   * Register new user (assigns 'student' role by default)
   */
  async onSignUp(): Promise<void> {
    this.signUpSubmitted = true;

    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      await this.showWarningToast('Please fill in valid details to register for ITlympics.');
      return;
    }

    const { firstName, lastName, email, password } = this.signUpForm.value;

    const loading = await this.loadingCtrl.create({
      message: 'Submitting ITlympics registration to E-Sync...',
      spinner: 'crescent'
    });
    await loading.present();
    this.isLoading = true;

    this.authService.register({ firstName, lastName, email, password, role: 'student' }).subscribe({
      next: async (res) => {
        this.isLoading = false;
        await loading.dismiss();
        await this.showSuccessToast(res.message);

        // Prepopulate login form and switch to login view
        this.signUpForm.reset();
        this.signUpSubmitted = false;
        this.loginForm.patchValue({ email });
        this.activeSegment = 'login';
      },
      error: async (err) => {
        this.isLoading = false;
        await loading.dismiss();
        await this.showErrorToast(err.message || 'Registration failed. Please try again.');
      }
    });
  }

  /**
   * Trigger forgot password flow
   */
  async onForgotPassword(): Promise<void> {
    const email = this.loginForm.get('email')?.value?.trim();

    if (!email) {
      await this.showWarningToast(
        'Please enter your registered email in the email field first.'
      );
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    if (this.loginForm.get('email')?.invalid) {
      await this.showWarningToast('Please enter a valid email address.');
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Processing password recovery...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.resetPassword(email).subscribe({
      next: async (res) => {
        await loading.dismiss();
        await this.showSuccessToast(res.message);
      },
      error: async (err) => {
        await loading.dismiss();
        await this.showErrorToast(err.message || 'Unable to process reset request.');
      }
    });
  }

  /**
   * Helper to quickly populate testing accounts
   */
  fillTestingCredentials(role: 'admin' | 'student'): void {
    if (role === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@vits.edu.ph',
        password: 'admin123',
        rememberMe: true
      });
      this.showSuccessToast('Prefilled VITS Admin credentials (admin@vits.edu.ph)');
    } else {
      this.loginForm.patchValue({
        email: 'student@vits.edu.ph',
        password: 'student123',
        rememberMe: true
      });
      this.showSuccessToast('Prefilled Student credentials (student@vits.edu.ph)');
    }
    this.activeSegment = 'login';
  }

  /**
   * Navigate directly to user's dashboard if session is already active
   */
  navigateToActiveDashboard(): void {
    if (this.currentUser?.role === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/student-dashboard']);
    }
  }

  /**
   * Sign out active session
   */
  async onLogout(): Promise<void> {
    this.authService.logout().subscribe(async (res) => {
      await this.showWarningToast(res.message);
    });
  }

  /**
   * Fallback for logo
   */
  handleLogoError(event: any): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/logo.png';
    }
  }

  /**
   * Centralized Toast Controller (Position: top, Duration: 2500ms)
   */
  private async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      color,
      cssClass: 'esync-toast',
      buttons: [
        {
          text: '✕',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  async showSuccessToast(message: string): Promise<void> {
    return this.showToast(message, 'success');
  }

  async showWarningToast(message: string): Promise<void> {
    return this.showToast(message, 'warning');
  }

  async showErrorToast(message: string): Promise<void> {
    return this.showToast(message, 'danger');
  }
}
