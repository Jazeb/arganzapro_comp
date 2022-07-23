const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/profile', function(req, res, next) {
  console.log('in profiles');
  res.render('profile', { title: 'Express' });
});

module.exports = router;
