package ut.edu.uthhub_socket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ut.edu.uthhub_socket.model.Friend;
import ut.edu.uthhub_socket.model.FriendshipStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface IFriendRepository extends JpaRepository<Friend, Integer> {
    Optional<Friend> findByUserIdAndFriendId(Integer userId, Integer friendId);
    Optional<Friend> findByFriendIdAndUserId(Integer friendId, Integer userId);

    List<Friend> findByFriendIdAndStatus(Integer receiverId, FriendshipStatus status);

    List<Friend> findByUserIdAndStatus(Integer userId, FriendshipStatus status);

    List<Friend> findByStatusAndUserIdOrStatusAndFriendId(
            FriendshipStatus s1, Integer senderId,
            FriendshipStatus s2, Integer receiverId
    );

    // 2️⃣ Quan hệ hai chiều (dùng cho search)
    @Query("""
        SELECT f FROM Friend f
        WHERE 
        (f.user.id = :u1 AND f.friend.id = :u2)
        OR
        (f.user.id = :u2 AND f.friend.id = :u1)
    """)
    Optional<Friend> findRelation(Integer u1, Integer u2);

    @Query("""
        SELECT f FROM Friend f
        WHERE 
        (f.user.id = :userId OR f.friend.id = :userId)
        AND f.status = 'ACCEPTED'
    """)
    List<Friend> findAllFriends(Integer userId);

    Optional<Friend> findByUser_IdAndFriend_IdAndStatus(Integer meId, Integer targetId, FriendshipStatus status);
}
