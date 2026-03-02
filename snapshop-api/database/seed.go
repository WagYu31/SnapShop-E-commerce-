package database

import (
	"log"
	"snapshop-api/models"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func Seed() {
	var count int64
	DB.Model(&models.Category{}).Count(&count)
	if count > 0 {
		log.Println("📦 Database already seeded, skipping...")
		return
	}

	log.Println("🌱 Seeding database...")

	// ====== CATEGORIES ======
	categories := []models.Category{
		{ID: 1, Name: "All", Icon: "grid-outline"},
		{ID: 2, Name: "Woman", Icon: "woman-outline"},
		{ID: 3, Name: "Man", Icon: "man-outline"},
		{ID: 4, Name: "Kids", Icon: "happy-outline"},
		{ID: 5, Name: "Shoes", Icon: "footsteps-outline"},
		{ID: 6, Name: "Bags", Icon: "bag-outline"},
	}
	DB.Create(&categories)

	// ====== USERS ======
	pw, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	users := []models.User{
		{ID: 1, Name: "John Doe", Email: "john@snapshop.id", Phone: "081234567890", PasswordHash: string(pw), Role: models.RoleCustomer, AvatarURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"},
		{ID: 2, Name: "Sarah Admin", Email: "admin@snapshop.id", Phone: "081234567891", PasswordHash: string(pw), Role: models.RoleAdmin},
		{ID: 3, Name: "Super Admin", Email: "superadmin@snapshop.id", Phone: "081234567892", PasswordHash: string(pw), Role: models.RoleSuperAdmin},
		{ID: 4, Name: "Budi Warehouse", Email: "warehouse@snapshop.id", Phone: "081234567893", PasswordHash: string(pw), Role: models.RoleWarehouse},
		{ID: 5, Name: "Ani Store", Email: "store@snapshop.id", Phone: "081234567894", PasswordHash: string(pw), Role: models.RoleStore},
		{ID: 6, Name: "Toko Fashion ID", Email: "seller@snapshop.id", Phone: "081234567895", PasswordHash: string(pw), Role: models.RoleSeller},
	}
	DB.Create(&users)

	// ====== PRODUCTS (from frontend data.ts) ======
	sellerID := uintPtr(6) // Toko Fashion ID
	products := []models.Product{
		{ID: 1, Name: "Essential Bag", Description: "Premium leather crossbody bag with gold hardware. Perfect for everyday use.", SKU: "BAG-ESS-BLK-001", Price: 5750000, ImageURL: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop", CategoryID: 6, Rating: 4.8, ReviewCount: 156, Stock: 50, LeadTimeDays: 14, SellerID: sellerID},
		{ID: 2, Name: "Jeka Jacket", Description: "Comfortable and stylish jacket made from premium materials. Water-resistant exterior.", SKU: "MAN-JEK-BLK-001", Price: 185000, ImageURL: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop", CategoryID: 3, Rating: 4.5, ReviewCount: 89, Stock: 120, LeadTimeDays: 7, SellerID: sellerID},
		{ID: 3, Name: "Accent Leisure Chair", Description: "Modern accent chair with premium upholstery.", SKU: "ALL-ALC-WHT-001", Price: 950000, ImageURL: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=500&fit=crop", CategoryID: 1, Rating: 4.3, ReviewCount: 67, Stock: 30, LeadTimeDays: 21},
		{ID: 4, Name: "Luxury Sofa Velvet", Description: "Elegant velvet sofa with tufted design.", SKU: "ALL-LSV-GRN-001", Price: 2750000, ImageURL: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop", CategoryID: 1, Rating: 4.7, ReviewCount: 203, Stock: 15, LeadTimeDays: 30},
		{ID: 5, Name: "Sports Tech Sneakers", Description: "High-performance sports tech sneakers with advanced cushioning.", SKU: "SHO-STS-WHT-001", Price: 1200000, ImageURL: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop", CategoryID: 5, Rating: 4.6, ReviewCount: 234, Stock: 200, LeadTimeDays: 10, SellerID: sellerID},
		{ID: 6, Name: "Essential Backpack", Description: "Durable everyday backpack with multiple compartments.", SKU: "BAG-EBP-BLK-001", Price: 12750000, ImageURL: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop", CategoryID: 6, Rating: 4.9, ReviewCount: 312, Stock: 45, LeadTimeDays: 14, SellerID: sellerID},
		{ID: 7, Name: "Boyfriend Tee", Description: "Relaxed fit boyfriend tee made from 100% organic cotton.", SKU: "WOM-BFT-WHT-001", Price: 250000, ImageURL: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop", CategoryID: 2, Rating: 4.4, ReviewCount: 178, Stock: 300, LeadTimeDays: 5, SellerID: sellerID},
		{ID: 8, Name: "Jordan 1 Retro High", Description: "Iconic sneaker with premium leather.", SKU: "SHO-J1R-RED-001", Price: 3500000, ImageURL: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=500&fit=crop", CategoryID: 5, Rating: 4.8, ReviewCount: 445, Stock: 80, LeadTimeDays: 14},
		{ID: 9, Name: "Fashion Watch", Description: "Elegant fashion watch with stainless steel case.", SKU: "ALL-FWT-SLV-001", Price: 4500000, ImageURL: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=500&fit=crop", CategoryID: 1, Rating: 4.7, ReviewCount: 89, Stock: 60, LeadTimeDays: 21},
		{ID: 10, Name: "Random Green Olive Recycled", Description: "Eco-friendly recycled t-shirt.", SKU: "MAN-RGO-GRN-001", Price: 1800000, ImageURL: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop", CategoryID: 3, Rating: 4.2, ReviewCount: 56, Stock: 150, LeadTimeDays: 7},
		{ID: 11, Name: "Kids Denim Jacket", Description: "Stylish denim jacket for kids.", SKU: "KID-KDJ-BLU-001", Price: 450000, ImageURL: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=500&fit=crop", CategoryID: 4, Rating: 4.6, ReviewCount: 38, Stock: 100, LeadTimeDays: 10},
	}
	DB.Create(&products)

	// ====== PRODUCT VARIANTS ======
	variants := []models.ProductVariant{
		// Essential Bag
		{ProductID: 1, Type: "color", Value: "#000000", Label: "Black", Stock: 20},
		{ProductID: 1, Type: "color", Value: "#8B4513", Label: "Brown", Stock: 15},
		{ProductID: 1, Type: "color", Value: "#F5F5DC", Label: "Beige", Stock: 15},
		// Jeka Jacket
		{ProductID: 2, Type: "color", Value: "#000000", Label: "Black", Stock: 40},
		{ProductID: 2, Type: "color", Value: "#8B4513", Label: "Brown", Stock: 40},
		{ProductID: 2, Type: "size", Value: "S", Label: "S", Stock: 30},
		{ProductID: 2, Type: "size", Value: "M", Label: "M", Stock: 30},
		{ProductID: 2, Type: "size", Value: "L", Label: "L", Stock: 30},
		{ProductID: 2, Type: "size", Value: "XL", Label: "XL", Stock: 30},
		// Sports Tech Sneakers
		{ProductID: 5, Type: "color", Value: "#FFFFFF", Label: "White", Stock: 80},
		{ProductID: 5, Type: "color", Value: "#000000", Label: "Black", Stock: 60},
		{ProductID: 5, Type: "color", Value: "#FF0000", Label: "Red", Stock: 60},
		{ProductID: 5, Type: "size", Value: "38", Label: "38", Stock: 40},
		{ProductID: 5, Type: "size", Value: "39", Label: "39", Stock: 40},
		{ProductID: 5, Type: "size", Value: "40", Label: "40", Stock: 40},
		{ProductID: 5, Type: "size", Value: "41", Label: "41", Stock: 40},
		{ProductID: 5, Type: "size", Value: "42", Label: "42", Stock: 40},
	}
	DB.Create(&variants)

	// ====== SUPPLIERS ======
	suppliers := []models.Supplier{
		{ID: 1, Name: "PT. Fashion Indo", Contact: "Budi Santoso", Email: "budi@fashionindo.co.id", Phone: "+62 21 555 1234", AvgLeadTimeDays: 14},
		{ID: 2, Name: "CV. Sepatu Nusantara", Contact: "Dewi Lestari", Email: "dewi@sepatunusantara.id", Phone: "+62 21 555 5678", AvgLeadTimeDays: 10},
		{ID: 3, Name: "PT. Premium Goods", Contact: "Ahmad Rizki", Email: "ahmad@premiumgoods.id", Phone: "+62 21 555 9012", AvgLeadTimeDays: 21},
	}
	DB.Create(&suppliers)

	// ====== STORES ======
	stores := []models.Store{
		{ID: 1, Name: "SnapShop Grand Indonesia", Address: "Jl. M.H. Thamrin No.1, Menteng", City: "Jakarta Pusat", Hours: "10:00 - 22:00", Phone: "+62 21 2358 0000", Latitude: -6.1950, Longitude: 106.8211},
		{ID: 2, Name: "SnapShop Senayan City", Address: "Jl. Asia Afrika No.19, Gelora", City: "Jakarta Pusat", Hours: "10:00 - 22:00", Phone: "+62 21 7278 2000", Latitude: -6.2273, Longitude: 106.7993},
		{ID: 3, Name: "SnapShop Pakuwon Mall", Address: "Jl. Mayjend Jonosewojo, Lontar", City: "Surabaya", Hours: "10:00 - 22:00", Phone: "+62 31 7398 1234", Latitude: -7.2908, Longitude: 112.6750},
		{ID: 4, Name: "SnapShop Living World Alam Sutera", Address: "Jl. Alam Sutera Boulevard Kav.21", City: "Tangerang Selatan", Hours: "10:00 - 22:00", Phone: "+62 21 2900 5678", Latitude: -6.2243, Longitude: 106.6502},
	}
	DB.Create(&stores)

	// ====== STOCK BATCHES (FIFO) ======
	now := time.Now()
	batches := []models.StockBatch{
		{ProductVariantID: 1, ProductID: 1, Quantity: 20, Remaining: 20, CostPrice: 3500000, BatchNumber: "B-2026-001", SupplierID: uintPtr(1), ReceivedAt: now.AddDate(0, -2, 0)},
		{ProductVariantID: 2, ProductID: 1, Quantity: 15, Remaining: 15, CostPrice: 3500000, BatchNumber: "B-2026-002", SupplierID: uintPtr(1), ReceivedAt: now.AddDate(0, -1, 0)},
		{ProductVariantID: 3, ProductID: 1, Quantity: 15, Remaining: 15, CostPrice: 3500000, BatchNumber: "B-2026-003", SupplierID: uintPtr(1), ReceivedAt: now.AddDate(0, 0, -15)},
		{ProductVariantID: 10, ProductID: 5, Quantity: 80, Remaining: 80, CostPrice: 600000, BatchNumber: "B-2026-004", SupplierID: uintPtr(2), ReceivedAt: now.AddDate(0, -1, -10)},
		{ProductVariantID: 11, ProductID: 5, Quantity: 60, Remaining: 60, CostPrice: 600000, BatchNumber: "B-2026-005", SupplierID: uintPtr(2), ReceivedAt: now.AddDate(0, 0, -20)},
	}
	DB.Create(&batches)

	// ====== VOUCHERS (from frontend data.ts) ======
	vouchers := []models.Voucher{
		{Code: "WELCOME10", Title: "Welcome Discount", Description: "Diskon 10% untuk pembelian pertama", DiscountType: "percentage", DiscountValue: 10, MinPurchase: 500000, MaxDiscount: 200000, ValidUntil: now.AddDate(0, 1, 0), IsActive: true},
		{Code: "HEMAT50K", Title: "Hemat Rp50.000", Description: "Potongan langsung Rp50.000", DiscountType: "fixed", DiscountValue: 50000, MinPurchase: 300000, MaxDiscount: 50000, ValidUntil: now.AddDate(0, 0, 15), IsActive: true},
		{Code: "FREESHIP", Title: "Free Ongkir", Description: "Gratis ongkir untuk semua pengiriman", DiscountType: "shipping", DiscountValue: 0, MinPurchase: 200000, MaxDiscount: 30000, ValidUntil: now.AddDate(0, 0, 30), IsActive: true},
		{Code: "SNAP20", Title: "SnapShop Special", Description: "Diskon 20% khusus member", DiscountType: "percentage", DiscountValue: 20, MinPurchase: 1000000, MaxDiscount: 500000, ValidUntil: now.AddDate(0, 2, 0), IsActive: true},
		{Code: "PAYDAY100", Title: "Payday Sale", Description: "Potongan Rp100.000 saat gajian", DiscountType: "fixed", DiscountValue: 100000, MinPurchase: 750000, MaxDiscount: 100000, ValidUntil: now.AddDate(0, 0, 5), IsActive: true},
	}
	DB.Create(&vouchers)

	// ====== ADDRESSES ======
	addresses := []models.Address{
		{UserID: 1, Label: "Rumah", RecipientName: "John Doe", Phone: "081234567890", Street: "Jl. Sudirman No. 123", City: "Jakarta Selatan", Province: "DKI Jakarta", PostalCode: "12190", IsDefault: true},
		{UserID: 1, Label: "Kantor", RecipientName: "John Doe", Phone: "081234567890", Street: "Jl. Gatot Subroto Kav. 42", City: "Jakarta Selatan", Province: "DKI Jakarta", PostalCode: "12950", IsDefault: false},
	}
	DB.Create(&addresses)

	// ====== REVIEWS ======
	reviews := []models.Review{
		{UserID: 1, ProductID: 1, Rating: 5, Text: "Tas-nya super premium! Bahannya lembut dan jahitannya rapi. Worth every penny! 💯", HelpfulCount: 12, CreatedAt: now.AddDate(0, 0, -7)},
		{UserID: 1, ProductID: 1, Rating: 4, Text: "Bagus sih, tapi agak kecil untuk daily use. Cocok untuk evening out.", HelpfulCount: 5, CreatedAt: now.AddDate(0, 0, -14)},
		{UserID: 1, ProductID: 5, Rating: 5, Text: "Sneakers-nya nyaman banget! Cocok untuk olahraga maupun casual.", HelpfulCount: 8, CreatedAt: now.AddDate(0, 0, -3)},
	}
	DB.Create(&reviews)

	log.Println("✅ Database seeded successfully")
}

func uintPtr(v uint) *uint {
	return &v
}
