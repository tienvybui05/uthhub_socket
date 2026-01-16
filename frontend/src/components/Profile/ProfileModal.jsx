import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faPen,
    faCamera,
    faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./ProfileModal.module.css";
import defaultAvatar from "../../assets/default_avatar.jpg";
import { getMyProfile, updateMyProfile } from "../../api/users.jsx";
import { AuthService } from "../../services/auth.service.jsx";

function pad2(n) {
    return String(n).padStart(2, "0");
}

function parseDOBParts(value) {
    if (!value) return { day: "", month: "", year: "" };
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { day: "", month: "", year: "" };
    return {
        day: String(d.getDate()),
        month: String(d.getMonth() + 1),
        year: String(d.getFullYear()),
    };
}

function formatDOB(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return `${pad2(d.getDate())} tháng ${pad2(d.getMonth() + 1)}, ${d.getFullYear()}`;
}

function buildLocalDateTimeFromParts({ day, month, year }) {
    if (!day || !month || !year) return null;
    return `${year}-${pad2(month)}-${pad2(day)}T00:00:00`;
}

function ProfileModal({ isOpen, onClose }) {
    const [mode, setMode] = useState("view"); // "view" | "edit"
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState(null);

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        avatar: "",
        dob: { day: "", month: "", year: "" },
    });

    const [initialForm, setInitialForm] = useState(null);

    const years = useMemo(() => {
        const current = new Date().getFullYear();
        const arr = [];
        for (let y = current; y >= 1950; y -= 1) arr.push(String(y));
        return arr;
    }, []);

    const days = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1)), []);
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []);

    useEffect(() => {
        if (!isOpen) return;
        setMode("view");
        loadProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const loadProfile = async () => {
        setIsLoading(true);
        setError("");
        try {
            const data = await getMyProfile();
            setProfile(data);

            const nextForm = {
                fullName: data?.fullName || "",
                email: data?.email || "",
                avatar: data?.avatar || "",
                dob: parseDOBParts(data?.dateOfBirth),
            };

            setForm(nextForm);
            setInitialForm(nextForm);
        } catch {
            setError("Không thể tải hồ sơ. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setError("");
        setMode("view");
        onClose();
    };

    const goEdit = () => {
        setError("");
        setMode("edit");
    };

    const goBackToView = () => {
        setError("");
        if (initialForm) setForm(initialForm);
        setMode("view");
    };

    const handleChange = (key) => (event) => {
        setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

    const handleDOBChange = (key) => (event) => {
        const value = event.target.value;
        setForm((prev) => ({
            ...prev,
            dob: { ...prev.dob, [key]: value },
        }));
    };

    const handleEditAvatar = () => {
        const current = form.avatar || profile?.avatar || "";
        const next = window.prompt("Nhập URL avatar mới:", current);
        if (next === null) return;
        setForm((prev) => ({ ...prev, avatar: next.trim() }));
    };

    const isChanged = useMemo(() => {
        if (!initialForm) return false;
        return (
            form.fullName !== initialForm.fullName ||
            form.email !== initialForm.email ||
            form.avatar !== initialForm.avatar ||
            form.dob.day !== initialForm.dob.day ||
            form.dob.month !== initialForm.dob.month ||
            form.dob.year !== initialForm.dob.year
        );
    }, [form, initialForm]);

    const handleSave = async () => {
        setIsSaving(true);
        setError("");
        try {
            const payload = {
                fullName: form.fullName || null,
                email: form.email || null,
                avatar: form.avatar || null,
                dateOfBirth: buildLocalDateTimeFromParts(form.dob),
            };

            const updated = await updateMyProfile(payload);
            AuthService.setUser(updated);

            const nextForm = {
                fullName: updated?.fullName || "",
                email: updated?.email || "",
                avatar: updated?.avatar || "",
                dob: parseDOBParts(updated?.dateOfBirth),
            };

            setProfile(updated);
            setForm(nextForm);
            setInitialForm(nextForm);
            setMode("view");
        } catch {
            setError("Cập nhật thất bại. Kiểm tra email hoặc thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const sliderClass =
        mode === "edit" ? `${styles.slider} ${styles.sliderEdit}` : styles.slider;

    return (
        <div
            className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
            onClick={handleClose}
        >
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                <div className={sliderClass}>
                    {/* VIEW PANEL */}
                    <div className={styles.panel}>
                        <div className={styles.header}>
                            <span className={styles.title}>Thông tin tài khoản</span>
                            <button className={styles.iconBtn} onClick={handleClose}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className={styles.content}>
                            {isLoading ? (
                                <div className={styles.loading}>
                                    <div className={styles.spinner} />
                                </div>
                            ) : (
                                <>
                                    <div className={styles.cover} />

                                    <div className={styles.profileTop}>
                                        <div className={styles.avatarWrap}>
                                            <img
                                                className={styles.avatar}
                                                src={form.avatar || profile?.avatar || defaultAvatar}
                                                alt="avatar"
                                            />
                                            <button
                                                className={styles.avatarEditBtn}
                                                onClick={handleEditAvatar}
                                                title="Đổi avatar"
                                            >
                                                <FontAwesomeIcon icon={faCamera} />
                                            </button>
                                        </div>

                                        <div className={styles.nameRow}>
                                            <div className={styles.name}>{profile?.fullName || "-"}</div>
                                            <button className={styles.iconBtnSmall} onClick={goEdit}>
                                                <FontAwesomeIcon icon={faPen} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.section}>
                                        <div className={styles.sectionTitle}>Thông tin cá nhân</div>

                                        <div className={styles.infoRow}>
                                            <div className={styles.infoLabel}>Email</div>
                                            <div className={styles.infoValue}>{profile?.email || "-"}</div>
                                        </div>

                                        <div className={styles.infoRow}>
                                            <div className={styles.infoLabel}>Ngày sinh</div>
                                            <div className={styles.infoValue}>
                                                {formatDOB(profile?.dateOfBirth)}
                                            </div>
                                        </div>

                                        <div className={styles.infoRow}>
                                            <div className={styles.infoLabel}>Tài khoản</div>
                                            <div className={styles.infoValue}>{profile?.username || "-"}</div>
                                        </div>

                                        {error ? <div className={styles.error}>{error}</div> : null}
                                    </div>

                                    <button className={styles.updateBtn} onClick={goEdit}>
                                        <FontAwesomeIcon icon={faPen} />
                                        <span>Cập nhật</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* EDIT PANEL */}
                    <div className={styles.panel}>
                        <div className={styles.header}>
                            <button className={styles.iconBtn} onClick={goBackToView}>
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                            <span className={styles.title}>Cập nhật thông tin cá nhân</span>
                            <button className={styles.iconBtn} onClick={handleClose}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className={styles.contentEdit}>
                            <div className={styles.form}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Tên hiển thị</label>
                                    <input
                                        className={styles.input}
                                        value={form.fullName}
                                        onChange={handleChange("fullName")}
                                        placeholder="Nhập tên hiển thị"
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Email</label>
                                    <input
                                        className={styles.input}
                                        value={form.email}
                                        onChange={handleChange("email")}
                                        placeholder="Nhập email"
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Ngày sinh</label>
                                    <div className={styles.dobRow}>
                                        <select
                                            className={styles.select}
                                            value={form.dob.day}
                                            onChange={handleDOBChange("day")}
                                        >
                                            <option value="">DD</option>
                                            {days.map((d) => (
                                                <option key={d} value={d}>
                                                    {pad2(d)}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            className={styles.select}
                                            value={form.dob.month}
                                            onChange={handleDOBChange("month")}
                                        >
                                            <option value="">MM</option>
                                            {months.map((m) => (
                                                <option key={m} value={m}>
                                                    {pad2(m)}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            className={styles.select}
                                            value={form.dob.year}
                                            onChange={handleDOBChange("year")}
                                        >
                                            <option value="">YYYY</option>
                                            {years.map((y) => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {error ? <div className={styles.error}>{error}</div> : null}
                            </div>

                            <div className={styles.footer}>
                                <button className={styles.cancelBtn} onClick={goBackToView}>
                                    Hủy
                                </button>
                                <button
                                    className={styles.saveBtn}
                                    onClick={handleSave}
                                    disabled={!isChanged || isSaving}
                                >
                                    {isSaving ? "Đang lưu..." : "Cập nhật"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* end slider */}
            </div>
        </div>
    );
}

export default ProfileModal;
