# Dialog Node.js

  The Dialog starter application in Node.js is a sample that demonstrates how the IBM Watson [Dialog service][service_url] works in a specific context.
<p align="center">
<img src="http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/img/service-gifs/dialog.gif" width="400">
</p>
**This application requires a dialog file to be preloaded. You can use the** [dialog-tool](https://github.com/watson-developer-cloud/dialog-tool) **to create a dialog.**




Give it a try! Click the button below to fork into IBM DevOps Services and deploy your own copy of this application on Bluemix.

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/watson-developer-cloud/dialog-nodejs)



## Getting started

  1. Create a Bluemix account. [Sign up][sign_up] in Bluemix or use an existing account. Watson services in beta are free to use.

  2. Download and install the [Cloud-foundry CLI][cloud_foundry] tool.

  3. Edit the `manifest.yml` file and replace `<application-name>` with a unique name for your copy of the application. The name that you specify determines the application's URL, such as `<application-name>.mybluemix.net`.
    
    ```none
    applications:
    - services:
      - dialog-service
      name: <application-name>
      command: node app.js
      path: .
      memory: 256M
    ```
    
  4. Connect to Bluemix by running the following commands in the command-line tool:

    ```sh
    $ cf api https://api.ng.bluemix.net
    $ cf login -u <your-Bluemix-ID>
    ```

  5. Create the Dialog service in Bluemix by running the following command:

    ```sh
    $ cf create-service dialog standard dialog-service
    ```

  6. Push it live by running the following command:

    ```sh
    $ cf push
    ```

  6. Add your `DIALOG_ID` and restage the app:

    ```sh
    $ cf se <application-name> DIALOG_ID <dialog-id>
    $ cf restage <application-name>
    ```
   If you don't have a  `dialog_id` you can create one using the [dialog-tool](https://github.com/watson-developer-cloud/dialog-tool)

## Running the application locally
  The application uses [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.com/), so you must download and install them as part of the following steps.

  1. Copy the `username`, `password`, and `url` credentials from your `dialog-service` service in Bluemix to `app.js`. To see the credentials, run the following command, where `<application-name>` is the unique name you specified:
    
    ```sh
    $ cf env <application-name>
    ```
   The following example shows credentials for the Dialog service:

    ```sh
    System-Provided:
    {
    "VCAP_SERVICES": {
      "dialog": [{
          "credentials": {
            "url": "<url>",
            "password": "<password>",
            "username": "<username>"
          },
        "label": "dialog",
        "name": "dialog-service",
        "plan": "standard"
     }]
    }
    }
    ```
  
  2. Install [Node.js](http://nodejs.org/).
  3. Go to the project folder in a terminal and run the `npm install` command.
  4. Start the application by running `node app.js`.
  5. Open `http://localhost:3000` to see the running application.

## Troubleshooting

To troubleshoot your Bluemix app the main useful source of information are the logs, to see them, run:

  ```sh
  $ cf logs <application-name> --recent
  ```

## License

  This sample code is licensed under Apache 2.0. Full license text is available in [LICENSE](LICENSE).
  This sample uses jquery which is licensed under MIT.

## Contributing

  See [CONTRIBUTING](CONTRIBUTING.md).

## Open Source @ IBM
  Find more open source projects on the [IBM Github Page](http://ibm.github.io/)

[cloud_foundry]: https://github.com/cloudfoundry/cli
[sign_up]: https://apps.admin.ibmcloud.com/manage/trial/bluemix.html?cm_mmc=WatsonDeveloperCloud-_-LandingSiteGetStarted-_-x-_-CreateAnAccountOnBluemixCLI
[service_url]: http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/dialog/
