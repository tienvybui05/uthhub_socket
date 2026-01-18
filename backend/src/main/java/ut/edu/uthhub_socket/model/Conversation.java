package ut.edu.uthhub_socket.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany
    @JoinTable(name = "conversation_users", joinColumns = @JoinColumn(name = "conversation_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> participants = new HashSet<>();

    @Column(name = "is_group")
    private Boolean isGroup = false;

    @Column(length = 100)
    private String name; // group name

    @Column(name = "avatar_url")
    private String avatarUrl; // optional

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy; // admin

    private String lastMessage;
    private LocalDateTime lastMessageAt;
    @OneToMany(mappedBy = "conversation", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Message> messages;

    @PrePersist
    protected void onCreate() {
        lastMessageAt = LocalDateTime.now();
    }
}