package order

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

type Handler struct{}

type CheckoutInput struct {
	AddressID      uint   `json:"address_id" binding:"required"`
	CourierName    string `json:"courier_name" binding:"required"`
	CourierService string `json:"courier_service"` // REG, YES, OKE, etc.
	ShippingCost   int    `json:"shipping_cost"`
	VoucherCode    string `json:"voucher_code"`
	StoreID        *uint  `json:"store_id"`
	Notes          string `json:"notes"`
	PaymentMethod  string `json:"payment_method"` // midtrans, cod
}

func (h *Handler) Checkout(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input CheckoutInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var cartItems []models.CartItem
	database.DB.Where("user_id = ?", userID).Preload("Product").Find(&cartItems)
	if len(cartItems) == 0 {
		utils.BadRequest(c, "Cart is empty")
		return
	}

	var subtotal int
	for _, item := range cartItems {
		subtotal += item.Product.Price * item.Quantity
	}

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
				database.DB.Model(&voucher).Update("used_count", voucher.UsedCount+1)
			}
		}
	}

	total := subtotal + input.ShippingCost - discount
	if total < 0 { total = 0 }

	orderNumber := fmt.Sprintf("ORD-%s-%04d", time.Now().Format("20060102"), time.Now().UnixMilli()%10000)

	// Determine payment method and initial status
	paymentMethod := input.PaymentMethod
	if paymentMethod == "" {
		paymentMethod = "midtrans"
	}

	initialStatus := models.OrderWaitingPayment
	if paymentMethod == "cod" {
		initialStatus = models.OrderConfirmed
	}

	order := models.Order{
		UserID:         userID,
		OrderNumber:    orderNumber,
		Status:         initialStatus,
		AddressID:      input.AddressID,
		Subtotal:       subtotal,
		ShippingCost:   input.ShippingCost,
		Discount:       discount,
		Total:          total,
		CourierName:    input.CourierName,
		CourierService: input.CourierService,
		VoucherCode:    input.VoucherCode,
		StoreID:        input.StoreID,
		Notes:          input.Notes,
		PaymentMethod:  paymentMethod,
	}
	database.DB.Create(&order)

	for _, cartItem := range cartItems {
		orderItem := models.OrderItem{
			OrderID:     order.ID,
			ProductID:   cartItem.ProductID,
			VariantInfo: cartItem.VariantInfo,
			Quantity:    cartItem.Quantity,
			Price:       cartItem.Product.Price,
		}
		database.DB.Create(&orderItem)

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

		database.DB.Model(&models.Product{}).Where("id = ?", cartItem.ProductID).
			UpdateColumn("stock", database.DB.Raw("stock - ?", cartItem.Quantity))
	}

	database.DB.Where("user_id = ?", userID).Delete(&models.CartItem{})

	database.DB.Preload("Items").Preload("Items.Product").Preload("Address").First(&order, order.ID)

	// Return response with payment info flag
	response := gin.H{
		"order":          order,
		"payment_method": paymentMethod,
	}

	if paymentMethod == "midtrans" {
		response["requires_payment"] = true
		response["message"] = "Order created. Use /api/v1/payment/{order_id}/token to get payment token."
	} else {
		response["requires_payment"] = false
		response["message"] = "Order confirmed with Cash on Delivery."
	}

	utils.Created(c, response)
}

func (h *Handler) List(c *gin.Context) {
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

// ListAll returns all orders for admin dashboard (no user_id filter)
func (h *Handler) ListAll(c *gin.Context) {
	var orders []models.Order
	var total int64
	query := database.DB.Model(&models.Order{})

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("LOWER(order_number) LIKE LOWER(?)", "%"+search+"%")
	}

	query.Count(&total)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	// Re-build find query with same filters
	findQuery := database.DB.Preload("Items").Preload("Items.Product").Preload("User").Preload("Address")
	if status := c.Query("status"); status != "" {
		findQuery = findQuery.Where("status = ?", status)
	}
	if search := c.Query("search"); search != "" {
		findQuery = findQuery.Where("LOWER(order_number) LIKE LOWER(?)", "%"+search+"%")
	}
	findQuery.Order("created_at DESC").Offset(offset).Limit(limit).Find(&orders)

	utils.SuccessWithMeta(c, orders, &utils.Meta{
		Page: page, Limit: limit, Total: total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	})
}

func (h *Handler) GetByID(c *gin.Context) {
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

func (h *Handler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	validStatuses := map[string]bool{
		"pending": true, "waiting_payment": true, "paid": true,
		"confirmed": true, "preparing": true,
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
