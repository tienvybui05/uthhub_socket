package ut.edu.uthhub_socket.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import ut.edu.uthhub_socket.dto.request.UpdateProfileRequest;
import ut.edu.uthhub_socket.dto.response.UserResponse;
import ut.edu.uthhub_socket.dto.response.UserSearchResponse;
import ut.edu.uthhub_socket.security.UserDetailsImpl;
import ut.edu.uthhub_socket.service.IUserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private IUserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/user/connect")
    public void connect(@Payload UserResponse userResponse) {
        UserResponse updatedUser = userService.connect(userResponse);
        messagingTemplate.convertAndSend(
                "/topic/active/" + userResponse.getUsername(), userResponse
        );
    }

    @GetMapping("/search")
    public ResponseEntity<UserSearchResponse> searchByUsername(
            @RequestParam String username,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        return ResponseEntity.ok(
                userService.findUserByUsername(
                        username,
                        userDetails.getId()   // 👈 meId
                )
        );
    }


    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return ResponseEntity.ok(userService.getMyProfile(username));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return ResponseEntity.ok(userService.updateMyProfile(username, request));
    }
}
