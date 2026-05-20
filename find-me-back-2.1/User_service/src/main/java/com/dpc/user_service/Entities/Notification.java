package com.dpc.user_service.Entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Notification {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String userId; // or Long userId if your user IDs are numeric
        private String message;
        private String targetType;
        private Long targetId;
        private String targetRoute;
        @Column(name = "is_read")
        private boolean read;
        private LocalDateTime timestamp;
    }


