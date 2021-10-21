#!/usr/bin/env node
const program    = require('commander');
// const epubtools  = require('epubtools');
// const renderEPUB = require('./renderEPUB');
const yaml       = require('js-yaml');
const akasha     = require('akasharender');
const data       = require('akasharender/data');
const _watchman = import('akasharender/cache/watchman.mjs');
const fs         = require('fs-extra');
const epubconfig = require('./Configuration');

process.title = 'akashacms-epub';
program.version('0.4.1');

program
    .command('render <configFN>')
    .description('Render document files in the input directory to render directory')
    .action(async (configFN) => {
        try {
            await doRender(configFN);
        } catch (e) {
            console.error(`render command ERRORED ${e.stack}`);
        }
    });

program
    .command('watch-epub <configFN>')
    .description('Track changes to files in a site, and rebuild anything that changes')
    .action(async (configFN, cmdObj) => {
        // console.log(`render: akasha: ${util.inspect(akasha)}`);
        try {
            await doWatchEPUB(configFN);
        } catch (e) {
            console.error(`watch command ERRORED ${e.stack}`);
        }
    });

program.parse(process.argv);

async function doRender(configFN) {
    let config = await epubconfig.readConfig(configFN);
    await config.check();
    const akConfig = config.akConfig;
    await akasha.cacheSetupComplete(akConfig);
    data.init();
    // const bookConfig = await epubtools.openProject(configFN); // configurator.readConfig(configFN);
    // renderEPUB.setconfig(bookConfig);
    // console.log(config.bookRenderDestFullPath);
    await fs.mkdirs(config.bookRenderDestFullPath);
    await akConfig.copyAssets(); // await renderEPUB.copyAssets(bookConfig);
    await akasha.render(akConfig); // await renderEPUB.renderProject();
    await akasha.closeCaches();
}
module.exports.doRender = doRender;

async function doWatchEPUB(configFN) {
    let config = await epubconfig.readConfig(configFN);
    await config.check();
    const akConfig = config.akConfig;
    await akasha.cacheSetupComplete(akConfig);
    data.init();
    await akConfig.hookBeforeSiteRendered();
    // const bookConfig = await epubtools.openProject(configFN); // configurator.readConfig(configFN);
    // renderEPUB.setconfig(bookConfig);
    // console.log(config.bookRenderDestFullPath);
    await fs.mkdirs(config.bookRenderDestFullPath);
    await akConfig.copyAssets(); // await renderEPUB.copyAssets(bookConfig);

    const watchman = (await _watchman).watchman;
    await watchman(akConfig);
}
module.exports.doWatchEPUB = doWatchEPUB;
