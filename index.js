require('dotenv').config();
var express = require('express');
const cors = require('cors');
const app = express();
const urlparser = require('url')
const {MongoClient} = require('mongodb')
const dns = require('dns');
// Basic Configuration
const port = process.env.PORT || 3000;
//connecting to db using MongoClient with URI as argument
const cdb = new MongoClient(process.env.MONGO_URI);
//a way to use the instance of the database that is connected
const db = cdb.db("url_service");
//a variable is created to show the collection of urls collected in the database
const storeUrls = db.collection('urls');
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
 
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
}); 


// Your first API endpoint
app.post('/api/shorturl', function(req, res){
  const urlString = req.body.url;
  //using urlparser to parse the string in the url and return URL object
  const lookDns = dns.lookup(urlparser.parse(urlString).hostname , async(req , validAddress) => {
  //if valid Adress does not exist then response json as error:"Invalid URL"
   if(!validAddress){
    res.json({error: "Invalid URL"})
   }
   //if valid address exist
    else {
    //count the number of urls in the database collection of urls called storeUrls
    const countUrls = await storeUrls.countDocuments({});
    //new variable urlstore containing urlstring and short_url that is number of urls countUrls
    const urlStore = {
      urlString,
      short_url: countUrls
    }
    //the main array storeUrls will be inserted with url being looked at the moment
    const respond = await storeUrls.insertOne(urlStore);
    console.log(respond);
    //final response json will be original_url :with urlString and short url with number of urls
    res.json({
      original_url: urlString,
      short_url: countUrls
    });
   }
  })
 });

 
app.get("/api/shorturl/:short_url" , async (req ,res) => {
  //if shorturl exists then new variable shortUrl is created from req.params.short_url
  const shorturl = req.params.short_url;
  //if multiple number then finding and increasing the shortUrl value and putting in the url Store
  const urlStore = await storeUrls.findOne({ short_url: +shorturl })
  //redirecting to urlstring in the urlStore
  res.redirect(urlStore.urlString); 
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});