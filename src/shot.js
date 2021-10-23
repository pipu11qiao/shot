const puppeteer = require('puppeteer');
const fs = require('fs-extra')
const config = require('./config.json');
const path = require('path');
const {
    width = 1300, height = 900,
    shotList = [], // 要查询的地址
    searchList = [] // 查询的信息
} = config;

function getPath(originPath, searchText) {
    return originPath.replace('__search__', encodeURIComponent(searchText));
}

function getAllPage() {
    const pageList = [];
    for (let i = 0; i < searchList.length; i++) {
        const searchText = searchList[i];
        shotList.forEach(item => {
            pageList.push({
                searchText,
                title: item.title,
                pageUrl: getPath(item.url, searchText),
            });
        })
    }
    return pageList
}

const pageList = getAllPage();


async function screenshotPage(browser, pageUrl, outputPath) {
    let page = await browser.newPage();
    await page.goto(pageUrl, {waitUntil: 'networkidle2',});
    await page.$eval('body', (bodyEl) => {
        const timeStr = new Date().toLocaleDateString('ko-KR')
        bodyEl.insertAdjacentHTML('afterend', `
            <div style="position: fixed; bottom: 60px;right: 40px;color: black;padding: 10px; border: 1px solid black;border-radius: 2px;background: #fff">
                <div>记录时间:</div>
                <div>${timeStr}</div>
            </div>
        `);
        return true
    });
    await page.screenshot({path: outputPath});
    await page.close();
}

async function main() {
    const buildPath = path.resolve(__dirname,'../build')
    await fs.emptyDir(buildPath)
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
            width,
            height,
        },
    });
    const pageArr = []
    for (let i = 0; i < pageList.length; i++) {
        const pageObj = pageList[i];
        pageArr.push(screenshotPage(browser, pageObj.pageUrl, `${buildPath}/${pageObj.searchText}-${pageObj.title}.jpeg`));
    }
    await Promise.all(pageArr);
    await browser.close();
}

main();
