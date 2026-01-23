# UTHHub Socket — Ứng dụng chat realtime

Dự án **chat realtime** gồm **backend (Spring Boot)** và **frontend (React + Vite)**.

Các luồng realtime chạy qua **WebSocket (SockJS) + STOMP**: nhắn tin, typing indicator, read receipt, thông báo và sự kiện bạn bè.

---

## Tính năng

- **Xác thực JWT**: đăng ký/đăng nhập, gọi REST có Bearer token.
- **Chat realtime**
  - Nhắn tin 1-1 (tự tạo conversation nếu chưa có)
  - Nhắn tin nhóm: tạo nhóm, thêm thành viên, kick, chuyển admin, rời nhóm, giải tán
  - **Typing indicator** theo từng conversation
  - **Read receipt** (đã xem)
  - **Mute** conversation (tắt âm báo)
  - Tìm kiếm tin nhắn theo từ khóa trong 1 conversation
- **Thông báo realtime** (notifications)
  - Ví dụ: mention trong nhóm, các sự kiện hệ thống/khác (tùy nghiệp vụ)
- **Bạn bè**
  - Gửi/nhận lời mời, chấp nhận/từ chối
  - Xem danh sách bạn, thu hồi lời mời, hủy kết bạn
- **Hồ sơ người dùng**: xem/sửa profile, tìm user theo username

---

## Tech Stack

### Backend
- Java **17**
- **Spring Boot** (theo `backend/pom.xml`)
- Spring WebMVC, Spring Security (JWT)
- Spring Data JPA + MySQL
- WebSocket STOMP (SockJS)
- Lombok

### Frontend
- **React** + **Vite**
- `axios` (gọi REST)
- `@stomp/stompjs` + `sockjs-client` (realtime)
- `react-router-dom`
- `react-toastify`, `emoji-picker-react`, FontAwesome

---

## Kiến trúc & cấu trúc thư mục

> Repo dạng monorepo: `backend/` + `frontend/`.

```
uthhub_socket/
├─ backend/                   # Spring Boot API + WebSocket
│  ├─ src/main/java/...        # Controller / Service / Repository / Model / Security / WebSocket
│  ├─ src/main/resources/      # application.properties
│  ├─ docker-compose.yml       # MySQL (dev)
│  └─ pom.xml                  # Maven dependencies
└─ frontend/                   # React + Vite
   ├─ src/
   │  ├─ api/                  # axios modules gọi REST
   │  ├─ contexts/             # ChatContext, NotificationsContext
   │  ├─ services/             # AuthService, WebSocketService
   │  ├─ router/               # ProtectedRoute, routing
   │  └─ views/                # UI chính
   ├─ public/                  # favicon, assets public
   ├─ index.html               # entry + favicon link
   ├─ .env                     # VITE_API_URL, VITE_SOCKET_URL
   └─ package.json
```

### Luồng chạy tổng quan
1. Người dùng **login** → nhận JWT → lưu localStorage.
2. Frontend kết nối **STOMP** qua `/ws` và gửi header `Authorization: Bearer <token>`.
3. Frontend load conversations/messages bằng REST, đồng thời subscribe các topic/queue realtime.
4. Nhắn tin/typing/read… → publish về `/app/...` → backend xử lý → broadcast `/topic/...` hoặc `/user/queue/...`.

---

## Yêu cầu hệ thống

- **Java 17**
- **Node.js**: khuyến nghị **18+** (tương thích Vite mới)
- **Docker** (để chạy MySQL nhanh)

---

## Cài đặt & chạy dự án (dev)

### 1) Chạy MySQL (Docker)

Tại thư mục `backend/`:

```bash
cd backend
# Docker Compose v2
docker compose up -d
# hoặc docker-compose up -d
```

Mặc định docker-compose sẽ tạo:
- MySQL: `localhost:3306`
- DB: `uthhub_db`
- Root password: `root`

> Lưu ý: `backend/src/main/resources/application.properties` hiện cấu hình `root/root`.

### 2) Chạy Backend

```bash
cd backend
./mvnw spring-boot:run
# Windows: mvnw.cmd spring-boot:run
```

Backend mặc định chạy tại:
- REST API: `http://localhost:8080/api/...`
- WebSocket STOMP endpoint: `http://localhost:8080/ws`

### 3) Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định: `http://localhost:5173`

#### Biến môi trường frontend
File `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080/ws
```

---

## Cấu hình

### Backend: `application.properties`
- `spring.datasource.url`: kết nối MySQL
- `spring.jpa.hibernate.ddl-auto=update`: tự tạo/cập nhật schema khi chạy (dev tiện, production nên cân nhắc)
- `bezkoder.app.jwtSecret`, `bezkoder.app.jwtExpirationMs`: cấu hình JWT

---

## API & Realtime (tóm tắt)

### REST API chính

**Auth** (`/api/auth`)
- `POST /api/auth/register` — đăng ký
- `POST /api/auth/login` — đăng nhập

