package ut.edu.uthhub_socket.dto.response;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ut.edu.uthhub_socket.enums.Gender;
import ut.edu.uthhub_socket.model.FriendshipStatus;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendResponse {
    private Integer requestId;
    private Integer userId;
    private String fullName;
    private LocalDateTime createdAt;
    private FriendshipStatus status;
    private String avatar;
    private String username;
    private Gender gender;
    private LocalDateTime dateOfBirth;
    private String email;
}