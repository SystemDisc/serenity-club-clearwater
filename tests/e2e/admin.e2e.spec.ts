import { test, expect, Page } from '@playwright/test'
import sharp from 'sharp'
import { login } from '../helpers/login'
import {
  seedTestUser,
  cleanupTestUser,
  testUser,
  queuePublication,
  cleanupFlyerTest,
  cleanupPhotoBatchTest,
} from '../helpers/seedUser'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { testServerURL } from '../helpers/environment'
import { fallbackClubSettings } from '../../src/serenity/content'

test.describe('Admin Panel', () => {
  let page: Page

  test.setTimeout(90_000)

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('shared settings update repeated contact text and restore a saved version', async ({
    request,
    browser,
  }) => {
    const { token } = await (await request.post('/api/users/login', { data: testUser })).json()
    const headers = { authorization: `JWT ${token}` }
    const original = await (
      await request.get('/api/globals/clubSettings?depth=0', { headers })
    ).json()
    const visitor = await browser.newContext()
    const publicPage = await visitor.newPage()
    const hours = `Fixture clubhouse hours ${Date.now()}`
    try {
      await request.post('/api/globals/clubSettings', { headers, data: original })
      const versions = await (
        await request.get('/api/globals/clubSettings/versions?limit=1&sort=-updatedAt', { headers })
      ).json()
      await publicPage.goto('/reach-out')
      await page.goto('/admin/globals/clubSettings')
      await page.getByRole('textbox', { name: 'Hours', exact: true }).fill(hours)
      await expect(
        page.getByRole('link', { name: 'Check this address on Google Maps ↗' }),
      ).toHaveAttribute('href', /query=/)
      const save = page.waitForResponse(
        (response) =>
          response.url().includes('/api/globals/clubSettings') &&
          response.request().method() === 'POST',
      )
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      expect((await save).ok()).toBeTruthy()
      await expect
        .poll(async () => {
          await publicPage.reload()
          return publicPage.getByText(hours, { exact: true }).count()
        })
        .toBe(2)
      await expect(publicPage.locator('main')).toContainText(hours)
      expect(
        (
          await request.post(`/api/globals/clubSettings/versions/${versions.docs[0].id}`, {
            headers,
          })
        ).ok(),
      ).toBeTruthy()
      await expect
        .poll(async () => {
          await publicPage.reload()
          return publicPage.getByText(hours, { exact: true }).count()
        })
        .toBe(0)
      await page.reload()
      await expect(page.getByRole('textbox', { name: 'Hours', exact: true })).toHaveValue(
        original.hours,
      )
      await expect(page.getByRole('link', { name: /Previous versions/ }).first()).toBeVisible()
    } finally {
      await request.post('/api/globals/clubSettings', { headers, data: original })
      await visitor.close()
    }
  })

  for (const [destination, count] of [
    ['main', 30],
    ['new', 50],
  ] as const) {
    test(`photo batch publishes ${count} ${destination} photos with refresh and retry`, async ({
      browser,
    }) => {
      test.setTimeout(180_000)
      const title = `Batch browser ${destination} ${Date.now()}`
      const visitor = await browser.newContext()
      const publicPage = await visitor.newPage()
      let batchID: number | undefined
      try {
        await publicPage.goto('/gallery')
        await page.goto('/admin/photos')
        await page.getByLabel('Shared photo or album name').fill(title)
        await page.getByLabel('Where should they appear?').selectOption(destination)
        await page.getByRole('button', { name: 'Continue to choose photos' }).click()
        await expect(page).toHaveURL(/batch=\d+/)
        batchID = Number(new URL(page.url()).searchParams.get('batch'))
        const files = await Promise.all(
          Array.from({ length: count }, async (_, index) => ({
            name: `${title}-${index}.png`,
            mimeType: 'image/png',
            buffer: await sharp({
              create: {
                width: 100 + index,
                height: 80,
                channels: 3,
                background: { r: destination === 'main' ? 30 : 120, g: index * 4, b: 65 },
              },
            })
              .png()
              .toBuffer(),
          })),
        )
        let interrupted = false
        await page.route('**/api/media', async (route) => {
          if (!interrupted && route.request().method() === 'POST') {
            interrupted = true
            await route.fulfill({
              status: 503,
              contentType: 'application/json',
              body: JSON.stringify({
                errors: [{ message: 'Test interrupted upload. Try again.' }],
              }),
            })
          } else await route.continue()
        })
        await page.getByLabel('Choose photos', { exact: true }).setInputFiles(files)
        await expect(page.getByRole('button', { name: 'Retry unfinished uploads' })).toBeEnabled({
          timeout: 90_000,
        })
        await expect(
          page.getByText(`${count - 1} ready to review · 1 need attention · 0 published`, {
            exact: true,
          }),
        ).toBeVisible()
        await page.reload()
        await expect(page.getByRole('article')).toHaveCount(count)
        await page.getByLabel('Choose photos', { exact: true }).setInputFiles(files)
        await expect(
          page.getByRole('button', { name: `Publish ${count} photos`, exact: true }),
        ).toBeEnabled({ timeout: 90_000 })
        await expect(page.getByRole('article')).toHaveCount(count)
        const first = page.getByRole('article').first()
        await first.getByLabel('Caption shown below this photo').fill('Reviewed club photo')
        await first.getByRole('button', { name: 'Save photo details' }).click()
        await expect(
          page.getByRole('button', { name: `Publish ${count} photos`, exact: true }),
        ).toBeEnabled()
        if (destination === 'new') {
          await first.getByRole('button', { name: 'Make album cover' }).click()
          await expect(page.getByRole('heading', { name: 'Album cover crop' })).toBeVisible()
        }
        await page.setViewportSize({ width: 320, height: 800 })
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBeTruthy()
        await page.setViewportSize({ width: 1280, height: 900 })
        await page.getByRole('button', { name: `Publish ${count} photos`, exact: true }).click()
        await expect(page.getByText('Published on the website.', { exact: true })).toBeVisible({
          timeout: 60_000,
        })
        const href = await page
          .getByRole('link', { name: 'View on website ↗', exact: true })
          .getAttribute('href')
        await publicPage.goto(href!)
        await expect(
          publicPage.getByRole('heading', {
            name: destination === 'new' ? title : `${title} — 1`,
            exact: true,
          }),
        ).toBeVisible()
        if (destination === 'new') {
          await publicPage.goto(`${href}/page/3`)
          await expect(
            publicPage.getByRole('heading', { name: `${title} — 50`, exact: true }),
          ).toBeVisible()
        }
        await page.reload()
        await expect(page.getByRole('article')).toHaveCount(count)
        await expect(
          page.getByText(`0 ready to review · 0 need attention · ${count} published`, {
            exact: true,
          }),
        ).toBeVisible()
      } finally {
        await page.unroute('**/api/media')
        if (batchID) await cleanupPhotoBatchTest(batchID)
        await visitor.close()
      }
    })
  }

  test('trashes and restores a gallery placement while protecting its shared file', async ({
    request,
    browser,
  }) => {
    const auth = await request.post('/api/users/login', { data: testUser })
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const visitor = await browser.newContext()
    const publicPage = await visitor.newPage()
    const title = `Trash recovery regression ${Date.now()}`
    let photoID: number | undefined
    let imageID: number | undefined
    try {
      const media = await request.post('/api/media', {
        headers,
        multipart: {
          _payload: JSON.stringify({ alt: title }),
          file: {
            name: 'trash-recovery.png',
            mimeType: 'image/png',
            buffer: await sharp({
              create: { width: 80, height: 50, channels: 3, background: '#578e6b' },
            })
              .png()
              .toBuffer(),
          },
        },
      })
      expect(media.ok(), await media.text()).toBeTruthy()
      const file = (await media.json()).doc
      imageID = file.id
      const photo = await request.post('/api/galleryItems', {
        headers,
        data: { title, image: imageID, order: -9000, _status: 'published' },
      })
      expect(photo.ok(), await photo.text()).toBeTruthy()
      photoID = (await photo.json()).doc.id
      await publicPage.goto('/gallery')
      await expect(publicPage.getByRole('heading', { name: title, exact: true })).toBeVisible()
      expect(
        (
          await request.patch(`/api/galleryItems/${photoID}`, {
            headers,
            data: { deletedAt: new Date().toISOString() },
          })
        ).ok(),
      ).toBeTruthy()
      await expect
        .poll(async () => {
          await publicPage.reload()
          return publicPage.getByRole('heading', { name: title, exact: true }).count()
        })
        .toBe(0)
      expect((await request.get(file.url)).status()).toBe(200)
      expect((await request.delete(`/api/media/${imageID}`, { headers })).status()).toBe(409)
      expect(
        (
          await request.patch(`/api/galleryItems/${photoID}?trash=true`, {
            headers,
            data: { deletedAt: null },
          })
        ).ok(),
      ).toBeTruthy()
      await expect
        .poll(async () => {
          await publicPage.reload()
          return publicPage.getByRole('heading', { name: title, exact: true }).count()
        })
        .toBe(1)
      await expect(publicPage.getByRole('img', { name: title, exact: true })).toBeVisible()
      const uses = await (await request.get(`/api/media/${imageID}/usage`, { headers })).json()
      expect(uses.uses.some((use: { title: string }) => use.title === title)).toBeTruthy()
    } finally {
      if (photoID) await request.delete(`/api/galleryItems/${photoID}?trash=true`, { headers })
      if (imageID) await request.delete(`/api/media/${imageID}?trash=true`, { headers })
      await visitor.close()
    }
  })

  test('publishes and hides a complete album without leaking its photos into the main gallery', async ({
    request,
    browser,
  }) => {
    const auth = await request.post('/api/users/login', { data: testUser })
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const visitor = await browser.newContext()
    const publicPage = await visitor.newPage()
    const title = `Album publishing regression ${Date.now()}`
    let imageID: number | undefined
    let albumID: number | undefined
    let photoID: number | undefined
    try {
      const media = await request.post('/api/media', {
        headers,
        multipart: {
          _payload: JSON.stringify({ alt: 'Synthetic album cover' }),
          file: {
            name: 'album-regression.png',
            mimeType: 'image/png',
            buffer: await sharp({
              create: { width: 600, height: 400, channels: 3, background: '#176b50' },
            })
              .png()
              .toBuffer(),
          },
        },
      })
      expect(media.ok(), await media.text()).toBeTruthy()
      imageID = (await media.json()).doc.id
      const album = await request.post('/api/albums', {
        headers,
        data: { title, cover: imageID, _status: 'draft' },
      })
      expect(album.ok(), await album.text()).toBeTruthy()
      const doc = (await album.json()).doc
      albumID = doc.id
      const photo = await request.post('/api/galleryItems', {
        headers,
        data: { title: `${title} photo`, image: imageID, album: albumID, _status: 'published' },
      })
      expect(photo.ok(), await photo.text()).toBeTruthy()
      photoID = (await photo.json()).doc.id
      await publicPage.goto('/gallery')
      await expect(publicPage.getByRole('heading', { name: title, exact: true })).toHaveCount(0)
      const albumURL = `/gallery/albums/${doc.slug}`
      expect((await publicPage.goto(albumURL))?.status()).toBe(404)
      expect(
        (
          await request.patch(`/api/albums/${albumID}`, { headers, data: { _status: 'published' } })
        ).ok(),
      ).toBeTruthy()
      await expect.poll(async () => (await publicPage.goto(albumURL))?.status()).toBe(200)
      await expect(
        publicPage.getByRole('heading', { name: `${title} photo`, exact: true }),
      ).toBeVisible()
      await publicPage.goto('/gallery')
      await expect(publicPage.getByRole('heading', { name: title, exact: true })).toBeVisible()
      await expect(
        publicPage.getByRole('heading', { name: `${title} photo`, exact: true }),
      ).toHaveCount(0)
      expect(
        (
          await request.patch(`/api/albums/${albumID}`, { headers, data: { _status: 'draft' } })
        ).ok(),
      ).toBeTruthy()
      await expect.poll(async () => (await publicPage.goto(albumURL))?.status()).toBe(404)
      await publicPage.goto('/gallery')
      await expect(publicPage.getByRole('heading', { name: title, exact: true })).toHaveCount(0)
    } finally {
      if (photoID) await request.delete(`/api/galleryItems/${photoID}`, { headers })
      if (albumID) await request.delete(`/api/albums/${albumID}`, { headers })
      if (imageID) await request.delete(`/api/media/${imageID}`, { headers })
      await visitor.close()
    }
  })

  test('separates one meeting day without changing the other days', async ({ request }) => {
    const auth = await request.post('/api/users/login', { data: testUser })
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const created = await request.post('/api/meetings', {
      headers,
      data: {
        name: 'Synthetic day editor',
        fellowship: 'AA',
        sessions: [
          {
            key: 'base',
            recurrence: 'weekly',
            days: ['Monday', 'Tuesday'],
            time: '10:00',
            format: 'discussion',
            attendance: 'everyone',
            confirmed: true,
          },
        ],
        _status: 'draft',
      },
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const id = (await created.json()).doc.id
    try {
      await page.goto(`/admin/collections/meetings/${id}`)
      await page.getByRole('button', { name: 'Separate Monday at 10:00 AM' }).click()
      await expect(
        page.getByRole('status').filter({ hasText: 'Monday now has its own session' }),
      ).toBeVisible()
      await page.getByLabel('Meeting format', { exact: true }).nth(1).selectOption('book')
      const savedRequest = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/meetings/${id}`) && response.request().method() === 'PATCH',
      )
      await page.getByRole('button', { name: 'Save Draft', exact: true }).click()
      const savedResponse = await savedRequest
      expect(savedResponse.ok(), await savedResponse.text()).toBeTruthy()
      const saved = await (await request.get(`/api/meetings/${id}?draft=true`, { headers })).json()
      expect(saved.sessions).toHaveLength(2)
      expect(
        saved.sessions.find((session: { days: string[] }) => session.days.includes('Monday'))
          .format,
      ).toBe('book')
      expect(
        saved.sessions.find((session: { days: string[] }) => session.days.includes('Tuesday'))
          .format,
      ).toBe('discussion')
      await page.goto('/admin/meetings')
      await page.getByRole('searchbox', { name: 'Find a group' }).fill('Synthetic day editor')
      await expect(page.getByRole('link', { name: 'Synthetic day editor' }).first()).toBeVisible()
      await page.setViewportSize({ width: 320, height: 740 })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBeTruthy()
    } finally {
      await page.setViewportSize({ width: 1280, height: 720 })
      await request.delete(`/api/meetings/${id}`, { headers })
    }
  })

  test('previews and publishes dues text without exposing a draft', async ({
    request,
    browser,
  }) => {
    const auth = await request.post('/api/users/login', { data: testUser })
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const original = await (
      await request.get('/api/globals/duesReminder?depth=0', { headers })
    ).json()
    const visitor = await browser.newContext()
    const publicPage = await visitor.newPage()
    const message = `Membership reminder regression ${Date.now()}`
    try {
      await publicPage.goto('/about')
      await page.goto('/admin/globals/duesReminder')
      await page.getByLabel('How should the reminder work? *').selectOption('automatic')
      await page.getByRole('textbox', { name: 'Message below the month' }).fill(message)
      await page.getByRole('button', { name: 'Next month', exact: true }).click()
      await expect(page.getByRole('heading', { name: /It’s time to pay your/ })).toBeVisible()
      await page.getByRole('button', { name: 'Show phone width' }).click()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBeTruthy()
      await page.getByRole('button', { name: 'This month', exact: true }).click()
      await page.getByRole('button', { name: 'Save Draft', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Save Draft', exact: true })).toBeDisabled()
      await publicPage.reload()
      await expect(publicPage.getByText(message, { exact: true })).toHaveCount(0)
      await page.getByRole('button', { name: 'Publish changes', exact: true }).click()
      await expect(page.getByText('Status: Published', { exact: false })).toBeVisible()
      await expect
        .poll(async () => {
          await publicPage.reload()
          return publicPage.getByText(message, { exact: true }).count()
        })
        .toBe(1)
      await page.getByLabel('How should the reminder work? *').selectOption('off')
      await page.getByRole('button', { name: 'Publish changes', exact: true }).click()
      await expect
        .poll(async () => {
          await publicPage.reload()
          return publicPage.getByText(message, { exact: true }).count()
        })
        .toBe(0)
    } finally {
      expect(
        (await request.post('/api/globals/duesReminder', { headers, data: original })).ok(),
      ).toBeTruthy()
      await visitor.close()
    }
  })

  test('refreshes recurring event dates when its authoritative meeting changes', async ({
    request,
    browser,
  }) => {
    const auth = await request.post('/api/users/login', { data: testUser })
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const visitor = await browser.newContext()
    const publicPage = await visitor.newPage()
    const title = `Recurring event regression ${Date.now()}`
    let meetingID: number | undefined
    let eventID: number | undefined
    const session = {
      recurrence: 'weekly',
      key: 'daily-test',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      time: '04:17',
      format: 'unknown',
      attendance: 'unknown',
      confirmed: false,
    }
    try {
      await publicPage.goto('/events')
      const meeting = await request.post('/api/meetings', {
        headers,
        data: { name: title, fellowship: 'Club', sessions: [session], _status: 'published' },
      })
      expect(meeting.ok(), await meeting.text()).toBeTruthy()
      meetingID = (await meeting.json()).doc.id
      const event = await request.post('/api/events', {
        headers,
        data: {
          title,
          kind: 'meeting',
          meeting: meetingID,
          summary: 'Synthetic recurring test',
          _status: 'published',
        },
      })
      expect(event.ok(), await event.text()).toBeTruthy()
      eventID = (await event.json()).doc.id
      const card = publicPage
        .locator('article')
        .filter({ has: publicPage.getByRole('heading', { name: title, exact: true }) })
      await expect
        .poll(async () => {
          await publicPage.reload()
          return card.textContent()
        })
        .toContain('4:17 AM')
      const changed = await request.patch(`/api/meetings/${meetingID}`, {
        headers,
        data: { sessions: [{ ...session, time: '04:23' }] },
      })
      expect(changed.ok(), await changed.text()).toBeTruthy()
      await expect
        .poll(async () => {
          await publicPage.reload()
          return card.textContent()
        })
        .toContain('4:23 AM')
      const hidden = await request.patch(`/api/meetings/${meetingID}`, {
        headers,
        data: { _status: 'draft' },
      })
      expect(hidden.ok(), await hidden.text()).toBeTruthy()
      await expect
        .poll(async () => {
          await publicPage.reload()
          return card.count()
        })
        .toBe(0)
    } finally {
      if (eventID) await request.delete(`/api/events/${eventID}`, { headers })
      if (meetingID) await request.delete(`/api/meetings/${meetingID}`, { headers })
      await visitor.close()
    }
  })

  test('publishes, edits, unpublishes, republishes, and deletes gallery content without rebuilding', async ({
    request,
    playwright,
  }) => {
    const auth = await request.post('/api/users/login', { data: testUser })
    expect(auth.ok()).toBeTruthy()
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const title = `Publishing regression ${Date.now()}`
    const publicClients = await Promise.all(
      Array.from({ length: 2 }, () => playwright.request.newContext({ baseURL: testServerURL })),
    )
    let id: number | undefined
    const visible = async (text: string, present: boolean) => {
      for (const client of publicClients) {
        await expect
          .poll(async () => (await (await client.get('/gallery')).text()).includes(text))
          .toBe(present)
      }
    }
    try {
      await Promise.all(publicClients.map((client) => client.get('/gallery'))) // warm the public cache before creating anything
      const created = await request.post('/api/galleryItems', {
        headers,
        data: {
          title,
          order: -1000,
          _status: 'published',
          externalImageUrl: fallbackClubSettings.heroImageUrl,
        },
      })
      expect(created.ok(), await created.text()).toBeTruthy()
      id = (await created.json()).doc.id
      await visible(title, true)
      expect(
        (
          await request.patch(`/api/galleryItems/${id}`, {
            headers,
            data: { title: `${title} edited` },
          })
        ).ok(),
      ).toBeTruthy()
      await visible(`${title} edited`, true)
      expect(
        (
          await request.patch(`/api/galleryItems/${id}`, { headers, data: { _status: 'draft' } })
        ).ok(),
      ).toBeTruthy()
      await visible(title, false)
      expect(
        (
          await request.patch(`/api/galleryItems/${id}`, {
            headers,
            data: { _status: 'published' },
          })
        ).ok(),
      ).toBeTruthy()
      await visible(`${title} edited`, true)
      expect((await request.delete(`/api/galleryItems/${id}`, { headers })).ok()).toBeTruthy()
      id = undefined
      await visible(title, false)
    } finally {
      if (id) await request.delete(`/api/galleryItems/${id}`, { headers })
      await Promise.all(publicClients.map((client) => client.dispose()))
    }
  })

  test('keeps more than 100 gallery records accessible through stable pages', async ({
    request,
    page: galleryPage,
  }) => {
    test.setTimeout(180_000)
    const auth = await request.post('/api/users/login', { data: testUser })
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const prefix = `Pagination regression ${Date.now()} `
    const ids: number[] = []
    try {
      for (let start = 0; start < 109; start += 6) {
        await Promise.all(
          Array.from({ length: Math.min(6, 109 - start) }, async (_, offset) => {
            const response = await request.post('/api/galleryItems', {
              headers,
              data: {
                title: `${prefix}${start + offset}`,
                order: -2000,
                _status: 'published',
                externalImageUrl: fallbackClubSettings.heroImageUrl,
              },
            })
            expect(response.ok()).toBeTruthy()
            ids.push((await response.json()).doc.id)
          }),
        )
      }
      const titles: string[] = []
      for (let number = 1; number <= 5; number++) {
        await galleryPage.goto(number === 1 ? '/gallery' : `/gallery/page/${number}`)
        titles.push(
          ...(await galleryPage.locator('figure h2').allTextContents()).filter((title) =>
            title.startsWith(prefix),
          ),
        )
      }
      expect(titles).toHaveLength(109)
      expect(new Set(titles).size).toBe(109)
      expect((await request.get('/gallery/page/99999')).status()).toBe(404)
    } finally {
      for (const id of ids)
        expect((await request.delete(`/api/galleryItems/${id}`, { headers })).ok()).toBeTruthy()
    }
  })

  test('runs authenticated scheduled publish and unpublish jobs', async ({
    request,
    playwright,
  }) => {
    const auth = await request.post('/api/users/login', { data: testUser })
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const slug = `scheduled-regression-${Date.now()}`
    const created = await request.post('/api/pages', {
      headers,
      data: {
        title: 'Scheduled regression',
        slug,
        hero: { type: 'none' },
        layout: [{ blockType: 'content', columns: [] }],
        _status: 'draft',
      },
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const id = (await created.json()).doc.id
    const publicClient = await playwright.request.newContext({ baseURL: testServerURL })
    try {
      expect((await publicClient.get('/api/payload-jobs/run')).status()).toBe(401)
      expect((await publicClient.get(`/${slug}`)).status()).toBe(404)
      await queuePublication(id, 'publish')
      expect(
        (
          await publicClient.get('/api/payload-jobs/run?limit=10', {
            headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
          })
        ).ok(),
      ).toBeTruthy()
      await expect.poll(async () => (await publicClient.get(`/${slug}`)).status()).toBe(200)
      await queuePublication(id, 'unpublish')
      expect(
        (
          await publicClient.get('/api/payload-jobs/run?limit=10', {
            headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
          })
        ).ok(),
      ).toBeTruthy()
      await expect.poll(async () => (await publicClient.get(`/${slug}`)).status()).toBe(404)
    } finally {
      await request.delete(`/api/pages/${id}`, { headers })
      await publicClient.dispose()
    }
  })

  test('can navigate to dashboard', async () => {
    await page.goto(`${testServerURL}/admin`)
    await expect(page).toHaveURL(`${testServerURL}/admin`)
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Manage the website' })).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Update dues reminder', exact: true }),
    ).toBeVisible()
  })

  test('selects a recognizable library photo and saves it on a draft', async ({ request }) => {
    const auth = await request.post('/api/users/login', { data: testUser })
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const image = await request.post('/api/media', {
      headers,
      multipart: {
        _payload: JSON.stringify({ alt: 'Photo picker test image' }),
        file: {
          name: 'photo-picker-test.png',
          mimeType: 'image/png',
          buffer: await sharp({
            create: { width: 600, height: 400, channels: 3, background: '#176b50' },
          })
            .png()
            .toBuffer(),
        },
      },
    })
    expect(image.ok(), await image.text()).toBeTruthy()
    const imageID = (await image.json()).doc.id
    const created = await request.post('/api/galleryItems?draft=true', {
      headers,
      data: { title: 'Photo picker regression', _status: 'draft' },
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const id = (await created.json()).doc.id
    try {
      await page.goto(`/admin/collections/galleryItems/${id}`)
      const choose = page.getByRole('button', { name: 'Choose from photo grid' })
      await choose.click()
      const dialog = page.getByRole('dialog', { name: 'Choose an existing photo' })
      await expect(dialog.getByRole('button', { name: 'Use this photo' }).first()).toBeVisible()
      await expect
        .poll(() =>
          dialog
            .locator('img')
            .first()
            .evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0)
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      await expect(choose).toBeFocused()
      await choose.click()
      await dialog.getByRole('button', { name: 'Use this photo' }).first().click()
      await expect(dialog).not.toBeVisible()
      await expect(page.getByRole('link', { name: 'View full size ↗' })).toBeVisible()
      await page.getByRole('button', { name: 'Save Draft', exact: true }).click()
      await expect
        .poll(async () => {
          const doc = await (
            await request.get(`/api/galleryItems/${id}?draft=true&depth=0`, { headers })
          ).json()
          return typeof doc.image
        })
        .toBe('number')
      await page.reload()
      await expect(page.getByRole('link', { name: 'View full size ↗' })).toBeVisible()
    } finally {
      await request.delete(`/api/galleryItems/${id}`, { headers })
      await request.delete(`/api/media/${imageID}`, { headers })
    }
  })

  test('keeps task navigation usable at phone width and protects custom admin pages', async ({
    browser,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    try {
      await page.goto('/admin')
      await expect(page.getByRole('heading', { name: 'Manage the website' })).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBeTruthy()
      await page.goto('/admin/help')
      await expect(page.getByRole('heading', { name: 'Help & website sections' })).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBeTruthy()
    } finally {
      await page.setViewportSize({ width: 1280, height: 720 })
    }
    const anonymous = await browser.newContext()
    try {
      const visitor = await anonymous.newPage()
      for (const path of ['/admin/help', '/admin/tools']) {
        await visitor.goto(path)
        await expect(visitor).toHaveURL(/\/admin\/login/)
      }
    } finally {
      await anonymous.close()
    }
  })

  test('can navigate to list view', async () => {
    await page.goto(`${testServerURL}/admin/collections/users`)
    await expect(page).toHaveURL((url) => url.pathname === '/admin/collections/users')
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('retains a Word original through conversion, retry, replacement, and a multi-page failure', async ({
    request,
    playwright,
  }) => {
    test.setTimeout(180_000)
    const visitor = await playwright.request.newContext({ baseURL: testServerURL })
    const auth = await request.post('/api/users/login', { data: testUser })
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const sourceIDs: number[] = [],
      imageIDs: number[] = []
    let flyerID: number | undefined
    const source = await readFile('tests/fixtures/one-page-flyer.docx')
    const uploadedSourceIDs = new Set<number>()
    const trackSource = (response: import('@playwright/test').Response) => {
      if (
        response.url().endsWith('/api/sourceDocuments') &&
        response.request().method() === 'POST' &&
        response.status() === 201
      )
        void response.json().then((body) => {
          if (typeof body.doc?.id === 'number') uploadedSourceIDs.add(body.doc.id)
        })
    }
    page.on('response', trackSource)
    try {
      await page.goto('/admin/collections/monthlyFlyers/create')
      await page.getByLabel('Month *', { exact: true }).fill('2299-01')
      await page
        .getByLabel('Flyer details in text', { exact: false })
        .fill('Synthetic test flyer. These are test details, not club events.')
      await page
        .getByLabel('Choose Word document')
        .setInputFiles('tests/fixtures/one-page-flyer.docx')
      await expect(page.getByText('Flyer image ready.', { exact: false })).toBeVisible({
        timeout: 120_000,
      })
      await page.getByRole('button', { name: 'Save Draft', exact: true }).click()
      await expect(page).toHaveURL(/\/monthlyFlyers\/\d+$/)
      flyerID = Number(page.url().split('/').pop())
      const draft = await (
        await request.get(`/api/monthlyFlyers/${flyerID}?draft=true&depth=0`, { headers })
      ).json()
      sourceIDs.push(draft.sourceDocument)
      imageIDs.push(draft.image)
      const original = await (
        await request.get(`/api/sourceDocuments/${draft.sourceDocument}`, { headers })
      ).json()
      expect(original.sha256).toBe(createHash('sha256').update(source).digest('hex'))
      await expect((await request.get(original.url, { headers })).body()).resolves.toEqual(source)
      expect((await visitor.get(`/api/monthlyFlyers/${flyerID}`)).status()).toBe(404)
      const repeated = await request.post(`/api/sourceDocuments/${draft.sourceDocument}/convert`, {
        headers,
      })
      expect((await repeated.json()).image.id).toBe(draft.image)
      expect(
        (
          await request.patch(`/api/sourceDocuments/${draft.sourceDocument}`, {
            headers,
            data: { sha256: 'changed' },
          })
        ).status(),
      ).toBe(403)
      await page
        .getByLabel('Choose Word document')
        .setInputFiles('tests/fixtures/two-page-flyer.docx')
      await expect(page.getByRole('alert').filter({ hasText: '2 pages' })).toBeVisible({
        timeout: 120_000,
      })
      await page.getByRole('button', { name: 'Save Draft', exact: true }).click()
      await expect
        .poll(
          async () =>
            (
              await (
                await request.get(`/api/monthlyFlyers/${flyerID}?draft=true&depth=0`, { headers })
              ).json()
            ).sourceDocument,
        )
        .not.toBe(draft.sourceDocument)
      const failedDraft = await (
        await request.get(`/api/monthlyFlyers/${flyerID}?draft=true&depth=0`, { headers })
      ).json()
      sourceIDs.push(failedDraft.sourceDocument)
      expect(failedDraft.image).toBe(draft.image)
      expect(
        (await request.get(`/api/sourceDocuments/${failedDraft.sourceDocument}`, { headers })).ok(),
      ).toBeTruthy()
      expect(
        (
          await request.patch(`/api/monthlyFlyers/${flyerID}`, {
            headers,
            data: { _status: 'published' },
          })
        ).status(),
      ).toBe(400)
      await page
        .getByLabel('Choose Word document')
        .setInputFiles('tests/fixtures/one-page-flyer.docx')
      await expect(page.getByText('Flyer image ready.', { exact: false })).toBeVisible({
        timeout: 120_000,
      })
      await page.getByRole('button', { name: 'Publish changes', exact: true }).click()
      await expect
        .poll(async () => (await visitor.get(`/api/monthlyFlyers/${flyerID}`)).status())
        .toBe(200)
      const published = await (
        await request.get(`/api/monthlyFlyers/${flyerID}?depth=0`, { headers })
      ).json()
      sourceIDs.push(published.sourceDocument)
      imageIDs.push(published.image)
      expect(published.sourceDocument).not.toBe(draft.sourceDocument)
      await expect((await request.get(original.url, { headers })).body()).resolves.toEqual(source)
    } finally {
      page.off('response', trackSource)
      await visitor.dispose()
      await cleanupFlyerTest(
        flyerID,
        [...new Set(imageIDs)],
        [...new Set([...sourceIDs, ...uploadedSourceIDs])],
      )
    }
  })

  test('can navigate to edit view', async () => {
    await page.goto(`${testServerURL}/admin/collections/pages/create`)
    await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="title"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
