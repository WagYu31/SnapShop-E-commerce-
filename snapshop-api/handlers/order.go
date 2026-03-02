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

type OrderHandler struct{}

type CheckoutInput struct {
	AddressID    uint   `json:"address_id" binding:"required"`
	CourierName  string `json:"courier_name" binding:"required"`
	ShippingCost int    `json:"shipping_cost"`
	VoucherCode  string `json:"voucher_code"`
	StoreID      *uint  `json:"store_id"` // for store pickup
	Notes        string `json:"notes"`
}

func (h *OrderHandler) Checkout(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input CheckoutInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// Get cart items
	var cartItems []models.CartItem
	database.DB.Where("user_id = ?", userID).Preload("Product").Find(&cartItems)
	if len(cartItems) == 0 {
		utils.BadRequest(c, "Cart is empty")
		return
	}

	// Calculate subtotal
	var subtotal int
	for _, item := range cartItems {
		subtotal += item.Product.Price * item.Quantity
	}

	// Apply voucher
	discount := 0
	if input.VoucherCode != "" {
		var voucher models.Voucher
		if database.DB.Where("code = ? AND is_active = ? AND valid_until > ?", input.VoucherCode, true, time.Now()).First(&voucher).Error == nil {
			if subtotal >= voucher.MinPurchase {
				switch voucher.DiscountType {
				case "percentage":
					discount = subtotal * voucher.DiscountValue / 100
					if discount > voucher.MaxDiscount && voucher.MaxDiscount > 0 {
						discount = voucher.MaxDiscount
					}
				case "fixed":
					discount = voucher.DiscountValue
				case "shipping":
					if input.ShippingCost > 0 {
						discount = input.ShippingCost
						if discount > voucher.MaxDiscount {
							discount = voucher.MaxDiscount
						}
					}
				}
				// Increment usage
				database.DB.Model(&voucher).Update("used_count", voucher.UsedCount+1)
			}
		}
	}

	total := subtotal + input.ShippingCost - discount
	if total < 0 { total = 0 }

	// Generate order number
	orderNumber := fmt.Sprintf("ORD-%s-%04d", time.Now().Format("20060102"), time.Now().UnixMilli()%10000)

	// Create order
	order := models.Order{
		UserID:       userID,
		OrderNumber:  orderNumber,
		Status:       models.OrderPending,
		AddressID:    input.AddressID,
		Subtotal:     subtotal,
		ShippingCost: input.ShippingCost,
		Discount:     discount,
		Total:        total,
		CourierName:  input.CourierName,
		VoucherCode:  input.VoucherCode,
		StoreID:      input.StoreID,
		Notes:        input.Notes,
	}
	database.DB.Create(&order)

	// Create order items + FIFO stock deduction
	for _, cartItem := range cartItems {
		orderItem := models.OrderItem{
			OrderID:     order.ID,
			ProductID:   cartItem.ProductID,
			VariantInfo: cartItem.VariantInfo,
			Quantity:    cartItem.Quantity,
			Price:       cartItem.Product.Price,
		}
		database.DB.Create(&orderItem)

		// Deduct stock (FIFO: oldest batch first)
		remaining := cartItem.Quantity
		var batches []models.StockBatch
		database.DB.Where("product_id = ? AND remaining > 0", cartItem.ProductID).
			Order("received_at ASC").Find(&batches)

		for i := range batches {
			if remaining <= 0 { break }
			deduct := remaining
			if deduct > batches[i].Remaining {
				deduct = batches[i].Remaining
			}
			batches[i].Remaining -= deduct
			remaining -= deduct
			database.DB.Save(&batches[i])
		}

		// Update product total stock
		database.DB.Model(&models.Product{}).Where("id = ?", cartItem.ProductID).
			UpdateColumn("stock", database.DB.Raw("stock - ?", cartItem.Quantity))
	}

	// Clear cart
	database.DB.Where("user_id = ?", userID).Delete(&models.CartItem{})

	database.DB.Preload("Items").Preload("Items.Product").Preload("Address").First(&order, order.ID)
	utils.Created(c, order)
}

func (h *OrderHandler) List(c *gin.Context) {
	userID := c.GetUint("user_id")
	var orders []models.Order
	var total int64
	query := database.DB.Where("user_id = ?", userID)

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	query.Model(&models.Order{}).Count(&total)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query.Preload("Items").Preload("Items.Product").
		Order("created_at DESC").Offset(offset).Limit(limit).Find(&orders)

	utils.SuccessWithMeta(c, orders, &utils.Meta{
		Page: page, Limit: limit, Total: total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	})
}

func (h *OrderHandler) GetByID(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")
	var order models.Order
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).
		Preload("Items").Preload("Items.Product").Preload("Address").First(&order).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}
	utils.Success(c, order)
}

// ====== VOUCHER ======

type VoucherHandler struct{}

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

// ====== REVIEW ======

type ReviewHandler struct{}

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

	// Update product rating
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
