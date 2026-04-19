import { useState } from 'react'
import { placeholderColor } from '../utils/bookUtils'

export default function CoverImage({ src, title, coverClass, placeholderClass, style }) {
  const [failed, setFailed] = useState(false)
  const safeSrc = src?.replace(/^http:\/\//, 'https://')
  const bg = placeholderColor(title)
  const initial = title?.[0]?.toUpperCase() || '?'

  if (!safeSrc || failed) {
    return (
      <div className={placeholderClass} style={{ background: bg, ...style }}>
        {initial}
      </div>
    )
  }
  return (
    <img
      className={coverClass}
      src={safeSrc}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
      style={style}
    />
  )
}
