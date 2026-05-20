package com.dpc.user_service.services;

import com.dpc.user_service.Entities.Document;
import com.dpc.user_service.Repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class DocumentService {

    @Autowired
    DocumentRepository documentRepository;

    @Autowired
    FileStorageService fileStorageService;

    public void deleteDocument(Long id) throws IOException {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        fileStorageService.deleteFile(document.getFilePath());
        documentRepository.delete(document);
    }
}
