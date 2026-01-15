package ut.edu.uthhub_socket.service;

import org.springframework.web.multipart.MultipartFile;

import ut.edu.uthhub_socket.dto.request.UpdateProfileRequest;
import ut.edu.uthhub_socket.dto.response.UserResponse;
import ut.edu.uthhub_socket.dto.response.UserSearchResponse;
import ut.edu.uthhub_socket.model.Role;
import ut.edu.uthhub_socket.model.User;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface IUserService {
    Optional<User> findById(Integer id);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    User save(User user);

    User update(User user);

    void updatePassword(Integer userId, String encodedPassword);

    void updateRole(Integer userId, Role role);

    User register(User user);

    UserResponse connect(UserResponse response);

    UserSearchResponse findUserByUsername(String username);

    UserResponse getMyProfile(String username);

    UserResponse updateMyProfile(String username, UpdateProfileRequest request);
}
