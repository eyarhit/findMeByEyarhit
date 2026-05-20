import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { Notification, NotificationService } from '../../services/notificationService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './NotificationBell.component.html',
  styleUrls: ['./NotificationBell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  isBellOpen = false;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  private notifSubscription!: Subscription;
  private countSubscription!: Subscription;

  /** Défaut sous la hauteur du header (~4rem) avant calcul navigateur */
  posY = 88;
  dragging = false;
  dragOffsetY = 0;

  constructor(
    public notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: object,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.posY = Math.max(88, window.innerHeight - 600);
    }
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.notificationService.fetchNotifications();
    this.notificationService.fetchUnreadCount();
    
    this.notifSubscription = this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = [...notifs];
    });

    this.countSubscription = this.notificationService.unreadCount$.subscribe(count => {
      //console.log(count)
      this.unreadCount = count;
    });
  }

  ngOnDestroy(): void {
    this.notifSubscription?.unsubscribe();
    this.countSubscription?.unsubscribe();
  }

  toggleBell(): void {
    this.isBellOpen = !this.isBellOpen;
    if (this.isBellOpen && this.notifications.length === 0) {
      this.notificationService.fetchNotifications();
    }
  }

  markAsread(notification: Notification): void {
    if (!notification.read) {
      // Update locally first for immediate UI feedback
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      
      // Send update to backend without waiting for response
     this.notificationService.markAsRead(notification.id!);
    }
  }

  openNotification(notification: Notification): void {
    this.markAsread(notification);
    this.isBellOpen = false;

    if (notification.targetRoute) {
      this.router.navigateByUrl(notification.targetRoute);
      return;
    }

    if (notification.targetId) {
      // Fallback route when only target id is present.
      this.router.navigate(['/OffreDetails', notification.targetId]);
    }
  }
 markAllAsread(){
  //console.log("og")
  // Optimistic UI update
  this.notifications.forEach(n => n.read = true);
  this.unreadCount = 0;
  this.notificationService.markAllAsRead()
 }
  // Other methods remain the same...
  sendNotification(userId: string, message: string): void {
    this.notificationService.sendNotificationToUser(userId, message);
  }

  sendBroadcastNotification(): void {
    const broadcastMessage = 'This is a broadcast message to all users!';
    this.notificationService.sendBroadcastNotification(broadcastMessage);
  }

  onDragStart(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.dragging = true;
    const clientY = this.getClientY(event);
    this.dragOffsetY = clientY - this.posY;
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.dragging) return;
    const clientY = this.getClientY(event);
    this.posY = Math.max(0, Math.min(clientY - this.dragOffsetY, window.innerHeight - 60));
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  onDragEnd(): void {
    this.dragging = false;
  }

  private getClientY(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  }
}