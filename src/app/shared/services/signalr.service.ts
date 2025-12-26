import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection!: signalR.HubConnection;

  constructor(private authService: AuthService) { }
  // Observable for incoming comments/messages
  private commentSource = new BehaviorSubject<any>(null);
  comment$ = this.commentSource.asObservable();

  // Start the connection
  startConnection(): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7188/notification', {
        accessTokenFactory: () => this.authService.accessToken || ''
      })
      .withAutomaticReconnect()
      .build();

    // Listen for messages from server
    this.hubConnection.on('ReceiveQuotationMessage', (data: any) => {
      this.commentSource.next(data);
    });

    return this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => {
        console.error('SignalR Connection Error:', err);
        throw err;
      });
  }

  stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }

  joinQuotation(quotationId: number, vendorId: string): Promise<void> {
    if (!this.hubConnection) return Promise.reject("Hub connection not established");
    return this.hubConnection.invoke('JoinQuotationGroup', quotationId, vendorId);
  }


  leaveQuotation(quotationId: number, vendorId: string): Promise<void> {
    if (!this.hubConnection) return Promise.reject("Hub connection not established");
    return this.hubConnection.invoke('LeaveQuotationGroup', quotationId, vendorId);
  }


  sendMessage(quotationId: number, vendorId: string, message: string): Promise<void> {
    return this.hubConnection.invoke('SendQuotationMessage', quotationId, vendorId, message);
  }
}
