import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { collections, createDemoId, demoUsers, formatDate, formatPrice, localDateInputValue, moods, normalizeVietnamese, seedDestinations, starterItinerary } from './data'
import { getDestinationCategory, getDestinationCountry, getDestinationGuide } from './destinationGuides'
import { makeDemoBooking, readStore, writeStore } from './storage'
import { tourPackages } from './tourPackages'
import type { AppStore, Booking, Destination, TourPackage, User } from './types'
import './App.css'

type Route = { page: string; id: string }

const TODAY_INPUT_DATE = localDateInputValue()

const HOME_MOODS = [
  { title: 'Healing', mood: 'Bình yên', note: 'Tìm một khoảng lặng', icon: '○' },
  { title: 'Adventure', mood: 'Phiêu lưu', note: 'Ra khỏi vùng quen', icon: '↗' },
  { title: 'Romantic', mood: 'Kết nối', note: 'Gần nhau hơn chút', icon: '♡' },
  { title: 'Relaxation', mood: 'Nghỉ dưỡng', note: 'Nuông chiều bản thân', icon: '☼' },
  { title: 'Discovery', mood: 'Văn hóa', note: 'Nghe chuyện địa phương', icon: '△' },
  { title: 'Food Journey', mood: 'Ẩm thực', note: 'Nếm một miền đất', icon: '◌' },
]

const JOURNAL_STORIES = [
  {
    id: 'hoi-an-morning',
    destinationId: 'hoi-an',
    category: 'CULTURE NOTES',
    title: 'Hội An, khi phố cổ thuộc về những người thức sớm',
    image: 'https://images.unsplash.com/photo-1518128958364-65859d70aa41?auto=format&fit=crop&w=1200&q=82',
    read: '6 phút đọc',
    paragraphs: [
      'Phố cổ dịu lại trong khoảng thời gian trước khi những cánh cửa hàng mở ra. Tiếng chổi tre trên con đường lát gạch, mùi trà mới và những chiếc đèn lồng còn chưa sáng khiến Hội An gần gũi như một lời chào.',
      'Đi cùng một người địa phương, bạn sẽ nghe những câu chuyện không nằm trên bản đồ: căn nhà đã qua ba thế hệ, món ăn chỉ có vào một buổi trong tuần, hay một khoảng hiên luôn đón nắng sớm.',
      'Có những nơi không cần phải khám phá thật nhanh. Chỉ cần bước chậm, ngồi lại bên một chén trà và để một ngày bình thường trở thành điều mình nhớ lâu.',
    ],
  },
  {
    id: 'ta-xua-sunrise',
    destinationId: 'ta-xua',
    category: 'FIELD JOURNAL',
    title: 'Một buổi bình minh không cần phải vội',
    image: 'https://images.unsplash.com/photo-1500530851072-f978cf4d019e?auto=format&fit=crop&w=1200&q=82',
    read: '4 phút đọc',
    paragraphs: [
      'Ở Tà Xùa, buổi sáng bắt đầu khi bầu trời vẫn còn xanh thẫm. Con đường lên núi đủ quanh co để mọi người tự nhiên nói nhỏ hơn, như thể không muốn làm biển mây thức giấc.',
      'Hà biết một triền đồi khuất gió, nơi có thể ngồi chờ nắng lên. Không ai thúc giục phải chụp được tấm hình đẹp nhất. Chúng tôi chỉ chia nhau bình trà nóng và nhìn mây đổi màu.',
      'Khi trở về, điều mang theo không chỉ là cảnh sắc. Đó còn là cảm giác mình đã dành trọn một buổi sáng cho chính mình.',
    ],
  },
  {
    id: 'hue-family-table',
    destinationId: 'hue',
    category: 'TASTE & PLACE',
    title: 'Nếm Huế qua một mâm cơm nhà',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=82',
    read: '5 phút đọc',
    paragraphs: [
      'Một mâm cơm Huế thường bắt đầu từ những điều rất nhỏ: mớ rau trong vườn, chén nước mắm pha vừa tay và câu hỏi hôm nay bạn muốn ăn cay đến đâu.',
      'Chi kể chuyện món ăn bằng những ký ức gia đình. Có món học từ bà ngoại, có món thay đổi theo mùa, và có món nhất định phải ăn khi trời vừa tạnh mưa.',
      'Ngồi bên mâm cơm, người đi đường và người trong nhà gần nhau hơn. Đôi khi, đó là cách dễ chịu nhất để hiểu một miền đất.',
    ],
  },
]

function routeFromHash(): Route {
  const hash = window.location.hash
  if (!hash.startsWith('#/')) return { page: 'home', id: '' }
  const [page = 'home', id = ''] = hash.slice(2).split('/')
  return { page, id: decodeURIComponent(id) }
}

function navigateBrowserRoute(page: string, id = '') {
  window.location.hash = `/${page}${id ? `/${encodeURIComponent(id)}` : ''}`
}

function getTripDurationDays(start: string, end: string) {
  if (!start || !end) return 3
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  const startTime = Date.UTC(startYear, startMonth - 1, startDay)
  const endTime = Date.UTC(endYear, endMonth - 1, endDay)
  return Math.max(1, Math.floor((endTime - startTime) / 86400000) + 1)
}

function matchesTravelSeason(seasonText: string, selectedSeason: string) {
  if (!selectedSeason || seasonText.toLocaleLowerCase('vi').includes('quanh năm')) return true
  const monthsBySeason: Record<string, number[]> = {
    spring: [3, 4, 5],
    summer: [6, 7, 8],
    autumn: [9, 10, 11],
    winter: [12, 1, 2],
  }
  const selectedMonths = monthsBySeason[selectedSeason] ?? []
  const ranges = [...seasonText.matchAll(/tháng\s*(\d+)\s*[—–-]\s*(\d+)/giu)]
  if (!ranges.length) return selectedMonths.some((month) => seasonText.includes(String(month)))
  return ranges.some((range) => {
    const start = Number(range[1])
    const end = Number(range[2])
    return selectedMonths.some((month) => start <= end
      ? month >= start && month <= end
      : month >= start || month <= end)
  })
}

function ArrowIcon({ left = false }: { left?: boolean }) {
  return (
    <svg aria-hidden="true" className={`arrow-icon${left ? ' arrow-icon--left' : ''}`} viewBox="0 0 24 24" fill="none">
      <path d="M4.75 12h14.5m-6-6 6 6-6 6" />
    </svg>
  )
}

function Brand() {
  return (
    <a className="brand" href="#/home" aria-label="Mộc — về đầu trang">
      <span className="brand-mark" aria-hidden="true">m.</span>
      <span className="brand-copy"><strong>mộc</strong><span>chạm cảm xúc, chạm hành trình</span></span>
    </a>
  )
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`eyebrow${light ? ' eyebrow--light' : ''}`}><span />{children}</p>
}

