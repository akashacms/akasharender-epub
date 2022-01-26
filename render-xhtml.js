
const Renderer      = require('akasharender').Renderer;
const HTMLRenderer  = require('akasharender').HTMLRenderer;
const parse5        = require('parse5');
const xmlserializer = require('xmlserializer');
const DOMParser     = require('@xmldom/xmldom').DOMParser;
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

    async frontmatter(basedir, fpath) {
        var html = await this.readFile(basedir, fpath);
        return this.parseFrontmatter(html);
    }

    parseFrontmatter(content) {
        return {
            content,
            data: module.exports.readMetadata(content)
        };
    }

    async metadata(basedir, fpath) {
        var fm = await this.frontmatter(basedir, fpath);
        return fm.data;
    }
}

module.exports = new EPUBXHTMLRenderer();


module.exports.nodeListIterator = function nodeListIterator(nodeList) {
    nodeList[Symbol.iterator] = function() {
        return {
            next: function() {
                if (this._index < nodeList.length) {
                    var ret = nodeList.item(this._index);
                    this._index++;
                    return { value: ret, done: false };
                } else {
                    return { done: true };
                }
            },
            _index: 0
        };
    };
    return nodeList;
};

module.exports.nodeList2Array = function(nodeList) {
    var ret = [];
    for (let item of module.exports.nodeListIterator(nodeList)) {
        ret.push(item);
    }
    return ret;
};

module.exports.readMetadata = function(html) {
    var ret = {};
    var doc = new DOMParser().parseFromString(html);
    var head;
    for (let elem of module.exports.nodeListIterator(
        doc.getElementsByTagName('head')
    )) {
        if (elem) head = elem;
    }
    if (head) {
        let headchildren = head.childNodes;
        let title;
        for (let child of module.exports.nodeListIterator(headchildren)) {
            if (child.nodeType === 1 && child.tagName && child.tagName === 'title') { // ELEMENT_NODE
                title = child.textContent;
                break;
            }
        }
        if (title) {
            ret.title = title;
        }
    }
    return ret;
}
