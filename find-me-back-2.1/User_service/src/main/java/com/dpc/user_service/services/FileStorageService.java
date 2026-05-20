package com.dpc.user_service.services;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.errors.MinioException;
import io.minio.http.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
@Primary
@Service
public class FileStorageService {

    private final MinioClient minioClient;
    private final String bucketName;
    private final String minioUrl;


    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    // Constructor-based dependency injection for MinioClient and configurations
    public FileStorageService() {
        // Hardcode the Minio credentials and URL here
        this.minioUrl = "https://sb-api.dpc.com.tn"; // Ensure this URL is correct
        this.bucketName = "find-me"; // Make sure this bucket exists

        String accessKey = "X4UmIch0A1WNkQ4QvnDz"; // Secure your access key
        String secretKey = "hjH7bbDwiOlG0igUK1RwR77CGOzHxTFVvhSAdYX3"; // Secure your secret key

        // Initialize the MinioClient with the hardcoded credentials
        this.minioClient = MinioClient.builder()
                .endpoint(minioUrl) // Ensure the correct endpoint is used
                .credentials(accessKey, secretKey) // Use the correct credentials
                .build();
    }

    /**
     * Store a file in MinIO and return its URL.
     */
    public Map<String, String> storeFile(MultipartFile file, String fileName) throws IOException {
        try (InputStream fileStream = file.getInputStream()) {
            // Upload the file to MinIO
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(fileStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());
            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", minioUrl + "/" + bucketName + "/" + fileName); // Return file URL
            return response;
        } catch (MinioException | NoSuchAlgorithmException | InvalidKeyException e) {
            logger.error("Failed to upload the file: {}", e.getMessage(), e); // Log the error
            throw new IOException("Failed to upload the file: " + e.getMessage(), e); // Re-throw as IOException
        }
    }

    public String getPresignedUrl(String objectName) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket("find-me")
                            .object(objectName)
                            .expiry(24 * 60 * 60) // 1 day in seconds (86400)
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Erreur de génération du pre-signed URL", e);
        }
    }


    /**
     * Delete a file from MinIO given its URL.
     */
    public void deleteFile(String fileUrl) throws IOException {
        String fileName = fileUrl.replace(minioUrl + "/" + bucketName + "/", ""); // Extract file name from URL
        try {
            // Delete the file from MinIO
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .build());
        } catch (MinioException | NoSuchAlgorithmException | InvalidKeyException e) {
            logger.error("Failed to delete the file: {}", e.getMessage(), e); // Log the error
            throw new IOException("Failed to delete the file: " + e.getMessage(), e); // Re-throw as IOException
        }
    }

    /**
     * Retrieve a file from MinIO.
     */
    public InputStream getFile(String fileName) throws IOException {
        try {
            // Retrieve the file from MinIO
            return minioClient.getObject(
                    io.minio.GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .build()
            );
        } catch (MinioException | NoSuchAlgorithmException | InvalidKeyException e) {
            logger.error("Failed to retrieve the file: {}", e.getMessage(), e); // Log the error
            throw new IOException("Failed to retrieve the file: " + e.getMessage(), e); // Re-throw as IOException
        }
    }



    // Getters for the MinIO URL and bucket name
    public String getMinioUrl() {
        return minioUrl;
    }

    public String getBucketName() {
        return bucketName;
    }


}