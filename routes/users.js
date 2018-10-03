const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const config=require('../config/database');
const jwt = require('jsonwebtoken');

// Bring in User Model
let User = require('../models/user');

// Register Form
router.get('/register', function(req, res){
  res.render('register');
});
//me
router.get('/me', function(req, res, next) {
  var token = req.headers['x-access-token'];
  if(req.session.token==token){
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    
    User.findById(decoded.id, 
    { password: 0 }, // projection
    function (err, user) {
      if (err) return res.status(500).send("There was a problem finding the user.");
      if (!user) return res.status(404).send("No user found.");
      // res.status(200).send(user); Comment this out!
      next(user); // add this line
    });
  });
}else{
  res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
}
});
// add the middleware function
router.use(function (user, req, res, next) {
  res.status(200).send(user);
});
// Register Proccess
router.post('/register', function(req, res){
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  var password1=password;
  const password2 = req.body.password2;

  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors:errors
    });
  } else {
    

    bcrypt.genSalt(10, function(err, salt){
      bcrypt.hash(password, salt, function(err, hash){
        if(err){
          console.log(err);
        }
        password1=hash;
        
        User.create({
          name:name,
      email:email,
      username:username,
      password:password1
        },
        function (err, user) {
          if (err) return res.status(500).send("There was a problem registering the user.")
          // create a token
          var token = jwt.sign({ id: user._id }, config.secret, {
            expiresIn: 86400 // expires in 24 hours
          }); req.session.token=token;
          res.status(200).send({ auth: true, token: token });
        }); 


      });
    });
 
  }
});

// Login Form
router.get('/login', function(req, res){
  res.render('login');
});

//Login Process
router.post('/login', function(req, res) {
  let query = {username:req.body.username};
  User.findOne(query, function (err, user) {
    if (err) return res.status(500).send('Error on the server.');
    if (!user) return res.status(404).send('No user found.');
    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });
    req.session.token=token;
    res.status(200).send({ auth: true, token: token });
  });
});


// router.post('/login', function(req, res, next){
//   passport.authenticate('local', {
//     successRedirect:'/',
//     failureRedirect:'/users/login',
//     failureFlash: true
//   })(req, res, next);
// });

// logout
router.get('/logout',ensureAuthenticated, function(req, res) {
  var token = jwt.sign({ id:  req.userId }, config.secret, {
    expiresIn: 0 // expires in 24 hours
  });
  req.session.token=token;
  res.status(200).send({ auth: false, token: null });
});

// router.get('/logout', function(req, res){
//   req.logout();
//   req.flash('success', 'You are logged out');
//   res.redirect('/users/login');
// });
function ensureAuthenticated(req, res, next){
 
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err)
    return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    req.userId = decoded.id;
    next();
  });
}
module.exports = router;
