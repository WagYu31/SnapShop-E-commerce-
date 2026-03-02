package admin

import (
	"fmt"
	"math"
	"snapshop-api/database"
	"snapshop-api/models"
	"snapshop-api/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct{}
type SuperAdminHandler struct{}

func (h *Handler) Dashboard(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("user_role")

	var totalOrders, totalProducts, totalUsers int64
	var totalRevenue int

	switch role {
	case "seller":
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
		database.DB.Model(&models.Order{}).Count(&totalOrders)
		database.DB.Model(&models.Product{}).Count(&totalProducts)
		database.DB.Model(&models.User{}).Where("role = ?", "customer").Count(&totalUsers)
		database.DB.Model(&models.Order{}).Where("status != ?", "canceled").Select("COALESCE(SUM(total), 0)").Scan(&totalRevenue)
	}

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

	var lowStock []models.Product
	if role == "seller" {
		database.DB.Where("stock <= reorder_point AND seller_id = ?", userID).Find(&lowStock)
	} else {
		database.DB.Where("stock <= reorder_point").Find(&lowStock)
	}

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

func (h *Handler) ListUsers(c *gin.Context) {
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

// ====== SUPER ADMIN ======

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
