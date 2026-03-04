package config

import "os"

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string

	// Midtrans Payment Gateway
	MidtransServerKey    string
	MidtransClientKey    string
	MidtransIsProduction bool

	// Binderbyte Shipping
	BinderbyteAPIKey   string
	BinderbyteOrigin   string // Origin city name for shipping cost calculation
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "sqlite://snapshop.db"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "snapshop-secret-key-change-in-production-2026"
	}

	midtransServerKey := os.Getenv("MIDTRANS_SERVER_KEY")
	midtransClientKey := os.Getenv("MIDTRANS_CLIENT_KEY")
	midtransIsProd := os.Getenv("MIDTRANS_IS_PRODUCTION") == "true"

	binderbyteKey := os.Getenv("BINDERBYTE_API_KEY")
	binderbyteOrigin := os.Getenv("BINDERBYTE_ORIGIN_CITY")
	if binderbyteOrigin == "" {
		binderbyteOrigin = "Jakarta Pusat"
	}

	return &Config{
		Port:               port,
		DatabaseURL:        dbURL,
		JWTSecret:          jwtSecret,
		MidtransServerKey:  midtransServerKey,
		MidtransClientKey:  midtransClientKey,
		MidtransIsProduction: midtransIsProd,
		BinderbyteAPIKey:   binderbyteKey,
		BinderbyteOrigin:   binderbyteOrigin,
	}
}
