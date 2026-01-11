package ut.edu.uthhub_socket.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import ut.edu.uthhub_socket.dto.request.LoginRequest;
import ut.edu.uthhub_socket.dto.request.SignupRequest;
import ut.edu.uthhub_socket.dto.response.JwtResponse;
import ut.edu.uthhub_socket.dto.response.UserResponse;
import ut.edu.uthhub_socket.model.User;
import ut.edu.uthhub_socket.security.UserDetailsImpl;
import ut.edu.uthhub_socket.security.jwt.JwtUtils;
import ut.edu.uthhub_socket.service.IUserService;

@CrossOrigin(origins = "*",maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private IUserService userService;
    @Autowired
    private JwtUtils jwtUtils;


    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest ) {
        if(userService.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Username is already taken!");
        }
        if(userService.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Email is already in use!");
        }
        //tạo user
        User user = new User(
                signUpRequest.getUsername(),
                signUpRequest.getPassword(),
                signUpRequest.getEmail(),
                signUpRequest.getFullName(),
                signUpRequest.getDateOfBirth());
        userService.register(user);
        return ResponseEntity.ok("User registered successfully!");
    }
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest ) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateToken(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        UserResponse userResponse = new UserResponse(userDetails);

        return ResponseEntity.ok(
                new JwtResponse(jwt, "Bearer", userResponse)
        );
    }
}
