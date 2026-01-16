// AvatarEditorModal.jsx
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

function AvatarEditorModal({ styles, isOpen, onClose, onApply, initialSrc }) {
    const canvasRef = useRef(null);
    const fileRef = useRef(null);

    const [imgSrc, setImgSrc] = useState(initialSrc || "");
    const [imgObj, setImgObj] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!isOpen) return;
        setImgSrc(initialSrc || "");
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setImgObj(null);
    }, [isOpen, initialSrc]);

    useEffect(() => {
        if (!imgSrc) {
            setImgObj(null);
            redraw(null, zoom, offset);
            return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImgObj(img);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
            redraw(img, 1, { x: 0, y: 0 });
        };
        img.src = imgSrc;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imgSrc]);

    useEffect(() => {
        redraw(imgObj, zoom, offset);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom, offset, imgObj]);

    const redraw = (img, z, off) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const size = canvas.width;

        ctx.clearRect(0, 0, size, size);

        ctx.fillStyle = "#f2f3f5";
        ctx.fillRect(0, 0, size, size);

        if (!img) {
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Chọn ảnh để cập nhật", size / 2, size / 2);
            return;
        }

        const cx = size / 2;
        const cy = size / 2;

        const iw = img.width;
        const ih = img.height;

        const baseScale = Math.max(size / iw, size / ih);
        const scale = baseScale * z;

        const drawW = iw * scale;
        const drawH = ih * scale;

        const x = cx - drawW / 2 + off.x;
        const y = cy - drawH / 2 + off.y;

        ctx.drawImage(img, x, y, drawW, drawH);

        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.rect(0, 0, size, size);
        ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2, true);
        ctx.fill("evenodd");
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    };

    const openFilePicker = () => fileRef.current?.click();

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImgSrc(String(reader.result || ""));
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const onPointerDown = (e) => {
        if (!imgObj) return;
        setDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setOffsetStart(offset);
    };

    const onPointerMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setOffset({ x: offsetStart.x + dx, y: offsetStart.y + dy });
    };

    const onPointerUp = () => setDragging(false);

    const handleApply = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imgObj) {
            onClose();
            return;
        }
        redraw(imgObj, zoom, offset);
        const out = canvas.toDataURL("image/jpeg", 0.9);
        onApply(out);
        onClose();
    };

    const handleRemove = () => {
        onApply("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.editorOverlay} onClick={onClose}>
            <div className={styles.editorModal} onClick={(ev) => ev.stopPropagation()}>
                <div className={styles.editorHeader}>
                    <span className={styles.editorTitle}>Cập nhật ảnh đại diện</span>
                    <button className={styles.iconBtn} onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className={styles.editorBody}>
                    <div className={styles.canvasWrap}>
                        <canvas
                            ref={canvasRef}
                            width={360}
                            height={360}
                            className={styles.canvas}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                            style={{ touchAction: "none" }}
                        />
                        <div className={styles.dragHint}>Kéo để di chuyển</div>
                    </div>

                    <div className={styles.zoomRow}>
            <span className={styles.zoomBtn} aria-hidden>
              –
            </span>
                        <input
                            className={styles.zoom}
                            type="range"
                            min="1"
                            max="2.5"
                            step="0.01"
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                        />
                        <span className={styles.zoomBtn} aria-hidden>
              +
            </span>
                    </div>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className={styles.fileInput}
                        onChange={onFileChange}
                    />

                    <div className={styles.editorActions}>
                        <button className={styles.pickBtn} onClick={openFilePicker}>
                            Chọn ảnh từ máy
                        </button>
                        <button className={styles.removeBtn} onClick={handleRemove}>
                            Xóa ảnh
                        </button>
                    </div>
                </div>

                <div className={styles.editorFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Hủy
                    </button>
                    <button className={styles.saveBtn} onClick={handleApply} disabled={!imgObj}>
                        Cập nhật
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AvatarEditorModal;
