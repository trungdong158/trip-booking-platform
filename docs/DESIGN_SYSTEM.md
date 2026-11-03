# Design system Mộc

## Art direction

Editorial travel trên nền ivory, màu xanh lá trầm, typography serif giàu chất kể chuyện đi cùng sans-serif dễ đọc. Ảnh phong cảnh rộng, chú thích nhỏ, lời kể Local Host và khoảng trắng tạo cảm giác thân tình, không sao chép nhận diện sản phẩm khác.

## Tokens

Khai báo trong `src/index.css`:

| Token | Vai trò |
|---|---|
| `--color-ink` | Chữ chính |
| `--color-green`, `--color-green-dark` | Thương hiệu và hành động |
| `--color-green-light` | Nền trạng thái |
| `--color-cream`, `--color-paper` | Nền chính/phụ |
| `--color-muted`, `--color-line` | Chữ phụ, đường phân tách |
| `--font-display`, `--font-body` | Playfair Display, DM Sans; có Georgia/system fallback |
| `--space-1` … `--space-16` | Thang spacing 4–64px |
| `--radius-card` | Bo góc tiết chế |
| `--shadow-card` | Elevation cho form/card |
| `--content-width` | Container nội dung |
| `--transition-fast` | Thời lượng chuyển động ngắn |
| `--layer-header`, `--layer-overlay` | Thứ tự lớp giao diện |

Breakpoints chính: `900px`, `640px`, `370px`; layout sử dụng Grid/Flexbox và `clamp()`.

## Quy tắc component

- CTA nền xanh; CTA phụ dùng viền mảnh, nền trong.
- Card điểm đến có ảnh, tag, đánh giá minh họa, Local Host, giá và nút khám phá.
- Filter/select và form có nhãn; điều khiển nút tối thiểu 42–48px khi chạm.
- Gallery, dialog, trạng thái rỗng và toast dùng cùng màu chữ/nền/thứ bậc.
- Ảnh dưới màn hình dùng `loading="lazy"`; ảnh hero ưu tiên tải sớm.
- `:focus-visible`, skip link, `aria-label`, trạng thái `aria-pressed` và `prefers-reduced-motion` hỗ trợ khả năng tiếp cận.
