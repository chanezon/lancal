It is using MongoDB for caching, restler and async for fetching, and mongoose for ORM.
The cache has a ttl of 5 seconds, but is refreshed lazily, so if none getts he url in a browser, refresh rate depend on the Googlebot if you view it in Google.

test
curl http://localhost:3000/cal/chanezon/cloudfoundry-speakers
or
curl http://lancal.vcap.me/cal/chanezon/cloudfoundry-speakers
or
curl http://pat-lancal.cloudfoundry.com/cal/chanezon/cloudfoundry-speakers

TODO List
- license
- check in git
- async get
OK- add parameters for the twitter list you want to fetch
- save cal in mongo in 12 digit hash of list, or use findOne, find a way to pass list param to updateMongo
- set default formats and owner and list, keep old url alive
- the type of feeds you want to get
- do a cron job to refresh the cache at least every hour
- add names and number of members who have that entry in their cal
- exception handling

