import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from '../auth/auth.service';

enum CreatedByType {
  Procurement = 1,
  Vendor = 2,
}
@Injectable({ providedIn: 'root' })
export class SignalRService {
  public hubConnection!: signalR.HubConnection;

  constructor(private authService: AuthService) { }
  // Observable for incoming comments/messages
  private commentSource = new BehaviorSubject<any>(null);
  comment$ = this.commentSource.asObservable();

  // Observable for typing status
  private typingSource = new BehaviorSubject<any>(null);
  typing$ = this.typingSource.asObservable();

  private commentSeenSubject = new Subject<{ commentId: number, seenByType: number }>();
  public commentSeen$ = this.commentSeenSubject.asObservable();

  public isChatActive = false;

  setChatActive(active: boolean) {
    this.isChatActive = active;
  }

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

    this.hubConnection.on('ReceiveTyping', (data: any) => {
      this.typingSource.next(data);
    });

    return this.hubConnection.start()
      .then(() => {
        console.log('SignalR Connected');
        this.registerOnServerEvents();
      })
      .catch(err => console.error('SignalR connection error', err));
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

  sendTyping(quotationId: number, vendorId: string, isTyping: boolean, createdByType: number): Promise<void> {
    if (!this.hubConnection) return Promise.reject("Hub connection not established");
    return this.hubConnection.invoke('SendTyping', quotationId, vendorId, isTyping, createdByType);
  }
  // SignalRService
  markCommentAsRead(quotationId: number, vendorId: string, currentUserType: number): Promise<void> {
    if (!this.hubConnection) return Promise.reject("Hub connection not established");
    return this.hubConnection.invoke('MarkCommentAsRead', quotationId, vendorId, currentUserType)
      .catch(err => console.error('Failed to mark comment as read', err));
  }

  private registerOnServerEvents() {
    this.hubConnection?.on('CommentSeen', (data: any[]) => {
      if (!data) return;
      data.forEach((item: { commentId: number, seenByType: number }) => {
        this.commentSeenSubject.next(item);
      });
    });
  }
}