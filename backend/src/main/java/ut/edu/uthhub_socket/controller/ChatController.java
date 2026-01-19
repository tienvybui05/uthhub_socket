package ut.edu.uthhub_socket.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import ut.edu.uthhub_socket.dto.request.ChatMessageRequest;
import ut.edu.uthhub_socket.dto.request.ReadReceiptRequest;
import ut.edu.uthhub_socket.dto.request.TypingRequest;
import ut.edu.uthhub_socket.dto.response.ConversationResponse;
import ut.edu.uthhub_socket.dto.response.MessageResponse;
import ut.edu.uthhub_socket.dto.response.ReadReceiptResponse;
import ut.edu.uthhub_socket.dto.response.TypingResponse;
import ut.edu.uthhub_socket.model.Conversation;
import ut.edu.uthhub_socket.model.Message;
import ut.edu.uthhub_socket.model.StyleNotifications;
import ut.edu.uthhub_socket.model.User;
import ut.edu.uthhub_socket.repository.IUserRepository;
import ut.edu.uthhub_socket.security.UserDetailsImpl;
import ut.edu.uthhub_socket.service.INotificationsService;
import ut.edu.uthhub_socket.service.MessageService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import ut.edu.uthhub_socket.dto.request.CreateGroupRequest;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final IUserRepository userRepository;
    private final INotificationsService notificationsService;
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request, Authentication authentication) {
        log.info("=== RECEIVED MESSAGE ===");
        log.info("Request: conversationId={}, recipientId={}, content={}",
                request.getConversationId(), request.getRecipientId(), request.getContent());
        log.info("Authentication: {}", authentication);
        log.info("Username: {}", authentication != null ? authentication.getName() : "NULL");

        try {
            Message savedMessage = messageService.sendMessage(authentication.getName(), request);
            log.info("Message saved with ID: {}", savedMessage.getId());

            MessageResponse response = new MessageResponse(savedMessage);
            log.info("MessageResponse created: {}", response);

            // Broadcast to conversation topic so all participants receive the message
            String topic = "/topic/conversation/" + savedMessage.getConversation().getId();
            log.info("Broadcasting to topic: {}", topic);
            messagingTemplate.convertAndSend(topic, response);

            // Also send to specific users (important for new conversations where they might
            // not be subscribed to topic yet)
            savedMessage.getConversation().getParticipants().forEach(participant -> {
                log.info("Sending to user queue: {}", participant.getUsername());
                messagingTemplate.convertAndSendToUser(
                        participant.getUsername(),
                        "/queue/messages",
                        response);
            });

            log.info("=== MESSAGE SENT SUCCESSFULLY ===");
        } catch (Exception e) {
            log.error("=== ERROR SENDING MESSAGE ===");
            log.error("Error: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/chat.typing")
    public void userTyping(@Payload TypingRequest request, Authentication authentication) {
        log.info("=== TYPING EVENT ===");
        log.info("ConversationId: {}, isTyping: {}, User: {}",
                request.getConversationId(), request.isTyping(), authentication.getName());

        try {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            TypingResponse response = new TypingResponse(
                    request.getConversationId(),
                    user.getId(),
                    user.getUsername(),
                    user.getFullName(),
                    request.isTyping());

            // Broadcast typing status to conversation topic
            String topic = "/topic/conversation/" + request.getConversationId() + "/typing";
            log.info("Broadcasting typing status to: {}", topic);
            messagingTemplate.convertAndSend(topic, response);

        } catch (Exception e) {
            log.error("Error broadcasting typing status: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/chat.markRead")
    public void markAsRead(@Payload ReadReceiptRequest request, Authentication authentication) {
        log.info("=== MARK AS READ ===");
        log.info("ConversationId: {}, User: {}", request.getConversationId(), authentication.getName());

        try {
            User reader = messageService.markMessagesAsRead(authentication.getName(), request.getConversationId());

            if (reader != null) {
                ReadReceiptResponse response = new ReadReceiptResponse(
                        request.getConversationId(),
                        reader.getId(),
                        reader.getFullName(),
                        reader.getAvatar());

                // Broadcast to conversation /read topic
                String readTopic = "/topic/conversation/" + request.getConversationId() + "/read";
                log.info("Broadcasting to: {}", readTopic);
                messagingTemplate.convertAndSend(readTopic, response);

                // Also broadcast to the main conversation topic (which we know works)
                String mainTopic = "/topic/conversation/" + request.getConversationId();
                log.info("Also broadcasting to main topic: {}", mainTopic);
                messagingTemplate.convertAndSend(mainTopic, response);
            }
        } catch (Exception e) {
            log.error("Error marking messages as read: {}", e.getMessage(), e);
        }
    }

    @GetMapping("/api/conversations")
    @ResponseBody
    public ResponseEntity<List<ConversationResponse>> getConversations(Authentication authentication) {
        try {
            List<Conversation> conversations = messageService.getUserConversations(authentication.getName());
            List<ConversationResponse> response = conversations.stream()
                    .map(ConversationResponse::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching conversations for user {}: {}",
                    authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/api/conversations/{id}/messages")
    @ResponseBody
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable Long id) {
        try {
            List<Message> messages = messageService.getConversationMessages(id);
            List<MessageResponse> response = messages.stream()
                    .map(MessageResponse::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching messages for conversation {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/api/conversations/groups")
    @ResponseBody
    public ResponseEntity<ConversationResponse> createGroup(
            @RequestBody CreateGroupRequest request,
            Authentication authentication) {
        UserDetailsImpl user = (UserDetailsImpl) authentication.getPrincipal();
        Conversation conv = messageService.createGroupConversation(authentication.getName(), request);
        notificationsService.createGroupNotification(user.getId(),request.getMemberIds(), request.getName(),StyleNotifications.CREATEGROUP);
        return ResponseEntity.ok(new ConversationResponse(conv));
    }

}
