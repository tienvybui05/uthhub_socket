import {
  faUser,
  faUsers,
  faUserPlus,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";

export const CHAT_TABS = {
  MESSAGES: "MESSAGES",
  CONTACTS: "CONTACTS",
};
export const CONTACTS_TAB = {
  MY_FRIENDS: "MY_FRIENDS",
  GROUPS: "GROUPS",
  FRIEND_REQUESTS: "FRIEND_REQUESTS",
  GROUP_INVITES: "GROUP_INVITES",
};

export const CONTACTS_MENU = [
  {
    id: CONTACTS_TAB.MY_FRIENDS,
    label: "Danh sách bạn bè",
    icon: faUser,
  },
  {
    id: CONTACTS_TAB.GROUPS,
    label: "Danh sách nhóm và cộng đồng",
    icon: faUsers,
  },
  {
    id: CONTACTS_TAB.FRIEND_REQUESTS,
    label: "Lời mời kết bạn",
    icon: faUserPlus,
  },
  {
    id: CONTACTS_TAB.GROUP_INVITES,
    label: "Lời mời vào nhóm và cộng đồng",
    icon: faUserGroup,
  },
];
export const CHAT_BACKGROUND = {
  DEFAULT: "default",
  DARK: "dark",
  LIGHT: "light",
  PINK: "pink",
};
