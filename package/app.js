/* v0.1 */

var ಠ_ಠ = {

	csp:     null,
	domains: [],

	init: function() {
		console.log("Tiny Blocker: Running");
		console.time("Tiny Blocker");
		this.insertMetaTag();

		if (this.getParam('clear') === '1') {
			this.clear();
		}

		var self = this;
		document.addEventListener("DOMContentLoaded", function(){
			self.removeBlockedImages();
		});

		console.timeEnd("Tiny Blocker");
	},

	test: function() {
		var csp = this.getContentSecurityPolicy();
		chrome.webRequest.onBeforeSendHeaders.addListener(
			function(details) {
				for (var i = 0; i < details.requestHeaders.length; ++i) {
					if (details.requestHeaders[i].name === 'Content-Security-Policy') {
						details.requestHeaders.splice(i, 1);
						break;
					}
				}
				var h = {};
				h.name  = 'Content-Security-Policy';
				h.value = csp;
				return { requestHeaders: details.requestHeaders };
			},
			{ urls: [ "<all_urls>" ] },
			[ "requestHeaders" ]
		);
	},

	insertMetaTag: function() {
		console.log("Tiny Blocker: insertMetaTag");
		var c = 0;
		var self = this;

		var t = setInterval(function(){
			var h = document.head || false;
			if (h) {
				self.csp = self.getContentSecurityPolicy();
				var m = self.getMetaTag();
				document.head.appendChild( m );
				clearInterval( t );
			}
			if (c > 1024) {
				clearInterval( t );
				console.log("Tiny Blocker: Giving up", c);
			}
			c++;
		}, 1);
	},

	getMetaTag: function() {
		var m = document.createElement("META");
		m.id = "csp";
		m.setAttribute( "http-equiv", "Content-Security-Policy" );
		m.setAttribute( "content", this.csp );
		return m;
	},

	getContentSecurityPolicy: function( overRide) {
		var self = this;
		var overRide = overRide || false;
		var csp = false;

		if (!overRide && typeof localStorage !== 'undefined') {
			csp = localStorage.getItem( "tiny_blocker_csp" ) || false;
			if (csp) {
				return csp;
			}
		}

		csp = this.createContentSecurityPolicy();

	/*
		If we are here then is this is the first runnign on this domain and we should
		do a later check for more domains that should be added to CSP
	*/
		document.addEventListener("DOMContentLoaded", function(){
			console.log("Tiny Blocker: DOM content loaded");
			self.checkForMoreDomains();
		});

		return csp;
	},

	createContentSecurityPolicy: function() {
		console.log("Tiny Blocker: createContentSecurityPolicy");
		var hns = this.getLikleyGoodDomains().join(' ');

		csp = [
			"default-src", "'self' " + hns + ";",
			"style-src",   "'unsafe-inline' *;",
			"script-src",  "'self' 'unsafe-inline' 'unsafe-eval' " + hns + ";",
			"img-src",     "'self' 'unsafe-inline' " + hns + " data: ;",
			"font-src",    "'self' data: *;"
		].join(" ");

	/*	Save for next time */
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem( "tiny_blocker_csp", csp );
			this.setExpiration();
		}

		return csp;
	},

	isExpired: function() {
		var exp = localStorage.getItem( "tiny_blocker_csp_exp" ) || false;
		if (exp) {
			exp = parseInt(exp, 10);
			return (new Date().getTime() > exp);
		}
		return true;
	},

	setExpiration: function() {
		console.log("setExpiration");
		var day = 24 * 60 * 60 * 1000;
		var expiration = new Date().getTime() + (day * 1);
		localStorage.setItem( "tiny_blocker_csp_exp", expiration );
	},

	getLikleyGoodDomains: function() {
		var domains = [];

	/*	Whitelist immediate domain and its subdomains */
		var h = "";
		if (location.hostname.substring(0, 4) === "www.") {
			this.collectDomain( location.hostname.replace("www.", "*.") );
		} else {
			if ((location.hostname.match(/\./g) || []).length === 1) {
				this.collectDomain( "*." + location.hostname );
			}
		}

	/*	Check META tags for candidiates */
		var metaTags = document.head.querySelectorAll( "meta[property][content^='http']" ) || [];
		var l = metaTags.length;
		for (var i=0; i<l; i++) {
			var m = metaTags[i];
			var content = m.getAttribute( 'content' ) || false;
			this.collectDomain( content );
		}

	/*	Is this a good signal? */
		var link = document.querySelector("link[rel='shortcut icon']") || false;
		if (link) {
			var href = link.getAttribute( 'href' ) || false;
			console.log("href", href);
			this.collectDomain( href );
		}

		return this.domains;
	},

