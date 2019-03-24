/**
 *
 * Copyright 2016, 2017, 2018, 2019 David Herron
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

const path   = require('path');
const util   = require('util');
const url    = require('url');
const akasha = require('akasharender');
const mahabhuta = akasha.mahabhuta;

/**
 * This plugin focuses on tweaking AkashaCMS to produce EPUB's.  When this plugin
 * is enabled, AkashaCMS cannot produce regular web page output, it can only be
 * used to produce DPUB output.  That means rendering an <em>.html.md</em>
 * (for example) goes to an <em>.xhtml</em> rather than <em>.html</em> output, 
 * plus the output is in XHTML format rather than regular HTML format.
 */

const pluginName = '@akashacms/plugins-epub';

module.exports = class RenderEPUBPlugin extends akasha.Plugin {
    constructor() {
        super(pluginName);
    }

    configure(config) {

        /**
         * These two Renderers handle an <em>.html</em> or <em>.xhtml</em> file
         * ensuring to produce an <em>.xhtml</em> as output.  They also attempt
         * to fetch metadata from the &lt;head&gt; section.
         */
        config.registerRenderer(require('./render-html.js'));
        config.registerRenderer(require('./render-xhtml.js'));
        
        /**
         * These subclasses of the built-in AkashaCMS plugins override the
         * <em>filePath</em> method to ensure the rendered file is output to 
         * the <em>.xhtml</em> extension.
         */
        config.registerOverrideRenderer(new AsciidocRendererOverride());
        config.registerOverrideRenderer(new EJSRendererOverride());
        config.registerOverrideRenderer(new MarkdownRendererOverride());
        config.registerOverrideRenderer(new JSONRendererOverride());
        
        /**
         * This is where XHTML mode for output is selected
         */
        config.setMahabhutaConfig({
            recognizeSelfClosing: true,
            recognizeCDATA: true,
            xmlMode: true
        });

        // TODO in the electron app this will not work since Webpack blah-blah-blah

        let moduleDirname = path.dirname(require.resolve(pluginName));
        // The partials directory overrides many templates used by
        // other plugins to make those custom tags safe for EPUB
        config.addPartialsDir(path.join(moduleDirname, 'partials'));
        // The layouts directory contains some default page layouts
        config.addLayoutsDir(path.join(moduleDirname, 'layouts'));

        /**
         * This MahafuncArray does various cleanups of the HTML so it plays
         * better with EPUB's requirements.
         * 
         * Note that external images and external CSS stylesheets is also a
         * big requirement in EPUB.  This plugin used to contain a Mahafunc to
         * handle downloading those files.  However that Mahafunc was spun off
         * to become the akashacms-dlassets plugin.
         * 
         * Therefore akashacms-dlassets is required to successfully package
         * EPUB's that reference external assets.
         */
        let arrayOptions = {};
        let mahafuncs = new mahabhuta.MahafuncArray(`${pluginName} support`, arrayOptions);
        mahafuncs.addMahafunc(new OEmbedCleanup())
                .addMahafunc(new AnchorNameCleanup())
                .addMahafunc(new HnInParagraphCleanup())
                .addMahafunc(new LocalLinkRelativizer())
                .addMahafunc(new LocalLinkHTML2XHTML())
                .addMahafunc(new ImageURLFixerRelativizer());
        // console.log(`RenderEPUBPlugin `, mahafuncs);
        config.addMahabhuta(mahafuncs);
    }
}

const html2xhtml = (s) => { return s.replace(/\.html$/i, ".xhtml"); }

/**
 * This cleans up instances of embedding e.g. YouTube videos into an EPUB.
 * Obviously that won't fly in the EPUB, so therefore it must be converted
 * to the HTML for the preview supplied by YouTube rather than the YouTube player.
 * 
 * Hence this relies on overriding the partial.  Plus this Mahafunc cleans up
 * the messed up HTML that is observed.
 */
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

/**
 * EPUB does not allow &lt;a&gt; tags with <em>name</em> attributes.
 */
class AnchorNameCleanup extends mahabhuta.Munger {
    get selector() { return "a[name]"; }
    process($, $link, metadata, dirty) {
        $link.removeAttr('name');
        return Promise.resolve("ok");
    }
}

/**
 * There are cases where Hn tags end up inside a &lt;p&gt; tag, and EPUB
 * barfs up a nasty error message on that.  This removes that condition.
 */
class HnInParagraphCleanup extends mahabhuta.Munger {
    get selector() { return 'p > h1, p > h2, p > h3, p > h4, p > h5, p > div'; }
    process($, $link, metadata, dirty) {
        $link.parent().after($link.parent().html());
        $link.parent().remove();
        return Promise.resolve("ok");
    }
}

/**
 * Links to other resources inside documents have to be a relative path
 * rather than a fixed path.  This handles rewriting these for &lt;a&gt;
 * and &lt;link&gt; tags.
 */
