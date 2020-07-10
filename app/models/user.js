var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator')

var nameValidator = [

    validate({
        validator: 'matches',
        arguments: /^(([a-zA-Z]{3,20})+[ ]+([a-zA-Z]{3,20})+)+$/,
        message: 'name Must be 3 least characters, max 30, no special characters and numbers,must have space in between'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 20],
        message: 'Name should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];
var emailValidator = [

    validate({
        validator: 'isEmail',
        message: 'is not valid email'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 45],
        message: 'email should be between {ARGS[0]} and {ARGS[1]} characters'
    }),

];
var usernameValidator = [

    validate({
        validator: 'isLength',
        arguments: [3, 25],
        message: 'username should be between {ARGS[0]} and {ARGS[1]} characters'
    }),
    validate({
        validator: 'isAlphanumeric',
        message: 'Username must contain leters and number only'
    })

];

var passwordValidator = [

    validate({
        validator: 'matches',
        arguments: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,35}$/,
        message: 'password needs Minimum eight characters, at least one letter, one number and one special character'
    }),
    validate({
        validator: 'isLength',
        arguments: [8, 35],
        message: 'Password should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];


var userSchema = new Schema({
    name: {type:String, required:true,  validate: nameValidator},
    username: { type: String,lowercase:true,required:true,unique:true, validate: usernameValidator},
    password: {type: String, required: true, validate:passwordValidator, select:false},
    email: {type: String, required: true,lowercase: true,unique: true,  validate: emailValidator},
    active: {type: Boolean, required: true, default: false},
    temporarytoken: {type:String, required:true },
    resettoken: {type:String, required:false},
    permission: {type:String, required: true, default: 'user'}
});



userSchema.pre('save', function (next) {
    var user= this;
    if (!user.isModified('password')) return next();
    bcrypt.hash(user.password , null , null,function (err,hash) {
       if (err) return next(err);
        user.password = hash;
        next();
    });

});

userSchema.plugin(titlize, {
    paths: [ 'name']
});

// Method to compare passwords in API (when user logs in)
userSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password);

};


module.exports = mongoose.model('User' , userSchema)


