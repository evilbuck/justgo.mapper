'use strict';
const q = require('q');
const striptags = require('striptags');
const moment = require('moment');
const mail = require('../lib/sendgrid');

const gMapClient = require('@google/maps').createClient({
  key: process.env.gmapKey,
});

function getDirections(options) {
  var deferred = q.defer();

  gMapClient.directions(options, function(err, response) {
    if (err) {
      return deferred.reject(err);
    }

    deferred.resolve(response);
  });

  return deferred.promise;
}

var differenceBetweenTypes;

var firstLeg = {
  origin: '5481 Alhambra Valley Rd 94553',
  destination: 'Lafayette Bart Station',
  mode: 'driving',
  alternatives: true,
};
var secondLegs = [
  {
    origin: 'Lafayette Bart Station',
    mode: 'driving',
    destination: '405 Howard St San Francisco',
  },
  {
    origin: 'Lafayette Bart Station',
    mode: 'transit',
    destination: 'Montgomery St Bart Station',
  }
];

function getRouteType(route) {
  var type;
  if (route.json.routes[0].legs[0].arrival_time) {
    type = 'transit';
  } else {
    type = 'driving';
  }

  console.log(`routeType is ${type}`);
  return type;
}

function getTransitTime(route) {
  var transitArrival = moment(route.json.routes[0].legs[0].arrival_time.value * 1000);
  return transitArrival.toDate() - new Date();
}

function getDrivingTime(route) {
   return route.json.routes[0].legs[0].duration.value;
}

function getTotalTime(route) {
  var routeType = getRouteType(route);
  var func = routeType === 'transit' ? getTransitTime : getDrivingTime;

  // console.log(`getTotalTime`, route);
  return func(route);
}

function compare(routeA, routeB) {
  return q.all([
    getDirections(routeA),
    getDirections(routeB)
  ])
    .spread((a, b) => {
      // get total time of route
      var timeA = getTotalTime(a);
      var timeB = getTotalTime(b);
      var times = [timeA, timeB];
      var difference = Math.max(times) - Math.min(times)

      var recommendedRoute = timeA > timeB ? routeB : routeA;

      return { recommendedRoute, difference };
    });

    // { recommendedRoute, difference }
}


function whichWay() {
  var steps = [];

  return getDirections(firstLeg)
    .then((result) => {
      var routes = result.json.routes.sort((a, b) => {
        return a.legs[0].duration.value - b.legs[0].duration.value;
      });
      var shortest = routes[0];
      steps.push(shortest);
    })
    .then(() => {
      return q.all(secondLegs.map((leg) => getDirections(leg)));
    })
    .spread((driving, transit) => {
      var transitTime = transit.json.routes[0].legs[0].duration.value;
      var drivingTime = driving.json.routes[0].legs[0].duration.value;
      var drivingArrival = moment().add(drivingTime, 'seconds');
      var transitArrival = moment(transit.json.routes[0].legs[0].arrival_time.value * 1000);

      var stepInstructions = legs[0].legs[0].steps.map((step) => striptags(step.html_instructions));
      var sms = `${stepInstructions.slice(0, 2).join('. ')}. `;
      sms += `...${stepInstructions[stepInstructions.length-1]}`;
      sms += `\ndriving: arrive at ${drivingArrival.calendar()}\ntransit: arrive at ${transitArrival.calendar()}`;

      var arrivalTimes = [drivingArrival.toDate(), transitArrival.toDate()];
      sms += `\nthe difference is ${Math.round((Math.max.apply(null, arrivalTimes) - Math.min.apply(null, arrivalTimes))/ 1000 / 60)} minutes.`;

      var chunk = sms.slice(0, 140);
      // sms = sms.slice(140);
      var counter = 0;
      // TODO: this code stinks
      // we're only chunking this for sms
      var emails = [];
      // while(chunk) {
      //   if (counter >= 3) break;
      //   sms = sms.slice(140);
      //
      //   //emails.push(mail('buckleyrobinson@gmail.com', 'traffic', '5612552825@vtext.com', chunk));
      //   chunk = sms.slice(0, 140);
      //   counter += 1;
      // }

      return sms;

      // return q.all(emails);
    })
    .fail((error) => {
      console.error('error', error);
      process.exit(error);
    });
}

module.exports.whichWay = whichWay;
module.exports.compare = compare;
