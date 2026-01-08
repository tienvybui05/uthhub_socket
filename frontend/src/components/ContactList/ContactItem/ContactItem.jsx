import styles from "./ContactItem.module.css";

function ContactItem({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.wrapper} ${active ? styles.active : ""}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
export default ContactItem;
