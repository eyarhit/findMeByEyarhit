package com.dpc.user_service.controller;

import com.dpc.user_service.DTO.ChatMessageDto;
import com.dpc.user_service.DTO.TypingNotificationDto;
import com.dpc.user_service.Entities.MessageType;
import com.dpc.user_service.services.MessageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
@Validated
public class MessageController {
    private final MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ChatMessageDto messageDto) {

        // Verify the JWT token is valid
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(messageService.sendMessage(messageDto));
    }

    @PostMapping(value = "/send/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatMessageDto> sendFileMessage(
            @RequestParam("file") @Valid @NotNull MultipartFile file,
            @RequestParam @NotNull Long senderId,
            @RequestParam(required = false) Long receiverId,
            @RequestParam(required = false) Long chatRoomId,
            @RequestParam @NotNull MessageType type) {

        validateFileType(file, type);

        return ResponseEntity.ok(messageService.saveFileMessage(
                file, senderId, receiverId, chatRoomId, type));
    }

    @GetMapping("/history")
    public ResponseEntity<Page<ChatMessageDto>> getMessageHistory(
            @RequestParam(required = false) Long senderId,
            @RequestParam(required = false) Long receiverId,
            @RequestParam(required = false) Long chatRoomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        return ResponseEntity.ok(messageService.getMessageHistory(
                senderId, receiverId, chatRoomId, pageable));
    }

    @PostMapping("/typing")
    public ResponseEntity<Void> sendTypingNotification(
            @Valid @RequestBody TypingNotificationDto typingNotification) {
        messageService.sendTypingNotification(typingNotification);
        return ResponseEntity.accepted().build();
    }

    private void validateFileType(MultipartFile file, MessageType type) {
        String contentType = file.getContentType();

        switch (type) {
            case IMAGE:
                if (contentType == null || !contentType.startsWith("image/")) {
                    throw new InvalidFileTypeException("Expected image file");
                }
                break;
            case AUDIO:
                if (contentType == null || !contentType.startsWith("audio/")) {
                    throw new InvalidFileTypeException("Expected audio file");
                }
                break;
            case VIDEO:
                if (contentType == null || !contentType.startsWith("video/")) {
                    throw new InvalidFileTypeException("Expected video file");
                }
                break;
            case TEXT:
                if (contentType == null ||
                        (!contentType.equals("text/plain") &&
                                !contentType.equals("application/pdf"))) {
                    throw new InvalidFileTypeException("Expected text or PDF file");
                }
                break;
        }

        if (file.getSize() > 25 * 1024 * 1024) { // 25MB limit
            throw new FileSizeLimitExceededException("File size exceeds 25MB limit");
        }
    }

    @ExceptionHandler(InvalidFileTypeException.class)
    public ResponseEntity<String> handleInvalidFileType(InvalidFileTypeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @ExceptionHandler(FileSizeLimitExceededException.class)
    public ResponseEntity<String> handleFileSizeLimit(FileSizeLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(ex.getMessage());
    }

    public static class InvalidFileTypeException extends RuntimeException {
        public InvalidFileTypeException(String message) {
            super(message);
        }
    }

    public static class FileSizeLimitExceededException extends RuntimeException {
        public FileSizeLimitExceededException(String message) {
            super(message);
        }
    }
}