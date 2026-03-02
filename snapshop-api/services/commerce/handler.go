package commerce

import (
	"fmt"
	"math"
	"snapshop-api/database"
	"snapshop-api/models"
	"snapshop-api/utils"
	"time"

	"github.com/gin-gonic/gin"
)

type VoucherHandler struct{}
type ReviewHandler struct{}

// ====== VOUCHER ======

func (h *VoucherHandler) List(c *gin.Context) {
	var vouchers []models.Voucher
	database.DB.Where("is_active = ? AND valid_until > ?", true, time.Now()).Find(&vouchers)
	utils.Success(c, vouchers)
}

func (h *VoucherHandler) Validate(c *gin.Context) {
	var input struct {
		Code     string `json:"code" binding:"required"`
		Subtotal int    `json:"subtotal" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var voucher models.Voucher
	if err := database.DB.Where("code = ? AND is_active = ? AND valid_until > ?", input.Code, true, time.Now()).First(&voucher).Error; err != nil {
		utils.NotFound(c, "Voucher not found or expired")
		return
	}

	if input.Subtotal < voucher.MinPurchase {
		utils.BadRequest(c, fmt.Sprintf("Minimum purchase Rp%d required", voucher.MinPurchase))
		return
	}

	discount := 0
	switch voucher.DiscountType {
	case "percentage":
		discount = input.Subtotal * voucher.DiscountValue / 100
		if discount > voucher.MaxDiscount && voucher.MaxDiscount > 0 {
			discount = voucher.MaxDiscount
		}
	case "fixed":
		discount = voucher.DiscountValue
	case "shipping":
		discount = voucher.MaxDiscount
	}

	utils.Success(c, gin.H{
		"voucher":  voucher,
		"discount": discount,
		"total":    input.Subtotal - discount,
	})
}

func (h *VoucherHandler) Create(c *gin.Context) {
	var voucher models.Voucher
	if err := c.ShouldBindJSON(&voucher); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	database.DB.Create(&voucher)
	utils.Created(c, voucher)
}

// ====== REVIEW ======

func (h *ReviewHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input struct {
		ProductID uint   `json:"product_id" binding:"required"`
		Rating    int    `json:"rating" binding:"required,min=1,max=5"`
		Text      string `json:"text"`
		Photos    string `json:"photos"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	review := models.Review{
		UserID:    userID,
		ProductID: input.ProductID,
		Rating:    input.Rating,
		Text:      input.Text,
		Photos:    input.Photos,
	}
	database.DB.Create(&review)

	var avgRating float64
	var count int64
	database.DB.Model(&models.Review{}).Where("product_id = ?", input.ProductID).Count(&count)
	database.DB.Model(&models.Review{}).Where("product_id = ?", input.ProductID).Select("COALESCE(AVG(rating), 0)").Scan(&avgRating)
	database.DB.Model(&models.Product{}).Where("id = ?", input.ProductID).Updates(map[string]interface{}{
		"rating":       math.Round(avgRating*10) / 10,
		"review_count": count,
	})

	utils.Created(c, review)
}

func (h *ReviewHandler) MarkHelpful(c *gin.Context) {
	id := c.Param("id")
	database.DB.Model(&models.Review{}).Where("id = ?", id).UpdateColumn("helpful_count", database.DB.Raw("helpful_count + 1"))
	utils.Success(c, gin.H{"message": "Marked as helpful"})
}
