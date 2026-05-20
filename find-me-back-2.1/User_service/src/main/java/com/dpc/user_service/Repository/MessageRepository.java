package com.dpc.user_service.Repository;

import com.dpc.user_service.Entities.ChatRoom;
import com.dpc.user_service.Entities.Message;
import com.dpc.user_service.Entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findBySenderAndReceiverOrderByTimestampAsc(User sender, User receiver);
    List<Message> findByChatRoomOrderByTimestampAsc(ChatRoom chatRoom);

    Page<Message> findBySenderAndReceiver(User sender, User receiver, Pageable pageable);
    Page<Message> findByChatRoom(ChatRoom chatRoom, Pageable pageable);
}
