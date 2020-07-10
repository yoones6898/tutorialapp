var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../models/user');
var session = require('express-session');
var jwt = require('jsonwebtoken');
var secret = 'harypotter';



module.exports = function (app, passport) {



    app.use(passport.initialize());
    app.use(passport.session());
    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    }));

    passport.serializeUser(function(user, done) {
        if (user.active){
            token=   jwt.sign({username:user.username, email:user.email}, secret, {expiresIn: '24h'});

        }else {
            token= 'inactive/error';

        }

        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new FacebookStrategy({
            clientID: '262706944845387',
            clientSecret: '9e80df1d74f4103144e59410e5333c3e',
            callbackURL: "http://localhost:8080/auth/facebook/callback",
            profileFields: ['id', 'displayName', 'photos', 'email']
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({ email: profile._json.email}).select('username active password email').exec(function (err,user) {
                if (err) done(err);

                if (user && user != null){
                    done(null, user);
                }else {
                    done(err);
                }
            })

        }
    ));


    passport.use(new GoogleStrategy({
            clientID: '82681002462-926onprog99oo48g8uop14dj62ab7j72.apps.googleusercontent.com',
            clientSecret: 'TUHG2J86Nb5J3YWz62n0WIjk',
            callbackURL: "http://localhost:8080/auth/google/callback"
        },
        function(accessToken, refreshToken, profile, done) {

            User.findOne({ email: profile.emails[0].value}).select('username active password email').exec(function (err,user) {
                if (err) done(err);

                if (user && user != null){
                    done(null, user);
                }else {
                    done(err);
                }
            })



        }
    ));
    app.get('/auth/google',
        passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email'] }));

    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/googleerror' }),
        function(req, res) {
            res.redirect('/google/' + token);
        });

    // Facebook Routes
    app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/facebookerror' }), function(req, res) {
        res.redirect('/facebook/' + token); // Redirect user with newly assigned token
    });
    app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

    return passport;
}
