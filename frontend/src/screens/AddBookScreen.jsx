import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '../lib/pocketbase'
import { placeholderColor, STATUS_OPTIONS } from '../utils/bookUtils'

const today = () => new Date().toISOString().slice(0, 10)

export default function AddBookScreen() {
  const navigate       = useNavigate()
  const searchRef      = useRef(null)
  const debounceRef    = useRef(null)

  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState([])
  const [searching, setSearching]     = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError]             = useState('')
  const [saving, setSaving]           = useState(false)

  const [form, setForm] = useState({
    gift_number:     '',
    title:           '',
    author:          '',
    cover_url:       '',
    google_books_id: '',
    date_gifted:     today(),
    location_bought: '',
    personal_note:   '',
    tags:            '',
    reading_status:  'gifted',
    gifted_by:       '',
  })

  // Auto-suggest next gift number on mount
  useEffect(() => {
    pb.collection('books')
      .getList(1, 1, { sort: '-gift_number', requestKey: null })
      .then(res => {
        const next = res.items.length > 0 ? res.items[0].gift_number + 1 : 1
        setForm(f => ({ ...f, gift_number: next }))
      })
      .catch(() => setForm(f => ({ ...f, gift_number: 1 })))
  }, [])

  // Close results on tap outside
  useEffect(() => {
    const close = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('touchstart', close)
    document.addEventListener('mousedown', close)
    return () => {
      document.removeEventListener('touchstart', close)
      document.removeEventListener('mousedown', close)
    }
  }, [])

  // Debounced Google Books search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setShowResults(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res  = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books`
        )
        const data = await res.json()
        setResults(data.items || [])
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 380)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const selectBook = (item) => {
    console.log('GOOGLE BOOKS RAW ITEM:', item)
    console.log('imageLinks:', item.volumeInfo?.imageLinks)
    const v   = item.volumeInfo || {}
    const raw = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || ''
    const thumb = raw.replace('http://', 'https://')
    setForm(f => ({
      ...f,
      title:           v.title || '',
      author:          v.authors?.[0] || '',
      cover_url:       thumb,
      google_books_id: item.id || '',
    }))
    setQuery('')
    setShowResults(false)
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Please enter or search for a book title.'); return }

    console.log('SAVING FORM:', form)
    const giftNum = Number(form.gift_number) || 1
    try {
      await pb.collection('books').getFirstListItem(
        `gift_number = ${giftNum}`,
        { requestKey: null }
      )
      setError(`Gift #${giftNum} is already taken. Please choose a different number.`)
      return
    } catch (e) {
      if (e?.status !== 404) {
        setError('Could not validate gift number. Please try again.')
        return
      }
    }

    setError('')
    setSaving(true)
    try {
      await pb.collection('books').create({ ...form, gift_number: giftNum })
      navigate('/')
    } catch (e) {
      console.error('POCKETBASE SAVE ERROR:', e)
      console.error('Error data:', e?.data)
      console.error('Error response:', e?.response)
      setError(`Save failed: ${e?.message || 'unknown'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <header className="header">
        <button className="header__back" onClick={() => navigate(-1)}>←</button>
        <h1 className="header__title">Add Book</h1>
      </header>

      <div className="content" style={{ padding: '16px 16px 48px' }}>

        {/* ── Google Books search ── */}
        <p className="form-label" style={{ marginBottom: 8 }}>Search Google Books</p>
        <div style={{ position: 'relative', marginBottom: 16 }} ref={searchRef}>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              type="text"
              placeholder="Search by title or author…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
            />
            {searching && (
              <span className="spinner" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }} />
            )}
          </div>

          {showResults && results.length > 0 && (
            <div className="book-results">
              {results.map(item => {
                const v   = item.volumeInfo || {}
                const raw = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || ''
                const thumb = raw.replace('http://', 'https://')
                return (
                  <div key={item.id} className="book-result-item" onMouseDown={() => selectBook(item)}>
                    {thumb
                      ? <img className="book-result-thumb" src={thumb} alt={v.title} />
                      : <div className="book-result-thumb-ph" style={{ background: placeholderColor(v.title || '') }}>
                          {v.title?.[0]?.toUpperCase()}
                        </div>
                    }
                    <div className="book-result-info">
                      <div className="book-result-title">{v.title}</div>
                      <div className="book-result-author">{v.authors?.join(', ')}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {form.title ? (
          <div className="success-chip" style={{ marginBottom: 20 }}>
            <span>✓</span>
            <span><strong>{form.title}</strong>{form.author ? ` · ${form.author}` : ''}</span>
          </div>
        ) : null}

        {/* ── Form fields ── */}
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Gift #</label>
              <input className="form-input" type="number" min="1"
                value={form.gift_number} onChange={e => set('gift_number', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date Gifted</label>
              <input className="form-input" type="date"
                value={form.date_gifted} onChange={e => set('date_gifted', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" type="text" placeholder="Book title"
              value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Author</label>
            <input className="form-input" type="text" placeholder="Author name"
              value={form.author} onChange={e => set('author', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Reading Status</label>
            <select className="form-input form-select"
              value={form.reading_status} onChange={e => set('reading_status', e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Gifted By</label>
            <input className="form-input" type="text" placeholder="Who gave this book?"
              value={form.gifted_by} onChange={e => set('gifted_by', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Location Bought</label>
            <input className="form-input" type="text" placeholder="e.g. Shakespeare & Co., Paris"
              value={form.location_bought} onChange={e => set('location_bought', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Tags <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(comma-separated)</span></label>
            <input className="form-input" type="text" placeholder="fiction, romance, travel"
              value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Personal Note</label>
            <textarea className="form-input form-textarea"
              placeholder="A memory or note about this gift…"
              value={form.personal_note} onChange={e => set('personal_note', e.target.value)}
            />
          </div>

          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <span className="spinner" style={{ borderTopColor: '#fff' }} />
              : 'Save Book'}
          </button>
        </div>
      </div>
    </div>
  )
}
