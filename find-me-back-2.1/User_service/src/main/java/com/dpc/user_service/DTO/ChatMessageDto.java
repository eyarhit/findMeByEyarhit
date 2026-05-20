package com.dpc.user_service.DTO;

import com.dpc.user_service.Entities.MessageStatus;
import com.dpc.user_service.Entities.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long id;
    private String content;
    private MessageType type;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private Long chatRoomId;
    private String timestamp;
    private MessageStatus status;
    private String fileUrl; // URL to access the file if it's an image/audio/video
}