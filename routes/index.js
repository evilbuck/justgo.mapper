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
router.get('/from_home', function(req, res) {
  // location.whichWay()
  location.compare(secondLegs[0], secondLegs[1])
    .then((result) => {
      console.log('result', result);
      res.send(result)
    })
    .fail((error) => {
      res.status(500).send(error.message);
    });
});

module.exports = router;
