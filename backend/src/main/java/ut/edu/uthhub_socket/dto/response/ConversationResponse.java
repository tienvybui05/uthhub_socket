package ut.edu.uthhub_socket.dto.response;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import ut.edu.uthhub_socket.model.Conversation;
import ut.edu.uthhub_socket.model.User;

public class ConversationResponse {
    private Long id;
    private Set<UserResponse> participants;
    private LocalDateTime lastMessageAt;
    private String lastMessage;

    public ConversationResponse(Conversation conversation) {
        this.id = conversation.getId();
        setParticipants(conversation.getParticipants());
        this.lastMessageAt = conversation.getLastMessageAt();
        this.lastMessage = conversation.getLastMessage();
    }

    public void setParticipants(Set<User> users) {
        Set<UserResponse> participants = new HashSet<>();
        for (User user : users) {
            participants.add(new UserResponse(user));
        }
        this.participants = participants;
    }

    public Long getId() {
        return id;
    }

    public Set<UserResponse> getParticipants() {
        return participants;
    }

    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }

    public String getLastMessage() {
        return lastMessage;
    }
}
