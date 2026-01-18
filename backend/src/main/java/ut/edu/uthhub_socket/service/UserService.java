package ut.edu.uthhub_socket.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import ut.edu.uthhub_socket.dto.request.UpdateProfileRequest;
import ut.edu.uthhub_socket.dto.response.UserResponse;
import ut.edu.uthhub_socket.dto.response.UserSearchResponse;
import ut.edu.uthhub_socket.enums.Gender;
import ut.edu.uthhub_socket.model.*;
import ut.edu.uthhub_socket.repository.IFriendRepository;
import ut.edu.uthhub_socket.repository.IUserRepository;

import java.util.Optional;

@Service
public class UserService implements IUserService {

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IFriendRepository friendRepository;

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
        user.ifPresent(u -> {
            u.setStatus(UserStatus.ONLINE);
            userRepository.save(u);
        });
        return new UserResponse(user.get());
    }

    @Override
    public UserSearchResponse findUserByUsername(String username, Integer meId) {

        User target = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        String friendStatus = "NONE";

        Integer requestId = null;

        Optional<Friend> relation =
                friendRepository.findRelation(meId, target.getId());

        if (relation.isPresent()) {
            Friend f = relation.get();

            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                friendStatus = "FRIEND";
            }
            else if (f.getStatus() == FriendshipStatus.PENDING) {
                requestId = f.getId();
                if (f.getUser().getId().equals(meId)) {
                    friendStatus = "PENDING_SENT";
                } else {
                    friendStatus = "PENDING_RECEIVED";
                }
            }
        }

        return new UserSearchResponse(
                target.getId(),
                target.getUsername(),
                target.getEmail(),
                target.getFullName(),
                target.getDateOfBirth(),
                target.getAvatar(),
                target.getGender() != null ? target.getGender().name() : null,
                requestId,
                friendStatus
        );
    }

    @Override
    public UserResponse getMyProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return new UserResponse(user);
    }

    @Override
    public UserResponse updateMyProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email đã tồn tại");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }

        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }

        if (request.getGender() != null) {
            try {
                user.setGender(Gender.valueOf(request.getGender()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Giới tính không hợp lệ");
            }
        }

        User saved = userRepository.save(user);
        return new UserResponse(saved);
    }
}
