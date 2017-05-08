# Discord PingBot for EVE Online and FleetUp

## General information
The purpose of this bot is to give people notifications of upcoming fleets

## Usage
This bot needs to be self-hosted and requires NodeJS 7

#### Step one: Creating a bot user
1. Go to [discordapp.com/developers/applications/me](discordapp.com/developers/applications/me).
2. Create a new App, give it a name and picture. The "redirect URL" is not needed. Click "Create App".
3. Click on "Create a Bot User" and confirm.
4. Click the link next to "Token" to reveal your bot token, you will need it later.
5. Invite the bot to your server by placing the bot's Client ID in this link: `https://discordapp.com/oauth2/authorize?client_id=PLACE_CLIENT_ID_HERE&scope=bot`
6. Paste the link in your web browser and follow the steps on the Discord website.

#### Step two: Installing the bot
1. Clone this repository to a directory of your choice.
2. Install [NodeJS](https://nodejs.org/en/download/current/).
3. Install dependencies with `npm install`.
4. Go to the config folder, rename `example-config.ini` to `config.ini` and fill in all fields, this is where you use your bot token.
5. Go back to the main folder and run `npm start`.

Contact me in EVE Online: `Ionaru Otsada` or on Discord: `Ionaru#3801` if you need any assistance.

## Feature requests
Please open an [issue](https://github.com/Ionaru/PingBot/issues/new) if you have any feature ideas for this bot
or are missing any functionality.

Alternatively you can contact me in EVE Online: `Ionaru Otsada`, or on Discord: `Ionaru#3801`.
