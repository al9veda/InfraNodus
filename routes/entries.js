var Entry = require('../lib/entry');

exports.list = function(req, res, next){

    if (typeof res.locals.user === 'undefined') {
        res.render('entries', {
            title: 'Entries',
            entries: []
        });
        return;
    }



    Entry.getRange(res.locals.user.neo_id, function(err, entries) {
        if (err) return next(err);

        res.render('entries', {
            title: 'Entries',
            entries: entries,
        });
    });
};

exports.form = function(req, res){
    res.render('post', { title: 'Post' });
};

exports.submit = function(req, res, next){

    // Here we process the data of the POST request

    // TODO 1. get the right data right here (user.id, context, statement, concepts - all from POST - maybe need separate modules)

    var data = req.body.entry;


    // Then we ascribe the data that the Entry object needs in order to survive
    // We create various fields and values for that object

   // TODO 2. once we have all the data right and transformed we create a new Entry object but with the parameters that we need

    var entry = new Entry({
        "by": res.locals.user.neo_id,
        "text": data.body

    });

    // Now that the object is created, we can call upon the save function

    // TODO 3. now that the object with all the parameters is created, we can simply call the method on it to save it into the database

    entry.save(function(err) {
        if (err) return next(err);
        if (req.remoteUser) {
            res.json({message: 'Entry added.'});
        } else {
            res.redirect('/');
        }
    });
};
