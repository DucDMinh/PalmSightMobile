# PalmSight Mobile (Expo / React Native)

Ứng dụng di động PalmSight được xây dựng bằng **Expo SDK (React Native + TypeScript)**, nằm trong hệ thống monorepo `PalmSight-Mobile`.

## Kiến trúc & Điểm nổi bật

- **Tái sử dụng `@palmsight/shared`**: Dùng chung 100% các Enums (`ReadingSchool`, `HandOrientation`), Yup schemas và DTOs với backend và frontend web.
- **Xử lý AI tập trung trên Backend**: Mobile không cần tải mô hình nặng hay cấu hình WebAssembly phức tạp. Người dùng chỉ cần chụp ảnh hoặc chọn ảnh từ thư viện (`expo-image-picker`), gửi trực tiếp qua API multipart lên backend NestJS (`/api/v1/readings` hoặc `/api/v1/readings/guest`).
- **Tương thích 100% với Expo Go**: Chạy mượt mà trực tiếp trên thiết bị iOS / Android qua ứng dụng Expo Go mà không cần build native dev client.

## Cấu trúc thư mục

```text
mobile/
├── App.tsx             # Giao diện chính: Xem bói, Xem bài luận giải, Tài khoản & Cài đặt
├── src/
│   └── services/
│       └── api.ts      # Client gọi REST API tới Backend PalmSight
├── app.json            # Cấu hình Expo app (Bundle ID, icon, splash...)
└── tsconfig.json       # TypeScript config kế thừa từ expo/tsconfig.base
```

## Hướng dẫn chạy thử nghiệm

### 1. Khởi động Backend
Đảm bảo backend NestJS đang chạy (ở cổng 4000):
```bash
# Tại thư mục gốc
pnpm --filter backend dev
```

### 2. Khởi động Mobile App với Expo
Từ thư mục gốc:
```bash
pnpm dev:mobile
```
hoặc vào thư mục `mobile`:
```bash
cd mobile
pnpm start
```

### 3. Kết nối với thiết bị thật qua Expo Go
1. Tải ứng dụng **Expo Go** trên App Store (iOS) hoặc Google Play (Android).
2. Quét mã QR hiển thị trên terminal.
3. Trong màn hình ứng dụng trên điện thoại, chuyển sang tab **⚙️ Cấu Hình** và nhập địa chỉ IP máy tính của bạn trong mạng LAN (ví dụ: `http://192.168.1.15:4000/api/v1`) hoặc URL ngrok HTTPS.
