import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import styles from "./ContactSearch.module.css";
import { useState } from "react";
import { createPortal } from "react-dom";
import AddFriend from "../AddFriend/AddFriend"; // đường dẫn tùy bạn đặt

function ContactSearch() {
  const [isShowAddFriend, setIsShowAddFriend] = useState(false);

  const handleShowAddFriend = () => setIsShowAddFriend((prev) => !prev);

  const modal = isShowAddFriend
    ? createPortal(
      <AddFriend onClose={handleShowAddFriend} />,
      document.body
    )
    : null;

  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        placeholder="Tìm kiếm bạn bè"
        className={styles.findFriend}
      />

      <button className={styles.wrapperButton} onClick={handleShowAddFriend}>
        <FontAwesomeIcon icon={faUserPlus} className={styles.add} />
      </button>

      <button className={styles.wrapperButton}>
        <FontAwesomeIcon icon={faUserGroup} className={styles.add} />
      </button>

      {modal}
    </div>
  );
}
export default ContactSearch;