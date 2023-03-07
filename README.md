# SARB
Search And Reply Bot
SARB is a bot that searches for a specific message in a channel through given keywords and replies to it with that specific message. If a message is not found, it will search wikipedia and save it in its database and reply with that information.


## Approach
First, the bot will search for the message in the database. If it is found, it will reply with that message. If it is not found, it will search wikipedia and save it in the database and reply with that information.
<br>
If the message is not found in the database, and niether in wikipedia, it will try to solve the problem by searching for the keywords in the message and reply with the message that contains the most keywords.
<br>
For example, if the message is "What is the capital of France?", the bot will search for the keywords "capital" and "France" in the database. If it finds a message that contains both of these keywords, it will reply with that message. If it does not find any message that contains both of these keywords, it will search wikipedia and save it in the database and reply with that information.
<br>
There surely are better approaches to this problem, but this is the one I came up with. And soon I will be adding more features to this bot. for example the ability to solve math problems and more.


## Usage
Read https://github.com/ars-4/words_bot for installation and api usage.