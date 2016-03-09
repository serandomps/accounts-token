var dust = require('dust')();
var serand = require('serand');
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
    var oauth = serand.store('oauth');
    var options = oauth.options;
    $.ajax({
        method: 'POST',
        url: '/apis/v/tokens',
        headers: {
            'X-Host': 'accounts.serandives.com'
        },
        data: {
            grant_type: oauth.type,
            code: o.code
        },
        contentType: 'application/x-www-form-urlencoded',
        dataType: 'json',
        success: function (token) {
            var user = {
                tid: token.id,
                username: token.username,
                access: token.access_token,
                refresh: token.refresh_token,
                expires: token.expires_in
            };
            serand.on('user', 'permissions', user, function (err, token) {
                if (err) {
                    serand.emit('user', 'login error');
                    return;
                }
                user.has = token.has;
                serand.emit('user', 'logged in', user, options);
            });
        },
        error: function () {
            serand.emit('user', 'login error');
        }
    });
};

serand.on('user', 'oauth', function (type, options) {
    serand.store('oauth', {
        type: type,
        options: options
    });
    serand.emit('user', 'authenticator', type, function (err, uri) {
        redirect(uri);
    });
});