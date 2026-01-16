// ProfileModal.jsx
import { useEffect, useMemo, useState } from "react";
import styles from "./ProfileModal.module.css";
import { getMyProfile, updateMyProfile } from "../../api/users.jsx";
import { AuthService } from "../../services/auth.service.jsx";
import ProfileView from "./components/ProfileView";
import ProfileEdit from "./components/ProfileEdit";
import AvatarEditorModal from "./avatar/AvatarEditorModal";

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

function buildLocalDateTimeFromParts({ day, month, year }) {
    if (!day || !month || !year) return null;
    return `${year}-${pad2(month)}-${pad2(day)}T00:00:00`;
}

function ProfileModal({ isOpen, onClose }) {
    const [mode, setMode] = useState("view");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState(null);

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        avatar: "",
        gender: "",
        dob: { day: "", month: "", year: "" },
    });

    const [initialForm, setInitialForm] = useState(null);
    const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);

    const years = useMemo(() => {
        const current = new Date().getFullYear();
        const arr = [];
        for (let y = current; y >= 1950; y -= 1) arr.push(String(y));
        return arr;
    }, []);

    const days = useMemo(
        () => Array.from({ length: 31 }, (_, i) => String(i + 1)),
        []
    );
    const months = useMemo(
        () => Array.from({ length: 12 }, (_, i) => String(i + 1)),
        []
    );

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
                gender: data?.gender || "",
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

    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const setDOBPart = (key, value) => {
        setForm((prev) => ({ ...prev, dob: { ...prev.dob, [key]: value } }));
    };

    const isChanged = useMemo(() => {
        if (!initialForm) return false;
        return (
            form.fullName !== initialForm.fullName ||
            form.email !== initialForm.email ||
            form.avatar !== initialForm.avatar ||
            form.gender !== initialForm.gender ||
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
                avatar: form.avatar ? form.avatar : null,
                gender: form.gender || null,
                dateOfBirth: buildLocalDateTimeFromParts(form.dob),
            };

            const updated = await updateMyProfile(payload);
            AuthService.setUser(updated);
            window.dispatchEvent(new Event("user_updated"));

            const nextForm = {
                fullName: updated?.fullName || "",
                email: updated?.email || "",
                avatar: updated?.avatar || "",
                gender: updated?.gender || "",
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

    const saveAvatarOnly = async (avatarValue) => {
        setIsSaving(true);
        setError("");
        try {
            const updated = await updateMyProfile({
                avatar: avatarValue ? avatarValue : null,
            });

            AuthService.setUser(updated);
            window.dispatchEvent(new Event("user_updated"));

            const nextForm = {
                fullName: updated?.fullName || "",
                email: updated?.email || "",
                avatar: updated?.avatar || "",
                gender: updated?.gender || "",
                dob: parseDOBParts(updated?.dateOfBirth),
            };

            setProfile(updated);
            setForm(nextForm);
            setInitialForm(nextForm);
        } catch {
            setError("Cập nhật ảnh thất bại. Thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    const sliderClass =
        mode === "edit" ? `${styles.slider} ${styles.sliderEdit}` : styles.slider;

    if (!isOpen) return null;

    return (
        <div
            className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
            onClick={handleClose}
        >
            <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                <div className={sliderClass}>
                    <ProfileView
                        styles={styles}
                        isLoading={isLoading}
                        error={error}
                        profile={profile}
                        avatarValue={form.avatar}
                        onClose={handleClose}
                        onEdit={goEdit}
                        onEditAvatar={() => setIsAvatarEditorOpen(true)}
                        isSaving={isSaving}
                    />

                    <ProfileEdit
                        styles={styles}
                        error={error}
                        isSaving={isSaving}
                        isChanged={isChanged}
                        years={years}
                        days={days}
                        months={months}
                        form={form}
                        onClose={handleClose}
                        onBack={goBackToView}
                        onChangeField={setField}
                        onChangeDOB={setDOBPart}
                        onSave={handleSave}
                    />
                </div>

                <AvatarEditorModal
                    styles={styles}
                    isOpen={isAvatarEditorOpen}
                    onClose={() => setIsAvatarEditorOpen(false)}
                    onApply={saveAvatarOnly}
                    initialSrc={form.avatar || profile?.avatar || ""}
                />
            </div>
        </div>
    );
}

export default ProfileModal;
