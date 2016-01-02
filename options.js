// MIT License

var lastError = chrome.runtime.lastError;

// Get at the DOM controls used in the sample.
var linksArea = document.querySelector('.links');
var searchTerm = document.querySelector('#keywords');
var searchButton = document.querySelector('#submitKeywords');

// Load any CSS that may have previously been saved.
loadChanges();

searchTerm.addEventListener("keydown", function(e){
  if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
    search();
    return false;
  } else {
    return true;
  }
});
searchButton.addEventListener('click', search);

function search() {
  loadChanges(searchTerm.value);
}

function clearNode(node) {
  while(node.firstChild) {
      node.removeChild(node.firstChild);
  }
}

function loadChanges(keyword) {
  clearNode(linksArea);
  
  var db = new Dexie('MissedPages');
	// Define a schema
  db.version(3)
		.stores({
			places: 'url, title, last_visit_date, *titleWords'
		});
	// Open the database
	db.open()
		.catch(function(error){
			alert('Uh oh : ' + error);
		});

  //var links = [];
  if (keyword) {
    db.places
      .where('titleWords')
      .startsWithIgnoreCase(keyword)
      .toArray(function(links){
        // TODO: search for all the links that has the same url (can be multiple titles)
        showLinks(links);
      });
  } else {
    db.places
      .toArray(function(links){
        showLinks(links);
      });
  }
}

function showLinks(links) {
  var l = aggregateLinks(links);
  l.sort(function(a, b) {
    return a.title == b.title ? 0 : (a.title < b.title ? -1 : 1);
  });
  for (var i = 0; i<l.length; i++) {
    linksArea.appendChild(createLinkElement(l[i]));
  }
}

function aggregateLinks(links) {
  var urlMap = {};
  for (var i = 0; i<links.length; i++) {
    var link = links[i];
    if (!urlMap[link.url]) {
      urlMap[link.url] = {};
    }
    urlMap[link.url][link.title] = null;
  }
  var aggregatedLinks = [];
  for (var url in urlMap) {
    var titleSet = urlMap[url];
    var titles = [];
    for (var i in titleSet) {
      titles.push(i);
    }
    titles.sort(function(a, b) { return b.length - a.length; });
    aggregatedLinks.push({title: titles.join(', '), url: url});
  }
  return aggregatedLinks;
}

function createLinkElement(link) {
  var linkElement = document.createElement("div");
  var li = document.createElement("div");
  li.setAttribute("class", "linktitle")
  var l = document.createElement("a");
  l.setAttribute("href", link.url);
  l.appendChild(document.createTextNode(link.title));
  li.appendChild(l);
  linkElement.appendChild(li);
  
  var url = document.createElement("div");
  url.setAttribute("class", "linkurl")
  url.appendChild(document.createTextNode(link.url));
  linkElement.appendChild(url);
  return linkElement;
}

function message(msg) {
  var message = document.querySelector('.message');
  message.innerText = msg;
  setTimeout(function() {
    message.innerText = '';
  }, 3000);
}
