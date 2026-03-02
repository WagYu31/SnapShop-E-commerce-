package handlers

import (
	"snapshop-api/database"
	"snapshop-api/models"
	"snapshop-api/utils"

	"github.com/gin-gonic/gin"
)

type CartHandler struct{}

type CartInput struct {
	ProductID   uint   `json:"product_id" binding:"required"`
	VariantInfo string `json:"variant_info"`
	Quantity    int    `json:"quantity" binding:"required,min=1"`
}

func (h *CartHandler) List(c *gin.Context) {
	userID := c.GetUint("user_id")
	var items []models.CartItem
	database.DB.Where("user_id = ?", userID).Preload("Product").Preload("Product.Category").Find(&items)

	// Calculate totals
	var subtotal int
	for _, item := range items {
		subtotal += item.Product.Price * item.Quantity
	}

	utils.Success(c, gin.H{
		"items":    items,
		"count":    len(items),
		"subtotal": subtotal,
	})
}

func (h *CartHandler) Add(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input CartInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// Check if product exists
	var product models.Product
	if err := database.DB.First(&product, input.ProductID).Error; err != nil {
		utils.NotFound(c, "Product not found")
		return
	}

	// Upsert: if already in cart, increase quantity
	var existing models.CartItem
	if database.DB.Where("user_id = ? AND product_id = ?", userID, input.ProductID).First(&existing).Error == nil {
		existing.Quantity += input.Quantity
		database.DB.Save(&existing)
		database.DB.Preload("Product").First(&existing, existing.ID)
		utils.Success(c, existing)
		return
	}

	item := models.CartItem{
		UserID:      userID,
		ProductID:   input.ProductID,
		VariantInfo: input.VariantInfo,
		Quantity:    input.Quantity,
	}
	database.DB.Create(&item)
	database.DB.Preload("Product").First(&item, item.ID)
	utils.Created(c, item)
}

func (h *CartHandler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")
	var input struct {
		Quantity int `json:"quantity" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	result := database.DB.Model(&models.CartItem{}).Where("id = ? AND user_id = ?", id, userID).Update("quantity", input.Quantity)
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Cart item not found")
		return
	}
	utils.Success(c, gin.H{"message": "Cart updated"})
}

func (h *CartHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")
	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.CartItem{})
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Cart item not found")
		return
	}
	utils.Success(c, gin.H{"message": "Removed from cart"})
}

// ====== WISHLIST ======

type WishlistHandler struct{}

func (h *WishlistHandler) List(c *gin.Context) {
	userID := c.GetUint("user_id")
	var items []models.WishlistItem
	database.DB.Where("user_id = ?", userID).Preload("Product").Preload("Product.Category").Find(&items)
	utils.Success(c, items)
}

func (h *WishlistHandler) Add(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input struct {
		ProductID uint `json:"product_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// Check duplicate
	var existing models.WishlistItem
	if database.DB.Where("user_id = ? AND product_id = ?", userID, input.ProductID).First(&existing).Error == nil {
		utils.BadRequest(c, "Already in wishlist")
		return
	}

	item := models.WishlistItem{UserID: userID, ProductID: input.ProductID}
	database.DB.Create(&item)
	database.DB.Preload("Product").First(&item, item.ID)
	utils.Created(c, item)
}

func (h *WishlistHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")
	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.WishlistItem{})
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Wishlist item not found")
		return
	}
	utils.Success(c, gin.H{"message": "Removed from wishlist"})
}

func (h *WishlistHandler) MoveToCart(c *gin.Context) {
	userID := c.GetUint("user_id")
	var items []models.WishlistItem
	database.DB.Where("user_id = ?", userID).Find(&items)

	for _, item := range items {
		cartItem := models.CartItem{UserID: userID, ProductID: item.ProductID, Quantity: 1}
		database.DB.Where("user_id = ? AND product_id = ?", userID, item.ProductID).FirstOrCreate(&cartItem)
	}

	// Clear wishlist
	database.DB.Where("user_id = ?", userID).Delete(&models.WishlistItem{})
	utils.Success(c, gin.H{"message": "All items moved to cart", "count": len(items)})
}
