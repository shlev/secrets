require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const findOrCreate = require('mongoose-findorcreate');
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;

const MONGO_URL = 'mongodb://localhost:27017';

const DB_NAME = 'userDB';

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect(`${MONGO_URL}/${DB_NAME}`,
 { useNewUrlParser: true, useUnifiedTopology: true});

 mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  }, function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
          return cb(err, user);
        });
    }
    ));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', function(req, res) {
    res.render('home');
});

app.get('/auth/google', 
    passport.authenticate('google', {scope: 'profile'})
    );

app.get('/auth/google/secrets', 
    passport.authenticate('google',{ failureRedirect: "/login"}),
    function(req, res) {
        //Successful redirect
        res.redirect('/secrets');
    }
);

app.get('/auth/facebook',
    passport.authenticate('facebook')
    );

app.get('/auth/facebook/secrets', 
    passport.authenticate('facebook',{ failureRedirect: "/login"}),
    function(req, res) {
        //Successful redirect
        res.redirect('/secrets');
    }
);

app.route('/login')
    .get( function(req, res) {
        res.render('login');
    })
    .post( function(req, res) {
        const loginUser = req.body.username;
        const loginPassword = req.body.password;

        const user = new User({
            username: loginUser,
            password: loginPassword
        });

        req.login(user, function( err) {
            if ( err){
                console.log(err);
            } else {
                passport.authenticate('local')(req, res, function(){
                    res.redirect('/secrets');
                });
            }
        });
    });

app.route('/register')
    .get(function(req, res) {
        res.render('register');
    })
    .post(function(req, res) {
        const emailInput = req.body.username;
        const passwordInput = req.body.password; 
        
        User.register({username: emailInput}, passwordInput, function(err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate('local')(req, res, function() {
                    res.redirect('/secrets');
                });
            }
        });
    });

app.get('/secrets', function(req,res){
    if ( req.isAuthenticated() ) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.listen(PORT, function() {
    console.log(`Server started on port ${PORT}.`);
});