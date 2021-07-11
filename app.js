require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


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
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/', function(req, res) {
    res.render('home');
});

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