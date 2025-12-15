import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

export interface QuotationComment {
  quotationId: number;
  commentText: string;
  createdBy: string;
  createdByType: number;
  vendorCompanyId?: string;
  rfqNo: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;

  private commentSubject = new BehaviorSubject<QuotationComment | null>(null);
  comment$ = this.commentSubject.asObservable();

  startConnection(token: string): Promise<void> {
    if (this.hubConnection) {
      return Promise.resolve();
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7188/notification', {
        // skipNegotiation: true,
        accessTokenFactory: async () => token,
        //transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on(
      'ReceiveQuotationComment',
      (data: QuotationComment) => {
        this.commentSubject.next(data);
      }
    );

    return this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connected');
      })
      .catch(err => {
        console.error('SignalR error', err);
        throw err;
      });
  }

  joinRfq(rfqNo: string) {
    this.hubConnection?.invoke('JoinRfqGroup', rfqNo);
  }

  leaveRfq(rfqNo: string) {
    this.hubConnection?.invoke('LeaveRfqGroup', rfqNo);
  }

  stopConnection() {
    this.hubConnection?.stop();
    this.hubConnection = undefined!;
  }
}