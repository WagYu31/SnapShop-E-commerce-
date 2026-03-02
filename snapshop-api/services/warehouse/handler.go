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
		CostPrice        int    `json:"cost_price" binding:"required"`
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
	database.DB.Where("is_active = ?", true).Find(&stores)
	utils.Success(c, stores)
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
