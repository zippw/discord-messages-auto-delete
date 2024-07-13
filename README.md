# Discord Messages Auto Delete
This project is developed to help you automatically delete specific messages from your Discord account using regular expressions and word lists.
## Warning
Using the Discord client API is restricted by the terms of service, so use this tool at your own risk.
## Setup
To use this project, you'll need to first [request your Discord data](https://support.discord.com/hc/en-us/articles/360004957991-Your-Discord-Data-Package). After you've unpacked your data, you'll need to put all the files from this repository into the `/messages/` folder.
Next, install dependency:<br>
**npm install**<br>
Then, configure the `config.json` file to suit your needs.<br>
After that, run the parsing script:<br>
**node find.js**<br>
This will create a `badMessages.json` file, which contains the messages that will be deleted.<br>
Finally, run the deleting script:<br>
**node delete.js**<br>
This will make multiple requests to Discord to delete the messages stored in the `badMessages.json` file.
## Logs
The `deleted.json` file is a log file that indicates which messages have been deleted. Here's what the different results mean:
- `404`: Message not found (it doesn't exist)
- `403` / `400`: Missing Permissions (probably you don't have access to the channel)
- `204`: The message was successfully deleted
