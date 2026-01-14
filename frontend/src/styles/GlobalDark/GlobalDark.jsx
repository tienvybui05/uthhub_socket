import { useEffect } from "react";
import styles from "./GlobalDark.module.css";
import "./font.css";

function GlobalDark({ children }) {
  useEffect(() => {
    document.body.classList.add(styles.themeDark);
    return () => {
      document.body.classList.remove(styles.themeDark);
    };
  }, []);

  return children;
}

export default GlobalDark;
