'use strict';
const q = require('q');
const striptags = require('striptags');
const moment = require('moment');
const gMapClient = require('@google/maps').createClient({
  key: process.env.gmapKey,
});
const mail = require('../lib/sendgrid');

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

var legs = [];
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

getDirections(firstLeg)
  .then((result) => {
    var routes = result.json.routes.sort((a, b) => {
      return a.legs[0].duration.value - b.legs[0].duration.value;
    });
    var shortest = routes[0];
    legs.push(shortest);
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
    while(chunk) {
      if (counter >= 3) break;
      sms = sms.slice(140);

      emails.push(mail('buckleyrobinson@gmail.com', 'traffic', '5612552825@vtext.com', chunk));
      chunk = sms.slice(0, 140);
      counter += 1;
    }

    return q.all(emails);
  })
  .then(() => {
    process.exit();
  })
  .fail((error) => {
    console.error('error', error);
    process.exit(error);
  });
