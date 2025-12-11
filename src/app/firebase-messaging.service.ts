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
    this.afMessaging.requestToken.subscribe(
      token => {
        console.log('FCM Token:', token);
        debugger;
        this.sendTokenToBackend(userId, token);
        // Send this token to your backend to send push messages
      },
      error => {
        console.error('Permission denied or error:', error);
      }
    );
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
        console.log('Token sent to backend successfully:', response);
      },
      error: err => {
        console.error('Error sending token to backend:', err);
      }
    });
  }
}

