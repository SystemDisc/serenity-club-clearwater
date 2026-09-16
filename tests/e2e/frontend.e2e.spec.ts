import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const publicPages = [
  '/',
  '/about',
  '/events',
  '/gallery',
  '/groups',
  '/meeting-schedule',
  '/policies',
  '/reach-out',
  '/shop',
  '/ways-to-give',
]

test.describe('Frontend', () => {
  test('gallery viewer supports keyboard, focus return, phone swipe, and bounded image loading', async ({
    page,
  }) => {
    await page.goto('/gallery')
    const first = page.getByRole('link', { name: /^Enlarge / }).first()
    await first.click()
    const viewer = page.getByRole('dialog')
    await expect(viewer).toBeVisible()
    await expect(viewer.getByText(/Photo 1 of/)).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(viewer.getByText(/Photo 2 of/)).toBeVisible()
    await page.keyboard.press('ArrowLeft')
    await expect(viewer.getByText(/Photo 1 of/)).toBeVisible()
    expect(await viewer.locator('img').count()).toBe(1)
    await expect
      .poll(() =>
        viewer
          .locator('img')
          .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBeTruthy()
    const accessibility = await new AxeBuilder({ page }).include('.club-gallery-dialog').analyze()
    expect(accessibility.violations).toEqual([])
    await page.keyboard.press('Escape')
    await expect(viewer).not.toBeVisible()
    await expect(first).toBeFocused()
    await page.setViewportSize({ width: 320, height: 700 })
    await first.click()
    await viewer
      .locator('.club-gallery-image')
      .dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 270, clientY: 200 }] })
    await viewer
      .locator('.club-gallery-image')
      .dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: 60, clientY: 200 }] })
    await expect(viewer.getByText(/Photo 2 of/)).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy()
    await viewer.getByRole('button', { name: 'Close photos ×' }).click()
    await expect(first).toBeFocused()
  })

  test('can load homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Serenity Club of Clearwater/)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Daily recovery meetings in downtown Clearwater',
      }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /Find a meeting/i })).toBeVisible()
  })

  test('anonymous pages do not check for a Payload admin session', async ({ page }) => {
    const adminSessionRequests: string[] = []

    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/users/me') {
        adminSessionRequests.push(request.url())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(adminSessionRequests).toEqual([])
  })

  test('unpublished search route returns a static not found response', async ({ page }) => {
    const response = await page.goto('/search')

    expect(response?.status()).toBe(404)
  })

  test('homepage passes its accessibility regression checks', async ({ page }) => {
    await page.goto('/')

    const results = await new AxeBuilder({ page })
      .withRules(['label-content-name-mismatch', 'color-contrast', 'heading-order'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('published pages use valid heading order', async ({ page }) => {
    for (const url of publicPages) {
      await page.goto(url)

      const results = await new AxeBuilder({ page }).withRules(['heading-order']).analyze()

      expect(results.violations, `Heading order violations on ${url}`).toEqual([])
    }
  })

  test('can navigate core public pages', async ({ page }) => {
    const pages = [
      ['/meeting-schedule', 'Find a meeting at Serenity Club'],
      ['/ways-to-give', 'Support Serenity Club'],
      ['/reach-out', 'Contact Serenity Club'],
      ['/gallery', 'Photos and flyers from Serenity Club'],
    ] as const

    for (const [url, heading] of pages) {
      await page.goto(url)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    }
  })

  test('redirects legacy portfolio page to gallery', async ({ page }) => {
    await page.goto('/portfolio')

    await expect(page).toHaveURL(/\/gallery$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Photos and flyers from Serenity Club' }),
    ).toBeVisible()
  })

  test('mobile navigation stays compact and opens the full menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/ways-to-give')

    const headerHeight = await page
      .locator('header')
      .evaluate((element) => Math.round(element.getBoundingClientRect().height))

    expect(headerHeight).toBeLessThanOrEqual(82)

    await page.getByRole('button', { name: 'Open navigation menu' }).click()
    await expect(
      page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', {
        name: 'Policies',
      }),
    ).toBeVisible()
  })
})
