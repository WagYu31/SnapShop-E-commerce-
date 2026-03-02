package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct{}

func (h *UploadHandler) UploadImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(400, gin.H{"success": false, "message": "No image file provided"})
		return
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true, ".avif": true, ".svg": true}
	if !allowed[ext] {
		c.JSON(400, gin.H{"success": false, "message": "Invalid file type. Allowed: jpg, jpeg, png, webp, gif"})
		return
	}

	// Max 50MB (frontend auto-compresses, this is safety net)
	if file.Size > 50*1024*1024 {
		c.JSON(400, gin.H{"success": false, "message": "File too large. Maximum 50MB"})
		return
	}

	// Create uploads directory
	uploadDir := "uploads/products"
	os.MkdirAll(uploadDir, 0755)

	// Generate unique filename
	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixMilli(), strings.ReplaceAll(file.Filename[:min(len(file.Filename)-len(ext), 20)], " ", "_"), ext)
	savePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to save file"})
		return
	}

	// Return URL path
	imageURL := fmt.Sprintf("/uploads/products/%s", filename)
	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"url":      imageURL,
			"filename": filename,
		},
	})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
