import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import api from './services/api'
import './index.css'

// ==================== HELPERS ====================
const formatRp = (n) => 'Rp' + (n || 0).toLocaleString('id-ID')
const ROLES = { customer: 1, seller: 2, warehouse: 3, store: 4, admin: 5, superadmin: 6 }
const hasAccess = (userRole, minRole) => (ROLES[userRole] || 0) >= (ROLES[minRole] || 99)

// ==================== LOGIN ====================
function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.login(email, password)
      if (res.data.user.role === 'customer') {
        setError('Customers cannot access the admin dashboard. Please use the mobile app.')
        setLoading(false)
        return
      }
      api.setToken(res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      onLogin(res.data.user)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <span className="logo">📦</span>
        <h1>SnapShop Admin</h1>
        <p>Sign in to manage your store</p>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@snapshop.id" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <button className="btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  )
}

// ==================== SIDEBAR ====================
function Sidebar({ user, onLogout }) {
  const nav = useNavigate()
  const loc = useLocation()
  const role = user?.role || 'customer'

  const menus = [
    {
      section: 'Main', items: [
        { path: '/', label: 'Dashboard', icon: '📊', min: 'seller' },
      ]
    },
    {
      section: 'Commerce', items: [
        { path: '/products', label: 'Products', icon: '📦', min: 'seller' },
        { path: '/orders', label: 'Orders', icon: '🛒', min: 'admin' },
        { path: '/vouchers', label: 'Vouchers', icon: '🎫', min: 'admin' },
        { path: '/returns', label: 'Returns', icon: '🔄', min: 'admin' },
      ]
    },
    {
      section: 'Inventory', items: [
        { path: '/warehouse', label: 'Stock Overview', icon: '🏭', min: 'warehouse' },
        { path: '/warehouse/alerts', label: 'Low Stock Alerts', icon: '🚨', min: 'warehouse' },
        { path: '/procurement', label: 'Procurement', icon: '📋', min: 'warehouse' },
      ]
    },
    {
      section: 'Analytics', items: [
        { path: '/reports', label: 'Sales Report', icon: '📈', min: 'admin' },
        { path: '/finance', label: 'Profit & Loss', icon: '💰', min: 'admin' },
        { path: '/crm', label: 'Customers CRM', icon: '👤', min: 'admin' },
      ]
    },
    {
      section: 'Store', items: [
        { path: '/stores', label: 'Store Locations', icon: '🏪', min: 'store' },
      ]
    },
    {
      section: 'Administration', items: [
        { path: '/users', label: 'User Management', icon: '👥', min: 'admin' },
        { path: '/audit', label: 'Audit Logs', icon: '📋', min: 'superadmin' },
      ]
    },
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2><span className="accent">Snap</span>Shop</h2>
      </div>
      <div className="sidebar-user">
        <div className="name">{user?.name}</div>
        <div className="role">{role}</div>
      </div>
      <nav className="sidebar-nav">
        {menus.map(section => {
          const visible = section.items.filter(i => hasAccess(role, i.min))
          if (!visible.length) return null
          return (
            <div key={section.section}>
              <div className="nav-section">{section.section}</div>
              {visible.map(item => (
                <div key={item.path} className={`nav-item ${loc.pathname === item.path ? 'active' : ''}`} onClick={() => nav(item.path)}>
                  <span className="icon">{item.icon}</span> {item.label}
                </div>
              ))}
            </div>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="btn-logout" onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  )
}

// ==================== DASHBOARD ====================
function DashboardPage() {
  const [data, setData] = useState(null)
  useEffect(() => { api.getDashboard().then(r => setData(r.data)).catch(() => { }) }, [])
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isSeller = user.role === 'seller'

  if (!data) return <div className="loading">Loading dashboard...</div>

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1><p>{isSeller ? `Welcome back, ${user.name}! Here's your store overview.` : 'Overview of your store performance'}</p></div>
      <div className="stats-grid">
        <div className="stat-card accent"><div className="label">{isSeller ? 'My Revenue' : 'Total Revenue'}</div><div className="value">{formatRp(data.total_revenue)}</div></div>
        <div className="stat-card success"><div className="label">{isSeller ? 'My Orders' : 'Total Orders'}</div><div className="value">{data.total_orders}</div></div>
        <div className="stat-card info"><div className="label">{isSeller ? 'My Products' : 'Products'}</div><div className="value">{data.total_products}</div></div>
        <div className="stat-card warning"><div className="label">{isSeller ? 'My Customers' : 'Customers'}</div><div className="value">{data.total_customers}</div></div>
      </div>

      {data.orders_by_status?.length > 0 && (
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div className="table-header"><h3>📊 Orders by Status</h3></div>
          <div style={{ display: 'flex', gap: 12, padding: '16px 20px', flexWrap: 'wrap' }}>
            {data.orders_by_status.map(s => (
              <div key={s.status} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 20px', textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{s.count}</div>
                <span className={`badge ${s.status}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recent_orders?.length > 0 && (
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div className="table-header"><h3>🛒 Recent Orders</h3></div>
          <table><thead><tr><th>Order #</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{data.recent_orders.map(o => (
              <tr key={o.id}>
                <td style={{ fontFamily: 'monospace' }}>{o.order_number}</td>
                <td>{formatRp(o.total)}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}</tbody></table>
        </div>
      )}

      {data.low_stock?.length > 0 && (
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div className="table-header"><h3>⚠️ Low Stock Alerts</h3></div>
          <table><thead><tr><th>Product</th><th>Stock</th><th>Reorder Point</th></tr></thead>
            <tbody>{data.low_stock.map(p => (
              <tr key={p.id}><td>{p.name}</td><td><span className="badge low">{p.stock}</span></td><td>{p.reorder_point}</td></tr>
            ))}</tbody></table>
        </div>
      )}

      {isSeller && data.total_orders === 0 && !data.recent_orders?.length && (
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Store is ready!</h3>
            <p>You have <strong style={{ color: 'var(--accent)' }}>{data.total_products} products</strong> listed. Orders will appear here once customers start buying.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== PRODUCTS ====================
function ProductsPage() {
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', sku: '', price: '', old_price: '', stock: '', category_id: '3', image_url: '', description: '' })
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const categoryPrefixes = { '1': 'ALL', '2': 'WMN', '3': 'MAN', '4': 'KID', '5': 'SHO', '6': 'BAG' }
  const categoryNames = { '1': 'All', '2': 'Woman', '3': 'Man', '4': 'Kids', '5': 'Shoes', '6': 'Bags' }

  const generateSKU = (name, catId) => {
    if (!name.trim()) return ''
    const prefix = categoryPrefixes[catId] || 'ALL'
    const words = name.trim().toUpperCase().split(/\s+/).filter(w => w.length > 0)
    const nameCode = words.length >= 2
      ? words.slice(0, 2).map(w => w.substring(0, 2)).join('')
      : words[0].substring(0, 4)
    const counter = String(products.length + 1).padStart(3, '0')
    return `${prefix}-${nameCode}-${counter}`
  }

  const updateForm = (updates) => {
    const newForm = { ...form, ...updates }
    if ('name' in updates || 'category_id' in updates) {
      newForm.sku = generateSKU(newForm.name, newForm.category_id)
    }
    setForm(newForm)
  }

  const load = () => {
    let q = `?page=${page}&limit=20`
    if (search) q += `&search=${search}`
    if (user.role === 'seller') q += `&seller_id=${user.id}`
    api.getProducts(q).then(r => { setProducts(r.data || []); setMeta(r.meta) })
  }
  useEffect(load, [page])

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await api.deleteProduct(id)
    load()
  }

  const handleEdit = (p) => {
    setEditingId(p.id)
    setForm({
      name: p.name, sku: p.sku, price: String(p.price),
      old_price: p.old_price ? String(p.old_price) : '',
      stock: String(p.stock), category_id: String(p.category_id),
      image_url: p.image_url || '', description: p.description || ''
    })
    setShowForm(true)
    setFormError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setForm({ name: '', sku: '', price: '', old_price: '', stock: '', category_id: '3', image_url: '', description: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name || !form.price) { setFormError('Name and Price are required'); return }
    const sku = form.sku || generateSKU(form.name, form.category_id)
    setSaving(true)
    try {
      const data = {
        name: form.name, sku,
        price: parseInt(form.price),
        old_price: form.old_price ? parseInt(form.old_price) : null,
        stock: parseInt(form.stock || '0'),
        category_id: parseInt(form.category_id),
        image_url: form.image_url,
        description: form.description,
      }
      if (editingId) {
        await api.updateProduct(editingId, data)
      } else {
        await api.createProduct(data)
      }
      resetForm()
      load()
    } catch (err) { setFormError('Failed to save product: ' + (err.message || 'Unknown error')) }
    setSaving(false)
  }

  return (
    <div>
      <div className="page-header"><h1>Products</h1><p>Manage your product catalog</p></div>
      <div className="toolbar">
        <input className="search-input" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        <button className="btn btn-accent" onClick={load}>Search</button>
        {hasAccess(user.role, 'admin') && (
          <button className="btn btn-primary" onClick={() => { if (showForm) { resetForm() } else { setShowForm(true) } }} style={{ marginLeft: 'auto' }}>
            {showForm ? '✕ Cancel' : '+ Add Product'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="table-card" style={{ marginBottom: 20, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)' }}>{editingId ? '✏️ Edit Product' : 'New Product'}</h3>
          {formError && <div style={{ color: '#e74c3c', marginBottom: 12, padding: '8px 12px', background: 'rgba(231,76,60,0.1)', borderRadius: 8 }}>{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Product Name *</label>
                <input value={form.name} onChange={e => updateForm({ name: e.target.value })} placeholder="e.g. Nike Air Max 90" required />
              </div>
              <div className="form-group">
                <label>SKU <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 'normal' }}>⚡ Auto-generated</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.sku} readOnly style={{ flex: 1, opacity: form.sku ? 1 : 0.5, cursor: 'default' }} placeholder="Type product name to generate..." />
                  {form.name && <button type="button" className="btn btn-sm btn-outline" onClick={() => updateForm({ name: form.name })} title="Regenerate SKU">🔄</button>}
                </div>
              </div>
              <div className="form-group">
                <label>Price (Rp) *</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 1500000" required />
              </div>
              <div className="form-group">
                <label>Old Price (Rp)</label>
                <input type="number" value={form.old_price} onChange={e => setForm({ ...form, old_price: e.target.value })} placeholder="e.g. 2000000 (optional)" />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="e.g. 100" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category_id} onChange={e => updateForm({ category_id: e.target.value })}>
                  <option value="2">Woman</option>
                  <option value="3">Man</option>
                  <option value="4">Kids</option>
                  <option value="5">Shoes</option>
                  <option value="6">Bags</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Product Image</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button type="button" className={`btn btn-sm ${!form._uploadMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setForm({ ...form, _uploadMode: false })}>🔗 URL Link</button>
                  <button type="button" className={`btn btn-sm ${form._uploadMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setForm({ ...form, _uploadMode: true })}>📁 Upload File</button>
                </div>
                {!form._uploadMode ? (
                  <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://images.unsplash.com/..." />
                ) : (
                  <div>
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files[0]
                      if (!file) return
                      setFormError('')
                      setSaving(true)
                      try {
                        // Auto-compress image using Canvas API
                        const compressed = await new Promise((resolve) => {
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            const img = new Image()
                            img.onload = () => {
                              const canvas = document.createElement('canvas')
                              const MAX_SIZE = 1200
                              let w = img.width, h = img.height
                              if (w > MAX_SIZE || h > MAX_SIZE) {
                                if (w > h) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE }
                                else { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE }
                              }
                              canvas.width = w; canvas.height = h
                              canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                              canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8)
                            }
                            img.src = ev.target.result
                          }
                          reader.readAsDataURL(file)
                        })
                        const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
                        setFormError(`📦 Compressed: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`)
                        const res = await api.uploadImage(compressedFile)
                        if (res.success) {
                          setForm(f => ({ ...f, image_url: res.data.url }))
                          setFormError('')
                        } else {
                          setFormError(res.message || 'Upload failed')
                        }
                      } catch { setFormError('Upload failed. Please try again.') }
                      setSaving(false)
                    }} style={{ padding: 8 }} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>Any size • Auto-compressed to max 1200px JPEG</p>
                  </div>
                )}
                {form.image_url && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={form.image_url.startsWith('/') ? `http://localhost:8080${form.image_url}` : form.image_url} alt="Preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} onError={e => e.target.style.display = 'none'} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{form.image_url}</span>
                  </div>
                )}
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Product description..." rows={3} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? '✓ Update Product' : '✓ Save Product'}</button>
              <button className="btn btn-outline" type="button" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <table>
          <thead><tr><th>Image</th><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Rating</th>{hasAccess(user.role, 'admin') && <th>Actions</th>}</tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td><img className="product-img" src={p.image_url} alt={p.name} /></td>
                <td><strong>{p.name}</strong><br /><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.category?.name}</span></td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                <td>{formatRp(p.price)}</td>
                <td><span className={`badge ${p.stock <= p.reorder_point ? 'low' : 'ok'}`}>{p.stock}</span></td>
                <td>⭐ {p.rating}</td>
                {hasAccess(user.role, 'admin') && (
                  <td><div className="actions">
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(p)} style={{ marginRight: 6 }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {meta && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>Page {meta.page} of {meta.total_pages}</span>
          <button className="btn btn-outline" disabled={page >= meta.total_pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}

// ==================== ORDERS ====================
function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')

  const load = () => {
    let q = '?limit=50'
    if (filter) q += `&status=${filter}`
    api.getOrders(q).then(r => setOrders(r.data || []))
  }
  useEffect(load, [filter])

  const updateStatus = async (id, status) => {
    await api.updateOrderStatus(id, status)
    load()
  }

  const statuses = ['pending', 'confirmed', 'preparing', 'in_transit', 'delivered', 'canceled']

  return (
    <div>
      <div className="page-header"><h1>Orders</h1><p>Manage customer orders</p></div>
      <div className="toolbar">
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Order #</th><th>Total</th><th>Courier</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No orders yet</td></tr>
            ) : orders.map(o => (
              <tr key={o.id}>
                <td style={{ fontFamily: 'monospace' }}>{o.order_number}</td>
                <td>{formatRp(o.total)}</td>
                <td>{o.courier_name}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                <td>
                  <select className="filter-select" value={o.status} onChange={e => updateStatus(o.id, e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== VOUCHERS ====================
function VouchersPage() {
  const [vouchers, setVouchers] = useState([])
  useEffect(() => { api.getVouchers().then(r => setVouchers(r.data || [])) }, [])

  return (
    <div>
      <div className="page-header"><h1>Vouchers</h1><p>Manage promo codes and discounts</p></div>
      <div className="table-card">
        <table>
          <thead><tr><th>Code</th><th>Title</th><th>Type</th><th>Value</th><th>Min Purchase</th><th>Max Discount</th><th>Valid Until</th></tr></thead>
          <tbody>
            {vouchers.map(v => (
              <tr key={v.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>{v.code}</td>
                <td>{v.title}</td>
                <td><span className="badge ok">{v.discount_type}</span></td>
                <td>{v.discount_type === 'percentage' ? `${v.discount_value}%` : formatRp(v.discount_value)}</td>
                <td>{formatRp(v.min_purchase)}</td>
                <td>{formatRp(v.max_discount)}</td>
                <td style={{ fontSize: 12 }}>{new Date(v.valid_until).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== USERS ====================
function UsersPage() {
  const [users, setUsers] = useState([])
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const load = () => api.getUsers('?limit=100').then(r => setUsers(r.data || []))
  useEffect(() => { load() }, [])

  const changeRole = async (id, role) => {
    try { await api.updateUserRole(id, role); load() } catch (e) { alert(e.message) }
  }

  const roles = ['customer', 'seller', 'warehouse', 'store', 'admin', 'superadmin']

  return (
    <div>
      <div className="page-header"><h1>User Management</h1><p>Manage user accounts and roles</p></div>
      <div className="table-card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th>{hasAccess(currentUser.role, 'superadmin') && <th>Change Role</th>}</tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td>{u.phone || '-'}</td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                {hasAccess(currentUser.role, 'superadmin') && (
                  <td>
                    <select className="filter-select" value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== WAREHOUSE ====================
function WarehousePage() {
  const [data, setData] = useState(null)
  useEffect(() => { api.getStockOverview().then(r => setData(r.data)).catch(() => { }) }, [])
  if (!data) return <div className="loading">Loading stock overview...</div>

  return (
    <div>
      <div className="page-header"><h1>Stock Overview</h1><p>Warehouse inventory with FIFO aging</p></div>
      <div className="table-card" style={{ marginBottom: 24 }}>
        <div className="table-header"><h3>Product Stock</h3></div>
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Lead Time</th><th>Reorder Point</th><th>Status</th></tr></thead>
          <tbody>
            {(data.products || []).map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                <td><strong>{p.stock}</strong></td>
                <td>{p.lead_time_days} days</td>
                <td>{p.reorder_point}</td>
                <td><span className={`badge ${p.stock <= p.reorder_point ? 'low' : 'ok'}`}>{p.stock <= p.reorder_point ? 'LOW' : 'OK'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.aging?.length > 0 && (
        <div className="table-card">
          <div className="table-header"><h3>FIFO Stock Aging</h3></div>
          <table>
            <thead><tr><th>Product</th><th>Batch</th><th>Remaining</th><th>Days Old</th><th>Status</th></tr></thead>
            <tbody>
              {data.aging.map((b, i) => (
                <tr key={i}>
                  <td>{b.product_name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.batch_number}</td>
                  <td>{b.remaining}</td>
                  <td>{b.days_old} days</td>
                  <td><span className={`badge ${b.days_old > 90 ? 'low' : b.days_old > 30 ? 'pending' : 'ok'}`}>
                    {b.days_old > 90 ? 'AGING' : b.days_old > 30 ? 'WATCH' : 'FRESH'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== LOW STOCK ALERTS ====================
function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  useEffect(() => { api.getLowStockAlerts().then(r => setAlerts(r.data?.alerts || [])).catch(() => { }) }, [])

  return (
    <div>
      <div className="page-header"><h1>Low Stock Alerts</h1><p>Products that need restocking</p></div>
      {alerts.length === 0 ? (
        <div className="empty"><div className="icon">✅</div><p>All stock levels are healthy!</p></div>
      ) : alerts.map(p => (
        <div className="alert-card" key={p.id}>
          <div className="alert-icon">🚨</div>
          <div className="alert-info">
            <div className="alert-title">{p.name} ({p.sku})</div>
            <div className="alert-sub">Stock: {p.stock} / Reorder Point: {p.reorder_point} / Lead Time: {p.lead_time_days} days</div>
          </div>
          <span className="badge low">RESTOCK NEEDED</span>
        </div>
      ))}
    </div>
  )
}

// ==================== STORES ====================
function StoresPage() {
  const [stores, setStores] = useState([])
  useEffect(() => { api.getStores().then(r => setStores(r.data || [])) }, [])

  return (
    <div>
      <div className="page-header"><h1>Store Locations</h1><p>Manage your physical stores</p></div>
      <div className="stats-grid">
        {stores.map(s => (
          <div className="stat-card" key={s.id}>
            <div className="label">🏪 {s.city}</div>
            <div className="value" style={{ fontSize: 18 }}>{s.name}</div>
            <div className="sub">{s.address}</div>
            <div className="sub" style={{ marginTop: 8 }}>📞 {s.phone} • 🕐 {s.hours}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== AUDIT LOGS ====================
function AuditPage() {
  const [logs, setLogs] = useState([])
  useEffect(() => { api.getAuditLogs('?limit=50').then(r => setLogs(r.data || [])).catch(() => { }) }, [])

  return (
    <div>
      <div className="page-header"><h1>Audit Logs</h1><p>System activity trail</p></div>
      <div className="table-card">
        <table>
          <thead><tr><th>Action</th><th>Entity</th><th>Details</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No audit logs yet</td></tr>
            ) : logs.map(l => (
              <tr key={l.id}>
                <td><span className="badge admin">{l.action}</span></td>
                <td>{l.entity} #{l.entity_id}</td>
                <td>{l.details}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.ip}</td>
                <td style={{ fontSize: 12 }}>{new Date(l.created_at).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== REPORTS ====================
function ReportsPage() {
  const [data, setData] = useState(null)
  const [topProducts, setTop] = useState([])
  const [catRevenue, setCat] = useState([])
  const [period, setPeriod] = useState(30)
  useEffect(() => {
    api.getSalesReport(period).then(r => setData(r.data)).catch(() => { })
    api.getTopProducts(10).then(r => setTop(r.data || [])).catch(() => { })
    api.getRevenueByCategory().then(r => setCat(r.data || [])).catch(() => { })
  }, [period])
  if (!data) return <div className="loading">Loading reports...</div>
  return (
    <div>
      <div className="page-header"><h1>Sales Report</h1><p>Revenue analytics and product performance</p></div>
      <div className="toolbar">
        <select className="filter-select" value={period} onChange={e => setPeriod(+e.target.value)}>
          <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option><option value={365}>Last year</option>
        </select>
      </div>
      <div className="stats-grid">
        <div className="stat-card accent"><div className="label">Revenue ({period}d)</div><div className="value">{formatRp(data.total_revenue)}</div></div>
        <div className="stat-card success"><div className="label">Orders</div><div className="value">{data.total_orders}</div></div>
        <div className="stat-card info"><div className="label">Avg Order Value</div><div className="value">{formatRp(data.avg_order_value)}</div></div>
      </div>
      {data.daily_sales?.length > 0 && (
        <div className="table-card" style={{ marginBottom: 24 }}>
          <div className="table-header"><h3>📈 Daily Sales</h3></div>
          <table><thead><tr><th>Date</th><th>Revenue</th><th>Orders</th></tr></thead>
            <tbody>{data.daily_sales.map(d => (
              <tr key={d.date}><td>{d.date}</td><td>{formatRp(d.revenue)}</td><td>{d.orders}</td></tr>
            ))}</tbody></table>
        </div>
      )}
      {topProducts.length > 0 && (
        <div className="table-card" style={{ marginBottom: 24 }}>
          <div className="table-header"><h3>🏆 Top Products</h3></div>
          <table><thead><tr><th>Image</th><th>Product</th><th>Sold</th><th>Revenue</th><th>Rating</th></tr></thead>
            <tbody>{topProducts.map(p => (
              <tr key={p.product_id}>
                <td><img className="product-img" src={p.image_url} alt="" /></td>
                <td><strong>{p.product_name}</strong><br /><span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</span></td>
                <td><strong>{p.total_sold}</strong></td><td>{formatRp(p.total_revenue)}</td><td>⭐ {p.avg_rating}</td>
              </tr>
            ))}</tbody></table>
        </div>
      )}
      {catRevenue.length > 0 && (
        <div className="table-card">
          <div className="table-header"><h3>📊 Revenue by Category</h3></div>
          <table><thead><tr><th>Category</th><th>Products</th><th>Orders</th><th>Revenue</th></tr></thead>
            <tbody>{catRevenue.map(c => (
              <tr key={c.category_id}><td><strong>{c.category_name}</strong></td><td>{c.products}</td><td>{c.orders}</td><td>{formatRp(c.revenue)}</td></tr>
            ))}</tbody></table>
        </div>
      )}
    </div>
  )
}

// ==================== PROCUREMENT ====================
function ProcurementPage() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const load = () => api.getPurchaseOrders(filter ? `?status=${filter}` : '').then(r => setOrders(r.data || [])).catch(() => { })
  useEffect(() => { load() }, [filter])
  const updateStatus = async (id, status) => { await api.updatePOStatus(id, status); load() }
  const poStatuses = ['draft', 'sent', 'confirmed', 'received', 'canceled']
  return (
    <div>
      <div className="page-header"><h1>Procurement</h1><p>Purchase orders to suppliers</p></div>
      <div className="toolbar">
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>{poStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="table-card">
        <table><thead><tr><th>PO #</th><th>Supplier</th><th>Items</th><th>Total</th><th>Expected</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{orders.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No purchase orders yet</td></tr>
          ) : orders.map(po => (
            <tr key={po.id}>
              <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>{po.po_number}</td>
              <td>{po.supplier?.name || '-'}</td>
              <td>{po.items?.length || 0} items</td>
              <td>{formatRp(po.total_amount)}</td>
              <td style={{ fontSize: 12 }}>{po.expected_at ? new Date(po.expected_at).toLocaleDateString('id-ID') : '-'}</td>
              <td><span className={`badge ${po.status === 'received' ? 'delivered' : po.status === 'canceled' ? 'canceled' : 'pending'}`}>{po.status}</span></td>
              <td><select className="filter-select" value={po.status} onChange={e => updateStatus(po.id, e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
                {poStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== RETURNS ====================
function ReturnsPage() {
  const [returns, setReturns] = useState([])
  const [filter, setFilter] = useState('')
  const load = () => api.getReturns(filter ? `?status=${filter}` : '').then(r => setReturns(r.data || [])).catch(() => { })
  useEffect(() => { load() }, [filter])
  const update = async (id, status) => { await api.updateReturn(id, { status }); load() }
  const retStatuses = ['requested', 'approved', 'rejected', 'refunded']
  return (
    <div>
      <div className="page-header"><h1>Returns & Refunds</h1><p>Manage product returns and refunds</p></div>
      <div className="toolbar">
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>{retStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="table-card">
        <table><thead><tr><th>Order</th><th>Customer</th><th>Reason</th><th>Refund</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>{returns.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No returns yet</td></tr>
          ) : returns.map(r => (
            <tr key={r.id}>
              <td style={{ fontFamily: 'monospace' }}>#{r.order_id}</td>
              <td>{r.user?.name || '-'}</td>
              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reason}</td>
              <td>{formatRp(r.refund_amount)}</td>
              <td><span className={`badge ${r.status === 'refunded' ? 'delivered' : r.status === 'rejected' ? 'canceled' : r.status === 'approved' ? 'confirmed' : 'pending'}`}>{r.status}</span></td>
              <td style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
              <td><select className="filter-select" value={r.status} onChange={e => update(r.id, e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
                {retStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== FINANCE ====================
function FinancePage() {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState(30)
  useEffect(() => { api.getProfitLoss(period).then(r => setData(r.data)).catch(() => { }) }, [period])
  if (!data) return <div className="loading">Loading finance data...</div>
  return (
    <div>
      <div className="page-header"><h1>Profit & Loss</h1><p>Financial overview and margin analysis</p></div>
      <div className="toolbar">
        <select className="filter-select" value={period} onChange={e => setPeriod(+e.target.value)}>
          <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option><option value={365}>Last year</option>
        </select>
      </div>
      <div className="stats-grid">
        <div className="stat-card accent"><div className="label">Revenue</div><div className="value">{formatRp(data.total_revenue)}</div></div>
        <div className="stat-card warning"><div className="label">COGS</div><div className="value">{formatRp(data.cogs)}</div></div>
        <div className="stat-card success"><div className="label">Gross Profit</div><div className="value">{formatRp(data.gross_profit)}</div></div>
        <div className="stat-card info"><div className="label">Net Profit</div><div className="value">{formatRp(data.net_profit)}</div></div>
      </div>
      <div className="table-card">
        <div className="table-header"><h3>💰 P&L Breakdown</h3></div>
        <table><thead><tr><th>Item</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>Total Revenue</td><td style={{ color: 'var(--success)' }}>{formatRp(data.total_revenue)}</td></tr>
            <tr><td>  − Cost of Goods Sold (COGS)</td><td style={{ color: 'var(--danger)' }}>-{formatRp(data.cogs)}</td></tr>
            <tr style={{ borderTop: '2px solid var(--border)' }}><td><strong>Gross Profit</strong></td><td><strong>{formatRp(data.gross_profit)}</strong></td></tr>
            <tr><td>  − Refunds</td><td style={{ color: 'var(--danger)' }}>-{formatRp(data.total_refunds)}</td></tr>
            <tr style={{ borderTop: '2px solid var(--border)' }}><td><strong>Net Profit</strong></td><td><strong style={{ color: data.net_profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRp(data.net_profit)}</strong></td></tr>
            <tr><td>Shipping Revenue</td><td>{formatRp(data.shipping_revenue)}</td></tr>
            <tr><td>Discounts Given</td><td style={{ color: 'var(--warning)' }}>-{formatRp(data.total_discounts)}</td></tr>
            <tr><td><strong>Margin</strong></td><td><span className={`badge ${data.margin >= 20 ? 'ok' : data.margin >= 0 ? 'pending' : 'low'}`}>{data.margin.toFixed(1)}%</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== CRM ====================
function CRMPage() {
  const [customers, setCustomers] = useState([])
  const [detail, setDetail] = useState(null)
  useEffect(() => { api.getCustomers().then(r => setCustomers(r.data || [])).catch(() => { }) }, [])
  const viewDetail = async (id) => {
    const res = await api.getCustomerDetail(id)
    setDetail(res.data)
  }
  if (detail) return (
    <div>
      <div className="page-header"><h1>Customer Detail</h1>
        <button className="btn btn-outline" onClick={() => setDetail(null)} style={{ marginTop: 8 }}>← Back to list</button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="label">Customer</div><div className="value" style={{ fontSize: 18 }}>{detail.customer?.name}</div><div className="sub">{detail.customer?.email} • {detail.customer?.phone}</div></div>
        <div className="stat-card accent"><div className="label">Total Spent</div><div className="value">{formatRp(detail.total_spent)}</div></div>
        <div className="stat-card success"><div className="label">Total Orders</div><div className="value">{detail.total_orders}</div></div>
      </div>
      {detail.orders?.length > 0 && (
        <div className="table-card" style={{ marginBottom: 24 }}>
          <div className="table-header"><h3>📦 Order History</h3></div>
          <table><thead><tr><th>Order #</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{detail.orders.map(o => (
              <tr key={o.id}><td style={{ fontFamily: 'monospace' }}>{o.order_number}</td><td>{formatRp(o.total)}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('id-ID')}</td></tr>
            ))}</tbody></table>
        </div>
      )}
      {detail.reviews?.length > 0 && (
        <div className="table-card">
          <div className="table-header"><h3>⭐ Reviews</h3></div>
          <table><thead><tr><th>Product</th><th>Rating</th><th>Review</th></tr></thead>
            <tbody>{detail.reviews.map(r => (
              <tr key={r.id}><td>{r.product?.name}</td><td>{'⭐'.repeat(r.rating)}</td><td>{r.text}</td></tr>
            ))}</tbody></table>
        </div>
      )}
    </div>
  )
  return (
    <div>
      <div className="page-header"><h1>Customers CRM</h1><p>Customer insights and lifetime value</p></div>
      <div className="table-card">
        <table><thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Total Spent</th><th>Avg Order</th><th>Last Order</th><th></th></tr></thead>
          <tbody>{customers.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No customers yet</td></tr>
          ) : customers.map(c => (
            <tr key={c.id}>
              <td><strong>{c.name}</strong></td><td>{c.email}</td><td>{c.total_orders}</td>
              <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatRp(c.total_spent)}</td>
              <td>{formatRp(c.avg_order)}</td>
              <td style={{ fontSize: 12 }}>{c.last_order ? new Date(c.last_order).toLocaleDateString('id-ID') : 'Never'}</td>
              <td><button className="btn btn-sm btn-accent" onClick={() => viewDetail(c.id)}>View</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== LAYOUT ====================
function Layout({ user, onLogout }) {
  return (
    <div className="layout">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/vouchers" element={<VouchersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/warehouse" element={<WarehousePage />} />
          <Route path="/warehouse/alerts" element={<AlertsPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/procurement" element={<ProcurementPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

// ==================== APP ====================
function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const handleLogin = (u) => setUser(u)
  const handleLogout = () => { api.clearToken(); setUser(null) }

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout} />
    </BrowserRouter>
  )
}

export default App
