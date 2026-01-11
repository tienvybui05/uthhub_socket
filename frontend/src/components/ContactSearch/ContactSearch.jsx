import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import styles from "./ContactSearch.module.css";
function ContactSearch() {
  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        placeholder="Tìm kiếm bạn bè"
        className={styles.findFriend}
      />

      <button className={styles.wrapperButton}>
        <FontAwesomeIcon icon={faUserPlus} className={styles.add} />
      </button>
      <button className={styles.wrapperButton}>
        <FontAwesomeIcon icon={faUserGroup} className={styles.add} />
      </button>
    </div>
  );
}
export default ContactSearch;
