
const Renderer      = require('akasharender/Renderer');
const HTMLRenderer  = require('akasharender/HTMLRenderer');
const parse5        = require('parse5');
const xmlserializer = require('xmlserializer');
const path          = require('path');
const mahabhuta     = require('mahabhuta');

class EPUBXHTMLRenderer extends HTMLRenderer {
    constructor() {
        super(".xhtml", /^(.*)\.(xhtml)$/);
    }

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
        let xhtml = await this.maharun(html, metadata, metadata.config.mahafuncs);
        return xhtml;
    }

    async renderToFile(basedir, fpath, renderTo, renderToPlus, metadata, config) {
        var docdata = metadata;
        var metadata = await this.initMetadata(config, basedir, fpath, renderToPlus, docdata, {});
        docdata = metadata;

        var html = await this.readFile(basedir, fpath);
        var xhtml = await this.render(html, docdata);
        await this.writeFile(renderTo,
                                this.filePath(fpath),
                                xhtml);
    }

    /**
     * Extract the frontmatter for the given file.
     */
    async frontmatter(basedir, fpath) {
        return {};
    }

    parseFrontmatter(content) {
        return {};
    }

    /**
     * Extract the metadata from the given file.  Where the `frontmatter` function
     * returns an object that contains the metadata, this function returns only
     * the metadata object.
     *
     * This metadata is solely the data stored in the file.
     */
    async metadata(basedir, fpath) {
        return {};
    }
}

module.exports = new EPUBXHTMLRenderer();
