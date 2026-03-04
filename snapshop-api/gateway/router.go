package gateway

import (
	"snapshop-api/config"
	"snapshop-api/middleware"
	"snapshop-api/models"

	// Service imports
	adminSvc "snapshop-api/services/admin"
	authSvc "snapshop-api/services/auth"
	cartSvc "snapshop-api/services/cart"
	commerceSvc "snapshop-api/services/commerce"
	financeSvc "snapshop-api/services/finance"
	orderSvc "snapshop-api/services/order"
	paymentSvc "snapshop-api/services/payment"
	productSvc "snapshop-api/services/product"
	shippingSvc "snapshop-api/services/shipping"
	uploadSvc "snapshop-api/services/upload"
	userSvc "snapshop-api/services/user"
	warehouseSvc "snapshop-api/services/warehouse"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes wires all service handlers to the Gin router.
// All endpoints remain identical — only internal code organization changed.
func RegisterRoutes(r *gin.Engine, cfg *config.Config) {

	// Initialize service handlers
	authH := &authSvc.Handler{Config: cfg}
	productH := &productSvc.Handler{}
	orderH := &orderSvc.Handler{}
	userH := &userSvc.Handler{}
	addressH := &userSvc.AddressHandler{}
	cartH := &cartSvc.Handler{}
	wishlistH := &cartSvc.WishlistHandler{}
	voucherH := &commerceSvc.VoucherHandler{}
	reviewH := &commerceSvc.ReviewHandler{}
	adminH := &adminSvc.Handler{}
	superadminH := &adminSvc.SuperAdminHandler{}
	warehouseH := &warehouseSvc.Handler{}
	storeH := &warehouseSvc.StoreHandler{}
	reportH := &financeSvc.ReportHandler{}
	procH := &financeSvc.ProcurementHandler{}
	returnH := &financeSvc.ReturnHandler{}
	financeH := &financeSvc.FinanceHandler{}
	crmH := &financeSvc.CRMHandler{}
	uploadH := &uploadSvc.Handler{}
	paymentH := &paymentSvc.Handler{Config: cfg}
	shippingH := &shippingSvc.Handler{Config: cfg}

	api := r.Group("/api/v1")
	{
		// ====== PUBLIC ======
		auth := api.Group("/auth")
		{
			auth.POST("/register", authH.Register)
			auth.POST("/login", authH.Login)
		}

		api.GET("/products", productH.List)
		api.GET("/products/:id", productH.GetByID)
		api.GET("/products/:id/reviews", productH.GetReviews)
		api.GET("/categories", productH.ListCategories)
		api.GET("/stores", storeH.ListStores)

		// Midtrans webhook (no auth — called by Midtrans server)
		api.POST("/payment/webhook", paymentH.Webhook)

		// Midtrans client key (public — needed by frontend)
		api.GET("/payment/client-key", paymentH.GetClientKey)

		// ====== AUTHENTICATED (All roles) ======
		authenticated := api.Group("/")
		authenticated.Use(middleware.AuthRequired(cfg))
		{
			// User Service
			authenticated.GET("user/profile", userH.GetProfile)
			authenticated.PUT("user/profile", userH.UpdateProfile)
			authenticated.PUT("user/password", userH.ChangePassword)

			// Address (User Service)
			authenticated.GET("addresses", addressH.List)
			authenticated.POST("addresses", addressH.Create)
			authenticated.PUT("addresses/:id", addressH.Update)
			authenticated.DELETE("addresses/:id", addressH.Delete)
			authenticated.PUT("addresses/:id/default", addressH.SetDefault)

			// Cart Service
			authenticated.GET("cart", cartH.List)
			authenticated.POST("cart", cartH.Add)
			authenticated.PUT("cart/:id", cartH.Update)
			authenticated.DELETE("cart/:id", cartH.Delete)

			// Wishlist (Cart Service)
			authenticated.GET("wishlist", wishlistH.List)
			authenticated.POST("wishlist", wishlistH.Add)
			authenticated.DELETE("wishlist/:id", wishlistH.Delete)
			authenticated.POST("wishlist/move-to-cart", wishlistH.MoveToCart)

			// Order Service
			authenticated.POST("orders", orderH.Checkout)
			authenticated.GET("orders", orderH.List)
			authenticated.GET("orders/:id", orderH.GetByID)

			// Payment Service
			authenticated.POST("payment/:order_id/token", paymentH.CreateSnapToken)
			authenticated.POST("payment/:order_id/verify", paymentH.VerifyPayment)
			authenticated.GET("payment/:order_id/status", paymentH.GetPaymentStatus)

			// Shipping Service (Binderbyte)
			authenticated.GET("shipping/couriers", shippingH.GetCouriers)
			authenticated.POST("shipping/cost", shippingH.GetShippingCost)

			// Commerce Service (Vouchers)
			authenticated.GET("vouchers", voucherH.List)
			authenticated.POST("vouchers/validate", voucherH.Validate)

			// Commerce Service (Reviews)
			authenticated.POST("reviews", reviewH.Create)
			authenticated.PUT("reviews/:id/helpful", reviewH.MarkHelpful)

			// Finance Service (Returns — customer can create)
			authenticated.POST("returns", returnH.CreateReturn)

			// Admin Service (Dashboard — all roles)
			authenticated.GET("dashboard", adminH.Dashboard)
		}

		// ====== WAREHOUSE (Level 3+) ======
		warehouse := api.Group("/warehouse")
		warehouse.Use(middleware.AuthRequired(cfg))
		warehouse.Use(middleware.RoleRequired(models.RoleWarehouse, models.RoleAdmin, models.RoleSuperAdmin))
		{
			warehouse.GET("/stock", warehouseH.StockOverview)
			warehouse.POST("/stock/inbound", warehouseH.Inbound)
			warehouse.GET("/stock/alerts", warehouseH.LowStockAlerts)
		}

		// ====== STORE (Level 4) ======
		store := api.Group("/store")
		store.Use(middleware.AuthRequired(cfg))
		store.Use(middleware.RoleRequired(models.RoleStore, models.RoleAdmin, models.RoleSuperAdmin))
		{
			store.POST("/transfer", storeH.TransferStock)
			store.PUT("/transfer/:id/receive", storeH.ReceiveTransfer)
		}

		// ====== ADMIN (Level 5) ======
		admin := api.Group("/admin")
		admin.Use(middleware.AuthRequired(cfg))
		admin.Use(middleware.RoleRequired(models.RoleAdmin, models.RoleSuperAdmin))
		{
			// Upload Service
			admin.POST("/upload", uploadH.UploadImage)

			// Product Service (Admin CRUD)
			admin.POST("/products", productH.Create)
			admin.PUT("/products/:id", productH.Update)
			admin.DELETE("/products/:id", productH.Delete)

			// Order Service (Admin)
			admin.GET("/orders", orderH.ListAll)
			admin.PUT("/orders/:id/status", orderH.UpdateStatus)

			// Commerce Service (Admin Vouchers)
			admin.POST("/vouchers", voucherH.Create)

			// Admin Service (Users)
			admin.GET("/users", adminH.ListUsers)

			// Finance Service (Reports)
			admin.GET("/reports/sales", reportH.SalesReport)
			admin.GET("/reports/top-products", reportH.TopProducts)
			admin.GET("/reports/revenue-by-category", reportH.RevenueByCategory)

			// Finance Service (Procurement)
			admin.GET("/procurement", procH.ListPurchaseOrders)
			admin.POST("/procurement", procH.CreatePurchaseOrder)
			admin.PUT("/procurement/:id/status", procH.UpdatePOStatus)
			admin.GET("/suppliers", procH.ListSuppliers)

			// Finance Service (Returns management)
			admin.GET("/returns", returnH.ListReturns)
			admin.PUT("/returns/:id", returnH.UpdateReturn)

			// Finance Service (P&L)
			admin.GET("/finance/pnl", financeH.ProfitLoss)

			// Finance Service (CRM)
			admin.GET("/crm/customers", crmH.CustomerList)
			admin.GET("/crm/customers/:id", crmH.CustomerDetail)

			// Store Management (Admin)
			admin.POST("/stores", storeH.CreateStore)
			admin.PUT("/stores/:id", storeH.UpdateStore)
			admin.DELETE("/stores/:id", storeH.DeleteStore)
			admin.GET("/stores/:id/stock", storeH.GetStoreStock)
			admin.GET("/stores/transfers", storeH.ListTransfers)
			admin.POST("/stores/sell-offline", storeH.SellOffline)
			admin.POST("/stores/add-stock", storeH.AddStoreStock)
		}

		// ====== SUPER ADMIN (Level 6) ======
		superadmin := api.Group("/superadmin")
		superadmin.Use(middleware.AuthRequired(cfg))
		superadmin.Use(middleware.RoleRequired(models.RoleSuperAdmin))
	{
			superadmin.PUT("/users/:id/role", superadminH.UpdateUserRole)
			superadmin.PUT("/users/:id/password", superadminH.ResetUserPassword)
			superadmin.DELETE("/users/:id", superadminH.DeleteUser)
			superadmin.GET("/password-requests", superadminH.ListPasswordRequests)
			superadmin.POST("/password-requests/:id/approve", superadminH.ApprovePasswordRequest)
			superadmin.POST("/password-requests/:id/reject", superadminH.RejectPasswordRequest)
			superadmin.GET("/audit-logs", superadminH.AuditLogs)
			superadmin.GET("/audit-stats", superadminH.AuditStats)
		}

		// Staff password request (any authenticated admin-level user)
		admin.POST("/request-password-reset", adminH.RequestPasswordReset)
	}
}
