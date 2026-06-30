# USDT / EPUSDT 集成说明

## 已实现内容

### 后端

- `setting/payment_usdt.go`：读取环境变量/后台选项，生成 EPUSDT 签名。
- `controller/topup_usdt.go`：计算金额、创建 USDT 订单、处理 EPUSDT Webhook。
- `model/topup.go`：新增 `usdt` 支付方式和 `epusdt` provider，使用事务完成入账。
- `router/api-router.go`：开放 EPUSDT Webhook，同时提供登录用户创建订单接口。
- `controller/topup.go`：在充值信息中下发 `USDT (TRC20)` 支付方式。

### 前端

- 钱包页显示 `USDT (TRC20)` 支付方式。
- 选择 USDT 后调用 `/api/user/epusdt/amount` 计算实际支付金额。
- 确认支付后调用 `/api/user/epusdt/pay` 并跳转 EPUSDT 收银台。
- 后台支付网关页面新增 `USDT Gateway` 配置项。

## API

| 接口 | 方法 | 权限 | 说明 |
| --- | --- | --- | --- |
| `/api/user/epusdt/amount` | POST | 登录用户 | 计算 USDT 支付金额 |
| `/api/user/epusdt/pay` | POST | 登录用户 | 创建 USDT 支付订单 |
| `/api/user/epusdt/notify` | POST | 公开 Webhook | EPUSDT 支付成功回调 |

## new-api 配置项

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `EpusdtEnabled` / `EPUSDT_ENABLED` | `false` | 是否启用 USDT 充值 |
| `EpusdtURL` / `EPUSDT_URL` | 空 | EPUSDT 服务公网地址 |
| `EpusdtPid` / `EPUSDT_PID` | `1000` | EPUSDT 商户 PID |
| `EpusdtToken` / `EPUSDT_TOKEN` | 空 | EPUSDT 商户 `secret_key` |
| `EpusdtCurrency` / `EPUSDT_CURRENCY` | `usd` | 提交给 EPUSDT 的法币单位 |
| `EpusdtTokenSymbol` / `EPUSDT_TOKEN_SYMBOL` | `usdt` | 提交给 EPUSDT 的币种 |
| `EpusdtNetwork` / `EPUSDT_NETWORK` | `tron` | 提交给 EPUSDT 的网络 |
| `EpusdtUnitPrice` / `EPUSDT_UNIT_PRICE` | `1` | 支付金额倍率 |
| `EpusdtMinTopUp` / `EPUSDT_MIN_TOPUP` | `10` | 最小充值金额 |
| `EpusdtMaxTopUp` / `EPUSDT_MAX_TOPUP` | `10000` | 最大充值金额，0 表示不限制 |
| `EpusdtNotifyURL` / `EPUSDT_NOTIFY_URL` | 空 | Webhook 地址覆盖 |
| `EpusdtReturnURL` / `EPUSDT_RETURN_URL` | 空 | 支付后返回地址覆盖 |
| `EpusdtLegacyAPI` / `EPUSDT_LEGACY_API` | `false` | 兼容旧 EPUSDT API |

## 签名规则

创建订单和 Webhook 验签都使用 EPUSDT GMPay 规则：

1. 排除 `signature`；
2. 删除空值字段；
3. 按 ASCII key 升序排序；
4. 拼接为 `key=value&key2=value2...`；
5. 末尾追加商户 `secret_key`；
6. 计算小写 MD5。

## 入账策略

- 本地订单先写入 `topups` 表，状态为 `pending`。
- Webhook 收到 `status=2` 后验签。
- 使用订单锁防止并发重复处理。
- 校验回调金额不得小于本地订单金额。
- 使用数据库事务更新订单状态和用户余额。
- 已成功订单再次收到回调会直接返回 `ok`，保证幂等。

## 部署建议

- EPUSDT 和 new-api 可以分开部署，new-api 只需要能访问 EPUSDT 公网地址。
- EPUSDT 必须能访问 new-api 的 `/api/user/epusdt/notify`。
- `ServerAddress` 要配置为公网 HTTPS 域名，否则默认回调地址可能不正确。
- 当前官方 EPUSDT 推荐 `gmwallet/epusdt:latest` 镜像与 GMPay API。
