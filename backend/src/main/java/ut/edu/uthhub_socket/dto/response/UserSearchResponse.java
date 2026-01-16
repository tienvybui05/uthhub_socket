package ut.edu.uthhub_socket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchResponse {
    private Integer id;
    private String username;
    private String email;
    private String fullName;
    private LocalDateTime dateOfBirth;
    private String avatar;
    private String gender;
}
