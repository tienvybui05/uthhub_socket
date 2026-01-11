import styles from "./Avatar.module.css";
import default_avatar from "../../assets/default_avatar.jpg";
function Avatar() {
  return (
    <div className={styles.wrapper}>
      <img src={default_avatar} alt="avater" />
    </div>
  );
}
export default Avatar;
