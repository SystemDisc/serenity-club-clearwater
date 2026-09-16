import { test, expect, Page } from '@playwright/test'
import sharp from 'sharp'
import { login } from '../helpers/login'
import {
  seedTestUser,
  cleanupTestUser,
  testUser,
  queuePublication,
  cleanupFlyerTest,
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
