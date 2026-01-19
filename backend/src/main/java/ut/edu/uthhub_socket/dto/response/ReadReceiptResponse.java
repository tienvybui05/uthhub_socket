package ut.edu.uthhub_socket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReadReceiptResponse {
    private Long conversationId;
    private Integer readerId;
    private String readerName;
    private String readerAvatar;
}
