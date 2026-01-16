import styles from "./Avatar.module.css";
import default_avatar from "../../assets/default_avatar.jpg";
import { AuthService } from "../../services/auth.service";

function Avatar({ src, alt = "avatar", onClick }) {
    const user = AuthService.getUser();
    const imgSrc = src || user?.avatar || default_avatar;

    return (
        <div className={styles.wrapper} onClick={onClick}>
            <img src={imgSrc} alt={alt} />
        </div>
    );
}

export default Avatar;
