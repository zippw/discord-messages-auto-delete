const fs = require('node:fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const JSONBigInt = require('json-bigint');
const { authorization, options, FILTERS, BANWORDS, IGNORE } = require('./config.js');
const logs = new (require('./logs.js'))();
const allChannels = Object.keys(require('./index.json'));

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sendRequest = async (channelId, messageId) => {
    try {
        const response = await fetch(`https://discord.com/api/v9/channels/${channelId}${messageId ? `/messages/${messageId}` : ""}`, {
            method: messageId ? "DELETE" : "GET", headers: { authorization }
        });
        if (response.status === 429) {
            const ratelimit = response.headers.get('retry-after') * 1000 + 200;
            logs.append(`429 retrying in ${ratelimit}ms`, false);
            await delay(ratelimit);
            return sendRequest(channelId, messageId);
        }
        return response.status;
    } catch (error) {
        logs.append(error.message);
        return error.message;
    }
};

const deleteMsg = async (channelId, messageId, deleted) => {
    const result = await sendRequest(channelId, messageId);
    logs.append(`${result} ${channelId}/${messageId}`);
    if (!deleted[`${channelId}/${messageId}`] && [204, 403, 400, 404].includes(result)) {
        deleted[`${channelId}/${messageId}`] = result;
        fs.writeFileSync('deleted.json', JSON.stringify(deleted, null, 4));
    }
};

const getUnavailableChannels = async () => {
    if (!options.skip_unavailable_messages) return [];
    if (fs.existsSync('unavailable_channels.json')) return require('./unavailable_channels.json');
    let unavailable_channels = [], index = 1;
    console.log('Fetching channels availability');
    for (const channelId of allChannels) {
        logs.group(`channel ${index++}/${allChannels.length}`);
        const result = await sendRequest(channelId);
        logs.append(`${result} (${[403, 404].includes(result) ? 'unavailable' : 'available'}) ${channelId}`);
        if ([403, 404].includes(result)) unavailable_channels.push(channelId);
    }
    fs.writeFileSync("unavailable_channels.json", JSON.stringify(unavailable_channels));
    return unavailable_channels;
};

const download = async url => {
    try {
        const urlPattern = /\/attachments\/(\d+)\/(\d+)\/([^?]+)/;
        const match = url.match(urlPattern);
        if (!match) throw new Error('Invalid url');

        const [_, channelId, fileId, fileName] = match;
        const dirPath = path.join(__dirname, `c${channelId}`, 'attachments', `f${fileId}`);
        const filePath = path.join(dirPath, fileName);

        if (fs.existsSync(filePath)) return logs.append('already downloaded');
        fs.mkdirSync(dirPath, { recursive: true });

        const stream = fs.createWriteStream(filePath);
        const res = await fetch(url);
        await finished(Readable.fromWeb(res.body).pipe(stream));
        logs.append(`saved to ${filePath}`);
    } catch (error) {
        logs.append(error.message);
    }
};

const backupFiles = async () => {
    if (!options.download_attachments) return;
    let attachments = [];
    console.log('Downloading attachments');
    for (const channelId of allChannels) {
        const messages = JSONBigInt.parse(await fs.readFileSync(`c${channelId}/messages.json`, 'utf-8'));
        for (const message of messages) if (message.Attachments) attachments.push(message.Attachments);
    }

    for (let i = 0; i < attachments.length; i++) {
        logs.group(`attachment ${i + 1}/${attachments.length}`);
        await download(attachments[i]);
    }
    console.log('all attachments saved!');
};

const getToDelete = async () => {
    console.time("Time");
    let bad_messages = [];
    for (const channelId of allChannels) {
        const messages = JSONBigInt.parse(await fs.readFileSync(`c${channelId}/messages.json`, 'utf-8'));
        const guildId = JSON.parse(await fs.readFileSync(`c${channelId}/channel.json`, 'utf-8')).guild?.id;
        messages.forEach(msg => {
            if (!msg.Contents) return;
            let matches = {};

            if (BANWORDS.length) matches.banwords = (msg.Contents.match(new RegExp(`\\b(${BANWORDS.join("|")})\\b`, "ig")) || []).filter(x => x);
            for (const [filterName, filter] of Object.entries(FILTERS)) {
                if (!IGNORE.some(x => msg.Contents.includes(x)))
                    matches[filterName] = (msg.Contents.match(new RegExp(filter.exp, filter.flags)) || []).filter(x => x);
            }

            if (Object.values(matches).every(arr => arr.length === 0)) return;
            bad_messages.push({
                messageId: msg.ID.toString(), channelId, matches,
                txt: msg.Contents,
                link: `https://discord.com/channels/${guildId || "@me"}/${channelId}/${msg.ID}`
            });
        });
    }

    console.log(`Messages found: ${bad_messages.length}`);
    console.timeEnd('Time');
    return bad_messages;
};

(async () => {
    let toDelete = await getToDelete();
    const unavailable_channels = await getUnavailableChannels();
    await backupFiles();
    toDelete = toDelete.filter(x => !unavailable_channels.includes(x.channelId));
    let deleted = require('./deleted.json');

    for (let i = 0; i < toDelete.length; i++) {
        const { messageId, channelId } = toDelete[i];
        if (!deleted[`${channelId}/${messageId}`]) {
            logs.group(`message ${i + 1} / ${toDelete.length}`);
            await deleteMsg(channelId, messageId, deleted);
        }
    }
})();