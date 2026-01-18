package ut.edu.uthhub_socket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ut.edu.uthhub_socket.model.Conversation;
import ut.edu.uthhub_socket.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface IConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("""
                select c from Conversation c
                join c.participants u
                where u.id = :userId
            """)
    List<Conversation> findByUserId(Integer userId);

    @Query("""
            select c from  Conversation  c
            join c.participants u1
            join c.participants u2
            where u1.id = :meId and u2.id = :friendId
            and c.isGroup = false
            """)
    Optional<Conversation> findBetweenUsers(Integer meId, Integer friendId);
}
