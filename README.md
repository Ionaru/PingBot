# Discord PingBot for EVE Online and FleetUp

## General information
The purpose of this bot is to give people notifications of upcoming operations on FleetUp.

## What it does
PingBot will post messages in a single channel with information on upcoming FleetUp operations. It does this by polling the FleetUp API every couple of minutes and looking for changes in the response.

Here's an example message:

![example image of PingBot](https://cloud.githubusercontent.com/assets/3472373/26179692/6e4a15da-3b65-11e7-8266-272aae2298cf.png)

In the message, PingBot can put information on the fleet's name, start time, form location, doctrines, info url, and FleetUp url. All of these can be turned on or off in the config.

PingBot can send alerts for a number of actions done on FleetUp, these include the creation of a new operation, an edit of an existing operation and deletion of an operation. All of these can be turned on or off in the config.

When an operation is about to start, PingBot can send a warning about the upcoming operation a configurable number of hours before the operation starts.

Finally, PingBot can also optionally send a notification when a fleet is about to start (see screenshot above).

## Usage
This bot needs to be self-hosted and requires NodeJS 7

#### Part one: Creating a bot user
1. Go to [discordapp.com/developers/applications/me](discordapp.com/developers/applications/me).
2. Create a new App, give it a name and picture. The "redirect URL" is not needed. Click "Create App".
3. Click on "Create a Bot User" and confirm.
4. Click the link next to "Token" to reveal your bot token, you will need it later.
5. Invite the bot to your server by placing the bot's Client ID in this link: `https://discordapp.com/oauth2/authorize?client_id=PLACE_CLIENT_ID_HERE&scope=bot`
6. Paste the link in your web browser and follow the steps on the Discord website.

#### Part two: Installing the bot
1. Install [NodeJS 7](https://nodejs.org/en/download/current/).
2. Clone this repository to a directory of your choice and enter that directory.
3. Install dependencies with `npm install` or `yarn` if installed.
4. Go to the config folder, rename `example-config.ini` to `config.ini` and fill in all fields, this is where you use your bot token.
5. Go back to the main folder and run `npm start`.

Contact me in EVE Online: `Ionaru Otsada` or on Discord: `Ionaru#3801` if you need any assistance.

## Feature requests
Please open an [issue](https://github.com/Ionaru/PingBot/issues/new) if you have any feature ideas for this bot
or are missing any functionality.

Alternatively you can contact me in EVE Online: `Ionaru Otsada`, or on Discord: `Ionaru#3801`.
