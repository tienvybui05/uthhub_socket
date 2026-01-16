package ut.edu.uthhub_socket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ut.edu.uthhub_socket.model.User;
import ut.edu.uthhub_socket.security.UserDetailsImpl;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Integer id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private LocalDateTime dateOfBirth;
    private String avatar;
    private String status;
    private String gender;

    public UserResponse(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.role = user.getRole() != null ? user.getRole().name() : null;
        this.avatar = user.getAvatar();
        this.status = user.getStatus() != null ? user.getStatus().name() : null;
        this.dateOfBirth = user.getDateOfBirth();
        this.gender = user.getGender() != null ? user.getGender().name() : null;
    }

    public UserResponse(UserDetailsImpl user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.role = user.getRole() != null ? user.getRole().name() : null;
        this.avatar = user.getAvatar();
        this.status = user.getStatus() != null ? user.getStatus().toString() : null;
        this.dateOfBirth = user.getDateOfBirth();
        this.gender = null;
    }
}
