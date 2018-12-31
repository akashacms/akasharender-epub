
const Renderer      = require('akasharender/Renderer');
const parse5        = require('parse5');
const xmlserializer = require('xmlserializer');
const path          = require('path');
const mahabhuta     = require('mahabhuta');

class EPUBXHTMLRenderer extends Renderer {
    constructor() {
        super(".xhtml", /^(.*)\.(xhtml)$/);
    }

    /**
     * Support for Mahabhuta -- jQuery-like processing of HTML DOM before Rendering
     * down to HTML text.
     */
    maharun(rendered, metadata, mahafuncs) {
        if (typeof rendered === 'undefined' || rendered === null) {
            throw new Error('no rendered provided');
        }
        if (typeof metadata === 'undefined' || metadata === null) {
            throw new Error('no metadata provided');
        }
        if (typeof mahabhuta === 'undefined' || mahabhuta === null) {
            throw new Error('no mahabhuta provided');
        }
        
        if (metadata.config.mahabhutaConfig) mahabhuta.config(metadata.config.mahabhutaConfig);
        return mahabhuta.processAsync(rendered, metadata, mahafuncs);
    }

    renderSync(text, metadata) {
        throw new Error("Cannot render .html in synchronous environment");
    }

    async render(html, metadata) {
        let xhtml = await this.maharun(html, metadata, metadata.config.mahafuncs);
        return xhtml;
    }

    async renderToFile(basedir, fpath, renderTo, renderToPlus, metadata, config) {
        var html = await this.readFile(basedir, fpath);
        var xhtml = await this.render(html, { config: config });
        await this.writeFile(renderTo,
                                this.filePath(fpath),
                                xhtml);
    }
}

module.exports = new EPUBXHTMLRenderer();
