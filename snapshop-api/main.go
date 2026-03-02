package main

import (
	"log"
	"snapshop-api/config"
	"snapshop-api/database"
	"snapshop-api/gateway"

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
		c.JSON(200, gin.H{
			"status":       "ok",
			"service":      "SnapShop API",
			"version":      "2.0.0",
			"architecture": "modular-monolith",
		})
	})

	// Serve uploaded files
	r.Static("/uploads", "./uploads")

	// Register all service routes via gateway
	gateway.RegisterRoutes(r, cfg)

	log.Printf("🚀 SnapShop API v2.0 (Modular Monolith) running on port %s", cfg.Port)
	log.Println("📦 Services: auth, product, order, user, cart, warehouse, commerce, admin, finance, upload")
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
