var Entry = require('../lib/entry');

exports.list = function(req, res, next){

    Entry.getRange(0, -1, function(err, entries) {
        if (err) return next(err);

        res.render('entries', {
            title: 'Entries',
            entries: entries,
        });
    });
};