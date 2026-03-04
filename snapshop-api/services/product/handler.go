package product

import (
	"math"
	"snapshop-api/database"
	"snapshop-api/models"
	"snapshop-api/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct{}

func (h *Handler) List(c *gin.Context) {
	var products []models.Product
	var total int64
	query := database.DB.Model(&models.Product{})

	if cat := c.Query("category"); cat != "" {
		query = query.Where("category_id = ?", cat)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("LOWER(name) LIKE LOWER(?)", "%"+search+"%")
	}
	if minPrice := c.Query("min_price"); minPrice != "" {
		query = query.Where("price >= ?", minPrice)
	}
	if maxPrice := c.Query("max_price"); maxPrice != "" {
		query = query.Where("price <= ?", maxPrice)
	}
	if sellerID := c.Query("seller_id"); sellerID != "" {
		query = query.Where("seller_id = ?", sellerID)
	}

	query.Count(&total)

	switch c.Query("sort") {
	case "price_asc":
		query = query.Order("price ASC")
	case "price_desc":
		query = query.Order("price DESC")
	case "newest":
		query = query.Order("created_at DESC")
	case "rating":
		query = query.Order("rating DESC")
	default:
		query = query.Order("id ASC")
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 20 }
	offset := (page - 1) * limit

	query.Preload("Category").Preload("Variants").
		Offset(offset).Limit(limit).Find(&products)

	utils.SuccessWithMeta(c, products, &utils.Meta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	})
}

func (h *Handler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := database.DB.Preload("Category").Preload("Variants").Preload("Reviews").First(&product, id).Error; err != nil {
		utils.NotFound(c, "Product not found")
		return
	}
	utils.Success(c, product)
}

func (h *Handler) GetReviews(c *gin.Context) {
	productID := c.Param("id")
	var reviews []models.Review
	var total int64
	query := database.DB.Where("product_id = ?", productID)

	if rating := c.Query("rating"); rating != "" {
		query = query.Where("rating = ?", rating)
	}
	query.Model(&models.Review{}).Count(&total)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query.Preload("User").Order("created_at DESC").Offset(offset).Limit(limit).Find(&reviews)

	utils.SuccessWithMeta(c, reviews, &utils.Meta{
		Page: page, Limit: limit, Total: total,
		TotalPages: int(math.Ceil(float64(total) / float64(limit))),
	})
}

func (h *Handler) ListCategories(c *gin.Context) {
	var categories []models.Category
	database.DB.Find(&categories)
	utils.Success(c, categories)
}

func (h *Handler) Create(c *gin.Context) {
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	database.DB.Create(&product)
	utils.Created(c, product)
}

func (h *Handler) Update(c *gin.Context) {
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

func (h *Handler) Delete(c *gin.Context) {
	id := c.Param("id")
	result := database.DB.Delete(&models.Product{}, id)
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Product not found")
		return
	}
	utils.Success(c, gin.H{"message": "Product deleted"})
}
