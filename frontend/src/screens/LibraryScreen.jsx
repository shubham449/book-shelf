import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '../lib/pocketbase'
import { useAuth } from '../context/AuthContext'
import { placeholderColor, STATUS_LABELS } from '../utils/bookUtils'
import CoverImage from '../components/CoverImage'

export default function LibraryScreen() {
  const navigate            = useNavigate()
  const { logout }          = useAuth()
  const [books, setBooks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState('number')

  useEffect(() => {
    pb.collection('books')
      .getFullList({ sort: 'gift_number', requestKey: null })
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = books
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.tags?.toLowerCase().includes(q)
      )
    }
    if (sort === 'status') {
      const order = { reading: 0, gifted: 1, finished: 2, dnf: 3 }
      list = [...list].sort((a, b) =>
        (order[a.reading_status] ?? 4) - (order[b.reading_status] ?? 4)
      )
    }
    return list
  }, [books, search, sort])

  return (
    <div className="screen">
      <header className="header">
        <h1 className="header__title">📚 Bookshelf</h1>
        <button className="header__action" onClick={logout} title="Sign out" aria-label="Sign out">
          ⎋
        </button>
      </header>

      <div className="search-wrap">
        <div className="search-row">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="search"
            placeholder="Search by title, author or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="sort-tabs">
        {[['number', 'By Number'], ['status', 'By Status']].map(([val, label]) => (
          <button
            key={val}
            className={`sort-tab ${sort === val ? 'sort-tab--active' : ''}`}
            onClick={() => setSort(val)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="content">
        {loading ? (
          <div className="center-fill">
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="center-fill">
            <div className="empty-icon">📖</div>
            <div className="empty-title">{search ? 'No results' : 'No books yet'}</div>
            <div className="empty-text">
              {search ? 'Try a different search.' : 'Tap + to add your first book.'}
            </div>
          </div>
        ) : (
          <div className="book-grid">
            {filtered.map(book => (
              <div
                key={book.id}
                className="book-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/book/${book.id}`)}
              >
                <CoverImage
                  src={book.cover_url}
                  title={book.title}
                  coverClass="book-card__cover"
                  placeholderClass="book-card__cover-ph"
                />
                <div className="book-card__info">
                  <div className="book-card__num">#{book.gift_number}</div>
                  <div className="book-card__title">{book.title}</div>
                  {book.author && (
                    <div className="book-card__author">{book.author}</div>
                  )}
                  {book.reading_status && (
                    <div style={{ marginTop: 6 }}>
                      <span className={`status-badge status-badge--${book.reading_status}`}>
                        {STATUS_LABELS[book.reading_status] || book.reading_status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => navigate('/add')} aria-label="Add book">+</button>
    </div>
  )
}
