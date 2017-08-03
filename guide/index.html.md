---
layout: plugin-documentation.html.ejs
title: AskashaEPUB akasharender-epub plugin documentation
publicationDate: August 4, 2017
---

The `akasharender-epub` plugin helps modify AkashaRender-rendered content to work well in an EPUB.  It is meant to be used along with _epubtools_ to generate an EPUB-formatted electronic book.  See https://akashacms.com/epubtools/toc.html for more information.


# Installation

With an AkashaEPUB electronic book setup, add the following to `package.json`

```
  "dependencies": {
    ...
    "akasharender-epub": "akashacms/akasharender-epub",
    ...
  }
```

At this time the plugin has not been published to the npm registry.  Instead you list the dependency as shown here.  Once added to `package.json` run: `npm install`

# Configuration

In `config.js` for the website:

```
config.use(require('akasharender-epub'));
```

See https://akashacms.com/epubtools/toc.html for further discussion of this plugin and the requirements for building an electronic book.
