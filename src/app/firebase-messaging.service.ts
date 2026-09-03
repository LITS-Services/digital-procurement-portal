// src/app/firebase-messaging.service.ts
import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { BehaviorSubject } from 'rxjs';
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
    if (!userId) {
      console.warn('FCM: Skip requestPermission because userId is null or empty');
      return;
    }
    this.afMessaging.requestToken.subscribe({
      next: (token) => {
        if (token) {
          this.sendTokenToBackend(userId, token);
        } else {
          console.warn('FCM: No token received from requestToken');
        }
      },
      error: (error) => {
        console.error('FCM: Permission denied or error:', error);
        // If the token is stale or invalid, delete it so the next attempt can get a fresh one.
        this.deleteToken();
      }
    });
  }

  deleteToken() {
    this.afMessaging.getToken.subscribe(token => {
      if (token) {
        this.afMessaging.deleteToken(token).subscribe({
          next: (deleted) => {
            if (deleted) {
              console.log('FCM: Token deleted successfully');
            }
          },
          error: err => console.error('FCM: Error deleting token:', err)
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

