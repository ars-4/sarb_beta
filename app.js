const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');


// const mongoose = require('mongodb');
// const connection_string = "mongodb://127.0.0.1:27017"
// const client = new mongoose.MongoClient(connection_string, { useNewUrlParser: true, useUnifiedTopology: true });
// const db = client.db("sarb");
// const collection = db.collection("knowledge");

const db = require("@cyclic.sh/dynamodb")



// Credentials
// process.env.AWS_REGION = "ap-northeast-1"
// process.env.AWS_ACCESS_KEY_ID = "ASIAXIZO7E57DZVSZVUB"
// process.env.AWS_SECRET_ACCESS_KEY = "XyzJ5lcbrsvBndFBC6U0D9VTQOi0P4+usooxbUq+"
// process.env.AWS_SESSION_TOKEN = "IQoJb3JpZ2luX2VjEEkaCmFwLXNvdXRoLTEiRjBEAiBsF5+aeSoUMUyX2ReWOUXaOzVLFVdNcU2VqnpJwNhIMwIgS74AZDZ5nM/JzgtQJlQUvlKOiLtZw/yVxdo/kYbSmXcqtgII8///////////ARAAGgw0OTk5MjUzMjk3OTAiDBe/xFaWZ+lm78MlpSqKAgRESgDBCC1WXM2kRJyiss/tr5VYOpjc5Hrdl8KKfyEiUAw2ai32XNv0qMPAiAsmM2CWqTyiEd5rbkc4mu2UX4IJBTug2ReVJTmpbawqEfhfdr8+hsf28bvxdwhmvacBs3Fam2ZZM6u3PAm2Bd6q9R7tj3fJjNj97bcj5wdYv6Hxs9xyNmbHmMX4iWwBDIIfW1kZVha8KJzhEOWs1g9ZszdyGeJdpcBLZGgXHpmvxPoY+jfW0L0b2qvkuL0b/eBPsLU7OhFx3sTRZCz1QrmE/9kSjBpEWOB+hizayrl6xfGyV8YnMG7oiwbHNimkSS/GBaVaLTr1pYrqfJw5Sx173x6uS1ztp2dMU+kfMN6ik6AGOp4BqtAHhvMCySQ5p/IZByYu8cofMjAvQ31PYYijqUSnFtjVTO9IyQN8mlHSZQDyK2HEIVkoq9KVfp3YSMc6lMI4PgdBPIIZfNpy60syg54apku0qFP7Q+DaLF0eYpMwBRttJYfgIe0IRMY0P+P797hklzLHuE32IBGaUwl6HCnoBT6S35Ji0HaPNKpDb7fUkghzQ4GlRDZxQKeM9Eb4ofg="


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());



app.get("/", (req, res) => {
    res.send(`
    <h1>Welcome</h1>
    <form method="post" action="/replyme">
    <input type="text" name="sentence">
    <button>Send</button>
    </form>
    `);
    res.end();
})
app.post("/replyme", async (req, res) => {
    let sentence = req.body['sentence'];
    let reply = await get_reply(sentence);
    res.send({
        "error": "false",
        "data": reply
    });
    res.end();
});

let port = 3000;
app.listen(port, () => {
    console.log(`Listening at port ${port}`)
})



async function search_wiki(question) {
    let origin_q = question;
    if (question.includes("what is") || question.includes("what is") && question.includes("?") || question.includes("define")) {
        question = question.replace("what is", "").replace("?", "").replace("define", "").trim();
    }
    console.log(question)
    let url = `https://en.wikipedia.org/api/rest_v1/page/summary/${question}?redirect=true`;
    let response = await axios.get(url);
    let data = response.data;
    if (data['extract']) {
        let knowledge = {
            keywords: origin_q.split(" ").join(" & ").replace("?", ""),
            response: data['extract']
        };
        await add_knowledge(knowledge);
        return data['extract'];
    }
    else {
        return "Sorry, I don't know that";
    }
}

async function add_knowledge(knowledge) {
    // await client.connect();
    await db.collection("Knowledge").set(knowledge);
}


async function read_knowledge() {
    let replies = [];
    // await client.connect();
    // const cursor = collection.find();
    // const rows = await cursor.toArray();
    const rows = await db.collection("Knowledge").list()

    for (let i = 0; i < rows.length; i++) {
        let command = {};
        command.keywords = [];
        command.reply = "";
        rows[i]['keywords'].split(' & ').forEach((element) => {
            command['keywords'].push(element.toLowerCase());
            command['reply'] = rows[i]['response'];
        });
        replies.push(command);
    }
    return replies;

}

async function get_reply(question) {
    const replies = await read_knowledge();
    let reply = "Starter reply";
    question = question.toLowerCase();
    for (let i = 0; i < replies.length; i++) {
        if (question.includes(replies[i].keywords[0])) {
            for (let j = 0; j < replies[i].keywords.length; j++) {
                if (question.includes(replies[i].keywords[j])) {
                    reply = replies[i].reply;
                }
                else {
                    reply = null
                }
            }
        }
        else {
            reply = null
        }
    }
    if (reply == null) {
        reply = await search_wiki(question);
    }
    return reply;
}


