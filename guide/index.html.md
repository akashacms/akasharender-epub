---
layout: plugin-documentation.html.ejs
title: 'AskashaEPUB @akashacms/plugins-epub plugin documentation'
publicationDate: December 29, 2018
---

The `@akashacms/plugins-epub` plugin helps modify AkashaRender-rendered content to work well in an EPUB.  It is meant to be used along with _epubtools_ to generate an EPUB-formatted electronic book.  See https://akashacms.com/epubtools/toc.html for more information.


# Installation

With an AkashaEPUB electronic book setup, add the following to `package.json`

```
  "dependencies": {
    ...
    "@akashacms/plugins-epub": "^0.4.0",
    ...
  }
```

Once added to `package.json` run: `npm install`

# Configuration

In `config.js` for the website:

```
config.use(require('@akashacms/plugins-epub'));
```

See https://akashacms.com/epubtools/toc.html for further discussion of this plugin and the requirements for building an electronic book.

# Partials

This plugin overrides the partial, `framed-embed.html.ejs`, from the `akashacms-embeddables` plugin.  This lets us reference an embedded thingy, like a YouTube video, but use it correctly in an EPUB.  By EPUB rules we cannot reference external resources like videos.  What we can do is use the data available to `framed-embed.html.ejs`, and embed only the HTML that is safe for use in an EPUB.

# Layouts

To assist building EPUB's, `@akashacms/plugins-epub` includes a small collection of layout templates.  Generally these templates support:

* The `title` variable used in both the `<head>` area and in an `<header><h1></h1></header>` construct
* A _teaser_ section at the top of the page, if the `teaser` variable is set
* The `content` variable included in the expected place inside `<body>`
* A _copyright_ message at the bottom of the page if the `copyrightPartial` variable is set.  As the variable name implies, this is the file name of a _partial_ containing stuff you want at the bottom of the page, such as a copyright message.

The three layout templates are:

* `ebook-page.html.ejs` -- Also incorporates stylesheets and JavaScript (EPUB3 does support JavaScript).  Meant for typical pages in an EPUB.
* `ebook-simple-page.html.ejs` -- Does not incorporate stylesheets of JavaScript.
* `ebook-toc-page.html.ejs` -- Like `ebook-page` but with a different file name, in case your needs include different layout templates for different pages.