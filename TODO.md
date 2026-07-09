
Goal... Develop a simple-to-setup experience for editing EPUB ebooks.

Don't use TODO.md for tracking this, use the issue queue.

For live rebuild - AkashaRender doesn't support this any longer.  I forget the name of the tool to do this, but simply document how to use that.  For live review, using live-server for that is good.

For live EPUB rebuild - the process should be turned into a simple process.  Study the process

For batch EPUB build - look at the recommendation below

Study better integration with PDF Document Maker, as well as EPUB Website.

Focus the work by starting with a rewrite of the Open Source EPUB book.  Use the rewrite of that book as the testing ground on features for AkashaEPUB.

The book should refocus on building both EPUB and PDF books, showcasing the two tools PDF Document Maker and AkashaEPUB.

Retitle the book - Open Source building high quality EPUB and PDF e-Books 



# Archive

This section is left over from history and is likely out-of-date

It must support the following:

* Live preview editing, using Markdown or AsciiDoc, preview in browser
    * Existing watch-epub along with live-server
* Live rebuild of EPUB
    * TODO - how to automate mkmeta/package commands?
* Batch build of EPUB
    * Existing render command, plus epubtools
* Option for integrating with an AkashaCMS website (epub-website)
    * This means a command which handles epub-website easily


Tasks...

* When will akasharender#watcher be declared finalized?  Soon?
* Screencast series showing how
* Blog posts that cross post to Medium about how
* Rewrite/update the EPUB's from Markdown book?

