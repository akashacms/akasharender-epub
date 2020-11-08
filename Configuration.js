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
        return this.YAML
             && this.YAML.akashaepub.bookroot
                ? this.YAML.akashaepub.bookroot
                : "documents"; // : undefined; 
    }
    set bookroot(newBookroot) {
        this.YAML.akashaepub.bookroot = newBookroot;
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
        return this.YAML.akashaepub
             && this.YAML.akashaepub.assetsDir
                ? this.YAML.akashaepub.assetsDir
                : "assets"; // : undefined; 
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
        return this.YAML.akashaepub
             && this.YAML.akashaepub.partialsDir
                ? this.YAML.akashaepub.partialsDir
                : "partials"; // : undefined; 
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
        return this.YAML.akashaepub
             && this.YAML.akashaepub.layoutsDir
                ? this.YAML.akashaepub.layoutsDir
                : "layouts"; // : undefined; 
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
        return this.YAML.akashaepub
             && this.YAML.akashaepub.bookdest
                ? this.YAML.akashaepub.bookdest
                : "out"; // : undefined;
    }
    set bookRenderDest(newRenderRoot) {
        this.YAML.akashaepub.bookdest = newRenderRoot;
    }

    get bookRenderDestFullPath() {
        if (!this.bookRenderDest) throw new Error('No bookRenderDest set');
        return path.normalize(
            path.join(
                this.configDirPath, this.bookRenderDest ? this.bookRenderDest : ""
            )
        );
    }


}


async function readConfig(configFN) {

    const yamlText = await fs.readFile(configFN, 'utf8');
    let config = new module.exports.Configuration(yamlText);
    config.configFileName = configFN;
    // const YML = yaml.safeLoad(yamlText);
    config.akConfig = new akasha.Configuration();
    config.akConfig
        .use(require('@akashacms/plugins-epub'))
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
        /* .use(require('akashacms-footnotes')) */
        /* .use(require('akashacms-embeddables')) */;
    
    // TODO Possibly have a plugins object like
    //
    //    plugins:
    //        - name: @akashacms/plugins-footnotes
    //          config:
    //               fields for config

    // TODO Detect if bookroot, or assetsDir, or layoutsDir etc are arrays
    // and run a loop

    // NOTE This already handles the case of this being an object describing
    // a complex directory

    // TODO Create a test case directory to test this CLI

    // TODO Delete renderEPUB.js

    // TODO bump version number to match AkashaRender

    // TODO in epubtools, remove renderEPUB.js and fix manifest.js to not rely on AkashaRender.

    config.akConfig.addDocumentsDir(config.bookroot);
    if (config.assetsDir) config.akConfig.addAssetsDir(config.assetsDir);
    if (config.layoutsDir) config.akConfig.addLayoutsDir(config.layoutsDir);
    if (config.partialsDir) config.akConfig.addPartialsDir(config.partialsDir);
    if (config.stylesheets) {
        for (let style of config.stylesheets) {
            config.akConfig.addStylesheet(style);
        }
    }
    
    config.akConfig.setMahabhutaConfig({
        recognizeSelfClosing: true,
        recognizeCDATA: true,
        xmlMode: true
    });

    config.akConfig.setRenderDestination(config.renderTo);

    config.akConfig.prepare();

    return config;
}

module.exports.readConfig = readConfig;