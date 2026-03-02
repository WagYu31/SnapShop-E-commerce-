package user

import (
	"snapshop-api/database"
	"snapshop-api/models"
	"snapshop-api/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct{}
type AddressHandler struct{}

func (h *Handler) GetProfile(c *gin.Context) {
	user := c.MustGet("user").(models.User)
	database.DB.Preload("Addresses").First(&user, user.ID)
	utils.Success(c, user)
}

type UpdateProfileInput struct {
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
}

func (h *Handler) UpdateProfile(c *gin.Context) {
	user := c.MustGet("user").(models.User)
	var input UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if input.Name != "" { updates["name"] = input.Name }
	if input.Phone != "" { updates["phone"] = input.Phone }
	if input.Bio != "" { updates["bio"] = input.Bio }
	if input.AvatarURL != "" { updates["avatar_url"] = input.AvatarURL }

	database.DB.Model(&user).Updates(updates)
	database.DB.First(&user, user.ID)
	utils.Success(c, user)
}

type ChangePasswordInput struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

func (h *Handler) ChangePassword(c *gin.Context) {
	user := c.MustGet("user").(models.User)
	var input ChangePasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.OldPassword)); err != nil {
		utils.BadRequest(c, "Old password is incorrect")
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	database.DB.Model(&user).Update("password_hash", string(hash))
	utils.Success(c, gin.H{"message": "Password changed successfully"})
}

// ====== ADDRESS ======

func (h *AddressHandler) List(c *gin.Context) {
	userID := c.GetUint("user_id")
	var addresses []models.Address
	database.DB.Where("user_id = ?", userID).Order("is_default DESC, id ASC").Find(&addresses)
	utils.Success(c, addresses)
}

func (h *AddressHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")
	var addr models.Address
	if err := c.ShouldBindJSON(&addr); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	addr.UserID = userID

	var count int64
	database.DB.Model(&models.Address{}).Where("user_id = ?", userID).Count(&count)
	if count == 0 {
		addr.IsDefault = true
	}

	database.DB.Create(&addr)
	utils.Created(c, addr)
}

func (h *AddressHandler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")
	var addr models.Address
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&addr).Error; err != nil {
		utils.NotFound(c, "Address not found")
		return
	}
	if err := c.ShouldBindJSON(&addr); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	addr.UserID = userID
	database.DB.Save(&addr)
	utils.Success(c, addr)
}

func (h *AddressHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")
	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Address{})
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Address not found")
		return
	}
	utils.Success(c, gin.H{"message": "Address deleted"})
}

func (h *AddressHandler) SetDefault(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	database.DB.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false)
	database.DB.Model(&models.Address{}).Where("id = ? AND user_id = ?", id, userID).Update("is_default", true)
	utils.Success(c, gin.H{"message": "Default address updated"})
}
