package ut.edu.uthhub_socket.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import ut.edu.uthhub_socket.service.UserDetailsServiceImpl;

import java.io.IOException;

@Component// mỗi request là chạy 1 lần
public class AuthTokenFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtils jwtUtils;
    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // Cho phép các endpoint không cần xác thực
        return path.startsWith("/api/auth/") || path.startsWith("/ws/");
    }
    // Tự động chạy cho mọi request
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try{
            String jwt = parseToken(request);// lấy jwt từ header
            if(jwt != null&& jwtUtils.validateJwtToken(jwt)){//kiểm tra jwt hợp lệ chưa
                String username = jwtUtils.getUsernameFromToken(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                // tạo authentication
                UsernamePasswordAuthenticationToken authentication = new
                        UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                //lưu vào securitycontext
                SecurityContextHolder.getContext().setAuthentication(authentication);

            }
        }catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e);
        }
        // cho request đi tiếp
        filterChain.doFilter(request, response);
    }
    // tack bearer
    private String parseToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if(StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            return  token.substring(7);
        }
        return null;
    }

}

