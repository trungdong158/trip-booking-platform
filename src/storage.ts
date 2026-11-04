import { createDemoId, demoUsers, seedDestinations, starterItinerary } from './data'
import type { AppStore, Booking, Destination, Itinerary, User, UserRole } from './types'

const STORAGE_KEY = 'moc-travel-demo-v1'

export type StorageRead = { store: AppStore; warning: string | null }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUser(value: unknown): value is User {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.email === 'string'
    && ['customer', 'provider', 'admin'].includes(String(value.role))
}

function isDestination(value: unknown): value is Destination {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.price === 'number'
    && Array.isArray(value.mood)
}

function isBooking(value: unknown): value is Booking {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.destinationId === 'string'
    && typeof value.total === 'number'
    && ['upcoming', 'cancelled', 'completed'].includes(String(value.status))
}

function isItinerary(value: unknown): value is Itinerary {
  return isRecord(value)
    && typeof value.title === 'string'
    && typeof value.startDate === 'string'
    && typeof value.endDate === 'string'
    && Array.isArray(value.items)
    && value.items.every((item) => isRecord(item)
      && typeof item.destinationId === 'string'
      && typeof item.day === 'number')
}

function emptyStore(): AppStore {
  return {
    user: null,
    users: demoUsers,
    wishlist: [],
    bookings: [],
    itinerary: starterItinerary,
    destinations: seedDestinations,
  }
}

export function readStore(): StorageRead {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { store: emptyStore(), warning: null }

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) {
      return { store: emptyStore(), warning: 'Dữ liệu demo không đúng định dạng. Mộc đã khôi phục dữ liệu mẫu.' }
    }

    const storedDestinations = Array.isArray(parsed.destinations)
      ? parsed.destinations.filter(isDestination)
      : seedDestinations
    const storedDestinationIds = new Set(storedDestinations.map((destination) => destination.id))
    const destinations = storedDestinations.length
      ? [...storedDestinations, ...seedDestinations.filter((destination) => !storedDestinationIds.has(destination.id))]
      : seedDestinations
    const users = Array.isArray(parsed.users) ? parsed.users.filter(isUser) : demoUsers
    const bookings = Array.isArray(parsed.bookings) ? parsed.bookings.filter(isBooking) : []
    const user = parsed.user === null || parsed.user === undefined || isUser(parsed.user)
      ? parsed.user ?? null
      : null
    const wishlist = Array.isArray(parsed.wishlist)
      ? parsed.wishlist.filter((id): id is string => typeof id === 'string' && destinations.some((item) => item.id === id))
      : []

    return {
      store: {
        user: isUser(user) ? user : null,
        users,
        wishlist,
        bookings,
        itinerary: isItinerary(parsed.itinerary) ? parsed.itinerary : starterItinerary,
        destinations,
      },
      warning: null,
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { store: emptyStore(), warning: 'Dữ liệu demo bị lỗi định dạng. Mộc đã khôi phục dữ liệu mẫu.' }
    }
    return { store: emptyStore(), warning: 'Không thể đọc bộ nhớ trình duyệt. Các thay đổi sẽ không được giữ sau khi đóng trang.' }
  }
}

export function writeStore(store: AppStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    throw new Error('Không thể lưu thay đổi vào bộ nhớ trình duyệt. Hãy kiểm tra dung lượng hoặc quyền lưu trữ.')
  }
}

export function makeDemoBooking(
  destination: Destination,
  date: string,
  guests: number,
  customerName: string,
  customerEmail: string,
  customerId?: string,
): Booking {
  const subtotal = destination.price * guests
  const serviceFee = Math.round(subtotal * 0.05)
  return {
    id: createDemoId('MOC').toUpperCase(),
    customerId,
    destinationId: destination.id,
    destinationName: destination.name,
    date,
    guests,
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
    customerName,
    customerEmail,
    status: 'upcoming',
    createdAt: new Date().toISOString(),
  }
}

export function isUserRole(value: string): value is UserRole {
  return value === 'customer' || value === 'provider' || value === 'admin'
}
