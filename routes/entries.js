var Entry = require('../lib/entry');

exports.list = function(req, res, next){

    if (typeof res.locals.user === 'undefined') {
        res.render('entries', {
            title: 'Entries',
            entries: []
        });
        return next();
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
    var data = req.body.entry;

    var entry = new Entry({
        "by": res.locals.user.neo_id,
        "text": data.body
    });


    entry.save(function(err) {
        if (err) return next(err);
        if (req.remoteUser) {
            res.json({message: 'Entry added.'});
        } else {
            res.redirect('/');
        }
    });
};
