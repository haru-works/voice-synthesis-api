'use strict'

const pm2 = require('pm2');
const schedule = require('node-schedule');

const restart = () => {
    const apps = ['voice-synthesis-api', 'voicevox_eng_1_0.25.1'];

    apps.forEach((appName) => {
        pm2.restart(appName, errback => {
            if(errback === null){
                console.log(`[${new Date().toLocaleString('ja-JP')}] ${appName} restarted`);
            }else{
                console.log(`[${new Date().toLocaleString('ja-JP')}] Error restarting ${appName}: ${errback}`);
            }
        });
    });
}

// 毎日12:00に再起動
schedule.scheduleJob('0 12 * * *', () => {
    console.log(`[${new Date().toLocaleString('ja-JP')}] Starting scheduled restart...`);
    restart();
});