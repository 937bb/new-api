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

const DEFAULT_SEO = {
  title: 'ModelPort Global',
  description:
    'ModelPort Global provides a unified AI API gateway for resilient model routing, usage management, billing, and secure operations.',
  keywords:
    'AI API gateway, model routing, model proxy, OpenAI API, Claude API, Gemini API, AI billing',
  siteUrl: 'http://www.modelportglobal.com/',
  image: 'http://www.modelportglobal.com/logo.png',
}

const GENERIC_SYSTEM_NAMES = new Set(['new api', 'newapi'])

function getString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function getStatusString(
  status: Record<string, unknown> | null | undefined,
  key: string
): string {
  return getString(status?.[key])
}

function isGenericSystemName(value: string): boolean {
  return GENERIC_SYSTEM_NAMES.has(value.toLowerCase())
}

function normalizePublicUrl(value: string, fallback: string): string {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1') return fallback
    url.hash = ''
    return url.toString()
  } catch {
    return fallback
  }
}

function toAbsoluteUrl(value: string, baseUrl: string): string {
  if (!value) return ''
  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return ''
  }
}

function setMeta(
  attr: 'name' | 'property',
  key: string,
  content: string
): void {
  if (!content) return
  let meta = document.querySelector(
    `meta[${attr}="${key}"]`
  ) as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attr, key)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function setCanonical(href: string): void {
  let link = document.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

export function buildSeo(status?: Record<string, unknown> | null) {
  const systemName = getStatusString(status, 'system_name')
  const configuredTitle = getStatusString(status, 'seo_title')
  const title =
    configuredTitle ||
    (systemName && !isGenericSystemName(systemName)
      ? systemName
      : DEFAULT_SEO.title)

  const siteUrl = normalizePublicUrl(
    getStatusString(status, 'seo_site_url') ||
      getStatusString(status, 'server_address'),
    DEFAULT_SEO.siteUrl
  )
  const image =
    toAbsoluteUrl(getStatusString(status, 'seo_image'), siteUrl) ||
    toAbsoluteUrl(getStatusString(status, 'logo'), siteUrl) ||
    DEFAULT_SEO.image

  return {
    title,
    description:
      getStatusString(status, 'seo_description') || DEFAULT_SEO.description,
    keywords: getStatusString(status, 'seo_keywords') || DEFAULT_SEO.keywords,
    siteUrl,
    image,
  }
}

export function applySeoToDom(status?: Record<string, unknown> | null): void {
  if (typeof document === 'undefined') return

  const seo = buildSeo(status)
  document.title = seo.title

  setMeta('name', 'title', seo.title)
  setMeta('name', 'description', seo.description)
  setMeta('name', 'keywords', seo.keywords)
  setMeta('name', 'application-name', seo.title)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:url', seo.siteUrl)
  setMeta('property', 'og:title', seo.title)
  setMeta('property', 'og:description', seo.description)
  setMeta('property', 'og:image', seo.image)
  setMeta('property', 'og:site_name', seo.title)
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:url', seo.siteUrl)
  setMeta('name', 'twitter:title', seo.title)
  setMeta('name', 'twitter:description', seo.description)
  setMeta('name', 'twitter:image', seo.image)
  setCanonical(seo.siteUrl)
}
