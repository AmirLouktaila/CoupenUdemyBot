const { Telegraf, Markup } = require('telegraf');
const botToken = process.env.token;
const bot = new Telegraf(botToken);
const sharp = require('sharp');
const axios = require('axios');
const express = require('express');
const app = express();
app.use(express.json());
app.use(bot.webhookCallback('/bot'))

app.get('/', (req, res) => { res.sendStatus(200) });

app.get('/ping', (req, res) => { res.status(200).json({ message: 'Ping successful' }); });

function keepAppRunning() {
    setInterval(() => {
        https.get(`${process.env.RENDER_EXTERNAL_URL}/ping`, (resp) => {
            if (resp.statusCode === 200) {
                console.log('Ping successful');
            } else {
                console.error('Ping failed');
            }
        });
    }, 5 * 60 * 1000);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SB_URL, process.env.SB_KEY, { auth: { persistSession: false } });
async function createUser(user) {
    const { data, error } = await supabase
        .from('users')
        .insert([user]);

    if (error) {
        throw new Error('Error creating user : ', error);
    } else {
        return data
    }
};

async function updateUser(id, update) {
    const { data, error } = await supabase
        .from('users')
        .update(update)
        .eq('id', id);

    if (error) {
        throw new Error('Error updating user : ', error);
    } else {
        return data
    }
};

async function userDb(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);

    if (error) {
        console.error('Error checking user:', error);
    } else {
        return data
    }
};

//*********************/

async function downloadImage(url) {
    const response = await axios({
        url,
        responseType: 'arraybuffer'
    });
    return Buffer.from(response.data, 'binary');
}

async function blurImage(buffer, blurAmount = 20) {
    return await sharp(buffer)
        .blur(blurAmount)
        .toBuffer();
}


function apiUdemyC() {
    const url = "https://www.real.discount/api-web/all-courses/?store=Udemy&page=1&per_page=10&orderby=undefined&free=0&search=&language=&cat=";

    const headers = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Cookie': 'sidenav-state=pinned; _hjSessionUser_3845977=eyJpZCI6ImUwYmMxM2YzLTM2YWYtNTI2Yy05YjM2LTdjODI5NzcyZmFjYyIsImNyZWF0ZWQiOjE3MTcwMjEyNTcyNDcsImV4aXN0aW5nIjp0cnVlfQ==; _hjSession_3845977=eyJpZCI6ImI0OWJjODcwLTE0OGEtNDg3MS1iODAxLWNlMDUzZGNkOGU0NSIsImMiOjE3MTcwMjEyNTcyNDcsInMiOjEsInIiOjEsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjoxLCJzcCI6MH0=; _gid=GA1.2.2073666968.1717021258; session=.eJwNyDEOgCAMAMC_dHYpRRA-Q6q0MVHRAE7Gv-uN90DSKm2FqLw3GSBdUg8uUjrEXu9_llY19XOTAhGYJBAG79CNmYwVojwb4xmDOjMpIopFYng_Vw8b0Q.ZlevTg.40S8sf6JXKZj08GG9INtDb_ajrY; _ga_RQMJ6WTW77=GS1.1.1717021257.1.1.1717022543.53.0.0; _ga=GA1.2.716260861.1717021257; _gat_UA-9827766-8=1',
        'Host': 'www.real.discount',
        'Referer': 'https://www.real.discount/udemy-coupon-code/',
        'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
    };



    let i = 0;

    const interval = setInterval(() => {
        axios.get(url, { headers })
            .then(response => {
                const data = response.data;

                let retanow;
                const count = data.count;
                const results = data.results[0];
                if (results.rating != "0E-7") {
                    retanow = results.rating.total.toFixed(2);
                } else {
                    retanow = "0"
                }
                const details = `
📚 *Course Details* 📚

🔹 *Name:* ${results.name}

💰 *Price:* Free
🏷️ *Category:* ${results.category}
🌐 *Language:* ${results.language}
⭐ *Rating:* ${retanow}
⏱️ *Lectures:* ${results.lectures}hr
🛒 *Store:* ${results.store}
👨‍🎓 *Students:* ${results.students}
👀 *Views:* ${results.views}
`;

                const imageUrl = results.image;


                (async () => {
                    try {
                        const replyMarkup = await {
                            inline_keyboard: [

                                [{ text: 'Enroll Now', url: results.url }],

                            ],
                        };
                        const user = await userDb(1);
                        const imageBuffer = await downloadImage(imageUrl);
                        const blurredImageBuffer = await blurImage(imageBuffer);
                        const newName = results.name;

                        if (newName != user[0].name) {
                            bot.telegram.sendPhoto('@lktudemy', { source: blurredImageBuffer }, { caption: details, reply_markup: replyMarkup });
                            updateUser(1, { name: results.name })
                                .then((data, error) => {

                                });
                        } else {
                            console.log('Not new');
                        }




                    } catch (error) {
                        console.error('An error occurred:', error);
                    }
                })();


            })
            .catch(error => {
                console.error('An error occurred:', error);
            });

        i++;

        // if (i === 2) {
        //     clearInterval(interval);
        // }
    }, 20000);

}




app.listen(3000, () => {
    bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/bot`)
        .then(() => {
            console.log('Webhook Set ✅ & Server is running on port 3000 💻');
            keepAppRunning();
            apiUdemyC()
        });
});
