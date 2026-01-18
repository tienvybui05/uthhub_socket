import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faSearch,
    faCamera,
    faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useChat } from "../../contexts/ChatContext";
import defaultAvatar from "../../assets/default_avatar.jpg";
import styles from "./CreateGroupModal.module.css";
import { getMyFriends } from "../../api/friends";
import conversationApi from "../../api/conversationApi";


function CreateGroupModal({ isOpen, onClose }) {
    const [groupName, setGroupName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const { selectConversation, loadConversations } = useChat();

    // Load users on mount/open
    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    // Filter users based on search query
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = users.filter(
                (user) =>
                    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const loadUsers = async () => {
        try {
            const res = await getMyFriends();
            const list = res?.data ?? res ?? [];

            // list là FriendResponse[]: { userId, fullName, avatar, username, ... }
            const mapped = list
                .filter((x) => (x?.status ?? "").toUpperCase() === "ACCEPTED")
                .map((f) => ({
                    id: f.userId,
                    fullName: f.fullName,
                    email: f.username || "",     // UI đang hiển thị "email", mình gán username vào
                    avatarUrl: f.avatar || null,
                }));

            setUsers(mapped);
        } catch (error) {
            console.error("Error loading friends:", error);
            setUsers([]);
        }
    };


    const toggleMember = (user) => {
        if (selectedMembers.find((m) => m.id === user.id)) {
            setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
        } else {
            setSelectedMembers([...selectedMembers, user]);
        }
    };

    const removeMember = (userId) => {
        setSelectedMembers(selectedMembers.filter((m) => m.id !== userId));
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length < 2) return;

        try {
            const payload = {
                name: groupName.trim(),
                memberIds: selectedMembers.map((m) => m.id),
                avatarUrl: null,
            };

            const created = await conversationApi.createGroup(payload);

            await loadConversations();
            selectConversation(created);
            handleClose();
        } catch (e) {
            console.error("Create group failed:", e);
        }
    };

    const handleClose = () => {
        onClose();
        setGroupName("");
        setSearchQuery("");
        setSelectedMembers([]);
    };

    // Get initials for avatar preview
    const getInitials = (name) => {
        if (!name) return "N";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const isValid = groupName.trim() && selectedMembers.length >= 2;

    return (
        <div
            className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
            onClick={handleClose}
        >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.title}>Tạo nhóm mới</span>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Group Info Section */}
                    <div className={styles.groupInfoSection}>
                        {/* Avatar Upload */}
                        <div className={styles.avatarUpload}>
                            <div className={styles.avatarPreview}>
                                {getInitials(groupName)}
                                <div className={styles.cameraIcon}>
                                    <FontAwesomeIcon icon={faCamera} />
                                </div>
                            </div>
                            <span className={styles.avatarHint}>Nhấn để thay đổi ảnh nhóm</span>
                        </div>

                        {/* Group Name Input */}
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Tên nhóm *</label>
                            <input
                                type="text"
                                className={styles.textInput}
                                placeholder="Nhập tên nhóm..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Member Selection */}
                    <div className={styles.memberSection}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionTitle}>Thêm thành viên</span>
                            <span className={styles.memberCount}>
                Đã chọn: {selectedMembers.length}/∞
              </span>
                        </div>

                        {/* Search Box */}
                        <div className={styles.searchBox}>
                            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Tìm kiếm bạn bè..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Selected Members */}
                        {selectedMembers.length > 0 && (
                            <div className={styles.selectedMembers}>
                                {selectedMembers.map((member) => (
                                    <div key={member.id} className={styles.selectedMember}>
                                        <img
                                            src={member.avatarUrl || defaultAvatar}
                                            alt={member.fullName}
                                            className={styles.selectedMemberAvatar}
                                        />
                                        <span>{member.fullName.split(" ").pop()}</span>
                                        <button
                                            className={styles.removeMemberBtn}
                                            onClick={() => removeMember(member.id)}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* User List */}
                        <div className={styles.userList}>
                            {filteredUsers.map((user) => {
                                const isSelected = selectedMembers.find((m) => m.id === user.id);
                                return (
                                    <div
                                        key={user.id}
                                        className={`${styles.userItem} ${
                                            isSelected ? styles.userItemSelected : ""
                                        }`}
                                        onClick={() => toggleMember(user)}
                                    >
                                        <div
                                            className={`${styles.checkbox} ${
                                                isSelected ? styles.checkboxChecked : ""
                                            }`}
                                        >
                                            {isSelected && <FontAwesomeIcon icon={faCheck} />}
                                        </div>
                                        <img
                                            src={user.avatarUrl || defaultAvatar}
                                            alt={user.fullName}
                                            className={styles.userAvatar}
                                        />
                                        <div className={styles.userInfo}>
                                            <div className={styles.userName}>{user.fullName}</div>
                                            <div className={styles.userEmail}>{user.email}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={handleClose}>
                        Hủy
                    </button>
                    <button
                        className={styles.createBtn}
                        onClick={handleCreateGroup}
                        disabled={!isValid}
                    >
                        Tạo nhóm {selectedMembers.length >= 2 && `(${selectedMembers.length + 1})`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateGroupModal;
