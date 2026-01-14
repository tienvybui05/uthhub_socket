package ut.edu.uthhub_socket.dto.response;

import ut.edu.uthhub_socket.model.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageResponse {
    Long id;
    Integer senderId;
    String avatar;
    Long conversationId;
    String senderName;
    String content;
    LocalDateTime createdAt;

    public MessageResponse(Message message) {
        this.id = message.getId();
        this.senderId = message.getSender().getId();
        this.avatar = message.getSender().getAvatar();
        this.senderName = message.getSender().getFullName();
        this.conversationId = message.getConversation().getId();
        this.createdAt = message.getCreatedAt();
        this.content = message.getContent();
    }
}