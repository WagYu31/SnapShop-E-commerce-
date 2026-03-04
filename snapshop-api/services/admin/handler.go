package admin

import (
	"fmt"
	"math"
	"snapshop-api/database"
	"snapshop-api/models"
	"snapshop-api/utils"
	"strconv"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
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
	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	query.Count(&total)
	query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&users)

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

func (h *SuperAdminHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetUint("user_id")
	targetID, _ := strconv.ParseUint(id, 10, 32)

	if uint(targetID) == userID {
		utils.BadRequest(c, "Tidak bisa menghapus akun sendiri")
		return
	}

	result := database.DB.Delete(&models.User{}, id)
	if result.RowsAffected == 0 {
		utils.NotFound(c, "User not found")
		return
	}

	database.DB.Create(&models.AuditLog{
		UserID:   userID,
		Action:   "delete_user",
		Entity:   "user",
		EntityID: uint(targetID),
		Details:  "User deleted",
		IP:       c.ClientIP(),
	})

	utils.Success(c, gin.H{"message": "User berhasil dihapus"})
}

func (h *SuperAdminHandler) AuditLogs(c *gin.Context) {
	var logs []models.AuditLog
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	query := database.DB.Model(&models.AuditLog{})
	if action := c.Query("action"); action != "" {
		query = query.Where("action = ?", action)
	}
	query.Count(&total)
	query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs)

	utils.SuccessWithMeta(c, logs, &utils.Meta{
		Page: page, Limit: limit, Total: total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	})
}

func (h *SuperAdminHandler) AuditStats(c *gin.Context) {
	var totalLogs int64
	database.DB.Model(&models.AuditLog{}).Count(&totalLogs)

	var todayLogs int64
	database.DB.Model(&models.AuditLog{}).Where("DATE(created_at) = DATE('now')").Count(&todayLogs)

	var weekLogs int64
	database.DB.Model(&models.AuditLog{}).Where("created_at >= datetime('now', '-7 days')").Count(&weekLogs)

	type ActionCount struct {
		Action string `json:"action"`
		Count  int64  `json:"count"`
	}
	var actionCounts []ActionCount
	database.DB.Model(&models.AuditLog{}).Select("action, count(*) as count").Group("action").Order("count DESC").Scan(&actionCounts)

	var totalUsers int64
	database.DB.Model(&models.User{}).Count(&totalUsers)

	var totalAdmins int64
	database.DB.Model(&models.User{}).Where("role IN ?", []string{"admin", "superadmin"}).Count(&totalAdmins)

	var pendingPwRequests int64
	database.DB.Model(&models.PasswordResetRequest{}).Where("status = ?", "pending").Count(&pendingPwRequests)

	utils.Success(c, gin.H{
		"total_logs":           totalLogs,
		"today_logs":           todayLogs,
		"week_logs":            weekLogs,
		"action_counts":        actionCounts,
		"total_users":          totalUsers,
		"total_admins":         totalAdmins,
		"pending_pw_requests":  pendingPwRequests,
	})
}

// ====== PASSWORD MANAGEMENT ======

func (h *SuperAdminHandler) ResetUserPassword(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var targetUser models.User
	if err := database.DB.First(&targetUser, id).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	// Only allow reset for staff roles (not customer, not superadmin)
	staffRoles := map[string]bool{"seller": true, "warehouse": true, "store": true, "admin": true}
	if !staffRoles[string(targetUser.Role)] {
		utils.BadRequest(c, "Hanya bisa reset password untuk user staff (warehouse/seller/store/admin)")
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	database.DB.Model(&targetUser).Update("password_hash", string(hash))

	userID := c.GetUint("user_id")
	targetID, _ := strconv.ParseUint(id, 10, 32)
	database.DB.Create(&models.AuditLog{
		UserID:   userID,
		Action:   "reset_password",
		Entity:   "user",
		EntityID: uint(targetID),
		Details:  fmt.Sprintf("Password reset for %s (%s)", targetUser.Name, targetUser.Email),
		IP:       c.ClientIP(),
	})

	utils.Success(c, gin.H{"message": fmt.Sprintf("Password untuk %s berhasil direset", targetUser.Name)})
}

func (h *SuperAdminHandler) ListPasswordRequests(c *gin.Context) {
	var requests []models.PasswordResetRequest
	status := c.DefaultQuery("status", "pending")
	database.DB.Preload("User").Where("status = ?", status).Order("created_at DESC").Find(&requests)
	utils.Success(c, requests)
}

func (h *SuperAdminHandler) ApprovePasswordRequest(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		NewPassword string `json:"new_password" binding:"required,min=6"`
		AdminNotes  string `json:"admin_notes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var req models.PasswordResetRequest
	if err := database.DB.Preload("User").First(&req, id).Error; err != nil {
		utils.NotFound(c, "Request not found")
		return
	}
	if req.Status != "pending" {
		utils.BadRequest(c, "Request sudah diproses")
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	database.DB.Model(&models.User{}).Where("id = ?", req.UserID).Update("password_hash", string(hash))

	userID := c.GetUint("user_id")
	database.DB.Model(&req).Updates(map[string]interface{}{
		"status":      "approved",
		"admin_notes": input.AdminNotes,
		"resolved_by": userID,
	})

	database.DB.Create(&models.AuditLog{
		UserID:   userID,
		Action:   "approve_password_request",
		Entity:   "password_request",
		EntityID: req.ID,
		Details:  fmt.Sprintf("Approved password reset for user %d (%s)", req.UserID, req.User.Name),
		IP:       c.ClientIP(),
	})

	utils.Success(c, gin.H{"message": fmt.Sprintf("Password %s berhasil direset", req.User.Name)})
}

func (h *SuperAdminHandler) RejectPasswordRequest(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		AdminNotes string `json:"admin_notes"`
	}
	c.ShouldBindJSON(&input)

	userID := c.GetUint("user_id")
	result := database.DB.Model(&models.PasswordResetRequest{}).Where("id = ? AND status = ?", id, "pending").Updates(map[string]interface{}{
		"status":      "rejected",
		"admin_notes": input.AdminNotes,
		"resolved_by": userID,
	})
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Request tidak ditemukan atau sudah diproses")
		return
	}

	utils.Success(c, gin.H{"message": "Request ditolak"})
}

// Staff request password reset (non-customer)
func (h *Handler) RequestPasswordReset(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("user_role")

	if role == "customer" || role == "superadmin" {
		utils.BadRequest(c, "Fitur ini hanya untuk staff (warehouse/seller/store/admin)")
		return
	}

	var input struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&input)
	if input.Reason == "" {
		input.Reason = "change"
	}

	// Check if there's already a pending request
	var existing models.PasswordResetRequest
	if database.DB.Where("user_id = ? AND status = ?", userID, "pending").First(&existing).Error == nil {
		utils.BadRequest(c, "Kamu sudah memiliki request yang sedang pending")
		return
	}

	req := models.PasswordResetRequest{
		UserID: userID,
		Reason: input.Reason,
		Status: "pending",
	}
	database.DB.Create(&req)

	utils.Created(c, gin.H{"message": "Request password reset berhasil dikirim. Menunggu persetujuan Super Admin."})
}

