'use strict'

const pm2 = require('pm2');
const schedule = require('node-schedule');

const restart = () => {
    pm2.restart('voice-synthesis-api', errback => {
        if(errback === null){
            console.log(`[${new Date().toLocaleString('ja-JP')}] voice-synthesis-api restarted`);
        }else{
            console.log(`[${new Date().toLocaleString('ja-JP')}] Error: ${errback}`);
        }
    });
}

// 毎日12:00に再起動
schedule.scheduleJob('0 12 * * *', () => {
    console.log(`[${new Date().toLocaleString('ja-JP')}] Starting scheduled restart...`);
    restart();
});