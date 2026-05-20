package com.dpc.user_service.controller;

import com.dpc.user_service.DTO.NotificationMessage;
import com.dpc.user_service.Entities.Notification;
import com.dpc.user_service.Repository.NotificationRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
public class NotificationController {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    public NotificationController(SimpMessagingTemplate messagingTemplate,
                                  NotificationRepository notificationRepository) {
        this.messagingTemplate = messagingTemplate;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Receives a notification message from a client and sends it to the specified target user.
     * The sender is identified by the authenticated Principal.
     */
    @MessageMapping("/send-notification")
    public void sendNotification(@Payload NotificationMessage notificationMessage) {
        persistAndDeliver(notificationMessage);
    }

    /**
     * HTTP fallback when the WebSocket client is not connected (e.g. HR updates candidature status).
     */
    @PostMapping("/api/notifications/send")
    @ResponseBody
    public ResponseEntity<Void> sendNotificationHttp(@RequestBody NotificationMessage notificationMessage) {
        persistAndDeliver(notificationMessage);
        return ResponseEntity.ok().build();
    }

    private void persistAndDeliver(NotificationMessage notificationMessage) {
        if (notificationMessage == null
                || notificationMessage.getUserId() == null
                || notificationMessage.getMessage() == null) {
            return;
        }

        String targetUserId = notificationMessage.getUserId();

        Notification notification = new Notification();
        notification.setUserId(targetUserId);
        notification.setMessage(notificationMessage.getMessage());
        notification.setTargetType(notificationMessage.getTargetType());
        notification.setTargetId(notificationMessage.getTargetId());
        notification.setTargetRoute(notificationMessage.getTargetRoute());
        notification.setRead(false);
        notification.setTimestamp(LocalDateTime.now());
        notificationMessage.setTimestamp(LocalDateTime.now());
        notificationRepository.save(notification);

        messagingTemplate.convertAndSend("/topic/notifications/" + targetUserId, notification);
    }

    /**
     * Receives a broadcast message and sends it to all subscribers.
     */
    @MessageMapping("/send-broadcast")
    @SendTo("/topic/broadcast")
    public String sendBroadcast(@Payload Map<String, String> payload) {
        String message = payload.get("message");
        // Optionally save broadcast message to DB or log it
        return message;  // Sent to all subscribers of /topic/broadcast
    }


        @PutMapping("/api/notifications/{id}/read")
        @Operation(summary = "Mark a notification as read", description = "Updates the read status of a specific notification.")
        @ApiResponses(value = {
                @ApiResponse(responseCode = "200", description = "Notification marked as read"),
                @ApiResponse(responseCode = "404", description = "Notification not found")
        })
        public ResponseEntity<Void> markAsRead(@Parameter(description = "ID of the notification to mark as read", required = true) @PathVariable Long id) {
            Optional<Notification> notificationOptional = notificationRepository.findById(id);
            if (notificationOptional.isPresent()) {
                Notification notification = notificationOptional.get();
                notification.setRead(true);
                notificationRepository.save(notification);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build(); // Explicitly handle the 404 case
            }
        }

        @PutMapping("/api/notifications/user/{userId}/read-all")
        @Operation(summary = "Mark all notifications as read for a user", description = "Updates the read status of all unread notifications for a specific user.")
        @ApiResponses(value = {
                @ApiResponse(responseCode = "200", description = "All unread notifications for the user marked as read"),
                @ApiResponse(responseCode = "400", description = "Invalid user ID") //Added
        })
        public ResponseEntity<Void> markAllAsRead(@Parameter(description = "ID of the user", required = true) @PathVariable String userId) {
            try {
                Long userIdLong = Long.parseLong(userId); //convert userId to Long
                List<Notification> notifications = notificationRepository.findByUserIdAndReadFalse(userId);
                notifications.forEach(notification -> notification.setRead(true));
                notificationRepository.saveAll(notifications);
                return ResponseEntity.ok().build();
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().build();
            }
        }

        @GetMapping("/api/notifications/user/{userId}/unread-count")
        @Operation(summary = "Get the number of unread notifications for a user", description = "Retrieves the count of unread notifications for a specific user.")
        @ApiResponses(value = {
                @ApiResponse(responseCode = "200", description = "Returns the number of unread notifications", content = @Content(schema = @Schema(type = "integer", format = "int64"))),
                @ApiResponse(responseCode = "400", description = "Invalid user ID") // Added
        })
        public ResponseEntity<Long> getUnreadCount(@Parameter(description = "ID of the user", required = true) @PathVariable String userId) {
            try {
                Long userIdLong = Long.parseLong(userId); //conver userId to Long
                long count = notificationRepository.countByUserIdAndReadFalse(userId);
                return ResponseEntity.ok(count);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().build();
            }
        }

        @GetMapping("/api/notifications/user/{userId}")
        @Operation(summary = "Get all notifications for a user", description = "Retrieves all notifications for a specific user, ordered by creation timestamp in descending order.")
        @ApiResponses(value = {
                @ApiResponse(responseCode = "200", description = "Returns a list of notifications", content = @Content(schema = @Schema(implementation = Notification.class))),
                @ApiResponse(responseCode = "400", description = "Invalid user ID") //Added
        })
        public ResponseEntity<List<Notification>> getNotifications(@Parameter(description = "ID of the user", required = true) @PathVariable String userId) {
            try{
                Long userIdLong = Long.parseLong(userId);
                List<Notification> notifications = notificationRepository.findByUserId(userId);
                return ResponseEntity.ok(notifications);
            } catch(NumberFormatException e){
                return ResponseEntity.badRequest().build();
            }

        }
}
