module.exports = {
    authorization: "YOUR_DISCORD_ACCOUNT_TOKEN_GOES_HERE",
    options: {
        skip_unavailable_messages: true, // ignores channels where you don't have access to delete messages
        download_attachments: false,
        delete_new_ones_first: true
    },
    FILTERS: { // deletes messages that matches your RegExp FILTERS
        everything: { exp: ".*", flags: 'ig' },
        // links: { exp: "(https?:\/\/[^\s]+)", "ig"},
        // other custom filters ...
    },
    
    BANWORDS: [], //    deletes all messages that contains words from list | example: ["all", "messages", "with", "these", "words", "will", "be", "deleted"]
    IGNORE: [], //      ignores FILTERED messages with these words         | example: ["youtu.be", "youtube", "discord", "tenor"]
}