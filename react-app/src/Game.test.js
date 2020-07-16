import '@testing-library/jest-dom/extend-expect';

// import {
//   toBeInTheDocument,
//   toHaveClass,
// } from '@testing-library/jest-dom/matchers'
// expect.extend({toBeInTheDocument, toHaveClass})

const puppeteer = require('puppeteer');

describe('game', () => {
	test('loads', async () => {
		let browser = await puppeteer.launch({ headless: true });
		let page = await browser.newPage();
		await page.goto('http://localhost:3000');
		let game = await page.waitForSelector('#game');
		expect(game).not.toBeNull();
		let bg = await page.waitForSelector('#bg');
		expect(bg).toBeVisible();

		// console.log(bg)
		// expect().toBeVisible();
		// expect(page.waitForSelector('#fog')).not.toBeNull();


		// const html = await page.$eval('#game', e => e.innerHTML);
		// expect(html).toMatch(//);
		// browser.close();
	}, 3000);
});