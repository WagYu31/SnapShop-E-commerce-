package handlers

import (
	"fmt"
	"math"
	"snapshop-api/database"
	"snapshop-api/models"
	"snapshop-api/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct{}

// Dashboard stats — role-aware
func (h *AdminHandler) Dashboard(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("user_role")

	var totalOrders, totalProducts, totalUsers int64
	var totalRevenue int

	switch role {
	case "seller":
		// Seller: only their own products and related orders
		database.DB.Model(&models.Product{}).Where("seller_id = ?", userID).Count(&totalProducts)
		database.DB.Raw(`
			SELECT COUNT(DISTINCT o.id) FROM orders o
			JOIN order_items oi ON oi.order_id = o.id
			JOIN products p ON p.id = oi.product_id
			WHERE p.seller_id = ?
		`, userID).Scan(&totalOrders)
		database.DB.Raw(`
			SELECT COALESCE(SUM(oi.quantity * oi.price), 0) FROM order_items oi
			JOIN products p ON p.id = oi.product_id
			JOIN orders o ON o.id = oi.order_id
			WHERE p.seller_id = ? AND o.status != 'canceled'
		`, userID).Scan(&totalRevenue)
		database.DB.Raw(`
			SELECT COUNT(DISTINCT o.user_id) FROM orders o
			JOIN order_items oi ON oi.order_id = o.id
			JOIN products p ON p.id = oi.product_id
			WHERE p.seller_id = ?
		`, userID).Scan(&totalUsers)

	default:
		// Admin, Warehouse, Store, SuperAdmin: global stats
		database.DB.Model(&models.Order{}).Count(&totalOrders)
		database.DB.Model(&models.Product{}).Count(&totalProducts)
		database.DB.Model(&models.User{}).Where("role = ?", "customer").Count(&totalUsers)
		database.DB.Model(&models.Order{}).Where("status != ?", "canceled").Select("COALESCE(SUM(total), 0)").Scan(&totalRevenue)
	}

	// Recent orders (seller filtered)
	var recentOrders []models.Order
	if role == "seller" {
		database.DB.Raw(`
			SELECT DISTINCT o.* FROM orders o
			JOIN order_items oi ON oi.order_id = o.id
			JOIN products p ON p.id = oi.product_id
			WHERE p.seller_id = ?
			ORDER BY o.created_at DESC LIMIT 10
		`, userID).Scan(&recentOrders)
	} else {
		database.DB.Preload("Items").Order("created_at DESC").Limit(10).Find(&recentOrders)
	}

	// Low stock alerts (seller filtered)
	var lowStock []models.Product
	if role == "seller" {
		database.DB.Where("stock <= reorder_point AND seller_id = ?", userID).Find(&lowStock)
	} else {
		database.DB.Where("stock <= reorder_point").Find(&lowStock)
	}

	// Orders by status
	type StatusCount struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	var statusCounts []StatusCount
	if role == "seller" {
		database.DB.Raw(`
			SELECT o.status, COUNT(DISTINCT o.id) as count FROM orders o
			JOIN order_items oi ON oi.order_id = o.id
			JOIN products p ON p.id = oi.product_id
			WHERE p.seller_id = ?
			GROUP BY o.status
		`, userID).Scan(&statusCounts)
	} else {
		database.DB.Model(&models.Order{}).Select("status, count(*) as count").Group("status").Scan(&statusCounts)
	}

	utils.Success(c, gin.H{
		"total_orders":    totalOrders,
		"total_products":  totalProducts,
		"total_customers": totalUsers,
		"total_revenue":   totalRevenue,
		"recent_orders":   recentOrders,
		"low_stock":       lowStock,
		"orders_by_status": statusCounts,
		"role":            role,
	})
}

// Admin: Create product
func (h *AdminHandler) CreateProduct(c *gin.Context) {
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	database.DB.Create(&product)
	utils.Created(c, product)
}

// Admin: Update product
func (h *AdminHandler) UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := database.DB.First(&product, id).Error; err != nil {
		utils.NotFound(c, "Product not found")
		return
	}
	if err := c.ShouldBindJSON(&product); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	database.DB.Save(&product)
	utils.Success(c, product)
}

// Admin: Delete product
func (h *AdminHandler) DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	result := database.DB.Delete(&models.Product{}, id)
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Product not found")
		return
	}
	utils.Success(c, gin.H{"message": "Product deleted"})
}

