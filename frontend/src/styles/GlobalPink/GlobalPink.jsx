import { useEffect } from "react";
import styles from "./GlobalPink.module.css";

function GlobalPink({ children }) {
  useEffect(() => {
    document.body.classList.add(styles.themePink);
    return () => {
      document.body.classList.remove(styles.themePink);
    };
  }, []);

  return children;
}

export default GlobalPink;
