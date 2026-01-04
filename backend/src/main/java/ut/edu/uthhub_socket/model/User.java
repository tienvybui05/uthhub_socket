package ut.edu.uthhub_socket.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ut.edu.uthhub_socket.enums.Role;
import ut.edu.uthhub_socket.enums.UserStatus;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true)
    private String email;

    private LocalDateTime dateOfBirth;

    private String avatar;

    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.OFFLINE;

    @Enumerated(EnumType.STRING)
    private Role role;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public User(String username, String password, String email, String fullName,LocalDateTime dateOfBirth) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
    }
}