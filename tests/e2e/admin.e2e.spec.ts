import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser, queuePublication } from '../helpers/seedUser'
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
  })

  test('can navigate to list view', async () => {
    await page.goto(`${testServerURL}/admin/collections/users`)
    await expect(page).toHaveURL((url) => url.pathname === '/admin/collections/users')
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto(`${testServerURL}/admin/collections/pages/create`)
    await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="title"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
