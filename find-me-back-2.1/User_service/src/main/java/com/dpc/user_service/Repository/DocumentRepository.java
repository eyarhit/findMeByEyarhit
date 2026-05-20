package com.dpc.user_service.Repository;

import com.dpc.user_service.Entities.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    @Query("SELECT d FROM Document d WHERE d.user.userId = :userId")
    List<Document> findAllByUserId(@Param("userId") Long userId);

    Optional<Document> findByFileName(String fileName);

    Optional<Document> findById(Long id);


}
