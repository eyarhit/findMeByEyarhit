package com.dpc.user_service.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypingNotificationDto {
    private Long senderId;
    private Long receiverId;
    private Long chatRoomId;
    private boolean typing;
}