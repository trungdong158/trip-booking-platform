# Đối chiếu rubric đồ án

| Tiêu chí | Trọng số | Bằng chứng hiện có | Còn thiếu / giới hạn |
|---|---:|---|---|
| UI/UX | 20% | Editorial travel, màu/font/spacing tokens, điều hướng, empty state, gallery và Local Host story | Cần khảo sát người dùng và rà contrast định lượng |
| Chức năng/tương tác | 15% | Search, lọc kết hợp, sort, mood, wishlist, planner, gallery, booking, hủy, nhắc demo, CRUD demo điểm đến/hồ sơ | Không có backend, thanh toán, thông báo đẩy hoặc đầy đủ nghiệp vụ review |
| Responsive | 20% | Grid/Flexbox, menu mobile, form/modal thích ứng; kiểm tra 320–1440px | Cần kiểm tra thiết bị thật, zoom và các trình duyệt độc lập |
| Hiệu suất | 5% | Vite production minify, ảnh dưới trang lazy-load, hero tải sớm, không thêm dependency | Chưa đo Lighthouse; ảnh/font tải từ dịch vụ ngoài |
| Tương thích trình duyệt | 10% | React, CSS chuẩn và HTML semantic; integrated browser smoke check | Chưa có kết quả Chrome/Firefox/Edge/Safari độc lập |
| Mã nguồn/cấu trúc | 10% | TypeScript, dữ liệu/tip tách trong `data.ts`, `storage.ts`, `types.ts`; build và lint đạt | `App.tsx` vẫn gom nhiều màn hình; cần tiếp tục tách component khi mở rộng |
| Sáng tạo/độc đáo | 10% | Mood discovery, giọng kể riêng, collections theo cảm xúc, local host story, planner | Rating/review và stories dùng dữ liệu demo |
| Báo cáo/thuyết trình | 10% | `docs/DEMO_SCRIPT.md`, tài liệu overview/roles/design/test/checklist/team | Nhóm cần điền phân công thực tế và tự luyện phần hỏi đáp |

Rubric checklist này ghi nhận bằng chứng, không dự đoán điểm tổng kết. Kết quả cuối cùng tùy demo, báo cáo, nhóm và tiêu chí của giảng viên.
