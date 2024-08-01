# Discord Messages Auto Delete
This project is developed to help you automatically delete specific messages from your Discord account using regular expressions and word lists. However, please be aware that using the Discord client API in this manner may violate the platform's terms of service, so proceed at your own risk.

To get started, you will first need to request your Discord messages data. Once you have received and unpacked your data, place all the files from this repository into the `/messages/` folder. Next, install the necessary dependencies by running the command `npm install`. After that, configure the `config.json` file according to your preferences. Finally, run the parsing script by executing `node .`. This process will generate a `toDelete.json` file, which contains the messages marked for deletion.

Additionally, there are log files to help you track the process:

- The `deleted.json` file logs the results of the deletion attempts. It uses the following status codes:
  - `404`: The message wasn't found (it may no longer exist).
  - `403` / `400`: Missing permissions (probably you don't have access to the channel).
  - `204`: The message was deleted.

- The `unavailable_channels.json` file lists channels where deleting messages isn't possible, which helps reduce unnecessary requests.

## Attachments
For preserving all message history, there is an option to back up all attachments you've sent via Discord. This will save all files regardless of your filters, though some files may not be saved. This option is recommended if you want to retain a complete record of your messages.