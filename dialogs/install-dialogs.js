//
// POST/PUT to https://gateway.watsonplatform.net/dialog/api
// all the *.xml files in this directory.
//
// The files are uploaded with a name based on the file name plus the first
// characters of the username defined in the dialosg service credentials.
//
// A file called 'dialog-id.json' is kept with the ids returned by the service
// for each of the files.
//


'use strict';

var async = require('async'),
    bluemix = require('../config/bluemix'),
    fs = require('fs'),
    path = require('path'),
    request = require('request');

var dialogService = {
    getDialogs: function(credentials, cb) {
        request({
            url: credentials.url + '/v1/dialogs',
            auth: {
                user: credentials.username,
                pass:credentials.password
            }
        },
        function(error, response, body) {
            if (error) {
                cb(error);
            } else {
                var dialogs = {};
                JSON.parse(body).dialogs.forEach(function (el) {
                    dialogs[el.name] = el.dialog_id;
                });
                cb(null, dialogs);
            }
        });
    },
    setDialog: function(credentials, name, id, fullPath, cb) {
        var url,
            method,
            fileName = name + '.xml',
            formData = {
                file: {
                    value: fs.createReadStream(fullPath),
                    options: {
                        filename: fileName
                    }
                }
            };
        if (id === 'pending') {
            url = credentials.url + '/v1/dialogs';
            method = 'POST';
            formData.name = name;
        } else {
            url = credentials.url + '/v1/dialogs/' + id;
            method = 'PUT';
        }
        request({
                method: method,
                url: url,
                auth: {
                    user: credentials.username,
                    pass:credentials.password
                },
                formData: formData
            },
            function(error, response, body) {

                if (error) {
                    cb(error);
                } else {
                    if (response.statusCode < 300) {
                        if (response.statusCode === 201) {
                            var info = JSON.parse(body);
                            id = info.dialog_id;
                        }
                        var pair = {};
                        pair[name] = id;
                        cb(null, pair);
                    } else {
                        cb(new Error(':-( HTTP status: ' + response.statusCode));
                    }
                }
            });
    }
};

var dialogFiles = (function() {
    var fileInfo = {};
    var thisDir = path.dirname(__filename);

    function getXmlFilesInThisDir() {
        var xmlFiles = fs.readdirSync(thisDir).filter(function(aFile) {
            var fp = path.join(thisDir, aFile);
            return !fs.statSync(fp).isDirectory() &&
                   path.extname(fp).match(/^\.xml$/i);
        });
        return xmlFiles.map(function(aFile) {return aFile.replace(/\.xml$/i, '');});
    }

    return {
        loadFromDisk: function(userName) {
            var suffix = '_' + userName.substring(0, 8);
            fileInfo = {};
            getXmlFilesInThisDir().forEach(function(name) {
                var key = name + suffix;
                var fp = path.join(thisDir, name + '.xml');
                fileInfo[key] = {id: 'pending', fullPath: fp};
            });
        },
        updateWithServiceInfo: function(serviceInfo) {
            for (var key in fileInfo) {
                if (fileInfo.hasOwnProperty(key)) {
                    if (serviceInfo[key]) {
                        fileInfo[key].id = serviceInfo[key];
                    }
                }
            }
        },
        get: function() {return fileInfo;}
    };
})();


function updateDialogFiles(credentials) {
    function allDialogsProcessedCb(error) {
        if (error) {
            console.error('done :-(');
        } else {
            var dialogsFile = path.join(path.dirname(__filename), 'dialog-id.json');
            fs.writeFileSync(dialogsFile, 
                             JSON.stringify(dialogFiles.get(), null, 4));
            console.log('dialog files processed');
        }
    }

    function getDialogsCb(error, installed) {
        if (error) {
            console.error('something went wrong fetching dialogs: ' + error);
        } else {
            dialogFiles.loadFromDisk(credentials.username);
            dialogFiles.updateWithServiceInfo(installed);

            var processDialog = function(value, name, cb) {
                var dialogProcessedCb = function(error, pair) {
                    if (error) {
                        console.error('something went wrong with dialog "' + name + '": ' + error);
                        cb(error);
                    } else {
                        dialogFiles.get()[name].id = pair[name];
                        cb();
                    }
                };
                dialogService.setDialog(credentials, name, value.id, value.fullPath, 
                                        dialogProcessedCb);
            };
            async.forEachOf(dialogFiles.get(),
                            processDialog,
                            allDialogsProcessedCb);
        }
    }

    if (credentials && credentials.username) {
        dialogService.getDialogs(credentials, getDialogsCb);
    } else {
        console.warn('WARNING: Missing credentials or VCAP_SERVICES. Not installing dialog files.');
    }
}


updateDialogFiles(bluemix.getServiceCreds('dialog'));
