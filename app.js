/**
* Copyright 2016 Nick Bourdakos. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

var express  = require('express'),
app        = express(),
fs         = require('fs'),
path       = require('path'),
bluemix    = require('./config/bluemix'),
extend     = require('util')._extend,
watson     = require('watson-developer-cloud'),
spawn      = require('child_process').spawn;

// Bootstrap application settings
require('./config/express')(app);

// Create the service wrapper
var nlClassifier = watson.natural_language_classifier({
  url : 'https://gateway.watsonplatform.net/natural-language-classifier/api',
  username : '334f40b3-0dc3-4ebf-83c0-42f861d7b23c',
  password : 'CD0Tg9AnyEqv',
  version  : 'v1'

});

app.post('/api/classify', function(req, res, next) {
  var params = {
    classifier: process.env.CLASSIFIER_ID || 'f1704ex55-nlc-4205', // pre-trained classifier
    text: req.body.text
  };

  nlClassifier.classify(params, function(err, results) {
    if (err)
      return next(err);
    else
      res.json(results);
  });
});

// if bluemix credentials exists, then override local
var credentials =  extend({
   url: 'https://gateway.watsonplatform.net/dialog/api',
   username: '089907cc-dc03-4e1b-b58c-4c22fb5d4042',
   password: 'S3JRhYSRB9ue',
   version: 'v1'
}, bluemix.getServiceCreds('dialog')); // VCAP_SERVICES


var dialog_id_in_json = (function() {
   try {
      var dialogsFile = path.join(path.dirname(__filename), 'dialogs', 'dialog-id.json');
      var obj = JSON.parse(fs.readFileSync(dialogsFile));
      return obj[Object.keys(obj)[0]].id;
   } catch (e) {
   }
})();


var dialog_id = process.env.DIALOG_ID || dialog_id_in_json || '03414c0f-1244-4223-a7bd-51bff6f6c370';

// Create the service wrapper
var dialog = watson.dialog(credentials);

app.post('/conversation', function(req, res, next) {
   var params = extend({ dialog_id: dialog_id }, req.body);
   dialog.conversation(params, function(err, results) {
      if (err)
      return next(err);
      else
      res.json({ dialog_id: dialog_id, conversation: results});
   });
});

app.post('/profile', function(req, res, next) {
   var params = extend({ dialog_id: dialog_id }, req.body);
   dialog.getProfile(params, function(err, results) {
      if (err)
      return next(err);
      else
      res.json(results);
   });
});

app.post('/parse', function(req, res) {
   var question = req.body.question;
   var python_script = spawn('python3', ['trainer.py', question]);
   python_script.stdout.on('data', function(data) {
      res.send(data);
      console.log('stdout: ' + data);
   });

   python_script.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
   });

   python_script.on('close', function (code) {
      console.log('child process exited with code ' + code);
   });
});

// This is pretty bad
// Create an actual python server for this after the competition
global.data = '';
app.post('/menu', function(req, res) {
   var subject = req.body.subject;
   var lat = req.body.lat;
   var lng = req.body.lng;
   var send = false;
   var python_script = spawn('python3', ['menu_builder.py', subject, lat, lng]);

   python_script.stdout.on('data', function(data) {
      global.data += data;
   });

   python_script.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
   });

   python_script.on('close', function (code) {
      console.log('stdout: ' + global.data);
      console.log('child process exited with code ' + code);
      res.send(global.data);
      global.data = '';
   });
});

var request = require('request');

// error-handler settings
require('./config/error-handler')(app);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
