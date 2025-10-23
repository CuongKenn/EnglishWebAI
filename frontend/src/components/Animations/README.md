# Animation Components

## ScrollAnimations.jsx

Component quản lý các hiệu ứng animation khi scroll và tương tác với trang.

### Tính năng:
- **Scroll Animations**: Tự động kích hoạt animation khi element xuất hiện trong viewport
- **Smooth Scroll**: Cuộn mượt mà cho các link anchor
- **Parallax Effects**: Hiệu ứng parallax cho các element có class `.parallax`
- **Typing Animation**: Hiệu ứng gõ chữ cho element có `data-typewriter`
- **Counter Animation**: Đếm số cho element có class `.counter`

### Cách sử dụng:

```jsx
import ScrollAnimations from './components/Animations/ScrollAnimations';

function App() {
  return (
    <div>
      <ScrollAnimations />
      {/* Nội dung trang */}
    </div>
  );
}
```

### Animation Classes:

- `.fade-in`: Fade in từ dưới lên
- `.slide-up`: Trượt từ dưới lên
- `.slide-left`: Trượt từ trái
- `.slide-right`: Trượt từ phải
- `.scale-in`: Scale từ nhỏ lên lớn

### Data Attributes:

- `data-typewriter="text"`: Text để gõ
- `data-speed="100"`: Tốc độ gõ (ms)
- `data-target="100"`: Số đích cho counter
- `data-duration="2000"`: Thời gian đếm (ms)
- `data-speed="0.5"`: Tốc độ parallax

## Animations.css

File CSS chứa tất cả các animation styles và keyframes.

### Hover Effects:
- `.hover-lift`: Nâng lên khi hover
- `.hover-scale`: Phóng to khi hover
- `.hover-glow`: Phát sáng khi hover

### Button Animations:
- `.btn-pulse`: Hiệu ứng pulse
- `.btn-bounce`: Hiệu ứng bounce

### Loading Animations:
- `.loading-dots`: Dots loading
- `.loading-spinner`: Spinner loading

### Card Animations:
- `.card-flip`: Lật card khi hover
- `.card-flip-inner`: Container cho flip effect

### Text Animations:
- `.text-reveal`: Reveal text từ dưới lên
- `.icon-spin`: Xoay icon
- `.icon-wiggle`: Lắc icon

### Performance:
- `.will-animate`: Tối ưu cho animation
- `.gpu-accelerated`: Sử dụng GPU acceleration
- Responsive cho `prefers-reduced-motion`

## Cách tích hợp:

1. Import ScrollAnimations vào component chính
2. Thêm animation classes vào các element cần animate
3. Sử dụng data attributes cho các hiệu ứng đặc biệt
4. Import Animations.css vào component hoặc App.css

## Ví dụ:

```jsx
<div className="fade-in">
  <h1>Tiêu đề sẽ fade in</h1>
</div>

<div className="slide-up">
  <p>Đoạn văn sẽ trượt từ dưới lên</p>
</div>

<div className="hover-lift">
  <button>Button sẽ nâng lên khi hover</button>
</div>

<span 
  className="counter" 
  data-target="100" 
  data-duration="2000"
>
  0
</span>

<div 
  data-typewriter="Hello World!" 
  data-speed="100"
>
</div>
```


