import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Bot,
  ChevronDown,
  LockKeyhole,
  PawPrint,
  Sparkles,
} from 'lucide-react'
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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/language-switcher'
import { HeaderLogo } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { buildSeo } from '@/lib/seo'
import { cn } from '@/lib/utils'

import { LandingModelScene, type LandingVisual } from './landing-model-scene'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const [visual, setVisual] = useState<LandingVisual>('robot')
  const { status } = useStatus()
  const {
    systemName,
    logo: systemLogo,
    loading,
    logoLoaded,
  } = useSystemConfig()
  const heroName = buildSeo(status).title || systemName

  return (
    <section
      className={cn(
        'bg-background text-foreground relative isolate overflow-hidden',
        props.className
      )}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_12%,rgba(14,165,233,0.13),transparent_24%),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[auto,88px_88px,88px_88px] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(58,167,214,0.14),transparent_24%),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)]'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.86)_38%,rgba(255,255,255,0.56)_55%,rgba(255,255,255,0.9)_100%)] dark:bg-[linear-gradient(90deg,rgba(8,10,12,0.98)_0%,rgba(8,10,12,0.92)_38%,rgba(8,10,12,0.72)_55%,rgba(8,10,12,0.9)_100%)]'
      />

      <div className='mx-auto flex min-h-svh w-full max-w-[100rem] flex-col px-5 pt-7 pb-7 sm:px-8 lg:px-12'>
        <header className='z-20 flex items-center justify-between'>
          <Link to='/' className='group flex items-center gap-3'>
            <div className='bg-background/70 ring-border/70 flex size-10 items-center justify-center rounded-xl shadow-[0_0_32px_rgba(14,165,233,0.14)] ring-1 transition-transform duration-300 group-hover:scale-105 sm:size-12 dark:bg-white/6 dark:shadow-[0_0_32px_rgba(91,208,255,0.18)] dark:ring-white/10'>
              <HeaderLogo
                src={systemLogo}
                loading={loading}
                logoLoaded={logoLoaded}
                className='size-8 rounded-lg object-contain sm:size-10'
              />
            </div>
            <div className='leading-none'>
              <div className='text-foreground text-sm font-semibold tracking-tight sm:text-base dark:text-white'>
                {loading ? t('Loading...') : heroName}
              </div>
              <div className='text-muted-foreground mt-1 text-[10px] font-semibold tracking-[0.18em] uppercase dark:text-white/36'>
                {t('AI Gateway')}
              </div>
            </div>
          </Link>

          <div className='flex items-center gap-2'>
            <div
              className='border-border/60 bg-background/70 flex rounded-full border p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
              aria-label={t('Landing visual selector')}
            >
              <button
                type='button'
                aria-label={t('Robot')}
                aria-pressed={visual === 'robot'}
                onClick={() => setVisual('robot')}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all sm:px-4 sm:text-sm',
                  visual === 'robot'
                    ? 'bg-foreground text-background shadow-sm dark:bg-sky-100 dark:text-slate-950 dark:shadow-[0_0_18px_rgba(186,235,255,0.28)]'
                    : 'text-muted-foreground hover:text-foreground dark:text-white/55 dark:hover:text-white'
                )}
              >
                <Bot className='size-4' />
                <span className='hidden sm:inline'>{t('Robot')}</span>
              </button>
              <button
                type='button'
                aria-label={t('Fox')}
                aria-pressed={visual === 'fox'}
                onClick={() => setVisual('fox')}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all sm:px-4 sm:text-sm',
                  visual === 'fox'
                    ? 'bg-foreground text-background shadow-sm dark:bg-sky-100 dark:text-slate-950 dark:shadow-[0_0_18px_rgba(186,235,255,0.28)]'
                    : 'text-muted-foreground hover:text-foreground dark:text-white/55 dark:hover:text-white'
                )}
              >
                <PawPrint className='size-4' />
                <span className='hidden sm:inline'>{t('Fox')}</span>
              </button>
            </div>
            <div className='border-border/60 bg-background/70 rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:[&_button]:text-white dark:[&_button:hover]:bg-white/10'>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <div className='grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1fr)] lg:py-4'>
          <div className='relative z-10 max-w-2xl'>
            <div className='mb-8 inline-flex items-center gap-2 text-xs font-bold tracking-[0.24em] text-sky-600 uppercase dark:text-sky-300'>
              <Sparkles className='size-4' />
              {t('AI API Gateway')}
            </div>

            <h1 className='text-foreground max-w-[12ch] text-6xl leading-[0.95] font-black tracking-normal sm:text-7xl lg:text-8xl xl:text-9xl dark:text-white'>
              {loading ? t('AI Gateway') : heroName}
            </h1>

            <div className='mt-8 max-w-[38rem] space-y-5'>
              <p className='text-foreground text-xl leading-tight font-semibold sm:text-2xl dark:text-white'>
                {t('Stable routing for global developers, in one step.')}
              </p>
              <p className='text-muted-foreground text-base leading-8 sm:text-lg dark:text-white/58'>
                {t(
                  'Monitor grouped account health automatically, isolate abnormal upstreams, and reassign requests during cooldown until healthy routing is restored.'
                )}
              </p>
              <p className='text-muted-foreground text-base leading-8 sm:text-lg dark:text-white/58'>
                {t(
                  'High-performance forwarding, precise quotas, stable failover, and secure operations.'
                )}
              </p>
            </div>

            <div className='mt-10 flex flex-wrap items-center gap-4'>
              {props.isAuthenticated ? (
                <Button
                  className='bg-foreground text-background hover:bg-foreground/90 group h-12 rounded-full px-6 text-sm font-bold shadow-[0_0_36px_rgba(15,23,42,0.12)] dark:bg-white dark:text-slate-950 dark:shadow-[0_0_36px_rgba(255,255,255,0.2)] dark:hover:bg-white/90'
                  render={<Link to='/dashboard' />}
                >
                  {t('Go to Dashboard')}
                  <ArrowRight className='ml-2 size-4 transition-transform group-hover:translate-x-0.5' />
                </Button>
              ) : (
                <>
                  <Button
                    className='bg-foreground text-background hover:bg-foreground/90 h-12 rounded-full px-6 text-sm font-bold shadow-[0_0_36px_rgba(15,23,42,0.12)] dark:bg-white dark:text-slate-950 dark:shadow-[0_0_36px_rgba(255,255,255,0.2)] dark:hover:bg-white/90'
                    render={<Link to='/sign-in' />}
                  >
                    <LockKeyhole className='mr-2 size-4' />
                    {t('Sign in')}
                  </Button>
                  {status?.register_enabled === true && (
                    <Button
                      variant='outline'
                      className='border-border/60 bg-background/70 text-foreground hover:bg-muted/70 group h-12 rounded-full px-6 text-sm font-bold backdrop-blur-xl dark:border-white/14 dark:bg-white/[0.08] dark:text-white dark:hover:border-white/24 dark:hover:bg-white/[0.14] dark:hover:text-white'
                      render={<Link to='/sign-up' />}
                    >
                      {t('Create account')}
                      <ArrowRight className='ml-2 size-4 transition-transform group-hover:translate-x-0.5' />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <LandingModelScene visual={visual} />
        </div>

        <div className='text-muted-foreground/70 z-10 flex items-center justify-center gap-2 text-xs dark:text-white/35'>
          <span>{t('Scroll to learn more')}</span>
          <ChevronDown className='size-3.5' />
        </div>
      </div>
    </section>
  )
}
