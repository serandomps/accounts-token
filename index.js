var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var redirect = serand.redirect;

dust.loadSource(dust.compile(require('./template'), 'accounts-token'));

module.exports = function (sandbox, fn, options) {
    dust.render('accounts-token', options, function (err, out) {
        if (err) {
            return;
        }
        token(options);
        sandbox.append(out);
        fn(false, function () {
            $('.accounts-token', sandbox).remove();
        });
    });
};

var token = function (o) {
    var options = serand.store('oauth');
    $.ajax({
        method: 'POST',
        url: utils.resolve('accounts://apis/v/tokens'),
        data: {
            client_id: options.client_id,
            grant_type: options.type,
            code: o.code
        },
        contentType: 'application/x-www-form-urlencoded',
        dataType: 'json',
        success: function (token) {
            var user = {
                tid: token.id,
                access: token.access_token,
                refresh: token.refresh_token,
                expires: token.expires_in
            };
            serand.emit('token', 'info', user.tid, user.access, function (err, token) {
                if (err) {
                    serand.emit('user', 'login error');
                    return;
                }
                user.has = token.has;
                serand.emit('user', 'info', token.user, user.access, function (err, usr) {
                    if (err) {
                        serand.emit('user', 'login error');
                        return;
                    }
                    user.id = usr.id
                    user.username = usr.email;
                    serand.emit('user', 'logged in', user, options);
                });
            });
        },
        error: function () {
            serand.emit('user', 'login error');
        }
    });
};

serand.on('user', 'oauth', function (options) {
    serand.store('oauth', options);
    serand.emit('user', 'authenticator', {
        type: 'facebook'
    }, function (err, uri) {
        redirect(uri);
    });
});
