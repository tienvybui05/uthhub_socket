package ut.edu.uthhub_socket.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReadReceiptRequest {
    private Long conversationId;
}
