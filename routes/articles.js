const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config=require('../config/database');
// Article Model
let Article = require('../models/article');
// User Model
let User = require('../models/user');

// Add Route
router.get('/add', ensureAuthenticated, function(req, res){
  res.render('add_article', {
    title:'Add Article'
  });
});

// Add Submit POST Route
router.post('/add', ensureAuthenticated, function(req, res){
  req.checkBody('title','Title is required').notEmpty();
  //req.checkBody('author','Author is required').notEmpty();
  req.checkBody('body','Body is required').notEmpty();

  // Get Errors
  let errors = req.validationErrors();

  if(errors){
    res.render('add_article', {
      title:'Add Article',
      errors:errors
    });
  } else {
    let article = new Article();
    article.title = req.body.title;
    article.author = req.userId;
    article.body = req.body.body;

    article.save(function(err){
      if(err){
        console.log(err);
        return;
      } else {
        req.flash('success','Article Added');
        res.status(200).send({ success:'Article Added',  title:  article.title });
      }
    });
  }
});

// Load Edit Form
router.get('/edit/:id', ensureAuthenticated, function(req, res){
  Article.findById(req.params.id, function(err, article){
    if(article.author != req.user._id){
      req.flash('danger', 'Not Authorized');
      res.redirect('/');
    }
    res.render('edit_article', {
      title:'Edit Article',
      article:article
    });
  });
});

// Update Submit POST Route
router.post('/edit/:id',ensureAuthenticated, function(req, res){
  let article = {};
  article.title = req.body.title;
  article.author = req.userId;
  article.body = req.body.body;

  let query = {_id:req.params.id}

  Article.update(query, article, function(err){
    if(err){
      console.log(err);
      return;
    } else {
      req.flash('success', 'Article Updated');
      res.status(200).send({ success:'Article Updated',  title:  article.title });
      //res.redirect('/');
    }
  });
});

// Delete Article
router.delete('/:id',ensureAuthenticated, function(req, res){
  if(!req.userId){
   res.status(500).send({ success:'fail'});
  }

  let query = {_id:req.params.id}

  Article.findById(req.params.id, function(err, article){
   
    
      Article.remove(query, function(err){
        if(err){
          console.log(err);
        }
        res.status(200).send({ success:'Article Deleted',  title:  article.title });
      });
    
  });
});

// Get Single Article
router.get('/:id',ensureAuthenticated, function(req, res){
  Article.findById(req.params.id, function(err, article){
    User.findById(article.author, function(err, user){
      // res.render('article', {
      //   article:article,
      //   author: user.name
      // });
      res.status(200).send({ article:article,  author: user.name });
    });
  });
});

// Access Control
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
