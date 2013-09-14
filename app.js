var FeedParser = require('feedparser')
  , fs = require('fs'),
    request = require('request')
  , _ = require('underscore')
  , mongoose = require('mongoose')
  , async = require('async'),
    MongoClient = require('mongodb').MongoClient
    , format = require('util').format
    , mongos = require('mongoskin');


var mongosdb = mongos.db(process.env.MONGODB_DEVELOPMENT_URI);
mongosdb.collection('users').remove({}, function(err,result) {

	if (!err) console.log('Users collection deleted!');
});
/*
mongosdb.collection('test_insert').insert({foo: 'bar'}, function(err, result) {
    console.log(result);
    mongosdb.collection('test_insert').drop();
    mongosdb.close();

});

*/

/*
MongoClient.connect(process.env.MONGODB_DEVELOPMENT_URI, function(err, db) {
   if(err) throw err;

    //var collection = db.collection('test_insert');
  //collection.insert({a:2}, function(err, docs) {

  var collection = db.collection('posts');
  collection.insert(post, function(err,docs){

  collection.count(function(err, count) {
        console.log(format("count = %s", count));
      });

      // Locate all the entries using find
      //collection.find().toArray(function(err, results) {
      //  console.dir(results);
        // Let's close the db
        db.close();
      });      
    });
  });                   

/*

 
mongoose.connect(process.env.MONGODB_DEVELOPMENT_URI);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // yay!
  console.log('Connected to DB');
});

console.log('Done');
*/
//----------------------
var Posts = [];
var post = '';
var urls = ['http://feeds.reuters.com/reuters/topNews',
            'http://feeds.reuters.com/reuters/peopleNews',
            'http://feeds.reuters.com/Reuters/worldNews',
           'http://feeds.reuters.com/news/artsculture',
           'http://feeds.reuters.com/reuters/businessNews',
           'http://feeds.reuters.com/ReutersBusinessTravel',
           'http://feeds.reuters.com/reuters/companyNews'];

 getArticles = function(url) {
   var items = 0;
   var  req = request(url)
  .on('error', function(error) {
    console.log(error);
  })
  .pipe(new FeedParser())
  .on('error', function (error) {
    console.error(error);
    return(error);
  })
  .on('meta', function (meta) {
    console.log('===== %s =====', meta.title);
   
  })
  .on('readable', function() {
    var stream = this, item;
    while (item = stream.read()) {
      console.log('Got article: %s', item.title + '-' + item.link + '(' + item.meta.title + ')');
      var post = { 
        title: item.title,
        link: item.link,
        guid: item.guid,
        feedname: item.meta.title
      };
       var matched = checkExistingPosts(Posts,item.title.toString(), item.guid.toString(), true);
        console.log('Item found ' + matched);
      
        if (Posts.length > 0 && !matched)
        {
        Posts.push(post);
          mongosdb.collection('post_items').insert(post, function(err,result) { 
            
            if (err) console.log(err);
            //console.log(mongosdb.collection('post_items').count());
            console.log(result);  
//            post_items.count(function(err, count) {
 //            console.log('There are ' + count + ' news items in the database');
 //           });
          })
          items++;
        }
        else if (Posts.length == 0)
        {
          Posts.push(post);
           mongosdb.collection('post_items').insert(post, function(err,result) { 
            
            if (err) console.log(err);
            //console.log(mongosdb.collection('post_items').count());
            console.log(result);      
          mongosdb.collection('post_items').find().toArray(function(err, result) {
                if (err) throw err;
            console.log('No of items in DB: ' + result.length);
            });
          });
          items++;
        }
     
      //console.log('POst title match returned ' + display(Posts,post.title));
      /*
      if(Posts.length > 0) {
      Posts.forEach(function(eachpost, strguid) {
        
        if(match(eachpost, ({guid:strguid}))) 
           {
          console.log('Found key - don\'t enter post');
      }else
   //   console.log(post);
     
      if(Posts.length > 0) {
      Posts.forEach(function(post, strtitle) {
        console.log('Result: ', match(post, {title: strtitle}));
      });
      }
     */ 
   
   //   console.log(Posts.length);
      
     // items ++;
     /*}
      });
      } else { Posts.push(post);}
      */
    }
  })
  .on('end', function() {
    console.log('Data finished for now');
    console.log('Items found in the feed ' + items);
    req.end();
})
 .on('end', function() {
   return true;
   console.log('Items found for the request ' + items);
  console.log('request ended with  ' + Posts.length  +  'items found'); 
 });
   

//return true;

};
//---original function
/*
_.map(urls, function(url) {
  getArticles(url);
});
*/
//----original function
var loopItems = setInterval( function() {
async.map(urls, getArticles, function(err, results) {

    if(err) console.log(err);
  console.log('Done with all feeds at : ' + new Date());
  
}); }, 10000);


function match(item, filter) {
  console.log(filter);
  var keys = Object.keys(filter);
  // true if any true
  return keys.some(function (key) {
    return item[key] == filter[key];
  });
};
/*
function findMatchingGuid(items, strguid) {
  items.forEach(function(item, strguid){
    console.log('guid sent ' + strguid);
    if (match(item, {guid: strguid})) {
    return true;
    } else {
    return false;
    }
});                
                };

 */   

function display(items, strtitle) { 
  return items.forEach(function(item, strtitle) {
    console.log ('Item title ' + item.title);
    console.log ('Compare with title' + strtitle);
    if(item.title == strtitle)
      return true;
  });
};

function checkExistingPosts(inArr, title, guid, exists)
{
    
    for (i = 0; i < inArr.length; i++ )
    {
      if ((inArr[i].title == title) && (inArr[i].guid == guid))
        {
            return (exists === true) ? true : inArr[i];
        }
    }
  
    return false;
}

process.on('SIGINT', function() {
    console.log('Recieve SIGINT');
  mongosdb.collection('post_items').remove({});
  
    mongosdb.close(function(){
        console.log('database has closed');
    })
    console.log('clearing the loop');
    clearInterval(loopItems);
});

