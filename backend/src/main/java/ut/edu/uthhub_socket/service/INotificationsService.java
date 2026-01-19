package ut.edu.uthhub_socket.service;

import ut.edu.uthhub_socket.dto.response.NotificationsResponse;
import ut.edu.uthhub_socket.model.Notifications;
import ut.edu.uthhub_socket.model.StyleNotifications;

import java.util.List;

public interface INotificationsService {
List<NotificationsResponse> getAllNotificationsByUserId(Integer userId);
List<NotificationsResponse> findAllByUserIdAndIsReadFalse(Integer userId);
void updateNotificationsById(Integer meId,Long notificationId);
void sendFriendNotification(Integer userId,Integer idUser, StyleNotifications styleNotifications);
void createGroupNotification(Integer userId,List<Integer> receives,String nameGroup, StyleNotifications styleNotifications);
}
