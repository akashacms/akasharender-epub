/**
 *
 * Copyright 2020 David Herron
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

 const epubtools  = require('epubtools');
const epubConfiguration = require('epubtools/Configuration');
const fs         = require('fs-extra');
const path       = require('path');
const util       = require('util');
const akasha     = require('akasharender');


const _config_akasha = Symbol('akConfig');

module.exports.Configuration = class Configuration extends epubConfiguration.Configuration {

    constructor(yamlText) {
        super(yamlText);
    }

    /**
     * Check if the configuration is minimally usable.
     */
    async check() {
        super.check();

        if (!this.bookroot || this.bookroot === '') {
            throw new Error(`No bookroot set in ${this.projectName}`);
        }

        // console.log(`bookroot ${this.bookroot} configFileName ${this.configFileName}`);
        // console.log(`configDirPath ${this.configDirPath} configFileName ${this.configFileName}`);

        // Maybe these checks do not matter?
        // In readConfig, these directories get added to akConfig.  In akashaRender, it does not
        // matter if the directory does not exist, because akashaRender will simply skip over
        // the nonexistent file.
        // Therefore it doesn't matter whether the directory actually exists or not.

        /* try {
            await fs.access(this.sourceBookFullPath, fs.constants.R_OK);
        } catch (e) {
            throw new Error(`Book source directory is not readable or does not exist ${this.sourceBookFullPath}`);
        }
        if (this.assetsDir && this.assetsDir !== '') {
            try {
                await fs.access(this.assetsDirFullPath, fs.constants.R_OK);
            } catch (e) {
                throw new Error(`Assets directory is not readable or does not exist ${this.assetsDirFullPath}`);
            }
        }
        if (this.partialsDir && this.partialsDir !== '') {
            try {
                await fs.access(this.partialsDirFullPath, fs.constants.R_OK);
            } catch (e) {
                throw new Error(`Partials directory is not readable or does not exist ${this.partialsDirFullPath}`);
            }
        }
        if (this.layoutsDir && this.layoutsDir !== '') {
            try {
                await fs.access(this.layoutsDirFullPath, fs.constants.R_OK);
            } catch (e) {
                throw new Error(`Layouts directory is not readable or does not exist ${this.layoutsDirFullPath}`);
            }
        } */
    }

    /**
     * Handle the corresponding AkashaCMS config
     */
    get akConfig()       { return this[_config_akasha]; }
    set akConfig(config) { return this[_config_akasha] = config; }

    /**
     * Directory containing the document files used in this book.
     */
    get bookroot() {
        // console.log(this.YAML);
        let ret = this.YAML
             && this.YAML.akashaepub.bookroot
                ? this.YAML.akashaepub.bookroot
                : "documents"; // : undefined;
        // This could be an array of values
        if (Array.isArray(ret)) {
            return ret;
        }
        // Make sure assets directory exists
        let stats;
        try {
            stats = fs.statSync(ret);
        } catch (e) {
            stats = undefined;
        }
        if (stats && stats.isDirectory()) {
            return ret;
        } else if (ret === "documents") {
            return undefined;
        } else {
            throw new Error(`bookroot does not exist ${ret}`);
        }
    }
    set bookroot(newBookroot) {
        this.YAML.akashaepub.bookroot = newBookroot;
    }

    get baseMetadata() {
        return this.YAML.akashaepub.baseMetadata;
    }

    /**
     * Return the full path for the Root directory.  In
     * the config file, the Root directory is specified relative
     * to the config file.  But some callers require the full path.
     */
    get sourceBookFullPath() {
        return path.normalize(path.join(this.configDirPath, this.bookroot ? this.bookroot : ""));
    }

    /**
     * Directory where asset files are stored
     */
    get assetsDir() {
        let ret = this.YAML.akashaepub
             && this.YAML.akashaepub.assetsDir
                ? this.YAML.akashaepub.assetsDir
                : "assets"; // : undefined;
        // This could be an array of values
        if (Array.isArray(ret)) {
            return ret;
        }
        // Make sure assets directory exists
        let stats;
        try {
            stats = fs.statSync(ret);
        } catch (e) {
            stats = undefined;
        }
        if (stats && stats.isDirectory()) {
            return ret;
        } else if (ret === "assets") {
            return undefined;
        } else {
            throw new Error(`assetsDir does not exist ${ret}`);
        }
    }
    set assetsDir(newAssetsDir) {
        this.YAML.akashaepub.assetsDir = newAssetsDir;
    }
    get assetsDirFullPath() {
        return path.normalize(path.join(this.configDirPath, this.assetsDir ? this.assetsDir : ""));
    }

    /**
     * Directory where partial templates are stored
     */
    get partialsDir() {
        let ret = this.YAML.akashaepub
             && this.YAML.akashaepub.partialsDir
                ? this.YAML.akashaepub.partialsDir
                : "partials"; // : undefined;
        // This could be an array of values
        if (Array.isArray(ret)) {
            return ret;
        }
        // Make sure partials directory exists
        let stats;
        try {
            stats = fs.statSync(ret);
        } catch (e) {
            stats = undefined;
        }
        if (stats && stats.isDirectory()) {
            return ret;
        } else if (ret === "partials") {
            return undefined;
        } else {
            throw new Error(`partialsDir does not exist ${ret}`);
        }
    }
    set partialsDir(newPartialsDir) {
        this.YAML.akashaepub.partialsDir = newPartialsDir;
    }
    get partialsDirFullPath() {
        return path.normalize(path.join(this.configDirPath, this.partialsDir ? this.partialsDir : ""));
    }

    /**
     * Directory where layoout templates are stored
     */
    get layoutsDir() { 
        let ret = this.YAML.akashaepub
             && this.YAML.akashaepub.layoutsDir
                ? this.YAML.akashaepub.layoutsDir
                : "layouts"; // : undefined;
        // This could be an array of values
        if (Array.isArray(ret)) {
            return ret;
        }
        // Make sure layouts directory exists
        let stats;
        try {
            stats = fs.statSync(ret);
        } catch (e) {
            stats = undefined;
        }
        if (stats && stats.isDirectory()) {
            return ret;
        } else if (ret === "layouts") {
            return undefined;
        } else {
            throw new Error(`layoutsDir does not exist ${ret}`);
        }
    }
    set layoutsDir(newLayoutsDir) {
        this.YAML.akashaepub.layoutsDir = newLayoutsDir;
    }
    get layoutsDirFullPath() {
        return path.normalize(path.join(this.configDirPath, this.layoutsDir ? this.layoutsDir : ""));
    }

    /**
     * Directory where the raw files for the EPUB will be rendered.
     */
    get bookRenderDest() {
        if (this.YAML.akashaepub && this.YAML.akashaepub.bookdest) {
            return this.YAML.akashaepub.bookdest;
        } else if (this.YAML.rendered) {
            return this.YAML.rendered;
        } else {
            return "out";
        }
        /* return (this.YAML.akashaepub && this.YAML.akashaepub.bookdest)
                ? this.YAML.akashaepub.bookdest
                : "out"; // : undefined; */
    }
    set bookRenderDest(newRenderRoot) {
        this.YAML.akashaepub.bookdest = newRenderRoot;
    }

    get bookRenderDestFullPath() {
        if (!this.bookRenderDest) throw new Error('No bookRenderDest set');
        // console.log(`bookRenderDestFullPath - configDirPath ${this.configDirPath} - bookRenderDest ${this.bookRenderDest}`);
        return path.normalize(
            path.join(
                this.configDirPath, this.bookRenderDest ? this.bookRenderDest : ""
            )
        );
    }

    get plugins() {
        return (this.YAML.akashaepub && this.YAML.akashaepub.plugins)
            ? this.YAML.akashaepub.plugins
            : [];
    }

    get stylesheets() {
        return (this.YAML.akashaepub && this.YAML.akashaepub.stylesheets)
            ? this.YAML.akashaepub.stylesheets
            : [];
    }

    get footerjavascript() {
        return (this.YAML.akashaepub && this.YAML.akashaepub.footerjavascript)
            ? this.YAML.akashaepub.footerjavascript
            : [];
    }

    get headerjavascript() {
        return (this.YAML.akashaepub && this.YAML.akashaepub.headerjavascript)
            ? this.YAML.akashaepub.headerjavascript
            : [];
    }

}


