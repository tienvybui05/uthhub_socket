import axiosInstance from "./axiosInstance";

// GET /api/users/search?username=xxx
export const searchUserByUsername = (username) => {
  return axiosInstance.get(`/users/search`, {
    params: { username },
  });
};

// GET /api/users/me
export const getMyProfile = () => {
    return axiosInstance.get(`/users/me`);
};

// PUT /api/users/me
export const updateMyProfile = (payload) => {
    return axiosInstance.put(`/users/me`, payload);
};