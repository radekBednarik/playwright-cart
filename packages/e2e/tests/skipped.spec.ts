import { expect, test } from '@playwright/test'

// Static suite-level skip — entire describe never runs
test.describe
  .skip('skipped suite — static describe.skip()', { tag: '@skip-demo' }, () => {
    test('this would pass', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveTitle('Demo Todo App')
    })

    test('this would also pass', async ({ page }) => {
      await page.goto('/')
      await expect(page.locator('[data-testid="todo-input"]')).toBeVisible()
    })
  })

test.describe('mixed suite — skips alongside passing and failing', { tag: '@skip-demo' }, () => {
  // Static test-level skip
  test.skip('static skip — test.skip()', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Demo Todo App')
  })

  // Passing test
  test('passes — homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Demo Todo App')
  })

  // Dynamic skip based on condition (always true here to force skip)
  test('dynamic skip — test.skip(condition)', async ({ page }) => {
    test.skip(true, 'skipped dynamically — feature not available in this environment')
    await page.goto('/')
    await expect(page.locator('[data-testid="nonexistent"]')).toBeVisible()
  })

  // Failing test mixed in
  test('fails — intentional failure', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="nonexistent-element"]')).toBeVisible({ timeout: 3000 })
  })

  // test.fixme() — treated as skip by Playwright
  test.fixme('fixme — known broken, skip for now', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="nonexistent-element"]')).toBeVisible()
  })

  // Another passing test to round out the mix
  test('passes — can add a todo', async ({ page }) => {
    await page.goto('/')
    await page.fill('[data-testid="todo-input"]', 'Test skip mix')
    await page.click('[data-testid="add-button"]')
    await expect(page.locator('[data-testid="todo-list"]')).toContainText('Test skip mix')
  })
})
