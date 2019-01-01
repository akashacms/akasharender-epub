
const Renderer      = require('akasharender/Renderer');
const parse5        = require('parse5');
const xmlserializer = require('xmlserializer');
const path          = require('path');
const mahabhuta     = require('mahabhuta');

class EPUBHTMLRenderer extends Renderer {
    constructor() {
        super(".html", /^(.*)\.(html)$/);
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

    // The reasoning in these two functions is that 
    // we are being given a file name w/ .html extension
    // but our goal is producing XHTML files with .xhtml extension
    //
    // In these functions we force the extension to be .xhtml

    filePath(fname) {
        var matches;
        if ((matches = fname.match(this.regex[0])) !== null) {
            return `${matches[1]}.xhtml`;
        } else return null;
    }

    fileExtension(fname) {
        var matches;
        if ((matches = fname.match(this.regex[0])) !== null) {
            return '.xhtml';
        }
        return null;
    }

    renderSync(text, metadata) {
        throw new Error("Cannot render .html in synchronous environment");
    }

    async render(html, metadata) {

        let html2 = await this.maharun(html, metadata, metadata.config.mahafuncs);
        let dom = parse5.parse(html2);
        let xhtml = xmlserializer.serializeToString(dom);
        return xhtml;
    }

    // In this function we force the file to be .xhtml format

    async renderToFile(basedir, fpath, renderTo, renderToPlus, metadata, config) {
        var html = await this.readFile(basedir, fpath);
        var xhtml = await this.render(html, { config: config });
        await this.writeFile(renderTo,
                                this.filePath(fpath),
                                xhtml);
    }
}

module.exports = new EPUBHTMLRenderer();