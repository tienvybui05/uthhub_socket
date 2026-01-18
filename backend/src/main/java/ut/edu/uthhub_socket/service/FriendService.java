package ut.edu.uthhub_socket.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ut.edu.uthhub_socket.dto.response.FriendResponse;
import ut.edu.uthhub_socket.model.Friend;
import ut.edu.uthhub_socket.model.FriendshipStatus;
import ut.edu.uthhub_socket.model.StyleNotifications;
import ut.edu.uthhub_socket.model.User;
import ut.edu.uthhub_socket.repository.IFriendRepository;
import ut.edu.uthhub_socket.repository.IUserRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FriendService implements IFriendService{
    private final IFriendRepository friendRepository;
    private final IUserRepository userRepository;
    private final INotificationsService notificationsService;
    @Override
    public void sendFriendRequestByUsername(Integer meId, String username) {

        User target = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        Integer targetId = target.getId();

        if (meId.equals(targetId)) {
            throw new RuntimeException("Không thể kết bạn với chính mình");
        }

        Optional<Friend> relation = friendRepository.findRelation(meId, targetId);

        if (relation.isPresent()) {
            Friend f = relation.get();

            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new RuntimeException("Đã là bạn");
            }

            if (f.getStatus() == FriendshipStatus.PENDING) {
                if (f.getUser().getId().equals(meId)) {
                    throw new RuntimeException("Bạn đã gửi lời mời");
                } else {
                    throw new RuntimeException("Người này đã gửi lời mời cho bạn");
                }
            }
        }

        User me = userRepository.findById(meId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        Friend friend = new Friend();
        friend.setUser(me);       // requester
        friend.setFriend(target); // receiver
        friend.setStatus(FriendshipStatus.PENDING);
        notificationsService.sendFriendNotification(targetId,me.getId(), StyleNotifications.FRIEND_REQUEST);
        friendRepository.save(friend);
    }

    @Override
    public void acceptFriend(Integer requestId, Integer userId) {
        Friend f = friendRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!f.getFriend().getId().equals(userId))
            throw new RuntimeException("Không có quyền");

        f.setStatus(FriendshipStatus.ACCEPTED);
        friendRepository.save(f);
        notificationsService.sendFriendNotification(f.getUser().getId(),userId, StyleNotifications.FRIEND_ACCEPTED);
    }

    @Override
    public void rejectFriendRequest(Integer requestId, Integer meId) {

        Friend friend = friendRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời"));

        // đảm bảo đúng người nhận
        if (!friend.getFriend().getId().equals(meId)) {
            throw new RuntimeException("Không có quyền từ chối");
        }

        // 🔥 DELETE luôn
        friendRepository.delete(friend);
    }

    @Override
    public List<FriendResponse> getFriendRequests(Integer userId) {
        return friendRepository.findByFriendIdAndStatus(userId, FriendshipStatus.PENDING)
                .stream()
                .map(f -> new FriendResponse(
                        f.getId(),
                        f.getUser().getId(),
                        f.getUser().getFullName(),
                        f.getCreatedAt(),
                        f.getStatus(),
                        f.getUser().getAvatar(),
                        f.getUser().getUsername()
                ))
                .toList();
    }

    @Override
    public List<FriendResponse> getFriends(Integer userId) {
        return friendRepository
                .findByStatusAndUserIdOrStatusAndFriendId(
                        FriendshipStatus.ACCEPTED, userId,
                        FriendshipStatus.ACCEPTED, userId
                )
                .stream()
                .map(f -> {
                    User u = f.getUser().getId().equals(userId)
                            ? f.getFriend()
                            : f.getUser();

                    return new FriendResponse(
                            f.getId(),
                            u.getId(),
                            u.getFullName(),
                            f.getCreatedAt(),
                            f.getStatus(),
                            u.getAvatar(),
                            u.getUsername()
                    );
                })
                .toList();
    }

    @Override
    public List<FriendResponse> getSentFriendRequests(Integer userId) {
        return friendRepository.findByUserIdAndStatus(userId, FriendshipStatus.PENDING)
                .stream()
                .map(f -> new FriendResponse(
                        f.getId(),
                        f.getFriend().getId(),
                        f.getFriend().getFullName(),
                        f.getCreatedAt(),
                        f.getStatus(),
                        f.getFriend().getAvatar(),
                        f.getFriend().getUsername()
                ))
                .toList();
    }

    @Override
    public void cancelFriendRequest(Integer meId, Integer targetId) {

        Friend f = friendRepository
                .findByUser_IdAndFriend_IdAndStatus(
                        meId,
                        targetId,
                        FriendshipStatus.PENDING
                )
                .orElseThrow(() -> new RuntimeException("Không có lời mời để thu hồi"));

        friendRepository.delete(f);
    }

    @Override
    public void unfriend(Integer meId, Integer friendId) {

        Friend f = friendRepository
                .findRelation(meId, friendId)
                .orElseThrow(() -> new RuntimeException("Không phải bạn bè"));

        if (f.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new RuntimeException("Không phải bạn bè");
        }

        friendRepository.delete(f);
    }

}
