import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import bg from "../../../assets/background_uth.jpg";
import logo from "../../../assets/logo_full.png";
import { login } from "../../../api/auth.jsx";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await login(form); // 👉 gọi backend /auth/login
      window.location.href = "/messages"; // 👉 login thành công → vào trang protected
    } catch (err) {
      setError("Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.loginBox}>
        <img src={logo} alt="UTH Logo" className={styles.logo} />

        <h2 className={styles.title}>ĐĂNG NHẬP HỆ THỐNG</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* USERNAME */}
          <div className={styles.inputGroup}>
            <FontAwesomeIcon icon={faUser} />
            <input
              type="text"
              name="username"
              placeholder="Tài khoản đăng nhập"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className={styles.inputGroup}>
            <FontAwesomeIcon icon={faLock} />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mật khẩu"
              value={form.password}
              onChange={handleChange}
              required
            />

            <span
              className={styles.eye}
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submit} disabled={loading}>
            {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
          </button>

          <button
            type="button"
            className={styles.registerBtn}
            onClick={() => navigate("/register")}
          >
            ĐĂNG KÝ
          </button>
        </form>

        <p className={styles.forgot}>Quên mật khẩu?</p>
      </div>
    </div>
  );
}

export default Login;
