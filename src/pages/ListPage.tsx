import { Card } from '../components/Card'
import { Header } from '../components/Header'
import type { Destination } from '../types'

type ListPageProps = {
  items: Destination[]
}

export function ListPage({ items }: ListPageProps) {
  return (
    <main className="page-shell">
      <Header title="Khám phá hành trình" subtitle="Các trải nghiệm được chọn lọc theo cảm xúc, phong cách và ngân sách." />
      <section className="card-grid">
        {items.map((destination) => (
          <Card
            key={destination.id}
            title={destination.name}
            description={`${destination.province} · ${destination.duration}`}
            price={`${destination.price.toLocaleString('vi-VN')}đ / người`}
            image={destination.image}
            cta="Khám phá"
          />
        ))}
      </section>
    </main>
  )
}
