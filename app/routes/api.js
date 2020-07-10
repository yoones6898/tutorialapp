var User = require('../models/user');
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
// var sgTransport = require('nodemailer-sendgrid-transport');

var secret = 'harypotter';
module.exports =function (router) {




        // var transporter =nodemailer.createTransport({
        //     service:'gmail',
        //     auth: {
        //         user: 'shahepariyan6898@gmail.com',
        //         pass: 'yoones6898000'
        //     }
        // });

    // var smtpConfig = {
    //     host: 'smtp.gmail.com',
    //     port: 465,
    //     secure: true, // use SSL
    //     auth: {
    //         user: 'shahepariyan6898@gmail.com',
    //         pass: 'yoones6898000'
    //     }
    // };
    // var transporter = nodemailer.createTransport(smtpConfig);

    var smtpTransport = require('nodemailer-smtp-transport');

    var transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        auth: {
            user: 'shahepariyan6898@gmail.com',
            pass: 'yoones6898000'
        }
    }));

    // var client = nodemailer.createTransport(sgTransport(options));



    router.post('/users' , function (req,res) {
        var user = new User();
        user.username = req.body.username;
        user.password = req.body.password;
        user.email = req.body.email;
        user.name = req.body.name;
        user.temporarytoken =jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' });

        if (req.body.username == null || req.body.username== '' ||req.body.password == null || req.body.password== '' || req.body.email == null || req.body.email== '' || req.body.name == null || req.body.name== ''){

            res.json({success:false, message: 'Ensure username, email and password were provided' });
        }else {
            user.save( function (err) {
                if (err) {
                   if (err.errors != null){
                       if (err.errors.name) {
                           res.json({success: false, message: err.errors.name.message});
                       } else if (err.errors.email) {
                           res.json({success: false, message: err.errors.email.message});
                       } else if (err.errors.username) {
                           res.json({success: false, message: err.errors.username.message});
                       } else if (err.errors.password) {
                           res.json({success: false, message: err.errors.password.message});
                       }else {
                           res.json({success: false, message: err});
                       }
                   }else if (err){
                       if (err.code == 11000){
                            if (err.errmsg[61] == "u"){
                                res.json({success: false, message: 'That username  already exist'});
                            }else if (err.errmsg[61] == "e"){
                                res.json({success: false, message: 'That email already exist'});
                            }
                       }else {
                           res.json({success: false, message: err});
                       }
                   }

                }
                else {

                    var email = {
                        from: 'shahepariyan6898@gmail.com',
                        to: user.email,
                        subject: 'localhost, Account activation link',
                        text: 'Hello ' + user.name + ', thank you for registering at localhost.com, please click on the following link for complete activation: http://localhost:8080/activate/'+user.temporarytoken,
                        html: 'Hello <h3>' + user.name + '</h3><br><br>  thank you for registering at localhost.com, please click on the following link for complete activation: <br><br> <h2><a href="http://localhost:8080/activate/'+ user.temporarytoken + '">Active</a></h2> '
                    };

                    transporter.sendMail(email, function(err, info){
                        if (err ){
                            console.log(err);
                        }
                        else {
                            console.log('Message sent: ' + info.response);
                        }
                    });



                    res.json({success: true, message: "account registered! ,please check your activation link, Redirecting to home page..."});
                }
            });
        }



    });

    //LOGIN USER ROUTE
    router.post('/checkusername' , function (req, res) {
        User.findOne({username: req.body.username}).select('username').exec(function (err, user) {
            if (err) throw err;

            if (user){
                res.json({success: false, message: 'That username is already taken'});
            }else {
                res.json({success: true, message: 'Valid username'});
            }
            

    
        });
    });

    router.post('/checkemail' , function (req, res) {
        User.findOne({email: req.body.email}).select('email').exec(function (err, user) {
            if (err) throw err;

            if (user){
                res.json({success: false, message: 'That email is already taken'});
            }else {
                res.json({success: true, message: 'Valid email'});
            }



        });
    });
    // Route for user logins
    router.post('/authenticate', function(req, res) {
        User.findOne({ username: req.body.username }).select('email username password active').exec(function(err, user) {

            if (err) throw err;

                if (!user) {
                    res.json({ success: false, message: 'Username not found' }); // Username not found in database
                } else if (user) {
                    if (req.body.password) {
                        var validPassword = user.comparePassword(req.body.password);
                        console.log(validPassword)
                    }else {
                        res.json({success: false, message: 'No password provided'}); // Password was not provided
                    }
                        if (!validPassword) {
                            res.json({ success: false, message: 'Could not authenticate password' }); // Password does not match password in database
                        }else if (!user.active){
                            res.json({ success: false, message: 'Account is not yet activated. please check your email for activation link',expired: true });
                        } else {
                            var token = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '30s' }); // Logged in: Give user token
                            res.json({ success: true, message: 'User authenticated!', token: token }); // Return token in JSON object to controller
                        }
                    }


        });
    });

    router.put('/activate/:token', function (req, res) {
        User.findOne({ temporarytoken: req.params.token }, function (err, user) {
            if (err) throw err;
            var token = req.params.token;


            jwt.verify(token, secret, function (err, decoded) {
                if (err) res.json({success: false, message: 'activation link expired'});
                else if (!user){
                    res.json({success: false, message: 'activation link expired'});
                }else {
                    user.temporarytoken = false;
                    user.active = true;
                    user.save(function (err) {
                        if (err){
                            console.log(err);
                        }else {

                            var email = {
                                from: 'shahepariyan6898@gmail.com',
                                to: user.email,
                                subject: 'localhost, Account activated',
                                text: 'Hello ' + user.name + ' your account has been successfuly activated',
                                html: 'Hello <storng>' + user.name + '</storng><br><br> your account has been successfuly activated'
                            };

                            transporter.sendMail(email, function(err, info){
                                if (err ){
                                    console.log(err);
                                }
                                else {
                                    console.log('Message sent: ' + info.response);
                                }
                            });


                            res.json({success: true, message: 'account activated'});
                        }
                    });


                }
            });

        });
    });

    router.post('/resend', function(req, res) {
        User.findOne({ username: req.body.username }).select('username password active').exec( function(err, user) {

            if (err) throw err;

            if (!user) {
                res.json({ success: false, message: 'Username not found' }); // Username not found in database
            } else if (user) {
                if (req.body.password) {
                    var validPassword = user.comparePassword(req.body.password);
                    console.log(validPassword)
                }else {
                    res.json({success: false, message: 'No password provided'}); // Password was not provided
                }
                if (!validPassword) {
                    res.json({ success: false, message: 'Could not authenticate password' }); // Password does not match password in database
                }else if (user.active){
                    res.json({ success: false, message: 'Account is already activated.'});
                } else {
                    res.json({ success:true }); // Return token in JSON object to controller
                }
            }


        });
    });

    router.put('/resend', function(req, res) {
        User.findOne({ username: req.body.username }).select('username name email temporarytoken').exec( function(err, user) {

            if (err) throw err;
            user.temporarytoken = jwt.sign({username: user.username, email: user.email}, secret, {expiresIn: '24h'});

            user.save(function (err) {
                if (err) {
                    console.log(err);
                } else {

                    var email = {
                        from: 'shahepariyan6898@gmail.com',
                        to: user.email,
                        subject: 'localhost, Account activation link request',
                        text: 'Hello ' + user.name + ', thank you for registering at localhost.com, please click on the following link for complete activation: http://localhost:8080/activate/' + user.temporarytoken,
                        html: 'Hello <h3>' + user.name + '</h3><br><br>  thank you for registering at localhost.com, please click on the following link for complete activation: <br><br> <h2><a href="http://localhost:8080/activate/' + user.temporarytoken + '">Active</a></h2> '
                    };

                    transporter.sendMail(email, function (err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Message sent: ' + info.response);
                        }


                });

                    res.json({success:true,message:'Activation link has been sent to '+user.email});
        }
    });

    });
    });

    router.get('/resetusername/:email', function (req, res) {
        User.findOne({email: req.params.email}).select('email name username').exec(function (err, user) {
           console.log(req.params.email);
            if (err) {
                res.json({ success: false,message:err });
            }else {
                if (!req.params.email){
                    res.json({ success: false,message:'No email was provided' });
                }else {
                    if (!user){
                        res.json({ success: false,message:'Email not found' });
                    }else {

                        var email = {
                            from: 'shahepariyan6898@gmail.com',
                            to: user.email,
                            subject: 'localhost Username request',
                            text: 'Hello ' + user.name + ', thank you for registering at localhost.com, please click on the following link for complete activation: http://localhost:8080/activate/' + user.temporarytoken,
                            html: 'Hello <h3>' + user.name + '</h3><br> you resently requested your username, Please save it in your files <hr> <h2>'+user.username + '</h2>'
                        };

                        transporter.sendMail(email, function (err, info) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Message sent: ' + info.response);
                            }


                        });



                        res.json({ success: true,message:'Username has been sent to email' });
                    }
                }

            }

        })
    });


    router.put('/resetpassword', function (req, res) {
        User.findOne({username:req.body.username}).select('username active email resettoken name').exec(function (err,user) {
            if (err) throw err;
            if (!user){
                res.json({ success: false,message:'Username was not found' });

            }else if (!user.active){
                res.json({ success: false,message:'Account is not yet been activated' });
            }else {
                user.resettoken =jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' });
                user.save(function (err) {
                    if (err){
                        res.json({ success: false,message:err });
                    }else {
                        var email = {
                            from: 'shahepariyan6898@gmail.com',
                            to: user.email,
                            subject: 'localhost reset password request',
                            text: 'Hello ' + user.name + ', thank you for registering at localhost.com, please click on the following link for complete activation: http://localhost:8080/reset/' + user.resettoken,
                            html: 'Hello <p style="font-weight: bold">' + user.name + '</p><br> you resently requested your recently a password <a href="http://localhost:8080/reset/'+ user.resettoken + '">LINK NEW PASSWORD</a>'
                        };

                        transporter.sendMail(email, function (err, info) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Message sent: ' + info.response);
                            }


                        });




                        res.json({ success: true,message:'Please check your email for passeord reset link' });
                    }

                })


            }
        });

    });
    router.get('/resetpassword/:token', function (req, res) {
        User.findOne({resettoken:req.params.token}).select().exec(function (err, user) {
            if (err) throw err;
            var token = req.params.token;
            jwt.verify(token, secret, function (err, decoded) {
                if (err){
                    res.json({success: false, message: 'password link has expired'});

            } else {
           if (!user){
               res.json({success: false, message: 'password link has expired'});

           }else {
               res.json({success: true, user:user});
           }
        }
    });


        });

    });

    router.put('/savepassword', function (req, res) {
        User.findOne({username: req.body.username}).select('username name email password resettoken ').exec(function (err, user) {
            if (err) throw err;
            if (req.body.password == null || req.body.password == ''){

                res.json({success: false, message: 'Password not provided'});

            }else {

                user.password = req.body.password;
                user.resettoken = false;
                user.save(function (err) {
                    if (err) {
                        res.json({success: false, message: err});
                    }else {
                        var email = {
                            from: 'shahepariyan6898@gmail.com',
                            to: user.email,
                            subject: 'localhost reset password ',
                            text: '',
                            html: 'Hello <p style="font-weight: bold">' + user.name + '</p><br> your password has been reset '
                        };

                        transporter.sendMail(email, function (err, info) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Message sent: ' + info.response);
                            }


                        });

                        res.json({success: true, message: 'password has been reset'});
                    }

                });




            }

        });
    });

    router.use(function (req, res, next) {
        var token= req.body.token || req.body.query || req.headers['x-access-token'];
        if (token){
            jwt.verify(token, secret, function (err, decoded) {
                if (err) res.json({success: false, message: 'token invalid'});
                else {
                    req.decoded = decoded;
                    next();
                }
            });
        }else {
            res.json({success: false, message: 'No token provided'});
        }
    });

    router.post('/me', function (req, res) {
        res.send(req.decoded);
    });

    router.get('/renewToken/:username', function (req, res) {
        User.findOne({username: req.params.username}).select().exec(function (err, user) {

            if (err) throw err;
            if (!user){
                res.json({success: false, message: 'No user was found'});
            }else {
                var newToken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Logged in: Give user token
                res.json({ success: true, token: newToken }); // Return token in JSON object to controller
            }


        })

    })

    router.get('/permission', function (req, res) {
        User.findOne({username: req.decoded.username}, function (err,user) {
            if (err) throw err;
            if (!user){
                res.json({success: false, message: 'No user was found'});
            }else {
                res.json({success: true, permission: user.permission});

            }

        });
    })

    router.get('/management', function (req, res) {
        User.find({}, function (err, users) {
            if (err) throw err;
            User.findOne({username: req.decoded.username}, function (err, mainUser) {
                if (err) throw err;
                if (!mainUser){
                    res.json({success: false, message: 'No user was found'});
                }else {
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
                        if (!users){
                            res.json({success: false, message: 'Users not found'});
                        }else {
                            res.json({success: true,users:users, permission:mainUser.permission});

                        }
                    }else {
                        res.json({success: false, message: 'Insufficient permission'});

                    }
                }

            })

        })
    });

    router.delete('/management/:username', function (req, res) {
        var deleteUser = req.params.username;
        User.findOne({ username: req.decoded.username }, function (err, mainUser) {
            if (err) throw err;
            if (!mainUser){
                res.json({success: false, message: 'No user was found'});
            }else {
                if (mainUser.permission !== 'admin'){
                    res.json({success: false, message: 'Insufficient permission'});
                }else {
                    User.findOneAndRemove({ username: deleteUser}, function (err, user) {
                        if (err) throw err;
                        res.json({success: true });

                    })
                }
            }
        })

    });

    router.get('/edit/:id', function (req, res) {
        var editUser = req.params.id;
        User.findOne({ username: req.decoded.username }, function (err, mainUser) {
            if (err) throw err;
            if (!mainUser){
                res.json({success: false, message: 'No user was found'});
            }else {
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
                    User.findOne({_id: editUser}, function (err, user) {
                        if (err) throw err;
                        if (!user){
                            res.json({success: false, message: 'No user was found'});

                        }else {
                            res.json({success: true, user: user});

                        }

                    })
                }else {
                    res.json({success: false, message: 'Insufficient permission'});
                }
            }

        });

    });
    router.put('/edit', function (req, res) {
        var editUser = req.body._id;
        if (req.body.name) var newName = req.body.name;
        if (req.body.username) var newUsername = req.body.username;
        if (req.body.email) var newEmail = req.body.email;
        if (req.body.permission) var newPermission = req.body.permission;
        User.findOne({ username: req.decoded.username}, function (err, mainUser) {
            if (err) throw err;
            if (!mainUser){
                res.json({success: false, message: 'No user was found'});

            }else {
                if (newName){
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
                        User.findOne({ _id: editUser}, function (err, user) {
                            if (err) throw err;
                            if (!user){
                                res.json({success: false, message: 'No user was found'});

                            }else {
                                user.name = newName;
                                user.save(function (err) {
                                    if (err){
                                        console.log(err);
                                    } else {
                                        res.json({success: true, message: 'Name has been updated'});

                                    }

                                })
                            }
                        })
                    }else{
                        res.json({success: false, message: 'Insufficient permission'});

                    }
                }
                if (newUsername) {
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {

                        User.findOne({ _id: editUser}, function (err, user) {
                            if (err) throw err;
                            if (!user){
                                res.json({success: false, message: 'No user was found'});

                            }else {
                                user.username = newUsername;
                                user.save(function (err) {
                                    if (err){
                                        console.log(err);
                                    }else {
                                        res.json({success: true, message: 'Username has been updated'});

                                    }

                                })
                            }
                        })

                    }else {
                        res.json({success: false, message: 'Insufficient permission'});

                    }
                }
                if (newEmail){
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        User.findOne({ _id: editUser}, function (err, user) {
                            if (err) throw err;
                            if (!user){
                                res.json({success: false, message: 'No user was found'});

                            }else {
                                user.email = newEmail;
                                user.save(function (err) {
                                    if (err){
                                        console.log(err);
                                    }else {
                                        res.json({success: true, message: 'Email has been updated'});

                                    }

                                })
                            }
                        });

                    }else {
                        res.json({success: false, message: 'Insufficient permission'});

                    }
                }
                if (newPermission){
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        User.findOne({ _id: editUser}, function (err, user) {
                            if (err) throw err;
                            if (!user){
                                res.json({success: false, message: 'No user was found'});

                            }else {

                                if (newPermission === 'user'){
                                    if (user.permission === 'admin'){
                                        if (mainUser.permission !== 'admin'){
                                            res.json({success: false, message: 'Insufficient permission, You must be an admin to downgrade another admin'});
                                        }else {
                                            user.permission = newPermission;
                                            user.save(function (err) {
                                                if (err){
                                                    consol.log(err);
                                                }else {
                                                    res.json({success: true, message: 'Permission has been updated.'});
                                                }

                                            })
                                        }
                                    }else {
                                        user.permission = newPermission;
                                        user.save(function (err) {
                                            if (err){
                                                consol.log(err);
                                            }else {
                                                res.json({success: true, message: 'Permission has been updated.'});
                                            }

                                        });

                                    }
                                }
                                if (newPermission === 'moderator'){
                                    if (user.permission === 'admin'){
                                        if (mainUser.permission !== 'admin'){
                                            res.json({success: false, message: 'Insufficient permission, You must be an admin to downgrade another admin'});
                                        }else {
                                            user.permission = newPermission;
                                            user.save(function (err) {
                                                if (err){
                                                    consol.log(err);
                                                }else {
                                                    res.json({success: true, message: 'Permission has been updated.'});
                                                }

                                            });
                                        }
                                    }else {
                                        user.permission = newPermission;
                                        user.save(function (err) {
                                            if (err){
                                                consol.log(err);
                                            }else {
                                                res.json({success: true, message: 'Permission has been updated.'});
                                            }

                                        });
                                    }
                                }
                                if (newPermission === 'admin'){
                                    if (mainUser.permission === 'admin'){
                                        user.permission = newPermission;
                                        user.save(function (err) {
                                            if (err){
                                                consol.log(err);
                                            }else {
                                                res.json({success: true, message: 'Permission has been updated.'});
                                            }

                                        });
                                    }else {
                                        res.json({success: false, message: 'Insufficient permission, You must be an admin to upgrade to the admin level'});

                                    }
                                }

                            }
                        });

                    }else {
                        res.json({success: false, message: 'Insufficient permission'});

                    }

                }
            }
        })

    })

    return router;
}
