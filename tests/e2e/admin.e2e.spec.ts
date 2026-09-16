import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'
import { testServerURL } from '../helpers/environment'

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

  test('publishes, edits, unpublishes, republishes, and deletes gallery content without rebuilding', async ({ request, playwright }) => {
    const auth = await request.post('/api/users/login', { data: testUser })
    expect(auth.ok()).toBeTruthy()
    const { token } = await auth.json()
    const headers = { authorization: `JWT ${token}` }
    const title = `Publishing regression ${Date.now()}`
    const publicClient = await playwright.request.newContext({ baseURL: testServerURL })
    let id: number | undefined
    const visible = async (text: string, present: boolean) => {
      for (let client = 0; client < 2; client++) {
        await expect.poll(async () => (await (await publicClient.get('/gallery')).text()).includes(text)).toBe(present)
      }
    }
    try {
      await publicClient.get('/gallery') // warm the public cache before creating anything
      const created = await request.post('/api/galleryItems', { headers, data: { title, order: -1000, _status: 'published' } })
      expect(created.ok()).toBeTruthy()
      id = (await created.json()).doc.id
      await visible(title, true)
      expect((await request.patch(`/api/galleryItems/${id}`, { headers, data: { title: `${title} edited` } })).ok()).toBeTruthy()
      await visible(`${title} edited`, true)
      expect((await request.patch(`/api/galleryItems/${id}`, { headers, data: { _status: 'draft' } })).ok()).toBeTruthy()
      await visible(title, false)
      expect((await request.patch(`/api/galleryItems/${id}`, { headers, data: { _status: 'published' } })).ok()).toBeTruthy()
      await visible(`${title} edited`, true)
      expect((await request.delete(`/api/galleryItems/${id}`, { headers })).ok()).toBeTruthy()
      id = undefined
      await visible(title, false)
    } finally {
      if (id) await request.delete(`/api/galleryItems/${id}`, { headers })
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
