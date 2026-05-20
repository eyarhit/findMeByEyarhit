package com.dpc.user_service.Repository;

import com.dpc.user_service.Entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(String userId);
    // Find all unread notifications for a specific user
    List<Notification> findByUserIdAndReadFalse(String userId);

    // Count how many unread notifications a user has
    long countByUserIdAndReadFalse(String userId);

}