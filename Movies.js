var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);
//Movies------------------------------------------
//{
//  "title": Title
//  "year": Year released
//  "genre": Genre  (Action,  Adventure,  Comedy,  Drama,  Fantasy,  Horror,  Mystery,  Thriller, Western)
//  "actors": Array of three actors that were in the film(actorName, charName)
//}
var MovieSchema = new Schema({
    title: {type: String, required: true, index: { unique: true}},
    year: {type: Number, required: true},
    genre: {type: String, enum: ['Action',  'Adventure',  'Comedy',  'Drama',  'Fantasy',  'Horror',  'Mystery',  'Thriller', 'Western'], required: true},
    actors: {type: [], required: true}
});
//var Movies = mongoose.model('Movie', MovieSchema, 'movies');


//save movie
/*MovieSchema.pre('save', function(next) {
    //var newMovie = this;

    // save model to database
    if (err) return err;
    console.log(newMovie + " saved.");

});*/

// return the model
module.exports = mongoose.model('Movies', MovieSchema);