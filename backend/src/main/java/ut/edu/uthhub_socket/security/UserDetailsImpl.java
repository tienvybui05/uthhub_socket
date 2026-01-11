package ut.edu.uthhub_socket.security;

import lombok.Data;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import ut.edu.uthhub_socket.enums.Role;
import ut.edu.uthhub_socket.enums.UserStatus;
import ut.edu.uthhub_socket.model.User;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Data
public class UserDetailsImpl implements UserDetails {
    private Integer id;
    private String fullName;
    private String username;
    private String email;
    private String password;

    private Role role;
    private String avatar;
    private UserStatus status;
    private LocalDateTime dateOfBirth;
    private LocalDateTime createdAt;
    public UserDetailsImpl() {
    }

    public UserDetailsImpl(User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.role = user.getRole();
        this.avatar = user.getAvatar();
        this.status = user.getStatus();
        this.dateOfBirth = user.getDateOfBirth();
        this.createdAt = user.getCreatedAt();
    }

    public static  UserDetailsImpl build(User user) {
        return new UserDetailsImpl(user);

    }
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public @Nullable String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}

