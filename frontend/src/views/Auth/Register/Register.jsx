import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./Register.module.css";

import bg from "../../../assets/background_uth.jpg";
import logo from "../../../assets/logo_full.png";

function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    console.log("Register data:", form);
    alert("Demo đăng ký – chưa kết nối backend");
  };

  return (
    <div
      className={styles.wrapper}
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className={styles.registerBox}>
        <img src={logo} alt="UTH Logo" className={styles.logo} />

        <h2 className={styles.title}>ĐĂNG KÝ TÀI KHOẢN</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* FULL NAME */}
          <div className={styles.inputGroup}>
            <FontAwesomeIcon icon={faUser} />
            <input
              type="text"
              name="fullName"
              placeholder="Họ và tên"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* EMAIL */}
          <div className={styles.inputGroup}>
            <FontAwesomeIcon icon={faEnvelope} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
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

          {/* CONFIRM PASSWORD */}
          <div className={styles.inputGroup}>
            <FontAwesomeIcon icon={faLock} />
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <span
              className={styles.eye}
              onClick={() => setShowConfirm(!showConfirm)}
            >
              <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
            </span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submit}>ĐĂNG KÝ</button>
        </form>

        <p className={styles.back} onClick={() => window.history.back()}>
          Quay lại đăng nhập
        </p>
      </div>
    </div>
  );
}

export default Register;