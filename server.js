var express = require('express');
var bodyParser = require('body-parser');
const crypto = require("crypto");
var rp = require('request-promise');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var jwt = require('jsonwebtoken');
var movie = require('./Movies');
var review = require('./Reviews');


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
const GA_TRACKING_ID = process.env.GA_KEY;
module.exports = app; // for testing

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

//{ name: , username: , password: ""}
router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});
//Movies------------------------------------------
//{
//  "title": Title
//  "year": Year released
//  "genre": Genre  (Action,  Adventure,  Comedy,  Drama,  Fantasy,  Horror,  Mystery,  Thriller, Western)
//  "actors": Array of three actors that were in the film(actorName, charName)
//}
router.post('/movies/add', function(req, res) {
    var userNew = new User();
    var movieNew = new movie();
    userNew.name = req.headers.name;
    userNew.username = req.headers.username;
    userNew.password = req.headers.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                //Authenticated, we will now add the movie
                movieNew.title = req.body.title;
                if(!movieNew.title){res.status(401).send({success: false, message: 'Field title empty'});}
                movieNew.year = req.body.year;
                if(!movieNew.year){res.status(401).send({success: false, message: 'Field year empty'});}
                movieNew.genre = req.body.genre;
                if(!movieNew.genre){res.status(401).send({success: false, message: 'Field genre empty'});}
                movieNew.actors = req.body.actors;
                if(movieNew.actors.length < 3){res.status(401).send({success: false, message: 'Field actors invalid'});}
                movieNew.save(function(err1) {
                    if (err1) {return res.send(err1);}
                    res.json({ success: true, message: 'Movie created!' });
                });
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });
    });
});

router.put('/movies/update', function(req, res) {
    var userNew = new User();
    var movieNew = new movie();
    userNew.name = req.headers.name;
    userNew.username = req.headers.username;
    userNew.password = req.headers.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                //Authenticated
                movieNew.title = req.body.title;
                if(!movieNew.title){res.status(401).send({success: false, message: 'Field title empty'});}
                movieNew.year = req.body.year;
                if(!movieNew.year){res.status(401).send({success: false, message: 'Field year empty'});}
                movieNew.genre = req.body.genre;
                if(!movieNew.genre){res.status(401).send({success: false, message: 'Field genre empty'});}
                movieNew.actors = req.body.actors;
                if(movieNew.actors.length < 3){res.status(401).send({success: false, message: 'Field actors invalid'});}
                var doc = movie.findOne({title: movieNew.title});
                //We will now update the movie with the info passed into the heade
                    movie.findOneAndUpdate({title: movieNew.title}, { title: movieNew.title, year: movieNew.year, genre: movieNew.genre, actors: movieNew.actors}, function(err) {
                        if (err) {
                            res.send(err)
                        }
                        res.json({success: true, message: 'Movie updated!'});
                    });
            } else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });
    });
});


router.get('/movies/get', function(req, res) {
	var searchterm = req.headers.search;
	var checkreview = req.headers.review;
	console.log(checkreview);
	
		if(checkreview==="false"){// a string for some reason
			movie.find({ title: searchterm}, function (err, movies) {
				if (err) res.send(err);
				// return the movies
				res.json(movies);
			});
		}else{
			//var response;
			movie.find({ title: searchterm}, function (err, movies) {
					if (err) res.send(err);
					
					review.find(function (err2, reviews) {
						if (err2) res.send(err2);
						console.log(movies);
						console.log(reviews);
						res.json({movies: movies, reviews: reviews});
						
					});
				});
		}
	
});


router.delete('/movies/delete', function(req, res) {
    var userNew = new User();
    var movieNew = new movie();
    userNew.name = req.headers.name;
    userNew.username = req.headers.username;
    userNew.password = req.headers.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                //Authenticated
                movieNew.title = req.body.title;
                if(!movieNew.title){res.status(401).send({success: false, message: 'Field title empty'});}
                movieNew.year = req.body.year;
                if(!movieNew.year){res.status(401).send({success: false, message: 'Field year empty'});}
                movieNew.genre = req.body.genre;
                if(!movieNew.genre){res.status(401).send({success: false, message: 'Field genre empty'});}
                movieNew.actors = req.body.actors;
                if(movieNew.actors.length < 3){res.status(401).send({success: false, message: 'Field actors invalid'});}
                var doc = movie.findOne({title: movieNew.title});
                //We will now update the movie with the info passed into the heade
                movie.findOneAndDelete({title: movieNew.title}, function(err) {
                    if (err) {
                        res.send(err)
                    }
                    res.json({success: true, message: 'Movie deleted!'});
                });
            } else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });
    });
});
//------------------------------------------------

router.post('/reviews', function(req, res) {
	var userNew = new User();
    var reviewNew = new review();
    userNew.name = req.headers.name;
    userNew.username = req.headers.username;
    userNew.password = req.headers.password;
	
	movie.findOne({ title: req.body.title}).select('title').exec(function (err, movies) {
		if (err) {res.status(401).send({success: false, message: 'Authentication .'});}
		console.log(movies);
		if (movies == null){res.status(401).send({success: false, message: 'No movie matching that title.'});}
	});

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                //Authenticated, we will now add the review
                reviewNew.title = req.body.title;
                if(!reviewNew.title){res.status(401).send({success: false, message: 'Field title empty'});}
                reviewNew.by = userNew.username;
                reviewNew.quote = req.body.quote;
				reviewNew.rating = req.body.rating;
                reviewNew.save(function(err1) {
                    if (err1) {return res.send(err1);}
                    res.json({ success: true, message: 'review created!' });
                });
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });
    });
});



function trackDimension(category, action, label, value, dimension, metric) {

    var options = { method: 'GET',
        url: 'https://www.google-analytics.com/collect',
        qs:
            {   // API Version.
                v: '1',
                // Tracking ID / Property ID.
                tid: GA_TRACKING_ID,
                // Random Client Identifier. Ideally, this should be a UUID that
                // is associated with particular user, device, or browser instance.
                cid: crypto.randomBytes(16).toString("hex"),
                // Event hit type.
                t: 'event',
                // Event category.
                ec: category,
                // Event action.
                ea: action,
                // Event label.
                el: label,
                // Event value.
                ev: value,
                // Custom Dimension
                cd1: dimension,
                // Custom Metric
                cm1: metric
            },
        headers:
            {  'Cache-Control': 'no-cache' } };

    return rp(options);
}


router.route('/test')
    .get(function (req, res) {
        // Event value must be numeric.
        trackDimension('Feedback', 'Rating', 'Feedback for Movie', '3', 'Guardian\'s of the Galaxy 2', '1')
            .then(function (response) {
                console.log(response.body);
                res.status(200).send('Event tracked.').end();
            })
    });

//------------------------------------------

app.use('/', router);
if(!module.parent) {
    app.listen(process.env.PORT || 8080);
}