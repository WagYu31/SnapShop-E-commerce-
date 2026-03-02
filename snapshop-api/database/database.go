package database

import (
	"log"
	"snapshop-api/config"
	"snapshop-api/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init(cfg *config.Config) {
	var err error
	DB, err = gorm.Open(sqlite.Open(cfg.DBPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
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
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("✅ Database migrated successfully")
}
