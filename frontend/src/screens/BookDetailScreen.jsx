import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import pb from '../lib/pocketbase'
import CoverImage from '../components/CoverImage'
import { STATUS_LABELS, STATUS_OPTIONS, formatDate, toDateInput } from '../utils/bookUtils'

export default function BookDetailScreen() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [book, setBook]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    pb.collection('books')
      .getOne(id, { requestKey: null })
      .then(rec => { setBook(rec); setForm(rec) })
      .catch((err) => {
        console.error('BookDetail fetch error:', err)
        if (err?.status === 404) navigate('/')
      })
      .finally(() => setLoading(false))
  }, [id])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.title?.trim()) { setError('Title is required.'); return }
    setError('')
    setSaving(true)
    try {
      const updated = await pb.collection('books').update(id, {
        ...form,
        gift_number: Number(form.gift_number) || book.gift_number,
      }, { requestKey: null })
      setBook(updated)
      setForm(updated)
      setEditing(false)
    } catch {
      setError('Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (status) => {
    try {
      const updated = await pb.collection('books').update(id, { reading_status: status }, { requestKey: null })
      setBook(updated)
      setForm(updated)
    } catch {}
  }

  const handleDelete = async () => {
    try {
      await pb.collection('books').delete(id, { requestKey: null })
      navigate('/')
    } catch {
      setError('Could not delete. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="header">
        <button className="header__back" onClick={() => navigate(-1)}>←</button>
        <h1 className="header__title">#{book.gift_number} — {book.title}</h1>
        {!editing && (
          <button className="header__action" onClick={() => setEditing(true)} aria-label="Edit">
            ✏️
          </button>
        )}
      </header>

      <div className="content">
        <CoverImage
          src={book.cover_url}
          title={book.title}
          coverClass="detail-cover"
          placeholderClass="detail-cover-ph"
        />

        <div className="detail-body">
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

          {editing
            ? <EditForm form={form} set={set} saving={saving} onSave={handleSave}
                onCancel={() => { setForm(book); setEditing(false); setError('') }} />
            : <ViewMode book={book} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          }
        </div>
      </div>
    </div>
  )
}

/* ── View mode ── */

function ViewMode({ book, onStatusChange, onDelete }) {
  const [showPicker, setShowPicker]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const tags = book.tags
    ? book.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  return (
    <>
      <h2 className="detail-title">{book.title}</h2>
      {book.author && <p className="detail-author">by {book.author}</p>}

      {/* Status toggle */}
      <div style={{ marginBottom: 20 }}>
        <div
          className={`status-badge status-badge--${book.reading_status}`}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setShowPicker(p => !p)}
        >
          {STATUS_LABELS[book.reading_status] || book.reading_status}
          <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>▾</span>
        </div>

        {showPicker && (
          <div className="status-sheet">
            {STATUS_OPTIONS.map(opt => (
              <div
                key={opt.value}
                className={`status-sheet-opt ${book.reading_status === opt.value ? 'status-sheet-opt--active' : ''}`}
                onClick={() => { onStatusChange(opt.value); setShowPicker(false) }}
              >
                <span className={`status-badge status-badge--${opt.value}`}>{opt.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fields */}
      {book.date_gifted   && <Field label="Date Gifted"      value={formatDate(book.date_gifted)} />}
      {book.gifted_by     && <Field label="Gifted By"        value={book.gifted_by} />}
      {book.location_bought && <Field label="Location Bought" value={book.location_bought} />}
      {book.personal_note && <Field label="Personal Note"    value={book.personal_note} />}
      {tags.length > 0 && (
        <div className="detail-field">
          <div className="detail-field-label">Tags</div>
          <div className="tags-wrap" style={{ marginTop: 6 }}>
            {tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
          </div>
        </div>
      )}

      {/* Delete */}
      <div style={{ marginTop: 28 }}>
        {showConfirm ? (
          <div className="delete-confirm">
            <p>Delete <strong>"{book.title}"</strong>? This cannot be undone.</p>
            <div className="delete-confirm-btns">
              <button className="btn btn--secondary" style={{ flex: 1, height: 40 }}
                onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn" style={{ flex: 1, height: 40, background: '#DC2626', color: '#fff' }}
                onClick={onDelete}>Delete</button>
            </div>
          </div>
        ) : (
          <button className="btn btn--danger" onClick={() => setShowConfirm(true)}>
            Delete Book
          </button>
        )}
      </div>
    </>
  )
}

function Field({ label, value }) {
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className="detail-field-value">{value}</div>
    </div>
  )
}

/* ── Edit form ── */

function EditForm({ form, set, saving, onSave, onCancel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Gift #</label>
          <input className="form-input" type="number" min="1"
            value={form.gift_number ?? ''} onChange={e => set('gift_number', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Date Gifted</label>
          <input className="form-input" type="date"
            value={toDateInput(form.date_gifted)} onChange={e => set('date_gifted', e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input className="form-input" type="text"
          value={form.title ?? ''} onChange={e => set('title', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Author</label>
        <input className="form-input" type="text"
          value={form.author ?? ''} onChange={e => set('author', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Cover URL</label>
        <input className="form-input" type="url" placeholder="https://…"
          value={form.cover_url ?? ''} onChange={e => set('cover_url', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Reading Status</label>
        <select className="form-input form-select"
          value={form.reading_status ?? 'gifted'} onChange={e => set('reading_status', e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Gifted By</label>
        <input className="form-input" type="text"
          value={form.gifted_by ?? ''} onChange={e => set('gifted_by', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Location Bought</label>
        <input className="form-input" type="text"
          value={form.location_bought ?? ''} onChange={e => set('location_bought', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Tags</label>
        <input className="form-input" type="text" placeholder="fiction, romance (comma-separated)"
          value={form.tags ?? ''} onChange={e => set('tags', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Personal Note</label>
        <textarea className="form-input form-textarea"
          value={form.personal_note ?? ''} onChange={e => set('personal_note', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="btn btn--secondary" disabled={saving} onClick={onCancel}>Cancel</button>
        <button className="btn btn--primary" disabled={saving} onClick={onSave}
          style={{ width: 'auto' }}>
          {saving ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Save'}
        </button>
      </div>
    </div>
  )
}
