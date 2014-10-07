// Module dependencies.
var application_root = __dirname,
    express = require( 'express' ); //Web framework
    path = require( 'path' ),           //Utilities for dealing with file paths
    mongoose = require( 'mongoose' );   //Used for accessing a MongoDB database

//Connect to database
mongoose.connect( 'mongodb://localhost/discount' );

//Create server
var app = express();

//Schema
var DiscountSchema = new mongoose.Schema({
    title: String
    , is_active :{ type: Number, default: 1}
    , created_at : { type: Date }
    , updated_at : { type: Date }
});
// Function
DiscountSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();
});
//Model
var DiscountModel = mongoose.model( 'Discount', DiscountSchema );

// Configure server
app.configure( function() {
    //parses request body and populates request.body
    app.use( express.bodyParser() );

    //checks request.body for HTTP method overrides
    app.use( express.methodOverride() );

    //perform route lookup based on url and HTTP method
    app.use( app.router );

    //Show all errors in development
    app.use( express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//Router
//Get a list of all books
app.get( '/api/v1/discounts', function( request, response ) {

//    console.log("#### GET REQUEST ####", request);
  //{ where: {room: sessionUser.room}, attributes: ['session', 'room'], limit : 2 }
    return DiscountModel.find({ 'is_active' : 1 }, { '_id': 0, '__v': 0, 'updated_at': 0}, { sort: {'created_at':-1}, limit:100 }, function( err, discounts ) {
        if( !err ) {
            return response.send({'discounts':discounts});
        } else {
            console.log( err );
            return response.send('ERROR');
        }
    });
});
//Insert a new book
app.post( '/api/v1/discounts', function( request, response ) {
    var discount = new DiscountModel({
        title: request.body.title,
        price: request.body.price
    });
    console.log(request.body.title);
    discount.save( function( err ) {
        if( !err ) {
            console.log( 'created' );
            return response.send( discount );
        } else {
            console.log( err );
            return response.send('ERROR');
        }
    });
});
//Get a single book by id
app.get( '/api/v1/discounts/:id', function( request, response ) {
    return DiscountModel.findById( request.params.id, function( err, discount ) {
        if( !err ) {
            return response.send( discount );
        } else {
            console.log( err );
            return response.send('ERROR');
        }
    });
});
//Update a book
app.put( '/api/v1/discounts/:id', function( request, response ) {
    return DiscountModel.findById( request.params.id, function( err, discount ) {
        discount.title = request.body.title;
        discount.price = request.body.price;

        return discount.save( function( err ) {
            if( !err ) {
                console.log( 'discount updated' );
                return response.send( discount );
            } else {
                console.log( err );
                return response.send('ERROR');
            }
        });
    });
});

//Delete a book
app.delete( '/api/v1/discounts/:id', function( request, response ) {
    DiscountModel.findById( request.params.id, function( err, discount ) {
        return discount.remove( function( err ) {
            if( !err ) {
                console.log( 'Discount removed' );
                return response.send( '' );
            } else {
                console.log( err );
                return response.send('ERROR');
            }
        });
    });
});

//Start server
var port = 4711;
app.listen( port, function() {
    console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
});
