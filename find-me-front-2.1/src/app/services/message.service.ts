// ✅ 1. message.service.ts (frontend Angular)

import { Injectable, NgZone } from '@angular/core';
import { Client, Message as StompMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface ChatMessage {
  senderId: number;
  receiverId: number;
  content: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private stompClient!: Client;
  private apiUrl = 'http://localhost:9068';

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(private ngZone: NgZone, private http: HttpClient) {}

  connect(userId: number): void {
    const socket = new SockJS(`${this.apiUrl}/ws-notifications`);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      this.stompClient.subscribe(`/user/${userId}/queue/messages`, (message: StompMessage) => {
        this.ngZone.run(() => {
          const msg: ChatMessage = JSON.parse(message.body);
          const current = this.messagesSubject.value;
          this.messagesSubject.next([...current, msg]);
        });
      });
    };

    this.stompClient.activate();
  }

  sendMessage(message: ChatMessage): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify(message)
      });
    }
  }

getConversation(senderId: number, receiverId: number): Observable<ChatMessage[]> {
  return this.http.get<ChatMessage[]>(`${this.apiUrl}/api/messages/conversation?user1Id=${senderId}&user2Id=${receiverId}`);
}


  disconnect(): void {
    if (this.stompClient?.connected) {
      this.stompClient.deactivate();
    }
  }
}
