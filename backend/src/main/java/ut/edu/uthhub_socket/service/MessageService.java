package ut.edu.uthhub_socket.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ut.edu.uthhub_socket.dto.request.ChatMessageRequest;
import ut.edu.uthhub_socket.model.Conversation;
import ut.edu.uthhub_socket.model.Message;
import ut.edu.uthhub_socket.model.User;
import ut.edu.uthhub_socket.repository.IConversationRepository;
import ut.edu.uthhub_socket.repository.IUserRepository;
import ut.edu.uthhub_socket.repository.IMessageRepository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;

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

        return messageRepository.save(message);
    }

    public List<Conversation> getUserConversations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return conversationRepository.findByUserId(user.getId());
    }

    public List<Message> getConversationMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }
}
