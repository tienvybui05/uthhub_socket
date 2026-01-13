import axiosInstance from "./axiosInstance";

export const getMyNotifications = () => {
  return axiosInstance.get("/notifications/getbyuserid");
};
export const getMyNotificationsAndIsReadFalse = () => {
  return axiosInstance.get("/notifications/getbyuserid-isreadfalse");
};
export const updateIsRead = (notificationId) => {
  return axiosInstance.post(`/notifications/update-is-read/${notificationId}`);
};
