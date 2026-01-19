package ut.edu.uthhub_socket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ut.edu.uthhub_socket.model.Message;

import java.util.List;

@Repository
public interface IMessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation.id = :conversationId AND m.sender.id <> :readerId AND m.isRead = false")
    int markAsRead(@Param("conversationId") Long conversationId, @Param("readerId") Integer readerId);
}