class LocalLinkRelativizer extends mahabhuta.Munger {
    get selector() { return 'html body a, html head link'; }
    async process($, $link, metadata, dirty) {
        var href   = $link.attr('href');

        if (href && href !== '#') {
            var uHref = url.parse(href, true, true);
            // We're only going to look at local links,
            // no processing for external links
            // no processing for hash links within the document (such as footnotes)
            if (! uHref.protocol && !uHref.slashes && !uHref.host
             && uHref.pathname && uHref.pathname.match(/^\//)) {
                var fixedURL = rewriteURL(metadata, href, true);
                // console.log(`orig href ${href} fixed ${fixedURL}`);
                $link.attr('href', fixedURL); // MAP href
            }
        }
        return "ok";
    }
}

/**
 * Like LocalLinkRelativizer but handles &lt;img&gt tags
 */
class ImageURLFixerRelativizer extends mahabhuta.Munger {
    get selector() { return 'html body img'; }
    async process($, $link, metadata, dirty) {
        var src   = $link.attr('src');
        if (!src) return "ok";

        var uHref = url.parse(src, true, true);
        // For local images with src starting with '/' convert to a relativized src URL
        if (! uHref.protocol && !uHref.slashes && !uHref.host
         && uHref.pathname && uHref.pathname.match(/^\//)) {
            var fixedURL = rewriteURL(metadata, src, true);
            // console.log(`orig src ${href} fixed ${fixedURL}`);
            $link.attr('src', fixedURL); // MAP href
            return "ok";
        }
        return "ok";
    }
}

/**
 * Because we have Renderers which force file names to be named <em>.xhtml</em>
 * we need to change links to local <em>.html</em> resources to use
 * the <em>.xhtml</em> extension instead.
 */
class LocalLinkHTML2XHTML extends mahabhuta.Munger {
    get selector() { return 'html body a'; }
    async process($, $link, metadata, dirty) {
        var href   = $link.attr('href');

        if (href && href !== '#') {
            var uHref = url.parse(href, true, true);
            // We're only going to look at local links,
            // no processing for external links
            // no processing for hash links within the document (such as footnotes)
            // console.log(`LocalLinkHTML2XHTML href ${href}`);
            if (! uHref.protocol && !uHref.slashes && !uHref.host
             && uHref.pathname
             && uHref.pathname.match(/\.html$/i)) {
                var fixedURL = html2xhtml(href);
                // console.log(`LocalLinkHTML2XHTML orig href ${href} fixed ${fixedURL}`);
                $link.attr('href', fixedURL); // MAP href
            }
        }
        return "ok";
    }
}

function rewriteURL(metadata, sourceURL, allowExternal) {
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

/**
 * These renderers force the output file name to <em>.xhtml</em>, and ensure that
 * file name matching accommodates <em>.xhtml</em> extensions.
 */

class AsciidocRendererOverride extends akasha.AsciidocRenderer {
    filePath(fname) {
        return html2xhtml(super.filePath(fname));
    }

    sourcePathMatchRenderPath(sourcePath, rendersTo) {
        let rendersToXhtml =  html2xhtml(rendersTo);
        // console.log(`AsciidocRendererOverride sourcePathMatchRenderPath rendersTo ${rendersTo} rendersToXhtml ${rendersToXhtml}`);
        return super.sourcePathMatchRenderPath(sourcePath, rendersToXhtml);
    }

}

class EJSRendererOverride extends akasha.EJSRenderer {
    filePath(fname) {
        return html2xhtml(super.filePath(fname));
    }

    sourcePathMatchRenderPath(sourcePath, rendersTo) {
        let rendersToXhtml =  html2xhtml(rendersTo);
        // console.log(`EJSRendererOverride sourcePathMatchRenderPath rendersTo ${rendersTo} rendersToXhtml ${rendersToXhtml}`);
        return super.sourcePathMatchRenderPath(sourcePath, rendersToXhtml);
    }

}

class MarkdownRendererOverride extends akasha.MarkdownRenderer {
    filePath(fname) {
        let superfname = super.filePath(fname);
        let fname2xhtml = html2xhtml(superfname);
        // console.log(`MarkdownRendererOverride fname ${fname} superfname ${superfname} fname2xhtml ${fname2xhtml}`);
        return fname2xhtml;
    }

    sourcePathMatchRenderPath(sourcePath, rendersTo) {
        let rendersToXhtml =  html2xhtml(rendersTo);
        // console.log(`MarkdownRendererOverride sourcePathMatchRenderPath rendersTo ${rendersTo} rendersToXhtml ${rendersToXhtml}`);
        return super.sourcePathMatchRenderPath(sourcePath, rendersToXhtml);
    }

}

class JSONRendererOverride extends akasha.JSONRenderer {
    filePath(fname) {
        return html2xhtml(super.filePath(fname));
    }

    sourcePathMatchRenderPath(sourcePath, rendersTo) {
        let rendersToXhtml =  html2xhtml(rendersTo);
        // console.log(`JSONRendererOverride sourcePathMatchRenderPath rendersTo ${rendersTo} rendersToXhtml ${rendersToXhtml}`);
        return super.sourcePathMatchRenderPath(sourcePath, rendersToXhtml);
    }

}
