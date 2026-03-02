package models

import "time"

// ==================== USER ====================

type UserRole string

const (
	RoleCustomer  UserRole = "customer"
	RoleSeller    UserRole = "seller"
	RoleWarehouse UserRole = "warehouse"
	RoleStore     UserRole = "store"
	RoleAdmin     UserRole = "admin"
	RoleSuperAdmin UserRole = "superadmin"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:100;not null" json:"name" validate:"required,min=2"`
	Email        string    `gorm:"size:255;uniqueIndex;not null" json:"email" validate:"required,email"`
	Phone        string    `gorm:"size:20" json:"phone"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	AvatarURL    string    `gorm:"size:500" json:"avatar_url"`
	Bio          string    `gorm:"size:500" json:"bio"`
	Role         UserRole  `gorm:"size:20;default:customer;not null;index" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Relations
	Addresses []Address `gorm:"foreignKey:UserID" json:"addresses,omitempty"`
	Orders    []Order   `gorm:"foreignKey:UserID" json:"orders,omitempty"`
	Reviews   []Review  `gorm:"foreignKey:UserID" json:"reviews,omitempty"`
}

// ==================== CATEGORY ====================

type Category struct {
	ID       uint      `gorm:"primaryKey" json:"id"`
	Name     string    `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Icon     string    `gorm:"size:50" json:"icon"`
	Products []Product `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
}

// ==================== PRODUCT ====================

type Product struct {
	ID            uint             `gorm:"primaryKey" json:"id"`
	Name          string           `gorm:"size:255;not null;index" json:"name" validate:"required"`
	Description   string           `gorm:"type:text" json:"description"`
	SKU           string           `gorm:"size:50;uniqueIndex;not null" json:"sku"`
	Price         int              `gorm:"not null" json:"price" validate:"required,min=0"`
	OldPrice      *int             `json:"old_price"`
	ImageURL      string           `gorm:"size:500" json:"image_url"`
	CategoryID    uint             `gorm:"index;not null" json:"category_id"`
	Rating        float64          `gorm:"default:0" json:"rating"`
	ReviewCount   int              `gorm:"default:0" json:"review_count"`
	Stock         int              `gorm:"default:0" json:"stock"`
	LeadTimeDays  int              `gorm:"default:7" json:"lead_time_days"`
	ReorderPoint  int              `gorm:"default:10" json:"reorder_point"`
	SafetyStock   int              `gorm:"default:5" json:"safety_stock"`
	StockMethod   string           `gorm:"size:10;default:FIFO" json:"stock_method"`
	SellerID      *uint            `gorm:"index" json:"seller_id"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`

	// Relations
	Category Category         `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Variants []ProductVariant  `gorm:"foreignKey:ProductID" json:"variants,omitempty"`
	Reviews  []Review          `gorm:"foreignKey:ProductID" json:"reviews,omitempty"`
}

// ==================== PRODUCT VARIANT ====================

type ProductVariant struct {
	ID              uint   `gorm:"primaryKey" json:"id"`
	ProductID       uint   `gorm:"index;not null" json:"product_id"`
	Type            string `gorm:"size:20;not null" json:"type"` // color, size
	Value           string `gorm:"size:50;not null" json:"value"` // #000000, M
	Label           string `gorm:"size:50" json:"label"` // Black, Medium
	AdditionalPrice int    `gorm:"default:0" json:"additional_price"`
	Stock           int    `gorm:"default:0" json:"stock"`
}

// ==================== STOCK BATCH (FIFO) ====================

type StockBatch struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	ProductVariantID uint      `gorm:"index;not null" json:"product_variant_id"`
	ProductID        uint      `gorm:"index;not null" json:"product_id"`
	Quantity         int       `gorm:"not null" json:"quantity"`
	Remaining        int       `gorm:"not null" json:"remaining"`
	CostPrice        int       `gorm:"not null" json:"cost_price"`
	BatchNumber      string    `gorm:"size:50" json:"batch_number"`
	SupplierID       *uint     `gorm:"index" json:"supplier_id"`
	ReceivedAt       time.Time `gorm:"index;not null" json:"received_at"`
	CreatedAt        time.Time `json:"created_at"`

	// Relations
	Supplier *Supplier `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
}

// ==================== SUPPLIER ====================

