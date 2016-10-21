'use strict';

const helper = require('sendgrid').mail;
const q = require('q');

const sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
module.exports = function(from, subject, to, content) {
  var deferred = q.defer();

  var from_email = new helper.Email(from);
  var to_email = new helper.Email(to);
  subject = subject;
  content = new helper.Content('text/plain', content);
  var mail = new helper.Mail(from_email, subject, to_email, content);

  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request, function(error, response) {
    if (error) {
      return deferred.reject(error);
    }

    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);

    deferred.resolve(response);
  });

  return deferred.promise;
};
