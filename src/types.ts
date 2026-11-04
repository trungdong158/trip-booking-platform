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
  country?: string
  category?: string
  popularity?: number
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

export type DestinationReview = {
  author: string
  location: string
  rating: number
  date: string
  content: string
}

export type DestinationGuide = {
  overview: string
  attractions: string[]
  bestTime: string
  estimatedBudget: string
  cuisine: string[]
  transportation: string
  latitude: number
  longitude: number
  gallery: { image: string; alt: string }[]
  reviews: DestinationReview[]
}

export type TourDeparture = {
  date: string
  seats: number
  price?: number
}

export type TourDay = {
  title: string
  activities: string[]
  meals: string[]
  accommodation: string
}

export type TourPackage = {
  id: string
  destinationId: string
  title: string
  subtitle: string
  keywords: string[]
  type: 'culture' | 'nature' | 'adventure' | 'food' | 'relaxation'
  domestic: boolean
  promotional: boolean
  popularity: number
  rating: number
  reviewCount: number
  durationDays: number
  price: number
  discountPercent: number
  maxGroupSize: number
  departureLocation: string
  arrivalLocation: string
  overview: string
  highlights: string[]
  gallery: { image: string; alt: string }[]
  departures: TourDeparture[]
  itinerary: TourDay[]
  included: string[]
  excluded: string[]
  accommodation: string
  guide: { name: string; role: string; description: string }
  cancellationPolicy: string[]
  reviews: DestinationReview[]
  createdAt: string
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
