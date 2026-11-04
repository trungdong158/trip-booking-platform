import type { ReactNode } from 'react'

type ModalProps = {
  open?: boolean
  title?: string
  children: ReactNode
}

export function Modal({ open = true, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title ?? 'Dialog'}>
      <div className="modal-panel">
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    </div>
  )
}
