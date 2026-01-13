package ut.edu.uthhub_socket.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ut.edu.uthhub_socket.dto.response.NotificationsResponse;
import ut.edu.uthhub_socket.security.UserDetailsImpl;
import ut.edu.uthhub_socket.service.INotificationsService;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationsController {

    @Autowired
    private INotificationsService notificationsService;
    @GetMapping("/getbyuserid")
    public List<NotificationsResponse> getMyNotifications(Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
      return notificationsService.getAllNotificationsByUserId(user.getId());

    }
    @GetMapping("/getbyuserid-isreadfalse")
    public List<NotificationsResponse> findAllByUserIdAndIsReadFalse(Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
        return notificationsService.findAllByUserIdAndIsReadFalse(user.getId());

    }
    @PostMapping("/update-is-read/{id}")
    public ResponseEntity<?> updateIsRead(@PathVariable Long id,
                                          Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
        notificationsService.updateNotificationsById(user.getId(),id);
         return ResponseEntity.ok("");
    }
}
