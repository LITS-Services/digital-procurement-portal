// src/app/firebase-messaging.service.ts
import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { BehaviorSubject, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseMessagingService {
  currentMessage = new BehaviorSubject<any>(null);

  constructor(private afMessaging: AngularFireMessaging, private http: HttpClient) {
    this.afMessaging.messages.subscribe(
      msg => this.currentMessage.next(msg)
    );
  }

  requestPermission(userId: string) {
    (this.afMessaging.requestToken as any).pipe(take(1)).subscribe(
      (token: string) => {
        if (token) {
          this.sendTokenToBackend(userId, token);
        }
      },
      error => {
        console.error('Permission denied or error:', error);
      }
    );
  }

  deleteToken() {
    (this.afMessaging.getToken as any).pipe(take(1)).subscribe((token: string) => {
      if (token) {
        this.afMessaging.deleteToken(token).subscribe(() => {
          console.log('Token deleted');
        });
      }
    });
  }
  private sendTokenToBackend(userId: string, token: string) {
    let baseUrl = `${environment.apiUrl}/Auth`;
    const apiUrl = `${baseUrl}/register-procurement-fcm-token`; // Replace with your actual endpoint
    const body = {
      ProcurementUserId: userId,
      Token: token
    };

    this.http.post(apiUrl, body).subscribe({
      next: response => {
      },
      error: err => {
        console.error('Error sending token to backend:', err);
      }
    });
  }
}

