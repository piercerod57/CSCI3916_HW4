var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);
//Reviews------------------------------------------
//{
//  "title": Title
//  "by": Username
//  "quote": quote
//  "rating": rating
//}
var ReviewSchema = new Schema({
    title: {type: String, required: true, index: { unique: true}},
    by: {type: String},
	quote: {type: String},
    rating: {type: String, enum: ['1 Star',  '2 Star',  '3 Star',  '4 Star',  '5 Star'], required: true},
});


// return the model
module.exports = mongoose.model('Reviews', ReviewSchema);