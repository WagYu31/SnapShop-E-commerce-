package shipping

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"snapshop-api/config"
	"snapshop-api/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Config *config.Config
}

// ==================== Shipping Cost ====================

type ShippingCostInput struct {
	Destination string `json:"destination" binding:"required"` // city name
	Weight      int    `json:"weight" binding:"required"`      // kg
	Courier     string `json:"courier" binding:"required"`     // jne, pos, sicepat, etc.
}

// Binderbyte API response structure
type BinderbyteCostResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Data    []struct {
		Name  string `json:"name"`
		Costs []struct {
			Service     string `json:"service"`
			Description string `json:"description"`
			Cost        int    `json:"cost"`
			Etd         string `json:"etd"`
		} `json:"costs"`
	} `json:"data"`
}

type ServiceOption struct {
	Courier     string `json:"courier"`
	CourierName string `json:"courier_name"`
	Service     string `json:"service"`
	Description string `json:"description"`
	Cost        int    `json:"cost"`
	Etd         string `json:"etd"`
}

// GetShippingCost calculates shipping cost — tries Binderbyte first, falls back to built-in rates
func (h *Handler) GetShippingCost(c *gin.Context) {
	var input ShippingCostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	courier := strings.ToLower(input.Courier)
	weight := input.Weight
	if weight < 1 {
		weight = 1
	}

	// Try Binderbyte API first
	if h.Config.BinderbyteAPIKey != "" {
		services, err := h.fetchBinderbyte(courier, input.Destination, weight)
		if err == nil && len(services) > 0 {
			utils.Success(c, services)
			return
		}
		log.Printf("[Shipping] Binderbyte failed: %v, using fallback rates", err)
	}

	// Fallback: built-in rates
	services := generateFallbackRates(courier, weight)
	utils.Success(c, services)
}

// fetchBinderbyte calls the Binderbyte API
func (h *Handler) fetchBinderbyte(courier, destination string, weight int) ([]ServiceOption, error) {
	apiURL := fmt.Sprintf(
		"https://api.binderbyte.com/v1/cost?api_key=%s&courier=%s&origin=%s&destination=%s&weight=%d",
		h.Config.BinderbyteAPIKey,
		courier,
		strings.ReplaceAll(h.Config.BinderbyteOrigin, " ", "+"),
		strings.ReplaceAll(destination, " ", "+"),
		weight,
	)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result BinderbyteCostResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	if result.Status != 200 {
		return nil, fmt.Errorf("API error: %s", result.Message)
	}

	services := []ServiceOption{}
	for _, courierData := range result.Data {
		for _, cost := range courierData.Costs {
			services = append(services, ServiceOption{
				Courier:     courier,
				CourierName: courierData.Name,
				Service:     cost.Service,
				Description: cost.Description,
				Cost:        cost.Cost,
				Etd:         cost.Etd,
			})
		}
	}
	return services, nil
}

// generateFallbackRates returns built-in shipping rates when API is unavailable
func generateFallbackRates(courier string, weight int) []ServiceOption {
	type rateTemplate struct {
		CourierName string
		Services    []struct {
			Service     string
			Description string
			BaseCost    int
			Etd         string
		}
	}

	rates := map[string]rateTemplate{
		"jne": {
			CourierName: "JNE Express",
			Services: []struct {
				Service     string
				Description string
				BaseCost    int
				Etd         string
			}{
				{"REG", "Reguler", 15000, "2-3 hari"},
				{"YES", "Yakin Esok Sampai", 25000, "1 hari"},
				{"OKE", "Ongkos Kirim Ekonomis", 10000, "3-5 hari"},
			},
		},
		"tiki": {
			CourierName: "TIKI",
			Services: []struct {
				Service     string
				Description string
				BaseCost    int
				Etd         string
			}{
				{"REG", "Reguler", 14000, "2-4 hari"},
				{"ECO", "Ekonomi", 9000, "4-6 hari"},
				{"ONS", "Over Night Service", 28000, "1 hari"},
			},
		},
		"pos": {
			CourierName: "POS Indonesia",
			Services: []struct {
				Service     string
				Description string
				BaseCost    int
				Etd         string
			}{
				{"Paket Kilat Khusus", "Kilat Khusus", 18000, "2-4 hari"},
				{"Express Next Day", "Express", 30000, "1 hari"},
				{"Pos Reguler", "Reguler", 8000, "5-7 hari"},
			},
		},
		"sicepat": {
			CourierName: "SiCepat",
			Services: []struct {
				Service     string
				Description string
				BaseCost    int
				Etd         string
			}{
				{"REG", "Reguler", 13000, "2-3 hari"},
				{"BEST", "Besok Sampai Tujuan", 22000, "1 hari"},
				{"CARGO", "Kargo", 7000, "5-7 hari"},
			},
		},
		"anteraja": {
			CourierName: "AnterAja",
			Services: []struct {
				Service     string
				Description string
				BaseCost    int
				Etd         string
			}{
				{"Reguler", "Pengiriman Reguler", 12000, "2-3 hari"},
				{"Next Day", "Sampai Besok", 23000, "1 hari"},
				{"Same Day", "Sampai Hari Ini", 35000, "6-8 jam"},
			},
		},
		"lion": {
			CourierName: "Lion Parcel",
			Services: []struct {
				Service     string
				Description string
				BaseCost    int
				Etd         string
			}{
				{"REGPACK", "Reguler", 14000, "2-3 hari"},
				{"ONEPACK", "Next Day", 26000, "1 hari"},
				{"JAGOPACK", "Ekonomi", 8000, "4-6 hari"},
			},
		},
	}

	rate, ok := rates[courier]
	if !ok {
		// Default rates for unknown couriers
		rate = rates["jne"]
		rate.CourierName = strings.ToUpper(courier)
	}

	services := []ServiceOption{}
	for _, svc := range rate.Services {
		cost := svc.BaseCost * weight
		services = append(services, ServiceOption{
			Courier:     courier,
			CourierName: rate.CourierName,
			Service:     svc.Service,
			Description: svc.Description,
			Cost:        cost,
			Etd:         svc.Etd,
		})
	}
	return services
}

// ==================== Available Couriers ====================

// GetCouriers returns the list of available courier services
func (h *Handler) GetCouriers(c *gin.Context) {
	couriers := []map[string]string{
		{"id": "jne", "name": "JNE Express"},
		{"id": "tiki", "name": "TIKI"},
		{"id": "pos", "name": "POS Indonesia"},
		{"id": "sicepat", "name": "SiCepat"},
		{"id": "anteraja", "name": "AnterAja"},
		{"id": "lion", "name": "Lion Parcel"},
	}
	utils.Success(c, couriers)
}
