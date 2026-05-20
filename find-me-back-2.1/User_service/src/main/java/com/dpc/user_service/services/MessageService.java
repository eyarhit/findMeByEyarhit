package com.dpc.user_service.services;

import com.dpc.user_service.DTO.ChatMessageDto;
import com.dpc.user_service.DTO.TypingNotificationDto;
import com.dpc.user_service.Entities.*;
import com.dpc.user_service.Repository.ChatRoomRepository;
import com.dpc.user_service.Repository.MessageRepository;
import com.dpc.user_service.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final FileStorageService fileStorageService;

    public ChatMessageDto sendMessage(ChatMessageDto messageDto) {
        Message savedMessage = saveMessageEntity(messageDto);
        ChatMessageDto savedMessageDto = convertToDto(savedMessage);
        sendViaWebSocket(savedMessageDto);
        return savedMessageDto;
    }

    private Message saveMessageEntity(ChatMessageDto messageDto) {
        User sender = userRepository.findById(messageDto.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = null;
        if (messageDto.getReceiverId() != null) {
            receiver = userRepository.findById(messageDto.getReceiverId())
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));
        }

        ChatRoom chatRoom = null;
        if (messageDto.getChatRoomId() != null) {
            chatRoom = chatRoomRepository.findById(messageDto.getChatRoomId())
                    .orElseThrow(() -> new RuntimeException("Chat room not found"));
        }

        Message message = Message.builder()
                .content(messageDto.getContent())
                .type(messageDto.getType())
                .sender(sender)
                .receiver(receiver)
                .chatRoom(chatRoom)
                .timestamp(LocalDateTime.now())
                .status(MessageStatus.SENT)
                .build();

        return messageRepository.save(message);
    }

    public ChatMessageDto saveFileMessage(MultipartFile file, Long senderId, Long receiverId,
                                          Long chatRoomId, MessageType type) {
        Message savedMessage = saveFileMessageEntity(file, senderId, receiverId, chatRoomId, type);
        ChatMessageDto savedMessageDto = convertToDto(savedMessage);
        sendViaWebSocket(savedMessageDto);
        return savedMessageDto;
    }

    private Message saveFileMessageEntity(MultipartFile file, Long senderId, Long receiverId,
                                          Long chatRoomId, MessageType type) {
        try {
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            Map<String, String> storageResponse = fileStorageService.storeFile(file, uniqueFileName);
            String fileUrl = storageResponse.get("fileUrl");

            User sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new RuntimeException("Sender not found"));

            User receiver = null;
            if (receiverId != null) {
                receiver = userRepository.findById(receiverId)
                        .orElseThrow(() -> new RuntimeException("Receiver not found"));
            }

            ChatRoom chatRoom = null;
            if (chatRoomId != null) {
                chatRoom = chatRoomRepository.findById(chatRoomId)
                        .orElseThrow(() -> new RuntimeException("Chat room not found"));
            }

            Message message = Message.builder()
                    .content(file.getOriginalFilename())
                    .type(type)
                    .filePath(uniqueFileName)
                    .sender(sender)
                    .receiver(receiver)
                    .chatRoom(chatRoom)
                    .timestamp(LocalDateTime.now())
                    .status(MessageStatus.SENT)
                    .build();

            return messageRepository.save(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to store file message: " + e.getMessage());
        }
    }

    private void sendViaWebSocket(ChatMessageDto messageDto) {
        if (messageDto.getReceiverId() != null) {
            messagingTemplate.convertAndSendToUser(
                    messageDto.getReceiverId().toString(),
                    "/queue/messages",
                    messageDto);
        } else if (messageDto.getChatRoomId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/room/" + messageDto.getChatRoomId(),
                    messageDto);
        }
    }

    public Page<ChatMessageDto> getMessageHistory(Long senderId, Long receiverId,
                                                  Long chatRoomId, Pageable pageable) {
        Page<Message> messages;
        if (chatRoomId != null) {
            ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                    .orElseThrow(() -> new RuntimeException("Chat room not found"));
            messages = messageRepository.findByChatRoom(chatRoom, pageable);
        } else {
            User sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new RuntimeException("Sender not found"));
            User receiver = userRepository.findById(receiverId)
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));
            messages = messageRepository.findBySenderAndReceiver(sender, receiver, pageable);
        }

        return messages.map(this::convertToDto);
    }

    public void sendTypingNotification(TypingNotificationDto typingNotification) {
        if (typingNotification.getReceiverId() != null) {
            messagingTemplate.convertAndSendToUser(
                    typingNotification.getReceiverId().toString(),
                    "/queue/typing",
                    typingNotification);
        } else if (typingNotification.getChatRoomId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/room/" + typingNotification.getChatRoomId() + "/typing",
                    typingNotification);
        }
    }

    private ChatMessageDto convertToDto(Message message) {
        String fileUrl = null;
        if (message.getFilePath() != null) {
            fileUrl = fileStorageService.getPresignedUrl(message.getFilePath());
        }

        return ChatMessageDto.builder()
                .id(message.getId())
                .content(message.getContent())
                .type(message.getType())
                .senderId(message.getSender().getUserId())
                .senderName(message.getSender().getFirstName() + " " + message.getSender().getLastName())
                .receiverId(message.getReceiver() != null ? message.getReceiver().getUserId() : null)
                .receiverName(message.getReceiver() != null ?
                        message.getReceiver().getFirstName() + " " + message.getReceiver().getLastName() : null)
                .chatRoomId(message.getChatRoom() != null ? message.getChatRoom().getId() : null)
                .timestamp(message.getTimestamp().toString())
                .status(message.getStatus())
                .fileUrl(fileUrl)
                .build();
    }
}