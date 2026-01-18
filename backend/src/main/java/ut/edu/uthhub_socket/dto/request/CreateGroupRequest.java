package ut.edu.uthhub_socket.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CreateGroupRequest {
    private String name;
    private List<Integer> memberIds; // danh sách userId của bạn bè
    private String avatarUrl; // optional
}
