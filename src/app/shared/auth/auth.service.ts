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

  signupUser(email: string, password: string) {
    //your code for signing up the new user
  }

 signinUser(username: string, password: string): Observable<any> {
    const body = { username, password };
    return this.http.post(`${this.baseUrl}/Auth/login`, body); 
  }
  register(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Auth/register`, userData);
  }

logout(): Observable<any> {
  return this.http.post(`${this.baseUrl}/Auth/logout`, {}); // Example API endpoint
}
performLogout(): void {
  localStorage.clear();
  this.router.navigate(['/pages/login']);
}

  isAuthenticated() {
    return true;
  }
}