/*
	Once page has fully loaded we might be abe to find  hostnames
	that we know to whitelist. This is ripe for abuse but for v1 who cares.
*/
	checkForMoreDomains: function() {
		var currentDomainCount = this.domains.length;
		var img = document.querySelector("img") || false;
		if (img) {
			var src = img.getAttribute( 'src' ) || false;
			this.collectDomain( src );
		}

		var newDomainCount = this.domains.length;
		if (newDomainCount > currentDomainCount) {
			var csp = this.createContentSecurityPolicy();
			this.notifyUser();
		}
	},

	removeBlockedImages: function() {
		var self = this;
		var t = setTimeout(function(){
			var imgs = document.querySelectorAll("img") || false;
			if (imgs) {
				var len = imgs.length;
				for (var i=0; i<len; i++) {
					var img = imgs[i];
					if (img.style.display !== 'none') {
						if (img.naturalHeight !== undefined) {
							if (img.naturalHeight + img.naturalWidth === 0) {
								img.style.display = 'none';
							}
						} else if (img.width + img.height == 0) {
							img.style.display = 'none';
						}
					}
				}
			}
		}, 3210);
	},

	notifyUser: function() {
		var div = document.createElement("DIV");
		div.id = "tiny_blocker_notification";
		div.innerHTML = [
			// '<span id="tiny_blocker_close" aria-label="Close">&times;</span>',
			'<div>',
				'<span id="tiny_blocker_msg">Whitelist additions were found.<br/>Refresh for an improved experience</span>',
			'</div>',
		].join('');
		document.body.appendChild( div );

		div.addEventListener("click", function(){
			window.location.reload(false);
		});

		var t = setTimeout(function(){
			div.style.opacity = '0';
			setTimeout(function(){
				div.parentNode.removeChild(div);
			}, 1301);
		}, 5000);

		setTimeout(function(){
			div.style.opacity = '1';
		}, 1000);
	},

	collectDomain: function ( url ) {
		if (url) {
			if (url.substring(0, 4) === "http") {
				var d = this.getDomain( url );
				if (d) {
					d = (d.substring(0, 1) === ".") ? d = "*" + d : d = "*." + d;
					if (this.domains.indexOf( d ) === -1) {
						this.domains.push( d );
					}
				}
			}
		}
	},

	getDomain: function( url ) {
		var hn = this.getHostname( url );
		var sd = this.getSubdomain( hn );
		if (sd) {
			return hn.replace( sd, "" );
		}
		return hn;
	},

	getHostname: function( url ) {
		var l = document.createElement("A");
		l.href = url;
		return l.hostname || false;
	},

	getSubdomain: function ( hostname ) {
		var re = new RegExp('[a-z\-0-9]{2,63}\.[a-z\.]{2,5}$');
		var parts = re.exec(hostname);
		return hostname.replace(parts[0], '').slice(0, -1);
	},

	getParam: function  ( p ) {
		var s = new RegExp( '[?&]' + p + '=([^&#]*)', 'i' ).exec( window.location.href );
		return s ? s[1] : null;
	},

	clear: function() {
		localStorage.removeItem( "tiny_blocker_csp" );
		localStorage.removeItem( "tiny_blocker_csp_exp" );
	}
};

ಠ_ಠ.init();
