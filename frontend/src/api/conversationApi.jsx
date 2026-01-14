import axiosInstance from "./axiosInstance";

const conversationApi = {
    getConversations: () => {
        return axiosInstance.get("/conversations");
    },
    getMessages: (conversationId) => {
        return axiosInstance.get(`/conversations/${conversationId}/messages`);
    },
};

export default conversationApi;
