// MIT License

  var db = new Dexie('MissedPages');

	// Define a schema
  // TODO: add referrer_id and id (may need to del/re-add db, as Dexie doesn't support changing primary key) either in another table or , as 1 url can have multiple referrer;
  // TODO: add img src if it's embedded in <a>
	db.version(3)
		.stores({
			places: '++id, url, title, last_visit_date, *titleWords'
		});

    // Add hooks that will index "title" for full-text search:
    db.places.hook("creating", function (primKey, obj, trans) {
      if (typeof obj.title == 'string') {
        var words = getAllWords(obj.title);
        obj.titleWords = words;
        obj.last_visit_date = Date.now();
      }
    });
    // TODO: update when url is the same, update the last_visit_time
    /*db.places.hook("updating", function (mods, primKey, obj, trans) {
      if (mods.hasOwnProperty("title")) {
        // "title" property is being updated
        if (typeof mods.title == 'string')
          console.log("updating: " + modes.title + " url:" + modes.url);
          // "title" property was updated to another valid value. Re-index messageWords:
          return {
            titleWords: getAllWords(mods.title),
            last_visit_date: Date.now()
            };
      } else {
          // "title" property was deleted (typeof mods.title === 'undefined') or changed to an unknown type. Remove indexes:
        return {titleWords: []};
      }
    });*/
    
    function getAllWords(text) {
        var allWordsIncludingDups = text.split(' ');
        var wordSet = allWordsIncludingDups.reduce(function (prev, current) {
            prev[current] = true;
            return prev;
        }, {});
        return Object.keys(wordSet);
    }

	// Open the database
	db.open()
		.catch(function(error){
			alert('Uh oh : ' + error);
		});

// When partial page is changed, send message to content script to extract links again
chrome.webNavigation.onReferenceFragmentUpdated.addListener(function(details) {
  chrome.tabs.sendMessage(details.tabId, "page changed.");
});

chrome.runtime.onMessage.addListener(function (request, _, sendResponse) {
  var linksMissed = request.links;
  if (!linksMissed) {
    return;
  }
  for(var i = 0; i<linksMissed.length; i++) {
    // or make a new one
    var link = linksMissed[i];
    /*db.places
      .where('url')
      .equals(link.url)
      .each(function(link){
        // update existing url
        db.places
          .update(link).then(function (updated) {
          if (updated)
            console.log (url + " gets updated");
          else
            console.log ("Nothing was updated - there were no url: " + url);
        });;
      });*/
    // insert always
    console.log("insert: " + link.title + ' url:' + link.url);
    db.places
      .add(link);
  }
});
