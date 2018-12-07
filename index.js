var dust = require('dust')();
var serand = require('serand');
var utils = require('utils');
var token = require('token');
var user = require('user');
var redirect = serand.redirect;

dust.loadSource(dust.compile(require('./template'), 'accounts-token'));

module.exports = function (ctx, container, options, done) {
    var sandbox = container.sandbox;
    dust.render('accounts-token', options, function (err, out) {
        if (err) {
            return done(err);
        }
        var o = serand.store('oauth');
        findToken(o, options, function (err, usr) {
            if (err) {
                serand.emit('user', 'login error', err);
                return console.error(err);
            }
            serand.emit('user', 'logged in', usr, options);
            serand.store('oauth', null);
        });
        sandbox.append(out);
        done(null, function () {
            $('.accounts-token', sandbox).remove();
        });
    });
};

var findToken = function (options, o, done) {
    $.ajax({
        method: 'POST',
        url: utils.resolve('accounts:///apis/v/tokens'),
        data: {
            redirect_uri: options.location,
            client_id: options.clientId,
            grant_type: options.type,
            code: o.code
        },
        contentType: 'application/x-www-form-urlencoded',
        dataType: 'json',
        success: function (tok) {
            var uzer = {
                tid: tok.id,
                access: tok.access_token,
                refresh: tok.refresh_token,
                expires: tok.expires_in
            };
            token.findOne(uzer.tid, uzer.access, function (err, tok) {
                if (err) {
                    return done(err);
                }
                uzer.has = tok.has;
                user.findOne(tok.user, uzer.access, function (err, usr) {
                    if (err) {
                        return done(err);
                    }
                    uzer.id = usr.id
                    uzer.username = usr.email;
                    done(null, uzer);
                });
            });
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};
