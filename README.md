<h2 align="center">
    This project is currently in development!<br>
</h2>

## About: 

WatchSama is an open-source Discord bot that aims to be the go to bot in connecting your Discord account with your MyAnimeList account. By using WatchSama you will be able to share and express your anime interests from your MAL account with your discord server through its custom generated views and embeds in a visually appealing way. WatchSama also has search capabilties as well so you will be able to search for anime recommendations by using its built in search command!

This bot is available for anyone to clone and edit to match their server needs.

## Planned Features:

- Moderation Tools
- Database Integration
- MyAnimeList Account Editor

## Setup:

---

### Creating Discord Developer Project

Before you begin using this bot you will need to create a Discord developer account which can be done [here](https://discord.com/developers). Once you have logged in you will want to create a new application by hitting the `New Application` button and naming your application. 

> Note that you can edit the public name of the bot and its profile picture under the bot tag of the selected project's settings.





### Installation

Next you will want to install the bot by cloning the repository into a file using:

```
$ git clone https://github.com/moreno-m2698/WatchSama.git
$ cd WatchSama
$ pip install -r requirements.txt
```

### Setup 

Once you have opened up the project you will want to create a `.env` file using the format of the `.env.example` file which is provided. For this bot to function you will need the following:

- MyAnimeList account username
- Discord application key
- (Optional) Discord Guild ID for bot testing

### Discord Application Key

To receive your application key, select the Application you are wanting to generate and select General under the OAuth2 tab of settings. You will want to select the `Reset Secret` button and copy this key into your `.env` file. (DO NOT SHOW THIS KEY AS IT CAN RISK YOUR APPLICATION'S SECURITY)

### Generate Bot Invitation Link

To generate the invitation link for your bot you will want to select URL Generator under the OAuth2 tab of your application settings. From there you will want to select the bot checkbot under Scopes which will then cause the Bot Permissions table to open up. Under general permissions select the Administrator checkbox and copy the generated url at the bottom of the page. Upon navigating to this url you will be able to invite the bot to your desired server.

### Commands

- !watching - this command will generate a list of embeds and progress bars for shows that are currently being watched on the linked account.

- !complete - This command will generate a list of embeds to show off what shows you have completed.

- !search `args` - This command will provide you search result information from MyAnimeList.