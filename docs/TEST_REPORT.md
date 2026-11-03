# Báo cáo kiểm thử

## Môi trường và lệnh

- Dự án React 19 + TypeScript + Vite; kiểm tra trong integrated browser hiện có và viewport giả lập bằng Playwright.
- `npm run build` — đạt: TypeScript project check và Vite production build hoàn thành.
- `npm run lint` — đạt: Oxlint không báo lỗi/warning.
- Chưa có unit-test runner hoặc script `npm test`; functional checks dưới đây được chạy trực tiếp trên trình duyệt.

## Kiểm thử chức năng đã chạy

| Luồng | Kết quả |
|---|---|
| Tìm `hoi an` khớp “Hội An” | Đạt |
| Kết hợp tâm trạng + miền đất, trạng thái không có kết quả | Đạt |
| Xóa bộ lọc và sắp giá tăng dần | Đạt; giá được hiển thị tăng dần |
| Lưu yêu thích, bộ đếm và tải lại trang | Đạt; dữ liệu còn sau reload |
| Journey Planner: tên, ngày, thêm 2 điểm, tổng chi phí, đổi thứ tự, tải lại | Đạt |
| Booking: ngày/số người, phí 5%, email không hợp lệ bị trình duyệt chặn, mã xác nhận | Đạt |
| Booking history và hủy qua dialog xác nhận | Đạt |
| Admin: xóa hồ sơ demo có xác nhận, không cho xóa tài khoản đang đăng nhập | Đạt |
| Lời nhắc: tạo booking, hiển thị trong trang Thông báo và cập nhật badge | Đạt |
| Đăng xuất: dialog xác nhận, “Ở lại với Mộc” giữ nguyên phiên | Đạt |
| Gallery: nút tiếp và phím ArrowRight; chỉ báo slide cập nhật | Đạt |
| Admin demo: thêm điểm đến, sửa giá, xóa xác nhận, khôi phục seed | Đạt |
| Local Host: tạo dịch vụ; dịch vụ xuất hiện trong Explore | Đạt |
| Menu mobile mở, chuyển trang và đóng | Đạt |
| Dữ liệu localStorage JSON hỏng: thông báo phục hồi và hiển thị seed | Đạt |
| Dialog booking ở viewport 320px: vừa viewport, có thể cuộn, Escape đóng | Đạt |
| Ngang trang ở các route chính | Không phát hiện tràn ngang tại các viewport đã thử |

## Responsive

Đã đo `documentElement.scrollWidth <= innerWidth` cho các route home, explore, collections, detail, planner, wishlist, bookings, dashboard, provider, admin và login tại 320, 375, 390, 768, 1024, 1280 và 1440px. Tất cả phép đo đều không phát hiện tràn ngang. Khu vực admin/provider tại các viewport này được kiểm tra theo trạng thái vai trò đang lưu trong trình duyệt; dashboard admin, danh sách hồ sơ và trang thông báo đã được kiểm thử ở viewport hẹp.

## Chưa kiểm thử / giới hạn

- Chưa chạy Lighthouse; không báo điểm Performance/Accessibility/SEO.
- Chưa kiểm thử thủ công trên Chrome/Firefox/Edge/Safari độc lập. Integrated browser không được xem là bằng chứng tương thích đủ bốn trình duyệt.
- Chưa có unit hoặc E2E suite có thể chạy lặp lại bằng `npm test`; các kiểm thử trên là thao tác trình duyệt trong phiên phát triển.
- Chưa kiểm thử thực tế với mạng chậm/ảnh Unsplash lỗi, quota localStorage đầy hoặc dữ liệu bị can thiệp đa tab.
- Vai trò, booking, đánh giá và dịch vụ đều là mô phỏng frontend; không có API, thanh toán hoặc gửi thông báo thật.
