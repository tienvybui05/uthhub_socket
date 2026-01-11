import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faAddressBook } from "@fortawesome/free-regular-svg-icons";
import {
  faGear,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import Avatar from "../../../components/Avatar/Avatar";
import NavButton from "../../../components/NavButton/NavButton";
import styles from "./SideNavigation.module.css";
import { useChat } from "../../../contexts/ChatContext";
import { CHAT_TABS } from "../../../constants/contactsMenu";

function SideNavigation() {
  const { leftTab, setLeftTab } = useChat();

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
        <NavButton>
          <FontAwesomeIcon icon={faGear} />
        </NavButton>
        <NavButton>
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </NavButton>
      </div>
    </div>
  );
}
export default SideNavigation;
