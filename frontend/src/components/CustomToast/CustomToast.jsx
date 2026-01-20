import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import styles from "./CustomToast.module.css";
function CustomToast({title}) {
  return (
    <div className={styles.wrapper}>
      <FontAwesomeIcon icon={faBell} />
      <span>{title}</span>
    </div>
  );
}
export default CustomToast;
