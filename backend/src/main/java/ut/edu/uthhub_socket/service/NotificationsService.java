package ut.edu.uthhub_socket.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ut.edu.uthhub_socket.dto.response.NotificationsResponse;
import ut.edu.uthhub_socket.model.Notifications;
import ut.edu.uthhub_socket.repository.INotificationsRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationsService implements INotificationsService {

    @Autowired
    private INotificationsRepository notificationsRepository;
    @Override
    public List<NotificationsResponse> getAllNotificationsByUserId(Integer userId) {
       List<Notifications> notifications = notificationsRepository.findAllByUser_IdOrderByCreatedAtDesc(userId);
       List<NotificationsResponse> responses = new ArrayList<>();
       for (Notifications notification : notifications) {
           responses.add(new NotificationsResponse(notification));
       }
        return responses;
    }

    @Override
    public List<NotificationsResponse> findAllByUserIdAndIsReadFalse(Integer userId) {
        List<Notifications> notifications = notificationsRepository.findAllByUser_IdAndIsReadFalseOrderByCreatedAtDesc(userId);
        List<NotificationsResponse> responses = new ArrayList<>();
        for (Notifications notification : notifications) {
            responses.add(new NotificationsResponse(notification));
        }
        return responses;
    }

    @Override
    public void updateNotificationsById(Integer meId, Long notificationId) {

        Notifications notification = notificationsRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông báo"));

        if (!notification.getUser().getId().equals(meId)) {
            throw new RuntimeException("Bạn không có quyền truy cập thông báo này");
        }

        if (notification.getIsRead()) return;

        notification.setIsRead(true);
        notificationsRepository.save(notification);
    }

}
