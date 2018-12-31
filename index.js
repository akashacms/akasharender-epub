/**
 *
 * Copyright 2016 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';

const fs     = require('fs-extra-promise');
const path   = require('path');
const util   = require('util');
const url    = require('url');
const akasha = require('akasharender');
const mahabhuta = akasha.mahabhuta;
const request = require('request');

akasha.registerRenderer(require('./render-html.js'));
akasha.registerRenderer(require('./render-xhtml.js'));

module.exports = class RenderEPUBPlugin extends akasha.Plugin {
    constructor() {
        super("@akashacms/plugins-epub");
    }

    configure(config) {

        config.setMahabhutaConfig({
            recognizeSelfClosing: true,
            recognizeCDATA: true,
            xmlMode: true
        });

        // TODO in the electron app this will not work since Webpack blah-blah-blah

        let moduleDirname = path.dirname(require.resolve('@akashacms/plugins-epub'));
        config.addPartialsDir(path.join(moduleDirname, 'partials'));
        config.addLayoutsDir(path.join(moduleDirname, 'layouts'));

        /* config.addPartialsDir(path.join(__dirname, 'partials'));
        config.addLayoutsDir(path.join(__dirname, 'layouts')); */
        config.addMahabhuta(module.exports.mahabhuta);
    }
}

module.exports.mahabhuta = new mahabhuta.MahafuncArray("akasharender epub support", {});

class OEmbedCleanup extends mahabhuta.Munger {
    get selector() { return '.akasharender-epub-embed-preview'; }
    process($, $link, metadata, dirty) {
        // console.log(`akasharender-epub-embed-preview ${$link.find('body').html()}`);
        // This requires the framed-embed.html.ejs which simply inserts the preview.
        // For YouTube, that preview contains an html/body pair that needs to be removed.
        // The website should have its own mahafunc to further customize this.
        if ($link.find('body').get(0)) {
            $link.parent().after($link.find('body').html());
            $link.remove();
        }
        return Promise.resolve("ok");
    }
}
module.exports.mahabhuta.addMahafunc(new OEmbedCleanup());

class AnchorNameCleanup extends mahabhuta.Munger {
    get selector() { return "a[name]"; }
    process($, $link, metadata, dirty) {
        $link.removeAttr('name');
        return Promise.resolve("ok");
    }
}
module.exports.mahabhuta.addMahafunc(new AnchorNameCleanup());

class HnInParagraphCleanup extends mahabhuta.Munger {
    get selector() { return 'p > h1, p > h2, p > h3, p > h4, p > h5, p > div'; }
    process($, $link, metadata, dirty) {
        $link.parent().after($link.parent().html());
        $link.parent().remove();
        return Promise.resolve("ok");
    }
}
module.exports.mahabhuta.addMahafunc(new HnInParagraphCleanup());

