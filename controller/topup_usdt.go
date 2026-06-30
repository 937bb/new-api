package controller

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"github.com/thanhpk/randstr"
)

const epusdtNotifyPath = "/api/user/epusdt/notify"

var usdtAdaptor = &USDTAdaptor{}

type USDTPayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
	SuccessURL    string `json:"success_url,omitempty"`
	CancelURL     string `json:"cancel_url,omitempty"`
}

type USDTAdaptor struct{}

type EpusdtCreateOrderRequest struct {
	PID         string  `json:"pid,omitempty"`
	OrderID     string  `json:"order_id"`
	Currency    string  `json:"currency,omitempty"`
	Token       string  `json:"token,omitempty"`
	Network     string  `json:"network,omitempty"`
	Amount      float64 `json:"amount"`
	NotifyURL   string  `json:"notify_url"`
	RedirectURL string  `json:"redirect_url,omitempty"`
	Name        string  `json:"name,omitempty"`
	Signature   string  `json:"signature"`
}

type EpusdtCreateOrderResponse struct {
	StatusCode int              `json:"status_code"`
	Message    string           `json:"message"`
	Data       *EpusdtOrderData `json:"data,omitempty"`
	RequestID  string           `json:"request_id,omitempty"`
}

type EpusdtOrderData struct {
	TradeID        string  `json:"trade_id"`
	OrderID        string  `json:"order_id"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	ActualAmount   float64 `json:"actual_amount"`
	ReceiveAddress string  `json:"receive_address"`
	Token          string  `json:"token"`
	Network        string  `json:"network"`
	Status         int     `json:"status"`
	ExpirationTime int64   `json:"expiration_time"`
	PaymentURL     string  `json:"payment_url"`
}

type EpusdtNotifyRequest struct {
	PID                string  `json:"pid,omitempty"`
	TradeID            string  `json:"trade_id"`
	OrderID            string  `json:"order_id"`
	Amount             float64 `json:"amount"`
	ActualAmount       float64 `json:"actual_amount"`
	ReceiveAddress     string  `json:"receive_address,omitempty"`
	Token              string  `json:"token"`
	BlockTransactionID string  `json:"block_transaction_id,omitempty"`
	Status             int     `json:"status"`
	Signature          string  `json:"signature"`
}

func getEpusdtMinTopup() int64 {
	minTopup := setting.EpusdtMinTopUp
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		minTopup = int(decimal.NewFromInt(int64(minTopup)).
			Mul(decimal.NewFromFloat(common.QuotaPerUnit)).
			IntPart())
	}
	return int64(minTopup)
}

func normalizeEpusdtTopUpAmount(amount int64) int64 {
	if operation_setting.GetQuotaDisplayType() != operation_setting.QuotaDisplayTypeTokens {
		return amount
	}
	normalized := decimal.NewFromInt(amount).
		Div(decimal.NewFromFloat(common.QuotaPerUnit)).
		IntPart()
	if normalized < 1 {
		return 1
	}
	return normalized
}

func getEpusdtPayMoney(amount int64, group string) float64 {
	dAmount := decimal.NewFromInt(amount)
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		dAmount = dAmount.Div(decimal.NewFromFloat(common.QuotaPerUnit))
	}

	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}

	discount := 1.0
	if ds, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(amount)]; ok && ds > 0 {
		discount = ds
	}

	return dAmount.
		Mul(decimal.NewFromFloat(setting.GetUsdToUsdtRate())).
		Mul(decimal.NewFromFloat(topupGroupRatio)).
		Mul(decimal.NewFromFloat(discount)).
		InexactFloat64()
}

func formatEpusdtAmount(amount float64) string {
	return decimal.NewFromFloat(amount).StringFixed(2)
}

func validateEpusdtAmount(c *gin.Context, amount int64) bool {
	if !isEpusdtTopUpEnabled() {
		common.ApiErrorMsg(c, "USDT 支付未启用或配置不完整")
		return false
	}
	if amount < getEpusdtMinTopup() {
		common.ApiErrorMsg(c, fmt.Sprintf("充值数量不能小于 %d", getEpusdtMinTopup()))
		return false
	}
	if setting.EpusdtMaxTopUp > 0 && amount > int64(setting.EpusdtMaxTopUp) {
		common.ApiErrorMsg(c, fmt.Sprintf("充值数量不能大于 %d", setting.EpusdtMaxTopUp))
		return false
	}
	return true
}

func (*USDTAdaptor) RequestAmount(c *gin.Context, req *USDTPayRequest) {
	if !validateEpusdtAmount(c, req.Amount) {
		return
	}

	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		common.ApiErrorMsg(c, "获取用户分组失败")
		return
	}

	payMoney := getEpusdtPayMoney(req.Amount, group)
	if payMoney <= 0.01 {
		common.ApiErrorMsg(c, "充值金额过低")
		return
	}

	common.ApiSuccess(c, formatEpusdtAmount(payMoney))
}

func (*USDTAdaptor) RequestPay(c *gin.Context, req *USDTPayRequest) {
	if req.PaymentMethod != model.PaymentMethodUSDT {
		common.ApiErrorMsg(c, "不支持的支付渠道")
		return
	}
	if !validateEpusdtAmount(c, req.Amount) {
		return
	}

	if req.SuccessURL != "" && common.ValidateRedirectURL(req.SuccessURL) != nil {
		common.ApiErrorMsg(c, "支付成功重定向 URL 不在可信任域名列表中")
		return
	}
	if req.CancelURL != "" && common.ValidateRedirectURL(req.CancelURL) != nil {
		common.ApiErrorMsg(c, "支付取消重定向 URL 不在可信任域名列表中")
		return
	}

	userID := c.GetInt("id")
	user, err := model.GetUserById(userID, false)
	if err != nil || user == nil {
		common.ApiErrorMsg(c, "用户不存在")
		return
	}

	payMoney := getEpusdtPayMoney(req.Amount, user.Group)
	if payMoney <= 0.01 {
		common.ApiErrorMsg(c, "充值金额计算错误")
		return
	}

	tradeNo := fmt.Sprintf("USDT-%d-%d-%s", userID, time.Now().UnixMilli(), randstr.String(6))
	topUp := &model.TopUp{
		UserId:          userID,
		Amount:          normalizeEpusdtTopUpAmount(req.Amount),
		Money:           payMoney,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodUSDT,
		PaymentProvider: model.PaymentProviderEPUSDT,
		CreateTime:      common.GetTimestamp(),
		Status:          common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("EPUSDT 创建充值订单失败 user_id=%d trade_no=%s amount=%d error=%q", userID, tradeNo, req.Amount, err.Error()))
		common.ApiErrorMsg(c, "创建订单失败")
		return
	}

	order, err := createEpusdtOrder(c.Request.Context(), tradeNo, payMoney, req.SuccessURL, req.CancelURL)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("EPUSDT 创建支付订单失败 user_id=%d trade_no=%s error=%q", userID, tradeNo, err.Error()))
		topUp.Status = common.TopUpStatusFailed
		_ = topUp.Update()
		common.ApiErrorMsg(c, "拉起支付失败")
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("EPUSDT 充值订单创建成功 user_id=%d trade_no=%s epusdt_trade_id=%s amount=%d money=%.2f", userID, tradeNo, order.TradeID, req.Amount, payMoney))
	common.ApiSuccess(c, gin.H{
		"trade_no":        tradeNo,
		"epusdt_trade_id": order.TradeID,
		"payment_url":     order.PaymentURL,
		"qr_code":         order.PaymentURL,
		"amount":          order.Amount,
		"actual_amount":   order.ActualAmount,
		"token":           order.Token,
		"network":         order.Network,
		"receive_address": order.ReceiveAddress,
		"expiration_time": order.ExpirationTime,
	})
}

func resolveEpusdtNotifyURL() string {
	if strings.TrimSpace(setting.EpusdtNotifyURL) != "" {
		return strings.TrimSpace(setting.EpusdtNotifyURL)
	}
	return strings.TrimRight(service.GetCallbackAddress(), "/") + epusdtNotifyPath
}

func resolveEpusdtReturnURL(successURL, cancelURL string) string {
	if successURL != "" {
		return successURL
	}
	if strings.TrimSpace(setting.EpusdtReturnURL) != "" {
		return strings.TrimSpace(setting.EpusdtReturnURL)
	}
	if cancelURL != "" {
		return cancelURL
	}
	return paymentReturnPath("/console/topup?show_history=true")
}

func createEpusdtOrder(ctx context.Context, orderID string, amount float64, successURL, cancelURL string) (*EpusdtOrderData, error) {
	roundedAmount := decimal.NewFromFloat(amount).Round(2).InexactFloat64()
	amountString := strconv.FormatFloat(roundedAmount, 'f', -1, 64)
	notifyURL := resolveEpusdtNotifyURL()
	redirectURL := resolveEpusdtReturnURL(successURL, cancelURL)

	signParams := map[string]string{
		"order_id":   orderID,
		"amount":     amountString,
		"notify_url": notifyURL,
	}
	if redirectURL != "" {
		signParams["redirect_url"] = redirectURL
	}
	reqBody := EpusdtCreateOrderRequest{
		OrderID:     orderID,
		Amount:      roundedAmount,
		NotifyURL:   notifyURL,
		RedirectURL: redirectURL,
	}

	endpoint := strings.TrimRight(setting.EpusdtURL, "/") + "/api/v1/order/create-transaction"
	if !setting.EpusdtLegacyAPI {
		endpoint = strings.TrimRight(setting.EpusdtURL, "/") + "/payments/gmpay/v1/order/create-transaction"
		pid := strings.TrimSpace(setting.EpusdtPid)
		if pid == "" {
			pid = "1000"
		}
		currency := strings.ToLower(strings.TrimSpace(setting.EpusdtCurrency))
		if currency == "" {
			currency = "usd"
		}
		token := strings.ToLower(strings.TrimSpace(setting.EpusdtTokenSymbol))
		if token == "" {
			token = "usdt"
		}
		network := strings.ToLower(strings.TrimSpace(setting.EpusdtNetwork))
		if network == "" {
			network = "tron"
		}
		reqBody.PID = pid
		reqBody.Currency = currency
		reqBody.Token = token
		reqBody.Network = network
		reqBody.Name = fmt.Sprintf("Recharge %s", amountString)

		signParams["pid"] = pid
		signParams["currency"] = currency
		signParams["token"] = token
		signParams["network"] = network
		signParams["name"] = reqBody.Name
	}
	reqBody.Signature = setting.EpusdtSign(signParams, setting.EpusdtToken)

	bodyBytes, err := common.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("序列化 EPUSDT 请求失败: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("创建 EPUSDT 请求失败: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求 EPUSDT 失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result EpusdtCreateOrderResponse
	if err := common.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("解析 EPUSDT 响应失败: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("EPUSDT HTTP %d: %s", resp.StatusCode, result.Message)
	}
	if result.StatusCode != 200 || result.Data == nil {
		return nil, fmt.Errorf("EPUSDT 返回错误: %s", result.Message)
	}
	if result.Data.PaymentURL == "" {
		return nil, fmt.Errorf("EPUSDT 未返回支付链接")
	}

	return result.Data, nil
}

func verifyEpusdtSignature(notify EpusdtNotifyRequest) bool {
	signParams := map[string]string{
		"trade_id":      notify.TradeID,
		"order_id":      notify.OrderID,
		"amount":        strconv.FormatFloat(notify.Amount, 'f', -1, 64),
		"actual_amount": strconv.FormatFloat(notify.ActualAmount, 'f', -1, 64),
		"token":         notify.Token,
		"status":        strconv.Itoa(notify.Status),
	}
	if notify.PID != "" {
		signParams["pid"] = notify.PID
	}
	if notify.ReceiveAddress != "" {
		signParams["receive_address"] = notify.ReceiveAddress
	}
	if notify.BlockTransactionID != "" {
		signParams["block_transaction_id"] = notify.BlockTransactionID
	}
	expectedSig := setting.EpusdtSign(signParams, setting.EpusdtToken)
	return strings.EqualFold(notify.Signature, expectedSig)
}

func verifyEpusdtPaidAmount(orderID string, paidAmount float64) error {
	topUp := model.GetTopUpByTradeNo(orderID)
	if topUp == nil {
		return fmt.Errorf("充值订单不存在")
	}
	if topUp.PaymentProvider != model.PaymentProviderEPUSDT {
		return model.ErrPaymentMethodMismatch
	}
	if topUp.Status == common.TopUpStatusSuccess {
		return nil
	}
	expected := decimal.NewFromFloat(topUp.Money).Round(2)
	actual := decimal.NewFromFloat(paidAmount).Round(2)
	if actual.LessThan(expected) {
		return fmt.Errorf("支付金额不足，期望 %s USDT，实际 %s USDT", expected.StringFixed(2), actual.StringFixed(2))
	}
	return nil
}

func EpusdtNotifyHandler(c *gin.Context) {
	if !isEpusdtWebhookEnabled() {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("EPUSDT webhook 被拒绝 reason=webhook_disabled path=%q client_ip=%s", c.Request.RequestURI, c.ClientIP()))
		c.String(http.StatusForbidden, "webhook disabled")
		return
	}

	var notify EpusdtNotifyRequest
	if err := c.ShouldBindJSON(&notify); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("EPUSDT webhook 解析失败 path=%q client_ip=%s error=%q", c.Request.RequestURI, c.ClientIP(), err.Error()))
		c.String(http.StatusBadRequest, "invalid request")
		return
	}

	if !verifyEpusdtSignature(notify) {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("EPUSDT webhook 签名验证失败 order_id=%s trade_id=%s client_ip=%s", notify.OrderID, notify.TradeID, c.ClientIP()))
		c.String(http.StatusUnauthorized, "invalid signature")
		return
	}

	if notify.Status != 2 {
		logger.LogInfo(c.Request.Context(), fmt.Sprintf("EPUSDT webhook 忽略非成功状态 order_id=%s trade_id=%s status=%d", notify.OrderID, notify.TradeID, notify.Status))
		c.String(http.StatusOK, "ok")
		return
	}

	LockOrder(notify.OrderID)
	defer UnlockOrder(notify.OrderID)

	paidMerchantAmount := notify.Amount
	if paidMerchantAmount <= 0 {
		paidMerchantAmount = notify.ActualAmount
	}
	if err := verifyEpusdtPaidAmount(notify.OrderID, paidMerchantAmount); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("EPUSDT webhook 金额校验失败 order_id=%s trade_id=%s error=%q", notify.OrderID, notify.TradeID, err.Error()))
		c.String(http.StatusOK, "ok")
		return
	}

	if err := model.RechargeEpusdt(notify.OrderID, notify.TradeID, c.ClientIP()); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("EPUSDT 充值处理失败 order_id=%s trade_id=%s error=%q", notify.OrderID, notify.TradeID, err.Error()))
		c.String(http.StatusInternalServerError, "retry")
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("EPUSDT 充值成功 order_id=%s trade_id=%s actual_amount=%.6f token=%s tx=%s", notify.OrderID, notify.TradeID, notify.ActualAmount, notify.Token, notify.BlockTransactionID))
	c.String(http.StatusOK, "ok")
}