function App() {
  const [initialState] = useState(readStore)
  const [store, setStore] = useState<AppStore>(initialState.store)
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [query, setQuery] = useState('')
  const [mood, setMood] = useState('')
  const [region, setRegion] = useState('Tất cả')
  const [serviceType, setServiceType] = useState('Tất cả')
  const [maximumPrice, setMaximumPrice] = useState('')
  const [minimumRating, setMinimumRating] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [activeMood, setActiveMood] = useState('')
  const [bookingGuestCount, setBookingGuestCount] = useState(2)
  const [providerServiceName, setProviderServiceName] = useState('')
  const [providerServicePrice, setProviderServicePrice] = useState('')
  const [adminDestinationName, setAdminDestinationName] = useState('')
  const [adminDestinationPrice, setAdminDestinationPrice] = useState('')
  const [minimumBookingDate, setMinimumBookingDate] = useState('')
  const [homeDestination, setHomeDestination] = useState('')
  const [homeDeparture, setHomeDeparture] = useState('')
  const [homeReturn, setHomeReturn] = useState('')
  const [travelDates, setTravelDates] = useState<{ departure: string; returnDate: string } | null>(null)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [destinationQuery, setDestinationQuery] = useState('')
  const [destinationSeason, setDestinationSeason] = useState('')
  const [destinationCategory, setDestinationCategory] = useState('')
  const [destinationPopularity, setDestinationPopularity] = useState('')
  const [destinationBudget, setDestinationBudget] = useState('')
  const [destinationSort, setDestinationSort] = useState('popular')
  const [destinationLimit, setDestinationLimit] = useState(6)
  const [destinationsLoading, setDestinationsLoading] = useState(false)
  const [tourQuery, setTourQuery] = useState('')
  const [tourMinimumPrice, setTourMinimumPrice] = useState('')
  const [tourMaximumPrice, setTourMaximumPrice] = useState('')
  const [tourDepartureDate, setTourDepartureDate] = useState('')
  const [tourDuration, setTourDuration] = useState('')
  const [tourDestination, setTourDestination] = useState('')
  const [tourType, setTourType] = useState('')
  const [tourMinimumRating, setTourMinimumRating] = useState('')
  const [tourSeats, setTourSeats] = useState('')
  const [tourSort, setTourSort] = useState('popular')
  const [tourPage, setTourPage] = useState(1)
  const [tourLoading, setTourLoading] = useState(false)
  const [comparedTourIds, setComparedTourIds] = useState<string[]>([])
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [detailSlide, setDetailSlide] = useState(0)
  const bookingSubmissionInProgress = useRef(false)
  const [bookingDestination, setBookingDestination] = useState<Destination | null>(null)
  const [bookingConfirmation, setBookingConfirmation] = useState<Booking | null>(null)
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)
  const [logoutPending, setLogoutPending] = useState(false)
  const [toast, setToast] = useState(initialState.warning)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleNavigation = () => {
      setRoute(routeFromHash())
      setTourPage(1)
    }
    window.addEventListener('hashchange', handleNavigation)
    if (!window.location.hash) window.location.hash = '/home'
    return () => window.removeEventListener('hashchange', handleNavigation)
  }, [])

  useEffect(() => {
    const listingRoutes = ['destinations', 'domestic', 'international', 'categories']
    const showTimer = window.setTimeout(() => setDestinationsLoading(listingRoutes.includes(route.page)), 0)
    const hideTimer = window.setTimeout(() => setDestinationsLoading(false), 240)
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [route.page])

  useEffect(() => {
    const tourRoutes = ['tours', 'domestic-tours', 'international-tours', 'themed-tours', 'promotional-tours']
    const showTimer = window.setTimeout(() => setTourLoading(tourRoutes.includes(route.page)), 0)
    const hideTimer = window.setTimeout(() => setTourLoading(false), 220)
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [route.page])

  useEffect(() => {
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!bookingDestination && !cancellingBooking && !logoutPending) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const modal = document.querySelector<HTMLElement>('.dialog')
    const focusable = modal?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)')
    const first = focusable?.[0]
    const last = focusable?.[focusable.length - 1]
    first?.focus()
    document.body.classList.add('modal-open')
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBookingDestination(null)
        setCancellingBooking(null)
        setLogoutPending(false)
      } else if (event.key === 'Tab' && first && last) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeys)
    return () => {
      document.body.classList.remove('modal-open')
      document.removeEventListener('keydown', handleKeys)
      previouslyFocused?.focus()
    }
  }, [bookingDestination, cancellingBooking, logoutPending])

  const results = useMemo(() => {
    const normalizedQuery = normalizeVietnamese(query)
    return store.destinations
      .filter((destination) => {
        const searchable = normalizeVietnamese(`${destination.name} ${destination.province} ${destination.region} ${destination.host} ${destination.description}`)
        return (!normalizedQuery || searchable.includes(normalizedQuery))
          && (!mood || destination.mood.includes(mood))
          && (region === 'Tất cả' || destination.region === region)
          && (serviceType === 'Tất cả' || destination.type === serviceType)
          && (!maximumPrice || destination.price <= Number(maximumPrice))
          && (!minimumRating || destination.rating >= Number(minimumRating))
      })
      .sort((a, b) => sortBy === 'price-asc' ? a.price - b.price
        : sortBy === 'price-desc' ? b.price - a.price
          : sortBy === 'rating' ? b.rating - a.rating
            : b.rating - a.rating || a.price - b.price)
  }, [maximumPrice, minimumRating, mood, query, region, serviceType, sortBy, store.destinations])

  const destinationCategories = useMemo(
    () => [...new Set(store.destinations.map((destination) => getDestinationCategory(destination)))].sort((a, b) => a.localeCompare(b, 'vi')),
    [store.destinations],
  )

  const destinationResults = useMemo(() => {
    const normalizedQuery = normalizeVietnamese(destinationQuery)
    return store.destinations
      .filter((destination) => {
        const country = getDestinationCountry(destination)
        const searchable = normalizeVietnamese(`${destination.name} ${destination.province} ${destination.region} ${country}`)
        const domestic = country === 'Việt Nam'
        return (!normalizedQuery || searchable.includes(normalizedQuery))
          && (route.page !== 'domestic' || domestic)
          && (route.page !== 'international' || !domestic)
          && (!destinationCategory || getDestinationCategory(destination) === destinationCategory)
          && matchesTravelSeason(destination.season, destinationSeason)
          && (!destinationBudget || destination.price <= Number(destinationBudget))
          && (!destinationPopularity || (destination.popularity ?? destination.rating * 20) >= Number(destinationPopularity))
      })
      .sort((a, b) => destinationSort === 'alphabetical'
        ? a.province.localeCompare(b.province, 'vi') || a.name.localeCompare(b.name, 'vi')
        : (b.popularity ?? b.rating * 20) - (a.popularity ?? a.rating * 20) || b.rating - a.rating)
  }, [destinationBudget, destinationCategory, destinationPopularity, destinationQuery, destinationSeason, destinationSort, route.page, store.destinations])

  const filteredTours = useMemo(() => {
    const normalizedQuery = normalizeVietnamese(tourQuery)
    const destinationById = new Map(store.destinations.map((destination) => [destination.id, destination]))
    return tourPackages
      .filter((tour) => {
        const destination = destinationById.get(tour.destinationId)
        const searchable = normalizeVietnamese(`${tour.title} ${tour.subtitle} ${tour.keywords.join(' ')} ${destination?.province ?? ''} ${destination ? getDestinationCountry(destination) : ''}`)
        const departureAvailable = tour.departures.some((departure) => {
          const hasDate = departure.date >= (tourDepartureDate || TODAY_INPUT_DATE)
          const hasSeats = !tourSeats || departure.seats >= Number(tourSeats)
          return hasDate && hasSeats
        })
        return (!normalizedQuery || searchable.includes(normalizedQuery))
          && (route.page !== 'domestic-tours' || tour.domestic)
          && (route.page !== 'international-tours' || !tour.domestic)
          && (route.page !== 'themed-tours' || tour.type === tourType || !tourType)
          && (route.page !== 'promotional-tours' || tour.promotional)
          && (!tourMinimumPrice || tour.price >= Number(tourMinimumPrice))
          && (!tourMaximumPrice || tour.price <= Number(tourMaximumPrice))
          && (!tourDuration || (tourDuration === 'long' ? tour.durationDays >= 5 : tour.durationDays === Number(tourDuration)))
          && (!tourDestination || tour.destinationId === tourDestination)
          && (!tourType || tour.type === tourType)
          && (!tourMinimumRating || tour.rating >= Number(tourMinimumRating))
          && departureAvailable
      })
      .sort((a, b) => tourSort === 'price-asc' ? a.price - b.price
        : tourSort === 'price-desc' ? b.price - a.price
          : tourSort === 'rating' ? b.rating - a.rating || b.reviewCount - a.reviewCount
            : tourSort === 'newest' ? b.createdAt.localeCompare(a.createdAt)
              : b.popularity - a.popularity)
  }, [route.page, store.destinations, tourDepartureDate, tourDestination, tourDuration, tourMaximumPrice, tourMinimumPrice, tourMinimumRating, tourQuery, tourSeats, tourSort, tourType])

  function navigate(page: string, id = '') {
    setMenuOpen(false)
    if (page === 'destination') {
      setDetailSlide(0)
      setReviewRating(5)
      setReviewText('')
      setReviewSubmitted(false)
    }
    navigateBrowserRoute(page, id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateStore(updater: (current: AppStore) => AppStore): boolean {
    const next = updater(store)
    try {
      writeStore(next)
      setStore(next)
      return true
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Không thể lưu thay đổi.')
      return false
    }
  }

  function toggleWishlist(id: string) {
    const saved = updateStore((current) => ({
      ...current,
      wishlist: current.wishlist.includes(id)
        ? current.wishlist.filter((savedId) => savedId !== id)
        : [...current.wishlist, id],
    }))
    if (saved) setToast(store.wishlist.includes(id) ? 'Đã bỏ khỏi chuyến đi yêu thích.' : 'Đã lưu vào những nơi bạn muốn chạm tới.')
  }

  function loginAs(user: User) {
    if (!updateStore((current) => ({ ...current, user }))) return
    setToast(`Chào ${user.name}, Mộc vui vì bạn đã quay lại.`)
    navigate(user.role === 'provider' ? 'provider' : user.role === 'admin' ? 'admin' : 'dashboard')
  }

  function registerCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const user: User = { id: createDemoId('user'), name, email, role: 'customer' }
    if (!updateStore((current) => ({ ...current, user, users: [...current.users.filter((item) => item.email !== email), user] }))) return
    setToast('Hồ sơ demo đã được tạo và lưu trên thiết bị này.')
    navigate('dashboard')
  }

  function openBooking(destination: Destination, departureDate?: string, guests?: number) {
    if (store.destinations.some((item) => item.id === destination.id)) {
      setMinimumBookingDate(departureDate || travelDates?.departure || localDateInputValue())
      setBookingDate(departureDate ?? '')
      if (guests) setBookingGuestCount(guests)
      setBookingDestination(destination)
      setBookingConfirmation(null)
    } else {
      setToast('Hành trình này không còn khả dụng. Hãy chọn một gợi ý khác.')
    }
  }

  function bookTour(tour: TourPackage, departureDate: string, guests: number) {
    const destination = store.destinations.find((item) => item.id === tour.destinationId)
    if (!destination) {
      setToast('Điểm đến của tour không còn khả dụng. Hãy tải lại dữ liệu.')
      return
    }
    openBooking({ ...destination, name: tour.title, price: tour.price, duration: `${tour.durationDays} ngày ${tour.durationDays - 1} đêm` }, departureDate, guests)
  }

  function toggleTourComparison(tourId: string) {
    setComparedTourIds((current) => {
      if (current.includes(tourId)) return current.filter((id) => id !== tourId)
      if (current.length >= 3) {
        setToast('Bạn có thể so sánh tối đa 3 tour cùng lúc.')
        return current
      }
      return [...current, tourId]
    })
  }

  function createBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!bookingDestination || bookingSubmissionInProgress.current) return
    const formData = new FormData(event.currentTarget)
    const guests = Number(formData.get('guests'))
    const date = String(formData.get('date'))
    if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
      setToast('Số người cần từ 1 đến 12.')
      return
    }
    bookingSubmissionInProgress.current = true
    try {
      const booking = makeDemoBooking(
        bookingDestination,
        date,
        guests,
        String(formData.get('name')).trim(),
        String(formData.get('email')).trim(),
        store.user?.id,
      )
      if (!updateStore((current) => ({ ...current, bookings: [booking, ...current.bookings] }))) return
      setBookingDestination(null)
      setBookingConfirmation(booking)
      navigate('confirmation', booking.id)
    } finally {
      bookingSubmissionInProgress.current = false
    }
  }

  function cancelBooking() {
    if (!cancellingBooking) return
    if (!updateStore((current) => ({
      ...current,
      bookings: current.bookings.map((item) => item.id === cancellingBooking.id ? { ...item, status: 'cancelled' } : item),
    }))) return
    setCancellingBooking(null)
    setToast('Đã hủy yêu cầu đặt chỗ demo.')
  }

  function changeItinerary(updater: (items: AppStore['itinerary']) => AppStore['itinerary']) {
    updateStore((current) => ({ ...current, itinerary: updater(current.itinerary) }))
  }

  function resetFilters() {
    setQuery('')
    setMood('')
    setRegion('Tất cả')
    setServiceType('Tất cả')
    setMaximumPrice('')
    setMinimumRating('')
    setSortBy('popular')
    setTravelDates(null)
    setHomeDestination('')
    setHomeDeparture('')
    setHomeReturn('')
  }

  function searchFromHome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (homeDeparture && homeReturn && homeReturn < homeDeparture) {
      setToast('Ngày trở về cần sau ngày khởi hành.')
      return
    }
    setQuery(homeDestination.trim())
    setMinimumBookingDate(homeDeparture || TODAY_INPUT_DATE)
    setTravelDates(homeDeparture || homeReturn ? { departure: homeDeparture, returnDate: homeReturn } : null)
    navigate('explore')
  }

  function subscribeToNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewsletterMessage('Cảm ơn bạn! Email đã được ghi nhận trong phiên demo này.')
    setNewsletterEmail('')
  }

  function Header() {
    const links = [
      ['Điểm đến', 'destinations'],
      ['Tour', 'tours'],
      ['Khám phá', 'explore'],
      ['Bộ sưu tập', 'collections'],
      ['Tạp chí', 'journal'],
      ['Lên lịch trình', 'planner'],
    ]
    return (
      <header className="site-header">
        <Brand />
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>
        <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Điều hướng chính">
          <a className="nav-search" href="#/explore" onClick={() => setMenuOpen(false)}><span aria-hidden="true">⌕</span> Tìm kiếm</a>
          {links.map(([label, page]) => <a href={`#/${page}`} key={page} onClick={() => setMenuOpen(false)}>{label}</a>)}
          {store.user && <a className="nav-notifications" href="#/notifications" onClick={() => setMenuOpen(false)}>Thông báo <span>{store.bookings.filter((booking) => booking.status === 'upcoming'
            && (store.user?.role === 'admin'
              || booking.customerId === store.user?.id
              || (!booking.customerId && booking.customerEmail === store.user?.email))).length}</span></a>}
          <a className="nav-wishlist" href="#/wishlist" onClick={() => setMenuOpen(false)}>
            Đã lưu <span>{store.wishlist.length}</span>
          </a>
          <a className="nav-account" href={store.user ? '#/dashboard' : '#/login'} onClick={() => setMenuOpen(false)}>
            {store.user ? store.user.name.split(' ')[0] : 'Tài khoản'} <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
    )
  }

  function DestinationCard({ destination }: { destination: Destination }) {
    const saved = store.wishlist.includes(destination.id)
    return (
      <article className="trip-card">
        <div className="trip-image-wrap">
          <img className="trip-image" src={destination.image} alt={destination.imageAlt} loading="lazy" />
          <span className="trip-label">{destination.label}</span>
          <button className={`save-button${saved ? ' is-saved' : ''}`} type="button" aria-label={saved ? `Bỏ lưu ${destination.name}` : `Lưu ${destination.name}`} aria-pressed={saved} onClick={() => toggleWishlist(destination.id)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.6c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z" /></svg>
          </button>
          <span className="trip-rating"><span aria-hidden="true">✦</span> {destination.rating.toFixed(1)}</span>
        </div>
        <div className="trip-card-content">
          <div className="trip-location">{destination.province}<span>·</span>{destination.duration}</div>
          <h3><a href={`#/destination/${destination.id}`}>{destination.name}</a></h3>
          <div className="host-note">Cùng <strong>{destination.host}</strong></div>
          <div className="trip-card-bottom">
            <p><strong>{formatPrice(destination.price)}</strong><span> / người</span></p>
            <button className="trip-cta" type="button" onClick={() => navigate('destination', destination.id)}>Khám phá <ArrowIcon /></button>
          </div>
        </div>
      </article>
    )
  }

  function ResultsGrid({ items = results }: { items?: Destination[] }) {
    return items.length ? (
      <div className="trip-grid" aria-live="polite">
        {items.map((destination) => <DestinationCard key={destination.id} destination={destination} />)}
      </div>
    ) : (
      <div className="empty-state" role="status">
        <span aria-hidden="true">○</span>
        <h3>Chưa tìm thấy chuyến đi phù hợp</h3>
        <p>Thử từ khóa khác hoặc bỏ bớt bộ lọc để xem thêm những hành trình đang chờ.</p>
        <button className="text-button" type="button" onClick={resetFilters}>Xem tất cả hành trình <ArrowIcon /></button>
      </div>
    )
  }

  function SearchAndFilters({ compact = false }: { compact?: boolean }) {
    const allRegions = ['Tất cả', ...new Set(store.destinations.map((destination) => destination.region))]
    return (
      <>
        <form className={`search-bar${compact ? ' search-bar--compact' : ''}`} onSubmit={(event) => event.preventDefault()}>
          <label className="search-field">
            <span className="field-icon" aria-hidden="true">⌕</span>
            <span className="search-field-copy">
              <span>Đi đâu cũng được</span>
              <input aria-label="Tìm điểm đến" placeholder="Thử “Hội An”, “biển”…" value={query} onChange={(event) => setQuery(event.target.value)} />
            </span>
            {query && <button className="clear-query" type="button" aria-label="Xóa từ khóa" onClick={() => setQuery('')}>×</button>}
          </label>
          <span className="search-divider" />
          <label className="search-field search-field--season">
            <span className="field-icon" aria-hidden="true">⌁</span>
            <span className="search-field-copy">
              <span>Đi theo cảm xúc</span>
              <select aria-label="Lọc theo cảm xúc" value={mood} onChange={(event) => setMood(event.target.value)}>
                <option value="">Mọi tâm trạng</option>
                {moods.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
            </span>
          </label>
          <button className="search-button" type="submit"><span>Tìm hành trình</span><ArrowIcon /></button>
        </form>
        <div className="advanced-filters">
          <label><span>Miền đất</span>
            <select aria-label="Lọc theo miền đất" value={region} onChange={(event) => setRegion(event.target.value)}>
              {allRegions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label><span>Trải nghiệm</span>
            <select aria-label="Lọc theo trải nghiệm" value={serviceType} onChange={(event) => setServiceType(event.target.value)}>
              <option value="Tất cả">Tất cả</option><option value="tour">Tour địa phương</option><option value="stay">Nơi ở</option>
            </select>
          </label>
          <label><span>Giá tối đa / người</span>
            <select aria-label="Lọc theo giá tối đa" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)}>
              <option value="">Không giới hạn</option><option value="2000000">2.000.000đ</option><option value="2500000">2.500.000đ</option><option value="3000000">3.000.000đ</option>
            </select>
          </label>
          <label><span>Đánh giá</span>
            <select aria-label="Lọc theo đánh giá" value={minimumRating} onChange={(event) => setMinimumRating(event.target.value)}>
              <option value="">Mọi mức</option><option value="4.9">Từ 4.9 sao</option><option value="4.8">Từ 4.8 sao</option>
            </select>
          </label>
          <label><span>Sắp xếp</span>
            <select aria-label="Sắp xếp hành trình" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="popular">Nổi bật</option><option value="rating">Đánh giá cao</option><option value="price-asc">Giá thấp trước</option><option value="price-desc">Giá cao trước</option>
            </select>
          </label>
          <button className="reset-filters" type="button" onClick={resetFilters}>Xóa bộ lọc</button>
        </div>
        <div className="result-count" role="status">Tìm thấy <strong>{results.length}</strong> hành trình phù hợp với bạn.</div>
      </>
    )
  }

  function DestinationExplorerCard({ destination }: { destination: Destination }) {
    const saved = store.wishlist.includes(destination.id)
    return (
      <article className="destination-explorer-card">
        <div className="destination-explorer-image">
          <button type="button" className="destination-image-link" onClick={() => navigate('destination', destination.id)} aria-label={`Xem ${destination.province}`}>
            <img src={destination.image} alt={destination.imageAlt} loading="lazy" />
          </button>
          <span className="destination-country-tag">{getDestinationCountry(destination)}</span>
          <button className={`save-button${saved ? ' is-saved' : ''}`} type="button" aria-label={saved ? `Bỏ lưu ${destination.province}` : `Lưu ${destination.province}`} aria-pressed={saved} onClick={() => toggleWishlist(destination.id)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.6c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z" /></svg>
          </button>
          <span className="destination-image-rating">★ {destination.rating.toFixed(1)}</span>
        </div>
        <div className="destination-explorer-copy">
          <div className="destination-explorer-meta"><span>{getDestinationCategory(destination)}</span><span>{destination.duration}</span></div>
          <h2><a href={`#/destination/${destination.id}`}>{destination.province}</a></h2>
          <p>{destination.description}</p>
          <div className="destination-explorer-bottom">
            <span><strong>{formatPrice(destination.price)}</strong><small>từ / người</small></span>
            <button type="button" onClick={() => navigate('destination', destination.id)}>Khám phá <ArrowIcon /></button>
          </div>
        </div>
      </article>
    )
  }

  function DestinationsPage() {
    const isDomestic = route.page === 'domestic'
    const isInternational = route.page === 'international'
    const pageTitle = isDomestic ? 'Việt Nam gần hơn' : isInternational ? 'Ra ngoài biên giới' : 'Những nơi đáng nhớ'
    const pageDescription = isDomestic
      ? 'Tìm một chuyến đi gần gũi qua những miền đất, câu chuyện và hương vị Việt Nam.'
      : isInternational
        ? 'Mở rộng bản đồ và khám phá những điểm đến quốc tế cùng hướng dẫn từ Mộc.'
        : 'Tìm điểm đến theo mùa, ngân sách và nhịp điệu bạn đang tìm kiếm.'
    function retryDestinationData() {
      const state = readStore()
      setStore(state.store)
      setToast(state.warning ?? 'Đã tải lại dữ liệu điểm đến.')
    }
    return (
      <section className="destination-catalog section-wrap">
        <div className="destination-catalog-intro">
          <div><Eyebrow>DESTINATIONS · MỘC JOURNEYS</Eyebrow><h1>{pageTitle}<br /><em>theo cách của bạn.</em></h1><p>{pageDescription}</p></div>
          <div className="destination-count"><strong>{destinationResults.length}</strong><span>điểm đến<br />đang chờ bạn</span></div>
        </div>
        <nav className="destination-tabs" aria-label="Nhóm điểm đến">
          <a className={route.page === 'destinations' ? 'is-active' : ''} href="#/destinations">Tất cả</a>
          <a className={isDomestic ? 'is-active' : ''} href="#/domestic">Trong nước</a>
          <a className={isInternational ? 'is-active' : ''} href="#/international">Quốc tế</a>
          <a className={route.page === 'categories' ? 'is-active' : ''} href="#/categories">Theo danh mục</a>
        </nav>
        {route.page === 'categories' ? (
          <div className="destination-category-grid">
            {destinationCategories.map((category, index) => {
              const items = store.destinations.filter((destination) => getDestinationCategory(destination) === category)
              const destination = items[0]
              if (!destination) return null
              return <button className="destination-category-card" type="button" key={category} onClick={() => { setDestinationCategory(category); navigate('destinations') }}><img src={destination.image} alt="" loading="lazy" /><span className="destination-category-shade" /><span className="destination-category-number">0{index + 1} · {items.length} ĐIỂM ĐẾN</span><strong>{category}</strong><span className="destination-category-link">Tìm cảm hứng <ArrowIcon /></span></button>
            })}
          </div>
        ) : (
          <>
            <div className="destination-filters">
              <label className="destination-search-field"><span aria-hidden="true">⌕</span><span className="sr-only">Tìm theo tên, quốc gia hoặc miền</span><input aria-label="Tìm điểm đến theo tên, quốc gia hoặc miền" placeholder="Tên điểm đến, quốc gia, miền..." value={destinationQuery} onChange={(event) => { setDestinationQuery(event.target.value); setDestinationLimit(6) }} /></label>
              <label><span className="sr-only">Mùa du lịch</span><select aria-label="Lọc theo mùa du lịch" value={destinationSeason} onChange={(event) => { setDestinationSeason(event.target.value); setDestinationLimit(6) }}><option value="">Mọi mùa</option><option value="spring">Mùa xuân · Tháng 3–5</option><option value="summer">Mùa hè · Tháng 6–8</option><option value="autumn">Mùa thu · Tháng 9–11</option><option value="winter">Mùa đông · Tháng 12–2</option></select></label>
              <label><span className="sr-only">Danh mục</span><select aria-label="Lọc theo danh mục" value={destinationCategory} onChange={(event) => { setDestinationCategory(event.target.value); setDestinationLimit(6) }}><option value="">Mọi danh mục</option>{destinationCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <label><span className="sr-only">Mức độ phổ biến</span><select aria-label="Lọc theo độ phổ biến" value={destinationPopularity} onChange={(event) => { setDestinationPopularity(event.target.value); setDestinationLimit(6) }}><option value="">Mọi mức độ phổ biến</option><option value="99">Được yêu thích nhất</option><option value="97">Nổi bật</option></select></label>
              <label><span className="sr-only">Ngân sách tối đa</span><select aria-label="Lọc theo ngân sách" value={destinationBudget} onChange={(event) => { setDestinationBudget(event.target.value); setDestinationLimit(6) }}><option value="">Mọi ngân sách</option><option value="3000000">Đến 3 triệu</option><option value="6000000">Đến 6 triệu</option><option value="10000000">Đến 10 triệu</option><option value="15000000">Đến 15 triệu</option></select></label>
              <label><span className="sr-only">Sắp xếp điểm đến</span><select aria-label="Sắp xếp điểm đến" value={destinationSort} onChange={(event) => setDestinationSort(event.target.value)}><option value="popular">Phổ biến nhất</option><option value="alphabetical">Tên A–Z</option></select></label>
              {(destinationQuery || destinationSeason || destinationCategory || destinationPopularity || destinationBudget) && <button className="destination-clear-filters" type="button" onClick={() => { setDestinationQuery(''); setDestinationSeason(''); setDestinationCategory(''); setDestinationPopularity(''); setDestinationBudget(''); setDestinationSort('popular'); setDestinationLimit(6) }}>Xóa lọc</button>}
            </div>
            <div className="destination-results-heading"><Eyebrow>{isDomestic ? 'DOMESTIC COLLECTION' : isInternational ? 'INTERNATIONAL COLLECTION' : 'FIND YOUR NEXT PLACE'}</Eyebrow><span role="status">{destinationsLoading ? 'Đang tìm điểm đến…' : `${destinationResults.length} điểm đến`}</span></div>
            {destinationsLoading ? (
              <div className="destination-explorer-grid" aria-label="Đang tải điểm đến" aria-busy="true">{Array.from({ length: 3 }, (_, index) => <div className="destination-skeleton" key={index}><span /><div><i /><i /><i /></div></div>)}</div>
            ) : store.destinations.length === 0 ? (
              <div className="destination-state destination-error" role="alert"><span>!</span><h2>Chưa thể tải danh sách điểm đến</h2><p>Dữ liệu trên thiết bị hiện không khả dụng. Hãy thử tải lại để khôi phục danh sách demo.</p><button className="modal-submit" type="button" onClick={retryDestinationData}>Tải lại dữ liệu <ArrowIcon /></button></div>
            ) : destinationResults.length === 0 ? (
              <div className="destination-state" role="status"><span>○</span><h2>Chưa tìm thấy điểm đến phù hợp</h2><p>Thử đổi từ khóa hoặc nới rộng một bộ lọc để xem thêm lựa chọn.</p><button className="secondary-button" type="button" onClick={() => { setDestinationQuery(''); setDestinationSeason(''); setDestinationCategory(''); setDestinationPopularity(''); setDestinationBudget('') }}>Xóa bộ lọc</button></div>
            ) : (
              <>
                <div className="destination-explorer-grid">{destinationResults.slice(0, destinationLimit).map((destination) => <DestinationExplorerCard destination={destination} key={destination.id} />)}</div>
                {destinationLimit < destinationResults.length && <div className="destination-load-more"><button className="secondary-button" type="button" onClick={() => setDestinationLimit((current) => current + 6)}>Tải thêm điểm đến <span>({destinationResults.length - destinationLimit} còn lại)</span></button></div>}
              </>
            )}
          </>
        )}
      </section>
    )
  }

  function TourCard({ tour }: { tour: TourPackage }) {
    const destination = store.destinations.find((item) => item.id === tour.destinationId)
    const saved = store.wishlist.includes(tour.destinationId)
    const compareSelected = comparedTourIds.includes(tour.id)
    const nextDeparture = tour.departures.find((departure) => departure.date >= TODAY_INPUT_DATE)
    return (
      <article className="tour-package-card">
        <div className="tour-package-image">
          <a href={`#/tour/${tour.id}`} aria-label={`Xem tour ${tour.title}`}><img src={tour.gallery[0]?.image ?? destination?.image} alt={tour.gallery[0]?.alt ?? destination?.imageAlt} loading="lazy" /></a>
          <span className="tour-package-type">{tour.domestic ? 'TRONG NƯỚC' : 'QUỐC TẾ'} · {tour.type.toUpperCase()}</span>
          {tour.discountPercent > 0 && <span className="tour-package-discount">−{tour.discountPercent}%</span>}
          <button className={`save-button${saved ? ' is-saved' : ''}`} type="button" aria-label={saved ? `Bỏ lưu ${tour.title}` : `Lưu ${tour.title}`} aria-pressed={saved} onClick={() => toggleWishlist(tour.destinationId)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.6c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z" /></svg></button>
          <span className="tour-package-rating">★ {tour.rating.toFixed(1)} <small>({tour.reviewCount})</small></span>
        </div>
        <div className="tour-package-copy">
          <div className="tour-package-location">{destination?.province ?? 'Điểm đến'} <span>·</span> {tour.durationDays} ngày</div>
          <h2><a href={`#/tour/${tour.id}`}>{tour.title}</a></h2>
          <p>{tour.subtitle}</p>
          <div className="tour-package-facts"><span>◷ {tour.durationDays}N{tour.durationDays - 1}Đ</span><span>♧ Tối đa {tour.maxGroupSize} khách</span><span>⌖ {nextDeparture ? formatDate(nextDeparture.date) : 'Liên hệ'}</span></div>
          <div className="tour-package-price-row"><span>{tour.discountPercent > 0 && <del>{formatPrice(Math.round(tour.price / (1 - tour.discountPercent / 100)))}</del>}<strong>{formatPrice(tour.price)}</strong><small> / khách</small></span><a href={`#/tour/${tour.id}`}>Chi tiết <ArrowIcon /></a></div>
          <div className="tour-package-actions"><label><input type="checkbox" checked={compareSelected} onChange={() => toggleTourComparison(tour.id)} /> So sánh</label><button type="button" disabled={!nextDeparture} onClick={() => nextDeparture && bookTour(tour, nextDeparture.date, Math.min(2, tour.maxGroupSize))}>{nextDeparture ? 'Đặt chỗ' : 'Hết lịch'} <ArrowIcon /></button></div>
        </div>
      </article>
    )
  }

  function ToursPage() {
    const headings: Record<string, { title: string; subtitle: string }> = {
      tours: { title: 'Tour được thiết kế để nhớ lâu', subtitle: 'Những hành trình nhóm nhỏ, lịch trình rõ ràng và người địa phương đồng hành.' },
      'domestic-tours': { title: 'Khám phá Việt Nam', subtitle: 'Từ núi rừng và biển đảo đến phố cổ, đi sâu hơn vào những miền đất thân quen.' },
      'international-tours': { title: 'Thế giới rộng hơn', subtitle: 'Những chuyến đi quốc tế nhóm nhỏ, có hướng dẫn viên và lịch trình minh bạch.' },
      'themed-tours': { title: 'Đi theo điều mình thích', subtitle: 'Chọn một chủ đề, tìm một nhịp đi phù hợp và để hành trình tự kể chuyện.' },
      'promotional-tours': { title: 'Ưu đãi theo mùa', subtitle: 'Một vài hành trình đang có giá demo đặc biệt. Chọn ngày khởi hành phù hợp với bạn.' },
    }
    const heading = headings[route.page] ?? headings.tours
    const pageCount = Math.max(1, Math.ceil(filteredTours.length / 6))
    const pageTours = filteredTours.slice((tourPage - 1) * 6, tourPage * 6)
    const comparisonRows: { label: string; value: (tour: TourPackage) => string }[] = [
      { label: 'Giá', value: (tour) => formatPrice(tour.price) },
      { label: 'Thời lượng', value: (tour) => `${tour.durationDays} ngày` },
      { label: 'Đánh giá', value: (tour) => `${tour.rating.toFixed(1)} · ${tour.reviewCount} review` },
      { label: 'Quy mô nhóm', value: (tour) => `Tối đa ${tour.maxGroupSize} khách` },
      { label: 'Khởi hành gần nhất', value: (tour) => {
        const departure = tour.departures.find((item) => item.date >= TODAY_INPUT_DATE)
        return departure ? formatDate(departure.date) : 'Hết lịch'
      } },
    ]
    return (
      <section className="tour-catalog section-wrap">
        <div className="tour-catalog-heading"><div><Eyebrow>CURATED TOURS · MỘC JOURNEYS</Eyebrow><h1>{heading.title.split(' ').slice(0, -1).join(' ')}<br /><em>{heading.title.split(' ').slice(-1)}</em></h1><p>{heading.subtitle}</p></div><div className="tour-catalog-count"><strong>{filteredTours.length}</strong><span>hành trình<br />đang mở</span></div></div>
        <nav className="tour-tabs" aria-label="Danh mục tour"><a className={route.page === 'tours' ? 'is-active' : ''} href="#/tours">Tất cả tour</a><a className={route.page === 'domestic-tours' ? 'is-active' : ''} href="#/domestic-tours">Trong nước</a><a className={route.page === 'international-tours' ? 'is-active' : ''} href="#/international-tours">Quốc tế</a><a className={route.page === 'themed-tours' ? 'is-active' : ''} href="#/themed-tours">Theo chủ đề</a><a className={route.page === 'promotional-tours' ? 'is-active' : ''} href="#/promotional-tours">Đang ưu đãi</a></nav>
        {route.page === 'themed-tours' && <div className="tour-theme-chips" aria-label="Chọn chủ đề">{[['adventure', 'Phiêu lưu'], ['culture', 'Văn hóa'], ['nature', 'Thiên nhiên'], ['food', 'Ẩm thực'], ['relaxation', 'Nghỉ dưỡng']].map(([value, label]) => <button key={value} className={tourType === value ? 'is-active' : ''} type="button" onClick={() => { setTourType((current) => current === value ? '' : value); setTourPage(1) }}>{label}</button>)}</div>}
        <div className="tour-filter-panel">
          <label className="tour-search-field"><span aria-hidden="true">⌕</span><input aria-label="Tìm tour theo điểm đến, tên hoặc từ khóa" placeholder="Tên tour, điểm đến, trải nghiệm..." value={tourQuery} onChange={(event) => { setTourQuery(event.target.value); setTourPage(1) }} /></label>
          <label><span className="sr-only">Giá tối thiểu</span><select aria-label="Giá tour từ" value={tourMinimumPrice} onChange={(event) => { setTourMinimumPrice(event.target.value); setTourPage(1) }}><option value="">Giá từ</option><option value="2000000">2 triệu</option><option value="5000000">5 triệu</option><option value="9000000">9 triệu</option></select></label>
          <label><span className="sr-only">Giá tối đa</span><select aria-label="Giá tour đến" value={tourMaximumPrice} onChange={(event) => { setTourMaximumPrice(event.target.value); setTourPage(1) }}><option value="">Giá đến</option><option value="3000000">3 triệu</option><option value="6000000">6 triệu</option><option value="10000000">10 triệu</option><option value="15000000">15 triệu</option></select></label>
          <label><span className="sr-only">Ngày khởi hành sau ngày</span><input aria-label="Ngày khởi hành từ" type="date" min={TODAY_INPUT_DATE} value={tourDepartureDate} onChange={(event) => { setTourDepartureDate(event.target.value); setTourPage(1) }} /></label>
          <label><span className="sr-only">Thời lượng tour</span><select aria-label="Thời lượng tour" value={tourDuration} onChange={(event) => { setTourDuration(event.target.value); setTourPage(1) }}><option value="">Mọi thời lượng</option><option value="2">2 ngày</option><option value="3">3 ngày</option><option value="4">4 ngày</option><option value="long">5 ngày trở lên</option></select></label>
          <label><span className="sr-only">Điểm đến</span><select aria-label="Điểm đến tour" value={tourDestination} onChange={(event) => { setTourDestination(event.target.value); setTourPage(1) }}><option value="">Mọi điểm đến</option>{[...new Set(tourPackages.map((tour) => tour.destinationId))].map((id) => { const destination = store.destinations.find((item) => item.id === id); return destination ? <option value={id} key={id}>{destination.province}</option> : null })}</select></label>
          <label><span className="sr-only">Loại hình tour</span><select aria-label="Loại hình tour" value={tourType} onChange={(event) => { setTourType(event.target.value); setTourPage(1) }}><option value="">Mọi chủ đề</option><option value="adventure">Phiêu lưu</option><option value="culture">Văn hóa</option><option value="nature">Thiên nhiên</option><option value="food">Ẩm thực</option><option value="relaxation">Nghỉ dưỡng</option></select></label>
          <label><span className="sr-only">Đánh giá tối thiểu</span><select aria-label="Đánh giá tối thiểu" value={tourMinimumRating} onChange={(event) => { setTourMinimumRating(event.target.value); setTourPage(1) }}><option value="">Mọi đánh giá</option><option value="4.8">Từ 4.8 sao</option><option value="4.9">Từ 4.9 sao</option></select></label>
          <label><span className="sr-only">Số chỗ còn trống</span><select aria-label="Số chỗ còn trống" value={tourSeats} onChange={(event) => { setTourSeats(event.target.value); setTourPage(1) }}><option value="">Mọi số chỗ</option><option value="2">Còn từ 2 chỗ</option><option value="4">Còn từ 4 chỗ</option><option value="6">Còn từ 6 chỗ</option></select></label>
          <label><span className="sr-only">Sắp xếp tour</span><select aria-label="Sắp xếp tour" value={tourSort} onChange={(event) => setTourSort(event.target.value)}><option value="popular">Phổ biến</option><option value="price-asc">Giá thấp trước</option><option value="price-desc">Giá cao trước</option><option value="rating">Đánh giá cao</option><option value="newest">Mới nhất</option></select></label>
          <button className="tour-filter-reset" type="button" onClick={() => { setTourQuery(''); setTourMinimumPrice(''); setTourMaximumPrice(''); setTourDepartureDate(''); setTourDuration(''); setTourDestination(''); setTourType(''); setTourMinimumRating(''); setTourSeats(''); setTourSort('popular'); setTourPage(1) }}>Xóa lọc</button>
        </div>
        <div className="tour-catalog-status"><Eyebrow>{route.page === 'promotional-tours' ? 'LIMITED-TIME OFFERS' : route.page === 'themed-tours' ? 'TRAVEL YOUR WAY' : route.page === 'international-tours' ? 'BEYOND BORDERS' : route.page === 'domestic-tours' ? 'LOCAL STORIES' : 'SMALL GROUP · BIG MEMORIES'}</Eyebrow><span role="status">{tourLoading ? 'Đang tìm tour...' : `Tìm thấy ${filteredTours.length} tour`}</span></div>
        {tourLoading ? <div className="tour-package-grid" aria-busy="true" aria-label="Đang tải tour">{Array.from({ length: 3 }, (_, index) => <div className="tour-package-skeleton" key={index}><span /><div><i /><i /><i /></div></div>)}</div>
          : filteredTours.length === 0 ? <div className="destination-state" role="status"><span>○</span><h2>Chưa có tour phù hợp</h2><p>Thử đổi bộ lọc hoặc từ khóa để xem thêm các hành trình đang mở.</p><button className="secondary-button" type="button" onClick={() => { setTourQuery(''); setTourMinimumPrice(''); setTourMaximumPrice(''); setTourDepartureDate(''); setTourDuration(''); setTourDestination(''); setTourType(''); setTourMinimumRating(''); setTourSeats('') }}>Xóa bộ lọc</button></div>
            : <><div className="tour-package-grid">{pageTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}</div>{pageCount > 1 && <nav className="tour-pagination" aria-label="Phân trang tour"><button type="button" disabled={tourPage === 1} onClick={() => setTourPage((page) => page - 1)}>← Trước</button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button key={page} className={page === tourPage ? 'is-active' : ''} aria-current={page === tourPage ? 'page' : undefined} type="button" onClick={() => setTourPage(page)}>{page}</button>)}<button type="button" disabled={tourPage === pageCount} onClick={() => setTourPage((page) => page + 1)}>Tiếp →</button></nav>}</>}
        {comparedTourIds.length > 0 && <div className="tour-compare-tray"><div><strong>{comparedTourIds.length} tour được chọn</strong><span>Chọn tối thiểu 2 tour để so sánh</span></div><div>{comparedTourIds.map((id) => <button type="button" key={id} onClick={() => toggleTourComparison(id)} aria-label={`Bỏ ${tourPackages.find((tour) => tour.id === id)?.title} khỏi so sánh`}>× {tourPackages.find((tour) => tour.id === id)?.title}</button>)}</div><button className="tour-compare-open" type="button" disabled={comparedTourIds.length < 2} onClick={() => setComparisonOpen((open) => !open)}>{comparisonOpen ? 'Đóng so sánh' : 'So sánh ngay'}</button>{comparisonOpen && <div className="tour-comparison-table">{comparisonRows.map((row) => <div className="tour-comparison-row" key={row.label}><strong>{row.label}</strong>{comparedTourIds.map((id) => { const tour = tourPackages.find((item) => item.id === id); return <span key={id}>{tour ? row.value(tour) : '—'}</span> })}</div>)}</div>}</div>}
      </section>
    )
  }

  function TourDetailPage() {
    const tour = tourPackages.find((item) => item.id === route.id)
    if (!tour) return NotFound({ onBack: () => navigate('tours') })
    const destination = store.destinations.find((item) => item.id === tour.destinationId)
    if (!destination) return NotFound({ onBack: () => navigate('tours') })
    const nextDeparture = tour.departures.find((departure) => departure.date >= TODAY_INPUT_DATE)
    const selectedDeparture = tour.departures.find((departure) => departure.date === bookingDate && departure.date >= TODAY_INPUT_DATE) ?? nextDeparture
    const related = tourPackages.filter((item) => item.id !== tour.id && (item.destinationId === tour.destinationId || item.type === tour.type)).slice(0, 3)
    const saved = store.wishlist.includes(tour.destinationId)
    const comparisonSelected = comparedTourIds.includes(tour.id)
    const compareTour = () => {
      if (!comparisonSelected && comparedTourIds.length >= 3) {
        setToast('Bạn có thể so sánh tối đa 3 tour cùng lúc.')
        return
      }
      setComparedTourIds((current) => current.includes(tour.id) ? current.filter((id) => id !== tour.id) : [...current, tour.id])
    }
    return (
      <article className="tour-detail-page section-wrap">
        <button className="back-link" type="button" onClick={() => navigate('tours')}><ArrowIcon left /> Về danh sách tour</button>
        <section className="tour-detail-hero"><div className="tour-detail-gallery"><img className="tour-detail-main-image" src={tour.gallery[detailSlide % tour.gallery.length]?.image} alt={tour.gallery[detailSlide % tour.gallery.length]?.alt} /><div className="tour-detail-thumbnails">{tour.gallery.map((photo, index) => <button type="button" key={photo.image} className={index === detailSlide % tour.gallery.length ? 'is-active' : ''} aria-label={`Xem ảnh ${index + 1}`} onClick={() => setDetailSlide(index)}><img src={photo.image} alt="" /></button>)}</div></div><div className="tour-detail-title"><div className="tour-detail-tags"><span>{tour.domestic ? 'TOUR TRONG NƯỚC' : 'TOUR QUỐC TẾ'}</span><span>{tour.type.toUpperCase()}</span>{tour.promotional && <span>ĐANG ƯU ĐÃI</span>}</div><h1>{tour.title}</h1><p>{tour.subtitle}</p><div className="tour-detail-meta"><span>★ {tour.rating.toFixed(1)} <small>({tour.reviewCount} đánh giá)</small></span><span>◷ {tour.durationDays} ngày {tour.durationDays - 1} đêm</span><span>♧ Nhóm tối đa {tour.maxGroupSize}</span></div><a className="tour-destination-link" href={`#/destination/${destination.id}`}>Khám phá điểm đến: {destination.province} <ArrowIcon /></a><div className="tour-detail-utility"><button className={`detail-save${saved ? ' is-saved' : ''}`} type="button" aria-pressed={saved} onClick={() => toggleWishlist(tour.destinationId)}>{saved ? '♥ Đã lưu điểm đến' : '♡ Lưu điểm đến'}</button><button type="button" onClick={compareTour}>{comparisonSelected ? '✓ Đã chọn so sánh' : '＋ Thêm vào so sánh'}</button></div></div></section>
        <div className="tour-detail-layout"><div className="tour-detail-content">
          <section className="tour-detail-block"><Eyebrow>ABOUT THE JOURNEY</Eyebrow><h2>Tổng quan hành trình</h2><p>{tour.overview}</p><ul className="tour-highlight-list">{tour.highlights.map((highlight) => <li key={highlight}><span>✳</span>{highlight}</li>)}</ul></section>
          <section className="tour-detail-block"><Eyebrow>DAY BY DAY</Eyebrow><h2>Lịch trình chi tiết</h2><div className="tour-itinerary">{tour.itinerary.map((day, index) => <details key={day.title} open={index === 0}><summary><span>NGÀY {String(index + 1).padStart(2, '0')}</span><strong>{day.title}</strong><span className="tour-itinerary-toggle">＋</span></summary><div className="tour-itinerary-content"><ul>{day.activities.map((activity) => <li key={activity}>{activity}</li>)}</ul><p><strong>Bữa ăn:</strong> {day.meals.join(' · ')}</p><p><strong>Lưu trú:</strong> {day.accommodation}</p></div></details>)}</div></section>
          <section className="tour-detail-block tour-logistics-grid"><article><Eyebrow>MEET YOUR GROUP</Eyebrow><h2>Điểm tập trung</h2><p><strong>Khởi hành:</strong> {tour.departureLocation}</p><p><strong>Kết thúc:</strong> {tour.arrivalLocation}</p><p><strong>Quy mô:</strong> tối đa {tour.maxGroupSize} khách</p></article><article><Eyebrow>STAY LOCAL</Eyebrow><h2>Lưu trú</h2><p>{tour.accommodation}</p></article></section>
          <section className="tour-detail-block tour-services-grid"><article><Eyebrow>WHAT'S INCLUDED</Eyebrow><h2>Giá tour bao gồm</h2><ul>{tour.included.map((item) => <li key={item}>✓ {item}</li>)}</ul></article><article><Eyebrow>NOT INCLUDED</Eyebrow><h2>Chưa bao gồm</h2><ul>{tour.excluded.map((item) => <li key={item}>– {item}</li>)}</ul></article></section>
          <section className="tour-guide-card"><span className="tour-guide-avatar">{tour.guide.name[0]}</span><div><Eyebrow>YOUR LOCAL EXPERT</Eyebrow><h2>{tour.guide.name}</h2><strong>{tour.guide.role}</strong><p>{tour.guide.description}</p></div></section>
          <section className="tour-detail-block"><Eyebrow>TRAVELER NOTES</Eyebrow><h2>Đánh giá từ khách đi trước</h2><div className="tour-review-list">{tour.reviews.map((review) => <article key={review.author}><div><strong>{review.author}</strong><span>★ {review.rating.toFixed(1)} · {review.date}</span></div><p>{review.content}</p></article>)}</div></section>
          <section className="tour-cancellation"><Eyebrow>BOOK WITH CONFIDENCE</Eyebrow><h2>Hủy và hoàn tiền</h2><ul>{tour.cancellationPolicy.map((policy) => <li key={policy}>{policy}</li>)}</ul><small>Chính sách minh họa cho tour demo. Điều khoản thực tế có thể khác theo nhà cung cấp.</small></section>
        </div><aside className="tour-booking-widget"><div className="tour-booking-price">{tour.discountPercent > 0 && <span>Ưu đãi demo −{tour.discountPercent}%</span>}<p><strong>{formatPrice(tour.price)}</strong><small> / khách</small></p><div>★ {tour.rating.toFixed(1)} · {tour.reviewCount} đánh giá</div></div><label>Ngày khởi hành<select aria-label="Chọn ngày khởi hành" disabled={!nextDeparture} value={selectedDeparture?.date ?? ''} onChange={(event) => setBookingDate(event.target.value)}>{tour.departures.filter((departure) => departure.date >= TODAY_INPUT_DATE).map((departure) => <option value={departure.date} key={departure.date}>{formatDate(departure.date)} · còn {departure.seats} chỗ</option>)}</select></label><label>Số khách<select aria-label="Chọn số khách tour" value={bookingGuestCount} onChange={(event) => setBookingGuestCount(Number(event.target.value))}>{Array.from({ length: Math.min(12, tour.maxGroupSize) }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} khách</option>)}</select></label><div className="tour-seat-note"><span>●</span> {selectedDeparture ? `Còn ${selectedDeparture.seats} chỗ trong nhóm` : 'Vui lòng liên hệ để chọn ngày'}</div><button className="modal-submit" type="button" disabled={!selectedDeparture || selectedDeparture.seats < bookingGuestCount} onClick={() => selectedDeparture && bookTour(tour, selectedDeparture.date, bookingGuestCount)}>{!nextDeparture ? 'Hết lịch khởi hành' : selectedDeparture && selectedDeparture.seats < bookingGuestCount ? 'Không đủ chỗ' : 'Giữ chỗ demo'} <ArrowIcon /></button><small>Chưa thu tiền · Xác nhận và thanh toán demo trên thiết bị.</small></aside></div>
        <section className="tour-related-section"><div className="section-heading"><div><Eyebrow>MORE JOURNEYS</Eyebrow><h2>Hành trình <em>liên quan.</em></h2></div><a className="section-note section-note--link" href="#/tours">Xem mọi tour <ArrowIcon /></a></div><div className="tour-package-grid">{related.map((item) => <TourCard tour={item} key={item.id} />)}</div></section>
      </article>
    )
  }

  function HomePage() {
    const featured = activeMood
      ? store.destinations.filter((destination) => destination.mood.includes(activeMood)).slice(0, 3)
      : store.destinations.slice(0, 3)
    const popularDestinations = [...store.destinations].sort((a, b) => b.rating - a.rating).slice(0, 4)
    const featuredTours = store.destinations.filter((destination) => destination.type === 'tour').slice(0, 3)
    const seasonalTrips = store.destinations.filter((destination) => ['ta-xua', 'cu-lao-cham', 'da-lat'].includes(destination.id)).slice(0, 3)
    const journalStories = [
      { destination: store.destinations.find((item) => item.id === 'hoi-an') ?? store.destinations[0], category: 'CULTURE NOTES', title: 'Hội An, khi phố cổ thuộc về những người thức sớm', image: 'https://images.unsplash.com/photo-1518128958364-65859d70aa41?auto=format&fit=crop&w=1000&q=82', read: '6 phút đọc' },
      { destination: store.destinations.find((item) => item.id === 'ta-xua') ?? store.destinations[0], category: 'FIELD JOURNAL', title: 'Một buổi bình minh không cần phải vội', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=82', read: '4 phút đọc' },
      { destination: store.destinations.find((item) => item.id === 'hue') ?? store.destinations[0], category: 'TASTE & PLACE', title: 'Nếm Huế qua một mâm cơm nhà', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=82', read: '5 phút đọc' },
    ].filter((story): story is typeof story & { destination: Destination } => Boolean(story.destination))
    return (
      <>
        <section className="hero" id="trang-chu">
          <img className="hero-image" src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=88" alt="Thung lũng xanh yên bình dưới ánh nắng sớm" fetchPriority="high" />
          <div className="hero-shade" />
          <div className="hero-content">
            <Eyebrow light>ĐI CHẬM, CẢM SÂU</Eyebrow>
            <h1>Cảm xúc dẫn lối<br />hành trình.</h1>
            <p className="hero-description">Không chỉ đi đến một nơi. Mà đi để trở về với những điều khiến mình thấy sống.</p>
            <a className="hero-link" href="#/explore">Chạm vào chuyến đi của bạn <ArrowIcon /></a>
          </div>
          <div className="hero-aside"><span className="hero-aside-line" /><span>01 — 06</span><span>Việt Nam, bằng một cách rất riêng</span></div>
          <div className="hero-caption">Mù Cang Chải, những ngày tháng chín</div>
          <a className="scroll-cue" href="#cam-xuc"><span /> Chạm để cảm nhận</a>
        </section>

        <section className="home-search-section section-wrap" aria-label="Tìm chuyến đi">
          <form className="home-search" onSubmit={searchFromHome}>
            <label className="home-search-field home-search-destination">
              <span className="home-search-icon" aria-hidden="true">⌕</span>
              <span><small>ĐIỂM ĐẾN</small><input aria-label="Bạn muốn đi đâu?" list="home-destinations" placeholder="Bạn muốn đi đâu?" value={homeDestination} onChange={(event) => setHomeDestination(event.target.value)} /><datalist id="home-destinations">{store.destinations.map((destination) => <option key={destination.id} value={destination.province} />)}</datalist></span>
            </label>
            <label className="home-search-field">
              <span className="home-search-icon" aria-hidden="true">↗</span>
              <span><small>KHỞI HÀNH</small><input aria-label="Ngày khởi hành" type="date" min={TODAY_INPUT_DATE} value={homeDeparture} onChange={(event) => setHomeDeparture(event.target.value)} /></span>
            </label>
            <label className="home-search-field">
              <span className="home-search-icon" aria-hidden="true">↙</span>
              <span><small>TRỞ VỀ</small><input aria-label="Ngày trở về" type="date" min={homeDeparture || TODAY_INPUT_DATE} value={homeReturn} onChange={(event) => setHomeReturn(event.target.value)} /></span>
            </label>
            <label className="home-search-field">
              <span className="home-search-icon" aria-hidden="true">♧</span>
              <span><small>DU KHÁCH</small><select aria-label="Số lượng khách" value={bookingGuestCount} onChange={(event) => setBookingGuestCount(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} người</option>)}</select></span>
            </label>
            <label className="home-search-field">
              <span className="home-search-icon" aria-hidden="true">₫</span>
              <span><small>NGÂN SÁCH / NGƯỜI</small><select aria-label="Ngân sách tối đa" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)}><option value="">Mọi mức giá</option><option value="2000000">Đến 2 triệu</option><option value="2500000">Đến 2,5 triệu</option><option value="3000000">Đến 3 triệu</option><option value="4000000">Đến 4 triệu</option></select></span>
            </label>
            <button type="submit" className="home-search-submit" aria-label="Tìm hành trình"><span aria-hidden="true">⌕</span><span className="home-search-submit-label">Tìm chuyến đi</span></button>
          </form>
        </section>

        <section className="discovery section-wrap" id="cam-xuc">
          <div className="discovery-intro">
            <Eyebrow>TRAVEL BY MOOD</Eyebrow>
            <h2>Hôm nay, bạn<br /><em>muốn cảm thấy</em> gì?</h2>
            <p className="muted-copy">Một hành trình đẹp thường bắt đầu từ cảm xúc. Chọn nhịp điệu của riêng bạn.</p>
          </div>
          <div className="mood-list mood-list--home" role="group" aria-label="Chọn cảm xúc cho chuyến đi">
            {HOME_MOODS.map((item) => (
              <button className={`mood-card${activeMood === item.mood ? ' is-selected' : ''}`} key={item.title} type="button" aria-pressed={activeMood === item.mood} onClick={() => { const selectedMood = activeMood === item.mood ? '' : item.mood; setActiveMood(selectedMood); setMood(selectedMood) }}>
                <span className="mood-icon" aria-hidden="true">{item.icon}</span>
                <span className="mood-text"><strong>{item.title}</strong><span>{item.note}</span></span><ArrowIcon />
              </button>
            ))}
          </div>
        </section>

        <section className="popular-section section-wrap">
          <div className="section-heading">
            <div><Eyebrow>PLACES WORTH THE JOURNEY</Eyebrow><h2>Những nơi <em>đáng nhớ.</em></h2></div>
            <a className="section-note section-note--link" href="#/explore">Khám phá mọi điểm đến <ArrowIcon /></a>
          </div>
          <div className="popular-grid">
            {popularDestinations.map((destination, index) => (
              <button className={`popular-card popular-card--${index + 1}`} type="button" key={destination.id} onClick={() => navigate('destination', destination.id)}>
                <img src={destination.image} alt={destination.imageAlt} loading="lazy" />
                <span className="popular-card-shade" />
                <span className="popular-card-copy"><small>{destination.region} · {destination.rating.toFixed(1)} ★</small><strong>{destination.province.split(',')[0]}</strong><span>{destination.name} <ArrowIcon /></span></span>
              </button>
            ))}
          </div>
        </section>

        <section className="journeys-section">
          <div className="section-wrap">
            <div className="section-heading">
              <div><Eyebrow>NHỮNG CHUYẾN ĐI ĐANG CHỜ</Eyebrow><h2>Mở cửa, thấy <em>mình.</em></h2></div>
              <a className="section-note section-note--link" href="#/explore">Tìm trong {store.destinations.length} hành trình <ArrowIcon /></a>
            </div>
            <div className="home-results">{ResultsGrid({ items: featured })}</div>
            <a className="all-trips-link" href="#/explore">Khám phá theo cách của bạn <ArrowIcon /></a>
          </div>
        </section>

        <section className="collection-strip section-wrap">
          <div className="section-heading">
            <div><Eyebrow>GOM NHỮNG ĐIỀU MÌNH THÍCH</Eyebrow><h2>Một miền đất,<br /><em>nhiều cảm xúc.</em></h2></div>
            <a className="section-note section-note--link" href="#/collections">Xem mọi bộ sưu tập <ArrowIcon /></a>
          </div>
          <div className="collection-grid collection-grid--home">
            {collections.map((collection) => <span className="collection-card-holder" key={collection.id}>{CollectionCard({ collection, onExplore: (selectedMood) => { setMood(selectedMood); navigate('explore') } })}</span>)}
          </div>
        </section>

        <section className="tour-section section-wrap">
          <div className="section-heading">
            <div><Eyebrow>THOÁT KHỎI LỊCH TRÌNH QUEN</Eyebrow><h2>Tour được <em>chọn riêng.</em></h2></div>
            <a className="section-note section-note--link" href="#/explore">Xem mọi hành trình <ArrowIcon /></a>
          </div>
          <div className="tour-grid">
            {featuredTours.map((destination, index) => {
              const discount = [15, 10, 12][index % 3]
              return (
                <article className="tour-card" key={destination.id}>
                  <button className="tour-image-button" type="button" onClick={() => navigate('destination', destination.id)} aria-label={`Xem ${destination.name}`}>
                    <img src={destination.image} alt={destination.imageAlt} loading="lazy" />
                    <span className="discount-badge">ƯU ĐÃI DEMO −{discount}%</span>
                    <span className="tour-rating">★ {destination.rating.toFixed(1)}</span>
                  </button>
                  <div className="tour-card-copy">
                    <span className="tour-location">{destination.province} <span>·</span> {destination.type === 'tour' ? 'Local tour' : 'Stay'}</span>
                    <h3><a href={`#/destination/${destination.id}`}>{destination.name}</a></h3>
                    <div className="tour-meta"><span>◷ {destination.duration}</span><span>✦ {destination.rating.toFixed(1)} rating</span></div>
                    <div className="tour-price-line"><span><del>{formatPrice(Math.round(destination.price * (1 + discount / 100)))}</del><strong>{formatPrice(destination.price)}</strong><small> / người</small></span><button type="button" onClick={() => openBooking(destination)}>Đặt chuyến <ArrowIcon /></button></div>
                  </div>
                </article>
              )
            })}
          </div>
          <p className="demo-caption">Giá và ưu đãi hiển thị chỉ nhằm minh họa giao diện demo.</p>
        </section>

        <section className="seasonal-section">
          <div className="section-wrap">
            <div className="section-heading">
              <div><Eyebrow>SEASONAL ESCAPES</Eyebrow><h2>Mùa này, mình <em>đi đâu?</em></h2></div>
              <span className="section-note">Những gợi ý nhỏ cho một mùa thật đáng nhớ.</span>
            </div>
            <div className="seasonal-grid">
              {seasonalTrips.map((destination, index) => (
                <article className="seasonal-card" key={destination.id}>
                  <img src={destination.image} alt={destination.imageAlt} loading="lazy" />
                  <div className="seasonal-shade" />
                  <div className="seasonal-copy"><span>{['MÙA SĂN MÂY', 'MÙA BIỂN XANH', 'MÙA ĐI TRỐN'][index]}</span><h3>{destination.province.split(',')[0]}</h3><p>{destination.season} · {destination.duration}</p><button type="button" onClick={() => navigate('destination', destination.id)}>Xem ưu đãi <ArrowIcon /></button></div>
                </article>
              ))}
            </div>
            <p className="demo-caption">Ưu đãi mùa vụ là nội dung minh họa, không áp dụng giao dịch thật.</p>
          </div>
        </section>

        <section className="manifesto section-wrap" id="ve-moc">
          <div className="manifesto-image"><img src="https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=82" alt="Hai chú hươu thong thả giữa khu rừng xanh" loading="lazy" /><span className="image-note">ĐỂ THIÊN NHIÊN KỂ CHUYỆN</span></div>
          <div className="manifesto-copy">
            <Eyebrow>MỘC TIN RẰNG</Eyebrow>
            <h2>Đi xa đến đâu,<br />cũng là để <em>lắng nghe.</em></h2>
            <p>Chạm vào tiếng sóng không vội. Một người bạn đường mới. Hay chính mình của những ngày đã bỏ quên. Mỗi hành trình của Mộc bắt đầu từ cảm xúc bạn muốn mang theo.</p>
            <a className="manifesto-link" href="#/planner">Lên lịch trình theo cách của bạn <ArrowIcon /></a>
            <div className="manifesto-signature">đi chậm thôi, mình còn cả một đời.</div>
          </div>
        </section>
        <section className="reviews-section section-wrap">
          <div className="section-heading"><div><Eyebrow>NOTES FROM THE ROAD</Eyebrow><h2>Những câu chuyện <em>mang về.</em></h2></div><div className="review-score"><strong>4.9</strong><span>★★★★★<small>Đánh giá demo từ cộng đồng Mộc</small></span></div></div>
          <div className="review-grid">
            {[
              { quote: 'Mình tưởng là đi trốn khỏi thành phố. Hóa ra là đang đi tìm lại một phiên bản rất lâu rồi chưa gặp.', name: 'Minh Anh', trip: 'Hành trình Tà Xùa', initials: 'MA' },
              { quote: 'Điều mình nhớ nhất không phải cảnh đẹp, mà là bữa cơm và câu chuyện của người chị chủ nhà.', name: 'Thu Hà', trip: 'Một ngày ở Hội An', initials: 'TH' },
              { quote: 'Mọi thứ vừa đủ chậm để mình thật sự nhìn thấy hòn đảo, và những người đang sống ở đó.', name: 'Quốc Bảo', trip: 'Cù Lao Chàm xanh', initials: 'QB' },
            ].map((review) => <article className="review-card" key={review.name}><div className="review-stars" aria-label="5 trên 5 sao">★★★★★</div><blockquote>“{review.quote}”</blockquote><div className="review-person"><span>{review.initials}</span><div><strong>{review.name}</strong><small>{review.trip} · Review demo</small></div></div></article>)}
          </div>
        </section>

        <section className="journal-section">
          <div className="section-wrap">
            <div className="section-heading"><div><Eyebrow>THE MỘC JOURNAL</Eyebrow><h2>Đọc một chút,<br /><em>mơ thêm nhiều.</em></h2></div><a className="section-note section-note--link" href="#/journal">Xem mọi câu chuyện <ArrowIcon /></a></div>
            <div className="journal-grid">
              {journalStories.map((story) => {
                const article = JOURNAL_STORIES.find((item) => item.destinationId === story.destination?.id)
                if (!article) return null
                return <article className="journal-card" key={story.destination.id}><button type="button" className="journal-image" onClick={() => navigate('blog', article.id)} aria-label={`Đọc: ${story.title}`}><img src={story.image} alt="" loading="lazy" /></button><div className="journal-copy"><span>{story.category} · {story.read}</span><h3><a href={`#/blog/${article.id}`}>{story.title}</a></h3><button type="button" onClick={() => navigate('blog', article.id)}>Đọc câu chuyện <ArrowIcon /></button></div></article>
              })}
            </div>
          </div>
        </section>

        <section className="newsletter-section">
          <div className="newsletter-inner section-wrap"><div><Eyebrow light>A LETTER FROM MỘC</Eyebrow><h2>Một lá thư nhỏ,<br /><em>một miền đất mới.</em></h2><p>Nhận cảm hứng du lịch, câu chuyện địa phương và những gợi ý chỉ gửi thật thưa.</p></div><form className="newsletter-form" onSubmit={subscribeToNewsletter}><label htmlFor="newsletter-email">Địa chỉ email</label><div><input id="newsletter-email" type="email" autoComplete="email" placeholder="you@example.com" value={newsletterEmail} onChange={(event) => { setNewsletterEmail(event.target.value); setNewsletterMessage('') }} required /><button type="submit">Đăng ký <ArrowIcon /></button></div><small role="status">{newsletterMessage || 'Bản tin demo · Không gửi email thật và bạn có thể dừng bất cứ lúc nào.'}</small></form></div>
        </section>

        <section className="closing-cta"><img src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2000&q=82" alt="" loading="lazy" /><div className="closing-overlay" /><div className="closing-content"><Eyebrow light>MỘT CẢM XÚC ĐANG GỌI TÊN</Eyebrow><h2>Hành trình tiếp theo<br />của bạn, bắt đầu từ đây.</h2><a href="#/planner">Đi tìm cảm xúc ấy <ArrowIcon /></a></div></section>
      </>
    )
  }

  function CollectionCard({ collection, onExplore }: { collection: typeof collections[number]; onExplore: (mood: string) => void }) {
    return (
      <article className="collection-card">
        <img src={collection.image} alt="" loading="lazy" />
        <div className="collection-shade" />
        <div className="collection-content"><span>{collection.mood} · {collection.destinations.length} hành trình</span><h3>{collection.title}</h3><p>{collection.note}</p><button type="button" onClick={() => onExplore(collection.mood)}>Chạm để khám phá <ArrowIcon /></button></div>
      </article>
    )
  }

  function ExplorePage() {
    return (
      <section className="page-section section-wrap">
        {PageIntro({ eyebrow: 'TÌM THEO CẢM XÚC, ĐI THEO CÁCH RIÊNG', title: <>Một chuyến đi<br /><em>đúng tâm trạng.</em></>, description: 'Mộc gom những tour địa phương và nơi ở thân tình thành các gợi ý có thật. Lọc cho đến khi tìm thấy điều chạm tới bạn.' })}
        {travelDates && <p className="search-trip-note" role="status">Đang tìm cho {bookingGuestCount} {bookingGuestCount === 1 ? 'du khách' : 'du khách'}{travelDates.departure ? ` · khởi hành ${formatDate(travelDates.departure)}` : ''}{travelDates.returnDate ? ` · trở về ${formatDate(travelDates.returnDate)}` : ''}. Ngày đi và số khách sẽ được giữ sẵn khi bạn mở đặt chỗ demo.</p>}
        {SearchAndFilters({})}
        {ResultsGrid({})}
      </section>
    )
  }

  function CollectionsPage() {
    return (
      <section className="page-section section-wrap">
        {PageIntro({ eyebrow: 'BỘ SƯU TẬP CỦA MỘC', title: <>Những chuyến đi<br /><em>có cùng nhịp.</em></>, description: 'Mỗi bộ sưu tập là một câu chuyện nhỏ — để bạn bắt đầu từ cảm xúc, rồi tự viết tiếp hành trình của mình.' })}
        <div className="collection-grid">
          {collections.map((collection) => <span className="collection-card-holder" key={collection.id}>{CollectionCard({ collection, onExplore: (selectedMood) => { setMood(selectedMood); navigate('explore') } })}</span>)}
        </div>
      </section>
    )
  }

  function DetailPage() {
    const destination = store.destinations.find((item) => item.id === route.id)
    if (!destination) return NotFound({ onBack: () => navigate('explore') })
    const guide = getDestinationGuide(destination)
    const country = getDestinationCountry(destination)
    const category = getDestinationCategory(destination)
    const relatedTours = tourPackages.filter((tour) => tour.destinationId === destination.id)
    const relatedDestinations = store.destinations
      .filter((item) => item.id !== destination.id && getDestinationCategory(item) === category)
      .slice(0, 3)
    const gallery = guide.gallery
    const activeSlide = detailSlide % gallery.length
    const shownSlide = gallery[activeSlide]
    function moveSlide(direction: -1 | 1) {
      setDetailSlide((current) => (current + direction + gallery.length) % gallery.length)
    }
    return (
      <section className="detail-page section-wrap">
        <button className="back-link" type="button" onClick={() => navigate('explore')}><ArrowIcon left /> Về khám phá</button>
        <div className="detail-hero" tabIndex={0} role="region" aria-label={`Thư viện ảnh ${destination.name}`} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') moveSlide(-1)
          if (event.key === 'ArrowRight') moveSlide(1)
        }}>
          <img src={shownSlide.image} alt={shownSlide.alt} />
          <span>{destination.label}</span>
          <div className="gallery-controls">
            <button type="button" aria-label="Ảnh trước" onClick={() => moveSlide(-1)}><ArrowIcon left /></button>
            <span aria-live="polite">{String(activeSlide + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</span>
            <button type="button" aria-label="Ảnh tiếp theo" onClick={() => moveSlide(1)}><ArrowIcon /></button>
          </div>
          <div className="gallery-dots" role="group" aria-label="Chọn ảnh">
            {gallery.map((_, index) => <button key={`${destination.id}-gallery-${index}`} type="button" aria-label={`Xem ảnh ${index + 1}`} aria-pressed={index === activeSlide} onClick={() => setDetailSlide(index)} />)}
          </div>
        </div>
        <div className="detail-columns">
          <div className="detail-story">
            <Eyebrow>{country.toUpperCase()} · {category.toUpperCase()} · {destination.province.toUpperCase()}</Eyebrow>
            <h1>{destination.name}</h1>
            <p className="detail-description">{destination.description}</p>
            <section className="destination-detail-section">
              <Eyebrow>THE PLACE</Eyebrow><h2>Tổng quan điểm đến</h2><p>{guide.overview}</p>
            </section>
            <h2>Điều mình sẽ nhớ</h2>
            <ul className="highlight-list">{destination.highlights.map((highlight) => <li key={highlight}><span aria-hidden="true">✳</span>{highlight}</li>)}</ul>
            <section className="destination-guide-grid">
              <article className="destination-guide-card"><span aria-hidden="true">⌖</span><div><Eyebrow>DON'T MISS</Eyebrow><h2>Điểm tham quan</h2><ul>{guide.attractions.map((attraction) => <li key={attraction}>{attraction}</li>)}</ul></div></article>
              <article className="destination-guide-card"><span aria-hidden="true">☼</span><div><Eyebrow>WHEN TO GO</Eyebrow><h2>Thời điểm đẹp nhất</h2><p>{guide.bestTime}</p></div></article>
              <article className="destination-guide-card"><span aria-hidden="true">₫</span><div><Eyebrow>PLAN YOUR BUDGET</Eyebrow><h2>Ngân sách ước tính</h2><p>{guide.estimatedBudget}</p><small>Chi phí tham khảo, có thể thay đổi theo mùa.</small></div></article>
              <article className="destination-guide-card"><span aria-hidden="true">◌</span><div><Eyebrow>LOCAL FLAVORS</Eyebrow><h2>Món ngon địa phương</h2><ul>{guide.cuisine.map((dish) => <li key={dish}>{dish}</li>)}</ul></div></article>
            </section>
            <section className="destination-transport"><Eyebrow>GETTING THERE</Eyebrow><h2>Di chuyển đến đây</h2><p>{guide.transportation}</p></section>
            <section className="host-story"><div className="host-avatar" aria-hidden="true">{destination.host[0]}</div><div><Eyebrow>LOCAL HOST CỦA MỘC</Eyebrow><h2>{destination.host}</h2><p>{destination.hostStory}</p></div></section>
            <section className="destination-map-section"><div className="destination-map-heading"><div><Eyebrow>FIND YOUR WAY</Eyebrow><h2>Điểm đến trên bản đồ</h2><p>{destination.province} · {country}</p></div><a href={`https://www.google.com/maps/search/?api=1&query=${guide.latitude},${guide.longitude}`} target="_blank" rel="noreferrer">Mở bản đồ <ArrowIcon /></a></div><iframe title={`Bản đồ ${destination.province}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=${guide.latitude},${guide.longitude}&z=10&output=embed`} /></section>
            <section className="destination-reviews">
              <div className="destination-reviews-heading"><div><Eyebrow>NOTES FROM TRAVELERS</Eyebrow><h2>Lời kể sau chuyến đi</h2></div><span className="destination-review-summary"><strong>★ {destination.rating.toFixed(1)}</strong><small>Đánh giá demo</small></span></div>
              <div className="destination-review-list">{guide.reviews.map((review) => <article className="destination-review" key={review.author}><div className="destination-review-top"><span className="review-avatar">{review.author.split(' ').map((part) => part[0]).join('')}</span><div><strong>{review.author}</strong><small>{review.location} · {review.date}</small></div><span className="review-rating">★ {review.rating.toFixed(1)}</span></div><p>{review.content}</p></article>)}{reviewSubmitted && <article className="destination-review destination-review--new"><div className="destination-review-top"><span className="review-avatar">B</span><div><strong>Bạn</strong><small>Vừa chia sẻ · Review demo</small></div><span className="review-rating">★ {reviewRating.toFixed(1)}</span></div><p>{reviewText}</p></article>}</div>
              {!reviewSubmitted ? <form className="destination-review-form" onSubmit={(event) => { event.preventDefault(); setReviewSubmitted(true); setToast('Cảm ơn bạn đã chia sẻ đánh giá demo.') }}><label><span>Đánh giá của bạn</span><span className="review-star-picker">{Array.from({ length: 5 }, (_, index) => <button key={index} type="button" aria-label={`${index + 1} sao`} aria-pressed={reviewRating === index + 1} onClick={() => setReviewRating(index + 1)}>{index < reviewRating ? '★' : '☆'}</button>)}</span></label><label><span>Chia sẻ cảm nhận</span><textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} minLength={8} maxLength={500} required placeholder="Điều gì khiến chuyến đi này đáng nhớ?" /></label><button className="secondary-button" type="submit">Gửi đánh giá demo <ArrowIcon /></button><small>Đánh giá chỉ hiển thị trong phiên demo này.</small></form> : <p className="review-submitted-note" role="status">Cảm ơn bạn, đánh giá demo đã được thêm vào trang này.</p>}
            </section>
          </div>
          <aside className="detail-booking">
            <div className="detail-rating">✦ {destination.rating.toFixed(1)} <span>· {guide.reviews.length} đánh giá demo</span></div>
            <h2>{formatPrice(destination.price)} <span>/ người</span></h2>
            <p>{destination.duration} · {destination.season}</p>
            <div className="detail-moods">{destination.mood.map((item) => <span key={item}>{item}</span>)}</div>
            <button className="modal-submit" type="button" onClick={() => openBooking(destination)}>Chọn hành trình này <ArrowIcon /></button>
            <small>Đặt chỗ demo · Chưa thu tiền, không cần thẻ thanh toán.</small>
            <button className="detail-save" type="button" aria-pressed={store.wishlist.includes(destination.id)} onClick={() => toggleWishlist(destination.id)}>{store.wishlist.includes(destination.id) ? '♥ Đã lưu vào danh sách' : '♡ Lưu vào danh sách yêu thích'}</button>
          </aside>
        </div>
        <section className="related-destinations">
          <div className="section-heading"><div><Eyebrow>KEEP EXPLORING</Eyebrow><h2>Đi tiếp từ <em>{destination.province.split(',')[0]}.</em></h2></div><a className="section-note section-note--link" href="#/tours">Tất cả tour <ArrowIcon /></a></div>
          {relatedTours.length > 0 && <div className="related-tour-list"><h3>Tour & trải nghiệm liên quan</h3><div className="related-tour-grid">{relatedTours.map((tour) => <TourCard tour={tour} key={tour.id} />)}</div></div>}
          {relatedDestinations.length > 0 && <div className="related-place-list"><h3>Có thể bạn cũng thích</h3><div>{relatedDestinations.map((place) => <button type="button" key={place.id} onClick={() => navigate('destination', place.id)}><img src={place.image} alt="" loading="lazy" /><span>{place.province}<small>{getDestinationCategory(place)}</small></span><ArrowIcon /></button>)}</div></div>}
        </section>
      </section>
    )
  }

  function PlannerPage() {
    const itinerary = store.itinerary
    const canAdd = store.destinations.length > 0
    const tripDays = getTripDurationDays(itinerary.startDate, itinerary.endDate)
    const total = itinerary.items.reduce((sum, item) => {
      const destination = store.destinations.find((place) => place.id === item.destinationId)
      return sum + (destination?.price ?? 0)
    }, 0)
    function updateItem(index: number, direction: -1 | 1) {
      changeItinerary((current) => {
        const items = [...current.items]
        const target = index + direction
        if (target < 0 || target >= items.length) return current
        ;[items[index], items[target]] = [items[target], items[index]]
        return { ...current, items }
      })
    }
    return (
      <section className="page-section section-wrap planner-page">
        {PageIntro({ eyebrow: 'JOURNEY PLANNER · BẢN DEMO LƯU TRÊN THIẾT BỊ', title: <>Một hành trình<br /><em>mang tên mình.</em></>, description: 'Chọn ngày đi, thêm những nơi muốn ghé. Mộc giúp bạn xếp từng điểm đến và ước tính ngân sách — cứ thay đổi cho đến khi vừa vặn.' })}
        <div className="planner-layout">
          <div className="planner-form">
            <label><span>Tên hành trình</span><input value={itinerary.title} maxLength={70} onChange={(event) => changeItinerary((current) => ({ ...current, title: event.target.value }))} placeholder="Ví dụ: Một tuần thật xanh" /></label>
            <div className="planner-dates">
              <label><span>Ngày khởi hành</span><input type="date" min={TODAY_INPUT_DATE} value={itinerary.startDate} onChange={(event) => changeItinerary((current) => ({ ...current, startDate: event.target.value }))} /></label>
              <label><span>Ngày trở về</span><input type="date" min={itinerary.startDate || TODAY_INPUT_DATE} value={itinerary.endDate} onChange={(event) => changeItinerary((current) => ({ ...current, endDate: event.target.value }))} /></label>
            </div>
            {itinerary.startDate && itinerary.endDate && itinerary.endDate < itinerary.startDate && <p className="form-error" role="alert">Ngày trở về cần sau ngày khởi hành.</p>}
            <label><span>Thêm một nơi mình muốn chạm tới</span><select defaultValue="" aria-label="Thêm điểm đến vào hành trình" disabled={!canAdd} onChange={(event) => {
              const destinationId = event.target.value
              if (!destinationId) return
              changeItinerary((current) => ({ ...current, items: [...current.items, { destinationId, day: Math.min(tripDays, current.items.length + 1) }] }))
              event.target.value = ''
            }}><option value="">Chọn điểm đến...</option>{store.destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.province} — {destination.name}</option>)}</select></label>
            <div className="planner-tip"><span aria-hidden="true">✳</span> Mẹo nhỏ: các điểm đến trong hành trình có thể ghé hơn một lần. Ước tính chưa bao gồm vé di chuyển giữa các tỉnh.</div>
          </div>
          <aside className="planner-summary"><Eyebrow>HÀNH TRÌNH CỦA BẠN</Eyebrow><h2>{itinerary.title || 'Chuyến đi chưa đặt tên'}</h2><p>{formatDate(itinerary.startDate)} — {formatDate(itinerary.endDate)} · {tripDays} ngày</p><div className="planner-total"><span>{itinerary.items.length} điểm chạm</span><strong>{formatPrice(total)}</strong><small>Ước tính, mỗi người</small></div><button className="secondary-button" type="button" onClick={() => navigate('explore')}>Tìm thêm cảm hứng <ArrowIcon /></button></aside>
        </div>
        <div className="itinerary-list"><div className="list-heading"><h2>Những nơi sẽ ghé</h2><span>{itinerary.items.length} điểm đến</span></div>
          {itinerary.items.length ? itinerary.items.map((item, index) => {
            const destination = store.destinations.find((place) => place.id === item.destinationId)
            if (!destination) return null
            return <article className="itinerary-item" key={`${destination.id}-${index}`}><span className="itinerary-day">NGÀY {Math.min(item.day, tripDays)}</span><img src={destination.image} alt="" loading="lazy" /><div className="itinerary-place"><strong>{destination.name}</strong><span>{destination.province} · {formatPrice(destination.price)}</span></div><div className="itinerary-actions"><button type="button" aria-label={`Chuyển ${destination.name} lên`} disabled={index === 0} onClick={() => updateItem(index, -1)}>↑</button><button type="button" aria-label={`Chuyển ${destination.name} xuống`} disabled={index === itinerary.items.length - 1} onClick={() => updateItem(index, 1)}>↓</button><button type="button" aria-label={`Xóa ${destination.name}`} onClick={() => changeItinerary((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}>×</button></div></article>
          }) : <div className="planner-empty"><p>Chưa có điểm dừng nào. Những hành trình hợp tâm trạng đang đợi bạn ở trang khám phá.</p><a className="text-button" href="#/explore">Tìm một nơi để bắt đầu <ArrowIcon /></a></div>}
        </div>
      </section>
    )
  }

  function WishlistPage() {
    const saved = store.destinations.filter((destination) => store.wishlist.includes(destination.id))
    return <section className="page-section section-wrap">{PageIntro({ eyebrow: 'NHỮNG NƠI BẠN MUỐN CHẠM TỚI', title: <>Để dành cho<br /><em>ngày mình đi.</em></>, description: 'Những hành trình được lưu ở thiết bị này, để bạn có thể quay lại khi cảm xúc đã sẵn sàng.' })}{saved.length ? ResultsGrid({ items: saved }) : <div className="empty-state wishlist-empty"><span aria-hidden="true">♡</span><h3>Chưa có hành trình nào được lưu</h3><p>Chạm vào biểu tượng trái tim trên chuyến đi bạn thích, Mộc sẽ giữ lại ở đây.</p><a className="text-button" href="#/explore">Tìm cảm hứng <ArrowIcon /></a></div>}</section>
  }

  function BookingsPage() {
    const bookings = store.bookings.filter((booking) => store.user?.role === 'admin'
      || booking.customerId === store.user?.id
      || (!booking.customerId && booking.customerEmail === store.user?.email))
    return <section className="page-section section-wrap">{PageIntro({ eyebrow: 'CHUYẾN ĐI ĐÃ HẸN', title: <>Mình đã hẹn<br /><em>một ngày xanh.</em></>, description: 'Các yêu cầu đặt chỗ demo được lưu trên thiết bị. Chưa có khoản thanh toán nào được thực hiện.' })}
      {bookings.length ? <div className="booking-list">{bookings.map((booking) => <article className="booking-row" key={booking.id}><div className="booking-row-info"><span className={`booking-status booking-status--${booking.status}`}>{booking.status === 'upcoming' ? 'Đã gửi yêu cầu · Demo' : booking.status === 'cancelled' ? 'Đã hủy' : 'Đã hoàn thành'}</span><h2>{booking.destinationName}</h2><p>{formatDate(booking.date)} · {booking.guests} người · Mã {booking.id}</p></div><div className="booking-row-total"><strong>{formatPrice(booking.total)}</strong><span>Đã gồm phí demo {formatPrice(booking.serviceFee)}</span>{booking.status === 'upcoming' && <button className="cancel-link" type="button" onClick={() => setCancellingBooking(booking)}>Hủy yêu cầu</button>}</div></article>)}</div> : <div className="empty-state"><span aria-hidden="true">⌁</span><h3>Chưa có chuyến đi được hẹn</h3><p>Khi một hành trình chạm tới bạn, mình có thể bắt đầu từ một lời hẹn nhỏ.</p><a className="text-button" href="#/explore">Khám phá hành trình <ArrowIcon /></a></div>}</section>
  }

  function NotificationsPage() {
    const notifications = store.bookings
      .filter((booking) => store.user?.role === 'admin'
        || booking.customerId === store.user?.id
        || (!booking.customerId && booking.customerEmail === store.user?.email))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return <section className="page-section section-wrap">
      {PageIntro({ eyebrow: 'NHỮNG ĐIỀU ĐANG ĐỢI BẠN', title: <>Một lời nhắc<br /><em>về ngày xanh.</em></>, description: 'Thông tin dưới đây được tạo từ những lời hẹn demo trên thiết bị, không có thông báo gửi từ máy chủ.' })}
      {notifications.length ? <div className="notification-list">{notifications.map((booking) => <article className="notification-card" key={booking.id}><span className={`booking-status booking-status--${booking.status}`}>{booking.status === 'upcoming' ? 'Lời hẹn đã ghi nhận' : booking.status === 'cancelled' ? 'Lời hẹn đã hủy' : 'Hành trình đã hoàn thành'}</span><h2>{booking.destinationName}</h2><p>{formatDate(booking.date)} · {booking.guests} người · Mã {booking.id}</p><a className="text-button" href="#/bookings">Xem lời hẹn <ArrowIcon /></a></article>)}</div> : <div className="empty-state"><span aria-hidden="true">⌁</span><h3>Mọi thứ đang yên ắng</h3><p>Khi bạn gửi một lời hẹn demo, thông tin sẽ được lưu và hiện ở đây.</p><a className="text-button" href="#/explore">Tìm một chuyến đi <ArrowIcon /></a></div>}
    </section>
  }

  function ProfilePage() {
    const customerBookings = store.bookings.filter((booking) => store.user
      && (booking.customerId === store.user.id
        || (!booking.customerId && booking.customerEmail === store.user.email)))
    function logout() {
      setLogoutPending(true)
    }
    return <section className="page-section section-wrap">{PageIntro({ eyebrow: 'GÓC NHỎ CỦA BẠN', title: <>Đi đâu, cũng<br /><em>là chuyện của mình.</em></>, description: `Xin chào ${store.user?.name}. Dữ liệu hồ sơ, chuyến đi và nơi đã lưu được giữ trên thiết bị này.` })}
      <div className="dashboard-grid"><a className="dashboard-tile" href="#/bookings"><span>01</span><strong>{customerBookings.length}</strong><span>lời hẹn demo</span><ArrowIcon /></a><a className="dashboard-tile" href="#/wishlist"><span>02</span><strong>{store.wishlist.length}</strong><span>nơi muốn chạm tới</span><ArrowIcon /></a><a className="dashboard-tile" href="#/planner"><span>03</span><strong>{store.itinerary.items.length}</strong><span>điểm trong lịch trình</span><ArrowIcon /></a></div>
      <div className="profile-card"><div className="host-avatar" aria-hidden="true">{store.user?.name[0]}</div><div><span className="profile-role">TÀI KHOẢN DEMO · {store.user?.role === 'customer' ? 'KHÁCH ĐI' : store.user?.role.toUpperCase()}</span><h2>{store.user?.name}</h2><p>{store.user?.email}</p></div><button className="text-button" type="button" onClick={logout}>Đăng xuất</button></div>
      {store.user?.role === 'provider' && <a className="text-button" href="#/provider">Mở không gian Local Host <ArrowIcon /></a>}
      {store.user?.role === 'admin' && <a className="text-button" href="#/admin">Mở quản trị demo <ArrowIcon /></a>}
    </section>
  }

  function LoginPage() {
    return <section className="page-section section-wrap auth-page">{PageIntro({ eyebrow: 'MỘC LÀ MỘT LỜI MỜI', title: <>Mỗi hành trình<br /><em>bắt đầu bằng chạm.</em></>, description: 'Tạo hồ sơ demo hoặc vào thử bằng một trong ba vai trò. Không gửi thông tin đến máy chủ.' })}<div className="auth-layout">
      <form className="planner-form auth-form" onSubmit={registerCustomer}><Eyebrow>TẠO HỒ SƠ KHÁCH ĐI</Eyebrow><label><span>Tên bạn muốn được gọi</span><input name="name" autoComplete="name" minLength={2} maxLength={70} placeholder="Tên của bạn" required /></label><label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label><button className="modal-submit" type="submit">Tạo hồ sơ trên thiết bị này <ArrowIcon /></button></form>
      <div className="demo-role-list"><Eyebrow>HOẶC KHÁM PHÁ VỚI TÀI KHOẢN DEMO</Eyebrow>{demoUsers.map((user) => <button className="demo-role" key={user.id} type="button" onClick={() => loginAs(user)}><span>{user.role === 'customer' ? '01' : user.role === 'provider' ? '02' : '03'}</span><strong>{user.role === 'customer' ? 'Khách đi' : user.role === 'provider' ? 'Local Host' : 'Quản trị demo'}</strong><small>{user.name}</small><ArrowIcon /></button>)}<p className="demo-notice">Phân vai chỉ phục vụ trình diễn trên giao diện. Không có xác thực hay phân quyền phía máy chủ.</p></div>
    </div></section>
  }

  function ConfirmationPage() {
    const booking = bookingConfirmation ?? store.bookings.find((item) => item.id === route.id)
    if (!booking) return NotFound({ onBack: () => navigate('bookings') })
    return <section className="page-section section-wrap confirmation-page"><div className="success-icon" aria-hidden="true">✓</div><Eyebrow>ĐÃ GHI LẠI LỜI HẸN DEMO</Eyebrow><h1>Một hành trình<br /><em>đang đến gần.</em></h1><p className="confirmation-copy">Mộc đã lưu yêu cầu cho {booking.destinationName}. Chưa có khoản thanh toán hoặc liên hệ tự động nào được thực hiện.</p><div className="confirmation-summary"><span>Mã demo</span><strong>{booking.id}</strong><span>Khởi hành · {formatDate(booking.date)} · {booking.guests} người</span><strong>{formatPrice(booking.total)} <small>đã gồm phí demo</small></strong></div><div className="confirmation-actions"><a className="modal-submit" href="#/bookings">Xem lịch sử đặt chỗ <ArrowIcon /></a><a className="secondary-button" href="#/explore">Tìm hành trình khác</a></div></section>
  }

  function ProviderPage() {
    if (store.user?.role !== 'provider') return AccessDenied()
    const providerName = store.user?.name ?? 'Local Host'
    const myBookings = store.bookings.filter((booking) => booking.status === 'upcoming')
    function createService(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const destination: Destination = {
        id: createDemoId('host'), name: providerServiceName.trim(), region: 'Trải nghiệm mới', province: 'Đang cập nhật địa điểm',
        mood: ['Bình yên'], type: 'tour', price: Number(providerServicePrice), rating: 5, duration: '1 ngày',
        season: 'Quanh năm', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=82',
        imageAlt: 'Cảnh thiên nhiên trong chuyến đi địa phương', label: 'Trải nghiệm mới',
        host: providerName, hostStory: 'Local Host của Mộc chia sẻ câu chuyện địa phương.',
        description: 'Trải nghiệm demo vừa được tạo trong không gian đối tác trên thiết bị này.',
        highlights: ['Gặp người địa phương', 'Khám phá nhịp sống bản xứ'],
      }
      if (!updateStore((current) => ({ ...current, destinations: [destination, ...current.destinations] }))) return
      setProviderServiceName('')
      setProviderServicePrice('')
      setToast('Đã thêm trải nghiệm demo vào danh sách khám phá.')
    }
    return <section className="page-section section-wrap">{PageIntro({ eyebrow: 'KHÔNG GIAN LOCAL HOST · DEMO', title: <>Câu chuyện địa phương<br /><em>của bạn.</em></>, description: 'Tạo trải nghiệm demo và xem những lời hẹn đang có trong bộ dữ liệu trên thiết bị.' })}<div className="dashboard-grid"><div className="dashboard-tile"><span>DỊCH VỤ</span><strong>{store.destinations.filter((item) => item.host === store.user?.name).length}</strong><span>trải nghiệm của tôi</span></div><div className="dashboard-tile"><span>ĐẶT CHỖ</span><strong>{myBookings.length}</strong><span>yêu cầu demo đang mở</span></div><div className="dashboard-tile"><span>ĐÁNH GIÁ</span><strong>—</strong><span>chưa có dữ liệu đánh giá cá nhân</span></div></div><form className="planner-form provider-form" onSubmit={createService}><Eyebrow>THÊM TRẢI NGHIỆM DEMO</Eyebrow><label><span>Tên trải nghiệm</span><input value={providerServiceName} minLength={3} maxLength={70} required onChange={(event) => setProviderServiceName(event.target.value)} placeholder="Một buổi sớm cùng người làng" /></label><label><span>Giá mẫu / người (đồng)</span><input type="number" min={100000} max={100000000} step={10000} required value={providerServicePrice} onChange={(event) => setProviderServicePrice(event.target.value)} placeholder="1200000" /></label><button className="modal-submit" type="submit">Đăng trải nghiệm demo <ArrowIcon /></button></form><div className="booking-list">{myBookings.map((booking) => <article className="booking-row" key={booking.id}><div className="booking-row-info"><span className="booking-status">Đặt chỗ demo</span><h2>{booking.destinationName}</h2><p>{booking.customerName} · {formatDate(booking.date)} · {booking.guests} người</p></div><strong>{formatPrice(booking.total)}</strong></article>)}</div></section>
  }

  function AdminPage() {
    if (store.user?.role !== 'admin') return AccessDenied()
    const upcoming = store.bookings.filter((booking) => booking.status === 'upcoming')
    function updatePrice(id: string, price: number) {
      if (!updateStore((current) => ({ ...current, destinations: current.destinations.map((item) => item.id === id ? { ...item, price } : item) }))) return
      setToast('Giá mẫu đã được cập nhật.')
    }
    function removeDestination(id: string) {
      const deleted = store.destinations.find((item) => item.id === id)
      if (!deleted || !window.confirm(`Xóa “${deleted.name}” khỏi dữ liệu demo?`)) return
      if (!updateStore((current) => ({ ...current, destinations: current.destinations.filter((item) => item.id !== id), wishlist: current.wishlist.filter((item) => item !== id), itinerary: { ...current.itinerary, items: current.itinerary.items.filter((item) => item.destinationId !== id) } }))) return
      setToast('Đã xóa hành trình khỏi dữ liệu demo.')
    }
    function addDestination(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const destination: Destination = {
        id: createDemoId('admin'), name: adminDestinationName.trim(), region: 'Điểm đến mới', province: 'Địa điểm demo',
        mood: ['Bình yên'], type: 'tour', price: Number(adminDestinationPrice), rating: 5, duration: '2 ngày 1 đêm',
        season: 'Quanh năm', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=82',
        imageAlt: 'Cảnh thiên nhiên trong hành trình demo', label: 'Gợi ý mới', host: 'Mộc · Local Host',
        hostStory: 'Một câu chuyện địa phương đang được viết.',
        description: 'Hành trình demo mới được thêm từ khu vực quản trị.',
        highlights: ['Gặp người bản địa', 'Khám phá theo cách riêng'],
      }
      if (!updateStore((current) => ({ ...current, destinations: [destination, ...current.destinations] }))) return
      setAdminDestinationName('')
      setAdminDestinationPrice('')
      setToast('Đã thêm điểm đến demo.')
    }
    function resetDemoData() {
      if (!window.confirm('Khôi phục bộ dữ liệu demo? Lịch trình, yêu thích và đặt chỗ hiện tại sẽ bị xóa.')) return
      if (!updateStore((current) => ({ ...current, users: demoUsers, destinations: seedDestinations, bookings: [], wishlist: [], itinerary: starterItinerary }))) return
      setAdminDestinationName('')
      setAdminDestinationPrice('')
      setToast('Đã khôi phục dữ liệu demo ban đầu.')
    }
    function removeDemoUser(id: string) {
      const user = store.users.find((item) => item.id === id)
      if (!user || user.id === store.user?.id || !window.confirm(`Xóa hồ sơ demo của ${user.name}?`)) return
      if (!updateStore((current) => ({ ...current, users: current.users.filter((item) => item.id !== id) }))) return
      setToast('Đã xóa hồ sơ khỏi danh sách demo.')
    }
    return <section className="page-section section-wrap">{PageIntro({ eyebrow: 'ADMIN CONSOLE · DỮ LIỆU DEMO', title: <>Mọi hành trình,<br /><em>trong tầm nhìn.</em></>, description: 'Các chỉ số được tính từ dữ liệu đang lưu trên thiết bị. Đây là giao diện minh họa, không kết nối hệ thống thật.' })}<div className="dashboard-grid"><div className="dashboard-tile"><span>NGƯỜI DÙNG</span><strong>{store.users.length}</strong><span>hồ sơ demo</span></div><div className="dashboard-tile"><span>HÀNH TRÌNH</span><strong>{store.destinations.length}</strong><span>đang được giới thiệu</span></div><div className="dashboard-tile"><span>ĐẶT CHỖ</span><strong>{store.bookings.length}</strong><span>{upcoming.length} yêu cầu đang mở</span></div></div><form className="planner-form provider-form" onSubmit={addDestination}><Eyebrow>THÊM ĐIỂM ĐẾN DEMO</Eyebrow><label><span>Tên hành trình</span><input value={adminDestinationName} minLength={3} maxLength={70} required onChange={(event) => setAdminDestinationName(event.target.value)} /></label><label><span>Giá mẫu / người (đồng)</span><input type="number" min={100000} max={100000000} step={10000} required value={adminDestinationPrice} onChange={(event) => setAdminDestinationPrice(event.target.value)} /></label><button className="modal-submit" type="submit">Thêm dữ liệu demo <ArrowIcon /></button></form><div className="admin-services"><div className="list-heading"><h2>Điểm đến và dịch vụ</h2><span>{store.destinations.length} mục</span></div><button className="reset-filters" type="button" onClick={resetDemoData}>Khôi phục dữ liệu demo ban đầu</button>{store.destinations.map((destination) => <article className="admin-service-row" key={destination.id}><div><strong>{destination.name}</strong><span>{destination.province} · {destination.type === 'tour' ? 'Tour' : 'Nơi ở'}</span></div><label><span className="sr-only">Giá của {destination.name}</span><input aria-label={`Giá của ${destination.name}`} type="number" min={100000} step={10000} defaultValue={destination.price} onBlur={(event) => { const price = Number(event.currentTarget.value); if (price > 0 && price !== destination.price) updatePrice(destination.id, price) }} /></label><button className="cancel-link" type="button" onClick={() => removeDestination(destination.id)}>Xóa demo</button></article>)}</div><div className="admin-users"><div className="list-heading"><h2>Hồ sơ demo</h2><span>{store.users.length} tài khoản</span></div>{store.users.map((user) => <article className="admin-user-row" key={user.id}><div><strong>{user.name}</strong><span>{user.email} · {user.role}</span></div><button className="cancel-link" type="button" disabled={user.id === store.user?.id} onClick={() => removeDemoUser(user.id)}>{user.id === store.user?.id ? 'Đang dùng' : 'Xóa hồ sơ'}</button></article>)}</div><div className="booking-list">{store.bookings.map((booking) => <article className="booking-row" key={booking.id}><div className="booking-row-info"><span className={`booking-status booking-status--${booking.status}`}>{booking.status === 'upcoming' ? 'Đang mở' : booking.status === 'cancelled' ? 'Đã hủy' : 'Hoàn tất'}</span><h2>{booking.destinationName}</h2><p>{booking.customerName} · {formatDate(booking.date)}</p></div><strong>{formatPrice(booking.total)}</strong></article>)}</div><p className="demo-notice">Phân quyền admin chỉ là trạng thái giao diện để trình diễn. Ứng dụng frontend không cung cấp bảo mật server-side.</p></section>
  }

  function AccessDenied() {
    return <section className="page-section section-wrap access-denied"><Eyebrow>KHU VỰC DEMO CÓ PHÂN VAI</Eyebrow><h1>Không gian này<br /><em>dành cho vai trò khác.</em></h1><p>Phân vai chỉ minh họa hành trình sử dụng, không phải cơ chế bảo mật thật.</p><a className="modal-submit" href="#/login">Chọn tài khoản demo <ArrowIcon /></a></section>
  }

  function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description: string }) {
    return <div className="page-intro"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{description}</p></div>
  }

  function NotFound({ onBack }: { onBack: () => void }) {
    return <section className="page-section section-wrap access-denied"><Eyebrow>CHƯA TÌM THẤY HÀNH TRÌNH</Eyebrow><h1>Con đường này<br /><em>đang chờ được viết.</em></h1><p>Nội dung có thể đã đổi hoặc không còn trong dữ liệu demo.</p><button className="modal-submit" type="button" onClick={onBack}>Quay lại khám phá <ArrowIcon left /></button></section>
  }

  function Footer() {
    return (
      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand-column"><Brand /><p>Đi chậm. Cảm sâu. Nhớ lâu.<br />Những chuyến đi được kể bằng cảm xúc và câu chuyện địa phương.</p><div className="footer-socials"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram ↗</a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook ↗</a></div></div>
          <div className="footer-link-column"><strong>TOUR DU LỊCH</strong><a href="#/tours">Tất cả tour</a><a href="#/domestic-tours">Tour trong nước</a><a href="#/international-tours">Tour quốc tế</a><a href="#/themed-tours">Tour theo chủ đề</a><a href="#/promotional-tours">Tour ưu đãi</a></div>
          <div className="footer-link-column"><strong>HỖ TRỢ</strong><a href="mailto:hello@moc.demo">hello@moc.demo</a><a href="tel:+842800000000">+84 28 0000 0000</a><a href="#/privacy">Chính sách riêng tư</a><a href="#/terms">Điều khoản sử dụng</a></div>
          <div className="footer-contact-note"><span>ĐI CÙNG MỘC</span><p>Một hành trình tốt bắt đầu bằng một lời chào. Hãy để lại lời nhắn cho chúng mình.</p><a href="mailto:hello@moc.demo">Gửi lời chào <ArrowIcon /></a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Mộc Journeys · Chạm cảm xúc, chạm hành trình.</span><span>Thông tin liên hệ và đặt chỗ chỉ mang tính demo · Không xử lý thanh toán.</span></div>
      </footer>
    )
  }

  function LegalPage() {
    const isPrivacy = route.page === 'privacy'
    return <section className="page-section section-wrap legal-page">{PageIntro({ eyebrow: 'THÔNG TIN DEMO', title: isPrivacy ? <>Chính sách<br /><em>riêng tư.</em></> : <>Điều khoản<br /><em>sử dụng.</em></>, description: 'Mộc là website frontend minh họa. Nội dung dưới đây giải thích phạm vi dữ liệu của bản demo.' })}<article className="legal-copy"><h2>{isPrivacy ? 'Dữ liệu trên thiết bị của bạn' : 'Phạm vi sử dụng'}</h2><p>{isPrivacy ? 'Thông tin hồ sơ demo, hành trình đã lưu và yêu cầu đặt chỗ được lưu trong localStorage trên thiết bị này. Mộc không gửi dữ liệu tới máy chủ, không thu thập thông tin thanh toán và không gửi email bản tin.' : 'Các hành trình, giá, ưu đãi, đánh giá và chức năng đặt chỗ trên website chỉ nhằm trình diễn giao diện. Không có giao dịch hoặc dịch vụ du lịch thật được tạo ra.'}</p><h2>{isPrivacy ? 'Bạn có thể chủ động quản lý' : 'Thông tin liên hệ'}</h2><p>{isPrivacy ? 'Bạn có thể xóa dữ liệu demo bằng cách xóa dữ liệu trang web trong trình duyệt. Mọi thay đổi chỉ áp dụng cho thiết bị đang sử dụng.' : 'Địa chỉ email, số điện thoại và các liên kết mạng xã hội trên website là thông tin minh họa cho giao diện.'}</p><a className="text-button" href="#/home">Trở về trang chủ <ArrowIcon left /></a></article></section>
  }

  function JournalPage() {
    const stories = JOURNAL_STORIES.filter((story) => store.destinations.some((destination) => destination.id === story.destinationId))
    return <section className="page-section section-wrap journal-page">{PageIntro({ eyebrow: 'THE MỘC JOURNAL', title: <>Ghi chép<br /><em>trên đường.</em></>, description: 'Những lát cắt nhỏ về nơi chốn, món ăn và người mình gặp trên mỗi hành trình.' })}<div className="journal-grid">{stories.map((story) => <article className="journal-card" key={story.id}><button type="button" className="journal-image" onClick={() => navigate('blog', story.id)} aria-label={`Đọc: ${story.title}`}><img src={story.image} alt="" loading="lazy" /></button><div className="journal-copy"><span>{story.category} · {story.read}</span><h3><a href={`#/blog/${story.id}`}>{story.title}</a></h3><button type="button" onClick={() => navigate('blog', story.id)}>Đọc câu chuyện <ArrowIcon /></button></div></article>)}</div></section>
  }

  function JournalArticlePage() {
    const story = JOURNAL_STORIES.find((item) => item.id === route.id)
    if (!story) return NotFound({ onBack: () => navigate('journal') })
    const destination = store.destinations.find((item) => item.id === story.destinationId)
    return <article className="journal-article section-wrap"><button className="back-link" type="button" onClick={() => navigate('journal')}><ArrowIcon left /> Về tạp chí Mộc</button><img className="journal-article-image" src={story.image} alt="" /><div className="journal-article-copy"><Eyebrow>{story.category} · {story.read}</Eyebrow><h1>{story.title}</h1>{story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{destination && <aside className="journal-related"><span>ĐI TIẾP TỪ CÂU CHUYỆN</span><strong>{destination.name} · {destination.province}</strong><button className="text-button" type="button" onClick={() => navigate('destination', destination.id)}>Khám phá hành trình <ArrowIcon /></button></aside>}</div></article>
  }

  function BookingDialog() {
    if (!bookingDestination) return null
    const subtotal = bookingDestination.price * bookingGuestCount
    const fee = Math.round(subtotal * 0.05)
    return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingDestination(null) }}><section className="dialog booking-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="modal-close" type="button" aria-label="Đóng" onClick={() => setBookingDestination(null)}>×</button><Eyebrow>ĐẶT CHỖ DEMO · CHƯA THANH TOÁN</Eyebrow><h2 id="dialog-title">{bookingDestination.name}</h2><p className="modal-subtitle">{bookingDestination.province} · {bookingDestination.duration}</p><form className="booking-form" onSubmit={createBooking}><label><span>Tên người liên hệ</span><input name="name" autoComplete="name" minLength={2} maxLength={70} defaultValue={store.user?.name ?? ''} required /></label><label><span>Email</span><input name="email" type="email" autoComplete="email" defaultValue={store.user?.email ?? ''} required /></label><div className="booking-form-row">    <label><span>Ngày đi</span><input name="date" type="date" min={minimumBookingDate} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} required /></label><label><span>Số người</span><select name="guests" value={bookingGuestCount} onChange={(event) => setBookingGuestCount(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} người</option>)}</select></label></div><div className="price-breakdown"><div><span>{formatPrice(bookingDestination.price)} × {bookingGuestCount} người</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Phí dịch vụ demo (5%)</span><strong>{formatPrice(fee)}</strong></div><div className="price-total"><span>Tổng ước tính</span><strong>{formatPrice(subtotal + fee)}</strong></div></div><button className="modal-submit" type="submit">Gửi lời hẹn demo <ArrowIcon /></button><p className="form-note">Không thu thập thông tin thanh toán. Yêu cầu chỉ được lưu trên thiết bị này.</p></form></section></div>
  }

  function CancelDialog() {
    if (!cancellingBooking) return null
    return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCancellingBooking(null) }}><section className="dialog cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-title"><button className="modal-close" type="button" aria-label="Đóng" onClick={() => setCancellingBooking(null)}>×</button><Eyebrow>XÁC NHẬN HỦY</Eyebrow><h2 id="cancel-title">Mình dừng lời hẹn này nhé?</h2><p>{cancellingBooking.destinationName} · {formatDate(cancellingBooking.date)}</p><div className="cancel-actions"><button className="secondary-button" type="button" onClick={() => setCancellingBooking(null)}>Giữ lời hẹn</button><button className="danger-button" type="button" onClick={cancelBooking}>Hủy đặt chỗ demo</button></div></section></div>
  }

  function LogoutDialog() {
    if (!logoutPending) return null
    function confirmLogout() {
      if (!updateStore((current) => ({ ...current, user: null }))) return
      setLogoutPending(false)
      setToast('Bạn đã đăng xuất khỏi tài khoản demo.')
      navigate('home')
    }
    return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLogoutPending(false) }}><section className="dialog cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title"><button className="modal-close" type="button" aria-label="Đóng" onClick={() => setLogoutPending(false)}>×</button><Eyebrow>KẾT THÚC PHIÊN DEMO</Eyebrow><h2 id="logout-title">Mình tạm dừng hành trình nhé?</h2><p>Thông tin demo vẫn được lưu trên thiết bị này.</p><div className="cancel-actions"><button className="secondary-button" type="button" onClick={() => setLogoutPending(false)}>Ở lại với Mộc</button><button className="danger-button" type="button" onClick={confirmLogout}>Đăng xuất demo</button></div></section></div>
  }

  const protectedRoute = route.page === 'planner' || route.page === 'dashboard' || route.page === 'bookings' || route.page === 'profile' || route.page === 'notifications'
  const visibleRoute = protectedRoute && !store.user ? 'login'
    : route.page === 'admin' && store.user?.role !== 'admin' ? 'access'
      : route.page === 'provider' && store.user?.role !== 'provider' ? 'access'
        : route.page

  return (
    <>
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      {Header()}
      <main id="main-content">
        {visibleRoute === 'home' && HomePage()}
        {['destinations', 'domestic', 'international', 'categories'].includes(visibleRoute) && DestinationsPage()}
        {['tours', 'domestic-tours', 'international-tours', 'themed-tours', 'promotional-tours'].includes(visibleRoute) && ToursPage()}
        {visibleRoute === 'tour' && TourDetailPage()}
        {visibleRoute === 'explore' && ExplorePage()}
        {visibleRoute === 'collections' && CollectionsPage()}
        {visibleRoute === 'journal' && JournalPage()}
        {visibleRoute === 'blog' && JournalArticlePage()}
        {visibleRoute === 'destination' && DetailPage()}
        {visibleRoute === 'planner' && PlannerPage()}
        {visibleRoute === 'wishlist' && WishlistPage()}
        {visibleRoute === 'bookings' && BookingsPage()}
        {visibleRoute === 'notifications' && NotificationsPage()}
        {visibleRoute === 'dashboard' && ProfilePage()}
        {visibleRoute === 'profile' && ProfilePage()}
        {visibleRoute === 'login' && LoginPage()}
        {visibleRoute === 'confirmation' && ConfirmationPage()}
        {visibleRoute === 'provider' && ProviderPage()}
        {visibleRoute === 'admin' && AdminPage()}
        {(visibleRoute === 'privacy' || visibleRoute === 'terms') && LegalPage()}
        {visibleRoute === 'access' && AccessDenied()}
        {!['home', 'destinations', 'domestic', 'international', 'categories', 'tours', 'domestic-tours', 'international-tours', 'themed-tours', 'promotional-tours', 'tour', 'explore', 'collections', 'journal', 'blog', 'destination', 'planner', 'wishlist', 'bookings', 'notifications', 'dashboard', 'profile', 'login', 'confirmation', 'provider', 'admin', 'privacy', 'terms', 'access'].includes(visibleRoute) && NotFound({ onBack: () => navigate('home') })}
      </main>
      {Footer()}
      {bookingDestination && BookingDialog()}
      {cancellingBooking && CancelDialog()}
      {logoutPending && LogoutDialog()}
      {bookingConfirmation && route.page === 'confirmation' && <span className="sr-only" aria-live="polite">Yêu cầu đặt chỗ demo đã được lưu.</span>}
      {toast && <div className="toast-message" role="status"><span aria-hidden="true">✳</span>{toast}<button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>×</button></div>}
    </>
  )
}

export default App
