const fs = require('node:fs');
const { authorization } = require('./config.json');

const delay = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) };

const sendRequest = async (channelId, messageId) => {
    let result;
    try {
        let response = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages/${messageId}`, {
            "method": "DELETE", "headers": { authorization }
        });

        result = response.status;
        if (response.status === 429) {
            const ratelimit = response.headers.get('retry-after') * 1000 + 200;
            process.stdout.write(`\n   -> 429: retrying in ${ratelimit}ms\n  `);

            await delay(ratelimit);
            result = await sendRequest(channelId, messageId);
            await delay(1000);
        };
    } catch (error) { result = error.message }

    return result;
};

const deleteMsg = async (channelId, messageId, deleted) => {
    const result = await sendRequest(channelId, messageId);
    console.log(` -> ${result} ${channelId}/${messageId}`);

    if (!deleted[`${channelId}/${messageId}`] && [204, 403, 400, 404].includes(result)) {
        deleted[`${channelId}/${messageId}`] = result;
        await fs.writeFileSync('deleted.json', JSON.stringify(deleted, null, 4));
    };
};

(async () => {
    let deleted = require('./deleted.json'), index = 0;
    for (const { messageId, channelId } of require('./badMessages.json')) {
        index++
        if (!deleted[`${channelId}/${messageId}`]) {
            process.stdout.write(`\x1b[1;31mmessage ${index}\x1b[0m`);
            await deleteMsg(channelId, messageId, deleted);
        }
    }
})()