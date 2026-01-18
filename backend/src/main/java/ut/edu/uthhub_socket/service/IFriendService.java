package ut.edu.uthhub_socket.service;

import ut.edu.uthhub_socket.dto.response.FriendResponse;

import java.util.List;

public interface IFriendService {
    void sendFriendRequestByUsername(Integer senderId, String receiverUsername);

    void acceptFriend(Integer requestId, Integer userId);

    void rejectFriendRequest(Integer requestId, Integer userId);

    List<FriendResponse> getFriendRequests(Integer userId);

    List<FriendResponse> getFriends(Integer userId);

    List<FriendResponse> getSentFriendRequests(Integer userId);

    void cancelFriendRequest(Integer meId, Integer targetId);

    void unfriend(Integer meId, Integer friendId);
}
