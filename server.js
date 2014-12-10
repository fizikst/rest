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

// MYSQL
var Sequelize = require('sequelize')
    , sequelize = new Sequelize("invo", "root", "135790", {
        dialect: "mysql",
        port:    3306
    });
sequelize
    .authenticate()
    .complete(function(err) {
        if (!!err) {
            console.log('Unable to connect to the database:', err)
        } else {
            console.log('Connection has been established successfully.')
        }
    });

var Discount = sequelize.define('discount', {
    id: { type: Sequelize.INTEGER, primaryKey: true, unique: true},
    title: Sequelize.STRING,
    percent: {
        type:Sequelize.DECIMAL(10,2)
        /*,
        get : function() {
            return 100;
        }*/
    },
    price: Sequelize.DECIMAL(10,2),
    date_from: Sequelize.STRING,
    date_to: Sequelize.STRING,
    created_at: Sequelize.STRING,
    updated_at: Sequelize.STRING,
    catalog_id: Sequelize.INTEGER,
    user_id: Sequelize.INTEGER
}, {
    underscored: true,
    tableName: 'discount',
    freezeTableName: true,
    timestamps: false/*,
    getterMethods   : {
        percentСonvert : function()  {
            return 100;
        }
    }*/
});






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

/*    Discount.findAll()
        .success(function(discounts) {
            return response.send({'discounts':discounts});
        })
        .error(function(err) {
            if (err) {
                console.log(err);
                return response.send('ERROR');
            }
        });*/

//        var date_from = new Date(+request.param('date_from'));

        sequelize
            .query(
            'SELECT d.*, c.title as title_catalog, d.title as title_discount, u.name as vendor from discount as d' +
                ' Left Join catalog as c on d.catalog_id = c.id' +
                ' Left Join users as u on d.user_id = u.id' +
                ' Where date_to >= ?', null,
            { raw: true }, [new Date()]
        )

        .success(function(discounts) {

            var list = {};
            var discountList = [];

            if (discounts.length > 0) {
                discounts.forEach(function (discount) {

                    if (list.hasOwnProperty(discount.title_catalog)) {
                        list[discount.title_catalog].push({is_active:1, title : discount.title_discount, percent: discount.percent*100, date_from : discount.date_from, date_to : discount.date_to, created_at:discount.created_at, vendor: discount.vendor});
                    } else {
                        list[discount.title_catalog] = [];
                        list[discount.title_catalog].push({is_active:1, title : discount.title_discount, percent: discount.percent*100, date_from : discount.date_from, date_to : discount.date_to, created_at:discount.created_at, vendor: discount.vendor});
                    }
                });

                for(var index in list) {
                    var tmp = {};
                    tmp[index] = list[index];
                    discountList.push(tmp);
                }
            }

            return response.send({'discounts':discountList});
        })

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
