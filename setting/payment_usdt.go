package setting

import (
	"crypto/md5"
	"encoding/hex"
	"os"
	"sort"
	"strconv"
	"strings"
)

// USDT (EPUSDT) payment settings
var (
	EpusdtEnabled     = false
	EpusdtURL         = ""
	EpusdtPid         = "1000"
	EpusdtToken       = ""
	EpusdtCurrency    = "usd"
	EpusdtTokenSymbol = "usdt"
	EpusdtNetwork     = "tron"
	EpusdtMinTopUp    = 10
	EpusdtMaxTopUp    = 10000
	EpusdtUnitPrice   = 1.0
	EpusdtNotifyURL   = ""
	EpusdtReturnURL   = ""
	EpusdtLegacyAPI   = false
)

func init() {
	// Load from environment variables
	if val := os.Getenv("EPUSDT_ENABLED"); val == "true" || val == "1" {
		EpusdtEnabled = true
	}
	if val := os.Getenv("EPUSDT_URL"); val != "" {
		EpusdtURL = strings.TrimRight(val, "/")
	}
	if val := os.Getenv("EPUSDT_PID"); val != "" {
		EpusdtPid = strings.TrimSpace(val)
	}
	if val := os.Getenv("EPUSDT_TOKEN"); val != "" {
		EpusdtToken = val
	}
	if val := os.Getenv("EPUSDT_CURRENCY"); val != "" {
		EpusdtCurrency = strings.ToLower(strings.TrimSpace(val))
	}
	if val := os.Getenv("EPUSDT_TOKEN_SYMBOL"); val != "" {
		EpusdtTokenSymbol = strings.ToLower(strings.TrimSpace(val))
	}
	if val := os.Getenv("EPUSDT_NETWORK"); val != "" {
		EpusdtNetwork = strings.ToLower(strings.TrimSpace(val))
	}
	if val := os.Getenv("EPUSDT_MIN_TOPUP"); val != "" {
		if intVal, err := strconv.Atoi(val); err == nil && intVal > 0 {
			EpusdtMinTopUp = intVal
		}
	}
	if val := os.Getenv("EPUSDT_MAX_TOPUP"); val != "" {
		if intVal, err := strconv.Atoi(val); err == nil && intVal > 0 {
			EpusdtMaxTopUp = intVal
		}
	}
	if val := os.Getenv("EPUSDT_UNIT_PRICE"); val != "" {
		if floatVal, err := strconv.ParseFloat(val, 64); err == nil && floatVal > 0 {
			EpusdtUnitPrice = floatVal
		}
	}
	if val := os.Getenv("EPUSDT_NOTIFY_URL"); val != "" {
		EpusdtNotifyURL = strings.TrimSpace(val)
	}
	if val := os.Getenv("EPUSDT_RETURN_URL"); val != "" {
		EpusdtReturnURL = strings.TrimSpace(val)
	}
	if val := os.Getenv("EPUSDT_LEGACY_API"); val == "true" || val == "1" {
		EpusdtLegacyAPI = true
	}
}

// EpusdtSign generates MD5 signature for EPUSDT API
// Format: sort params by key -> join with & -> append token -> MD5
func EpusdtSign(params map[string]string, token string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var parts []string
	for _, k := range keys {
		if params[k] != "" {
			parts = append(parts, k+"="+params[k])
		}
	}
	raw := strings.Join(parts, "&") + token
	h := md5.Sum([]byte(raw))
	return hex.EncodeToString(h[:])
}

// GetUsdToUsdtRate returns the current USD:USDT exchange rate
// Typically 1:1 for stablecoins
func GetUsdToUsdtRate() float64 {
	if EpusdtUnitPrice <= 0 {
		return 1
	}
	return EpusdtUnitPrice
}

// IsEpusdtEnabled checks if EPUSDT payment is configured
func IsEpusdtEnabled() bool {
	return EpusdtEnabled && strings.TrimSpace(EpusdtURL) != "" && strings.TrimSpace(EpusdtToken) != ""
}
