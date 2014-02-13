var Entry = require('../lib/entry');

exports.list = function(req, res, next){

    if (typeof res.locals.user === 'undefined') {
        res.render('entries', {
            title: 'Entries',
            entries: []
        });
        return;
    }



    Entry.getRange(res.locals.user.neo_uid, function(err, entries) {
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

    // Here we process the data of the POST request, the entry.body and entry.hashtags fields

    var data = req.body.entry;


    // Then we ascribe the data that the Entry object needs in order to survive
    // We create various fields and values for that object and initialize it

    var entry = new Entry({
        "by_uid": res.locals.user.neo_uid,
        "by_id": res.locals.user.neo_id,
        "by_name": res.locals.user.name,
        "hashtags": data.hashtags,
        "text": data.body

    });

    // Now that the object is created, we can call upon the save function

    entry.save(function(err) {
        if (err) return next(err);
        if (req.remoteUser) {
            res.json({message: 'Entry added.'});
        } else {
            res.redirect('/');
        }
    });
};
