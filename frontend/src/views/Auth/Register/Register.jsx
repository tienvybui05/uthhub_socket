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
import { register } from "../../../api/auth";
import { toast } from "react-toastify";

function Register() {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ràng buộc email @ut.edu.vn
    if (!form.email.endsWith("@ut.edu.vn")) {
      setError("Email phải có đuôi @ut.edu.vn");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    const registerData = {
      fullName: form.fullName,
      username: form.username,
      email: form.email,
      password: form.password,
      dateOfBirth: form.dateOfBirth + "T00:00:00",
    };

    try {
      setLoading(true);
      await register(registerData);
      toast.success("Đăng ký thành công!");
      // window.location.href = "/login";
    } catch (err) {
      setError(err.response?.data || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
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

          {/* USERNAME */}
          <div className={styles.inputGroup}>
            <FontAwesomeIcon icon={faUser} />
            <input
              type="text"
              name="username"
              placeholder="Mã sinh viên"
              value={form.username}
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
              placeholder="Email (@ut.edu.vn)"
              value={form.email}
              onChange={handleChange}
              required
              pattern="^[a-zA-Z0-9._%+-]+@ut\.edu\.vn$"
              title="Email phải có đuôi @ut.edu.vn"
            />
          </div>

          {/* DATE OF BIRTH */}
          <div className={styles.inputGroup}>
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
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

          <button className={styles.submit} disabled={loading}>
            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
          </button>
        </form>

        <p className={styles.back} onClick={() => window.history.back()}>
          Quay lại đăng nhập
        </p>
      </div>
    </div>
  );
}

export default Register;
