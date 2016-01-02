// MIT License

function preprocess(links) {
  var processed = [];
  for (var i=0; i<links.length; i++) {
    var link = links[i];
    var title = link.title;
    var url = link.url;
    if (title) {
      title = title.trim();
    }
    // add document.documentURI if url is relative
    if (url && (url.indexOf('/') == 0 || url.indexOf('#') == 0)) {
      url = document.documentURI + url;
    }
    processed.push({title: title, url: url})
  };
  return processed;
}

function isValid(link) {
  var linkUri = link.url;

  if (
    linkUri == null || linkUri == ''
    // exclude the bookmark on the same page
    || getUriFromBookmark(linkUri) == getUriFromBookmark(document.documentURI)
    // exclude link with empty title
    || link.title == null || link.title == ''
    // exclude javascript resource
    || linkUri.indexOf('javascript:')>-1) {
    
    return false;
  }
  return true;
}

// get root page from bookmark url
function getUriFromBookmark(url) {
  var index = url.indexOf('#');
  return index > 0
    ? url.substring(0, index)
    : url;
}

/* Node format:
 attribs: object
 children: Array
 next: object
 parent: object
 prev: object
 type: string
 */
function getLinksInDomNode(node) {
  var links = [];
  if (node.type === 'tag') {
    if (node.name !== 'a') {
      Array.prototype.push.apply(links, getAllLinksInDomTree(node.children));
    } else {
      link = extractLink(node);
      //console.log(link);
      links.push(link);
    }
  }
  return links;
}

function extractLink(node) {
  //console.log(node.text);
  var children = node.children;
  if (children.length == 1 && children[0].type === 'text') {
    return {title: children[0].data, url: node.attribs.href};
  } else {
    // if children has 'span' or 'img' tag, extract text from them
    return {title: tryExtractTextFromChildren(children), url: node.attribs.href}; 
  }
}

function tryExtractTextFromChild(node) {
  if (node.name === 'span' && node.type === 'tag') {
    // get the text child
    if (node.children.length === 1) {
      var child = node.children[0];
      return child.type === 'text' ? child.data : null;
    }
  } else if (node.name === 'img' && node.type === 'tag') {
    return node.attribs.alt;
  }
  // TODO: last solution to get inner text like (bing search):
  /*
  <a href="http://nice-tutorials.blogspot.com/2011/04/learn-how-to-create-div-element.html" h="ID=SERP,5231.1"><strong>Create div</strong> element <strong>dynamically</strong> by using <strong>javascript</strong></a>
  */
  return null;
}

function tryExtractTextFromChildren(nodes) {
  for(var i = 0; i < nodes.length; i++) {
    tryExtractTextFromChild(nodes[i]);
  }
}

/* dom tree sample:
 [{
    data: 'Xyz ',
    type: 'text'
}, {
    type: 'script',
    name: 'script',
    attribs: {
        language: 'javascript'
    },
    children: [{
        data: 'var foo = \'<bar>\';<',
        type: 'text'
    }]
}, {
    data: '<!-- Waah! -- ',
    type: 'comment'
}]
https://github.com/fb55/domhandler
*/
function getAllLinksInDomTree(dom) {
  var links = [];
  for(var i = 0; i < dom.length; i++) {
    Array.prototype.push.apply(links, getLinksInDomNode(dom[i]));
  }
  return links;
}

var htmlparser = require("htmlparser2");


function getAllLinksOnPage() {
  var handler = new htmlparser.DomHandler(function (error, dom) {
    if (error)
      console.log(error);
    else {
      // console.log(dom);
      var linksMissed = getAllLinksInDomTree(dom);
      linksMissed = preprocess(linksMissed);
      linksMissed = linksMissed.filter(isValid);
      
      // recursively walk through dom tree to get all link
      chrome.runtime.sendMessage({
        links: linksMissed
      });
    }
  });
  
  var parser = new htmlparser.Parser(handler);
  var htmlContent = document.documentElement.innerHTML;
  parser.write(htmlContent);
  parser.end();
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  console.log("Got message from background page: " + msg);
  // add links again
  getAllLinksOnPage();
});

$(document).ready(function() {
  console.log(document.documentURI + ' loaded');
  getAllLinksOnPage();
});

