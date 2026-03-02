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

// ==================== REPORTS ====================

type ReportHandler struct{}

func (h *ReportHandler) SalesReport(c *gin.Context) {
	period := c.DefaultQuery("period", "30") // days
	days, _ := strconv.Atoi(period)
	since := time.Now().AddDate(0, 0, -days)

	// Sales over time
	type DailySales struct {
		Date     string `json:"date"`
		Revenue  int    `json:"revenue"`
		Orders   int    `json:"orders"`
	}
	var daily []DailySales
	database.DB.Raw(`
		SELECT date(created_at) as date, 
			   COALESCE(SUM(total), 0) as revenue, 
			   COUNT(*) as orders
		FROM orders 
		WHERE status != 'canceled' AND created_at >= ?
		GROUP BY date(created_at) 
		ORDER BY date ASC
	`, since).Scan(&daily)

	// Total revenue
	var totalRevenue int
	database.DB.Model(&models.Order{}).Where("status != ? AND created_at >= ?", "canceled", since).
		Select("COALESCE(SUM(total), 0)").Scan(&totalRevenue)

	var totalOrders int64
	database.DB.Model(&models.Order{}).Where("status != ? AND created_at >= ?", "canceled", since).Count(&totalOrders)

	var avgOrderValue int
	if totalOrders > 0 {
		avgOrderValue = totalRevenue / int(totalOrders)
	}

	utils.Success(c, gin.H{
		"period":          days,
		"total_revenue":   totalRevenue,
		"total_orders":    totalOrders,
		"avg_order_value": avgOrderValue,
		"daily_sales":     daily,
	})
}

func (h *ReportHandler) TopProducts(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	type TopProduct struct {
		ProductID   uint    `json:"product_id"`
		ProductName string  `json:"product_name"`
		SKU         string  `json:"sku"`
		ImageURL    string  `json:"image_url"`
		TotalSold   int     `json:"total_sold"`
		TotalRevenue int    `json:"total_revenue"`
		AvgRating   float64 `json:"avg_rating"`
	}
	var top []TopProduct
	database.DB.Raw(`
		SELECT oi.product_id, p.name as product_name, p.sku, p.image_url,
			   SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as total_revenue,
			   p.rating as avg_rating
		FROM order_items oi 
		JOIN products p ON p.id = oi.product_id 
		JOIN orders o ON o.id = oi.order_id
		WHERE o.status != 'canceled'
		GROUP BY oi.product_id, p.name, p.sku, p.image_url, p.rating
		ORDER BY total_sold DESC 
		LIMIT ?
	`, limit).Scan(&top)

	utils.Success(c, top)
}

func (h *ReportHandler) RevenueByCategory(c *gin.Context) {
	type CatRevenue struct {
		CategoryID   uint   `json:"category_id"`
		CategoryName string `json:"category_name"`
		Revenue      int    `json:"revenue"`
		Orders       int    `json:"orders"`
		Products     int    `json:"products"`
	}
	var categories []CatRevenue
	database.DB.Raw(`
		SELECT c.id as category_id, c.name as category_name,
			   COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
			   COUNT(DISTINCT o.id) as orders,
			   COUNT(DISTINCT p.id) as products
		FROM categories c
		LEFT JOIN products p ON p.category_id = c.id
		LEFT JOIN order_items oi ON oi.product_id = p.id
		LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'canceled'
		GROUP BY c.id, c.name
		ORDER BY revenue DESC
	`).Scan(&categories)

	utils.Success(c, categories)
}

// ==================== PROCUREMENT ====================

type ProcurementHandler struct{}

func (h *ProcurementHandler) ListPurchaseOrders(c *gin.Context) {
	var orders []models.PurchaseOrder
	var total int64

	query := database.DB.Model(&models.PurchaseOrder{})
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	query.Count(&total)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	query.Preload("Supplier").Preload("Items").Preload("Items.Product").
		Order("created_at DESC").Offset(offset).Limit(limit).Find(&orders)

	utils.SuccessWithMeta(c, orders, &utils.Meta{
		Page: page, Limit: limit, Total: total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	})
}

