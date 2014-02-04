// the form route function renders the register.ejs template from views and adds 'Register' into the title field there

exports.form = function(req, res){
    res.render('register', { title: 'Register' });
};