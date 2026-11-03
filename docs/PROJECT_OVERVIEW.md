# Tổng quan Mộc Journeys

## Mục tiêu

Mộc giúp người đi du lịch Việt Nam bắt đầu từ cảm xúc muốn tìm (bình yên, tự do, phiêu lưu, ẩm thực, thiên nhiên, văn hóa, nghỉ dưỡng, kết nối), rồi khám phá tour địa phương hoặc nơi ở phù hợp.

**Định vị:** Chạm cảm xúc, chạm hành trình.  
**Phong cách:** editorial travel, gần gũi thiên nhiên, kể chuyện qua Local Host.  
**Công nghệ:** React 19, TypeScript, Vite, CSS và dữ liệu demo trong trình duyệt.

## Phạm vi đã triển khai

- Trang chủ, khám phá, kết quả tìm kiếm/lọc, bộ sưu tập, chi tiết điểm đến, yêu thích.
- Journey Planner: tên chuyến đi, ngày đi/về, thêm/xóa/đổi thứ tự điểm đến và tổng chi phí mẫu.
- Quy trình đặt chỗ frontend demo: ngày, số người, thông tin liên hệ, phí 5% minh họa, mã xác nhận, lịch sử và hủy.
- Đăng ký hồ sơ demo và vào vai Khách đi, Local Host hoặc Quản trị demo.
- Khu Local Host thêm trải nghiệm mẫu; khu Quản trị thêm, sửa giá, xóa và khôi phục dữ liệu mẫu.

## Mô hình dữ liệu

`src/types.ts` định nghĩa `User`, `Destination`, `Booking`, `Itinerary` và `AppStore`. Seed data có ID ổn định trong `src/data.ts`; đọc/ghi, kiểm tra dữ liệu cục bộ và tạo booking nằm trong `src/storage.ts`.

| Dữ liệu | Lưu trữ |
|---|---|
| Hồ sơ demo và phiên vai trò | `localStorage` |
| Điểm đến/dịch vụ mẫu | `localStorage`, khôi phục từ seed |
| Wishlist | `localStorage` |
| Booking demo | `localStorage` |
| Journey Planner | `localStorage` |

Ứng dụng xử lý dữ liệu JSON lỗi bằng thông báo và seed fallback. Không có đồng bộ đa thiết bị hoặc backend.

## Ngoài phạm vi

Không có thanh toán, xác nhận đặt chỗ thật, email/thông báo từ máy chủ, xác thực an toàn, dữ liệu khách sạn/đánh giá thực, đồng bộ nhóm, bản đồ, quản lý người dùng đầy đủ, duyệt đánh giá hoặc dashboard phân tích phía máy chủ. Các review, rating và vai trò chỉ dùng cho trình diễn.

## Cấu trúc đáng chú ý

```text
src/
  App.tsx       Điều hướng hash và các luồng giao diện
  App.css       Component và responsive styles
  index.css     Design tokens, nền tảng và accessibility
  data.ts       Seed data, collections và helper định dạng
  storage.ts    Đọc/ghi localStorage và tạo booking demo
  types.ts      Kiểu dữ liệu ứng dụng
docs/           Hướng dẫn demo và tài liệu đồ án
```
