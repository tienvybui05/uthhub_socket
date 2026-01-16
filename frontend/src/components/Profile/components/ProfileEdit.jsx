import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

function pad2(n) {
    return String(n).padStart(2, "0");
}

function ProfileEdit({
                         styles,
                         error,
                         isSaving,
                         isChanged,
                         years,
                         days,
                         months,
                         form,
                         onClose,
                         onBack,
                         onChangeField,
                         onChangeDOB,
                         onSave,
                     }) {
    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <button className={styles.iconBtn} onClick={onBack}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <span className={styles.title}>Cập nhật thông tin cá nhân</span>
                <button className={styles.iconBtn} onClick={onClose}>
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
                            onChange={(e) => onChangeField("fullName", e.target.value)}
                            placeholder="Nhập tên hiển thị"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Thông tin cá nhân</label>

                        <div className={styles.genderRow}>
                            <label className={styles.genderItem}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="MALE"
                                    checked={form.gender === "MALE"}
                                    onChange={(e) => onChangeField("gender", e.target.value)}
                                />
                                <span>Nam</span>
                            </label>

                            <label className={styles.genderItem}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="FEMALE"
                                    checked={form.gender === "FEMALE"}
                                    onChange={(e) => onChangeField("gender", e.target.value)}
                                />
                                <span>Nữ</span>
                            </label>

                            <label className={styles.genderItem}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value="OTHER"
                                    checked={form.gender === "OTHER"}
                                    onChange={(e) => onChangeField("gender", e.target.value)}
                                />
                                <span>Khác</span>
                            </label>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Ngày sinh</label>
                        <div className={styles.dobRow}>
                            <select
                                className={styles.select}
                                value={form.dob.day}
                                onChange={(e) => onChangeDOB("day", e.target.value)}
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
                                onChange={(e) => onChangeDOB("month", e.target.value)}
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
                                onChange={(e) => onChangeDOB("year", e.target.value)}
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

                    <div className={styles.field}>
                        <label className={styles.label}>Email</label>
                        <input
                            className={styles.input}
                            value={form.email}
                            onChange={(e) => onChangeField("email", e.target.value)}
                            placeholder="Nhập email"
                        />
                    </div>

                    {error ? <div className={styles.error}>{error}</div> : null}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onBack}>
                        Hủy
                    </button>
                    <button
                        className={styles.saveBtn}
                        onClick={onSave}
                        disabled={!isChanged || isSaving}
                    >
                        {isSaving ? "Đang lưu..." : "Cập nhật"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProfileEdit;
