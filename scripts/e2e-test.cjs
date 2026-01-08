const { chromium } = require('playwright');

(async () => {
    console.log('Starting automated test (using System Chrome)...');
    try {
        // Launch browser in headed mode, using system Chrome
        const browser = await chromium.launch({
            headless: false,
            channel: 'chrome'
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        // 1. Login
        console.log('Navigating to login page...');
        await page.goto('http://localhost:8080/login');

        console.log('Filling credentials...');
        await page.fill('#phone', '13717753455');
        await page.fill('#password', '13717753455');
        await page.click('button:has-text("登录")');

        // Wait for redirect to /learn
        await page.waitForURL('**/learn');
        console.log('Login successful.');

        // 2. Go to Admin Videos
        console.log('Navigating to Admin Videos...');
        await page.goto('http://localhost:8080/admin/videos');

        // Wait for header to ensure page loaded
        await page.waitForSelector('h1:has-text("视频管理")', { timeout: 30000 });
        console.log('Admin page loaded.');

        // 3. Open Dialog
        console.log('Opening upload dialog...');
        await page.click('button:has-text("添加视频")');

        // 4. Upload Video
        console.log('Uploading video...');
        // Match input by type
        const videoInput = page.locator('input[type="file"][accept="video/*"]');
        const videoPath = '/Volumes/aikaifa/claudekaifa/Tubedown Download/工作职场/day38.mp4';
        await videoInput.setInputFiles(videoPath);

        // Wait for video upload to finish AND thumbnail to generate
        console.log('Waiting for video upload and thumbnail generation (this may take time)...');
        await page.waitForSelector('text=已自动生成封面', { timeout: 120000 }); // 2 min timeout
        console.log('Video and Thumbnail processed.');

        // 5. Upload Subtitle
        console.log('Uploading subtitle...');
        const srtInput = page.locator('input[type="file"][accept=".srt"]');
        const srtPath = '/Volumes/aikaifa/claudekaifa/Tubedown Download/工作职场/【字幕】day38-LLM 大模型翻译.srt';
        await srtInput.setInputFiles(srtPath);

        // Wait for parsed status
        await page.waitForSelector('text=英文字幕已就绪');
        await page.waitForSelector('text=中文字幕已就绪');
        console.log('Subtitles parsed.');

        // 6. Select Category
        console.log('Selecting category...');
        // The SelectTrigger is a button with role combobox
        await page.click('button[role="combobox"]');
        // Select the first option in the content
        await page.click('div[role="option"]:first-child');

        // 7. Publish
        console.log('Setting published status...');
        await page.click('button[role="switch"]');

        // 8. Submit
        console.log('Submitting form...');
        await page.click('button:has-text("创建")');

        // 9. Verify
        await page.waitForSelector('text=视频创建成功');
        console.log('Video created successfully!');

        // Wait a bit to see the result
        await page.waitForTimeout(2000);

        await browser.close();
        console.log('Test Execution Finished Successfully.');

    } catch (e) {
        console.error('Test Failed:', e);
        console.log('Ensure Google Chrome is installed or run "npx playwright install"');
        process.exit(1);
    }
})();
