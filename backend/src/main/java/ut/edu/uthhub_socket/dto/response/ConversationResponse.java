package ut.edu.uthhub_socket.dto.response;

import ut.edu.uthhub_socket.model.Conversation;
import ut.edu.uthhub_socket.model.User;

import java.time.LocalDateTime;
import java.util.*;

public class ConversationResponse {
    private Long id;
    private String name;
    private String avatarUrl;
    private Boolean isGroup;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Integer participantCount;

    private Set<UserResponse> participants;

    // optional cho panel info (đỡ phải mock)
    private List<MemberInfo> members;

    public static class MemberInfo {
        public Integer id;
        public String fullName;
        public String avatarUrl;
        public String role;

        public MemberInfo(Integer id, String fullName, String avatarUrl, String role) {
            this.id = id;
            this.fullName = fullName;
            this.avatarUrl = avatarUrl;
            this.role = role;
        }
    }

    public ConversationResponse(Conversation conversation) {
        this.id = conversation.getId();
        this.name = conversation.getName();
        this.avatarUrl = conversation.getAvatarUrl();
        this.isGroup = conversation.getIsGroup();
        this.lastMessage = conversation.getLastMessage();
        this.lastMessageTime = conversation.getLastMessageAt();

        setParticipants(conversation.getParticipants());
        this.participantCount = conversation.getParticipants() != null ? conversation.getParticipants().size() : 0;

        // build members list (creator = Admin, còn lại = Thành viên)
        User creator = conversation.getCreatedBy();
        List<MemberInfo> m = new ArrayList<>();
        if (conversation.getParticipants() != null) {
            for (User u : conversation.getParticipants()) {
                String role = (creator != null && creator.getId().equals(u.getId())) ? "Admin" : "Thành viên";
                m.add(new MemberInfo(u.getId(), u.getFullName(), u.getAvatar(), role));
            }
        }
        this.members = m;
    }

    public void setParticipants(Set<User> users) {
        Set<UserResponse> participants = new HashSet<>();
        if (users != null) {
            for (User user : users) participants.add(new UserResponse(user));
        }
        this.participants = participants;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getAvatarUrl() { return avatarUrl; }
    public Boolean getIsGroup() { return isGroup; }
    public String getLastMessage() { return lastMessage; }
    public LocalDateTime getLastMessageTime() { return lastMessageTime; }
    public Integer getParticipantCount() { return participantCount; }
    public Set<UserResponse> getParticipants() { return participants; }
    public List<MemberInfo> getMembers() { return members; }
}
