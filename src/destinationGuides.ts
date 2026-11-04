import type { Destination, DestinationGuide } from './types'

type GuideContent = Omit<DestinationGuide, 'gallery' | 'reviews'>

const guideContent: Record<string, GuideContent> = {
  'ta-xua': {
    overview: 'Tà Xùa là miền núi cao dành cho những buổi sáng nhiều mây, những cung đường uốn lượn và nhịp sống bản địa bình dị. Hãy dành thời gian ở lại thay vì chỉ ghé săn mây.',
    attractions: ['Sống lưng khủng long', 'Mỏm Cá Heo', 'Bản Tà Xùa và đồi chè Shan Tuyết'],
    bestTime: 'Tháng 10 đến tháng 4, đặc biệt sáng sớm sau ngày trời lạnh và khô.',
    estimatedBudget: '2.500.000–4.500.000đ / người / 3 ngày',
    cuisine: ['Thịt trâu gác bếp', 'Cơm lam', 'Chè Shan Tuyết'],
    transportation: 'Đi xe khách đêm từ Hà Nội đến Bắc Yên, sau đó thuê xe địa phương lên Tà Xùa. Đường núi quanh co; nên chọn tài xế quen đường.',
    latitude: 21.334,
    longitude: 104.431,
  },
  'cu-lao-cham': {
    overview: 'Cù Lao Chàm là cụm đảo xanh ngoài khơi Hội An, nơi những làng chài, bãi biển nhỏ và hệ sinh thái biển cùng tạo nên một kỳ nghỉ chậm.',
    attractions: ['Bãi Ông', 'Eo Gió', 'Bãi Hương và chợ Tân Hiệp'],
    bestTime: 'Tháng 3 đến tháng 8, khi biển thường êm và tàu ra đảo hoạt động thuận lợi.',
    estimatedBudget: '1.800.000–3.500.000đ / người / 2 ngày',
    cuisine: ['Cua đá', 'Rau rừng chấm mắm nêm', 'Ốc vú nàng'],
    transportation: 'Từ Hội An đi Cửa Đại rồi đi canô hoặc tàu gỗ theo điều kiện thời tiết. Tôn trọng quy định bảo tồn và hạn chế đồ nhựa dùng một lần.',
    latitude: 15.95,
    longitude: 108.52,
  },
  'hoi-an': {
    overview: 'Hội An là nơi phố cổ, làng nghề và những bữa cơm gia đình giao nhau. Dành một ngày đi bộ ngoài các tuyến phố chính để cảm nhận đời sống thường nhật.',
    attractions: ['Phố cổ và Chùa Cầu', 'Làng rau Trà Quế', 'Rừng dừa Cẩm Thanh'],
    bestTime: 'Tháng 2 đến tháng 4 có thời tiết dễ chịu; mùa mưa thường từ tháng 9 đến tháng 1.',
    estimatedBudget: '2.000.000–4.000.000đ / người / 3 ngày',
    cuisine: ['Cao lầu', 'Mì Quảng', 'Bánh mì Hội An'],
    transportation: 'Bay đến Đà Nẵng rồi đi xe khoảng 45 phút. Phố cổ phù hợp để đi bộ hoặc đạp xe; hãy hỏi trước về giờ hạn chế xe.',
    latitude: 15.88,
    longitude: 108.338,
  },
  'pu-luong': {
    overview: 'Pù Luông mang đến những thung lũng ruộng bậc thang, bản làng người Thái và những căn nhà sàn nép bên sườn núi. Đây là chuyến đi hợp với người thích đi bộ và nghỉ giữa thiên nhiên.',
    attractions: ['Bản Đôn', 'Thác Hiêu', 'Chợ phiên Phố Đoàn'],
    bestTime: 'Tháng 5–6 hoặc tháng 9–10, thời điểm ruộng bậc thang xanh hoặc vào mùa lúa chín.',
    estimatedBudget: '2.000.000–4.000.000đ / người / 3 ngày',
    cuisine: ['Vịt Cổ Lũng', 'Cơm lam', 'Măng rừng'],
    transportation: 'Từ Hà Nội đi xe đến Thanh Hóa rồi tiếp tục theo đường núi; xe riêng hoặc xe đưa đón là lựa chọn thuận tiện.',
    latitude: 20.48,
    longitude: 105.15,
  },
  'ly-son': {
    overview: 'Lý Sơn hình thành từ dấu tích núi lửa giữa biển, với những vách đá bazan, ruộng tỏi và nhịp sống gắn liền với mùa biển.',
    attractions: ['Cổng Tò Vò', 'Hang Câu', 'Đảo Bé và miệng núi lửa Thới Lới'],
    bestTime: 'Tháng 3 đến tháng 8, nên kiểm tra dự báo biển và lịch tàu trước ngày khởi hành.',
    estimatedBudget: '3.000.000–5.500.000đ / người / 3 ngày',
    cuisine: ['Gỏi tỏi', 'Hải sản theo mùa', 'Bánh ít lá gai'],
    transportation: 'Đến cảng Sa Kỳ từ Quảng Ngãi rồi đi tàu cao tốc. Lịch tàu phụ thuộc thời tiết và có thể thay đổi.',
    latitude: 15.38,
    longitude: 109.12,
  },
  hue: {
    overview: 'Huế lưu giữ dấu ấn kinh đô bên sông Hương, đồng thời có những khu vườn nhà, làng nghề và nền ẩm thực tinh tế.',
    attractions: ['Đại Nội Huế', 'Lăng Tự Đức', 'Chợ Đông Ba và các nhà vườn Kim Long'],
    bestTime: 'Tháng 2 đến tháng 4 mát và ít mưa; tháng 9 đến tháng 12 thường có mưa nhiều.',
    estimatedBudget: '1.800.000–3.800.000đ / người / 2 ngày',
    cuisine: ['Bún bò Huế', 'Cơm hến', 'Bánh bèo, nậm, lọc'],
    transportation: 'Có thể đến bằng tàu, xe hoặc sân bay Phú Bài. Trong thành phố, xe đạp và xe máy giúp linh hoạt ghé các khu vườn.',
    latitude: 16.464,
    longitude: 107.59,
  },
  'da-lat': {
    overview: 'Đà Lạt là cao nguyên của những khu vườn, rừng thông và quán cà phê nhỏ. Hãy dành thời gian rời trung tâm để gặp những người trồng hoa và làm nông.',
    attractions: ['Hồ Tuyền Lâm', 'Ga Đà Lạt', 'Các nông trại và vườn hoa ngoại ô'],
    bestTime: 'Tháng 11 đến tháng 3 thường khô, se lạnh và có nhiều nắng sớm.',
    estimatedBudget: '2.000.000–4.500.000đ / người / 3 ngày',
    cuisine: ['Bánh căn', 'Bánh ướt lòng gà', 'Atiso và rau theo mùa'],
    transportation: 'Bay đến sân bay Liên Khương hoặc đi xe đường dài. Thuê xe có tài xế nếu muốn khám phá các nông trại xa trung tâm.',
    latitude: 11.94,
    longitude: 108.458,
  },
  'ninh-binh': {
    overview: 'Ninh Bình kết hợp cảnh quan núi đá vôi, dòng sông và những vùng quê có thể khám phá bằng thuyền, xe đạp hoặc đi bộ.',
    attractions: ['Quần thể Tràng An', 'Tam Cốc – Bích Động', 'Cố đô Hoa Lư'],
    bestTime: 'Tháng 1 đến tháng 4 mát; tháng 5–6 có mùa lúa và sen, thời tiết nóng hơn.',
    estimatedBudget: '1.500.000–3.500.000đ / người / 2 ngày',
    cuisine: ['Cơm cháy', 'Dê núi', 'Miến lươn'],
    transportation: 'Tàu hoặc xe khách từ Hà Nội đến thành phố Ninh Bình; thuê xe đạp hoặc xe máy để đi giữa các điểm.',
    latitude: 20.25,
    longitude: 105.975,
  },
  'phu-quoc': {
    overview: 'Phú Quốc có những bãi biển dài, làng chài và vườn tiêu. Khám phá phía bắc và phía nam đảo để thấy nhiều nhịp sống khác nhau.',
    attractions: ['Bãi Sao', 'Vườn quốc gia Phú Quốc', 'Làng chài Hàm Ninh'],
    bestTime: 'Tháng 11 đến tháng 4 thường là mùa khô và biển êm hơn.',
    estimatedBudget: '3.000.000–6.500.000đ / người / 3 ngày',
    cuisine: ['Gỏi cá trích', 'Bún quậy', 'Hải sản làng chài'],
    transportation: 'Có chuyến bay đến sân bay Phú Quốc hoặc tàu từ Rạch Giá/Hà Tiên. Thuê xe máy hoặc xe đưa đón để di chuyển trên đảo.',
    latitude: 10.29,
    longitude: 103.984,
  },
  kyoto: {
    overview: 'Kyoto kết hợp những khu vườn thiền, phố cổ và văn hóa thủ công. Đi sớm và chọn vài khu vực để khám phá sâu thay vì cố ghé mọi điểm.',
    attractions: ['Fushimi Inari Taisha', 'Kiyomizu-dera', 'Rừng tre Arashiyama'],
    bestTime: 'Tháng 3–5 vào mùa hoa và tháng 10–11 vào mùa lá đỏ; nên đặt lưu trú sớm.',
    estimatedBudget: '12.000.000–20.000.000đ / người / 5 ngày (chưa gồm vé máy bay)',
    cuisine: ['Yudofu', 'Kaiseki theo mùa', 'Matcha Uji'],
    transportation: 'Bay đến Osaka rồi đi tàu đến Kyoto. Tàu điện và xe buýt tiện lợi; cân nhắc vé ngày theo lịch trình.',
    latitude: 35.0116,
    longitude: 135.7681,
  },
  'chiang-mai': {
    overview: 'Chiang Mai là thành phố miền núi của những ngôi chùa, chợ đêm và làng nghề. Các chuyến đi ngoại ô nên chọn đơn vị tôn trọng cộng đồng và thiên nhiên.',
    attractions: ['Phố cổ Chiang Mai', 'Doi Suthep', 'Chợ Warorot'],
    bestTime: 'Tháng 11 đến tháng 2 mát và khô; nên tránh giai đoạn khói mù theo mùa.',
    estimatedBudget: '8.000.000–14.000.000đ / người / 4 ngày (chưa gồm vé máy bay)',
    cuisine: ['Khao soi', 'Sai oua', 'Khan tok'],
    transportation: 'Bay đến sân bay Chiang Mai; trong thành phố có songthaew, taxi ứng dụng và xe thuê.',
    latitude: 18.7883,
    longitude: 98.9853,
  },
  'luang-prabang': {
    overview: 'Luang Prabang nằm giữa Mekong và Nam Khan, nổi tiếng với phố di sản, chợ địa phương và những khoảng xanh quanh thành phố.',
    attractions: ['Thác Kuang Si', 'Núi Phousi', 'Bảo tàng Cung điện Hoàng gia'],
    bestTime: 'Tháng 11 đến tháng 3 mát và khô; tháng 4–10 là mùa mưa.',
    estimatedBudget: '7.000.000–12.000.000đ / người / 4 ngày (chưa gồm vé máy bay)',
    cuisine: ['Khao soi kiểu Lào', 'Mok pa', 'Xôi nếp và jeow bong'],
    transportation: 'Có thể đến bằng tàu cao tốc từ Vientiane hoặc bay đến sân bay Luang Prabang; tuk-tuk phù hợp cho các chặng trong phố.',
    latitude: 19.8833,
    longitude: 102.1333,
  },
}

