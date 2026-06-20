import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
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
