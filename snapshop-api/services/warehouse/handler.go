package warehouse

import (
	"fmt"
	"snapshop-api/database"
	"snapshop-api/models"
	"snapshop-api/utils"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct{}
type StoreHandler struct{}

func (h *Handler) StockOverview(c *gin.Context) {
	var products []models.Product
	database.DB.Preload("Variants").Order("stock ASC").Find(&products)

	type AgingReport struct {
		ProductID   uint      `json:"product_id"`
		ProductName string    `json:"product_name"`
		BatchNumber string    `json:"batch_number"`
		Remaining   int       `json:"remaining"`
		DaysOld     int       `json:"days_old"`
		ReceivedAt  time.Time `json:"received_at"`
	}
	var aging []AgingReport
	database.DB.Raw(`
		SELECT sb.product_id, p.name as product_name, sb.batch_number, 
			   sb.remaining, sb.received_at,
			   CAST(julianday('now') - julianday(sb.received_at) AS INTEGER) as days_old
		FROM stock_batches sb 
		JOIN products p ON p.id = sb.product_id
		WHERE sb.remaining > 0 
		ORDER BY sb.received_at ASC
	`).Scan(&aging)

	utils.Success(c, gin.H{
		"products": products,
		"aging":    aging,
	})
}

func (h *Handler) Inbound(c *gin.Context) {
	var input struct {
		ProductID        uint   `json:"product_id" binding:"required"`
		ProductVariantID uint   `json:"product_variant_id"`
		Quantity         int    `json:"quantity" binding:"required,min=1"`
		CostPrice        int    `json:"cost_price"`
		SupplierID       *uint  `json:"supplier_id"`
		BatchNumber      string `json:"batch_number"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if input.BatchNumber == "" {
		input.BatchNumber = fmt.Sprintf("B-%s-%04d", time.Now().Format("20060102"), time.Now().UnixMilli()%10000)
	}

	batch := models.StockBatch{
		ProductID:        input.ProductID,
		ProductVariantID: input.ProductVariantID,
		Quantity:         input.Quantity,
		Remaining:        input.Quantity,
		CostPrice:        input.CostPrice,
		SupplierID:       input.SupplierID,
		BatchNumber:      input.BatchNumber,
		ReceivedAt:       time.Now(),
	}
	database.DB.Create(&batch)

	database.DB.Model(&models.Product{}).Where("id = ?", input.ProductID).
		UpdateColumn("stock", database.DB.Raw("stock + ?", input.Quantity))

	utils.Created(c, batch)
}

func (h *Handler) LowStockAlerts(c *gin.Context) {
	var products []models.Product
	database.DB.Where("stock <= reorder_point").Order("stock ASC").Find(&products)
	utils.Success(c, gin.H{
		"alerts": products,
		"count":  len(products),
	})
}

// ====== STORE ======

func (h *StoreHandler) ListStores(c *gin.Context) {
	var stores []models.Store
	database.DB.Find(&stores)
	utils.Success(c, stores)
}

func (h *StoreHandler) CreateStore(c *gin.Context) {
	var input struct {
		Name      string  `json:"name" binding:"required"`
		Address   string  `json:"address"`
		City      string  `json:"city"`
		Hours     string  `json:"hours"`
		Phone     string  `json:"phone"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, 400, err.Error())
		return
	}
	store := models.Store{
		Name: input.Name, Address: input.Address, City: input.City,
		Hours: input.Hours, Phone: input.Phone,
		Latitude: input.Latitude, Longitude: input.Longitude, IsActive: true,
	}
	database.DB.Create(&store)
	utils.Success(c, store)
}

func (h *StoreHandler) UpdateStore(c *gin.Context) {
	id := c.Param("id")
	var store models.Store
	if err := database.DB.First(&store, id).Error; err != nil {
		utils.Error(c, 404, "Store not found")
		return
	}
	var input struct {
		Name      string  `json:"name"`
		Address   string  `json:"address"`
		City      string  `json:"city"`
		Hours     string  `json:"hours"`
		Phone     string  `json:"phone"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		IsActive  *bool   `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, 400, err.Error())
		return
	}
	if input.Name != "" { store.Name = input.Name }
	if input.Address != "" { store.Address = input.Address }
	if input.City != "" { store.City = input.City }
	if input.Hours != "" { store.Hours = input.Hours }
	if input.Phone != "" { store.Phone = input.Phone }
	if input.Latitude != 0 { store.Latitude = input.Latitude }
	if input.Longitude != 0 { store.Longitude = input.Longitude }
	if input.IsActive != nil { store.IsActive = *input.IsActive }
	database.DB.Save(&store)
	utils.Success(c, store)
}

