package ut.edu.uthhub_socket.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ut.edu.uthhub_socket.dto.request.FriendRequest;
import ut.edu.uthhub_socket.model.User;
import ut.edu.uthhub_socket.security.UserDetailsImpl;
import ut.edu.uthhub_socket.service.IFriendService;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final IFriendService friendService;

    @PostMapping("/request")
    public ResponseEntity<?> sendRequest(
            @RequestBody FriendRequest dto,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        friendService.sendFriendRequestByUsername(
                userDetails.getId(),
                dto.getUsername()
        );
        return ResponseEntity.ok("Đã gửi lời mời kết bạn");
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(
                friendService.getFriendRequests(userDetails.getId())
        );
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> accept(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        friendService.acceptFriend(id, userDetails.getId());
        return ResponseEntity.ok("Đã chấp nhận kết bạn");
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        friendService.rejectFriendRequest(id, userDetails.getId());
        return ResponseEntity.ok("Đã từ chối");
    }

    @GetMapping
    public ResponseEntity<?> friends(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(
                friendService.getFriends(userDetails.getId())
        );
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<?> getSentRequests(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(friendService.getSentFriendRequests(userDetails.getId()));
    }

    // Thu hồi lời mời
    @DeleteMapping("/cancel/{targetId}")
    public void cancelRequest(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Integer targetId
    ) {
        friendService.cancelFriendRequest(userDetails.getId(), targetId);
    }

    // Hủy kết bạn
    @DeleteMapping("/unfriend/{friendId}")
    public void unfriend(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Integer friendId
    ) {
        friendService.unfriend(userDetails.getId(), friendId);
    }

}
