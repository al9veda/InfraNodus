var Entry = require('../lib/entry');

exports.render = function(req, res, next){

    Entry.getRange(res.locals.user.neo_uid, function(err, entries) {
        if (err) return next(err);

        // Add a link to @context tags
        for (var i = 0; i < entries.length; ++ i) {
            entries[i].text = FlowdockText.autoLinkMentions(entries[i].text,{hashtagUrlBase:"/context/",hashtagClass:"app-context-link"});
            entries[i].text = FlowdockText.autoLinkHashtags(entries[i].text,{hashtagUrlBase:"/concept/",hashtagClass:"app-concept-link"});
        }

        console.log("Showing statements for user "+ res.locals.user.neo_uid);

        res.render('leap', {
            title: 'Entries',
            entries: entries,
        });
    });

};






