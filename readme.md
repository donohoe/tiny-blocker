# Tiny Blocker

Tiny Blocker is an experimental ad blocking extension for Google Chrome. 

It has no whitelist, no blacklist, and doesn't search the DOM for tell-tale ad classes and references. Instead, it blocks everything with exceptions to a few basic guesses on the domains from which content should be allowed.

In that respect it is overly aggressive but anecdotally threads the line between keeping sites usable and functional and blocking ton of unwanted code and media.

## Usage

It has been submitted to the *Chrome Web Store* (pending review). Until then you need to use it as an uncompiled extension. Visit this page to see how to do that: [Getting Started Tutorial](https://developer.chrome.com/extensions/getstarted#manifest)

1. Open the *Extension Management* page by navigating to [chrome://extensions](chrome://extensions).
   - It also be opened by clicking on the Chrome menu > More Tools then selecting *Extensions*.
2. Enable Developer Mode by clicking the toggle switch next to Developer mode.
3. Click the 'LOAD UNPACKED' button and select the extension directory.

## Tracking

There is no tracking performed by this extension. It minimizes data leakage by using [Content Security Polices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) (CSP) to block almost everything at a browser level.
