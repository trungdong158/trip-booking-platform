import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { collections, createDemoId, demoUsers, formatDate, formatPrice, localDateInputValue, moods, normalizeVietnamese, seedDestinations, starterItinerary } from './data'
import { makeDemoBooking, readStore, writeStore } from './storage'
import type { AppStore, Booking, Destination, User } from './types'
import './App.css'

type Route = { page: string; id: string }

const TODAY_INPUT_DATE = localDateInputValue()

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
  const [detailSlide, setDetailSlide] = useState(0)
  const bookingSubmissionInProgress = useRef(false)
  const [bookingDestination, setBookingDestination] = useState<Destination | null>(null)
  const [bookingConfirmation, setBookingConfirmation] = useState<Booking | null>(null)
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)
  const [logoutPending, setLogoutPending] = useState(false)
  const [toast, setToast] = useState(initialState.warning)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleNavigation = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', handleNavigation)
    if (!window.location.hash) window.location.hash = '/home'
    return () => window.removeEventListener('hashchange', handleNavigation)
  }, [])

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

  function navigate(page: string, id = '') {
    setMenuOpen(false)
    if (page === 'destination') setDetailSlide(0)
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

  function openBooking(destination: Destination) {
    if (store.destinations.some((item) => item.id === destination.id)) {
      setMinimumBookingDate(localDateInputValue())
      setBookingGuestCount(2)
      setBookingDestination(destination)
      setBookingConfirmation(null)
    } else {
      setToast('Hành trình này không còn khả dụng. Hãy chọn một gợi ý khác.')
    }
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
  }

  function Header() {
    const links = [
      ['Khám phá', 'explore'],
      ['Bộ sưu tập', 'collections'],
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

  function HomePage() {
    const featured = activeMood
      ? store.destinations.filter((destination) => destination.mood.includes(activeMood)).slice(0, 3)
      : store.destinations.slice(0, 3)
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

        <section className="discovery section-wrap" id="cam-xuc">
          <div className="discovery-intro">
            <Eyebrow>MỖI NGƯỜI, MỘT CÁCH ĐI</Eyebrow>
            <h2>Hôm nay, bạn<br /><em>muốn cảm thấy</em> gì?</h2>
            <p className="muted-copy">Chọn một cảm xúc. Mộc sẽ tìm con đường đưa bạn đến gần nó hơn.</p>
          </div>
          <div className="mood-list mood-list--home" role="group" aria-label="Chọn cảm xúc cho chuyến đi">
            {moods.slice(0, 4).map((item) => (
              <button className={`mood-card${activeMood === item.name ? ' is-selected' : ''}`} key={item.name} type="button" aria-pressed={activeMood === item.name} onClick={() => setActiveMood((current) => current === item.name ? '' : item.name)}>
                <span className="mood-icon" aria-hidden="true">{item.icon}</span>
                <span className="mood-text"><strong>{item.name}</strong><span>{item.note}</span></span><ArrowIcon />
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
        <section className="quote-band"><div className="quote-mark" aria-hidden="true">“</div><blockquote>Mình tưởng là đi trốn khỏi thành phố. Hóa ra là đang đi tìm lại một phiên bản rất lâu rồi chưa gặp.</blockquote><div className="quote-author"><span /> MINH ANH <span className="quote-author-dot">·</span> HÀNH TRÌNH TÀ XÙA</div><div className="quote-decoration" aria-hidden="true">mộc</div></section>
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
    const gallery = [destination, ...store.destinations.filter((item) => item.id !== destination.id).slice(0, 2)]
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
          <img src={shownSlide.image} alt={shownSlide.imageAlt} />
          <span>{destination.label}</span>
          <div className="gallery-controls">
            <button type="button" aria-label="Ảnh trước" onClick={() => moveSlide(-1)}><ArrowIcon left /></button>
            <span aria-live="polite">{String(activeSlide + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</span>
            <button type="button" aria-label="Ảnh tiếp theo" onClick={() => moveSlide(1)}><ArrowIcon /></button>
          </div>
          <div className="gallery-dots" role="group" aria-label="Chọn ảnh">
            {gallery.map((image, index) => <button key={image.id} type="button" aria-label={`Xem ảnh ${index + 1}`} aria-pressed={index === activeSlide} onClick={() => setDetailSlide(index)} />)}
          </div>
        </div>
        <div className="detail-columns">
          <div className="detail-story">
            <Eyebrow>{destination.region.toUpperCase()} · {destination.province.toUpperCase()}</Eyebrow>
            <h1>{destination.name}</h1>
            <p className="detail-description">{destination.description}</p>
            <h2>Điều mình sẽ nhớ</h2>
            <ul className="highlight-list">{destination.highlights.map((highlight) => <li key={highlight}><span aria-hidden="true">✳</span>{highlight}</li>)}</ul>
            <section className="host-story"><div className="host-avatar" aria-hidden="true">{destination.host[0]}</div><div><Eyebrow>LOCAL HOST CỦA MỘC</Eyebrow><h2>{destination.host}</h2><p>{destination.hostStory}</p></div></section>
            <div className="detail-reviews"><Eyebrow>LỜI NHẮN TỪ NGƯỜI ĐI TRƯỚC</Eyebrow><p>“{destination.name} cho mình một khoảng lặng đúng lúc. Cảm ơn người địa phương đã kể câu chuyện này bằng sự chân thành.”</p><span>— Một người bạn của Mộc · Đánh giá demo</span></div>
          </div>
          <aside className="detail-booking">
            <div className="detail-rating">✦ {destination.rating.toFixed(1)} <span>· Đánh giá minh họa</span></div>
            <h2>{formatPrice(destination.price)} <span>/ người</span></h2>
            <p>{destination.duration} · {destination.season}</p>
            <div className="detail-moods">{destination.mood.map((item) => <span key={item}>{item}</span>)}</div>
            <button className="modal-submit" type="button" onClick={() => openBooking(destination)}>Chọn hành trình này <ArrowIcon /></button>
            <small>Đặt chỗ demo · Chưa thu tiền, không cần thẻ thanh toán.</small>
            <button className="detail-save" type="button" aria-pressed={store.wishlist.includes(destination.id)} onClick={() => toggleWishlist(destination.id)}>{store.wishlist.includes(destination.id) ? '♥ Đã lưu vào danh sách' : '♡ Lưu vào danh sách yêu thích'}</button>
          </aside>
        </div>
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
    return <footer className="site-footer"><div className="footer-main"><Brand /><p>Đi chậm. Cảm sâu. Nhớ lâu.</p><nav aria-label="Liên kết cuối trang"><a href="#/explore">Khám phá</a><a href="#/collections">Bộ sưu tập</a><a href="#/planner">Lên lịch trình</a><a href="#/bookings">Lời hẹn demo</a></nav></div><div className="footer-bottom"><span>© 2025 Mộc Journeys · Chạm cảm xúc, chạm hành trình.</span><span>Frontend demo · Không xử lý thanh toán hoặc đặt chỗ thật.</span></div></footer>
  }

  function BookingDialog() {
    if (!bookingDestination) return null
    const subtotal = bookingDestination.price * bookingGuestCount
    const fee = Math.round(subtotal * 0.05)
    return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingDestination(null) }}><section className="dialog booking-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="modal-close" type="button" aria-label="Đóng" onClick={() => setBookingDestination(null)}>×</button><Eyebrow>ĐẶT CHỖ DEMO · CHƯA THANH TOÁN</Eyebrow><h2 id="dialog-title">{bookingDestination.name}</h2><p className="modal-subtitle">{bookingDestination.province} · {bookingDestination.duration}</p><form className="booking-form" onSubmit={createBooking}><label><span>Tên người liên hệ</span><input name="name" autoComplete="name" minLength={2} maxLength={70} defaultValue={store.user?.name ?? ''} required /></label><label><span>Email</span><input name="email" type="email" autoComplete="email" defaultValue={store.user?.email ?? ''} required /></label><div className="booking-form-row"><label><span>Ngày đi</span><input name="date" type="date" min={minimumBookingDate} required /></label><label><span>Số người</span><select name="guests" value={bookingGuestCount} onChange={(event) => setBookingGuestCount(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} người</option>)}</select></label></div><div className="price-breakdown"><div><span>{formatPrice(bookingDestination.price)} × {bookingGuestCount} người</span><strong>{formatPrice(subtotal)}</strong></div><div><span>Phí dịch vụ demo (5%)</span><strong>{formatPrice(fee)}</strong></div><div className="price-total"><span>Tổng ước tính</span><strong>{formatPrice(subtotal + fee)}</strong></div></div><button className="modal-submit" type="submit">Gửi lời hẹn demo <ArrowIcon /></button><p className="form-note">Không thu thập thông tin thanh toán. Yêu cầu chỉ được lưu trên thiết bị này.</p></form></section></div>
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
        {visibleRoute === 'explore' && ExplorePage()}
        {visibleRoute === 'collections' && CollectionsPage()}
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
        {visibleRoute === 'access' && AccessDenied()}
        {!['home', 'explore', 'collections', 'destination', 'planner', 'wishlist', 'bookings', 'notifications', 'dashboard', 'profile', 'login', 'confirmation', 'provider', 'admin', 'access'].includes(visibleRoute) && NotFound({ onBack: () => navigate('home') })}
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
