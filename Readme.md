# Lancal

## Lanyrd Calendar Aggregator

Lancal is a simple application we use in the Cloud Foundry developer relations team to coordinate our participation at conferences.

We use Lanyrd in order to track conferences we want to go to. Lanyrd generates an Calendar ics file for each user, using your Twitter user name. This app is given a Twitter list name: username + listname, and returns the aggregated ics calendar for all Lanyrd calendars for each Twitter user in the list.

You can add the url for this Calendar in Google Calendar to plan conferences.

I built this app in a few days, because Lanyrd does not have an API yet. I use it as a Node.js example application for Cloud Foundry.

## Tech components

Lancal is using express, MongoDB for caching, restler and async for fetching, and mongoose for ORM.
The cache has a ttl of 5 seconds, but is refreshed lazily: first get will get an empty calendar, next ones will get it from cache.

There are 2 modules in there for which I used slightly modified versions: I have put them in my_node_modules:
* cloudfoundry: adds the loadDefaults function to the current cloudfoundry npm module
* node-ical: Peter Braden's module, with an added data member, because the modules does not provide an ics serializer and i need to aggregate raw entries

The Twitter user list we use in VMware developer relations is https://twitter.com/#!/chanezon/cloudfoundry-speakers, but you can use the app with any Twitter list.

## Tests

On localhost
curl http://localhost:3000/cal/chanezon/cloudfoundry-speakers
On Micro Cloud Foundry working offline
curl http://lancal.vcap.me/cal/chanezon/cloudfoundry-speakers
On Cloud Foundry
curl http://pat-lancal.cloudfoundry.com/cal/chanezon/cloudfoundry-speakers

## TODO List

* param for the type of feeds you want to get
* do a cron job to refresh the cache at least every hour
* this app maybe should use redis instead of mongo for caching
* for each entry add names and number of members who have that entry in their cal
* better exception handling

