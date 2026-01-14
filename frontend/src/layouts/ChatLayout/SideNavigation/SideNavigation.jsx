import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faAddressBook,
  faBell,
} from "@fortawesome/free-regular-svg-icons";
import {
  faGear,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import Avatar from "../../../components/Avatar/Avatar";
import NavButton from "../../../components/NavButton/NavButton";
import styles from "./SideNavigation.module.css";
import { useChat } from "../../../contexts/ChatContext";
import { CHAT_TABS } from "../../../constants/contactsMenu";
import { AuthService } from "../../../services/auth.service";
import { logout } from "../../../api/auth";
import { useState } from "react";
import { createPortal } from "react-dom";
import Notifications from "../../../components/Notifications/Notifications";
import Settings from "../../../components/Settings/Settings";

function SideNavigation() {
  const { leftTab, setLeftTab } = useChat();
  const [isShowNotifications, setIsShowNotifications] = useState(false);
  const [isShowSetting, setIsShowSetting] = useState(false);
  const navigate = useNavigate();
  const hanldLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const handleShowNotifications = () => {
    setIsShowNotifications((prev) => !prev);
  };
  const hanldeShowSetting = () => {
    setIsShowSetting((prev) => !prev);
  };
  const modal = isShowNotifications
    ? createPortal(
        <div>
          <Notifications onClick={handleShowNotifications} />
        </div>,
        document.body
      )
    : null;
  const modalSetting = isShowSetting
    ? createPortal(<Settings onClick={hanldeShowSetting} />, document.body)
    : null;
  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        <Avatar />
        <NavButton
          onClick={() => setLeftTab(CHAT_TABS.MESSAGES)}
          active={leftTab === CHAT_TABS.MESSAGES}
        >
          <FontAwesomeIcon icon={faMessage} />
        </NavButton>
        <NavButton
          onClick={() => setLeftTab(CHAT_TABS.CONTACTS)}
          active={leftTab === CHAT_TABS.CONTACTS}
        >
          <FontAwesomeIcon icon={faAddressBook} />
        </NavButton>
      </div>
      <div className={styles.bottom}>
        <NavButton onClick={handleShowNotifications}>
          <FontAwesomeIcon icon={faBell} />
        </NavButton>
        {modal}
        <NavButton onClick={hanldeShowSetting}>
          <FontAwesomeIcon icon={faGear} />
        </NavButton>
        {modalSetting}
        <NavButton onClick={hanldLogout}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </NavButton>
      </div>
    </div>
  );
}
export default SideNavigation;