async function readConfig(configFN) {

    const yamlText = await fs.readFile(configFN, 'utf8');
    let config = new module.exports.Configuration(yamlText);
    config.configFileName = configFN;
    // const YML = yaml.safeLoad(yamlText);
    // console.log(config.plugins);
    config.akConfig = new akasha.Configuration();
    /*
     * This might work for putting plugins into the epubtools file.
     * But it's proving impossible to test in the test directory.
     **/
    if (config.plugins.length <= 0) {
        // console.log('No plugins specified -- loading @akashacms/plugins-epub - akashacms-dlassets')
        config.akConfig
            .use(require('./index' /*'@akashacms/plugins-epub'*/))
            .use(require('akashacms-dlassets'));
    } else {
        // config.akConfig
        //     .use(require('@akashacms/plugins-epub'));
        for (let plugin of config.plugins) {
            console.log(`Loading ${util.inspect(plugin)}`);
            if (plugin.options) {
                config.akConfig.use(require(plugin.name), plugin.options);
            } else {
                config.akConfig.use(require(plugin.name));
            }
        }
    }
    /*
    config.akConfig
        .use(require('./index' /*'@akashacms/plugins-epub'* /))
        .use(require('akashacms-dlassets'), {
            // TODO support configuring this directory from book config
            // NOTE that if this is left out then dlassets
            //      defaults to not caching external images
            // NOTE a book is unlikely to have many external images
            // NOTE __dirname does not have the correct value for use
            //      in this context.  The user should instead choose
            //      the cache directory
            // cachedir: path.join(__dirname, 'dlassets-cache')
        })
        /* .use(require('akashacms-footnotes')) * /
        /* .use(require('akashacms-embeddables')) * /;*/
    
    // TODO Possibly have a plugins object like
    //
    //    plugins:
    //        - name: @akashacms/plugins-footnotes
    //          config:
    //               fields for config

    // TODO Create a test case directory to test this CLI

    // TODO bump version number to match AkashaRender

    // TODO in epubtools, remove renderEPUB.js and fix manifest.js to not rely on AkashaRender.

    if (!config.bookroot) {
        throw new Error(`No bookroot specified`);
    }

    if (Array.isArray(config.bookroot)) {
        for (let dir of config.bookroot) {
           config.akConfig.addDocumentsDir(dir);
        }
    } else if (typeof config.bookroot === 'string'
    || typeof config.bookroot === 'object') {
        if (typeof config.bookroot === 'string'
         && config.baseMetadata) {
            config.akConfig.addDocumentsDir({
                src: config.bookroot,
                dest: '/',
                baseMetadata: config.baseMetadata
            });
        } else {
            config.akConfig.addDocumentsDir(config.bookroot);
        }
    } else {
        throw new Error(`Unknown bookroot ${util.inspect(config.bookroot)}`);
    }

    if (config.assetsDir) {
        if (Array.isArray(config.assetsDir)) {
            for (let dir of config.assetsDir) {
                // console.log(`add assets dir ${dir}`);
                config.akConfig.addAssetsDir(dir);
            }
        } else if (typeof config.assetsDir === 'string'
         || typeof config.assetsDir === 'object') {
            // console.log(`add assets dir ${util.inspect(config.assetsDir)}`);
            config.akConfig.addAssetsDir(config.assetsDir);
        } else {
            throw new Error(`Unknown assetsDir ${util.inspect(config.assetsDir)}`);
        }
    }
    if (config.layoutsDir) config.akConfig.addLayoutsDir(config.layoutsDir);
    // console.log(`config partialsDir `, config.partialsDir);
    if (config.partialsDir) config.akConfig.addPartialsDir(config.partialsDir);
    // console.log(`config config.akConfig `, config.akConfig.partialsDir);
    if (config.stylesheets) {
        for (let style of config.stylesheets) {
            config.akConfig.addStylesheet(style);
        }
    }

    if (config.footerjavascript) {
        for (let js of config.footerjavascript) {
            config.akConfig.addFooterJavaScript(js);
        }
    }
    if (config.headerjavascript) {
        for (let js of config.headerjavascript) {
            config.akConfig.addHeaderJavaScript(js);
        }
    }
    
    config.akConfig.setMahabhutaConfig({
        recognizeSelfClosing: true,
        recognizeCDATA: true,
        xmlMode: true
    });

    config.akConfig.setRenderDestination(config.bookRenderDest);

    config.akConfig.prepare();

    return config;
}

module.exports.readConfig = readConfig;