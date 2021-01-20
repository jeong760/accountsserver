'use strict';
const utils = require("../utils");
const setaccount = require("./setaccount");
const g_constants = require("../constants");
const getnewaddress = require("./getnewaddress");

exports.Run = async function(coin, headers, post_data, res)
{
//    if (utils.IsOffline(coin.name))
//        return res.end(JSON.stringify({error: 'fail', message: 'coin offline'}));

    try
    {
        const data = JSON.parse(post_data);

        const account = data.params && data.params.length ? data.params[0] : "*";
        
        const oldAddress = await exports.fromDB(coin.name, account);
        
        if (oldAddress)
            return res.end(oldAddress);
            
        const newAddress = await getnewaddress.queryDaemon(coin, headers);
        
        if (newAddress)
        {
            await setaccount.toDB(coin.name, account, newAddress, Date.now());
            return res.end(newAddress);
        }
            
        return res.end("");

    }
    catch(e)
    {
        utils.postString(coin.hostname, {'nPort' : coin.port, 'name' : "http"}, "/", headers, post_data, async result => {
            console.log(result.data);
            
            res.end(result.data || "");
        });
    }

}

exports.fromDB = function(coinName, account)
{
    return new Promise((async ok => {
        if (coinName == escape("US dollar"))
            return ok(null);
            
        const rows = await g_constants.dbTables["addresses"].Select2("*", "coin='"+escape(coinName)+"' AND account='"+escape(account)+"'");
        
        if (!rows || !rows.length)
            return ok(null);
        
        return ok(rows[0].address);
    }));
}

