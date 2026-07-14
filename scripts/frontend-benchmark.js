const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const targetUrl = process.env.TARGET_URL || 'http://127.0.0.1:8000';
    const iterations = parseInt(process.env.ITERATIONS || '5');
    const jsonOut = process.env.JSON_OUT || 'frontend-result.json';
    
    console.log(`Starting frontend benchmark against ${targetUrl} for ${iterations} iterations...`);
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Warmup
    try {
        console.log('Running warmup...');
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
        console.warn('Warmup timeout or error, continuing...', e.message);
    }
    
    let totalLoad = 0;
    let totalDomReady = 0;
    let totalFcp = 0;
    let totalJsHeap = 0;
    
    for (let i = 0; i < iterations; i++) {
        await page.goto('about:blank'); // Clear page state
        
        const response = await page.goto(targetUrl, { waitUntil: 'load' });
        
        if (!response || !response.ok()) {
            console.error(`Request failed with status ${response ? response.status() : 'unknown'}`);
        }
        
        // Extract performance timing
        const metrics = await page.evaluate(async () => {
            // Wait a brief moment to ensure paint events are dispatched
            await new Promise(r => setTimeout(r, 100));
            
            const timing = window.performance.timing;
            const paint = window.performance.getEntriesByType('paint');
            const fcpEntry = paint.find(p => p.name === 'first-contentful-paint');
            const fcp = fcpEntry ? fcpEntry.startTime : 0;
            
            const jsHeapSize = window.performance.memory ? window.performance.memory.usedJSHeapSize : 0;
            
            return {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                fcp: fcp,
                jsHeapSize: jsHeapSize / (1024 * 1024) // Convert to MB
            };
        });
        
        console.log(`Iteration ${i+1}: Load=${metrics.loadTime}ms, FCP=${Math.round(metrics.fcp)}ms, DOM=${metrics.domReady}ms`);
        
        totalLoad += metrics.loadTime;
        totalDomReady += metrics.domReady;
        totalFcp += metrics.fcp;
        totalJsHeap += metrics.jsHeapSize;
    }
    
    const results = {
        avg_load_time_ms: totalLoad / iterations,
        avg_dom_ready_ms: totalDomReady / iterations,
        avg_fcp_ms: totalFcp / iterations,
        avg_js_heap_mb: totalJsHeap / iterations
    };
    
    // Create directory if not exists
    const dir = path.dirname(jsonOut);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(jsonOut, JSON.stringify(results, null, 2));
    console.log(`Saved frontend metrics to ${jsonOut}`);
    
    await browser.close();
})();
