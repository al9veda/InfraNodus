/**
 * InfraNodus is a lightweight interface to graph databases.
 *
 * This open source, free software is available under MIT license.
 * It is provided as is, with no guarantees and no liabilities.
 * You are very welcome to reuse this code if you keep this notice.
 *
 * Written by Dmitry Paranyushkin | Nodus Labs, you, you and you!
 * www.noduslabs.com | info AT noduslabs DOT com
 *
 * In some parts the code from the book "Node.js in Action" is used,
 * (c) 2014 Manning Publications Co.
 *
 */


exports.notfound = function(req, res){
    res.status(404).format({
        html: function(){
            res.render('404');
        },
        json: function(){
            res.send({ message: 'Resource not found' });
        },
        xml: function() {
            res.write('<error>\n');
            res.write(' <message>Resource not found</message>\n');
            res.end('</error>\n');
        },
        text: function(){
            res.send('Resource not found\n');
        }
    });
};

exports.error = function(err, req, res, next){
    console.error(err.stack);
    var msg;

    switch (err.type) {
        case 'database':
            msg = 'Server Unavailable';
            res.statusCode = 503;
            break;

        default:
            msg = 'Internal Server Error';
            res.statusCode = 500;
    }

    res.format({
        html: function(){
            res.render('5xx', { msg: msg, status: res.statusCode });
        },

        json: function(){
            res.send({ error: msg });
        },

        text: function(){
            res.send(msg + '\n');
        }
    });
};
