import { useEffect } from "react";
import styles from "./GlobalDefautl.module.css";
import "./font.css";

function GlobalDefautl({ children }) {
  useEffect(() => {
    document.body.classList.add(styles.themeDefault);
    return () => {
      document.body.classList.remove(styles.themeDefault);
    };
  }, []);

  return children;
}

export default GlobalDefautl;
