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
        question = question.replace("what is", "").replace("?", "").replace("define", "").replace("of ", "").replace("the ", "").replace("a ", "").replace("an ", "").trim();
        if(question.includes(" ")) {
            question = question.split(" ").join("_");
        }
        console.log(`Searching wikipedia for ${question}`);
        let url = `https://en.wikipedia.org/api/rest_v1/page/summary/${question}?redirect=true`;
        let response = await axios.get(url);
        let data = response.data;
        if (data['extract']) {
            let knowledge = {
                keywords: origin_q.split(" ").join(" & ").replace("?", ""),
                response: data['extract']
            };
            await add_knowledge(knowledge);
            console.log(`Added ${knowledge.keywords} to knowledge`);
            return data['extract'];
        }
        else {
            return "Sorry, I don't know that";
        }
    }
    else {
        return "Sorry, I don't know that";
    }
}

async function _id() {
    let rows = await db.collection("Knowledge").list();
    rows = rows['results'];
    let id = rows.length;
    return id;
}

async function add_knowledge(knowledge) {
    // await client.connect();
    let id = await _id();
    await db.collection("Knowledge").set(id.toString(), { knowledge });
}

async function get_list() {
    let rows = await db.collection("Knowledge").list();
    rows = rows['results'];
    let list = [];
    for (let i = 0; i < rows.length; i++) {
        let dt = await db.collection("Knowledge").get(rows[i]['key']);
        list.push(dt['props']['knowledge']);
    }
    return list;
}

async function read_knowledge() {
    let replies = [];
    // await client.connect();
    // const cursor = collection.find();
    // const rows = await cursor.toArray();
    const rows = await get_list();

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
            break;
        }
        else {
            reply = null
        }
    }
    if (reply === null) {
        reply = await search_wiki(question);
    }
    else {
        return reply;
    }
    return reply;
}


