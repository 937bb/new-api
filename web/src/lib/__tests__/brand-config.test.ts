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
import { describe, expect, it } from 'vitest'

import { mapStatusDataToConfig } from '@/lib/status-query'

describe('ModelPort branding', () => {
  it('uses the bundled brand when the server has no name or logo configured', () => {
    const config = mapStatusDataToConfig({ system_name: '', logo: '' })
    expect(config.systemName).toBe('ModelPort Global')
    expect(config.logo).toBe('/modelport-mark.svg')
  })

  it('honors administrator branding without affecting currency configuration', () => {
    const config = mapStatusDataToConfig({
      system_name: 'Partner workspace',
      logo: '/partner.svg',
      quota_per_unit: 500000,
      quota_display_type: 'USD',
    })
    expect(config.systemName).toBe('Partner workspace')
    expect(config.logo).toBe('/partner.svg')
    expect(config.currency?.quotaPerUnit).toBe(500000)
    expect(config.currency?.quotaDisplayType).toBe('USD')
  })
})
