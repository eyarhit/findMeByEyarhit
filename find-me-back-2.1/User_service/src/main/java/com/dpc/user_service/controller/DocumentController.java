package com.dpc.user_service.controller;

import com.dpc.user_service.Entities.Document;
import com.dpc.user_service.Entities.User;
import com.dpc.user_service.Repository.DocumentRepository;
import com.dpc.user_service.Repository.UserRepository;
import com.dpc.user_service.services.DocumentService;
import com.dpc.user_service.services.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/document")
@Tag(name = "Document Management", description = "APIs for managing user documents")
public class DocumentController {

    @Autowired
    DocumentRepository documentRepository;

    @Autowired
    FileStorageService fileStorageService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    DocumentService documentService;


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createDocument(
            @Parameter(
                    description = "File to upload",
                    required = true,
                    content = @Content(mediaType = "application/octet-stream", schema = @Schema(type = "string", format = "binary"))
            )
            @RequestPart("file") MultipartFile file,
            @RequestPart("fileName") String fileName,
            @Parameter(description = "User ID (use -1 to specify email)", required = true)
            @RequestParam("idUser") Long idUser,

            @Parameter(description = "Optional folder path", required = false)
            @RequestParam(value = "type-document", required = false) String folder,

            @Parameter(description = "User email (required if idUser = -1)", required = false)
            @RequestParam(value = "email", required = false) String email
    ) {
        try {
            // Find user by id or email as needed
            User user;
            if (idUser != null && idUser == -1) {
                if (email == null || email.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Email must be provided if idUser is -1.");
                }
                user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
            } else {
                user = userRepository.findById(idUser)
                        .orElseThrow(() -> new RuntimeException("User not found with ID: " + idUser));
            }

            String originalFilename = file.getOriginalFilename();
            String extension = (originalFilename != null && originalFilename.contains("."))
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase()
                    : ".pdf";

            String baseFolder = (folder != null && !folder.trim().isEmpty())
                    ? folder.replaceAll("[^a-zA-Z0-9/_-]", "_")
                    : "documents";

            String sanitizedTitle = fileName.replaceAll("[^a-zA-Z0-9_-]", "_");
            String generatedFileName = baseFolder + "/" + sanitizedTitle + "-" + System.currentTimeMillis() + extension;

            fileStorageService.storeFile(file, generatedFileName);

            Document document = new Document();
            document.setFileName(fileName);
            document.setFilePath(generatedFileName);
            document.setUser(user);
            Document savedDocument = documentRepository.save(document);

            Map<String, Object> response = new HashMap<>();
            response.put("document", savedDocument);
            response.put("presignedUrl", fileStorageService.getPresignedUrl(generatedFileName));

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload document: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid request: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable Long id) {
        try {
            Document document = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Document not found with ID: " + id));

            if (document.getFilePath() == null || document.getFilePath().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document has no associated file");
            }

            String objectName = document.getFilePath(); // Assuming filePath stores the object name in MinIO
            String presignedUrl = fileStorageService.getPresignedUrl(objectName);

            Map<String, Object> response = new HashMap<>();
            response.put("document", document);
            response.put("presignedUrl", presignedUrl);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving document: " + e.getMessage());
        }
    }

    /**
     * Batch fetch document metadata + presigned URLs by ids.
     * Used by the "Dossier de Compétences" UI to display selected documents.
     */
    @PostMapping("/by-ids")
    public ResponseEntity<?> getDocumentsByIds(@RequestBody List<Long> ids) {
        try {
            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            // Preserve client order; skip missing ids.
            List<Map<String, Object>> out = new ArrayList<>();
            for (Long id : ids) {
                if (id == null) continue;
                Optional<Document> opt = documentRepository.findById(id);
                if (opt.isEmpty()) continue;
                Document doc = opt.get();

                Map<String, Object> row = new HashMap<>();
                row.put("idDocument", doc.getIdDocument());
                row.put("fileName", doc.getFileName());
                row.put("filePath", doc.getFilePath());
                row.put("presignedUrl", doc.getFilePath() != null ? fileStorageService.getPresignedUrl(doc.getFilePath()) : null);
                out.add(row);
            }
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving documents: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getDocumentsByUser(@PathVariable Long userId) {
        try {
            // Ensure the user exists
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

            // Get documents related to this user
            List<Document> documents = documentRepository.findAllByUserId(userId);

            // Add presigned URLs for each document
            List<Map<String, Object>> responseList = new ArrayList<>();
            for (Document doc : documents) {
                Map<String, Object> docResponse = new HashMap<>();
                docResponse.put("document", doc);
                docResponse.put("presignedUrl", fileStorageService.getPresignedUrl(doc.getFilePath()));
                responseList.add(docResponse);
            }

            return ResponseEntity.ok(responseList);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving documents: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        try {
            documentService.deleteDocument(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete document: " + e.getMessage());
        }
    }

    @GetMapping("/by-filename")
    public ResponseEntity<?> getDocumentByFileName(@RequestParam String fileName) {
        try {
            Document document = documentRepository.findByFileName(fileName)
                    .orElseThrow(() -> new RuntimeException("Document not found with fileName: " + fileName));

            String presignedUrl = fileStorageService.getPresignedUrl(document.getFilePath());

            Map<String, Object> response = new HashMap<>();
            response.put("document", document);
            response.put("presignedUrl", presignedUrl);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving document: " + e.getMessage());
        }
    }
    @GetMapping("/{userId}/folder")
    @Operation(
            summary = "Get document by user ID and folder",
            description = "Retrieves the first document of a user filtered by folder and returns document metadata with a presigned URL.",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Document found and presigned URL generated",
                            content = @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = Map.class))
                    ),
                    @ApiResponse(
                            responseCode = "404",
                            description = "User or document not found",
                            content = @Content
                    ),
                    @ApiResponse(
                            responseCode = "500",
                            description = "Internal server error",
                            content = @Content
                    )
            }
    )
    public ResponseEntity<?> getDocumentsByUserAndFolder(
            @Parameter(description = "User ID", required = true)
            @PathVariable Long userId,
            @Parameter(description = "Folder name to filter documents", required = true)
            @RequestParam String folder) {
        try {
            List<Document> documents = documentRepository.findAllByUserId(userId);

            if (documents.isEmpty()) {
                return ResponseEntity.status(HttpStatus.ACCEPTED)
                        .body(Collections.emptyList());
            }

            // Normalize folder to ensure it ends with "/"
            String folderToUse = folder.endsWith("/") ? folder : folder + "/";

            // Filter documents whose filePath starts with folderToUse
            List<Document> filteredDocuments = documents.stream()
                    .filter(doc -> doc.getFilePath() != null && doc.getFilePath().startsWith(folderToUse))
                    .toList();

            if (filteredDocuments.isEmpty()) {
                return ResponseEntity.status(HttpStatus.ACCEPTED)
                        .body(Collections.emptyList());
            }

            // Build response list with presigned URLs for each filtered document
            List<Map<String, Object>> responseList = new ArrayList<>();
            for (Document doc : filteredDocuments) {
                String objectName = doc.getFilePath(); // full path already includes folder

                String presignedUrl = fileStorageService.getPresignedUrl(objectName);

                Map<String, Object> docMap = new HashMap<>();
                docMap.put("document", doc.getIdDocument());
                docMap.put("presignedUrl", presignedUrl);
                docMap.put("fileName", doc.getFileName());

                responseList.add(docMap);
            }

            return ResponseEntity.ok(responseList);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving documents: " + e.getMessage());
        }
    }


}
