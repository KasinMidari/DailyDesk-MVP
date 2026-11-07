# Cấu hình bản chạy thật

Hai nơi: **Vercel** (frontend) và **Render** (backend). Giá trị nằm ở dashboard
của từng bên, không nằm trong repo, nên sửa code rồi push cũng không đổi được —
phải vào dashboard.

| Chỗ | Địa chỉ |
| --- | --- |
| Frontend | https://dailydesk-mvp.vercel.app |
| Backend | https://dailydesk-api.onrender.com |

## 1. Vercel — tắt dữ liệu giả

Hiện tại bản deploy đang chạy **dữ liệu giả trong trình duyệt**: không gọi
backend, đăng nhập là giả, đóng tab là mất. Đây là trạng thái cố ý từ Ngày 1
(T006) nhưng chưa ai tắt sau khi backend thật chạy (T045).

Settings → Environment Variables, đặt cho **Production**:

```
VITE_USE_MOCK=false
VITE_BACKEND_URL=https://dailydesk-api.onrender.com
VITE_GOOGLE_CLIENT_ID=<client id ở bước 2>
VITE_AUTH_DEV_LOGIN=false
```

Rồi **Redeploy** (biến môi trường của Vite được nhúng lúc build, không đổi khi
chỉ sửa biến).

> Làm cả ba biến cùng lúc. Nếu chỉ tắt `VITE_USE_MOCK` mà chưa có Client ID
> thì không còn đường nào đăng nhập: nút Google bị khoá, đăng nhập thử cũng tắt.

## 2. Google Cloud — Client ID (T033)

Cần tài khoản Google của bạn, tôi không làm thay được.

1. console.cloud.google.com → tạo project (hoặc dùng project có sẵn).
2. APIs & Services → Credentials → Create credentials → **OAuth client ID** →
   Application type **Web application**.
3. **Authorized JavaScript origins**, thêm đúng hai dòng:
   - `http://localhost:5173`
   - `https://dailydesk-mvp.vercel.app`
4. Copy Client ID (dạng `…apps.googleusercontent.com`) và điền vào **cả hai**:
   - Vercel: `VITE_GOOGLE_CLIENT_ID`
   - Render: `GOOGLE_CLIENT_ID`

Client secret không dùng tới: frontend lấy ID token qua Google Identity
Services, backend chỉ xác minh token đó.

## 3. Render — tắt đăng nhập thử

**Đây là lỗ bảo mật, không phải chuyện cấu hình cho đẹp.**

`AUTH_DEV_LOGIN` đang bật trên máy chủ thật. Khi bật, `POST /auth/dev` cấp
phiên đăng nhập cho **bất kỳ email nào, không cần mật khẩu**. Ai biết email của
một người dùng là vào thẳng được tài khoản đó:

```bash
curl -X POST https://dailydesk-api.onrender.com/auth/dev \
  -H 'Content-Type: application/json' -d '{"email":"nguoikhac@gmail.com"}'
```

Dashboard Render → service `dailydesk-api` → Environment:

```
AUTH_DEV_LOGIN=false
```

`render.yaml` trong repo đã sửa thành `false`, nhưng giá trị đã đặt tay trên
dashboard thì phải sửa tay — blueprint không ghi đè.

Các biến còn lại trên Render (`sync: false`, điền tay):

```
DATABASE_URL=libsql://<ten-db>.turso.io
DATABASE_AUTH_TOKEN=<token Turso>
GOOGLE_CLIENT_ID=<client id ở bước 2>
CORS_ORIGIN=https://dailydesk-mvp.vercel.app,http://localhost:5173
```

`CORS_ORIGIN` đã đúng (kiểm bằng preflight), `SESSION_SECRET` do Render tự sinh.

## 4. Kiểm lại sau khi đổi

```bash
curl -s https://dailydesk-api.onrender.com/health
```

Phải ra `{"ok":true}`. Request đầu có thể chờ 30–50 giây vì gói Render miễn phí
cho service ngủ.

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://dailydesk-api.onrender.com/auth/dev \
  -H 'Content-Type: application/json' -d '{}'
```

Phải ra `404` (route đã tắt). Nếu ra `400` là `AUTH_DEV_LOGIN` vẫn đang bật.

Trên https://dailydesk-mvp.vercel.app: nút "Tiếp tục với Google" bấm được, dòng
"Bản demo: chưa kết nối backend…" biến mất, và đăng nhập xong tạo được task,
tải lại trang vẫn còn.
