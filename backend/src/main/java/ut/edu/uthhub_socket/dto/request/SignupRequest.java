package ut.edu.uthhub_socket.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@Data
@AllArgsConstructor
public class SignupRequest {
    private String fullName;
    private String username;
    private String password;
    private String email;
    LocalDateTime dateOfBirth;
}
