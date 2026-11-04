import { Header } from '../components/Header'
import { Modal } from '../components/Modal'
import type { Destination } from '../types'

type DetailPageProps = {
  destination: Destination
}

export function DetailPage({ destination }: DetailPageProps) {
  return (
    <main className="page-shell">
      <Header title={destination.name} subtitle={destination.province} />
      <section className="detail-layout">
        <img src={destination.image} alt={destination.imageAlt} className="detail-hero" />
        <div>
          <p className="eyebrow">Local host</p>
          <h2>{destination.host}</h2>
          <p>{destination.description}</p>
          <ul>
            {destination.highlights.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>
      <Modal title="Đặt chỗ demo" open={true}>
        <p>{destination.name} · {destination.price.toLocaleString('vi-VN')}đ / người</p>
      </Modal>
    </main>
  )
}
