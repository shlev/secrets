const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;

const MONGO_URL = 'mongodb://localhost:27017';

const DB_NAME = 'userDB';

mongoose.connect(`${MONGO_URL}/${DB_NAME}`,
 { useNewUrlParser: true, useUnifiedTopology: true});

const usersSchema = {
    email: String,
    password: String
}

const User = mongoose.model("User", usersSchema);

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
        User.findOne({email: loginUser}, function( err, foundUser) {
            if (!err) {
                if ( foundUser) {
                    if ( foundUser.password === loginPassword) {
                        console.log("Logged in successfully");
                        res.render('secrets');
                    } else {
                        console.log("incorrect password");
                    }
                } else {
                    console.log('user not found');
                }
            } else {
                console.log(err);
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
        const newUser = new User({email: emailInput, password: passwordInput});
        newUser.save( function (err) {
            if (!err) {
                console.log("registered new user successfully");
                res.render('secrets');
            } else {
                console.log(err);
            }
        });
    });

app.listen(PORT, function() {
    console.log(`Server started on port ${PORT}.`);
});