import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

export interface Notification {
  id?: number;
  userId: string;
  message: string;
  targetType?: string;
  targetId?: number;
  targetRoute?: string;
  read?: boolean;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private stompClient!: Client;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  public userId: string | null = null;

  private apiUrl ='http://localhost:9068'
  // private apiUrl = 'https://find-me.2.1-user.dpc.com.tn'; 

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.authService.getToken();
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const id = decoded?.userId ?? decoded?.id ?? decoded?.sub;
          this.userId = id != null && id !== '' ? String(id) : null;
        } catch (error) {
          //console.error('Failed to decode JWT token', error);
          this.userId = null;
        }

        if (this.userId) {
          this.initializeStompClient();
          this.connect(this.userId);
          this.fetchNotifications();
          this.fetchUnreadCount();
        } else {
          //console.warn('User ID not found or invalid in JWT token');
        }
      } else {
        //console.warn('No JWT token found');
      }
    }
  }

  private initializeStompClient(): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${this.apiUrl}/ws-notifications`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
     //debug: (msg: string) => console.log(`[STOMP] ${msg}`),
    });
  }

  connect(userId: string): void {
    if (!this.stompClient) return;

    this.stompClient.onConnect = () => {
      //console.log('✅ WebSocket connected');
      this.subscribeToNotifications(userId);
      this.subscribeToBroadcast();
    };

    this.stompClient.onStompError = (frame) => {
      //console.error('❌ STOMP error:', frame.headers['message']);
      //console.error('Details:', frame.body);
    };

    this.stompClient.activate();
  }

  private subscribeToNotifications(userId: string): void {
    this.stompClient.subscribe(`/topic/notifications/${userId}`, (message: Message) => {
      this.ngZone.run(() => {
        try {
          const notification: Notification = JSON.parse(message.body);
          const currentNotifications = this.notificationsSubject.value;
          this.notificationsSubject.next([notification, ...currentNotifications]);
          this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
          this.playNotificationSound();
          //console.log(`🔔 Notification received:`, notification);
        } catch (error) {
          //console.error('Failed to parse notification message', error);
        }
      });
    });
  }

  private subscribeToBroadcast(): void {
    this.stompClient.subscribe('/topic/broadcast', (message: Message) => {
      this.ngZone.run(() => {
        const broadcastNotification: Notification = {
          userId: 'broadcast',
          message: message.body,
          timestamp: new Date().toISOString(),
        };
        const currentNotifications = this.notificationsSubject.value;
        this.notificationsSubject.next([broadcastNotification, ...currentNotifications]);
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
        //console.log(`📢 Broadcast received:`, broadcastNotification);
      });
    });
  }

  sendNotificationToUser(userId: string, message: string): void {
    const body = { userId, message };
    this.http
      .post<void>(`${this.apiUrl}/api/notifications/send`, body, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.fetchNotifications();
          this.fetchUnreadCount();
        },
        error: (err) => console.error('Échec envoi notification (HTTP)', err),
      });
  }

  sendNotificationToUserWithTarget(
    userId: string,
    message: string,
    targetRoute: string,
    targetId?: number,
    targetType?: string
  ): void {
    const body = { userId, message, targetRoute, targetId, targetType };
    this.http
      .post<void>(`${this.apiUrl}/api/notifications/send`, body, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.fetchNotifications();
          this.fetchUnreadCount();
        },
        error: (err) => console.error('Échec envoi notification (HTTP)', err),
      });
  }

  sendBroadcastNotification(message: string): void {
    if (this.stompClient?.connected) {
      const body = JSON.stringify({ message });
      this.stompClient.publish({
        destination: '/app/send-broadcast',
        body,
      });
      //console.log(`📤 Sent broadcast notification: ${message}`);
    } else {
      //console.warn('🚫 Cannot send broadcast: WebSocket not connected.');
    }
  }

  disconnect(): void {
    if (this.stompClient?.connected) {
      this.stompClient.deactivate();
      //console.log('🔌 WebSocket disconnected');
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  fetchNotifications(): void {
    if (!this.userId) return;
    this.http.get<Notification[]>(`${this.apiUrl}/api/notifications/user/${this.userId}`, { headers: this.getAuthHeaders() })
      .subscribe(notifs => this.notificationsSubject.next(notifs.reverse()));
  }

  fetchUnreadCount(): void {
    if (!this.userId) return;
    this.http.get<number>(`${this.apiUrl}/api/notifications/user/${this.userId}/unread-count`, { headers: this.getAuthHeaders() })
      .subscribe(count => this.unreadCountSubject.next(count));
  }

  markAsRead(id: number): void {
    this.http.put(`${this.apiUrl}/api/notifications/${id}/read`, {}, { headers: this.getAuthHeaders() }).subscribe(() => {
      this.fetchUnreadCount();
    });
  }

  markAllAsRead(): void {
    if (!this.userId) return;
    this.http.put(`${this.apiUrl}/api/notifications/user/${this.userId}/read-all`, {}, { headers: this.getAuthHeaders() }).subscribe(() => {
      this.fetchUnreadCount();
    });
  }

  resetUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }

  private playNotificationSound(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } catch {
      // Avoid blocking notification flow if sound fails.
    }
  }
}
