import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

export type SafeUser = Omit<User, 'password'>;

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: SafeUser;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_STORAGE_KEY = 'esync_users';
  private readonly SESSION_KEY = 'esync_session';
  private readonly REMEMBERED_EMAIL_KEY = 'esync_remembered_email';

  private currentUserSubject = new BehaviorSubject<SafeUser | null>(this.getStoredSession());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.seedDefaultUsers();
  }

  /**
   * Seed default Admin and Student accounts if esync_users is uninitialized
   */
  private seedDefaultUsers(): void {
    try {
      const existing = localStorage.getItem(this.USERS_STORAGE_KEY);
      let users: User[] = existing ? JSON.parse(existing) : [];

      // Check if admin account exists
      const hasAdmin = users.some(
        (u) => u.email.toLowerCase() === 'admin@vits.edu.ph'
      );

      if (!hasAdmin) {
        const defaultAdmin: User = {
          id: 'esync_admin_001',
          firstName: 'VITS Admin',
          lastName: 'Officer',
          email: 'admin@vits.edu.ph',
          password: 'admin123',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        users.unshift(defaultAdmin);
      }

      // Check if demo student exists
      const hasStudent = users.some(
        (u) => u.email.toLowerCase() === 'student@vits.edu.ph'
      );

      if (!hasStudent) {
        const defaultStudent: User = {
          id: 'esync_student_002',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          email: 'student@vits.edu.ph',
          password: 'student123',
          role: 'student',
          createdAt: new Date().toISOString()
        };
        users.push(defaultStudent);
      }

      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('LocalStorage unavailable during seed:', e);
    }
  }

  /**
   * Helper to retrieve stored user records
   */
  private getStoredUsers(): User[] {
    try {
      const raw = localStorage.getItem(this.USERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Helper to persist user records
   */
  private saveStoredUsers(users: User[]): void {
    try {
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (err) {
      console.error('Failed to save users in localStorage', err);
    }
  }

  /**
   * Helper to check active session from either localStorage or sessionStorage
   */
  private getStoredSession(): SafeUser | null {
    try {
      // Check sessionStorage first, then localStorage
      const sessionRaw = sessionStorage.getItem(this.SESSION_KEY);
      if (sessionRaw) {
        return JSON.parse(sessionRaw);
      }
      const localRaw = localStorage.getItem(this.SESSION_KEY);
      if (localRaw) {
        return JSON.parse(localRaw);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Public registration: Defaults to 'student' role
   * Returns RxJS Observable with 1500ms simulated network delay
   */
  register(userData: RegisterUserData): Observable<AuthResponse> {
    return of(null).pipe(
      delay(1500),
      switchMap(() => {
        const users = this.getStoredUsers();
        const normalizedEmail = (userData.email || '').trim().toLowerCase();

        // Enforce duplicate email restriction
        const exists = users.some(
          (u) => u.email.trim().toLowerCase() === normalizedEmail
        );

        if (exists) {
          return throwError(
            () =>
              new Error(
                'An account with this email address already exists. Please sign in or use another email.'
              )
          );
        }

        const newUser: User = {
          id: 'esync_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          email: normalizedEmail,
          password: userData.password,
          role: userData.role || 'student', // Assign 'student' role by default
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveStoredUsers(users);

        const { password: _, ...safeUser } = newUser;

        return of({
          success: true,
          message: `Account created successfully! Welcome to E-Sync, ${safeUser.firstName}.`,
          user: safeUser,
          token: 'esync_jwt_' + btoa(newUser.email + ':' + Date.now())
        });
      })
    );
  }

  /**
   * Login: Authenticates credentials and stores session based on Remember Me
   * Returns RxJS Observable with 1500ms simulated network delay
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return of(null).pipe(
      delay(1500),
      switchMap(() => {
        const users = this.getStoredUsers();
        const normalizedEmail = (credentials.email || '').trim().toLowerCase();
        const enteredPassword = credentials.password;

        const matchedUser = users.find(
          (u) =>
            u.email.trim().toLowerCase() === normalizedEmail &&
            u.password === enteredPassword
        );

        if (!matchedUser) {
          return throwError(
            () =>
              new Error(
                'Invalid email or password. Please verify your credentials and try again.'
              )
          );
        }

        const { password: _, ...safeUser } = matchedUser;

        // Session storage strategy based on Remember Me
        if (credentials.rememberMe) {
          localStorage.setItem(this.SESSION_KEY, JSON.stringify(safeUser));
          localStorage.setItem(this.REMEMBERED_EMAIL_KEY, normalizedEmail);
          sessionStorage.removeItem(this.SESSION_KEY);
        } else {
          sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(safeUser));
          localStorage.removeItem(this.SESSION_KEY);
          localStorage.removeItem(this.REMEMBERED_EMAIL_KEY);
        }

        this.currentUserSubject.next(safeUser);

        return of({
          success: true,
          message: `Welcome back, ${safeUser.firstName}! Signing into your ${safeUser.role.toUpperCase()} portal...`,
          user: safeUser,
          token: 'esync_jwt_' + btoa(safeUser.email + ':' + Date.now())
        });
      })
    );
  }

  /**
   * Logout with simulated observable delay
   */
  logout(): Observable<{ success: boolean; message: string }> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        try {
          localStorage.removeItem(this.SESSION_KEY);
          sessionStorage.removeItem(this.SESSION_KEY);
        } catch (e) {
          console.warn('Error clearing session:', e);
        }
        this.currentUserSubject.next(null);
        return of({
          success: true,
          message: 'You have been logged out of E-Sync.'
        });
      })
    );
  }

  /**
   * Returns the current authenticated user as an Observable
   */
  getCurrentUser(): Observable<SafeUser | null> {
    return of(this.currentUserSubject.value);
  }

  /**
   * Synchronous getter for current user
   */
  get currentUserValue(): SafeUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check remembered email
   */
  getRememberedEmail(): string {
    try {
      return localStorage.getItem(this.REMEMBERED_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  }

  /**
   * Password reset simulation
   */
  resetPassword(email: string): Observable<{ success: boolean; message: string }> {
    return of(null).pipe(
      delay(1200),
      switchMap(() => {
        const normalizedEmail = (email || '').trim().toLowerCase();
        const users = this.getStoredUsers();
        const userExists = users.some(
          (u) => u.email.trim().toLowerCase() === normalizedEmail
        );

        if (!userExists) {
          return throwError(
            () =>
              new Error(
                'No registered account found with this email in E-Sync.'
              )
          );
        }

        return of({
          success: true,
          message: `Password reset instructions sent to ${normalizedEmail}.`
        });
      })
    );
  }
}
