/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import i18next from 'i18next'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { handleServerError } from '@/lib/handle-server-error'

import {
  calculateEpusdtAmount,
  calculateAmount,
  calculateStripeAmount,
  calculateWaffoAmount,
  calculateWaffoPancakeAmount,
  requestEpusdtPayment,
  requestPayment,
  requestStripePayment,
  isApiSuccess,
} from '../api'
import {
  isEpusdtPayment,
  isStripePayment,
  isWaffoPayment,
  isWaffoPancakePayment,
  submitPaymentForm,
} from '../lib'
import type { AmountRequest, AmountResponse } from '../types'

// ============================================================================
// Payment Hook
// ============================================================================

function normalizeHttpPaymentUrl(
  raw: string | undefined | null
): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null

  try {
    const base =
      typeof window !== 'undefined' ? window.location.href : undefined
    const url = base ? new URL(trimmed, base) : new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
    if (url.username || url.password) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

function getEpusdtPaymentUrl(data: unknown): string | null {
  if (typeof data === 'string') {
    return normalizeHttpPaymentUrl(data)
  }

  if (!data || typeof data !== 'object') {
    return null
  }

  const url = (data as { payment_url?: unknown }).payment_url
  return typeof url === 'string' ? normalizeHttpPaymentUrl(url) : null
}

type AmountCalculator = (request: AmountRequest) => Promise<AmountResponse>

export interface PaymentAmountCalculators {
  regular: AmountCalculator
  stripe: AmountCalculator
  waffo: AmountCalculator
  epusdt?: AmountCalculator
  waffoPancake: AmountCalculator
}

const defaultPaymentAmountCalculators: PaymentAmountCalculators = {
  regular: calculateAmount,
  epusdt: calculateEpusdtAmount,
  stripe: calculateStripeAmount,
  waffo: calculateWaffoAmount,
  waffoPancake: calculateWaffoPancakeAmount,
}

export async function requestPaymentAmount(
  topupAmount: number,
  paymentType: string,
  calculators: PaymentAmountCalculators = defaultPaymentAmountCalculators
): Promise<number> {
  let calculator = calculators.regular
  if (isEpusdtPayment(paymentType)) {
    calculator = calculators.epusdt ?? calculateEpusdtAmount
  } else if (isStripePayment(paymentType)) {
    calculator = calculators.stripe
  } else if (isWaffoPayment(paymentType)) {
    calculator = calculators.waffo
  } else if (isWaffoPancakePayment(paymentType)) {
    calculator = calculators.waffoPancake
  }

  const response = await calculator({ amount: topupAmount })
  if (!isApiSuccess(response) || !response.data) {
    return 0
  }

  return Number.parseFloat(response.data)
}

export function usePayment() {
  const [amount, setAmount] = useState<number>(0)
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Calculate payment amount
  const calculatePaymentAmount = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setCalculating(true)
        const calculatedAmount = await requestPaymentAmount(
          topupAmount,
          paymentType
        )
        setAmount(calculatedAmount)
        return calculatedAmount
      } catch {
        setAmount(0)
        return 0
      } finally {
        setCalculating(false)
      }
    },
    []
  )

  // Process payment
  const processPayment = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setProcessing(true)

        const isStripe = isStripePayment(paymentType)
        const isUsdt = isEpusdtPayment(paymentType)
        const amount = Math.floor(topupAmount)

        if (isStripe) {
          const response = await requestStripePayment({
            amount,
            payment_method: 'stripe',
          })

          if (!isApiSuccess(response)) {
            toast.error(response.message || i18next.t('Payment request failed'))
            return false
          }

          if (response.data?.pay_link) {
            window.open(response.data.pay_link, '_blank')
            toast.success(i18next.t('Redirecting to payment page...'))
            return true
          }

          return false
        }

        if (isUsdt) {
          const response = await requestEpusdtPayment({
            amount,
            payment_method: 'usdt',
          })

          if (!isApiSuccess(response)) {
            toast.error(response.message || i18next.t('Payment request failed'))
            return false
          }

          const paymentUrl = getEpusdtPaymentUrl(response.data)
          if (!paymentUrl) {
            toast.error(
              response.message || i18next.t('Payment URL is unavailable')
            )
            return false
          }

          window.location.href = paymentUrl
          toast.success(i18next.t('Redirecting to payment page...'))
          return true
        }

        const response = await requestPayment({
          amount,
          payment_method: paymentType,
        })

        if (!isApiSuccess(response)) {
          handleServerError(response, i18next.t('Payment request failed'))
          return false
        }

        // Handle non-Stripe payment
        if (response.data) {
          const url = (response as unknown as { url?: string }).url
          if (url) {
            submitPaymentForm(url, response.data)
            toast.success(i18next.t('Redirecting to payment page...'))
            return true
          }
        }

        return false
      } catch (error) {
        handleServerError(error, i18next.t('Payment request failed'))
        return false
      } finally {
        setProcessing(false)
      }
    },
    []
  )

  return {
    amount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
    setAmount,
  }
}
