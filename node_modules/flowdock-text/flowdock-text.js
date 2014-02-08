/*!
 * flowdock-text 0.1.5
 *
 * Copyright 2011 Twitter, Inc.
 * Copyright 2011 Flowdock Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this work except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 */
if (typeof window === "undefined" || window === null) {
  window = { FlowdockText: {} };
}
if (window.FlowdockText == null) {
  window.FlowdockText = {};
}
if (typeof FlowdockText === "undefined" || FlowdockText === null) {
  FlowdockText = {};
}

(function() {
  FlowdockText = {};
  FlowdockText.regexen = {};

  var HTML_ENTITIES = {
    '&': '&amp;',
    '>': '&gt;',
    '<': '&lt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  // HTML escaping
  FlowdockText.htmlEscape = function(text) {
    return text && text.replace(/[&"'><]/g, function(character) {
      return HTML_ENTITIES[character];
    });
  };

  // Builds a RegExp
  function regexSupplant(regex, flags) {
    flags = flags || "";
    if (typeof regex !== "string") {
      if (regex.global && flags.indexOf("g") < 0) {
        flags += "g";
      }
      if (regex.ignoreCase && flags.indexOf("i") < 0) {
        flags += "i";
      }
      if (regex.multiline && flags.indexOf("m") < 0) {
        flags += "m";
      }

      regex = regex.source;
    }

    return new RegExp(regex.replace(/#\{(\w+)\}/g, function(match, name) {
      var newRegex = FlowdockText.regexen[name] || "";
      if (typeof newRegex !== "string") {
        newRegex = newRegex.source;
      }
      return newRegex;
    }), flags);
  }

  // simple string interpolation
  function stringSupplant(str, values) {
    return str.replace(/#\{(\w+)\}/g, function(match, name) {
      return values[name] || "";
    });
  }

  function addCharsToCharClass(charClass, start, end) {
    var s = String.fromCharCode(start);
    if (end !== start) {
      s += "-" + String.fromCharCode(end);
    }
    charClass.push(s);
    return charClass;
  }

  // Space is more than %20, U+3000 for example is the full-width space used with Kanji. Provide a short-hand
  // to access both the list of characters and a pattern suitible for use with String#split
  // Taken from: ActiveSupport::Multibyte::Handlers::UTF8Handler::UNICODE_WHITESPACE
  var fromCode = String.fromCharCode;
  var UNICODE_SPACES = [
    fromCode(0x0020), // White_Space # Zs       SPACE
    fromCode(0x0085), // White_Space # Cc       <control-0085>
    fromCode(0x00A0), // White_Space # Zs       NO-BREAK SPACE
    fromCode(0x1680), // White_Space # Zs       OGHAM SPACE MARK
    fromCode(0x180E), // White_Space # Zs       MONGOLIAN VOWEL SEPARATOR
    fromCode(0x2028), // White_Space # Zl       LINE SEPARATOR
    fromCode(0x2029), // White_Space # Zp       PARAGRAPH SEPARATOR
    fromCode(0x202F), // White_Space # Zs       NARROW NO-BREAK SPACE
    fromCode(0x205F), // White_Space # Zs       MEDIUM MATHEMATICAL SPACE
    fromCode(0x3000)  // White_Space # Zs       IDEOGRAPHIC SPACE
  ];
  addCharsToCharClass(UNICODE_SPACES, 0x009, 0x00D); // White_Space # Cc   [5] <control-0009>..<control-000D>
  addCharsToCharClass(UNICODE_SPACES, 0x2000, 0x200A); // White_Space # Zs  [11] EN QUAD..HAIR SPACE

  var INVALID_CHARS = [
    fromCode(0xFFFE),
    fromCode(0xFEFF), // BOM
    fromCode(0xFFFF) // Special
  ];
  addCharsToCharClass(INVALID_CHARS, 0x202A, 0x202E); // Directional change

  FlowdockText.regexen.spaces_group = regexSupplant(UNICODE_SPACES.join(""));
  FlowdockText.regexen.spaces = regexSupplant("[" + UNICODE_SPACES.join("") + "]");
  FlowdockText.regexen.invalid_chars_group = regexSupplant(INVALID_CHARS.join(""));
  FlowdockText.regexen.punct = /\!'#%&'\(\)*\+,\\\-\.\/:;<=>\?@\[\]\^_{|}~\$/;
  FlowdockText.regexen.atSigns = /[@＠]/;
  FlowdockText.regexen.extractMentions = regexSupplant(/(^|[^a-zA-Z0-9_!#$%&*@＠])(#{atSigns})([a-zA-Z0-9_]{1,20})/g);

  var nonLatinHashtagChars = [];
  // Cyrillic
  addCharsToCharClass(nonLatinHashtagChars, 0x0400, 0x04ff); // Cyrillic
  addCharsToCharClass(nonLatinHashtagChars, 0x0500, 0x0527); // Cyrillic Supplement
  addCharsToCharClass(nonLatinHashtagChars, 0x2de0, 0x2dff); // Cyrillic Extended A
  addCharsToCharClass(nonLatinHashtagChars, 0xa640, 0xa69f); // Cyrillic Extended B
  // Hangul (Korean)
  addCharsToCharClass(nonLatinHashtagChars, 0x1100, 0x11ff); // Hangul Jamo
  addCharsToCharClass(nonLatinHashtagChars, 0x3130, 0x3185); // Hangul Compatibility Jamo
  addCharsToCharClass(nonLatinHashtagChars, 0xA960, 0xA97F); // Hangul Jamo Extended-A
  addCharsToCharClass(nonLatinHashtagChars, 0xAC00, 0xD7AF); // Hangul Syllables
  addCharsToCharClass(nonLatinHashtagChars, 0xD7B0, 0xD7FF); // Hangul Jamo Extended-B
  addCharsToCharClass(nonLatinHashtagChars, 0xFFA1, 0xFFDC); // half-width Hangul
  // Japanese and Chinese
  addCharsToCharClass(nonLatinHashtagChars, 0x30A1, 0x30FA); // Katakana (full-width)
  addCharsToCharClass(nonLatinHashtagChars, 0x30FC, 0x30FE); // Katakana Chouon and iteration marks (full-width)
  addCharsToCharClass(nonLatinHashtagChars, 0xFF66, 0xFF9F); // Katakana (half-width)
  addCharsToCharClass(nonLatinHashtagChars, 0xFF70, 0xFF70); // Katakana Chouon (half-width)
  addCharsToCharClass(nonLatinHashtagChars, 0xFF10, 0xFF19); // \
  addCharsToCharClass(nonLatinHashtagChars, 0xFF21, 0xFF3A); //  - Latin (full-width)
  addCharsToCharClass(nonLatinHashtagChars, 0xFF41, 0xFF5A); // /
  addCharsToCharClass(nonLatinHashtagChars, 0x3041, 0x3096); // Hiragana
  addCharsToCharClass(nonLatinHashtagChars, 0x3099, 0x309E); // Hiragana voicing and iteration mark
  addCharsToCharClass(nonLatinHashtagChars, 0x3400, 0x4DBF); // Kanji (CJK Extension A)
  addCharsToCharClass(nonLatinHashtagChars, 0x4E00, 0x9FFF); // Kanji (Unified)
  // -- Disabled as it breaks the Regex.
  //addCharsToCharClass(nonLatinHashtagChars, 0x20000, 0x2A6DF); // Kanji (CJK Extension B)
  addCharsToCharClass(nonLatinHashtagChars, 0x2A700, 0x2B73F); // Kanji (CJK Extension C)
  addCharsToCharClass(nonLatinHashtagChars, 0x2B740, 0x2B81F); // Kanji (CJK Extension D)
  addCharsToCharClass(nonLatinHashtagChars, 0x2F800, 0x2FA1F); // Kanji (CJK supplement)
  addCharsToCharClass(nonLatinHashtagChars, 0x3003, 0x3003); // Kanji iteration mark
  addCharsToCharClass(nonLatinHashtagChars, 0x3005, 0x3005); // Kanji iteration mark
  addCharsToCharClass(nonLatinHashtagChars, 0x303B, 0x303B); // Han iteration mark

  FlowdockText.regexen.nonLatinHashtagChars = regexSupplant(nonLatinHashtagChars.join(""));
  // Latin accented characters (subtracted 0xD7 from the range, it's a confusable multiplication sign. Looks like "x")
  FlowdockText.regexen.latinAccentChars = regexSupplant("ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏİÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïıðñòóôõöøùúûüýþş\\303\\277");

  FlowdockText.regexen.endScreenNameMatch = regexSupplant(/^(?:#{atSigns}|[#{latinAccentChars}]|:\/\/)/);

  // A hashtag must contain characters, numbers and underscores, but not all numbers.
  FlowdockText.regexen.hashtagAlpha = regexSupplant(/[a-z_#{latinAccentChars}#{nonLatinHashtagChars}]/i);
  FlowdockText.regexen.usernameAlphaNumeric = regexSupplant(/[a-z0-9_\-\.#{latinAccentChars}#{nonLatinHashtagChars}]/i);
  FlowdockText.regexen.usernameAlphaNumericEnd = regexSupplant(/[a-z0-9_\-#{latinAccentChars}#{nonLatinHashtagChars}]/i);
  FlowdockText.regexen.hashtagAlphaNumeric = regexSupplant(/[a-z0-9_\-#{latinAccentChars}#{nonLatinHashtagChars}]/i);
  FlowdockText.regexen.endHashtagMatch = /^(?:[#＃]|:\/\/)/;
  FlowdockText.regexen.hashtagBoundary = regexSupplant(/(?:^|$|[^&\/a-z0-9_#{latinAccentChars}#{nonLatinHashtagChars}])/);
  // FlowdockText change: allow all-numeric hashtags
  FlowdockText.regexen.autoLinkHashtags = regexSupplant(/(#{hashtagBoundary})(#|＃)(#{hashtagAlphaNumeric}+)/gi);
  FlowdockText.regexen.autoLinkMentions = regexSupplant(/(#{hashtagBoundary})(@)(#{usernameAlphaNumeric}*#{usernameAlphaNumericEnd}+)/gi);
  // We want to only match words starting with the nickname and ignore case
  FlowdockText.regexen.highlightRegex = function(nick) {
    if (nick && nick.length > 0) { return new RegExp('([\\b\\s]|^)+' + regexEscape(nick) + '([\\b\\s\\!\\?\\,\\:\\;\\.]|$)+', 'i'); }
  };

  // URL related hash regex collection
  FlowdockText.regexen.validPrecedingChars = regexSupplant(/(?:[^-\/"'!=A-Za-z0-9_@＠$#＃\.#{invalid_chars_group}]|^)/);

  FlowdockText.regexen.invalidDomainChars = stringSupplant("#{punct}#{spaces_group}#{invalid_chars_group}", FlowdockText.regexen);
  FlowdockText.regexen.validDomainChars = regexSupplant(/[^#{invalidDomainChars}]/);
  FlowdockText.regexen.validSubdomain = regexSupplant(/(?:(?:#{validDomainChars}(?:[_-]|#{validDomainChars})*)?#{validDomainChars}\.)/);
  FlowdockText.regexen.validDomainName = regexSupplant(/(?:(?:#{validDomainChars}(?:-|#{validDomainChars})*)?#{validDomainChars}\.)/);
  FlowdockText.regexen.validGTLD = regexSupplant(/(?:(?:aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|xxx|local|dmz|lan)(?=[^a-zA-Z]|$))/);
  FlowdockText.regexen.validCCTLD = regexSupplant(/(?:(?:ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cs|cu|cv|cx|cy|cz|dd|de|dj|dk|dm|do|dz|ec|ee|eg|eh|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|ss|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)(?=[^a-zA-Z]|$))/);
  FlowdockText.regexen.validPunycode = regexSupplant(/(?:xn--[0-9a-z]+)/);
  FlowdockText.regexen.validDomain = regexSupplant(/(?:#{validSubdomain}*#{validDomainName}(?:#{validGTLD}|#{validCCTLD}|#{validPunycode}))/);
  FlowdockText.regexen.pseudoValidIP = regexSupplant(/(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
  FlowdockText.regexen.validAsciiDomain = regexSupplant(/(?:(?:[a-z0-9#{latinAccentChars}\-]+)\.)+(?:#{validGTLD}|#{validCCTLD}|#{validPunycode})/gi);

  FlowdockText.regexen.validPortNumber = regexSupplant(/[0-9]+/);

  FlowdockText.regexen.validGeneralUrlPathChars = regexSupplant(/[a-z0-9!\*';:=\+,\.\$\/%#\[\]\-_~|&#{latinAccentChars}]/i);
  // Allow URL paths to contain balanced parens
  //  1. Used in Wikipedia URLs like /Primer_(film)
  //  2. Used in IIS sessions like /S(dfd346)/
  FlowdockText.regexen.validUrlBalancedParens = regexSupplant(/\(#{validGeneralUrlPathChars}+\)/i);
  // Valid end-of-path chracters (so /foo. does not gobble the period).
  // 1. Allow =&# for empty URL parameters and other URL-join artifacts
  FlowdockText.regexen.validUrlPathEndingChars = regexSupplant(/[\+\-a-z0-9=_#\/#{latinAccentChars}]|(?:#{validUrlBalancedParens})/i);
  // Allow @ in a url, but only in the middle. Catch things like http://example.com/@user/ and Plone urls like http://example.org/my-document/@@as-message
  FlowdockText.regexen.validUrlPath = regexSupplant('(?:' +
    '(?:' +
      '#{validGeneralUrlPathChars}*' +
        '(?:#{validUrlBalancedParens}#{validGeneralUrlPathChars}*)*' +
        '#{validUrlPathEndingChars}'+
      ')|(?:(@|@@)#{validGeneralUrlPathChars}+\/?)'+
    ')', 'i');

  FlowdockText.regexen.validUrlQueryChars = /[a-z0-9!?\*'\(\);:&=\+\$\/%#\[\]\-_\.,~|]/i;
  FlowdockText.regexen.validUrlQueryEndingChars = /[a-z0-9_&=#\/]/i;
  FlowdockText.regexen.extractUrl = regexSupplant(
    '('                                                            + // $1 total match
      '(#{validPrecedingChars})'                                   + // $2 Preceeding chracter
      '('                                                          + // $3 URL
        '(https?:\\/\\/)?'                                         + // $4 Protocol (optional)
        '(#{validDomain}|#{pseudoValidIP})'                        + // $5 Domain(s)
        '(?::(#{validPortNumber}))?'                               + // $6 Port number (optional)
        '(\\/#{validUrlPath}*)?'                                   + // $7 URL Path
        '(\\?#{validUrlQueryChars}*#{validUrlQueryEndingChars})?'  + // $8 Query String
      ')'                                                          +
    ')'
  , 'gi');

  FlowdockText.regexen.validTcoUrl = /^https?:\/\/t\.co\/[a-z0-9]+/i;

  // These URL validation pattern strings are based on the ABNF from RFC 3986
  FlowdockText.regexen.validateUrlUnreserved = /[a-z0-9\-._~]/i;
  FlowdockText.regexen.validateUrlPctEncoded = /(?:%[0-9a-f]{2})/i;
  FlowdockText.regexen.validateUrlSubDelims = /[!$&'()*+,;=]/i;
  FlowdockText.regexen.validateUrlPchar = regexSupplant('(?:' +
    '#{validateUrlUnreserved}|' +
    '#{validateUrlPctEncoded}|' +
    '#{validateUrlSubDelims}|' +
    '[:|@]' +
  ')', 'i');

  FlowdockText.regexen.validateUrlScheme = /(?:[a-z][a-z0-9+\-.]*)/i;
  FlowdockText.regexen.validateUrlUserinfo = regexSupplant('(?:' +
    '#{validateUrlUnreserved}|' +
    '#{validateUrlPctEncoded}|' +
    '#{validateUrlSubDelims}|' +
    ':' +
  ')*', 'i');

  FlowdockText.regexen.validateUrlDecOctet = /(?:[0-9]|(?:[1-9][0-9])|(?:1[0-9]{2})|(?:2[0-4][0-9])|(?:25[0-5]))/i;
  FlowdockText.regexen.validateUrlIpv4 = regexSupplant(/(?:#{validateUrlDecOctet}(?:\.#{validateUrlDecOctet}){3})/i);

  // Punting on real IPv6 validation for now
  FlowdockText.regexen.validateUrlIpv6 = /(?:\[[a-f0-9:\.]+\])/i;

  // Also punting on IPvFuture for now
  FlowdockText.regexen.validateUrlIp = regexSupplant('(?:' +
    '#{validateUrlIpv4}|' +
    '#{validateUrlIpv6}' +
  ')', 'i');

  // This is more strict than the rfc specifies
  FlowdockText.regexen.validateUrlSubDomainSegment = /(?:[a-z0-9](?:[a-z0-9_\-]*[a-z0-9])?)/i;
  FlowdockText.regexen.validateUrlDomainSegment = /(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?)/i;
  FlowdockText.regexen.validateUrlDomainTld = /(?:[a-z](?:[a-z0-9\-]*[a-z0-9])?)/i;
  FlowdockText.regexen.validateUrlDomain = regexSupplant(/(?:(?:#{validateUrlSubDomainSegment]}\.)*(?:#{validateUrlDomainSegment]}\.)#{validateUrlDomainTld})/i);

  FlowdockText.regexen.validateUrlHost = regexSupplant('(?:' +
    '#{validateUrlIp}|' +
    '#{validateUrlDomain}' +
  ')', 'i');

  // Unencoded internationalized domains - this doesn't check for invalid UTF-8 sequences
  FlowdockText.regexen.validateUrlUnicodeSubDomainSegment = /(?:(?:[a-z0-9]|[^\u0000-\u007f])(?:(?:[a-z0-9_\-]|[^\u0000-\u007f])*(?:[a-z0-9]|[^\u0000-\u007f]))?)/i;
  FlowdockText.regexen.validateUrlUnicodeDomainSegment = /(?:(?:[a-z0-9]|[^\u0000-\u007f])(?:(?:[a-z0-9\-]|[^\u0000-\u007f])*(?:[a-z0-9]|[^\u0000-\u007f]))?)/i;
  FlowdockText.regexen.validateUrlUnicodeDomainTld = /(?:(?:[a-z]|[^\u0000-\u007f])(?:(?:[a-z0-9\-]|[^\u0000-\u007f])*(?:[a-z0-9]|[^\u0000-\u007f]))?)/i;
  FlowdockText.regexen.validateUrlUnicodeDomain = regexSupplant(/(?:(?:#{validateUrlUnicodeSubDomainSegment}\.)*(?:#{validateUrlUnicodeDomainSegment}\.)#{validateUrlUnicodeDomainTld})/i);

  FlowdockText.regexen.validateUrlUnicodeHost = regexSupplant('(?:' +
    '#{validateUrlIp}|' +
    '#{validateUrlUnicodeDomain}' +
  ')', 'i');

  FlowdockText.regexen.validateUrlPort = /[0-9]{1,5}/;

  FlowdockText.regexen.validateUrlUnicodeAuthority = regexSupplant(
    '(?:(#{validateUrlUserinfo})@)?'  + // $1 userinfo
    '(#{validateUrlUnicodeHost})'     + // $2 host
    '(?::(#{validateUrlPort}))?'        //$3 port
  , "i");

  FlowdockText.regexen.validateUrlAuthority = regexSupplant(
    '(?:(#{validateUrlUserinfo})@)?' + // $1 userinfo
    '(#{validateUrlHost})'           + // $2 host
    '(?::(#{validateUrlPort}))?'       // $3 port
  , "i");

  FlowdockText.regexen.validateUrlPath = regexSupplant(/(\/#{validateUrlPchar}*)*/i);
  FlowdockText.regexen.validateUrlQuery = regexSupplant(/(#{validateUrlPchar}|\/|\?)*/i);
  FlowdockText.regexen.validateUrlFragment = regexSupplant(/(#{validateUrlPchar}|\/|\?)*/i);

  // Modified version of RFC 3986 Appendix B
  FlowdockText.regexen.validateUrlUnencoded = regexSupplant(
    '^'                               + // Full URL
    '(?:'                             +
      '([^:/?#]+):\\/\\/'             + // $1 Scheme
    ')?'                              +
    '([^/?#]*)'                       + // $2 Authority
    '([^?#]*)'                        + // $3 Path
    '(?:'                             +
      '\\?([^#]*)'                    + // $4 Query
    ')?'                              +
    '(?:'                             +
      '#(.*)'                         + // $5 Fragment
    ')?$'
  , "i");


  // Default CSS class for auto-linked URLs
  var DEFAULT_URL_CLASS = "linkify-link";
  // Default CSS class for auto-linked usernames (along with the url class)
  var DEFAULT_USERNAME_CLASS = "app-tag-link";
  // Default CSS class for auto-linked hashtags (along with the url class)
  var DEFAULT_HASHTAG_CLASS = "app-tag-link";

  // Simple object cloning function for simple objects
  function clone(o) {
    var r = {};
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        r[k] = o[k];
      }
    }

    return r;
  }

  FlowdockText.autoLink = function(text, options) {
    options = clone(options || {});
    return FlowdockText.autoLinkMentions(
      FlowdockText.autoLinkUrlsCustom(
        FlowdockText.autoLinkHashtags(text, options),
      options),
    options);
  };

  FlowdockText.autoLinkHashtags = function(text, options) {
    options = clone(options || {});
    options.hashtagClass = options.hashtagClass || DEFAULT_HASHTAG_CLASS;
    options.hashtagUrlBase = options.hashtagUrlBase || "#flowser/all/";

    return text.replace(FlowdockText.regexen.autoLinkHashtags, function(match, before, hash, text, offset, chunk) {
      var after = chunk.slice(offset + match.length);
      if (after.match(FlowdockText.regexen.endHashtagMatch))
        return match;

      var d = {
        before: before,
        hash: FlowdockText.htmlEscape(hash),
        preText: "",
        text: FlowdockText.htmlEscape(text),
        postText: ""
      };

      for (var k in options) {
        if (options.hasOwnProperty(k)) {
          d[k] = options[k];
        }
      }

      return stringSupplant("#{before}<a href=\"#{hashtagUrlBase}#{text}\" title=\"##{text}\" class=\"#{hashtagClass}\">#{hash}#{preText}#{text}#{postText}</a>", d);
    });
  };


  FlowdockText.autoLinkUrlsCustom = function(text, options) {
    options = clone(options || {});
    if (options.urlClass) {
      options["class"] = options.urlClass;
      delete options.urlClass;
    }

    // remap url entities to hash
    var urlEntities, i, len;
    if(options.urlEntities) {
      urlEntities = {};
      for(i = 0, len = options.urlEntities.length; i < len; i++) {
        urlEntities[options.urlEntities[i].url] = options.urlEntities[i];
      }
    }

    delete options.usernameClass;
    delete options.usernameUrlBase;

    return text.replace(FlowdockText.regexen.extractUrl, function(match, all, before, url, protocol, port, domain, path, queryString) {
      var tldComponents;

      var htmlAttrs = "";
      var after = "";
      for (var k in options) {
        htmlAttrs += stringSupplant(" #{k}=\"#{v}\" ", {k: k, v: options[k].toString().replace(/"/, "&quot;").replace(/</, "&lt;").replace(/>/, "&gt;")});
      }

      // In the case of t.co URLs, don't allow additional path characters.
      if (url.match(FlowdockText.regexen.validTcoUrl)) {
        url = RegExp.lastMatch;
        after = RegExp.rightContext;
      }

      var d = {
        before: before,
        htmlAttrs: htmlAttrs,
        url: FlowdockText.htmlEscape(url),
        after: after
      };
      if (urlEntities && urlEntities[url] && urlEntities[url].display_url) {
        d.displayUrl = FlowdockText.htmlEscape(urlEntities[url].display_url);
      } else {
        d.displayUrl = d.url;
      }

      if (!protocol) {
        d.url = 'http://' + d.url;
      }
      return stringSupplant("#{before}<a href=\"#{url}\"#{htmlAttrs}>#{displayUrl}</a>#{after}", d);
    });
  };

  FlowdockText.autoLinkMentions = function(text, options) {
    options = clone(options || {});
    options.hashtagClass = options.hashtagClass || "app-tag-link";
    options.hashtagUrlBase = options.hashtagUrlBase || "#flowser/all/";
    var userTags = [];
    if(options && options.userTags){
      userTags = options.userTags.map(function(tag){ return tag.toLowerCase() });
    }
    return text.replace(FlowdockText.regexen.autoLinkMentions, function(match, before, hash, text, offset, chunk) {
      var after = chunk.slice(offset + match.length);
      if (after.match(FlowdockText.regexen.endHashtagMatch))
        return match;
      var d = {
        before: before,
        hash: FlowdockText.htmlEscape(hash),
        preText: "",
        text: FlowdockText.htmlEscape(text),
        postText: "",
      };

      for (var k in options) {
        if (options.hasOwnProperty(k)) {
          d[k] = options[k];
        }
      }


      if(userTags.length !== 0 && !inArray(d.hash + d.text.toLowerCase(), userTags)){
        return stringSupplant("#{before}#{hash}#{preText}#{text}#{postText}", d);
      } else {
        return stringSupplant("#{before}<a title=\"Search #{hash}#{text}\" class=\"#{hashtagClass}\" href=\"#{hashtagUrlBase}#{hash}#{text}\">#{hash}#{preText}#{text}#{postText}</a>", d);
      }
    });
  };

  FlowdockText.extractMentions = function(text) {
    var screenNamesOnly = [],
        screenNamesWithIndices = FlowdockText.extractMentionsWithIndices(text);

    for (var i = 0; i < screenNamesWithIndices.length; i++) {
      var screenName = screenNamesWithIndices[i].screenName;
      screenNamesOnly.push(screenName);
    }

    return screenNamesOnly;
  };

  FlowdockText.extractMentionsWithIndices = function(text) {
    if (!text) {
      return [];
    }

    var possibleScreenNames = [],
        position = 0;

    text.replace(FlowdockText.regexen.extractMentions, function(match, before, atSign, screenName, offset, chunk) {
      var after = chunk.slice(offset + match.length);
      if (!after.match(FlowdockText.regexen.endScreenNameMatch)) {
        var startPosition = text.indexOf(atSign + screenName, position);
        position = startPosition + screenName.length + 1;
        possibleScreenNames.push({
          username: screenName,
          indices: [startPosition, position]
        });
      }
    });

    return possibleScreenNames;
  };

  FlowdockText.extractUrls = function(text) {
    var urlsOnly = [],
        urlsWithIndices = FlowdockText.extractUrlsWithIndices(text);

    for (var i = 0; i < urlsWithIndices.length; i++) {
      urlsOnly.push(urlsWithIndices[i].url);
    }

    return urlsOnly;
  };

  FlowdockText.extractUrlsWithIndices = function(text) {
    if (!text) {
      return [];
    }

    var urls = [];

    while (FlowdockText.regexen.extractUrl.exec(text)) {
      var before = RegExp.$2, url = RegExp.$3, protocol = RegExp.$4, domain = RegExp.$5, path = RegExp.$7;
      var endPosition = FlowdockText.regexen.extractUrl.lastIndex,
          startPosition = endPosition - url.length;

      // if protocol is missing and domain contains non-ASCII characters,
      // extract ASCII-only domains.
      if (!protocol) {
        var lastUrl = null,
            lastUrlInvalidMatch = false,
            asciiEndPosition = 0;
        domain.replace(FlowdockText.regexen.validAsciiDomain, function(asciiDomain) {
          var asciiStartPosition = domain.indexOf(asciiDomain, asciiEndPosition);
          asciiEndPosition = asciiStartPosition + asciiDomain.length
          lastUrl = {
            url: asciiDomain,
            indices: [startPosition + asciiStartPosition, startPosition + asciiEndPosition]
          }
          urls.push(lastUrl);
        });

        // no ASCII-only domain found. Skip the entire URL.
        if (lastUrl == null) {
          continue;
        }

        // lastUrl only contains domain. Need to add path and query if they exist.
        if (path) {
          if (lastUrlInvalidMatch) {
            urls.push(lastUrl);
          }
          lastUrl.url = url.replace(domain, lastUrl.url);
          lastUrl.indices[1] = endPosition;
        }
      } else {
        // In the case of t.co URLs, don't allow additional path characters.
        if (url.match(FlowdockText.regexen.validTcoUrl)) {
          url = RegExp.lastMatch;
          endPosition = startPosition + url.length;
        }
        urls.push({
          url: url,
          indices: [startPosition, endPosition]
        });
      }
    }

    return urls;
  };

  FlowdockText.extractHashtags = function(text) {
    var hashtagsOnly = [],
        hashtagsWithIndices = FlowdockText.extractHashtagsWithIndices(text);

    for (var i = 0; i < hashtagsWithIndices.length; i++) {
      hashtagsOnly.push(hashtagsWithIndices[i].tag);
    }

    return hashtagsOnly;
  };

  FlowdockText.extractHashtagsWithIndices = function(text) {
    if (!text) {
      return [];
    }

    var tags = [],
        position = 0;

    text.replace(FlowdockText.regexen.autoLinkHashtags, function(match, before, hash, hashText, offset, chunk) {
      var after = chunk.slice(offset + match.length);
      if (after.match(FlowdockText.regexen.endHashtagMatch))
        return;
      var startPosition = text.indexOf(hash + hashText, position);
      position = startPosition + hashText.length + 1;
      tags.push({
        tag: hashText,
        indices: [startPosition, position]
      });
    });

    return tags;
  };

  FlowdockText.modifyIndicesFromUnicodeToUTF16 = function(text, entities) {
    FlowdockText.shiftIndices(text, entities, 1);
  };

  FlowdockText.modifyIndicesFromUTF16ToUnicode = function(text, entities) {
    FlowdockText.shiftIndices(text, entities, -1);
  };

  FlowdockText.shiftIndices = function(text, entities, diff) {
    for (var i = 0; i < text.length - 1; i++) {
      var c1 = text.charCodeAt(i);
      var c2 = text.charCodeAt(i + 1);
      if (0xD800 <= c1 && c1 <= 0xDBFF && 0xDC00 <= c2 && c2 <= 0xDFFF) {
        // supplementary character
        i++; // skip surrogate pair character
        for (var j = 0; j < entities.length; j++) {
          if (entities[j].indices[0] >= i) {
            entities[j].indices[0] += diff;
            entities[j].indices[1] += diff;
          }
        }
      }
    }
  };
  FlowdockText.extractMentions = function(text, userTags){
    var mentionsOnly = [],
        mentionsWithIndices = FlowdockText.extractMentionsWithIndices(text, userTags);

    for (var i = 0; i < mentionsWithIndices.length; i++) {
      mentionsOnly.push(mentionsWithIndices[i].tag);
    }

    if(userTags){
      userTags = downCase(userTags.map(getUserTag));
      return mentionsOnly.filter(function(tag){ return inArray(tag.toLowerCase(), userTags) });
    }
    return mentionsOnly;
  };
  FlowdockText.extractMentionsWithIndices = function(text, userTags) {
    if (!text) {
      return [];
    }

    var tags = [],
        position = 0;

    text.replace(FlowdockText.regexen.autoLinkMentions, function(match, before, hash, hashText, offset, chunk) {
      var after = chunk.slice(offset + match.length);
      if (after.match(FlowdockText.regexen.endHashtagMatch))
        return;
      var startPosition = text.indexOf(hash + hashText, position);
      position = startPosition + hashText.length + 1;
      tags.push({
        tag: (hash + hashText),
        indices: [startPosition, position]
      });
    });

    if(userTags){
      userTags = downCase(userTags.map(getUserTag));
      return tags.filter(function(tag){ return inArray(tag.tag.toLowerCase(), userTags) });
    }

    return tags;
  };

  FlowdockText.parseTags = function(message, users, me) {
    var tags = [];
    var users = users || [];
    var me = me || {};
    var urls = FlowdockText.extractUrls(message);
    var matchedTags = FlowdockText.extractHashtags(message);
    var matchedMentions = FlowdockText.extractMentions(message);

    if (matchedTags.length > 0) {
      //Uniq the matchedTags
      matchedTags.forEach(function(tag) {
        if(!inArray(tag.toLowerCase(), tags)) tags.push(tag);
      });
    }

    //Add the :url metatag if any urls in the message
    if (urls.length > 0) tags.push(":url");

    // Find @everyone-tags from messages and tag with :user:everyone
    if (FlowdockText.mentionsAll(matchedMentions)) tags.push(":user:everyone");

    users.forEach(function(user) {
      if (!user.nick || user.nick.length == 0 || user.id == 0 || user.disabled) return;
      // Find nicknames from messages sent by other users and tag with :highlight
      if (user.id != me.id && message.match(FlowdockText.regexen.highlightRegex(user.nick))) {
        tags.push(":highlight:" + user.id);
      }
      if (FlowdockText.mentionsUser(matchedMentions, user)) tags.push(":user:" + user.id);
      if([":highlight:" + user.id, ":user:" + user.id, ":user:everyone"].some(function(tag){
        return tags.indexOf(tag) !== -1;
      }) && user.id !== me.id){
        tags.push(":unread:" + user.id);
      }
    });

    return tags.filter(function(tag){ return tag[0] !== "@"});
  };
  FlowdockText.mentionsAll = function(check){
    if(isArray(check)){
      return ["@everyone", "@everybody", "@all", "@anyone", "@anybody"].some(function(tag) {
        return downCase(check).indexOf(tag) !== -1;
      });
    } else {
      return FlowdockText.mentionsAll(FlowdockText.extractMentions(check));
    }
  };
  FlowdockText.mentionsUser = function(check, user){
    if(isArray(check)){
      return downCase(check).indexOf(getUserTag(user).toLowerCase()) !== -1;
    } else {
      return FlowdockText.extractMentions(check, [getUserTag(user)]).length > 0;
    }
  };

  FlowdockText.isValidUrl = function(url, unicodeDomains, requireProtocol) {
    if (unicodeDomains == null) {
      unicodeDomains = true;
    }

    if (requireProtocol == null) {
      requireProtocol = true;
    }

    if (!url) {
      return false;
    }

    var urlParts = url.match(FlowdockText.regexen.validateUrlUnencoded);

    if (!urlParts || urlParts[0] !== url) {
      return false;
    }

    var scheme = urlParts[1],
        authority = urlParts[2],
        path = urlParts[3],
        query = urlParts[4],
        fragment = urlParts[5];

    if (!(
      (!requireProtocol || (isValidMatch(scheme, FlowdockText.regexen.validateUrlScheme) && scheme.match(/^https?$/i))) &&
      isValidMatch(path, FlowdockText.regexen.validateUrlPath) &&
      isValidMatch(query, FlowdockText.regexen.validateUrlQuery, true) &&
      isValidMatch(fragment, FlowdockText.regexen.validateUrlFragment, true)
    )) {
      return false;
    }

    return (unicodeDomains && isValidMatch(authority, FlowdockText.regexen.validateUrlUnicodeAuthority)) ||
           (!unicodeDomains && isValidMatch(authority, FlowdockText.regexen.validateUrlAuthority));
  };

  function isValidMatch(string, regex, optional) {
    if (!optional) {
      // RegExp["$&"] is the text of the last match
      // blank strings are ok, but are falsy, so we check stringiness instead of truthiness
      return ((typeof string === "string") && string.match(regex) && RegExp["$&"] === string);
    }

    // RegExp["$&"] is the text of the last match
    return (!string || (string.match(regex) && RegExp["$&"] === string));
  }
  function getUserTag(user){
    if(typeof user === "string"){
      return (user[0] === "@" ? user : "@" + user)
    } else if(user.nick) {
      return "@" + user.nick;
    } else {
      return "@" + user.first_name;
    }
  }
  function downCase(arr){
    return arr.map(function(item){ return item.toLowerCase(); });
  }
  function inArray(needle, haystack){
    return haystack.indexOf(needle) !== -1;
  }
  function isArray(thing){
    return Object.prototype.toString.call(thing) === "[object Array]";
  }
  // Escape regex special chars
  function regexEscape(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  if (typeof module != 'undefined' && module.exports) {
    module.exports = FlowdockText;
  }

}());