const galleryImages: Record<string, { image: string; alt: string }[]> = {
  'ta-xua': [
    { image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=82', alt: 'Dãy núi cao phủ mây' },
    { image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=82', alt: 'Thung lũng núi lúc bình minh' },
  ],
  'cu-lao-cham': [
    { image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=82', alt: 'Bờ biển xanh trong' },
    { image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=82', alt: 'Sóng biển trên bãi cát' },
  ],
  'hoi-an': [
    { image: 'https://images.unsplash.com/photo-1513415277900-a62401e19be4?auto=format&fit=crop&w=1400&q=82', alt: 'Phố cổ với kiến trúc truyền thống' },
    { image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=82', alt: 'Con sông bên phố cổ' },
  ],
  'pu-luong': [
    { image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=82', alt: 'Ánh nắng xuyên qua rừng xanh' },
    { image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1400&q=82', alt: 'Thiên nhiên xanh yên bình' },
  ],
  'ly-son': [
    { image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1400&q=82', alt: 'Thuyền nhỏ trên biển' },
    { image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=82', alt: 'Bờ biển đảo xanh' },
  ],
  hue: [
    { image: 'https://images.unsplash.com/photo-1518128958364-65859d70aa41?auto=format&fit=crop&w=1400&q=82', alt: 'Kiến trúc cổ bên sông' },
    { image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=82', alt: 'Dòng sông miền Trung' },
  ],
  'da-lat': [
    { image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1400&q=82', alt: 'Thung lũng cao nguyên lúc sớm' },
    { image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=82', alt: 'Ánh nắng trên đồi xanh' },
  ],
  'ninh-binh': [
    { image: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?auto=format&fit=crop&w=1400&q=82', alt: 'Núi đá vôi bên dòng nước' },
    { image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=82', alt: 'Cảnh núi non xanh mát' },
  ],
  'phu-quoc': [
    { image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=82', alt: 'Bãi biển nhiệt đới' },
    { image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=82', alt: 'Sóng biển trong xanh' },
  ],
  kyoto: [
    { image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=82', alt: 'Con phố truyền thống ở Kyoto' },
    { image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=1400&q=82', alt: 'Cổng torii đỏ giữa rừng' },
  ],
  'chiang-mai': [
    { image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1400&q=82', alt: 'Ngôi chùa giữa miền núi' },
    { image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=82', alt: 'Đường phố cổ trong ánh nắng' },
  ],
  'luang-prabang': [
    { image: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1400&q=82', alt: 'Sông và núi trong ánh chiều' },
    { image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1400&q=82', alt: 'Kiến trúc chùa cổ giữa cây xanh' },
  ],
}

export function getDestinationCategory(destination: Destination) {
  return destination.category ?? destination.region
}

export function getDestinationCountry(destination: Destination) {
  return destination.country ?? 'Việt Nam'
}

export function getDestinationGuide(destination: Destination): DestinationGuide {
  const content = guideContent[destination.id] ?? {
    overview: destination.description,
    attractions: destination.highlights,
    bestTime: destination.season,
    estimatedBudget: `${destination.price.toLocaleString('vi-VN')}đ trở lên / người`,
    cuisine: ['Đặc sản địa phương theo mùa'],
    transportation: 'Kiểm tra lịch trình phương tiện và điều kiện thời tiết trước khi khởi hành.',
    latitude: 16.0,
    longitude: 108.0,
  }
  const reviews = [
    {
      author: 'Minh Anh',
      location: 'Hà Nội',
      rating: destination.rating,
      date: 'Tháng 10, 2025',
      content: `Mình thích nhất nhịp đi vừa phải và những câu chuyện địa phương ở ${destination.province}. Một trải nghiệm đáng nhớ.`,
    },
    {
      author: 'Quốc Bảo',
      location: 'TP. Hồ Chí Minh',
      rating: Math.max(4, Number((destination.rating - 0.1).toFixed(1))),
      date: 'Tháng 8, 2025',
      content: 'Cảnh đẹp, lịch trình linh hoạt và có đủ thời gian để tự khám phá. Mình sẽ quay lại vào một mùa khác.',
    },
  ]
  return {
    ...content,
    gallery: [
      { image: destination.image, alt: destination.imageAlt },
      ...(galleryImages[destination.id] ?? []),
    ],
    reviews,
  }
}
