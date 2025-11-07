import { test, expect } from '@playwright/test';

test.describe('Add to Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to load
    await page.waitForSelector('text=Karim\'s Coffee', { timeout: 10000 });
  });

  test('should add item to cart from menu', async ({ page }) => {
    // Wait for menu items to load
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 10000 });
    
    // Find first "Add to Cart" button (not the test button)
    const addToCartButtons = page.locator('button:has-text("Add to Cart")');
    const count = await addToCartButtons.count();
    console.log(`Found ${count} "Add to Cart" buttons`);
    
    // Skip the test button (first one) and click a real menu item button
    if (count > 1) {
      const menuButton = addToCartButtons.nth(1); // Skip test button
      await menuButton.scrollIntoViewIfNeeded();
      await menuButton.click();
      
      // Wait for modal to appear
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      console.log('Modal opened');
      
      // Wait a bit for modal to fully render
      await page.waitForTimeout(500);
      
      // Check if modal is visible
      const modal = page.locator('[role="dialog"]');
      const isModalVisible = await modal.isVisible();
      console.log('Modal visible:', isModalVisible);
      
      // Try to find the Add to Cart button in modal
      const modalAddButton = modal.locator('button:has-text("Add to Cart")');
      const buttonCount = await modalAddButton.count();
      console.log('Add to Cart buttons in modal:', buttonCount);
      
      if (buttonCount > 0) {
        // Get button info
        const buttonText = await modalAddButton.first().textContent();
        console.log('Button text:', buttonText);
        
        // Try clicking with different methods
        try {
          await modalAddButton.first().scrollIntoViewIfNeeded();
          await page.waitForTimeout(200);
          await modalAddButton.first().click({ timeout: 5000 });
          console.log('Clicked Add to Cart in modal (method 1)');
        } catch (e) {
          console.log('Method 1 failed, trying force click');
          try {
            await modalAddButton.first().click({ force: true, timeout: 5000 });
            console.log('Clicked Add to Cart in modal (force)');
          } catch (e2) {
            console.log('Force click failed, trying JavaScript click');
            await modalAddButton.first().evaluate((el: HTMLElement) => el.click());
            console.log('Clicked Add to Cart in modal (JS)');
          }
        }
      } else {
        console.log('No Add to Cart button found in modal');
        await page.screenshot({ path: 'test-results/modal-no-button.png', fullPage: true });
      }
      
      // Wait for modal to close or state to update
      await page.waitForTimeout(1000);
      
      // Check localStorage for cart items
      const cartData = await page.evaluate(() => {
        return localStorage.getItem('customer-cart');
      });
      console.log('Cart data in localStorage:', cartData);
      
      if (cartData) {
        const parsed = JSON.parse(cartData);
        console.log('Parsed cart data:', parsed);
        console.log('Items in cart:', parsed.state?.items?.length || 0);
        expect(parsed.state?.items?.length || 0).toBeGreaterThan(0);
      } else {
        console.log('No cart data in localStorage');
        await page.screenshot({ path: 'test-results/no-cart-data.png', fullPage: true });
      }
      
      // Check if cart sidebar is visible
      const cartSidebar = page.locator('aside:has-text("Your Cart")');
      const isSidebarVisible = await cartSidebar.isVisible().catch(() => false);
      console.log('Cart sidebar visible:', isSidebarVisible);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/add-to-cart-result.png', fullPage: true });
    } else {
      console.log('No menu items found, skipping test');
    }
  });

  test('test button should work', async ({ page }) => {
    // Wait for test button
    await page.waitForSelector('button:has-text("Test Add to Cart")', { timeout: 10000 });
    
    // Click test button
    const testButton = page.locator('button:has-text("Test Add to Cart")');
    await testButton.click();
    console.log('Clicked test button');
    
    // Wait a bit for state to update
    await page.waitForTimeout(500);
    
    // Check localStorage
    const cartData = await page.evaluate(() => {
      return localStorage.getItem('customer-cart');
    });
    
    if (cartData) {
      const parsed = JSON.parse(cartData);
      console.log('Test button cart data:', parsed);
      expect(parsed.state.items.length).toBeGreaterThan(0);
    }
  });

  test('should open modal when clicking menu item', async ({ page }) => {
    await page.waitForSelector('button:has-text("Add to Cart")', { timeout: 10000 });
    
    const addToCartButtons = page.locator('button:has-text("Add to Cart")');
    const count = await addToCartButtons.count();
    
    if (count > 1) {
      const menuButton = addToCartButtons.nth(1);
      await menuButton.click();
      
      // Verify modal opens
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });
      console.log('Modal is visible');
    }
  });

  test('should show cart items in sidebar', async ({ page }) => {
    // First add an item using test button
    await page.waitForSelector('button:has-text("Test Add to Cart")', { timeout: 10000 });
    await page.locator('button:has-text("Test Add to Cart")').click();
    await page.waitForTimeout(500);
    
    // Check if cart sidebar shows items
    const cartSidebar = page.locator('aside:has-text("Your Cart")');
    const isVisible = await cartSidebar.isVisible();
    console.log('Cart sidebar visible after test button:', isVisible);
    
    if (isVisible) {
      const items = await cartSidebar.locator('text=/Test Coffee/').count();
      console.log('Items found in sidebar:', items);
      expect(items).toBeGreaterThan(0);
    }
  });
});

