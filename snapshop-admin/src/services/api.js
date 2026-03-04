const API_URL = 'http://localhost:8080/api/v1';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        return h;
    }

    async request(method, path, body) {
        const opts = { method, headers: this.headers() };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${API_URL}${path}`, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Request failed');
        return data;
    }

    // Auth
    login(email, password) { return this.request('POST', '/auth/login', { email, password }); }

    // Products
    getProducts(params = '') { return this.request('GET', `/products${params}`); }
    getProduct(id) { return this.request('GET', `/products/${id}`); }
    createProduct(data) { return this.request('POST', '/admin/products', data); }
    uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${API_URL}/admin/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}` },
            body: formData
        }).then(r => r.json());
    }
    updateProduct(id, data) { return this.request('PUT', `/admin/products/${id}`, data); }
    deleteProduct(id) { return this.request('DELETE', `/admin/products/${id}`); }

    // Categories
    getCategories() { return this.request('GET', '/categories'); }

    // Orders
    getOrders(params = '') { return this.request('GET', `/admin/orders${params}`); }
    updateOrderStatus(id, status) { return this.request('PUT', `/admin/orders/${id}/status`, { status }); }

    // Users
    getUsers(params = '') { return this.request('GET', `/admin/users${params}`); }
    updateUserRole(id, role) { return this.request('PUT', `/superadmin/users/${id}/role`, { role }); }
    deleteUser(id) { return this.request('DELETE', `/superadmin/users/${id}`); }
    resetUserPassword(id, new_password) { return this.request('PUT', `/superadmin/users/${id}/password`, { new_password }); }
    getPasswordRequests(status = 'pending') { return this.request('GET', `/superadmin/password-requests?status=${status}`); }
    approvePasswordRequest(id, new_password, admin_notes = '') { return this.request('POST', `/superadmin/password-requests/${id}/approve`, { new_password, admin_notes }); }
    rejectPasswordRequest(id, admin_notes = '') { return this.request('POST', `/superadmin/password-requests/${id}/reject`, { admin_notes }); }

    // Vouchers
    getVouchers() { return this.request('GET', '/vouchers'); }
    createVoucher(data) { return this.request('POST', '/admin/vouchers', data); }

    // Dashboard
    getDashboard() { return this.request('GET', '/dashboard'); }

    // Warehouse
    getStockOverview() { return this.request('GET', '/warehouse/stock'); }
    stockInbound(data) { return this.request('POST', '/warehouse/stock/inbound', data); }
    getLowStockAlerts() { return this.request('GET', '/warehouse/stock/alerts'); }

    // Stores
    getStores() { return this.request('GET', '/stores'); }
    createStore(data) { return this.request('POST', '/admin/stores', data); }
    updateStore(id, data) { return this.request('PUT', `/admin/stores/${id}`, data); }
    deleteStore(id) { return this.request('DELETE', `/admin/stores/${id}`); }
    getStoreStock(storeId) { return this.request('GET', `/admin/stores/${storeId}/stock`); }
    getTransfers(q = '') { return this.request('GET', `/admin/stores/transfers${q}`); }
    sellOffline(data) { return this.request('POST', '/admin/stores/sell-offline', data); }
    addStoreStock(data) { return this.request('POST', '/admin/stores/add-stock', data); }
    transferStock(data) { return this.request('POST', '/store/transfer', data); }

    // Audit
    getAuditLogs(params = '') { return this.request('GET', `/superadmin/audit-logs${params}`); }
    getAuditStats() { return this.request('GET', '/superadmin/audit-stats'); }

    // Reports
    getSalesReport(period = 30) { return this.request('GET', `/admin/reports/sales?period=${period}`); }
    getTopProducts(limit = 10) { return this.request('GET', `/admin/reports/top-products?limit=${limit}`); }
    getRevenueByCategory() { return this.request('GET', '/admin/reports/revenue-by-category'); }

    // Procurement
    getPurchaseOrders(params = '') { return this.request('GET', `/admin/procurement${params}`); }
    createPurchaseOrder(data) { return this.request('POST', '/admin/procurement', data); }
    updatePOStatus(id, status) { return this.request('PUT', `/admin/procurement/${id}/status`, { status }); }
    getSuppliers() { return this.request('GET', '/admin/suppliers'); }

    // Returns
    getReturns(params = '') { return this.request('GET', `/admin/returns${params}`); }
    updateReturn(id, data) { return this.request('PUT', `/admin/returns/${id}`, data); }

    // Finance
    getProfitLoss(period = 30) { return this.request('GET', `/admin/finance/pnl?period=${period}`); }

    // CRM
    getCustomers() { return this.request('GET', '/admin/crm/customers'); }
    getCustomerDetail(id) { return this.request('GET', `/admin/crm/customers/${id}`); }
}

export default new ApiService();
