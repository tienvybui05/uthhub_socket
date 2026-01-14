package ut.edu.uthhub_socket.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {
    private Long conversationId;
    private String content;
    private Integer recipientId; // Optional: for creating new conversation if conversationId is null
}
