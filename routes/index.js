var express = require('express');
var router = express.Router();
const location = require('../lib/locations');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

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

router.get('/compare_routes', function(req, res) {
  location.compare(secondLegs[0], secondLegs[1])
    .then((result) => {
      // console.log('result', result);
      // console.log(`difference is about ${Math.round(result.difference/1000/60)} minutes`);
      // res.send(result)
      // console.log(`render`, result.recommendedRouteDirections.routes);
      var diffMinutes = Math.round(result.difference / 1000 / 60);
      res.render(`compare`, {
        legs: result.recommendedRouteDirections.json.routes[0].legs[0],
        difference: diffMinutes
      });
    })
    .fail((error) => {
      console.error(`/from_home error`, error);
      res.status(500).send(error.message);
    });
});

module.exports = router;
