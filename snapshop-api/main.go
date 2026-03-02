package main

import (
	"log"
	"snapshop-api/config"
	"snapshop-api/database"
	"snapshop-api/handlers"
	"snapshop-api/middleware"
	"snapshop-api/models"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	// Init database
	database.Init(cfg)
	database.Seed()

	// Init Gin
	r := gin.Default()

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "SnapShop API", "version": "1.0.0"})
	})

	// Serve uploaded files
	r.Static("/uploads", "./uploads")

	// Handlers
	authH := &handlers.AuthHandler{Config: cfg}
	productH := &handlers.ProductHandler{}
	userH := &handlers.UserHandler{}
	addressH := &handlers.AddressHandler{}
	cartH := &handlers.CartHandler{}
	wishlistH := &handlers.WishlistHandler{}
	orderH := &handlers.OrderHandler{}
	voucherH := &handlers.VoucherHandler{}
	reviewH := &handlers.ReviewHandler{}
	adminH := &handlers.AdminHandler{}
	warehouseH := &handlers.WarehouseHandler{}
	storeH := &handlers.StoreHandler{}
	superadminH := &handlers.SuperAdminHandler{}
	reportH := &handlers.ReportHandler{}
	procH := &handlers.ProcurementHandler{}
	returnH := &handlers.ReturnHandler{}
	financeH := &handlers.FinanceHandler{}
	crmH := &handlers.CRMHandler{}
	uploadH := &handlers.UploadHandler{}

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

		// ====== AUTHENTICATED (All roles) ======
		authenticated := api.Group("/")
		authenticated.Use(middleware.AuthRequired(cfg))
		{
			// User
			authenticated.GET("user/profile", userH.GetProfile)
			authenticated.PUT("user/profile", userH.UpdateProfile)
			authenticated.PUT("user/password", userH.ChangePassword)

			// Addresses
			authenticated.GET("addresses", addressH.List)
			authenticated.POST("addresses", addressH.Create)
			authenticated.PUT("addresses/:id", addressH.Update)
			authenticated.DELETE("addresses/:id", addressH.Delete)
			authenticated.PUT("addresses/:id/default", addressH.SetDefault)

			// Cart
			authenticated.GET("cart", cartH.List)
			authenticated.POST("cart", cartH.Add)
			authenticated.PUT("cart/:id", cartH.Update)
			authenticated.DELETE("cart/:id", cartH.Delete)

			// Wishlist
			authenticated.GET("wishlist", wishlistH.List)
			authenticated.POST("wishlist", wishlistH.Add)
			authenticated.DELETE("wishlist/:id", wishlistH.Delete)
			authenticated.POST("wishlist/move-to-cart", wishlistH.MoveToCart)

			// Orders
			authenticated.POST("orders", orderH.Checkout)
			authenticated.GET("orders", orderH.List)
			authenticated.GET("orders/:id", orderH.GetByID)

			// Vouchers
			authenticated.GET("vouchers", voucherH.List)
			authenticated.POST("vouchers/validate", voucherH.Validate)

			// Reviews
			authenticated.POST("reviews", reviewH.Create)
			authenticated.PUT("reviews/:id/helpful", reviewH.MarkHelpful)

			// Returns (customer can create)
			authenticated.POST("returns", returnH.CreateReturn)

			// Dashboard (all roles)
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
			admin.POST("/upload", uploadH.UploadImage)
			admin.POST("/products", adminH.CreateProduct)
			admin.PUT("/products/:id", adminH.UpdateProduct)
			admin.DELETE("/products/:id", adminH.DeleteProduct)
			admin.PUT("/orders/:id/status", adminH.UpdateOrderStatus)
			admin.POST("/vouchers", adminH.CreateVoucher)
			admin.GET("/users", adminH.ListUsers)

			// Reports
			admin.GET("/reports/sales", reportH.SalesReport)
			admin.GET("/reports/top-products", reportH.TopProducts)
			admin.GET("/reports/revenue-by-category", reportH.RevenueByCategory)

			// Procurement
			admin.GET("/procurement", procH.ListPurchaseOrders)
			admin.POST("/procurement", procH.CreatePurchaseOrder)
			admin.PUT("/procurement/:id/status", procH.UpdatePOStatus)
			admin.GET("/suppliers", procH.ListSuppliers)

			// Returns management
			admin.GET("/returns", returnH.ListReturns)
			admin.PUT("/returns/:id", returnH.UpdateReturn)

			// Finance
			admin.GET("/finance/pnl", financeH.ProfitLoss)

			// CRM
			admin.GET("/crm/customers", crmH.CustomerList)
			admin.GET("/crm/customers/:id", crmH.CustomerDetail)
		}

		// ====== SUPER ADMIN (Level 6) ======
		superadmin := api.Group("/superadmin")
		superadmin.Use(middleware.AuthRequired(cfg))
		superadmin.Use(middleware.RoleRequired(models.RoleSuperAdmin))
		{
			superadmin.PUT("/users/:id/role", superadminH.UpdateUserRole)
			superadmin.GET("/audit-logs", superadminH.AuditLogs)
		}
	}

	log.Printf("🚀 SnapShop API running on port %s", cfg.Port)
	log.Println("📝 Test accounts (password: password123):")
	log.Println("   Customer:   john@snapshop.id")
	log.Println("   Seller:     seller@snapshop.id")
	log.Println("   Warehouse:  warehouse@snapshop.id")
	log.Println("   Store:      store@snapshop.id")
	log.Println("   Admin:      admin@snapshop.id")
	log.Println("   SuperAdmin: superadmin@snapshop.id")

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