func (h *StoreHandler) DeleteStore(c *gin.Context) {
	id := c.Param("id")
	database.DB.Delete(&models.Store{}, id)
	utils.Success(c, nil)
}

func (h *StoreHandler) GetStoreStock(c *gin.Context) {
	storeID := c.Param("id")
	var stocks []models.StoreStock
	database.DB.Preload("Product").Where("store_id = ?", storeID).Find(&stocks)
	utils.Success(c, stocks)
}

func (h *StoreHandler) ListTransfers(c *gin.Context) {
	var transfers []models.StockTransfer
	query := database.DB
	if storeID := c.Query("store_id"); storeID != "" {
		query = query.Where("store_id = ?", storeID)
	}
	query.Order("created_at DESC").Limit(50).Find(&transfers)
	utils.Success(c, transfers)
}

func (h *StoreHandler) SellOffline(c *gin.Context) {
	var input struct {
		StoreID   uint `json:"store_id" binding:"required"`
		ProductID uint `json:"product_id" binding:"required"`
		Quantity  int  `json:"quantity" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, 400, err.Error())
		return
	}
	var storeStock models.StoreStock
	if err := database.DB.Where("store_id = ? AND product_id = ?", input.StoreID, input.ProductID).First(&storeStock).Error; err != nil {
		utils.Error(c, 404, "Produk tidak ada di toko ini")
		return
	}
	if storeStock.Quantity < input.Quantity {
		utils.Error(c, 400, "Stok tidak cukup")
		return
	}
	database.DB.Model(&storeStock).Update("quantity", storeStock.Quantity-input.Quantity)
	utils.Success(c, gin.H{"message": "Penjualan offline berhasil", "remaining_stock": storeStock.Quantity - input.Quantity})
}

func (h *StoreHandler) AddStoreStock(c *gin.Context) {
	var input struct {
		StoreID   uint `json:"store_id" binding:"required"`
		ProductID uint `json:"product_id" binding:"required"`
		Quantity  int  `json:"quantity" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.Error(c, 400, err.Error())
		return
	}
	var storeStock models.StoreStock
	if err := database.DB.Where("store_id = ? AND product_id = ?", input.StoreID, input.ProductID).First(&storeStock).Error; err != nil {
		storeStock = models.StoreStock{StoreID: input.StoreID, ProductID: input.ProductID, Quantity: input.Quantity}
		database.DB.Create(&storeStock)
	} else {
		storeStock.Quantity += input.Quantity
		database.DB.Save(&storeStock)
	}
	utils.Success(c, gin.H{"message": "Stok berhasil ditambahkan", "total_stock": storeStock.Quantity})
}

func (h *StoreHandler) TransferStock(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input struct {
		ProductID uint `json:"product_id" binding:"required"`
		StoreID   uint `json:"store_id" binding:"required"`
		Quantity  int  `json:"quantity" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	transfer := models.StockTransfer{
		ProductID:     input.ProductID,
		StoreID:       input.StoreID,
		Quantity:      input.Quantity,
		Status:        "pending",
		TransferredBy: userID,
	}
	database.DB.Create(&transfer)
	utils.Created(c, transfer)
}

func (h *StoreHandler) ReceiveTransfer(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var transfer models.StockTransfer
	if err := database.DB.First(&transfer, id).Error; err != nil {
		utils.NotFound(c, "Transfer not found")
		return
	}

	now := time.Now()
	transfer.Status = "received"
	transfer.ReceivedBy = &userID
	transfer.ReceivedAt = &now
	database.DB.Save(&transfer)

	var storeStock models.StoreStock
	if database.DB.Where("store_id = ? AND product_id = ?", transfer.StoreID, transfer.ProductID).First(&storeStock).Error != nil {
		storeStock = models.StoreStock{StoreID: transfer.StoreID, ProductID: transfer.ProductID, Quantity: transfer.Quantity}
		database.DB.Create(&storeStock)
	} else {
		database.DB.Model(&storeStock).Update("quantity", storeStock.Quantity+transfer.Quantity)
	}

	database.DB.Model(&models.Product{}).Where("id = ?", transfer.ProductID).
		UpdateColumn("stock", database.DB.Raw("stock - ?", transfer.Quantity))

	utils.Success(c, gin.H{"message": "Transfer received", "transfer": transfer})
}
