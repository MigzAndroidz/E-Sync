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
  IonIcon,
  IonInput,
  IonSpinner,
  LoadingController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  personOutline,
  lockClosedOutline,
  mailOutline,
  cardOutline,
  schoolOutline,
  shieldCheckmarkOutline,
  arrowBackOutline,
  logInOutline,
  personAddOutline,
  sparklesOutline,
  logOutOutline
} from 'ionicons/icons';
import { AuthService, SafeUser, UserRole } from '../services/auth';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonSpinner
  ]
})
export class HomePage implements OnInit {
  selectedRole: UserRole = 'student';
  authMode: 'login' | 'register' = 'login';

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
      personOutline,
      lockClosedOutline,
      mailOutline,
      cardOutline,
      schoolOutline,
      shieldCheckmarkOutline,
      arrowBackOutline,
      logInOutline,
      personAddOutline,
      sparklesOutline,
      logOutOutline
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.subscribeToSession();
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signUpForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      studentNumber: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private subscribeToSession(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  /**
   * Toggle between Student and Admin roles
   */
  setRole(role: UserRole): void {
    if (this.selectedRole === role) return;
    this.selectedRole = role;
    this.authMode = 'login'; // Admin only has login
    this.loginSubmitted = false;
    this.signUpSubmitted = false;
    this.loginForm.reset();
  }

  /**
   * Switch between Login and Registration views
   */
  setAuthMode(mode: 'login' | 'register'): void {
    this.authMode = mode;
    this.loginSubmitted = false;
    this.signUpSubmitted = false;
  }

  toggleLoginPassword(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleSignUpPassword(): void {
    this.showSignUpPassword = !this.showSignUpPassword;
  }

  isFieldInvalid(form: FormGroup, fieldName: string, isSubmitted: boolean): boolean {
    const control = form.get(fieldName);
    if (!control) return false;
    return control.invalid && (control.dirty || control.touched || isSubmitted);
  }

  /**
   * Authenticate and navigate according to role
   */
  async onLogin(): Promise<void> {
    this.loginSubmitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      await this.showWarningToast(
        this.selectedRole === 'admin'
          ? 'Please enter valid admin credentials.'
          : 'Please enter your Student ID / Email and password.'
      );
      return;
    }

    const { identifier, password } = this.loginForm.value;

    const loading = await this.loadingCtrl.create({
      message:
        this.selectedRole === 'admin'
          ? 'Verifying VITS Administrator access...'
          : 'Verifying ITlympics Student credentials...',
      spinner: 'crescent'
    });
    await loading.present();
    this.isLoading = true;

    this.authService
      .login({ identifier, password, role: this.selectedRole })
      .subscribe({
        next: async (res) => {
          this.isLoading = false;
          await loading.dismiss();
          await this.showSuccessToast(res.message);

          this.loginSubmitted = false;
          this.loginForm.reset();

          // Role-based routing redirect
          if (res.user.role === 'admin') {
            await this.router.navigate(['/admin-dashboard']);
          } else {
            await this.router.navigate(['/student-dashboard']);
          }
        },
        error: async (err) => {
          this.isLoading = false;
          await loading.dismiss();
          await this.showErrorToast(
            err.message || 'Authentication failed. Please check credentials.'
          );
        }
      });
  }

  /**
   * Register new student participant
   */
  async onSignUp(): Promise<void> {
    this.signUpSubmitted = true;

    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      await this.showWarningToast('Please complete all fields with valid information.');
      return;
    }

    const { firstName, lastName, studentNumber, email, password } =
      this.signUpForm.value;

    const loading = await this.loadingCtrl.create({
      message: 'Registering participant for ITlympics...',
      spinner: 'crescent'
    });
    await loading.present();
    this.isLoading = true;

    this.authService
      .register({
        firstName,
        lastName,
        studentNumber,
        email,
        password,
        role: 'student'
      })
      .subscribe({
        next: async (res) => {
          this.isLoading = false;
          await loading.dismiss();
          await this.showSuccessToast(res.message);

          // Reset and prefill login
          this.signUpForm.reset();
          this.signUpSubmitted = false;
          this.loginForm.patchValue({ identifier: studentNumber || email });
          this.authMode = 'login';
          this.selectedRole = 'student';
        },
        error: async (err) => {
          this.isLoading = false;
          await loading.dismiss();
          await this.showErrorToast(
            err.message || 'Registration failed. Please try again.'
          );
        }
      });
  }

  /**
   * 1-Click quick fill helpers for testing
   */
  fillSampleStudent(): void {
    this.selectedRole = 'student';
    this.authMode = 'login';
    this.loginForm.patchValue({
      identifier: '20-1234',
      password: '01/01/2005'
    });
    this.showSuccessToast('Prefilled Student: 20-1234 / 01/01/2005');
  }

  fillSampleAdmin(): void {
    this.selectedRole = 'admin';
    this.authMode = 'login';
    this.loginForm.patchValue({
      identifier: 'admin@vits.edu.ph',
      password: 'admin123'
    });
    this.showSuccessToast('Prefilled Admin: admin@vits.edu.ph / admin123');
  }

  onLogoError(event: any): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/logo.png';
    }
  }

  async onLogout(): Promise<void> {
    this.authService.logout().subscribe(async (res) => {
      await this.showWarningToast(res.message);
    });
  }

  goToDashboard(): void {
    if (this.currentUser?.role === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/student-dashboard']);
    }
  }

  private async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      color,
      buttons: [{ text: '✕', role: 'cancel' }]
    });
    await toast.present();
  }

  async showSuccessToast(msg: string): Promise<void> {
    return this.showToast(msg, 'success');
  }

  async showWarningToast(msg: string): Promise<void> {
    return this.showToast(msg, 'warning');
  }

  async showErrorToast(msg: string): Promise<void> {
    return this.showToast(msg, 'danger');
  }
}
