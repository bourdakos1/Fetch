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

var conversation = watson.conversation({

});

app.post('/api/message', function(req, res) {
  var payload = {
    workspace_id: "387237d7-8d86-4f35-ac31-255bafd1bf0b",
    context: {}
  };
  if (req.body) {
    if (req.body.question) {
      payload.input = req.body.question;
    }
    if (req.body.context) {
      // The client must maintain context/state
      payload.context = req.body.context;
    }
  }
  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    return res.json(data);
  });
});

// Entity Extraction
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

// Find menu item
app.post('/wordcomp', function(req, res) {
   var subject = req.body.subject;
   var menu_items = JSON.stringify(req.body.menu_items);
   var python_script = spawn('python3', ['word_comp.py', subject, menu_items]);
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

// Build Menu
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
