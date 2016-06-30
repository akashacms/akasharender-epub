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

const path   = require('path');
const util   = require('util');
const url    = require('url');
// const async  = require('async');
const akasha = require('akasharender');

module.exports = class RenderEPUBPlugin extends akasha.Plugin {
	constructor() {
		super("akasharender-epub");
	}

	configure(config) {
		this._config = config;

        config.setMahabhutaConfig({
            recognizeSelfClosing: true,
            recognizeCDATA: true,
            xmlMode: true
        });

		// config.addPartialsDir(path.join(__dirname, 'partials'));
		config.addMahabhuta(module.exports.mahabhuta);
	}
}

module.exports.mahabhuta = [

    // EPUB does not support the name= attribute on a tags
    function($, metadata, dirty, done) {
        // console.log('checking [name] in '+ metadata.document.path);
        $('a[name]').removeAttr('name');
        done();
    },

    // For cases with an H{1,2,3,4,5} tag inside a paragraph, move
    // the H tag outside the paragraph.
    function($, metadata, dirty, done) {
        // console.log('checking <p><h2></h2></p> in '+ metadata.document.path);
        ['p > h1', 'p > h2', 'p > h3', 'p > h4', 'p > h5'].forEach(selector => {
            $(selector).each(function(i, elem) {
                // console.log('this.html '+ $(this).parent().html());
                $(this).parent().after($(this).parent().html());
                $(this).parent().remove();
            });
        });
        done();
    },

];
