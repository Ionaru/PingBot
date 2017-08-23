# Discord PingBot for EVE Online and FleetUp

## General information
The purpose of this bot is to give people notifications of upcoming operations on FleetUp.

## What it does
PingBot will post messages in a single channel with information on upcoming FleetUp operations. It does this by polling the FleetUp API every couple of minutes and looking for changes in the response.

PingBot can send alerts for a number of actions done on FleetUp, here are the triggers:
* A new operation is created
* An existing operation was edited
* An existing operation was deleted
* An operation is starting in N hours (amount of hours is configurable)
* An operation is about to start

All triggers can be turned off and on individually in the configuration.

The notification this bot sends, can contain the following parts:
* The fleet name & starting time
* The location the fleet will form in
* The fleet doctrines
* The 'additional information' link
* The FleetUp link

All message parts can be turned off and on individually in the configuration.

Here's an example message:

![example image of PingBot](https://cloud.githubusercontent.com/assets/3472373/26179692/6e4a15da-3b65-11e7-8266-272aae2298cf.png)

## Usage
This bot needs to be self-hosted and requires NodeJS 8

#### Part one: Creating a bot user
1. Go to [discordapp.com/developers/applications/me](https://discordapp.com/developers/applications/me).
2. Create a new App, give it a name and picture. The "redirect URL" is not needed. Click "Create App".
3. Click on "Create a Bot User" and confirm.
4. Click the link next to "Token" to reveal your bot token, you will need it later.
5. Invite the bot to your server by placing the bot's Client ID in this link: `https://discordapp.com/oauth2/authorize?client_id=PLACE_CLIENT_ID_HERE&scope=bot`
6. Paste the link in your web browser and follow the steps on the Discord website.

#### Part two: Installing the bot
1. Install [NodeJS](https://nodejs.org/en/download/current/).
2. Clone this repository to a directory of your choice and enter that directory.
3. Install dependencies with `npm install`. (Or `yarn`, if installed).
4. Go to the config folder, copy `example-config.ini`, rename the copy to `config.ini` and fill in all fields, this is where you use your bot token.
5. Go back to the main folder and run `npm start`.

Contact me in EVE Online: `Ionaru Otsada` or on Discord: `Ionaru#3801` if you need any assistance.

## Feature requests
Please open an [issue](https://github.com/Ionaru/PingBot/issues/new) if you have any feature ideas for this bot
or are missing any functionality.

Alternatively you can contact me in EVE Online: `Ionaru Otsada`, or on Discord: `Ionaru#3801`.
