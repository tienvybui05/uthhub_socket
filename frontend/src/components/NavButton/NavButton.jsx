import styles from "./NavButton.module.css";

function NavButton({ onClick, active, children }) {
  return (
    <button
      className={`${styles.wrapper} ${active ? styles.active : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export default NavButton;
