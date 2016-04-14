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

/**
* Dear whoever has to read this,
*
* I am so sorry you have to look through this mess
* I promise I will clean all this up after the competion
* I feel bad
*
* This is very poorly commented
* Again, I appologize
*
*/

/* global $:true */

'use strict';

// conversation variables
var context = '/proxy/api';
var conversation_id, client_id;
var messages = new Array();
var menu = false;
var menu_data;
var sub_total = 0;

$(document).ready(function () {
   var parseMessage = function(userText) {
      $.post('/api/classify', {text: userText})
      .done(function onSucess(answers){
         loading();
         $chatInput.val(''); // clear the text input
         console.log(answers.top_class);
         console.log(Math.floor(answers.classes[0].confidence * 100) + '%');

         if (answers.top_class == 'food') {

            var params = {
               'question' : userText
            };

            $.post('/parse', params)
            .done(function onSucess(answer) {
               console.log(answer);
               buildMenu(answer);
            });
         } else if (answers.top_class == 'recommend') {
            var params = {
               'question' : 'best'
            };

            $.post('/parse', params)
            .done(function onSucess(answer) {
               console.log(answer);
               buildMenu(answer);
            });
         } else {
            talk(true,  "What would you like to eat?");
         }
         $chatInput.show();
         $chatInput.focus();
      })
      .fail(function onError(error) {
         console.log('classifier failed');
      })
      .always(function always(){
         scrollChatToBottom();
         $chatInput.focus();
      });
   }
   var loading = function() {
      var $chatBox = $('#content');
      var html = '';
      html += '<div class="clearfix" style="margin-top: -23px;">';
      html += '   <div class="loading">';
      html += '      <div class="dot" id="a"></div>';
      html += '      <div class="dot" id="b"></div>';
      html += '      <div class="dot" id="c"></div>';
      html += '   </div>';
      html += '</div>';
      html += '</br>';
      $chatBox.append(html);
   }
   var buildMenu = function(subject) {
      var params = {
         'subject' : subject
      };

      $.post('/menu', params)
      .done(function onSucess(answer) {
         console.log('parsing');
         answer = $.parseJSON(answer);
         menu_data = answer;
         if (answer.name == undefined) {
            talk(true, 'Sorry, I dont understand');
            menu = false;
            return;
         }
         menu = true;
         // Load the menu
         $('.receipt_title').html(answer.name);
         var html = '';
         html += '<div class="menu header">';
         html +=	'  <img src="' + answer.logo + '" class="restaurant_logo">';
         html +=	'  <div class="menu restaurant_info">';
         html +=	'     <h1 class="menu">' + answer.name + '</h1>';
         html +=	'     <div class="menu rating">';
         html +=	'        <div class="rating-top" style="width: ' + answer.stars + 'em"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>';
         html +=	'        <div class="rating-bottom"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>';
         html +=	'     </div>';
         html +=	'     <h4 class="menu reviews">' + answer.reviews + ' reviews</h4>';
         html +=	'  </div>';
         html += '</div>';
         for (var k = 0; k < answer.menus.length; k++) {
            for (var i = 0; i < answer.menus[k].sections.length; i++) {
               var section = answer.menus[k].sections[i];
               html += '<h2 class="menu">' + section.name + '</h2>';
               for (var j = 0; j < section.items.length; j++) {
                  html += '<div class="menu item">';
                  html += '  <div class="menu title">' + section.items[j].name + '</div><div class="menu price">$' + section.items[j].price + '</div>';
                  html += '  <div style="clear:both; height: 8px"></div>';
                  html += '  <h4 class="menu">' + section.items[j].description + '</h4>';
                  html += '</div>';
               }
            }
         }
         $('#menu').html(html);

         // This is a bad name, I should change it to something else
         var openMenu = false;

         // Check if its a restaurant or a food item
         if (answer.name.toLowerCase() == subject.replace(/(\r\n|\n|\r)/gm,'').toLowerCase()) {
            var params = { input : 'restaurant' };
            openMenu = true;
         } else if (subject.replace(/(\r\n|\n|\r)/gm,'').toLowerCase() == 'best') {
            openMenu = true;
            var params = { input : 'recommend' };
         } else {
            var params = { input : 'subject' };
            talk(true,  "hmmmm");
            loading();
         }

         // check if there is a conversation in place and continue that
         // by specifing the conversation_id and client_id
         if (conversation_id) {
            params.conversation_id = conversation_id;
            params.client_id = client_id;
         }

         $.post('/conversation', params)
         .done(function onSucess(dialog) {
            conversation_id = dialog.conversation.conversation_id;
            client_id = dialog.conversation.client_id;
            console.log(dialog);
            var text = dialog.conversation.response.join('');
            text = text.replace("[restaurant]", answer.name);
            text = text.replace("[subject]", subject.replace(/(\r\n|\n|\r)/gm,''));
            talk(true,  text);
            if (!openMenu) {
               talk(true,  "Would you like to see the menu?");
            }
         });
      });
   };

   var $chatInput = $('#field');

   $chatInput.keypress(function (e) {
      if (e.ctrlKey || e.shiftKey && e.keyCode == 13) {
         return true;
      } else if (e.which == 13) {
         converse($(this).val());
         return false;
      }
   });

   $( ".wrapper" ).click(function() {
      $chatInput.focus();
   });

   $(function(){
      $('#content').css({
         height: $(window).innerHeight() - ($chatInput.innerHeight() + $('#title').innerHeight())
      });
      $(window).resize(function(){
         $('#content').css({
            height: $(window).innerHeight() - ($chatInput.innerHeight() + $('#title').innerHeight())
         });
      });
   });

   var converse = function(userText) {

      // check if the user typed text or not
      if (typeof(userText) !== undefined && $.trim(userText) !== '')
      submitMessage(userText);

      // If the menu is open, take orders, no need to classify
      if (menu) {
         loading();

         var items = [];
         for (var k = 0; k < menu_data.menus.length; k++) {
            for (var i = 0; i < menu_data.menus[k].sections.length; i++) {
               var section = menu_data.menus[k].sections[i];
               for (var j = 0; j < section.items.length; j++) {
                  items.push(section.items[j].name);
               }
            }
         }

         var params = {
            'subject' : userText,
            'menu_items' : items
         };

         $.post('/wordcomp', params)
         .done(function onSucess(answer) {
            console.log(answer);

            for (var k = 0; k < menu_data.menus.length; k++) {
               for (var i = 0; i < menu_data.menus[k].sections.length; i++) {
                  var section = menu_data.menus[k].sections[i];
                  for (var j = 0; j < section.items.length; j++) {
                     items[section.items[j].name] = section.items[j].price;
                     // console.log(section.items[j].name.toLowerCase() + ' == ' + answer.toLowerCase());
                     if (section.items[j].name.replace(/(\r\n|\n|\r)/gm,'').toLowerCase() == answer.replace(/(\r\n|\n|\r)/gm,'').toLowerCase()) {
                        console.log('One order of ' + userText);
                        var html = '';
                        html += '<div class="receipt_totals pad">' + section.items[j].name + '</div><div class="receipt_price pad">$' + section.items[j].price + '</div>';
                        html += '<div style="clear:both;"></div>';
                        $('.receipt_items').append(html);

                        if (isNaN(parseFloat(section.items[j].price))) {
                           sub_total += 0;
                        } else {
                           sub_total += parseFloat(section.items[j].price);
                        }

                        $('#subtotal').html('$' + sub_total.toFixed(2));
                        $('#tax').html('$' + (sub_total * .07).toFixed(2));
                        $('#delivery').html('$1.00');
                        $('#tip').html('$' + (sub_total * .15).toFixed(2));
                        $('#total').html('$' + (sub_total * 1.22 + 1).toFixed(2));

                        talk(true, 'Anything else?');
                        openReceipt();
                        return;
                     }
                  }
               }
            }

            var newText = userText.replace(/[^\w\s]|(.)(?=\1)/gi, "");

            var params = { input : newText };
            
            if (conversation_id) {
               params.conversation_id = conversation_id;
               params.client_id = client_id;
            }

            $.post('/conversation', params)
            .done(function onSucess(dialog) {
               conversation_id = dialog.conversation.conversation_id;
               client_id = dialog.conversation.client_id;
               console.log(dialog);
               var text = dialog.conversation.response.join('');
               if (text == 'Hmmm... I didn\'t quite catch that.Have you tried [restaurant]? They have pretty good [subject]!') {
                  talk(true,  'I can\'t find that on the menu');
                  talk(true,  '(please refresh the page to find a new restaurant - this will be fixed soon)');
                  return;
               }
               if (text == 'Hmmm... I didn\'t quite catch that.') {
                  talk(true,  'I can\'t find that on the menu');
                  talk(true,  '(please refresh the page to find a new restaurant - this will be fixed soon)');
                  return;
               }
               talk(true,  text);
            });
         });

         // Classify
      } else {
         parseMessage(userText);
      }
   };

   var scrollChatToBottom = function() {
      var element = $('#content');
      element.animate({
         scrollTop: element[0].scrollHeight
      }, 300);
   };

   var openMenu = function() {
      var params = {
         conversation_id: conversation_id,
         client_id: client_id
      };

      $.post('/profile', params)
      .done(function onSucess(data) {
         data.name_values.forEach(function(par) {
            if (!par.value !== '') {
               if (par.name == 'menu_loaded' && par.value == 'true') {
                  $(".expander").css({
                     width: "1100px"
                  });
                  if ($(".receipt_wrapper").width() < 1100) {
                     $(".receipt_wrapper").css({
                        width: "1100px"
                     });
                  }
               } else if (par.name == 'menu_loaded') {
                  $(".expander").css({
                     width: "700px"
                  });
                  if ($(".receipt_wrapper").width() < 1100) {
                     $(".receipt_wrapper").css({
                        width: "1100px"
                     });
                  }
               }
            }
         });
      });
   };

   var openReceipt = function() {
      $(".receipt_wrapper").css({
         width: "1376px"
      });
   };

   var talk = function(origin, text) {
      openMenu();
      var d = new Date();
      var n = d.getTime();
      messages.push({incoming: origin, message: text, timestamp: n});
      var $chatBox = $('#content');
      var html = '';
      for (var i = 0; i < messages.length; i++) {
         if (i == 0) {
            // html += '</br>';
         }
         var message = messages[i];

         var prevText = null;
         if (i > 0) {
            prevText = messages[i - 1];
         }

         var nextText = null;
         if (i < messages.length - 1) {
            nextText = messages[i + 1];
         }

         // Get the date of the current, previous and next message.
         var dateCurrent = message.timestamp;
         var datePrevious = 0;
         var dateNext = 0;

         // Get the sender of the current, previous and next message. (returns true if you)
         var userCurrent = message.incoming;
         var userPrevious = message.incoming;
         var userNext = !message.incoming;

         // Check if previous message exists, then get the date and sender.
         if (prevText != null) {
            datePrevious = prevText.timestamp;
            userPrevious = prevText.incoming;
         }

         // Check if next message exists, then get the date and sender.
         if (nextText != null) {
            dateNext = nextText.timestamp;
            userNext = nextText.incoming;
         }

         // Calculate time gap.
         var largePC = (dateCurrent - datePrevious) > (60 * 1000);
         var largeCN = (dateNext - dateCurrent) > (60 * 1000);
         var top = false;
         html += '<div class="clearfix">';
         if (!userCurrent && (userPrevious || largePC) && (!userNext && !largeCN)) {
            html += '<span class="bubble right rtop">' + messages[i].message + '</span>';
         } else if (!userCurrent && (!userPrevious && !largePC) && (!userNext && !largeCN)) {
            html += '<span class="bubble right rmiddle">' + messages[i].message + '</span>';
         } else if (!userCurrent && (!userPrevious && !largePC)) {
            top = true;
            html += '<span class="bubble right rbottom">' + messages[i].message + '</span>';
         } else if (!userCurrent) {
            top = true;
            html += '<span class="bubble right single">' + messages[i].message + '</span>';
         } else if ((!userPrevious || largePC) && (userNext && !largeCN)) {
            html += '<span class="bubble left ltop">' + messages[i].message + '</span>';
         } else if ((userPrevious && !largePC) && (userNext && !largeCN)) {
            html += '<span class="bubble left lmiddle">' + messages[i].message + '</span>';
         } else if (userPrevious && !largePC) {
            html += '<span class="bubble left lbottom">' + messages[i].message + '</span>';
         } else {
            html += '<span class="bubble left single">' + messages[i].message + '</span>';
         }
         html += '</div>';
         if (i == messages.length - 1) {
            html += '<div class="clearfix">';
            if (top) {
               html += '<span style="height: 34px; display: inline-block;"></span>';
            } else {
               html += '<span style="height: 20px; display: inline-block;"></span>';
            }
            html += '</div>';
         }
      }
      $chatBox.html(html);
      setTimeout(function() {
      }, 100);
   };

   var submitMessage = function(text) {
      talk(false, text);
      scrollChatToBottom();
      clearInput();
   };

   var clearInput = function() {
      $('#field').val('');
   };

   // Initialize the conversation this could be done better
   var $chatBox = $('#content');
   var html = '<span style="height: 34px; display: inline-block;"></span>';
   $chatBox.append(html);
   loading();
   var params = { input : '' };
   if (conversation_id) {
      params.conversation_id = conversation_id;
      params.client_id = client_id;
   }
   $.post('/conversation', params)
   .done(function onSucess(dialog) {
      conversation_id = dialog.conversation.conversation_id;
      client_id = dialog.conversation.client_id;
      console.log(dialog);
      talk(true, dialog.conversation.response.join(''));
   });

});
