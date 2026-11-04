type CardProps = {
  title: string
  description?: string
  price?: string
  image?: string
  cta?: string
}

export function Card({ title, description, price, image, cta }: CardProps) {
  return (
    <article className="info-card">
      {image ? <img src={image} alt={title} className="card-image" loading="lazy" /> : null}
      <div className="card-body">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
        {price ? <strong>{price}</strong> : null}
        {cta ? <button type="button">{cta}</button> : null}
      </div>
    </article>
  )
}
