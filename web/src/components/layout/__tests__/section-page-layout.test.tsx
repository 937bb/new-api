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
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PageFooterPortal } from '../components/page-footer'
import { SectionPageLayout } from '../components/section-page-layout'

afterEach(cleanup)

describe('console page layout', () => {
  it('keeps the page heading and actions outside the scrolling content', () => {
    render(
      <SectionPageLayout>
        <SectionPageLayout.Title>Channels</SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <button type='button'>Add channel</button>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <p>Channel list</p>
        </SectionPageLayout.Content>
      </SectionPageLayout>
    )
    const content = screen.getByText('Channel list').parentElement
    expect(content?.classList.contains('overflow-auto')).toBe(true)
    expect(
      content?.contains(screen.getByRole('heading', { name: 'Channels' }))
    ).toBe(false)
    expect(
      content?.contains(screen.getByRole('button', { name: 'Add channel' }))
    ).toBe(false)
  })

  it('lets fixed tables manage their own scrolling and keeps pagination outside', () => {
    render(
      <SectionPageLayout fixedContent>
        <SectionPageLayout.Title>Usage</SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <p>Usage table</p>
          <PageFooterPortal>
            <button type='button'>Next page</button>
          </PageFooterPortal>
        </SectionPageLayout.Content>
      </SectionPageLayout>
    )
    const content = screen.getByText('Usage table').parentElement
    expect(content?.classList.contains('overflow-hidden')).toBe(true)
    expect(
      content?.contains(screen.getByRole('button', { name: 'Next page' }))
    ).toBe(false)
  })
})
