
// get client, pattern, and function, 
// scan the client, perform the function on returned keys,
// and return the results
/**
 * 
 * @param {GlideClient} client 
 * @param {string | Buffer} pattern 
 * @param {function} func 
  * @returns {Promise<Array>} 
 */
export async function scanPerform(client, pattern, func) {
    let cursor = '0';
    const results = [];
    do {
        const reply = await client.scan(cursor, 'MATCH', pattern);
        cursor = reply[0];
        const keys = reply[1];
        for (const key of keys) {
            const result = await func(key);
            results.push(result);
        }
    } while (cursor !== '0');
    return results;
}
