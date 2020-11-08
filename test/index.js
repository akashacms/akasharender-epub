
const { promisify } = require('util');
const { assert } = require('chai');
const epubtools  = require('epubtools');
const epubrender = require('../rendercli');
const epubconfig = require('../Configuration');
const akasha     = require('akasharender');


describe('read config file', function() {
    
    let config;
    const configFN = 'test.epubtools';

    it('should read config file', async function() {
        config = await epubconfig.readConfig(configFN);
    });

    it('should verify config object', async function() {
        await config.check();
    });

    it('should have correct config file name', function() {
        assert.equal(config.configFileName, configFN);
    });

    it('should have correct bookroot path', function() {
        assert.equal(config.bookroot, 'documents');
    });
    
    it('should have correct sourceBookFullPath path', function() {
        assert.equal(config.sourceBookFullPath, 'documents');
    });
    
    it('should have correct assetsDir path', function() {
        assert.equal(config.assetsDir, "assets");
    });

    it('should have correct assetsDirFullPath path', function() {
        assert.equal(config.assetsDirFullPath, "assets");
    });

    it('should have correct partialsDir path', function() {
        assert.equal(config.partialsDir, "partials");
    });
    
    it('should have correct partialsDirFullPath path', function() {
        assert.equal(config.partialsDirFullPath, "partials");
    });

    it('should have correct layoutsDir path', function() {
        assert.equal(config.layoutsDir, "layouts");
    });
    
    it('should have correct layoutsDirFullPath path', function() {
        assert.equal(config.layoutsDirFullPath, "layouts");
    });
    
    it('should have correct bookRenderDest path', function() {
        assert.equal(config.bookRenderDest, "out");
    });
    
    it('should have correct bookRenderDestFullPath path', function() {
        assert.equal(config.bookRenderDestFullPath, "out");
    });
    
    
});

describe('modify config file', function() {
    
    let config;
    const configFN = 'test.epubtools';

    it('should read config file', async function() {
        config = await epubconfig.readConfig(configFN);
    });

    it('should verify config object', async function() {
        await config.check();
    });

    // Test the set methods

    it('should correctly change bookroot path', function() {
        let foo = 'foocuments';
        config.bookroot = foo;
        assert.equal(config.bookroot, foo);
    });
    
    it('should correctly change assetsDir path', function() {
        let foo = 'foossets';
        config.assetsDir = foo;
        assert.equal(config.assetsDir, foo);
    });

    it('should correctly change partialsDir path', function() {
        let foo = 'footials';
        config.partialsDir = foo;
        assert.equal(config.partialsDir, foo);
    });
    
    it('should correctly change layoutsDir path', function() {
        let foo = 'fooyouts';
        config.layoutsDir = foo;
        assert.equal(config.layoutsDir, foo);
    });
    
    it('should correctly change bookRenderDest path', function() {
        let foo = 'fout';
        config.bookRenderDest = foo;
        assert.equal(config.bookRenderDest, foo);
    });
    
});

describe('save modified config file', function() {
    
    let config;
    const configFN = 'test.epubtools';

    it('should read config file', async function() {
        config = await epubconfig.readConfig(configFN);
    });

    it('should verify config object', async function() {
        await config.check();
    });

    // Modify a few fields
    // Save the file
    // Read it again
    // Check that modifications held
    
    it('should modify the config object', function() {
        config.bookroot = 'foocuments';
        config.assetsDir = 'foosets';
    });

    it('should have changed bookroot', function() {
        assert.equal(config.bookroot, 'foocuments');
    });
    
    it('should have changed assetsDir', function() {
        assert.equal(config.assetsDir, 'foosets');
    });
    
    let newFileName = 'modified.epubtools';
    it('should save the config object', async function() {
        config.configFileName = newFileName;
        await config.save();
    });

    let newConfig;
    it('should read the modified config', async function() {
        newConfig = await epubconfig.readConfig(newFileName);
    });

    it('should read changed bookroot', function() {
        assert.equal(config.bookroot, 'foocuments');
    });
    
    it('should read changed assetsDir', function() {
        assert.equal(config.assetsDir, 'foosets');
    });
    
});

describe('build test book', function() {
    it('should build test book', async function() {

        // let config = await epubrender.doRender('test.epubtools');

    });
});

