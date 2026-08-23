import { test, expect } from '@playwright/test';

test.describe('Authentication and Routing Flows', () => {

  test('Unauthenticated user is redirected from protected route to login', async ({ page }) => {
    await page.goto('/client/home');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify error message
    const errorAlert = page.getByText('Incorrect email or password');
    await expect(errorAlert).toBeVisible();
  });

  // Since testing Google Auth or real Firebase Registration creates real DB entries
  // and requires avoiding captchas, a real E2E test suite usually connects to a Firebase Emulator
  // or uses dedicated test credentials. 
  // For demonstration, we check the UI structure of the Register pages.

  test('Client Registration page loads correctly', async ({ page }) => {
    await page.goto('/register/client');
    
    await expect(page.getByRole('heading', { name: 'Create client account' })).toBeVisible();
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('Tailor Registration page Step 1 loads correctly', async ({ page }) => {
    await page.goto('/register/tailor');
    
    await expect(page.getByRole('heading', { name: 'Create personal profile' })).toBeVisible();
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue to Shop Details →' })).toBeVisible();
  });

});
