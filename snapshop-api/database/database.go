package database

import (
	"log"
	"snapshop-api/config"
	"snapshop-api/models"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init(cfg *config.Config) {
	var err error
	gormCfg := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	if strings.HasPrefix(cfg.DatabaseURL, "postgres://") || strings.HasPrefix(cfg.DatabaseURL, "postgresql://") {
		// PostgreSQL
		DB, err = gorm.Open(postgres.Open(cfg.DatabaseURL), gormCfg)
		log.Println("📦 Using PostgreSQL database")
	} else {
		// SQLite (default for local dev)
		path := strings.TrimPrefix(cfg.DatabaseURL, "sqlite://")
		DB, err = gorm.Open(sqlite.Open(path), gormCfg)
		log.Println("📦 Using SQLite database:", path)
	}

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate all models
	err = DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Product{},
		&models.ProductVariant{},
		&models.StockBatch{},
		&models.Supplier{},
		&models.Store{},
		&models.StoreStock{},
		&models.StockTransfer{},
		&models.Address{},
		&models.Order{},
		&models.OrderItem{},
		&models.Voucher{},
		&models.Review{},
		&models.CartItem{},
		&models.WishlistItem{},
		&models.AuditLog{},
		&models.Return{},
		&models.PurchaseOrder{},
		&models.PurchaseOrderItem{},
		&models.PasswordResetRequest{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("✅ Database migrated successfully")
}
