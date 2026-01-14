import axiosInstance from "./axiosInstance";

// GET /api/users/search?username=xxx
export const searchUserByUsername = (username) => {
  return axiosInstance.get(`/users/search`, {
    params: { username },
  });
};