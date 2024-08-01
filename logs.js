class logs {
    group(text = "") {
        process.stdout.write(`\x1b[1;31m${text}\x1b[0m`);
    }

    append(text, last = true) {
        if (last) {
            console.log(` -> ${text}`)
        } else {
            process.stdout.write(`\n   -> ${text}\n  `)
        }
    }
}

module.exports = logs;