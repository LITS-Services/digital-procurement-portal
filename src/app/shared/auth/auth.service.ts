import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/auth";
import firebase from 'firebase/app'
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AuthService {
  private user: Observable<firebase.User>;
  private userDetails: firebase.User = null;
private baseUrl = environment.apiUrl;

  constructor(public _firebaseAuth: AngularFireAuth, public router: Router,private http: HttpClient,) {
    this.user = _firebaseAuth.authState;
    this.user.subscribe(
      (user) => {
        if (user) {
          this.userDetails = user;
        }
        else {
          this.userDetails = null;
        }
      }
    );

  }
  initiateSSOLogin(returnUrl: string = '/dashboard/dashboard1'): Observable<any> {
    return this.http.get(`${this.baseUrl}/Auth/sso/login-url?returnUrl=${encodeURIComponent(returnUrl)}`);
  }
  

//   resendOtp(username: string, portalType: string) {
//   return this.http.post(`${this.baseUrl}/Auth/ResendOtp`, { 
//     username, 
//     portalType 
//   });
// }
resendOtp(username: string, portalType: string): Observable<string> {
  return this.http.post(`${this.baseUrl}/Auth/ResendOtp`, 
    { username, portalType }, 
    { responseType: 'text' }
  );
}



  signupUser(email: string, password: string) {
    //your code for signing up the new user
  }
//   verifyOtp(otp: string) {
//   return this.http.post(`${this.baseUrl}/Auth/VerifyProcurementOtp`, {  otp });
// }

verifyOtp(otp: string): Observable<string> {
  return this.http.post(
    `${this.baseUrl}/Auth/VerifyProcurementOtp`,
    { otp },
    { responseType: 'text' }
  );
}



signinUser(username: string, password: string): Observable<any> {
  const body = { username, password };

  return new Observable((observer) => {
    this.http.post<any>(`${this.baseUrl}/Auth/ProcurementLogin`, body).subscribe({
      next: (res) => {
        if (res && res.token) {
          // Save values to localStorage
          localStorage.setItem('token', res.token);
          localStorage.setItem('userId', res.userId);
          localStorage.setItem('userName', res.userName);

          if (res.roles) {
            localStorage.setItem('roles', JSON.stringify(res.roles));
          }
        }

        observer.next(res);
        observer.complete();
      },
      error: (err) => {
        observer.error(err);
      }
    });
  });
}



  // register(userData: any): Observable<any> {
  //   return this.http.post(`${this.baseUrl}/Auth/ProcurementUserRegister`, userData);
  // }

register(userData: any): Observable<string> {
  return this.http.post(`${this.baseUrl}/Auth/ProcurementUserRegister`, userData, {
    responseType: 'text'
  });
}



logout(): Observable<any> {
  return this.http.post(`${this.baseUrl}/Auth/logout`, {}); // Example API endpoint
}
performLogout(): void {
  localStorage.clear();
  this.router.navigate(['/pages/login']);
}

  // isAuthenticated() {
  //   return true;
  // }

  isAuthenticated(): boolean {
  const token = localStorage.getItem('token');
  // basic check: token exists
  if (!token) {
    return false;
  }

  // optional: check if token is expired (if it’s a JWT)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;
    return !isExpired;
  } catch (e) {
    return false;
  }
}

}
