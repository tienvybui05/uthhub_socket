package ut.edu.uthhub_socket.service;

import ut.edu.uthhub_socket.dto.response.NotificationsResponse;

import java.util.List;

public interface INotificationsService {
List<NotificationsResponse> getAllNotificationsByUserId(Integer userId);
List<NotificationsResponse> findAllByUserIdAndIsReadFalse(Integer userId);
void updateNotificationsById(Integer meId,Long notificationId);
}
