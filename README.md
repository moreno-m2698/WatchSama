<h2 align="center">
    This project is currently in development!<br>
</h2>

## About: 

WatchSama is an open-source Discord bot that aims to be the go to bot in allowing users to express their anime interests by sharing their [MyAnimeList](https//:myanimelist.net) statistics to their Discord server.

This bot is available for anyone to clone and edit to match their server needs.

## Planned Features:

- Moderation Tools
- Database Integration
- MyAnimeList Account Editor

## Setup:

---

### Creating Discord Devloper Project

Before you begin using this bot you will need to create a Discord developer account which can be done [here](https://discord.com/developers). Once you have logged in you will want to create a new application by hitting the `New Application` button and naming your application. 

> Note that you can edit the public name of the bot and it's profile picture under the bot tag of the selected project's settings.





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
