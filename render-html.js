
const Renderer      = require('akasharender').Renderer;
const HTMLRenderer  = require('akasharender').HTMLRenderer;
const parse5        = require('parse5');
const xmlserializer = require('xmlserializer');
const path          = require('path');
const mahabhuta     = require('mahabhuta');
const renderXHTML   = require('./render-xhtml');

class EPUBHTMLRenderer extends HTMLRenderer {
    constructor() {
        super(".html", /^(.*)\.(html)$/);
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
        var fm = await this.frontmatter(basedir, fpath);
        var docdata;
        var metadata = await this.initMetadata(config, basedir, fpath, renderToPlus, docdata, fm.data);
        docdata = metadata;

        var html = fm.content;
        var xhtml = await this.render(html, docdata);
        await this.writeFile(renderTo,
                                this.filePath(fpath),
                                xhtml);
    }

    /**
     * Extract the frontmatter for the given file.
     */
    async frontmatter(basedir, fpath) {
        var html = await this.readFile(basedir, fpath);
        return this.parseFrontmatter(html);
    }

    parseFrontmatter(content) {
        return {
            content,
            data: renderXHTML.readMetadata(content)
        };
    }

    /**
     * Extract the metadata from the given file.  Where the `frontmatter` function
     * returns an object that contains the metadata, this function returns only
     * the metadata object.
     *
     * This metadata is solely the data stored in the file.
     */
    async metadata(basedir, fpath) {
        var fm = await this.frontmatter(basedir, fpath);
        return fm.data;
    }

}

module.exports = new EPUBHTMLRenderer();
