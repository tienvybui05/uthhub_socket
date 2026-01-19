package ut.edu.uthhub_socket.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ut.edu.uthhub_socket.dto.request.ChatMessageRequest;
import ut.edu.uthhub_socket.model.Conversation;
import ut.edu.uthhub_socket.model.Message;
import ut.edu.uthhub_socket.model.User;
import ut.edu.uthhub_socket.repository.IConversationRepository;
import ut.edu.uthhub_socket.repository.IUserRepository;
import ut.edu.uthhub_socket.repository.IMessageRepository;
import ut.edu.uthhub_socket.dto.request.CreateGroupRequest;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final IMessageRepository messageRepository;
    private final IConversationRepository conversationRepository;
    private final IUserRepository userRepository;

    @Transactional
    public Message sendMessage(String username, ChatMessageRequest request) {
        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Conversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));
        } else if (request.getRecipientId() != null) {
            // Check if conversation exists
            User recipient = userRepository.findById(request.getRecipientId())
                    .orElseThrow(() -> new RuntimeException("Recipient not found"));

            conversation = conversationRepository.findBetweenUsers(sender.getId(), recipient.getId())
                    .orElseGet(() -> {
                        Conversation newConv = new Conversation();
                        newConv.setIsGroup(false); // 1-1 chat is not a group
                        newConv.setParticipants(new HashSet<>(Arrays.asList(sender, recipient)));
                        return conversationRepository.save(newConv);
                    });
        } else {
            throw new RuntimeException("Destination not specified");
        }

        Message message = new Message();
        message.setContent(request.getContent());
        message.setSender(sender);
        message.setConversation(conversation);

        conversation.setLastMessage(request.getContent());
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        Message savedMessage = messageRepository.save(message);

        // Force initialization of lazy collections while in transaction
        // This prevents LazyInitializationException in the controller
        savedMessage.getConversation().getParticipants().size();

        return savedMessage;
    }

    public List<Conversation> getUserConversations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return conversationRepository.findByUserId(user.getId());
    }

    public List<Message> getConversationMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Transactional
    public Conversation createGroupConversation(String username, CreateGroupRequest request) {
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty())
            throw new RuntimeException("Group name is required");
        if (request.getMemberIds() == null || request.getMemberIds().size() < 2) {
            throw new RuntimeException("Group must have at least 3 members (including you)");
        }

        Set<User> participants = new HashSet<>();
        participants.add(creator);

        for (Integer id : request.getMemberIds()) {
            User u = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found: " + id));
            participants.add(u);
        }

        Conversation conv = new Conversation();
        conv.setIsGroup(true);
        conv.setName(name);
        conv.setAvatarUrl(request.getAvatarUrl());
        conv.setCreatedBy(creator);
        conv.setParticipants(participants);

        conv.setLastMessage("Nhóm vừa được tạo");
        conv.setLastMessageAt(LocalDateTime.now());

        return conversationRepository.save(conv);
    }

    @Transactional
    public User markMessagesAsRead(String username, Long conversationId) {
        User reader = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int updatedCount = messageRepository.markAsRead(conversationId, reader.getId());
        log.info("Marked {} messages as read for conversation {}", updatedCount, conversationId);

        // Always return reader so broadcast happens (even if no new messages to mark)
        return reader;
    }

    @Transactional(readOnly = true)
    public Conversation getConversationById(Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation != null) {
            // Force initialization of participants to avoid lazy loading issues
            conversation.getParticipants().size();
        }
        return conversation;
    }

}