class LocalLinkRelativizer extends mahabhuta.Munger {
    get selector() { return 'html body a, html head link'; }
    process($, $link, metadata, dirty) {
        var href   = $link.attr('href');

        if (href && href !== '#') {
            var uHref = url.parse(href, true, true);
            // We're only going to look at local links,
            // no processing for external links
            // no processing for hash links within the document (such as footnotes)
            if (! uHref.protocol && !uHref.slashes && !uHref.host
             && uHref.pathname && uHref.pathname.match(/^\//)) {
                var fixedURL = rewriteURL(akasha, metadata.config, metadata, href, true);
                // console.log(`orig href ${href} fixed ${fixedURL}`);
                $link.attr('href', fixedURL); // MAP href
            }
        }
        return Promise.resolve("ok");
    }
}
module.exports.mahabhuta.addMahafunc(new LocalLinkRelativizer());

class ImageURLFixerRelativizer extends mahabhuta.Munger {
    get selector() { return 'html body img'; }
    async process($, $link, metadata, dirty) {
        var src   = $link.attr('src');
        if (!src) return "ok";

        var uHref = url.parse(src, true, true);
        // For local images with src starting with '/' convert to a relativized src URL
        if (! uHref.protocol && !uHref.slashes && !uHref.host
         && uHref.pathname && uHref.pathname.match(/^\//)) {
            var fixedURL = rewriteURL(akasha, metadata.config, metadata, src, true);
            // console.log(`orig src ${href} fixed ${fixedURL}`);
            $link.attr('src', fixedURL); // MAP href
            return "ok";
        }
        // For remote images we need to download the image, saving it into the eBook
        // TODO use dlassets
        if (uHref.protocol || uHref.slashes || uHref.host) {
            try {
                var res = await new Promise((resolve, reject) => {
                    request({ url: src, encoding: null }, (error, response, body) => {
                        if (error) reject(error);
                        else resolve({response, body});
                    });
                });
                // Set up the path for the image.
                // We'll write this path into the <img> tag.
                // We'll store the file into the corresponding file on-disk.
                //
                // We need to take care with certain characters in the path.
                // For example, Amazon will use a file-name like 81yP%2B05t98L._SL1500_.jpg
                // in its images.  That '%' character causes problems when it's part
                // of a URL.  Cheerio doesn't do the right thing to encode this
                // string correctly.  What we'll do instead is hide characters that are
                // known to be dangerous, using this rewriting technique.
                var dlPath = path.join('/___dlimages',
                    res.response.request.uri.path
                            .replace('%', '__'));
                var pathWriteTo = path.join(metadata.config.renderDestination, dlPath);
                // console.log(`ImageURLFixerRelativizer download ${res.response.request.uri.path} dlPath ${dlPath} pathWriteTo ${pathWriteTo}`);
                $link.attr('src', dlPath);
                await fs.ensureDirAsync(path.dirname(pathWriteTo));
                await fs.writeFileAsync(pathWriteTo, res.body, 'binary');
            } catch(err) {
                console.error(`ImageURLFixerRelativizer ERROR ${err}`);
                throw err;
            }
        }
        return "ok";
    }
}
module.exports.mahabhuta.addMahafunc(new ImageURLFixerRelativizer());

function rewriteURL(akasha, config, metadata, sourceURL, allowExternal) {
    // logger.trace('rewriteURL '+ sourceURL);
    var urlSource = url.parse(sourceURL, true, true);
    // logger.trace(util.inspect(urlSource));
    if (urlSource.protocol || urlSource.slashes) {
        if (!allowExternal) {
            throw new Error("Got external URL when not allowed " + sourceURL);
        } else return sourceURL;
    } else {
        var pRenderedUrl;
        if (urlSource.pathname && urlSource.pathname.match(/^\//)) { // absolute URL
            var prefix = computeRelativePrefixToRoot(metadata.rendered_url);
            // logger.trace('absolute - prefix for '+ metadata.rendered_url +' == '+ prefix);
            var ret = path.normalize(prefix+sourceURL);
            // logger.trace('Rewrote '+ sourceURL +' to '+ ret);
            return ret;
        } else {
            var ret = sourceURL; //   path.normalize(docdir+'/'+sourceURL);
            // logger.trace('Rewrote '+ sourceURL +' to '+ ret);
            return ret;
        }

        /* else if (urlSource.pathname.match(/^\.\//)) { // ./
            // pRenderedUrl = url.parse(metadata.rendered_url);
            // var docpath = pRenderedUrl.pathname;
            // var docdir = path.dirname(docpath);
            // logger.trace('Cur Dir - renderedURL '+ metadata.rendered_url +' docdir '+ docdir);
            var ret = sourceURL; // path.normalize(docdir+'/'+sourceURL);
            // logger.trace('Rewrote '+ sourceURL +' to '+ ret);
            return ret;
        } else if (urlSource.pathname.match(/^\.\.\//)) { // ../
            // pRenderedUrl = url.parse(metadata.rendered_url);
            // var docpath = pRenderedUrl.pathname;
            // var docdir = path.dirname(docpath);
            // logger.trace('Parent Dir - renderedURL '+ metadata.rendered_url +' docdir '+ docdir);
            var ret = sourceURL; // path.normalize(docdir+'/'+sourceURL);
            // logger.trace('Rewrote '+ sourceURL +' to '+ ret);
            return ret;
        } else { // anything else
            // logger.trace('anything else '+ metadata.rendered_url);
            // logger.trace(util.inspect(metadata));
            // pRenderedUrl = url.parse(metadata.rendered_url);
            // var docpath = pRenderedUrl.pathname;
            // var docdir = path.dirname(docpath);
            var ret = sourceURL; //   path.normalize(docdir+'/'+sourceURL);
            // logger.trace('Rewrote '+ sourceURL +' to '+ ret);
            return ret;
        } */
    }
};

function computeRelativePrefixToRoot(source) {
    var prefix = '';
    for (var parent = path.dirname(source); parent !== '.'; parent = path.dirname(parent)) {
        prefix += '../';
    }
    return prefix === '' ? './' : prefix;
};
