/**
* Copyright 2015 IBM Corp. All Rights Reserved.
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

/* global $:true */

'use strict';

// conversation variables
var conversation_id, client_id;
var messages = new Array();

$(document).ready(function () {
   var buildMenu = function(subject) {
      var params = {
         'subject' : subject
      };

      $.post('/menu', params)
      .done(function onSucess(answer) {
         console.log('parsing');
         answer = $.parseJSON(answer);
         if (answer.name == undefined) {
            talk(true, 'Sorry, I dont understand');
            return;
         }
         var html = '';
         html += '<div class="menu header">';
         html +=	'  <img src="' + answer.logo + '" class="restaurant_logo">';
         html +=	'  <div class="menu restaurant_info">';
         html +=	'     <h1 class="menu">' + answer.name + '</h1>';
         html +=	'     <div class="menu rating">'
         html +=	'        <div class="rating-top" style="width: ' + answer.stars + 'em"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>'
         html +=	'        <div class="rating-bottom"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>'
         html +=	'     </div>'
         html +=	'     <h4 class="menu reviews">' + answer.reviews + ' reviews</h4>';
         html +=	'  </div>';
         html += '</div>';
         for (var k = 0; k < answer.menus.length; k++) {
            for (var i = 0; i < answer.menus[k].sections.length; i++) {
               var section = answer.menus[k].sections[i];
               html += '<h2 class="menu">' + section.name + '</h2>';
               for (var j = 0; j < section.items.length; j++) {
                  html += '<div class="menu item">'
                  html += '  <div class="menu title">' + section.items[j].name + '</div><div class="menu price">$' + section.items[j].price + '</div>'
                  html += '  <div style="clear:both; height: 8px"></div>'
                  html += '  <h4 class="menu">' + section.items[j].description + '</h4>'
                  html += '</div>'
               }
            }
         }
         $('#menu').html(html);
         var openMenu = false;
         if (answer.name.toLowerCase() == subject.replace(/(\r\n|\n|\r)/gm,'').toLowerCase()) {
            var params = { input : 'restaurant' };
            openMenu = true;
         } else {
            var params = { input : 'subject' };
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
            if (openMenu) {
               $(".expander").css({
                  width: "1100px"
               });
            } else {
               $(".expander").css({
                  width: "700px"
               });
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
      if (window.matchMedia('(max-width: 990px)').matches) {
         $('#content').css({
            bottom: $chatInput.innerHeight()
         });
      } else {
         $('#content').css({
            height: $(window).innerHeight() - ($chatInput.innerHeight() + $('#title').innerHeight())
         });
      }
      $(window).resize(function(){
         if (window.matchMedia('(max-width: 990px)').matches) {
            $('#content').css({
               bottom: $chatInput.innerHeight()
            });
            console.log("bottom");
         } else {
            $('#content').css({
               height: $(window).innerHeight() - ($chatInput.innerHeight() + $('#title').innerHeight())
            });
         }
      });
   });

   var converse = function(userText) {

      // check if the user typed text or not
      if (typeof(userText) !== undefined && $.trim(userText) !== '')
      submitMessage(userText);

      if (userText.toLowerCase() == "yes" || userText.toLowerCase() == "yea" || userText.toLowerCase() == "sure") {
         $(".expander").css({
            width: "1100px"
         });
         return;
      }

      if (userText.toLowerCase() == "close") {
         $(".expander").css({
            width: "700px"
         });
         return;
      }

      $.post('/api/classify', {text: userText})
      .done(function onSucess(answers){
         var $chatBox = $('#content');
         var html = '';
         html += '<div class="clearfix">';
         html += '   <div class="loading">';
         html += '      <div class="dot" id="a"></div>';
         html += '      <div class="dot" id="b"></div>';
         html += '      <div class="dot" id="c"></div>';
         html += '   </div>';
         html += '</div>';
         html += '</br>';
         $chatBox.append(html);
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
         } else {
            var params = { input : answers.top_class };

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

   };

   var scrollChatToBottom = function() {
      var element = $('#content');
      element.animate({
         scrollTop: element[0].scrollHeight
      }, 300);
   };

   var talk = function(origin, text) {
      var d = new Date();
      var n = d.getTime();
      messages.push({incoming: origin, message: text, timestamp: n});
      var $chatBox = $('#content');
      var html = '';
      for (var i = 0; i < messages.length; i++) {
         if (i == 0) {
            html += '</br>';
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

         html += '<div class="clearfix">';
         if (!userCurrent && (userPrevious || largePC) && (!userNext && !largeCN)) {
            html += '<span class="bubble right rtop">' + messages[i].message + '</span>';
         } else if (!userCurrent && (!userPrevious && !largePC) && (!userNext && !largeCN)) {
            html += '<span class="bubble right rmiddle">' + messages[i].message + '</span>';
         } else if (!userCurrent && (!userPrevious && !largePC)) {
            html += '<span class="bubble right rbottom">' + messages[i].message + '</span>';
         } else if (!userCurrent) {
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
            html += '</br>';
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
