const fs = require('node:fs');
const JSONBigInt = require('json-bigint');
const { FILTERS, BANWORDS } = require('./config.json');

const findBadMessages = async () => {
    console.time("Time");
    let bad_messages = [];
    const data_map = Object.entries(require('./index.json'));

    for (const [channelId, description] of data_map) {
        const messages = await fs.readFileSync(`c${channelId}/messages.json`, 'utf-8');
        const guildId = JSON.parse(await fs.readFileSync(`c${channelId}/channel.json`, 'utf-8')).guild?.id;

        JSONBigInt.parse(messages).forEach(msg => {
            if (!msg.Contents) return;

            let matches = {};
            if (BANWORDS.length) matches.banwords = (msg.Contents.match(new RegExp(`\\b(${BANWORDS.join("|")})\\b`, "ig")) || []).filter(x => x);
            for (const [filterName, filter] of Object.entries(FILTERS)) {
                matches[filterName] = (msg.Contents.match(new RegExp(...filter)) || []).filter(x => x)
            };

            const messageId = msg.ID.toString();
            if (!Object.values(matches).filter(x => x.length).length) return;

            bad_messages.push({
                messageId, channelId, matches,
                txt: msg.Contents,
                link: `https://discord.com/channels/${guildId || "@me"}/${channelId}/${messageId}`
            });
        });
    };

    process.stdout.write(`Messages found: ${bad_messages.length} | `);
    console.timeEnd('Time');
    return bad_messages
};

findBadMessages().then((data) => {
    fs.writeFile('badMessages.json', JSON.stringify(data), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
});