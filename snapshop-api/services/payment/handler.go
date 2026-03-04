package payment

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"snapshop-api/config"
	"snapshop-api/database"
	"snapshop-api/models"
	"snapshop-api/utils"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Config *config.Config
}

// ==================== Midtrans Snap Token ====================

type MidtransTransactionDetails struct {
	OrderID     string `json:"order_id"`
	GrossAmount int    `json:"gross_amount"`
}

type MidtransCustomerDetails struct {
	FirstName string `json:"first_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

type MidtransItemDetail struct {
	ID       string `json:"id"`
	Price    int    `json:"price"`
	Quantity int    `json:"quantity"`
	Name     string `json:"name"`
}

type MidtransSnapRequest struct {
	TransactionDetails MidtransTransactionDetails `json:"transaction_details"`
	CustomerDetails    MidtransCustomerDetails    `json:"customer_details"`
	ItemDetails        []MidtransItemDetail       `json:"item_details,omitempty"`
}

type MidtransSnapResponse struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

// CreateSnapToken creates a Midtrans Snap payment token for an order
func (h *Handler) CreateSnapToken(c *gin.Context) {
	userID := c.GetUint("user_id")
	orderID := c.Param("order_id")

	var order models.Order
	if err := database.DB.Where("id = ? AND user_id = ?", orderID, userID).
		Preload("Items").Preload("Items.Product").Preload("User").First(&order).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	if order.PaymentMethod != "midtrans" {
		utils.BadRequest(c, "This order does not use Midtrans payment")
		return
	}

	if order.Status != models.OrderWaitingPayment && order.Status != models.OrderPending {
		utils.BadRequest(c, "Order is not in payable state")
		return
	}

	// If token already exists and order is still waiting, return cached token
	if order.PaymentToken != "" && order.Status == models.OrderWaitingPayment {
		utils.Success(c, gin.H{
			"token":        order.PaymentToken,
			"redirect_url": order.PaymentURL,
			"client_key":   h.Config.MidtransClientKey,
		})
		return
	}

	// Build Snap request
	itemDetails := []MidtransItemDetail{}
	for _, item := range order.Items {
		name := item.Product.Name
		if len(name) > 50 {
			name = name[:50]
		}
		itemDetails = append(itemDetails, MidtransItemDetail{
			ID:       fmt.Sprintf("PROD-%d", item.ProductID),
			Price:    item.Price,
			Quantity: item.Quantity,
			Name:     name,
		})
	}

	// Add shipping as item
	if order.ShippingCost > 0 {
		itemDetails = append(itemDetails, MidtransItemDetail{
			ID:       "SHIPPING",
			Price:    order.ShippingCost,
			Quantity: 1,
			Name:     "Shipping - " + order.CourierName,
		})
	}

	// Add discount as negative item
	if order.Discount > 0 {
		itemDetails = append(itemDetails, MidtransItemDetail{
			ID:       "DISCOUNT",
			Price:    -order.Discount,
			Quantity: 1,
			Name:     "Discount",
		})
	}

	snapReq := MidtransSnapRequest{
		TransactionDetails: MidtransTransactionDetails{
			OrderID:     order.OrderNumber,
			GrossAmount: order.Total,
		},
		CustomerDetails: MidtransCustomerDetails{
			FirstName: order.User.Name,
			Email:     order.User.Email,
			Phone:     order.User.Phone,
		},
		ItemDetails: itemDetails,
	}

	// Call Midtrans Snap API
	baseURL := "https://app.sandbox.midtrans.com"
	if h.Config.MidtransIsProduction {
		baseURL = "https://app.midtrans.com"
	}

	body, _ := json.Marshal(snapReq)
	req, err := http.NewRequest("POST", baseURL+"/snap/v1/transactions", bytes.NewReader(body))
	if err != nil {
		utils.Error(c, 500, "Failed to create request")
		return
	}

	auth := base64.StdEncoding.EncodeToString([]byte(h.Config.MidtransServerKey + ":"))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		utils.Error(c, 500, "Failed to connect to Midtrans")
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		log.Printf("Midtrans error: %s", string(respBody))
		utils.Error(c, 500, "Midtrans returned error: "+string(respBody))
		return
	}

	var snapResp MidtransSnapResponse
	if err := json.Unmarshal(respBody, &snapResp); err != nil {
		utils.Error(c, 500, "Failed to parse Midtrans response")
		return
	}

	// Save token to order
	database.DB.Model(&order).Updates(map[string]interface{}{
		"payment_token": snapResp.Token,
		"payment_url":   snapResp.RedirectURL,
		"midtrans_id":   order.OrderNumber,
		"status":        models.OrderWaitingPayment,
	})

	utils.Success(c, gin.H{
		"token":        snapResp.Token,
		"redirect_url": snapResp.RedirectURL,
		"client_key":   h.Config.MidtransClientKey,
	})
}

// ==================== Midtrans Webhook ====================

type MidtransNotification struct {
	TransactionTime   string `json:"transaction_time"`
	TransactionStatus string `json:"transaction_status"`
	TransactionID     string `json:"transaction_id"`
	StatusMessage     string `json:"status_message"`
	StatusCode        string `json:"status_code"`
	SignatureKey      string `json:"signature_key"`
	PaymentType       string `json:"payment_type"`
	OrderID           string `json:"order_id"`
	MerchantID        string `json:"merchant_id"`
	GrossAmount       string `json:"gross_amount"`
	FraudStatus       string `json:"fraud_status"`
	Currency          string `json:"currency"`
}

// Webhook handles Midtrans payment notifications
func (h *Handler) Webhook(c *gin.Context) {
	var notif MidtransNotification
	if err := c.ShouldBindJSON(&notif); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification"})
		return
	}

	log.Printf("[Midtrans Webhook] order_id=%s status=%s payment_type=%s",
		notif.OrderID, notif.TransactionStatus, notif.PaymentType)

	// Find order by order number
	var order models.Order
	if err := database.DB.Where("order_number = ?", notif.OrderID).First(&order).Error; err != nil {
		log.Printf("[Midtrans Webhook] Order not found: %s", notif.OrderID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Update order based on transaction status
	updates := map[string]interface{}{
		"midtrans_id": notif.TransactionID,
	}

	switch notif.TransactionStatus {
	case "capture", "settlement":
		if notif.FraudStatus == "" || notif.FraudStatus == "accept" {
			now := time.Now()
			updates["status"] = models.OrderPaid
			updates["paid_at"] = &now
			log.Printf("[Midtrans Webhook] Order %s PAID", notif.OrderID)
		}
	case "pending":
		updates["status"] = models.OrderWaitingPayment
	case "deny", "cancel", "expire":
		updates["status"] = models.OrderCanceled
		// Restore stock for canceled orders
		go restoreOrderStock(order.ID)
		log.Printf("[Midtrans Webhook] Order %s CANCELED", notif.OrderID)
	}

	database.DB.Model(&order).Updates(updates)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// restoreOrderStock restores product stock when an order is canceled
func restoreOrderStock(orderID uint) {
	var items []models.OrderItem
	database.DB.Where("order_id = ?", orderID).Find(&items)

	for _, item := range items {
		database.DB.Model(&models.Product{}).Where("id = ?", item.ProductID).
			UpdateColumn("stock", database.DB.Raw("stock + ?", item.Quantity))
	}
}

// ==================== Payment Verification ====================

// VerifyPayment checks Midtrans transaction status directly and updates order
func (h *Handler) VerifyPayment(c *gin.Context) {
	userID := c.GetUint("user_id")
	orderID := c.Param("order_id")

	var order models.Order
	if err := database.DB.Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	if order.PaymentMethod != "midtrans" {
		utils.BadRequest(c, "This order does not use Midtrans payment")
		return
	}

	// Check Midtrans status API
	baseURL := "https://api.sandbox.midtrans.com"
	if h.Config.MidtransIsProduction {
		baseURL = "https://api.midtrans.com"
	}

	checkURL := fmt.Sprintf("%s/v2/%s/status", baseURL, order.OrderNumber)
	req, err := http.NewRequest("GET", checkURL, nil)
	if err != nil {
		utils.Error(c, 500, "Failed to create request")
		return
	}

	auth := base64.StdEncoding.EncodeToString([]byte(h.Config.MidtransServerKey + ":"))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		utils.Error(c, 500, "Failed to connect to Midtrans")
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var statusResp map[string]interface{}
	if err := json.Unmarshal(respBody, &statusResp); err != nil {
		utils.Error(c, 500, "Failed to parse Midtrans response")
		return
	}

	transactionStatus, _ := statusResp["transaction_status"].(string)
	fraudStatus, _ := statusResp["fraud_status"].(string)

	log.Printf("[Payment Verify] order=%s midtrans_status=%s fraud=%s",
		order.OrderNumber, transactionStatus, fraudStatus)

	// Update order based on Midtrans status
	updates := map[string]interface{}{}
	newStatus := ""

	switch transactionStatus {
	case "capture", "settlement":
		if fraudStatus == "" || fraudStatus == "accept" {
			now := time.Now()
			updates["status"] = models.OrderPaid
			updates["paid_at"] = &now
			newStatus = string(models.OrderPaid)
			log.Printf("[Payment Verify] Order %s marked as PAID", order.OrderNumber)
		}
	case "pending":
		newStatus = string(models.OrderWaitingPayment)
	case "deny", "cancel", "expire":
		updates["status"] = models.OrderCanceled
		newStatus = string(models.OrderCanceled)
		go restoreOrderStock(order.ID)
	}

	if len(updates) > 0 {
		database.DB.Model(&order).Updates(updates)
	}

	finalStatus := newStatus
	if finalStatus == "" {
		finalStatus = string(order.Status)
	}

	utils.Success(c, gin.H{
		"order_id":           order.ID,
		"order_number":       order.OrderNumber,
		"status":             finalStatus,
		"transaction_status": transactionStatus,
		"payment_method":     order.PaymentMethod,
	})
}

// ==================== Payment Status ====================

// GetPaymentStatus checks the payment status of an order
func (h *Handler) GetPaymentStatus(c *gin.Context) {
	userID := c.GetUint("user_id")
	orderID := c.Param("order_id")

	var order models.Order
	if err := database.DB.Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	utils.Success(c, gin.H{
		"order_id":       order.ID,
		"order_number":   order.OrderNumber,
		"status":         order.Status,
		"payment_method": order.PaymentMethod,
		"paid_at":        order.PaidAt,
		"total":          order.Total,
	})
}

// GetClientKey returns the Midtrans client key for the frontend
func (h *Handler) GetClientKey(c *gin.Context) {
	isProduction := h.Config.MidtransIsProduction
	utils.Success(c, gin.H{
		"client_key":    h.Config.MidtransClientKey,
		"is_production": isProduction,
	})
}