func (h *ProcurementHandler) CreatePurchaseOrder(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input struct {
		SupplierID uint   `json:"supplier_id" binding:"required"`
		Notes      string `json:"notes"`
		Items      []struct {
			ProductID uint `json:"product_id" binding:"required"`
			Quantity  int  `json:"quantity" binding:"required,min=1"`
			UnitCost  int  `json:"unit_cost" binding:"required,min=0"`
		} `json:"items" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	poNumber := fmt.Sprintf("PO-%s-%04d", time.Now().Format("20060102"), time.Now().UnixMilli()%10000)

	// Calculate total
	totalAmount := 0
	for _, item := range input.Items {
		totalAmount += item.Quantity * item.UnitCost
	}

	// Get supplier lead time for expected date
	var supplier models.Supplier
	database.DB.First(&supplier, input.SupplierID)
	expectedAt := time.Now().AddDate(0, 0, supplier.AvgLeadTimeDays)

	po := models.PurchaseOrder{
		PONumber:    poNumber,
		SupplierID:  input.SupplierID,
		Status:      "draft",
		TotalAmount: totalAmount,
		Notes:       input.Notes,
		ExpectedAt:  &expectedAt,
		CreatedBy:   userID,
	}
	database.DB.Create(&po)

	for _, item := range input.Items {
		poItem := models.PurchaseOrderItem{
			PurchaseOrderID: po.ID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			UnitCost:        item.UnitCost,
		}
		database.DB.Create(&poItem)
	}

	database.DB.Preload("Supplier").Preload("Items").Preload("Items.Product").First(&po, po.ID)
	utils.Created(c, po)
}

func (h *ProcurementHandler) UpdatePOStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var po models.PurchaseOrder
	if err := database.DB.First(&po, id).Error; err != nil {
		utils.NotFound(c, "Purchase order not found")
		return
	}

	po.Status = input.Status
	if input.Status == "received" {
		now := time.Now()
		po.ReceivedAt = &now
	}
	database.DB.Save(&po)
	utils.Success(c, gin.H{"message": "PO status updated to " + input.Status})
}

func (h *ProcurementHandler) ListSuppliers(c *gin.Context) {
	var suppliers []models.Supplier
	database.DB.Find(&suppliers)
	utils.Success(c, suppliers)
}

// ==================== RETURNS ====================

type ReturnHandler struct{}

func (h *ReturnHandler) ListReturns(c *gin.Context) {
	var returns []models.Return
	var total int64

	query := database.DB.Model(&models.Return{})
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	query.Count(&total)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	query.Preload("Order").Preload("User").
		Order("created_at DESC").Offset(offset).Limit(limit).Find(&returns)

	utils.SuccessWithMeta(c, returns, &utils.Meta{
		Page: page, Limit: limit, Total: total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	})
}

func (h *ReturnHandler) CreateReturn(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input struct {
		OrderID      uint   `json:"order_id" binding:"required"`
		Reason       string `json:"reason" binding:"required"`
		Photos       string `json:"photos"`
		RefundAmount int    `json:"refund_amount"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// Check order belongs to user and is delivered
	var order models.Order
	if err := database.DB.Where("id = ? AND user_id = ? AND status = ?", input.OrderID, userID, "delivered").First(&order).Error; err != nil {
		utils.BadRequest(c, "Order not found or not eligible for return")
		return
	}

	ret := models.Return{
		OrderID:      input.OrderID,
		UserID:       userID,
		Reason:       input.Reason,
		Status:       "requested",
		RefundAmount: input.RefundAmount,
		Photos:       input.Photos,
	}
	database.DB.Create(&ret)
	utils.Created(c, ret)
}

func (h *ReturnHandler) UpdateReturn(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status       string `json:"status" binding:"required"`
		AdminNotes   string `json:"admin_notes"`
		RefundAmount int    `json:"refund_amount"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	validStatuses := map[string]bool{"requested": true, "approved": true, "rejected": true, "refunded": true}
	if !validStatuses[input.Status] {
		utils.BadRequest(c, "Invalid status")
		return
	}

	updates := map[string]interface{}{"status": input.Status}
	if input.AdminNotes != "" { updates["admin_notes"] = input.AdminNotes }
	if input.RefundAmount > 0 { updates["refund_amount"] = input.RefundAmount }

	result := database.DB.Model(&models.Return{}).Where("id = ?", id).Updates(updates)
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Return not found")
		return
	}
	utils.Success(c, gin.H{"message": "Return updated to " + input.Status})
}

// ==================== FINANCE ====================

type FinanceHandler struct{}

func (h *FinanceHandler) ProfitLoss(c *gin.Context) {
	period := c.DefaultQuery("period", "30")
	days, _ := strconv.Atoi(period)
	since := time.Now().AddDate(0, 0, -days)

	// Revenue from orders
	var totalRevenue int
	database.DB.Model(&models.Order{}).Where("status != ? AND created_at >= ?", "canceled", since).
		Select("COALESCE(SUM(total), 0)").Scan(&totalRevenue)

	// COGS (Cost of Goods Sold) from stock batches used
	var totalCOGS int
	database.DB.Raw(`
		SELECT COALESCE(SUM(oi.quantity * sb.cost_price), 0) 
		FROM order_items oi 
		JOIN orders o ON o.id = oi.order_id 
		LEFT JOIN stock_batches sb ON sb.product_id = oi.product_id
		WHERE o.status != 'canceled' AND o.created_at >= ?
		GROUP BY sb.product_id
	`, since).Scan(&totalCOGS)

	// Refunds
	var totalRefunds int
	database.DB.Model(&models.Return{}).Where("status = ? AND created_at >= ?", "refunded", since).
		Select("COALESCE(SUM(refund_amount), 0)").Scan(&totalRefunds)

	// Shipping collected
	var shippingRevenue int
	database.DB.Model(&models.Order{}).Where("status != ? AND created_at >= ?", "canceled", since).
		Select("COALESCE(SUM(shipping_cost), 0)").Scan(&shippingRevenue)

	// Discounts given
	var totalDiscounts int
	database.DB.Model(&models.Order{}).Where("status != ? AND created_at >= ?", "canceled", since).
		Select("COALESCE(SUM(discount), 0)").Scan(&totalDiscounts)

	grossProfit := totalRevenue - totalCOGS
	netProfit := grossProfit - totalRefunds

	utils.Success(c, gin.H{
		"period":           days,
		"total_revenue":    totalRevenue,
		"cogs":             totalCOGS,
		"gross_profit":     grossProfit,
		"total_refunds":    totalRefunds,
		"net_profit":       netProfit,
		"shipping_revenue": shippingRevenue,
		"total_discounts":  totalDiscounts,
		"margin":           func() float64 { if totalRevenue > 0 { return float64(netProfit) / float64(totalRevenue) * 100 }; return 0 }(),
	})
}

// ==================== CRM ====================

type CRMHandler struct{}

func (h *CRMHandler) CustomerList(c *gin.Context) {
	type CustomerSummary struct {
		ID          uint    `json:"id"`
		Name        string  `json:"name"`
		Email       string  `json:"email"`
		Phone       string  `json:"phone"`
		TotalOrders int     `json:"total_orders"`
		TotalSpent  int     `json:"total_spent"`
		AvgOrder    int     `json:"avg_order"`
		LastOrder   *string `json:"last_order"`
		JoinedAt    string  `json:"joined_at"`
	}

	var customers []CustomerSummary
	database.DB.Raw(`
		SELECT u.id, u.name, u.email, u.phone,
			   COUNT(o.id) as total_orders,
			   COALESCE(SUM(o.total), 0) as total_spent,
			   CASE WHEN COUNT(o.id) > 0 THEN COALESCE(SUM(o.total), 0) / COUNT(o.id) ELSE 0 END as avg_order,
			   MAX(o.created_at) as last_order,
			   u.created_at as joined_at
		FROM users u
		LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'canceled'
		WHERE u.role = 'customer'
		GROUP BY u.id, u.name, u.email, u.phone, u.created_at
		ORDER BY total_spent DESC
	`).Scan(&customers)

	utils.Success(c, customers)
}

func (h *CRMHandler) CustomerDetail(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := database.DB.Preload("Addresses").First(&user, id).Error; err != nil {
		utils.NotFound(c, "Customer not found")
		return
	}

	// Orders
	var orders []models.Order
	database.DB.Where("user_id = ?", id).Preload("Items").Preload("Items.Product").
		Order("created_at DESC").Limit(20).Find(&orders)

	// Reviews
	var reviews []models.Review
	database.DB.Where("user_id = ?", id).Preload("Product").Order("created_at DESC").Find(&reviews)

	// Stats
	var totalSpent int
	var totalOrders int64
	database.DB.Model(&models.Order{}).Where("user_id = ? AND status != ?", id, "canceled").Count(&totalOrders)
	database.DB.Model(&models.Order{}).Where("user_id = ? AND status != ?", id, "canceled").Select("COALESCE(SUM(total), 0)").Scan(&totalSpent)

	// Returns
	var returns []models.Return
	database.DB.Where("user_id = ?", id).Order("created_at DESC").Find(&returns)

	utils.Success(c, gin.H{
		"customer":     user,
		"orders":       orders,
		"reviews":      reviews,
		"returns":      returns,
		"total_orders": totalOrders,
		"total_spent":  totalSpent,
	})
}
