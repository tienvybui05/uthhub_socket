package ut.edu.uthhub_socket.dto.response;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ut.edu.uthhub_socket.model.Notifications;
import ut.edu.uthhub_socket.model.StyleNotifications;


import java.time.LocalDateTime;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationsResponse {
    private Long id;
    private Integer senderId;
    private StyleNotifications style;
    private String content;
    private Boolean isRead ;
    private LocalDateTime createdAt;
    public  NotificationsResponse(Notifications notifications) {

        this.id = notifications.getId();
        this.senderId = (notifications.getSender() != null) ? notifications.getSender().getId() : null;
        this.style = notifications.getStyle();
        this.content = notifications.getContent();
        this.createdAt = notifications.getCreatedAt();
        this.isRead = notifications.getIsRead();
    }
}
