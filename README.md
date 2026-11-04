# Mộc Journeys

**Chạm cảm xúc, chạm hành trình.** Mộc là nền tảng khám phá điểm đến trong nước và quốc tế, kể chuyện qua những người dẫn đường địa phương và hỗ trợ lên lịch trình, lưu nơi muốn đến, gửi yêu cầu đặt chỗ demo.

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

- Khám phá 12 điểm đến mẫu trong nước và quốc tế; tìm kiếm theo tên, quốc gia hoặc miền, lọc theo mùa, danh mục, độ phổ biến và ngân sách, sắp xếp phổ biến hoặc A–Z, tải thêm kết quả.
- Duyệt các trang tất cả điểm đến, trong nước, quốc tế và danh mục; xem chi tiết với gallery, điểm tham quan, mùa đẹp, ngân sách, ẩm thực, di chuyển, bản đồ, tour liên quan và review demo.
- Lưu/bỏ lưu điểm đến yêu thích từ thẻ hoặc trang chi tiết; dữ liệu, hồ sơ demo, lịch trình và đặt chỗ được lưu bằng `localStorage`.
- Duyệt tour trong nước, quốc tế, theo chủ đề hoặc đang ưu đãi; tìm kiếm, lọc theo giá/ngày/thời lượng/điểm đến/chủ đề/đánh giá/chỗ trống và sắp xếp theo giá, độ phổ biến, đánh giá hoặc mới nhất.
- Xem trang chi tiết tour với gallery, lịch trình từng ngày, dịch vụ bao gồm/không bao gồm, lưu trú, hướng dẫn viên, lịch khởi hành, chính sách hủy, đánh giá và các tour liên quan; chọn ngày/số khách trong booking panel.
- Lưu tour qua wishlist điểm đến và so sánh tối đa ba tour; yêu cầu giữ chỗ demo được chuyển vào luồng đặt chỗ có sẵn.
- Trang danh sách có trạng thái đang tải, rỗng và lỗi; dữ liệu seed được bổ sung vào localStorage cũ mà không ghi đè các điểm đến đã chỉnh sửa.
- Tạo lịch trình nhiều ngày, thêm/xóa/sắp xếp điểm dừng và xem tổng ngân sách mẫu.
- Đặt chỗ demo với ngày, số người, email, tổng giá và phí minh họa; xem mã xác nhận, lịch sử và hủy yêu cầu.
- Xem nhắc hành trình được tổng hợp từ đặt chỗ đã lưu; không gửi thông báo thật.
- Truy cập khu vực demo Khách đi, Local Host và Quản trị; Quản trị có thể thêm/sửa/xóa điểm đến và hồ sơ demo, xem đặt chỗ, hoặc khôi phục seed.
- Xác nhận trước khi hủy đặt chỗ hoặc đăng xuất khỏi phiên demo.

## Giới hạn bản demo

Đây là frontend demo, không có API hoặc backend. Tài khoản và phân vai chỉ minh họa giao diện, không phải cơ chế bảo mật. Đặt chỗ không gửi dữ liệu, không liên hệ nhà cung cấp và không thu thập thông tin thanh toán; lịch khởi hành, giá, chỗ trống và chính sách tour chỉ là dữ liệu mẫu. Ảnh dùng Unsplash; font dùng Google Fonts.

Tài liệu sản phẩm, vai trò, design system, kiểm thử, demo và đối chiếu rubric nằm trong [docs/](./docs/).
