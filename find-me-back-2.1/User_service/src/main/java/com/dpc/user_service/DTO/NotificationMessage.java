package com.dpc.user_service.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationMessage {
    private String userId;
    private String message;
    private String targetType;
    private Long targetId;
    private String targetRoute;
    private boolean read;
    private LocalDateTime timestamp;
}
