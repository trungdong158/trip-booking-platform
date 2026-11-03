export type UserRole = 'customer' | 'provider' | 'admin'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
}

export type Destination = {
  id: string
  name: string
  region: string
  province: string
  mood: string[]
  type: 'tour' | 'stay'
  price: number
  rating: number
  duration: string
  season: string
  image: string
  imageAlt: string
  label: string
  host: string
  hostStory: string
  description: string
  highlights: string[]
}

export type Booking = {
  id: string
  customerId?: string
  destinationId: string
  destinationName: string
  date: string
  guests: number
  subtotal: number
  serviceFee: number
  total: number
  customerName: string
  customerEmail: string
  status: 'upcoming' | 'cancelled' | 'completed'
  createdAt: string
}

export type ItineraryItem = {
  destinationId: string
  day: number
}

export type Itinerary = {
  title: string
  startDate: string
  endDate: string
  items: ItineraryItem[]
}

export type AppStore = {
  user: User | null
  users: User[]
  wishlist: string[]
  bookings: Booking[]
  itinerary: Itinerary
  destinations: Destination[]
}
