
const program    = require('commander');
// const epubtools  = require('epubtools');
// const renderEPUB = require('./renderEPUB');
const yaml       = require('js-yaml');
const akasha     = require('akasharender');
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

program.parse(process.argv);

async function doRender(configFN) {
    let config = await epubconfig.readConfig(configFN);
    await config.check();
    // const bookConfig = await epubtools.openProject(configFN); // configurator.readConfig(configFN);
    // renderEPUB.setconfig(bookConfig);
    await fs.mkdirs(config.bookRenderDestFullPath);
    await config.akConfig.copyAssets(); // await renderEPUB.copyAssets(bookConfig);
    await akasha.render(config.akConfig); // await renderEPUB.renderProject();
}
module.exports.doRender = doRender;
