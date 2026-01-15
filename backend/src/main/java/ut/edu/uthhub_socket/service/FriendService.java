package ut.edu.uthhub_socket.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ut.edu.uthhub_socket.dto.response.FriendResponse;
import ut.edu.uthhub_socket.model.Friend;
import ut.edu.uthhub_socket.model.FriendshipStatus;
import ut.edu.uthhub_socket.model.User;
import ut.edu.uthhub_socket.repository.IFriendRepository;
import ut.edu.uthhub_socket.repository.IUserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendService implements IFriendService{
    private final IFriendRepository friendRepository;
    private final IUserRepository userRepository;

    @Override
    public void sendFriendRequestByUsername(Integer senderId, String receiverUsername) {

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findByUsername(receiverUsername)
                .orElseThrow(() -> new RuntimeException("Username không tồn tại"));

        if (sender.getId().equals(receiver.getId()))
            throw new RuntimeException("Không thể kết bạn với chính mình");

        // kiểm tra 2 chiều
        boolean existed =
                friendRepository.findByUserIdAndFriendId(sender.getId(), receiver.getId()).isPresent()
                        || friendRepository.findByFriendIdAndUserId(receiver.getId(), sender.getId()).isPresent();

        if (existed)
            throw new RuntimeException("Đã tồn tại mối quan hệ kết bạn");

        Friend friend = new Friend();
        friend.setUser(sender);
        friend.setFriend(receiver);
        friend.setStatus(FriendshipStatus.PENDING);

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
    }

    @Override
    public void rejectFriend(Integer requestId, Integer userId) {
        Friend f = friendRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!f.getFriend().getId().equals(userId))
            throw new RuntimeException("Không có quyền");

        f.setStatus(FriendshipStatus.REJECTED);
        friendRepository.save(f);
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
                            f.getUser().getAvatar(),
                            f.getUser().getUsername()
                    );
                })
                .toList();
    }
}