type Supplier struct {
	ID              uint   `gorm:"primaryKey" json:"id"`
	Name            string `gorm:"size:255;not null" json:"name"`
	Contact         string `gorm:"size:255" json:"contact"`
	Email           string `gorm:"size:255" json:"email"`
	Phone           string `gorm:"size:20" json:"phone"`
	AvgLeadTimeDays int    `gorm:"default:7" json:"avg_lead_time_days"`
	CreatedAt       time.Time `json:"created_at"`
}

// ==================== STORE ====================

type Store struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:255;not null" json:"name"`
	Address   string    `gorm:"type:text" json:"address"`
	City      string    `gorm:"size:100" json:"city"`
	Hours     string    `gorm:"size:50" json:"hours"`
	Phone     string    `gorm:"size:20" json:"phone"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

// Store stock — tracks inventory per store
type StoreStock struct {
	ID        uint `gorm:"primaryKey" json:"id"`
	StoreID   uint `gorm:"uniqueIndex:idx_store_product;not null" json:"store_id"`
	ProductID uint `gorm:"uniqueIndex:idx_store_product;not null" json:"product_id"`
	Quantity  int  `gorm:"default:0" json:"quantity"`

	Store   Store   `gorm:"foreignKey:StoreID" json:"store,omitempty"`
	Product Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

// Stock transfer: Warehouse → Store
type StockTransfer struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ProductID   uint      `gorm:"index;not null" json:"product_id"`
	StoreID     uint      `gorm:"index;not null" json:"store_id"`
	Quantity    int       `gorm:"not null" json:"quantity"`
	Status      string    `gorm:"size:20;default:pending" json:"status"` // pending, in_transit, received
	TransferredBy uint   `json:"transferred_by"`
	ReceivedBy    *uint  `json:"received_by"`
	CreatedAt   time.Time `json:"created_at"`
	ReceivedAt  *time.Time `json:"received_at"`
}

// ==================== ADDRESS ====================

type Address struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	UserID        uint   `gorm:"index;not null" json:"user_id"`
	Label         string `gorm:"size:50" json:"label"` // Rumah, Kantor
	RecipientName string `gorm:"size:100;not null" json:"recipient_name" validate:"required"`
	Phone         string `gorm:"size:20;not null" json:"phone" validate:"required"`
	Street        string `gorm:"type:text;not null" json:"street" validate:"required"`
	City          string `gorm:"size:100;not null" json:"city" validate:"required"`
	Province      string `gorm:"size:100" json:"province"`
	PostalCode    string `gorm:"size:10" json:"postal_code"`
	IsDefault     bool   `gorm:"default:false" json:"is_default"`
	CreatedAt     time.Time `json:"created_at"`
}

// ==================== ORDER ====================

type OrderStatus string

const (
	OrderPending    OrderStatus = "pending"
	OrderConfirmed  OrderStatus = "confirmed"
	OrderPreparing  OrderStatus = "preparing"
	OrderShipped    OrderStatus = "in_transit"
	OrderDelivered  OrderStatus = "delivered"
	OrderCanceled   OrderStatus = "canceled"
)

type Order struct {
	ID           uint        `gorm:"primaryKey" json:"id"`
	UserID       uint        `gorm:"index;not null" json:"user_id"`
	OrderNumber  string      `gorm:"size:50;uniqueIndex;not null" json:"order_number"`
	Status       OrderStatus `gorm:"size:20;default:pending;not null;index" json:"status"`
	AddressID    uint        `gorm:"not null" json:"address_id"`
	Subtotal     int         `gorm:"not null" json:"subtotal"`
	ShippingCost int         `gorm:"default:0" json:"shipping_cost"`
	Discount     int         `gorm:"default:0" json:"discount"`
	Total        int         `gorm:"not null" json:"total"`
	CourierName  string      `gorm:"size:100" json:"courier_name"`
	VoucherCode  string      `gorm:"size:50" json:"voucher_code"`
	StoreID      *uint       `json:"store_id"` // for store pickup
	Notes        string      `gorm:"type:text" json:"notes"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`

	// Relations
	User    User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Address Address     `gorm:"foreignKey:AddressID" json:"address,omitempty"`
	Items   []OrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
}

type OrderItem struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	OrderID     uint   `gorm:"index;not null" json:"order_id"`
	ProductID   uint   `gorm:"index;not null" json:"product_id"`
	VariantInfo string `gorm:"size:100" json:"variant_info"` // "Black, Size M"
	Quantity    int    `gorm:"not null" json:"quantity"`
	Price       int    `gorm:"not null" json:"price"`

	Product Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

// ==================== VOUCHER ====================

type Voucher struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Code          string    `gorm:"size:50;uniqueIndex;not null" json:"code"`
	Title         string    `gorm:"size:255;not null" json:"title"`
	Description   string    `gorm:"type:text" json:"description"`
	DiscountType  string    `gorm:"size:20;not null" json:"discount_type"` // percentage, fixed, shipping
	DiscountValue int       `gorm:"not null" json:"discount_value"`
	MinPurchase   int       `gorm:"default:0" json:"min_purchase"`
	MaxDiscount   int       `gorm:"default:0" json:"max_discount"`
	ValidUntil    time.Time `json:"valid_until"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	UsageLimit    int       `gorm:"default:0" json:"usage_limit"` // 0 = unlimited
	UsedCount     int       `gorm:"default:0" json:"used_count"`
	CreatedAt     time.Time `json:"created_at"`
}

