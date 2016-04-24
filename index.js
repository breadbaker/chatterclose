

require('./secret');
var token = process.env.MESSAGING_VERIFY_TOKEN;

var lex = require('./lets');

var Client = require('node-rest-client').Client;

function sendTextMessage(sender, text) {
  var client = new Client();
  var messageData = {
    text:text
  }
  var args = {
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      recipient: {id:sender},
      message: messageData,
    }
  }

  client.post('https://graph.facebook.com/v2.6/me/messages?' + encodeURIComponent('access_token=' + token),args, function () {
    console.log(arguments);
  })
  // request({
  //   url: 'https://graph.facebook.com/v2.6/me/messages',
  //   qs: {access_token:token},
  //   method: 'POST',
  //   json: {
  //     recipient: {id:sender},
  //     message: messageData,
  //   }
  // }, function(error, response, body) {
  //   if (error) {
  //     console.log('Error sending message: ', error);
  //   } else if (response.body.error) {
  //     console.log('Error: ', response.body.error);
  //   }
  // });
}
// A happy little express app
var app = require('express')();

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')


app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser(process.env.cookie_secret));


app.get('/test', function (req, res) {
  res.send({ fart: true});
})

app.get('/fart/', function (req, res) {
  console.log('get fart');
  if (req.query['hub.verify_token'] === process.env.MESSAGING_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
})

app.post('/fart', function (req, res) {
  console.log('post fart');

  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));
    }
  }
  res.sendStatus(200);
});

lex.onRequest = app;

lex.listen([80], [443, 5001], function () {
  var protocol = ('requestCert' in this) ? 'https': 'http';
  console.log("Listening at " + protocol + '://localhost:' + this.address().port);
});