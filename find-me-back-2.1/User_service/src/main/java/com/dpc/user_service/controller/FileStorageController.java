package com.dpc.user_service.controller;

import com.dpc.user_service.services.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileStorageController {
    private final FileStorageService fileStorageService;

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<InputStreamResource> downloadFile(
            @PathVariable String fileName,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {
        try {
            // Validate filename pattern to prevent path traversal
            if (!fileName.matches("^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\..+$")) {
                throw new IllegalArgumentException("Invalid file name format");
            }

            // Get file content type
            String contentType = detectContentType(fileName);

            // Get file stream
            InputStream fileStream = fileStorageService.getFile(fileName);
            InputStreamResource resource = new InputStreamResource(fileStream);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + fileName + "\"")
                    .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
                    .body(resource);
        } catch (IOException e) {
            log.error("File download failed: {}", fileName, e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
    }

    private String detectContentType(String fileName) {
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        return switch (extension) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "mp4" -> "video/mp4";
            case "mp3" -> "audio/mpeg";
            case "pdf" -> "application/pdf";
            default -> "application/octet-stream";
        };
    }
}