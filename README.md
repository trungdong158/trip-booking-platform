# Mộc Journeys

**Chạm cảm xúc, chạm hành trình.** Mộc là nền tảng khám phá du lịch Việt Nam theo tâm trạng, kể chuyện qua những người dẫn đường địa phương và hỗ trợ lên lịch trình, lưu nơi muốn đến, gửi yêu cầu đặt chỗ demo.

## Chạy dự án

```bash
npm install
npm run dev
```

Kiểm tra production build và lint:

```bash
npm run build
npm run lint
```

## Các hành trình chính

- Khám phá 9 điểm đến, trải nghiệm và nơi ở mẫu; tìm kiếm tiếng Việt không phân biệt dấu/chữ hoa, lọc kết hợp theo tâm trạng, miền đất, loại dịch vụ và giá, sắp xếp theo giá hoặc đánh giá.
- Xem trang chi tiết có câu chuyện Local Host, gallery điều khiển bằng nút và phím mũi tên, đánh giá ghi rõ là minh họa.
- Lưu/bỏ lưu yêu thích; dữ liệu, hồ sơ demo, lịch trình và đặt chỗ được lưu bằng `localStorage`.
- Tạo lịch trình nhiều ngày, thêm/xóa/sắp xếp điểm dừng và xem tổng ngân sách mẫu.
- Đặt chỗ demo với ngày, số người, email, tổng giá và phí minh họa; xem mã xác nhận, lịch sử và hủy yêu cầu.
- Xem nhắc hành trình được tổng hợp từ đặt chỗ đã lưu; không gửi thông báo thật.
- Truy cập khu vực demo Khách đi, Local Host và Quản trị; Quản trị có thể thêm/sửa/xóa điểm đến và hồ sơ demo, xem đặt chỗ, hoặc khôi phục seed.
- Xác nhận trước khi hủy đặt chỗ hoặc đăng xuất khỏi phiên demo.

## Giới hạn bản demo

Đây là frontend demo, không có API hoặc backend. Tài khoản và phân vai chỉ minh họa giao diện, không phải cơ chế bảo mật. Đặt chỗ không gửi dữ liệu, không liên hệ nhà cung cấp và không thu thập thông tin thanh toán. Ảnh dùng Unsplash; font dùng Google Fonts.

Tài liệu sản phẩm, vai trò, design system, kiểm thử, demo và đối chiếu rubric nằm trong [docs/](./docs/).