// ==================== REVIEW ====================

type Review struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	ProductID    uint      `gorm:"index;not null" json:"product_id"`
	Rating       int       `gorm:"not null" json:"rating" validate:"required,min=1,max=5"`
	Text         string    `gorm:"type:text" json:"text"`
	Photos       string    `gorm:"type:text" json:"photos"` // JSON array
	HelpfulCount int       `gorm:"default:0" json:"helpful_count"`
	CreatedAt    time.Time `json:"created_at"`

	User    User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Product Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

// ==================== CART ====================

type CartItem struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	UserID      uint   `gorm:"uniqueIndex:idx_cart_user_product;not null" json:"user_id"`
	ProductID   uint   `gorm:"uniqueIndex:idx_cart_user_product;not null" json:"product_id"`
	VariantInfo string `gorm:"size:100" json:"variant_info"`
	Quantity    int    `gorm:"default:1;not null" json:"quantity"`
	CreatedAt   time.Time `json:"created_at"`

	Product Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

// ==================== WISHLIST ====================

type WishlistItem struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"uniqueIndex:idx_wish_user_product;not null" json:"user_id"`
	ProductID uint      `gorm:"uniqueIndex:idx_wish_user_product;not null" json:"product_id"`
	CreatedAt time.Time `json:"created_at"`

	Product Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}

// ==================== AUDIT LOG ====================

type AuditLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index" json:"user_id"`
	Action    string    `gorm:"size:100;not null" json:"action"`
	Entity    string    `gorm:"size:50" json:"entity"`
	EntityID  uint      `json:"entity_id"`
	Details   string    `gorm:"type:text" json:"details"`
	IP        string    `gorm:"size:45" json:"ip"`
	CreatedAt time.Time `json:"created_at"`
}

// ==================== RETURN / REFUND ====================

type Return struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OrderID     uint      `gorm:"index;not null" json:"order_id"`
	UserID      uint      `gorm:"index;not null" json:"user_id"`
	Reason      string    `gorm:"type:text;not null" json:"reason"`
	Status      string    `gorm:"size:20;default:requested;not null" json:"status"` // requested, approved, rejected, refunded
	RefundAmount int      `gorm:"default:0" json:"refund_amount"`
	Photos      string    `gorm:"type:text" json:"photos"`
	AdminNotes  string    `gorm:"type:text" json:"admin_notes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Order Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	User  User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// ==================== PURCHASE ORDER (Procurement) ====================

type PurchaseOrder struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	PONumber    string    `gorm:"size:50;uniqueIndex;not null" json:"po_number"`
	SupplierID  uint      `gorm:"index;not null" json:"supplier_id"`
	Status      string    `gorm:"size:20;default:draft;not null" json:"status"` // draft, sent, confirmed, received, canceled
	TotalAmount int       `gorm:"default:0" json:"total_amount"`
	Notes       string    `gorm:"type:text" json:"notes"`
	ExpectedAt  *time.Time `json:"expected_at"`
	ReceivedAt  *time.Time `json:"received_at"`
	CreatedBy   uint      `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Supplier Supplier          `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	Items    []PurchaseOrderItem `gorm:"foreignKey:PurchaseOrderID" json:"items,omitempty"`
}

type PurchaseOrderItem struct {
	ID              uint `gorm:"primaryKey" json:"id"`
	PurchaseOrderID uint `gorm:"index;not null" json:"purchase_order_id"`
	ProductID       uint `gorm:"index;not null" json:"product_id"`
	Quantity        int  `gorm:"not null" json:"quantity"`
	UnitCost        int  `gorm:"not null" json:"unit_cost"`
	ReceivedQty     int  `gorm:"default:0" json:"received_qty"`

	Product Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
}
