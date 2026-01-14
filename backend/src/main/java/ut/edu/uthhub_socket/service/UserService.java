package ut.edu.uthhub_socket.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import ut.edu.uthhub_socket.dto.response.UserResponse;
import ut.edu.uthhub_socket.dto.response.UserSearchResponse;
import ut.edu.uthhub_socket.model.Role;
import ut.edu.uthhub_socket.model.User;
import ut.edu.uthhub_socket.model.UserStatus;
import ut.edu.uthhub_socket.repository.IUserRepository;
import java.util.Optional;


@Service
public class UserService implements IUserService {

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private IUserRepository userRepository;

    @Override
    public Optional<User> findById(Integer id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public User update(User user) {
        return userRepository.save(user);
    }

    @Override
    public void updatePassword(Integer userId, String encodedPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(encodedPassword);
        userRepository.save(user);
    }

    @Override
    public void updateRole(Integer userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        userRepository.save(user);
    }

    @Override
    public User register(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.ROLE_USER);
        User savedUser = userRepository.save(user);
        return savedUser;
    }

    @Override
    public UserResponse connect(UserResponse response) {
        Optional<User> user = userRepository.findByUsername(response.getUsername());
        user.ifPresent(u ->{
            u.setStatus(UserStatus.ONLINE);
            userRepository.save(u);
        });
        return new UserResponse(user.get());
    }

    @Override
    public UserSearchResponse findUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        return new UserSearchResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getDateOfBirth(),
                user.getAvatar()
        );
    }
}
