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
  const [dailySales, setDailySales] = useState([])
  useEffect(() => {
    api.getDashboard().then(r => setData(r.data)).catch(() => { })
    api.getSalesReport(7).then(r => setDailySales(r.data?.daily_sales || [])).catch(() => { })
  }, [])
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isSeller = user.role === 'seller'

  if (!data) return <div className="loading" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}><div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>Loading dashboard...</div>

  const statusColors = {
    waiting_payment: '#F59E0B', paid: '#6366F1', confirmed: '#3B82F6',
    preparing: '#8B5CF6', in_transit: '#F97316', delivered: '#10B981',
    returned: '#EF4444', canceled: '#6B7280', pending: '#9CA3AF'
  }
  const statusLabels = {
    waiting_payment: 'Menunggu Bayar', paid: 'Dibayar', confirmed: 'Dikonfirmasi',
    preparing: 'Diproses', in_transit: 'Dikirim', delivered: 'Diterima',
    returned: 'Retur', canceled: 'Dibatalkan', pending: 'Pending'
  }
  const maxStatusCount = Math.max(1, ...(data.orders_by_status || []).map(s => s.count))
  const maxDailySales = Math.max(1, ...dailySales.map(d => d.revenue))
  const totalStatusOrders = (data.orders_by_status || []).reduce((a, s) => a + s.count, 0)
  const avgOrderValue = data.total_orders > 0 ? Math.round(data.total_revenue / data.total_orders) : 0
  const ordersPerCustomer = data.total_customers > 0 ? (data.total_orders / data.total_customers).toFixed(1) : '0'
  const revenuePerProduct = data.total_products > 0 ? Math.round(data.total_revenue / data.total_products) : 0

  const statCards = [
    { label: isSeller ? 'My Revenue' : 'Total Revenue', value: formatRp(data.total_revenue), icon: '💰', color: '#7c5cfc', gradient: 'linear-gradient(135deg, #7c5cfc 0%, #a78bfa 100%)', bg: 'rgba(124,92,252,0.08)' },
    { label: isSeller ? 'My Orders' : 'Total Orders', value: data.total_orders, icon: '📦', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', bg: 'rgba(16,185,129,0.08)' },
    { label: isSeller ? 'My Products' : 'Products', value: data.total_products, icon: '🏷️', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)', bg: 'rgba(59,130,246,0.08)' },
    { label: isSeller ? 'My Customers' : 'Customers', value: data.total_customers, icon: '👥', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', bg: 'rgba(245,158,11,0.08)' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>{isSeller ? `Welcome, ${user.name}` : 'Dashboard'}</h1>
        <p>{isSeller ? 'Your store performance overview' : 'Overview of your store performance'}</p>
      </div>

      {/* Premium Stats Cards */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-card-solid)', borderRadius: 16, padding: '24px 24px 20px', border: '1px solid var(--border)',
            position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: 'none',
          }} className="stat-card-premium">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.gradient }} />
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 64, opacity: 0.06, filter: 'blur(1px)' }}>{s.icon}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', background: s.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>

        {/* Revenue Trend Chart */}
        <div className="table-card" style={{ padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Revenue Trend</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>7 hari terakhir</span>
            </div>
            <div style={{ background: 'rgba(124,92,252,0.1)', padding: '6px 12px', borderRadius: 8, fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>📈 Weekly</div>
          </div>
          {dailySales.length > 0 ? (
            <div style={{ position: 'relative', paddingLeft: 50 }}>
              {/* Y-axis labels */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 45, textAlign: 'right' }}>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatRp(maxDailySales)}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatRp(Math.round(maxDailySales / 2))}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>0</span>
              </div>
              {/* Grid lines */}
              <div style={{ position: 'absolute', left: 50, right: 0, top: 0, bottom: 24, borderLeft: '1px solid var(--border)' }}>
                <div style={{ position: 'absolute', top: '0%', left: 0, right: 0, height: 1, background: 'var(--border)' }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border)', borderStyle: 'dashed' }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, height: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, height: 180, position: 'relative' }}>
                {dailySales.map((d, i) => {
                  const pct = d.revenue / maxDailySales
                  const barH = Math.max(Math.round(pct * 150), 6)
                  const day = new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' })
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                      {d.orders > 0 && <div style={{ background: 'var(--accent)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700, marginBottom: 4, whiteSpace: 'nowrap' }}>{d.orders} order</div>}
                      <div style={{
                        width: '70%', maxWidth: 44, borderRadius: '8px 8px 2px 2px',
                        height: barH,
                        background: 'linear-gradient(180deg, #7c5cfc 0%, #6366F1 60%, #4f46e5 100%)',
                        transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 2px 8px rgba(124,92,252,0.3)',
                      }} title={`${formatRp(d.revenue)} (${d.orders} orders)`} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4 }}>{day}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 36, opacity: 0.3 }}>📊</span>
              <span>Belum ada data penjualan</span>
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="table-card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Distribusi Order</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{totalStatusOrders} total order</span>
          </div>
          {data.orders_by_status?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.orders_by_status.map(s => {
                const pct = (s.count / maxStatusCount) * 100
                const pctTotal = totalStatusOrders > 0 ? ((s.count / totalStatusOrders) * 100).toFixed(0) : 0
                const color = statusColors[s.status] || '#6B7280'
                return (
                  <div key={s.status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{statusLabels[s.status] || s.status}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.count} ({pctTotal}%)</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 4,
                        background: `linear-gradient(90deg, ${color}CC, ${color})`,
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 0 8px ${color}40`,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Belum ada order</div>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      {data.total_orders > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Rata-rata Nilai Order', value: formatRp(avgOrderValue), icon: '💰', color: '#7c5cfc' },
            { label: 'Order per Customer', value: ordersPerCustomer, icon: '📊', color: '#10B981' },
            { label: 'Revenue per Produk', value: formatRp(revenuePerProduct), icon: '🏷️', color: '#6366F1' },
          ].map((s, i) => (
            <div key={i} className="table-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-0.3px' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      {data.recent_orders?.length > 0 && (
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Recent Orders</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.recent_orders.length} pesanan terbaru</span>
            </div>
          </div>
          <table><thead><tr><th>Order #</th><th>Total</th><th>Status</th><th>Tanggal</th></tr></thead>
            <tbody>{data.recent_orders.map(o => (
              <tr key={o.id}>
                <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-light)' }}>{o.order_number}</span></td>
                <td><strong>{formatRp(o.total)}</strong></td>
                <td><span className={`badge ${o.status}`}>{statusLabels[o.status] || o.status}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
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
  const imgUrl = (url) => url?.startsWith('/') ? `http://localhost:8080${url}` : url
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
                        // Try auto-compress with Canvas API
                        let uploadFile = file
                        try {
                          const compressed = await new Promise((resolve, reject) => {
                            const reader = new FileReader()
                            reader.onerror = () => reject(new Error('Read failed'))
                            reader.onload = (ev) => {
                              const img = new Image()
                              img.onerror = () => reject(new Error('Format not supported for compression'))
                              img.onload = () => {
                                try {
                                  const canvas = document.createElement('canvas')
                                  const MAX_SIZE = 1200
                                  let w = img.width, h = img.height
                                  if (w > MAX_SIZE || h > MAX_SIZE) {
                                    if (w > h) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE }
                                    else { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE }
                                  }
                                  canvas.width = w; canvas.height = h
                                  canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                                  canvas.toBlob((blob) => {
                                    if (blob) resolve(blob); else reject(new Error('Compress failed'))
                                  }, 'image/jpeg', 0.8)
                                } catch (err) { reject(err) }
                              }
                              img.src = ev.target.result
                            }
                            reader.readAsDataURL(file)
                          })
                          uploadFile = new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
                          console.log(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(uploadFile.size / 1024).toFixed(0)}KB`)
                        } catch {
                          console.log('Compression skipped, uploading original file')
                          uploadFile = file
                        }
                        const res = await api.uploadImage(uploadFile)
                        if (res.success) {
                          setForm(f => ({ ...f, image_url: res.data.url }))
                          setFormError('')
                        } else {
                          setFormError(res.message || 'Upload failed')
                        }
                      } catch { setFormError('Upload failed. Please try again.') }
                      setSaving(false)
                    }} style={{ padding: 8 }} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>Any size • JPG, PNG, WebP, AVIF, GIF</p>
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
                <td><img className="product-img" src={imgUrl(p.image_url)} alt={p.name} /></td>
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
  const [search, setSearch] = useState('')

  const load = () => {
    let q = '?limit=50'
    if (filter) q += `&status=${filter}`
    if (search) q += `&search=${search}`
    api.getOrders(q).then(r => {
      setOrders(r.data || [])
    }).catch(e => console.error('Failed to load orders:', e))
  }
  useEffect(load, [filter])

  const updateStatus = async (id, status) => {
    await api.updateOrderStatus(id, status)
    load()
  }

  const statuses = ['pending', 'waiting_payment', 'paid', 'confirmed', 'preparing', 'in_transit', 'delivered', 'returned', 'canceled']
  const statusLabels = {
    pending: 'Pending', waiting_payment: 'Menunggu Bayar', paid: 'Dibayar',
    confirmed: 'Dikonfirmasi', preparing: 'Diproses', in_transit: 'Dikirim',
    delivered: 'Diterima', returned: 'Retur', canceled: 'Dibatalkan'
  }

  return (
    <div>
      <div className="page-header"><h1>Orders</h1><p>Manage customer orders</p></div>
      <div className="toolbar" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="search-input" placeholder="Cari nomor order..." value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          style={{ maxWidth: 280 }} />
        <button className="btn btn-accent" onClick={load}>Search</button>
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{statusLabels[s] || s}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>{orders.length} orders</span>
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Courier</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No orders found</td></tr>
            ) : orders.map(o => (
              <tr key={o.id}>
                <td style={{ fontFamily: 'monospace' }}>{o.order_number}</td>
                <td>{o.user?.name || '-'}</td>
                <td>{formatRp(o.total)}</td>
                <td>{o.courier_name || '-'}</td>
                <td><span className={`badge ${o.status}`}>{statusLabels[o.status] || o.status}</span></td>
                <td style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                <td>
                  <select className="filter-select" value={o.status} onChange={e => updateStatus(o.id, e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {statuses.map(s => <option key={s} value={s}>{statusLabels[s] || s}</option>)}
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
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '', title: '', description: '', discount_type: 'percentage',
    discount_value: '', min_purchase: '', max_discount: '', valid_until: '', usage_limit: '0'
  })

  const loadVouchers = () => api.getVouchers().then(r => setVouchers(r.data || []))
  useEffect(() => { loadVouchers() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code || !form.title || !form.discount_value || !form.valid_until) {
      alert('Isi semua field yang wajib!'); return
    }
    setSaving(true)
    try {
      await api.createVoucher({
        code: form.code.toUpperCase(),
        title: form.title,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: parseInt(form.discount_value) || 0,
        min_purchase: parseInt(form.min_purchase) || 0,
        max_discount: parseInt(form.max_discount) || 0,
        valid_until: new Date(form.valid_until).toISOString(),
        is_active: true,
        usage_limit: parseInt(form.usage_limit) || 0,
      })
      setForm({ code: '', title: '', description: '', discount_type: 'percentage', discount_value: '', min_purchase: '', max_discount: '', valid_until: '', usage_limit: '0' })
      setShowForm(false)
      loadVouchers()
    } catch (err) {
      alert('Gagal membuat voucher: ' + (err.message || 'Unknown error'))
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Vouchers</h1><p>Manage promo codes and discounts</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginTop: 4 }}>
          {showForm ? '✕ Tutup' : '+ Buat Voucher'}
        </button>
      </div>

      {showForm && (
        <div className="table-card" style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Buat Voucher Baru</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Kode Voucher *</label>
              <input style={inputStyle} placeholder="contoh: DISKON50" value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Judul *</label>
              <input style={inputStyle} placeholder="contoh: Diskon Akhir Tahun" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Deskripsi</label>
              <input style={inputStyle} placeholder="Deskripsi voucher (opsional)" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Tipe Diskon *</label>
              <select style={inputStyle} value={form.discount_type}
                onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
                <option value="shipping">Gratis Ongkir</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nilai Diskon *</label>
              <input style={inputStyle} type="number" placeholder={form.discount_type === 'percentage' ? 'contoh: 10' : 'contoh: 50000'}
                value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Min. Pembelian (Rp)</label>
              <input style={inputStyle} type="number" placeholder="contoh: 500000" value={form.min_purchase}
                onChange={e => setForm({ ...form, min_purchase: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Maks. Diskon (Rp)</label>
              <input style={inputStyle} type="number" placeholder="contoh: 200000" value={form.max_discount}
                onChange={e => setForm({ ...form, max_discount: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Berlaku Sampai *</label>
              <input style={inputStyle} type="date" value={form.valid_until}
                onChange={e => setForm({ ...form, valid_until: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Limit Pemakaian (0 = unlimited)</label>
              <input style={inputStyle} type="number" placeholder="0" value={form.usage_limit}
                onChange={e => setForm({ ...form, usage_limit: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : '💾 Simpan Voucher'}</button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
            </div>
          </form>
        </div>
      )}

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

const labelStyle = { display: 'block', fontSize: 11, color: '#9191a8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: '#141425', color: '#eaeaef', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }

// ==================== USERS ====================
function UsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [detail, setDetail] = useState(null)
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [msg, setMsg] = useState('')
  const [showResetPw, setShowResetPw] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwRequests, setPwRequests] = useState([])
  const [showRequests, setShowRequests] = useState(false)
  const [approveId, setApproveId] = useState(null)
  const [approvePw, setApprovePw] = useState('')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isSuperAdmin = hasAccess(currentUser.role, 'superadmin')
  const staffRoles = ['seller', 'warehouse', 'store', 'admin']

  const load = () => {
    let q = `?limit=20&page=${page}`
    if (roleFilter) q += `&role=${roleFilter}`
    if (search) q += `&search=${encodeURIComponent(search)}`
    api.getUsers(q).then(r => { setUsers(r.data || []); setMeta(r.meta || null) }).catch(() => { })
  }
  const loadRequests = () => { if (isSuperAdmin) api.getPasswordRequests('pending').then(r => setPwRequests(r.data || [])).catch(() => { }) }
  useEffect(() => { load(); loadRequests() }, [page, roleFilter])

  const doSearch = (e) => { e.preventDefault(); setPage(1); load() }
  const changeRole = async (id, role) => {
    try { await api.updateUserRole(id, role); load() } catch (e) { alert(e.response?.data?.error || e.message) }
  }
  const handleDelete = async (u) => {
    if (!confirm(`Hapus user "${u.name}" (${u.email})? Aksi ini tidak bisa dibatalkan.`)) return
    try { await api.deleteUser(u.id); load(); if (detail?.id === u.id) setDetail(null) } catch (e) { alert(e.response?.data?.error || e.message) }
  }
  const handleResetPassword = async () => {
    if (newPw.length < 6) { setMsg('⚠️ Password minimal 6 karakter'); return }
    if (newPw !== confirmPw) { setMsg('⚠️ Konfirmasi password tidak cocok'); return }
    try {
      await api.resetUserPassword(detail.id, newPw)
      setMsg(`✅ Password ${detail.name} berhasil direset`); setShowResetPw(false); setNewPw(''); setConfirmPw('')
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || e.message)) }
  }
  const handleApproveRequest = async (reqId) => {
    if (approvePw.length < 6) { setMsg('⚠️ Password minimal 6 karakter'); return }
    try {
      await api.approvePasswordRequest(reqId, approvePw); setMsg('✅ Request disetujui'); setApproveId(null); setApprovePw(''); loadRequests()
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || e.message)) }
  }
  const handleRejectRequest = async (reqId) => {
    try { await api.rejectPasswordRequest(reqId); setMsg('✅ Request ditolak'); loadRequests() } catch (e) { setMsg('❌ ' + (e.response?.data?.error || e.message)) }
  }

  const roles = ['customer', 'seller', 'warehouse', 'store', 'admin', 'superadmin']
  const roleLabels = { customer: '👤 Customer', seller: '🏪 Seller', warehouse: '📦 Warehouse', store: '🏬 Store', admin: '🔧 Admin', superadmin: '👑 Super Admin' }
  const roleCounts = {}
  users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1 })

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>User Management</h1><p>Kelola akun dan role pengguna</p></div>
        {isSuperAdmin && pwRequests.length > 0 && (
          <button className="btn btn-accent" onClick={() => setShowRequests(!showRequests)}>
            🔑 Password Requests <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 11, marginLeft: 6 }}>{pwRequests.length}</span>
          </button>
        )}
      </div>

      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.includes('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: msg.includes('✅') ? 'var(--success)' : 'var(--danger)', marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{msg}</span><button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div>}

      {/* Password Requests Section */}
      {showRequests && isSuperAdmin && (
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>🔑 Permintaan Reset Password</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowRequests(false)}>✕</button>
          </div>
          {pwRequests.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada request pending</div>
          ) : (
            <div style={{ padding: 16 }}>
              {pwRequests.map(req => (
                <div key={req.id} style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 10, marginBottom: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <strong>{req.user?.name}</strong> <span className={`badge ${req.user?.role}`} style={{ fontSize: 10 }}>{req.user?.role}</span>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{req.user?.email} — {req.reason === 'forgot' ? 'Lupa Password' : 'Ganti Password'}</div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(req.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  {approveId === req.id ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="password" placeholder="Set password baru (min 6)" value={approvePw} onChange={e => setApprovePw(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }} />
                      <button className="btn btn-accent btn-sm" onClick={() => handleApproveRequest(req.id)}>✅ Set</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setApproveId(null); setApprovePw('') }}>Batal</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-accent btn-sm" onClick={() => { setApproveId(req.id); setApprovePw('') }}>✅ Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRejectRequest(req.id)}>❌ Tolak</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <form onSubmit={doSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input className="search-input" placeholder="Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-accent" type="submit">🔍 Cari</button>
        </form>
        <select className="filter-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
          <option value="">Semua Role</option>
          {roles.map(r => <option key={r} value={r}>{roleLabels[r] || r}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{meta?.total || users.length} user</span>
      </div>

      {/* Role Stats */}
      {!roleFilter && users.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(roleCounts).map(([r, c]) => (
            <div key={r} onClick={() => setRoleFilter(r)} style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 20, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
              <span className={`badge ${r}`} style={{ fontSize: 10 }}>{r}</span>
              <strong>{c}</strong>
            </div>
          ))}
        </div>
      )}
      {roleFilter && (
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setRoleFilter('')}>✕ Hapus filter "{roleFilter}"</button>
        </div>
      )}

      {/* Users Table */}
      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div className="table-card">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th>{isSuperAdmin && <th>Aksi</th>}</tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ cursor: 'pointer', background: detail?.id === u.id ? 'rgba(124,92,252,0.06)' : undefined }} onClick={() => { setDetail(u); setShowResetPw(false) }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{u.name?.[0]?.toUpperCase() || '?'}</div>
                      <strong style={{ fontSize: 13 }}>{u.name}</strong>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ fontSize: 12 }}>{u.phone || '-'}</td>
                  <td>
                    {isSuperAdmin && u.id !== currentUser.id ? (
                      <select className="filter-select" value={u.role} onClick={e => e.stopPropagation()} onChange={e => changeRole(u.id, e.target.value)} style={{ fontSize: 11, padding: '4px 8px', width: 'auto' }}>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className={`badge ${u.role}`}>{u.role}</span>
                    )}
                  </td>
                  {isSuperAdmin && (
                    <td>
                      {u.id !== currentUser.id ? (
                        <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(u) }}>🗑</button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Anda</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Tidak ada user ditemukan.</div>}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>Halaman {page} dari {meta.totalPages}</span>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {detail && (
          <div className="table-card" style={{ alignSelf: 'flex-start' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>{detail.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>{detail.name}</h3>
                    <span className={`badge ${detail.role}`}>{roleLabels[detail.role] || detail.role}</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>✕</button>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 14 }}>{detail.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Telepon</div>
                  <div style={{ fontSize: 14 }}>{detail.phone || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Bergabung</div>
                  <div style={{ fontSize: 14 }}>{detail.created_at ? new Date(detail.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>User ID</div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--accent-light)' }}>#{detail.id}</div>
                </div>
              </div>
              {isSuperAdmin && detail.id !== currentUser.id && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <select className="filter-select" value={detail.role} onChange={e => { changeRole(detail.id, e.target.value); setDetail({ ...detail, role: e.target.value }) }} style={{ flex: 1 }}>
                      {roles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                    </select>
                    <button className="btn btn-danger" onClick={() => handleDelete(detail)}>🗑 Hapus</button>
                  </div>

                  {staffRoles.includes(detail.role) && (
                    <div>
                      {!showResetPw ? (
                        <button className="btn btn-accent" style={{ width: '100%' }} onClick={() => setShowResetPw(true)}>🔐 Reset Password</button>
                      ) : (
                        <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🔐 Reset Password — {detail.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Password baru akan langsung aktif</div>
                          <div style={{ display: 'grid', gap: 8 }}>
                            <input type="password" placeholder="Password baru (min 6 karakter)" value={newPw} onChange={e => setNewPw(e.target.value)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }} />
                            <input type="password" placeholder="Konfirmasi password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-accent" style={{ flex: 1 }} onClick={handleResetPassword}>✅ Set Password</button>
                              <button className="btn btn-ghost" onClick={() => { setShowResetPw(false); setNewPw(''); setConfirmPw('') }}>Batal</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {detail.role === 'customer' && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--warning)' }}>
                      ⚠️ Customer mengubah password sendiri melalui aplikasi
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== WAREHOUSE ====================
function WarehousePage() {
  const [data, setData] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ product_id: '', quantity: '', cost_price: '' })

  const loadData = () => api.getStockOverview().then(r => setData(r.data)).catch(() => { })
  useEffect(() => { loadData() }, [])

  const handleInbound = async (productId, qty, costPrice) => {
    setSaving(true)
    try {
      await api.stockInbound({
        product_id: parseInt(productId),
        quantity: parseInt(qty),
        cost_price: parseInt(costPrice) || 0,
      })
      setForm({ product_id: '', quantity: '', cost_price: '' })
      setShowForm(false)
      loadData()
    } catch (err) {
      alert('Gagal menambah stock: ' + (err.message || 'Unknown error'))
    }
    setSaving(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.product_id || !form.quantity) { alert('Pilih produk dan isi jumlah!'); return }
    handleInbound(form.product_id, form.quantity, form.cost_price)
  }

  const quickAdd = (productId, qty) => {
    if (!confirm(`Tambah ${qty} stock?`)) return
    handleInbound(productId, qty, 0)
  }

  if (!data) return <div className="loading">Loading stock overview...</div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Stock Overview</h1><p>Warehouse inventory with FIFO aging</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginTop: 4 }}>
          {showForm ? '✕ Tutup' : '+ Tambah Stock'}
        </button>
      </div>

      {showForm && (
        <div className="table-card" style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Tambah Stock (Inbound)</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Produk *</label>
              <select style={inputStyle} value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                <option value="">-- Pilih Produk --</option>
                {(data.products || []).map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Jumlah *</label>
              <input style={inputStyle} type="number" min="1" placeholder="contoh: 50" value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Harga Modal (Rp)</label>
              <input style={inputStyle} type="number" placeholder="opsional" value={form.cost_price}
                onChange={e => setForm({ ...form, cost_price: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary" disabled={saving} style={{ height: 38 }}>
              {saving ? '...' : '📦 Tambah'}
            </button>
          </form>
        </div>
      )}

      <div className="table-card" style={{ marginBottom: 24 }}>
        <div className="table-header"><h3>Product Stock</h3></div>
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Lead Time</th><th>Reorder Point</th><th>Status</th><th>Quick Add</th></tr></thead>
          <tbody>
            {(data.products || []).map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                <td><strong>{p.stock}</strong></td>
                <td>{p.lead_time_days} days</td>
                <td>{p.reorder_point}</td>
                <td><span className={`badge ${p.stock <= p.reorder_point ? 'low' : 'ok'}`}>{p.stock <= p.reorder_point ? 'LOW' : 'OK'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => quickAdd(p.id, 10)}>+10</button>
                    <button className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => quickAdd(p.id, 50)}>+50</button>
                    <button className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => quickAdd(p.id, 100)}>+100</button>
                  </div>
                </td>
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
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', address: '', city: '', hours: '', phone: '', latitude: '', longitude: '' })
  const [stockView, setStockView] = useState(null)
  const [stocks, setStocks] = useState([])
  const [products, setProducts] = useState([])
  const [transferForm, setTransferForm] = useState({ product_id: '', quantity: 1 })
  const [sellForm, setSellForm] = useState({ product_id: '', quantity: 1 })
  const [addForm, setAddForm] = useState({ product_id: '', quantity: 1 })
  const [showTransfer, setShowTransfer] = useState(false)
  const [showSell, setShowSell] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => api.getStores().then(r => setStores(r.data || [])).catch(() => { })
  useEffect(() => { load(); api.getProducts().then(r => setProducts(r.data?.products || r.data || [])).catch(() => { }) }, [])

  const resetForm = () => { setForm({ name: '', address: '', city: '', hours: '', phone: '', latitude: '', longitude: '' }); setEditing(null); setShowForm(false) }

  const handleSubmit = async () => {
    const data = { ...form, latitude: parseFloat(form.latitude) || 0, longitude: parseFloat(form.longitude) || 0 }
    if (editing) { await api.updateStore(editing.id, data) }
    else { await api.createStore(data) }
    resetForm(); load()
  }

  const startEdit = (s) => {
    setForm({ name: s.name, address: s.address, city: s.city, hours: s.hours, phone: s.phone, latitude: s.latitude || '', longitude: s.longitude || '' })
    setEditing(s); setShowForm(true)
  }

  const toggleActive = async (s) => { await api.updateStore(s.id, { is_active: !s.is_active }); load() }
  const handleDelete = async (s) => { if (!confirm(`Hapus toko "${s.name}"?`)) return; await api.deleteStore(s.id); load() }

  const viewStock = async (s) => {
    if (stockView?.id === s.id) { setStockView(null); return }
    setStockView(s); setMsg(''); setShowTransfer(false); setShowSell(false); setShowAdd(false)
    const r = await api.getStoreStock(s.id)
    setStocks(r.data || [])
  }

  const doTransfer = async () => {
    try {
      await api.transferStock({ store_id: stockView.id, product_id: +transferForm.product_id, quantity: +transferForm.quantity })
      setMsg('✅ Transfer berhasil! Menunggu toko menerima.')
      setShowTransfer(false); setTransferForm({ product_id: '', quantity: 1 })
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || e.message)) }
  }

  const doSell = async () => {
    try {
      const r = await api.sellOffline({ store_id: stockView.id, product_id: +sellForm.product_id, quantity: +sellForm.quantity })
      setMsg(`✅ ${r.data.message}. Sisa stok: ${r.data.remaining_stock}`)
      setShowSell(false); setSellForm({ product_id: '', quantity: 1 })
      const sr = await api.getStoreStock(stockView.id); setStocks(sr.data || [])
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || e.message)) }
  }

  const doAdd = async () => {
    try {
      const r = await api.addStoreStock({ store_id: stockView.id, product_id: +addForm.product_id, quantity: +addForm.quantity })
      setMsg(`✅ ${r.data.message}. Total stok: ${r.data.total_stock}`)
      setShowAdd(false); setAddForm({ product_id: '', quantity: 1 })
      const sr = await api.getStoreStock(stockView.id); setStocks(sr.data || [])
    } catch (e) { setMsg('❌ ' + (e.response?.data?.error || e.message)) }
  }

  const isOpen = (hours) => {
    if (!hours) return null
    const match = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
    if (!match) return null
    const now = new Date(), curr = now.getHours() * 60 + now.getMinutes()
    return curr >= parseInt(match[1]) * 60 + parseInt(match[2]) && curr <= parseInt(match[3]) * 60 + parseInt(match[4])
  }

  const mapsUrl = (s) => s.latitude && s.longitude ? `https://www.google.com/maps?q=${s.latitude},${s.longitude}` : `https://www.google.com/maps/search/${encodeURIComponent(s.name + ' ' + s.address)}`

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: '#141425', color: '#eaeaef', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
  const lbl = { display: 'block', fontSize: 11, color: '#9191a8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <div>
      <div className="page-header"><h1>Store Locations</h1><p>Kelola toko fisik dan stok per toko</p></div>
      <div className="toolbar">
        <button className="btn btn-accent" onClick={() => { resetForm(); setShowForm(!showForm) }}>{showForm ? '✕ Tutup' : '+ Tambah Toko'}</button>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>{stores.length} toko</span>
      </div>

      {showForm && (
        <div className="table-card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>{editing ? '✏️ Edit Toko' : '🏪 Tambah Toko Baru'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={lbl}>Nama Toko *</label><input style={inp} placeholder="SnapShop Grand Indonesia" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={lbl}>Kota</label><input style={inp} placeholder="Jakarta Pusat" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div style={{ gridColumn: '1/3' }}><label style={lbl}>Alamat</label><input style={inp} placeholder="Jl. M.H. Thamrin No.1" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><label style={lbl}>Telepon</label><input style={inp} placeholder="+62 21 2358 0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label style={lbl}>Jam Operasional</label><input style={inp} placeholder="10:00 - 22:00" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} /></div>
            <div><label style={lbl}>Latitude</label><input style={inp} type="number" step="any" placeholder="-6.1753" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} /></div>
            <div><label style={lbl}>Longitude</label><input style={inp} type="number" step="any" placeholder="106.8272" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-accent" onClick={handleSubmit} disabled={!form.name}>{editing ? 'Simpan' : 'Tambah'}</button>
            <button className="btn btn-outline" onClick={resetForm}>Batal</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {stores.map(s => {
          const open = isOpen(s.hours)
          const isViewing = stockView?.id === s.id
          return (
            <div key={s.id}>
              <div className="table-card" style={{ padding: 24, opacity: s.is_active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-light)' }}>🏪 {s.city}</span>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{s.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {open !== null && <span className={`badge ${open ? 'delivered' : 'canceled'}`} style={{ fontSize: 10 }}>{open ? '🟢 BUKA' : '🔴 TUTUP'}</span>}
                    {!s.is_active && <span className="badge canceled" style={{ fontSize: 10 }}>NONAKTIF</span>}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{s.address}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>📞 {s.phone || '-'} &nbsp;•&nbsp; 🕐 {s.hours || '-'}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className={`btn ${isViewing ? 'btn-accent' : 'btn-ghost'} btn-sm`} onClick={() => viewStock(s)}>📦 {isViewing ? 'Tutup Stok' : 'Lihat Stok'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>✏️ Edit</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(s)}>{s.is_active ? '⏸' : '▶'}</button>
                  <a href={mapsUrl(s)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>📍</a>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)}>🗑</button>
                </div>
              </div>

              {isViewing && (
                <div className="table-card" style={{ marginTop: -1, borderTop: '2px solid var(--accent)', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ fontSize: 14, flex: 1 }}>📦 Stok di {s.name}</h4>
                    <button className="btn btn-accent btn-sm" onClick={() => { setShowAdd(!showAdd); setShowTransfer(false); setShowSell(false) }}>➕ Tambah Stok</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowTransfer(!showTransfer); setShowSell(false); setShowAdd(false) }}>📤 Transfer</button>
                    <button className="btn btn-success btn-sm" onClick={() => { setShowSell(!showSell); setShowTransfer(false); setShowAdd(false) }}>🛒 Jual Offline</button>
                  </div>
                  {msg && <div style={{ padding: '10px 20px', fontSize: 13, color: msg.startsWith('✅') ? 'var(--success)' : 'var(--danger)', background: msg.startsWith('✅') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>{msg}</div>}

                  {showAdd && (
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(124,92,252,0.05)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-light)', marginBottom: 10 }}>➕ TAMBAH STOK LANGSUNG KE TOKO</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <div style={{ flex: 2 }}>
                          <label style={lbl}>Produk</label>
                          <select style={inp} value={addForm.product_id} onChange={e => setAddForm({ ...addForm, product_id: e.target.value })}>
                            <option value="">Pilih produk...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div style={{ width: 80 }}><label style={lbl}>Qty</label><input style={inp} type="number" min="1" value={addForm.quantity} onChange={e => setAddForm({ ...addForm, quantity: e.target.value })} /></div>
                        <button className="btn btn-accent" onClick={doAdd} disabled={!addForm.product_id}>Tambah</button>
                      </div>
                    </div>
                  )}

                  {showTransfer && (
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(124,92,252,0.05)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-light)', marginBottom: 10 }}>📤 TRANSFER DARI GUDANG</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <div style={{ flex: 2 }}>
                          <label style={lbl}>Produk</label>
                          <select style={inp} value={transferForm.product_id} onChange={e => setTransferForm({ ...transferForm, product_id: e.target.value })}>
                            <option value="">Pilih produk...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (gudang: {p.stock})</option>)}
                          </select>
                        </div>
                        <div style={{ width: 80 }}><label style={lbl}>Qty</label><input style={inp} type="number" min="1" value={transferForm.quantity} onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })} /></div>
                        <button className="btn btn-accent" onClick={doTransfer} disabled={!transferForm.product_id}>Kirim</button>
                      </div>
                    </div>
                  )}

                  {showSell && (
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(34,197,94,0.05)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', marginBottom: 10 }}>🛒 JUAL OFFLINE (WALK-IN)</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <div style={{ flex: 2 }}>
                          <label style={lbl}>Produk di Toko</label>
                          <select style={inp} value={sellForm.product_id} onChange={e => setSellForm({ ...sellForm, product_id: e.target.value })}>
                            <option value="">Pilih produk...</option>
                            {stocks.filter(st => st.quantity > 0).map(st => <option key={st.product_id} value={st.product_id}>{st.product?.name || `#${st.product_id}`} (stok: {st.quantity})</option>)}
                          </select>
                        </div>
                        <div style={{ width: 80 }}><label style={lbl}>Qty</label><input style={inp} type="number" min="1" value={sellForm.quantity} onChange={e => setSellForm({ ...sellForm, quantity: e.target.value })} /></div>
                        <button className="btn btn-success" onClick={doSell} disabled={!sellForm.product_id}>Jual</button>
                      </div>
                    </div>
                  )}

                  {stocks.length > 0 ? (
                    <table>
                      <thead><tr><th>Produk</th><th>Stok Toko</th><th>Status</th></tr></thead>
                      <tbody>{stocks.map(st => (
                        <tr key={st.id}>
                          <td><strong>{st.product?.name || `Product #${st.product_id}`}</strong></td>
                          <td><strong style={{ color: st.quantity > 5 ? 'var(--success)' : st.quantity > 0 ? 'var(--warning)' : 'var(--danger)' }}>{st.quantity}</strong></td>
                          <td><span className={`badge ${st.quantity > 5 ? 'ok' : st.quantity > 0 ? 'pending' : 'low'}`}>{st.quantity > 5 ? 'OK' : st.quantity > 0 ? 'Rendah' : 'Habis'}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada stok. Transfer produk dari gudang dulu.</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {stores.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Belum ada toko.</div>}
    </div>
  )
}

// ==================== AUDIT LOGS ====================
function AuditPage() {
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState(null)

  const load = () => {
    let q = `?limit=50&page=${page}`
    if (actionFilter) q += `&action=${actionFilter}`
    api.getAuditLogs(q).then(r => { setLogs(r.data || []); setMeta(r.meta || null) }).catch(() => { })
  }
  const loadStats = () => { api.getAuditStats().then(r => setStats(r.data)).catch(() => { }) }
  useEffect(() => { load(); loadStats() }, [page, actionFilter])

  const actionLabels = {
    change_role: { label: 'Ubah Role', color: 'var(--accent)', icon: '🔄' },
    delete_user: { label: 'Hapus User', color: 'var(--danger)', icon: '🗑' },
    reset_password: { label: 'Reset Password', color: 'var(--warning)', icon: '🔐' },
    approve_password_request: { label: 'Approve Reset', color: 'var(--success)', icon: '✅' },
  }

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000)
    if (s < 60) return 'Baru saja'
    if (s < 3600) return `${Math.floor(s / 60)} menit lalu`
    if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`
    return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const filteredLogs = search ? logs.filter(l => l.details?.toLowerCase().includes(search.toLowerCase()) || l.entity?.toLowerCase().includes(search.toLowerCase())) : logs

  return (
    <div>
      <div className="page-header"><h1>🛡️ Keamanan & Audit</h1><p>Statistik keamanan dan riwayat aktivitas sistem</p></div>

      {/* Security Stats Cards */}
      {stats && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 20 }}>
            <div className="stat-card" style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderTop: '3px solid var(--accent)' }}>
              <div className="stat-label">📋 Total Log</div>
              <div className="stat-value">{stats.total_logs || 0}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderTop: '3px solid var(--success)' }}>
              <div className="stat-label">📅 Hari Ini</div>
              <div className="stat-value">{stats.today_logs || 0}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderTop: '3px solid var(--info)' }}>
              <div className="stat-label">📆 7 Hari Terakhir</div>
              <div className="stat-value">{stats.week_logs || 0}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderTop: '3px solid var(--text-secondary)' }}>
              <div className="stat-label">👥 Total User</div>
              <div className="stat-value">{stats.total_users || 0}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderTop: '3px solid var(--warning)' }}>
              <div className="stat-label">🔧 Admin Aktif</div>
              <div className="stat-value">{stats.total_admins || 0}</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderTop: stats.pending_pw_requests > 0 ? '3px solid var(--danger)' : '3px solid var(--border)' }}>
              <div className="stat-label">🔑 PW Request</div>
              <div className="stat-value" style={{ color: stats.pending_pw_requests > 0 ? 'var(--danger)' : 'inherit' }}>{stats.pending_pw_requests || 0}</div>
            </div>
          </div>

          {/* Action Breakdown */}
          {stats.action_counts && stats.action_counts.length > 0 && (
            <div className="table-card" style={{ marginBottom: 20, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📊 Distribusi Aksi Keamanan</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {stats.action_counts.map(ac => {
                  const a = actionLabels[ac.action] || { label: ac.action, color: 'var(--text-muted)', icon: '📝' }
                  const pct = stats.total_logs ? Math.round((ac.count / stats.total_logs) * 100) : 0
                  return (
                    <div key={ac.action} onClick={() => setActionFilter(ac.action)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13 }}>{a.icon} {a.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{ac.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: a.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <input className="search-input" placeholder="Cari di detail log..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1) }}>
          <option value="">Semua Aksi</option>
          {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{meta?.total || filteredLogs.length} log</span>
      </div>

      {/* Stats */}
      {logs.length > 0 && !actionFilter && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(actionLabels).map(([k, v]) => {
            const count = logs.filter(l => l.action === k).length
            if (!count) return null
            return (
              <div key={k} onClick={() => setActionFilter(k)} style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 20, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{v.icon}</span> <span style={{ color: v.color, fontWeight: 600 }}>{v.label}</span> <strong>{count}</strong>
              </div>
            )
          })}
        </div>
      )}
      {actionFilter && (
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setActionFilter('')}>✕ Hapus filter "{actionLabels[actionFilter]?.label || actionFilter}"</button>
        </div>
      )}

      {/* Table */}
      <div className="table-card">
        <table>
          <thead><tr><th>Aksi</th><th>Admin</th><th>Target</th><th>Detail</th><th>IP</th><th>Waktu</th></tr></thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Belum ada audit log</td></tr>
            ) : filteredLogs.map(l => {
              const a = actionLabels[l.action] || { label: l.action, color: 'var(--text-muted)', icon: '📝' }
              return (
                <tr key={l.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{a.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.label}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>User #{l.user_id}</td>
                  <td style={{ fontSize: 12 }}>{l.entity} #{l.entity_id}</td>
                  <td style={{ fontSize: 12, maxWidth: 300 }}>{l.details}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{l.ip}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{timeAgo(l.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span>Halaman {page} dari {meta.totalPages}</span>
            <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
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
  const [error, setError] = useState('')
  useEffect(() => {
    setError('')
    api.getSalesReport(period).then(r => setData(r.data)).catch(e => {
      setError('Gagal memuat laporan: ' + (e.message || 'Unknown error'))
      setData({ total_revenue: 0, total_orders: 0, avg_order_value: 0, daily_sales: [] })
    })
    api.getTopProducts(10).then(r => setTop(r.data || [])).catch(() => { })
    api.getRevenueByCategory().then(r => setCat(r.data || [])).catch(() => { })
  }, [period])
  if (!data) return <div className="loading" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Loading reports...</div>
  return (
    <div>
      <div className="page-header"><h1>Sales Report</h1><p>Revenue analytics and product performance</p></div>
      {error && <div style={{ color: '#e74c3c', padding: '12px 16px', background: 'rgba(231,76,60,0.1)', borderRadius: 8, marginBottom: 16 }}>⚠️ {error}</div>}
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
            <tbody>{topProducts.map(p => {
              const img = p.image_url?.startsWith('/') ? `http://localhost:8080${p.image_url}` : p.image_url
              return (
                <tr key={p.product_id}>
                  <td><img className="product-img" src={img || ''} alt="" /></td>
                  <td><strong>{p.product_name}</strong><br /><span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</span></td>
                  <td><strong>{p.total_sold}</strong></td><td>{formatRp(p.total_revenue)}</td><td>⭐ {p.avg_rating || 0}</td>
                </tr>
              )
            })}</tbody></table>
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
  const [search, setSearch] = useState('')
  const load = () => api.getReturns(filter ? `?status=${filter}` : '').then(r => setReturns(r.data || [])).catch(() => { })
  useEffect(() => { load() }, [filter])
  const update = async (id, status) => { await api.updateReturn(id, { status }); load() }
  const retStatuses = ['requested', 'approved', 'rejected', 'refunded']
  const statusLabels = { requested: 'Diminta', approved: 'Disetujui', rejected: 'Ditolak', refunded: 'Dikembalikan' }

  const filtered = search
    ? returns.filter(r =>
      String(r.order_id).includes(search) ||
      (r.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.order?.order_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.reason || '').toLowerCase().includes(search.toLowerCase())
    )
    : returns

  return (
    <div>
      <div className="page-header"><h1>Returns & Refunds</h1><p>Manage product returns and refunds</p></div>
      <div className="toolbar" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="search-input" placeholder="Cari order ID, customer, atau alasan..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          {retStatuses.map(s => <option key={s} value={s}>{statusLabels[s] || s}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} returns</span>
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Alasan</th><th>Refund</th><th>Status</th><th>Tanggal</th><th>Actions</th></tr></thead>
          <tbody>{filtered.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Tidak ada retur{search ? ' yang cocok' : ''}</td></tr>
          ) : filtered.map(r => (
            <tr key={r.id}>
              <td style={{ fontFamily: 'monospace' }}>#{r.order?.order_number || r.order_id}</td>
              <td>{r.user?.name || '-'}</td>
              <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason}>{r.reason}</td>
              <td>{formatRp(r.refund_amount)}</td>
              <td><span className={`badge ${r.status === 'refunded' ? 'delivered' : r.status === 'rejected' ? 'canceled' : r.status === 'approved' ? 'confirmed' : 'pending'}`}>{statusLabels[r.status] || r.status}</span></td>
              <td style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
              <td><select className="filter-select" value={r.status} onChange={e => update(r.id, e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
                {retStatuses.map(s => <option key={s} value={s}>{statusLabels[s] || s}</option>)}
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
