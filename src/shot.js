const xlsx = require('node-xlsx');
const puppeteer = require('puppeteer');
const fs = require('fs-extra')
const config = require('./config.json');
const path = require('path');
const TaskList = require('./TaskList');
const {
    width = 1300, height = 900,
} = config;

function getData(excelPath) {
    // Parse a file
    const workSheetsFromFile = xlsx.parse(excelPath);
    const data = workSheetsFromFile[0].data;
    // const shotListData = data.slice(1)
    const shotListData = data.slice(1)
        .filter(item => {
        // check
        return Array.isArray(item) && item[0] && item[1]
    }).map(item => ({
        title: item[0],
        url: item[1],
    }));
    return shotListData;
}

function getPath(originPath, searchText) {
    const newStr = decodeURIComponent(originPath);
    return newStr.replace(/_{1,3}search_{1,3}/, encodeURIComponent(searchText));
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function screenshotPage(browser, pageUrl, outputPath) {
    let page = await browser.newPage();
    await page.goto(pageUrl, {
        // waitUntil: 'load',
        // waitUntil: 'networkidle0',
        // waitUntil: 'networkidle0',
        // Remove the timeout
        timeout: 0
    }).catch(async e => {
        console.log('e', e);
        console.log('pageUrl', pageUrl);
        // await page.close();
    });
    await delay(3000)
    // console.log('page', page);
    // console.log('page', page);
    // console.log('page.frames()', page.frames());
    await page.waitForSelector('body').catch(e=>{
        console.log('e', e);
    });
    page.on('error',err=>{
        console.log('err', err);
    })

    await page.$eval('body', (bodyEl) => {
        console.log('bodyEl', bodyEl);
        const timeStr = new Date().toLocaleDateString('ko-KR')
        console.log(3333)
        console.log(bodyEl.innerHTML);
        bodyEl.insertAdjacentHTML('afterend', `
            <div style="position: fixed; bottom: 60px;right: 40px;color: black;padding: 10px; border: 1px solid black;border-radius: 2px;background: #fff">
                <div>11</div>
                <div>${bodyEl.innerHTML}</div>
                <div>记录时间:</div>
                <div>${timeStr}</div>
            </div>
        `);
        return true
    }).catch(e=>{
        console.log('e', e);
    });

    await page.screenshot({
        path: outputPath,

    });
    await page.close();
}

function getSearchPages(searchText, shotList) {
    const pageList = shotList.map(item => ({
        searchText,
        title: item.title,
        pageUrl: getPath(item.url, searchText),
    }));
    return pageList;
}

async function main(searchText) {
    const basePath = path.resolve(__dirname, '../build')
    await fs.emptyDir(basePath)
    const buildPath = path.resolve(__dirname, `../build/${searchText}`)
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        // headless:false,
        // executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
        defaultViewport: {
            width,
            height,
        },
    });
    await fs.ensureDir(buildPath);
    const shotList = getData(path.resolve(__dirname, './data.xlsx'));
    const pageList = getSearchPages(searchText, shotList)
    const pageArr = []
    for (let i = 0; i < pageList.length; i++) {
        const pageObj = pageList[i];
        pageArr.push(screenshotPage(browser, pageObj.pageUrl, `${buildPath}/${pageObj.title}.jpeg`));
    }
    new TaskList(pageArr, async function () {
        await browser.close();
    })
}

main('华为优先公司');
