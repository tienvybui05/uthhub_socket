package ut.edu.uthhub_socket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ut.edu.uthhub_socket.model.Message;

import java.util.List;

@Repository
public interface IMessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
}
