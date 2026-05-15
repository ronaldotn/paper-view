const puppeteer = require('puppeteer');

async function test() {
    const b = await puppeteer.launch({headless: true});
    const wsEndpoint = b.wsEndpoint();
    console.log('WS Endpoint:', wsEndpoint);
    
    const b2 = await puppeteer.connect({browserWSEndpoint: wsEndpoint});
    console.log('Connected successfully!');
    
    await b2.close();
    await b.close();
}

test().catch(e => console.error(e));
