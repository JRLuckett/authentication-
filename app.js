var express = require('express');
var mongoose = require('mongoose');
var session = require('client-sessions');
var bodyParser = require('body-parser');
var path = require('path');
var bcrypt = require('bcryptjs');
var mpromise = require('mpromise');
var pug = require('pug');

var app = express();
var port = process.env.port || 8080;

//midleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  cookieName: 'boom',
  secret: 'slkrbvwl245blwb324tlwe2456be345ybgegrjwr',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}));
app.use(function(req, res, next){
  if(req.boom && req.boom.user){
    User.findOne({email: req.boom.user.email}, function(err, user){
      if(user){
        req.user = user;
        delete req.user.password;
        req.boom.user = req.user;
      }
      next();
    });
  } else {
    next();
  }
});
function requireLogin(req, res, next){
  if(!req.user){
    res.redirect('/login');
  } else {
    next();
  }
}

mongoose.connect('mongodb://localhost/auth');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var User = mongoose.model('User', new Schema({
  id: ObjectId,
  firstName: String,
  lastName: String,
  email: {type: String, unique: true},
  password: String
}));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/register', function(req, res){
  res.sendFile(__dirname + '/public/register.html');
});
app.post('/register', function(req, res){
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(req.body.password, salt);

  var user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: hash
  });
  user.save(function(err){
    if(err === 11000){
      console.log('email already taken');
      res.sendFile(__dirname + '/public/register.html');
    } else if(err){
      console.log('something went wrong');
      res.sendFile('register.html');
    }else{
      res.redirect('/main');
    }
  });
});

app.get('/login', function(req, res){
  res.sendFile(__dirname + '/public/login.html');
});
app.post('/login', function(req,res){
  User.findOne({email: req.body.email}, function(err, user){
    if(!user){
      res.redirect('/login');
      console.log('wrong password or email');
    } else {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        req.boom.user = user;
        res.redirect('/main');
      } else {
        res.redirect('/login');
        console.log('wrong password or email');
      }
    }
  });
});

app.get('/main', requireLogin, function(req, res){
  res.sendFile(__dirname + '/public/main.html');
});

app.get('/logout', function(req, res) {
  req.boom.reset();
  res.redirect('/');
});
app.listen(port, function(err){
  if(err){
    console.log('Not Connected to Server');
  } else {
    console.log('Connected on Port '+port);
  }
});
