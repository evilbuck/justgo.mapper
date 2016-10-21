'use strict';

const nodemailer = require('nodemailer');
const q = require('q');

var smtpPass = process.env.smtpPass;
var email = `buckleyrobinson@gmail.com`;
//var smtp = `smpts://${email}:${smtpPass}@smtp.gmail.com`;
const smtpTransport = require(`nodemailer-smtp-transport`);
const transporter = nodemailer.createTransport(smtpTransport({
  host: `smtp.gmail.com`,
  secureConnection: true,
  port: 465,
  auth: {
    user: email,
    pass: smtpPass,
  }
}));

console.log('user:pass', email, smtpPass);
module.exports = function() {
  var deferred = q.defer();

  var mailOptions = {
    from: `"Just Go ?" <${email}>`, // sender address
    to: `5612552825@vtext.com`, // list of receivers
    subject: 'Just Go Then', // Subject line
    text: 'Hello world ?', // plaintext body
    //html: '<b>Hello world ?</b>' // html body
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) return deferred.reject(err);

    deferred.resolve(info);
  });

  deferred.promise.fail(console.error);

  return deferred.promise;
}
