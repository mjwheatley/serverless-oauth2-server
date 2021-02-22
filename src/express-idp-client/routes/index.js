var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Express' });
  res.render('index', { name: 'Express React View', title: 'Express IDP Client' });
});

module.exports = router;
