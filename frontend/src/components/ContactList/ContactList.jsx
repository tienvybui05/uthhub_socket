import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CONTACTS_MENU } from "../../constants/contactsMenu";
import { useChat } from "../../contexts/ChatContext";
import ContactItem from "./ContactItem/ContactItem";
import styles from "./ContactList.module.css";
function ContactList() {
  const { selected, setSelected } = useChat();
  return (
    <div className={styles.wrapper}>
      {CONTACTS_MENU.map((item) => (
        <ContactItem
          key={item.id}
          label={item.label}
          icon={<FontAwesomeIcon icon={item.icon} />}
          active={selected === item.id}
          onClick={() => {
            setSelected(item.id);
          }}
        />
      ))}
    </div>
  );
}
export default ContactList;
