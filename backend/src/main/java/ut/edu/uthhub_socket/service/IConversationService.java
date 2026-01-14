package ut.edu.uthhub_socket.service;

import java.util.List;

import ut.edu.uthhub_socket.dto.response.ConversationResponse;
import ut.edu.uthhub_socket.dto.response.MessageResponse;
import ut.edu.uthhub_socket.model.Conversation;

public interface IConversationService {
    List<ConversationResponse> getConversations(Integer meId);

    ConversationResponse getOrCreateConversation(Integer meId, Integer friendId);

    Conversation getConversationById(Long conversationId);

    List<MessageResponse> getcontentConversation(Integer meId, Long conversationId);

}
