import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber?: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

export type SafeUser = Omit<User, 'password'>;

export interface LoginCredentials {
  identifier: string; // Email or Student Number (20-xxxx)
  password: string; // Password or Birthdate PIN (MM/DD/YYYY)
  role?: UserRole;
}

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  studentNumber?: string;
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

  private currentUserSubject = new BehaviorSubject<SafeUser | null>(this.getStoredSession());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.seedDefaultAccounts();
  }

  /**
   * Pre-seed default Admin and Student credentials for instant testing
   */
  private seedDefaultAccounts(): void {
    try {
      const existing = localStorage.getItem(this.USERS_STORAGE_KEY);
      let users: User[] = existing ? JSON.parse(existing) : [];

      // 1. Seed Admin account (admin@vits.edu.ph / admin123)
      const hasAdmin = users.some(
        (u) => u.email.toLowerCase() === 'admin@vits.edu.ph'
      );
      if (!hasAdmin) {
        const adminUser: User = {
          id: 'esync_adm_001',
          firstName: 'VITS Admin',
          lastName: 'Officer',
          email: 'admin@vits.edu.ph',
          password: 'admin123',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        users.unshift(adminUser);
      }

      // 2. Seed Sample Student account (20-1234 / 01/01/2005 or student123)
      const hasSampleStudent = users.some(
        (u) =>
          u.studentNumber === '20-1234' ||
          u.email.toLowerCase() === 'student@vits.edu.ph'
      );
      if (!hasSampleStudent) {
        const studentUser: User = {
          id: 'esync_stu_001',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          studentNumber: '20-1234',
          email: 'student@vits.edu.ph',
          password: '01/01/2005',
          role: 'student',
          createdAt: new Date().toISOString()
        };
        users.push(studentUser);
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
   * Helper to retrieve active session from localStorage or sessionStorage
   */
  private getStoredSession(): SafeUser | null {
    try {
      const localRaw = localStorage.getItem(this.SESSION_KEY);
      if (localRaw) return JSON.parse(localRaw);

      const sessionRaw = sessionStorage.getItem(this.SESSION_KEY);
      if (sessionRaw) return JSON.parse(sessionRaw);

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Authenticate user credentials with 1200ms simulated network latency
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return of(null).pipe(
      delay(1200),
      switchMap(() => {
        const users = this.getStoredUsers();
        const normId = (credentials.identifier || '').trim().toLowerCase();
        const normPw = (credentials.password || '').trim();
        const requiredRole = credentials.role || 'student';

        // Match user by identifier (email OR studentNumber) and role
        const matched = users.find((u) => {
          if (u.role !== requiredRole) return false;

          const emailMatch = u.email.toLowerCase() === normId;
          const studentNumberMatch = u.studentNumber
            ? u.studentNumber.toLowerCase() === normId
            : false;

          if (!emailMatch && !studentNumberMatch) return false;

          // Password / PIN verification (also permits 'student123' as alias for sample student)
          const passMatch =
            u.password === normPw ||
            (u.studentNumber === '20-1234' && normPw === 'student123');

          return passMatch;
        });

        if (!matched) {
          const roleLabel = requiredRole === 'admin' ? 'Admin' : 'Student';
          return throwError(
            () =>
              new Error(
                `Invalid ${roleLabel} credentials. Please verify your ${
                  requiredRole === 'admin'
                    ? 'email and password'
                    : 'Student ID/Email and password/birthdate'
                } and try again.`
              )
          );
        }

        const { password: _, ...safeUser } = matched;

        // Persist active session
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(safeUser));
        this.currentUserSubject.next(safeUser);

        return of({
          success: true,
          message: `Welcome back, ${safeUser.firstName}! Logging into ${safeUser.role.toUpperCase()} portal...`,
          user: safeUser,
          token: 'esync_jwt_' + btoa(safeUser.email + ':' + Date.now())
        });
      })
    );
  }

  /**
   * Register a new participant (role: 'student') with 1200ms simulated network latency
   */
  register(userData: RegisterUserData): Observable<AuthResponse> {
    return of(null).pipe(
      delay(1200),
      switchMap(() => {
        const users = this.getStoredUsers();
        const normEmail = (userData.email || '').trim().toLowerCase();
        const normStudentNum = (userData.studentNumber || '').trim().toLowerCase();

        // 1. Duplicate email check
        const emailExists = users.some(
          (u) => u.email.toLowerCase() === normEmail
        );
        if (emailExists) {
          return throwError(
            () =>
              new Error(
                'An account with this email address already exists. Please sign in or use another email.'
              )
          );
        }

        // 2. Duplicate student number check
        if (normStudentNum) {
          const studentNumExists = users.some(
            (u) => u.studentNumber && u.studentNumber.toLowerCase() === normStudentNum
          );
          if (studentNumExists) {
            return throwError(
              () =>
                new Error(
                  `Student Number ${userData.studentNumber} is already registered for ITlympics.`
                )
            );
          }
        }

        const newUser: User = {
          id: 'esync_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          studentNumber: userData.studentNumber?.trim(),
          email: normEmail,
          password: userData.password,
          role: userData.role || 'student',
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveStoredUsers(users);

        const { password: _, ...safeUser } = newUser;

        return of({
          success: true,
          message: `Registration successful! Welcome to E-Sync, ${safeUser.firstName}.`,
          user: safeUser,
          token: 'esync_jwt_' + btoa(newUser.email + ':' + Date.now())
        });
      })
    );
  }

  /**
   * Log out active session
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
          message: 'You have signed out of E-Sync.'
        });
      })
    );
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Observable<SafeUser | null> {
    return of(this.currentUserSubject.value);
  }

  get currentUserValue(): SafeUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Password recovery simulation
   */
  resetPassword(identifier: string): Observable<{ success: boolean; message: string }> {
    return of(null).pipe(
      delay(1000),
      switchMap(() => {
        const norm = (identifier || '').trim().toLowerCase();
        const users = this.getStoredUsers();
        const user = users.find(
          (u) =>
            u.email.toLowerCase() === norm ||
            (u.studentNumber && u.studentNumber.toLowerCase() === norm)
        );

        if (!user) {
          return throwError(
            () =>
              new Error(
                'No registered account found with that Student ID or Email.'
              )
          );
        }

        return of({
          success: true,
          message: `Password reset instructions sent to registered address for ${user.firstName}.`
        });
      })
    );
  }
}
