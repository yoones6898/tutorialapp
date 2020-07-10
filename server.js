var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var  app = express();
var path = require('path');
var passport = require('passport');
var social = require('./app/passport/passport')(app, passport);

var port =process.env.PORT || 8080;
var router = express.Router();
var appRoutes = require('./app/routes/api')(router);
app.use(morgan('dev'));


app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use('/api',appRoutes);
app.use(express.static(__dirname+ '/public'));



mongoose.connect('mongodb+srv://yoones:yoones6898@cluster0.mwki5.mongodb.net/tutorial?retryWrites=true&w=majority' , {useNewUrlParser: true, useUnifiedTopology: true},function (err) {
    if (err){
        throw err;
        console.log("not connected " + err);
    }else
        console.log(" connected to mongo ");

});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
app.get('*' , function (req, res) {
    res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
})


app.listen(port , function () {
console.log("Running the server " +port );
});
