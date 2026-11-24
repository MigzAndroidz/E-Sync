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
  shieldCheckmarkOutline,
  peopleOutline,
  statsChartOutline,
  checkmarkDoneCircleOutline,
  alertCircleOutline,
  settingsOutline
} from 'ionicons/icons';
import { AuthService, SafeUser } from '../../services/auth';

@Component({
  selector: 'app-admin-dashboard',
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
          
          <!-- Admin Header -->
          <div class="dash-header">
            <div class="logo-badge">
              <img src="assets/logo.png" alt="VITS Logo" class="dash-logo" (error)="onImgError($event)" />
            </div>
            <div class="role-pill admin-pill">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
              <span>VITS Administrator Portal</span>
            </div>
            <h1 class="welcome-title">Administrator Console</h1>
            <p class="welcome-subtitle">E-Sync • ITlympics Registration & Verification Control</p>
          </div>

          <!-- Admin Profile Card -->
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
            <div class="admin-privilege">
              <ion-icon name="checkmark-done-circle-outline"></ion-icon>
              <span>Full System Governance & Participant Management Active</span>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-val">342</span>
              <span class="stat-lbl">Registered Students</span>
            </div>
            <div class="stat-card">
              <span class="stat-val">8</span>
              <span class="stat-lbl">Active Events</span>
            </div>
            <div class="stat-card">
              <span class="stat-val">100%</span>
              <span class="stat-lbl">System Uptime</span>
            </div>
          </div>

          <!-- Action Items -->
          <div class="action-list">
            <div class="action-item">
              <ion-icon name="people-outline"></ion-icon>
              <div>
                <h4>Manage Participant Rosters</h4>
                <p>Review and verify university delegations</p>
              </div>
            </div>
            <div class="action-item">
              <ion-icon name="stats-chartOutline"></ion-icon>
              <div>
                <h4>Registration Analytics</h4>
                <p>Track real-time signups across collegiate departments</p>
              </div>
            </div>
          </div>

          <!-- Sign Out Action -->
          <ion-button expand="block" fill="outline" class="signout-btn" (click)="onLogout()">
            <ion-icon slot="start" name="log-out-outline"></ion-icon>
            Sign Out of Admin Portal
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
      background: radial-gradient(circle at 50% 10%, rgba(242, 140, 40, 0.16) 0%, rgba(11, 25, 48, 0.96) 65%, #0B1930 100%);
    }
    .dashboard-container {
      width: 100%;
      max-width: 540px;
      background: rgba(14, 28, 54, 0.9);
      border: 1px solid rgba(242, 140, 40, 0.3);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      padding: 32px 26px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(242, 140, 40, 0.1);
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
      box-shadow: 0 4px 20px rgba(242, 140, 40, 0.4);
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
    .admin-pill {
      background: rgba(242, 140, 40, 0.2);
      color: #F28C28;
      border: 1px solid rgba(242, 140, 40, 0.4);
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
    .admin-privilege {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #F28C28;
      font-size: 13px;
      font-weight: 500;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 8px;
      text-align: center;
      display: flex;
      flex-direction: column;
    }
    .stat-val {
      font-size: 20px;
      font-weight: 800;
      color: #FFFFFF;
    }
    .stat-lbl {
      font-size: 11px;
      color: #A0ABC0;
      margin-top: 4px;
    }
    .action-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }
    .action-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 12px 14px;
    }
    .action-item ion-icon {
      font-size: 24px;
      color: #F28C28;
    }
    .action-item h4 {
      margin: 0;
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 600;
    }
    .action-item p {
      margin: 2px 0 0 0;
      color: #A0ABC0;
      font-size: 12px;
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
export class AdminDashboardPage implements OnInit {
  user: SafeUser | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({
      logOutOutline,
      personOutline,
      shieldCheckmarkOutline,
      peopleOutline,
      statsChartOutline,
      checkmarkDoneCircleOutline,
      alertCircleOutline,
      settingsOutline
    });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    if (!this.user || this.user.role !== 'admin') {
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
