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
import ut.edu.uthhub_socket.dto.response.ConversationResponse;
import ut.edu.uthhub_socket.dto.response.MessageResponse;
import ut.edu.uthhub_socket.model.Conversation;
import ut.edu.uthhub_socket.model.Message;
import ut.edu.uthhub_socket.service.MessageService;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

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
}
