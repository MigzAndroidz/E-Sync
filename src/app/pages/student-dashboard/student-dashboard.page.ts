import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  personOutline,
  trophyOutline,
  qrCodeOutline,
  calendarOutline,
  shieldCheckmarkOutline,
  schoolOutline
} from 'ionicons/icons';
import { AuthService, SafeUser } from '../../services/auth';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon
  ],
  template: `
    <ion-content class="dashboard-content">
      <div class="dashboard-wrapper">
        <div class="dashboard-container">
          
          <!-- Top Header -->
          <div class="dash-header">
            <div class="logo-badge">
              <img src="assets/logo.png" alt="VITS Logo" class="dash-logo" (error)="onImgError($event)" />
            </div>
            <div class="role-pill student-pill">
              <ion-icon name="school-outline"></ion-icon>
              <span>Student Participant</span>
            </div>
            <h1 class="welcome-title">Welcome, {{ user?.firstName || 'Student' }}!</h1>
            <p class="welcome-subtitle">E-Sync • ITlympics Official Registration Portal</p>
          </div>

          <!-- Student Profile Card -->
          <div class="profile-card">
            <div class="profile-info">
              <div class="avatar-circle">
                <ion-icon name="person-outline"></ion-icon>
              </div>
              <div class="profile-text">
                <h3>{{ user?.firstName }} {{ user?.lastName }}</h3>
                <p>{{ user?.email }}</p>
              </div>
            </div>
            <div class="reg-status">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
              <span>Registration Status: <strong>Verified</strong></span>
            </div>
          </div>

          <!-- Feature Cards Grid -->
          <div class="cards-grid">
            <div class="feature-card">
              <div class="card-icon"><ion-icon name="trophy-outline"></ion-icon></div>
              <h4>My Events</h4>
              <p>Web Development, Mobile App Dev, Quiz Bee</p>
            </div>
            <div class="feature-card">
              <div class="card-icon"><ion-icon name="qr-code-outline"></ion-icon></div>
              <h4>Participant Pass</h4>
              <p>Badge ID: {{ user?.id || 'VITS-2026' }}</p>
            </div>
            <div class="feature-card">
              <div class="card-icon"><ion-icon name="calendar-outline"></ion-icon></div>
              <h4>Event Schedule</h4>
              <p>ITlympics Finals • Valenzuela City</p>
            </div>
          </div>

          <!-- Sign Out Action -->
          <ion-button expand="block" fill="outline" class="signout-btn" (click)="onLogout()">
            <ion-icon slot="start" name="log-out-outline"></ion-icon>
            Sign Out of E-Sync
          </ion-button>

        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .dashboard-content {
      --background: #0B1930;
      background-color: #0B1930;
    }
    .dashboard-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100%;
      padding: 32px 16px;
      box-sizing: border-box;
      background: radial-gradient(circle at 50% 10%, rgba(242, 140, 40, 0.12) 0%, rgba(11, 25, 48, 0.96) 65%, #0B1930 100%);
    }
    .dashboard-container {
      width: 100%;
      max-width: 520px;
      background: rgba(14, 28, 54, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      padding: 32px 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 30px rgba(242, 140, 40, 0.06);
    }
    .dash-header {
      text-align: center;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .logo-badge {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 2px solid #F28C28;
      box-shadow: 0 4px 16px rgba(242, 140, 40, 0.35);
      margin-bottom: 12px;
      overflow: hidden;
      padding: 2px;
      background: #0B1930;
    }
    .dash-logo {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: contain;
    }
    .role-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .student-pill {
      background: rgba(56, 189, 248, 0.15);
      color: #38BDF8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .welcome-title {
      font-size: 26px;
      font-weight: 800;
      color: #FFFFFF;
      margin: 4px 0;
    }
    .welcome-subtitle {
      font-size: 13px;
      color: #A0ABC0;
      margin: 0;
    }
    .profile-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .profile-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .avatar-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #F28C28;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    .profile-text h3 {
      color: #FFFFFF;
      font-size: 16px;
      font-weight: 700;
      margin: 0;
    }
    .profile-text p {
      color: #A0ABC0;
      font-size: 13px;
      margin: 2px 0 0 0;
    }
    .reg-status {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4ADE80;
      font-size: 13px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .feature-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .card-icon {
      color: #F28C28;
      font-size: 20px;
    }
    .feature-card h4 {
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 700;
      margin: 0;
    }
    .feature-card p {
      color: #A0ABC0;
      font-size: 12px;
      margin: 0;
    }
    .signout-btn {
      --color: #FF4961;
      --border-color: rgba(255, 73, 97, 0.4);
      --border-radius: 12px;
      font-weight: 700;
      height: 48px;
    }
  `]
})
export class StudentDashboardPage implements OnInit {
  user: SafeUser | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({
      logOutOutline,
      personOutline,
      trophyOutline,
      qrCodeOutline,
      calendarOutline,
      shieldCheckmarkOutline,
      schoolOutline
    });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    if (!this.user) {
      this.router.navigate(['/home']);
    }
  }

  onImgError(event: any): void {
    event.target.src = 'assets/logo.jpg';
  }

  async onLogout(): Promise<void> {
    this.authService.logout().subscribe(async (res) => {
      const toast = await this.toastCtrl.create({
        message: res.message,
        duration: 2500,
        position: 'top',
        color: 'warning'
      });
      await toast.present();
      this.router.navigate(['/home']);
    });
  }
}