**User** (`/api/users`)
- `GET /api/users/me` — lấy profile của tôi
- `PUT /api/users/me` — cập nhật profile
- `GET /api/users/{id}` — lấy user theo id
- `GET /api/users/search?username=...` — tìm user

**Conversations & Messages**
- `GET /api/conversations` — danh sách conversation
- `GET /api/conversations/{id}` — chi tiết conversation
- `GET /api/conversations/{id}/messages` — lấy messages
- `GET /api/conversations/{id}/messages/search?q=...&limit=...` — tìm messages
- `POST /api/conversations/groups` — tạo nhóm
- `POST /api/conversations/{id}/members` — thêm thành viên
- `POST /api/conversations/{id}/kick/{memberId}` — kick
- `POST /api/conversations/{id}/transfer-admin` — chuyển admin
- `POST /api/conversations/{id}/leave` — rời nhóm
- `DELETE /api/conversations/{id}` — giải tán nhóm
- `PATCH /api/conversations/{id}/mute` — mute/unmute

**Friends** (`/api/friends`)
- `POST /api/friends/request` — gửi lời mời
- `GET /api/friends/requests` — danh sách lời mời đến
- `GET /api/friends/requests/sent` — lời mời đã gửi
- `POST /api/friends/{id}/accept` — chấp nhận
- `POST /api/friends/{id}/reject` — từ chối
- `DELETE /api/friends/cancel/{targetId}` — thu hồi lời mời
- `DELETE /api/friends/unfriend/{friendId}` — hủy kết bạn
- `GET /api/friends` — danh sách bạn

**Notifications** (`/api/notifications`)
- `GET /api/notifications/getbyuserid`
- `GET /api/notifications/getbyuserid-isreadfalse`
- `POST /api/notifications/update-is-read/{id}`

> Gọi REST cần header: `Authorization: Bearer <JWT>` (trừ `/api/auth/**`).

### WebSocket STOMP

**Endpoint:**
- SockJS: `http://localhost:8080/ws`

**Prefix:**
- Client gửi lên server: `/app/...`
- Server broadcast: `/topic/...`
- User queue: `/user/queue/...`

**Client publish (frontend đang dùng):**
- `/app/chat.send` — gửi tin nhắn
- `/app/chat.typing` — bật/tắt typing
- `/app/chat.markRead` — đánh dấu đã đọc

**Client subscribe (frontend đang dùng):**
- `/topic/conversation/{conversationId}` — stream tin nhắn + một số signal
- `/topic/conversation/{conversationId}/typing` — typing
- `/topic/conversation/{conversationId}/read` — read receipt
- `/topic/notifications/{userId}` — thông báo
- `/user/queue/messages` — tin nhắn theo user (kể cả khi không mở conversation)

---

## Build (production)

### Backend
```bash
cd backend
./mvnw clean package
# output: backend/target/*.jar
```

### Frontend
```bash
cd frontend
npm run build
# output: frontend/dist
```

---

## Lưu ý kỹ thuật (đọc từ code)

- Backend dùng `enableSimpleBroker("/topic", "/queue")` ⇒ phù hợp dev/1 instance. Nếu muốn **scale nhiều instance**, nên cân nhắc dùng broker relay (RabbitMQ/Redis) hoặc kiến trúc event bus.
- Hiện WS interceptor **không chặn** CONNECT khi thiếu/invalid token (chỉ set Principal nếu token hợp lệ). Nếu muốn bắt buộc đăng nhập để dùng WS, nên reject CONNECT khi không có JWT hợp lệ.
- Một số dependencies trong `pom.xml` đang **bị trùng** (ví dụ `spring-boot-starter-data-jpa`, `lombok`). Nên dọn lại để build gọn và tránh xung đột.

---

## Troubleshooting

- **Không thấy thay đổi realtime / không connect được WS**
  - Kiểm tra `.env` của frontend: `VITE_SOCKET_URL=http://localhost:8080/ws`
  - Mở DevTools Console xem log từ `WebSocketService`
  - Đảm bảo đã login và có token trong localStorage

- **Lỗi DB / Access denied**
  - Kiểm tra MySQL container đang chạy (`docker ps`)
  - So khớp `application.properties` (user/pass/DB/port)

- **CORS**
  - Backend đang allow all origins (`setAllowedOriginPatterns("*")`). Nếu deploy thật, nên siết lại domain cụ thể.

---

## Dọn repo trước khi nộp / push git

Bản ZIP hiện có thể chứa thư mục nặng như:
- `frontend/node_modules/`
- `backend/target/`
- `.idea/`, `.vscode/`, thậm chí `.git/`

Khuyến nghị **xóa các thư mục build/deps** trước khi nén/nộp và đảm bảo `.gitignore` đúng.

---

## License

Dự án phục vụ mục đích học tập/nội bộ. Liên hệ nhóm nếu cần sử dụng code trên!!!
