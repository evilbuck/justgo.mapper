'use strict';
const q = require('q');
const striptags = require('striptags');
const moment = require('moment');
const gMapClient = require('@google/maps').createClient({
  key: 'AIzaSyC0QP0ZrtipXFkVd5HWS0eH5YiwlwWhy_o',
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

var legs = [];
var differenceBetweenTypes;

getDirections({
    origin: '5481 Alhambra Valley Rd 94553',
    destination: 'Lafayette Bart Station',
    mode: 'driving',
    alternatives: true,
  })
  .then((result) => {
    var routes = result.json.routes.sort((a, b) => {
      return a.legs[0].duration.value - b.legs[0].duration.value;
    });
    var shortest = routes[0];
    legs.push(shortest);
  })
  .then(() => {
    return q.all([
      getDirections({
        origin: 'Lafayette Bart Station',
        mode: 'driving',
        destination: '405 Howard St San Francisco',
      }),
      getDirections({
        origin: 'Lafayette Bart Station',
        mode: 'transit',
        destination: 'Montgomery St Bart Station',
      })
    ]);
  })
  .spread((driving, transit) => {
    var transitTime = transit.json.routes[0].legs[0].duration.value;
    var drivingTime = driving.json.routes[0].legs[0].duration.value;
    var drivingArrival = moment().add(drivingTime, 'seconds');
    var transitArrival = moment(transit.json.routes[0].legs[0].arrival_time.value * 1000);

    var stepInstructions = legs[0].legs[0].steps.map((step) => striptags(step.html_instructions));
    var sms = `${stepInstructions.slice(0, 2).join('\n')}`;
    sms += `\n...${stepInstructions[stepInstructions.length-1]}`;
    sms += `\ndriving: arrive at ${drivingArrival.calendar()}\ntransit: arrive at ${transitArrival.calendar()}`;

    var arrivalTimes = [drivingArrival.toDate(), transitArrival.toDate()];
    sms += `\nthe difference is ${Math.round((Math.max.apply(null, arrivalTimes) - Math.min.apply(null, arrivalTimes))/ 1000 / 60)} minutes.`;

    console.log(sms);

    //var times = [transitTime, drivingTime];
    //differenceBetweenTypes = Math.max.apply(null, times) - Math.min.apply(null, times);

    //var shortestWay = transitTime > drivingTime ? transit.json.routes[0] : driving.json.routes[0];

    //var sms = `${stepInstructions.slice(0, 2).join('\n')}`;
    //sms += `\n...${stepInstructions[stepInstructions.length-1]}`

    //var transitType = shortestWay.fare ? 'bart' : 'car pool';
    //sms += `\nThen take the ${transitType.toUpperCase()} (difference is ${Math.round(differenceBetweenTypes/60)} minutes)`;
    //console.log(sms);

    process.exit();
  })
  .fail((error) => {
    console.error(error);
    process.exit(error);
  });
