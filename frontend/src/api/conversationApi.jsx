import axiosInstance from "./axiosInstance";

const conversationApi = {
    getConversations: async () => axiosInstance.get("/conversations"),
    getMessages: async (conversationId) => axiosInstance.get(`/conversations/${conversationId}/messages`),

    createGroup: async (payload) => axiosInstance.post("/conversations/groups", payload),
};

export default conversationApi;
