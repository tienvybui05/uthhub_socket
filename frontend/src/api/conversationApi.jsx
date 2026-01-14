import axiosInstance from "./axiosInstance";

const conversationApi = {
    getConversations: async () => {
        return axiosInstance.get("/conversations");
    },
    getMessages: async (conversationId) => {
        return axiosInstance.get(`/conversations/${conversationId}/messages`);
    },
};

export default conversationApi;