// Admin: Update order status
func (h *AdminHandler) UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	validStatuses := map[string]bool{
		"pending": true, "confirmed": true, "preparing": true,
		"in_transit": true, "delivered": true, "canceled": true,
	}
	if !validStatuses[input.Status] {
		utils.BadRequest(c, "Invalid status")
		return
	}

	result := database.DB.Model(&models.Order{}).Where("id = ?", id).Update("status", input.Status)
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Order not found")
		return
	}
	utils.Success(c, gin.H{"message": "Order status updated to " + input.Status})
}

// Admin: CRUD vouchers
func (h *AdminHandler) CreateVoucher(c *gin.Context) {
	var voucher models.Voucher
	if err := c.ShouldBindJSON(&voucher); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	database.DB.Create(&voucher)
	utils.Created(c, voucher)
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	var users []models.User
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	query := database.DB.Model(&models.User{})
	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}
	query.Count(&total)
	query.Offset(offset).Limit(limit).Find(&users)

	utils.SuccessWithMeta(c, users, &utils.Meta{
		Page: page, Limit: limit, Total: total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	})
}

// ====== WAREHOUSE ======

type WarehouseHandler struct{}

func (h *WarehouseHandler) StockOverview(c *gin.Context) {
	var products []models.Product
	database.DB.Preload("Variants").Order("stock ASC").Find(&products)

	// Stock aging report
	type AgingReport struct {
		ProductID   uint   `json:"product_id"`
		ProductName string `json:"product_name"`
		BatchNumber string `json:"batch_number"`
		Remaining   int    `json:"remaining"`
		DaysOld     int    `json:"days_old"`
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

func (h *WarehouseHandler) Inbound(c *gin.Context) {
	var input struct {
		ProductID        uint  `json:"product_id" binding:"required"`
		ProductVariantID uint  `json:"product_variant_id"`
		Quantity         int   `json:"quantity" binding:"required,min=1"`
		CostPrice        int   `json:"cost_price" binding:"required"`
		SupplierID       *uint `json:"supplier_id"`
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

	// Update product stock
	database.DB.Model(&models.Product{}).Where("id = ?", input.ProductID).
		UpdateColumn("stock", database.DB.Raw("stock + ?", input.Quantity))

	utils.Created(c, batch)
}

func (h *WarehouseHandler) LowStockAlerts(c *gin.Context) {
	var products []models.Product
	database.DB.Where("stock <= reorder_point").Order("stock ASC").Find(&products)
	utils.Success(c, gin.H{
		"alerts": products,
		"count":  len(products),
	})
}

// ====== STORE ======

type StoreHandler struct{}

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

	// Update store stock
	var storeStock models.StoreStock
	if database.DB.Where("store_id = ? AND product_id = ?", transfer.StoreID, transfer.ProductID).First(&storeStock).Error != nil {
		storeStock = models.StoreStock{StoreID: transfer.StoreID, ProductID: transfer.ProductID, Quantity: transfer.Quantity}
		database.DB.Create(&storeStock)
	} else {
		database.DB.Model(&storeStock).Update("quantity", storeStock.Quantity+transfer.Quantity)
	}

	// Deduct warehouse stock
	database.DB.Model(&models.Product{}).Where("id = ?", transfer.ProductID).
		UpdateColumn("stock", database.DB.Raw("stock - ?", transfer.Quantity))

	utils.Success(c, gin.H{"message": "Transfer received", "transfer": transfer})
}

// ====== SUPER ADMIN ======

type SuperAdminHandler struct{}

func (h *SuperAdminHandler) UpdateUserRole(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	validRoles := map[string]bool{
		"customer": true, "seller": true, "warehouse": true,
		"store": true, "admin": true, "superadmin": true,
	}
	if !validRoles[input.Role] {
		utils.BadRequest(c, "Invalid role")
		return
	}

	result := database.DB.Model(&models.User{}).Where("id = ?", id).Update("role", input.Role)
	if result.RowsAffected == 0 {
		utils.NotFound(c, "User not found")
		return
	}

	// Audit log
	userID := c.GetUint("user_id")
	targetID, _ := strconv.ParseUint(id, 10, 32)
	database.DB.Create(&models.AuditLog{
		UserID:   userID,
		Action:   "change_role",
		Entity:   "user",
		EntityID: uint(targetID),
		Details:  fmt.Sprintf("Role changed to %s", input.Role),
		IP:       c.ClientIP(),
	})

	utils.Success(c, gin.H{"message": fmt.Sprintf("User role updated to %s", input.Role)})
}

func (h *SuperAdminHandler) AuditLogs(c *gin.Context) {
	var logs []models.AuditLog
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	database.DB.Model(&models.AuditLog{}).Count(&total)
	database.DB.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs)

	utils.SuccessWithMeta(c, logs, &utils.Meta{
		Page: page, Limit: limit, Total: total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	})
}
