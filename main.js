const { join } = require('path')

const express = require('express')
const app = express()

// JSON body serializer
const bodyParser =  require('body-parser')

// the firebase API wrapper
const store =  require('./src/store')
const Store = new store('/board') 

// the SMS API wrapper
const SMS = require('./src/SMS.js')

const createBoard = require('./src/createBoard.js')

app.use(bodyParser.json())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(join(__dirname, 'Public')))

app.get('/error', (req, resp) => {
    resp.json({
        errorMessage: 'Something went wrong. Internal server error',
        status: false
    })
})

app.get('/', (req, resp) => {

    return createBoard()
        .then(() => {
            console.log('data sent')
            resp.sendFile(join(__dirname, '../app', 'index.html'))
        })
        .catch(err => {
            console.log(err)
            return resp.redirect('/error')
        })
    
})

app.post('/subscribe', (req, res) => {
    const { title, threadUniqueId, db_path, number } = req.body

    SMS.subscribe({
        title,
        threadUninqueId,
        db_path
    }, Array.isArray(number) ? number : [ number ])
        .then(res => res.json(res))
        .catch(err => res.json(err))
})


app.post('/create-thread', (req, res) => {
    const { db_path, body } = req.body
    
    async function createThread(db_path, content) {
        await Store.set(`${db_path}/threads`, [ content ])
        
        const thread = Object.values( await Store.getCollection(`${db_path}/threads`) )
        await SMS.sendMessage({
            threadId: thread.length,
            title: thread.slice(-1).title,
            db_path,
        }, content)
    }

    createThread(db_path, body)
        .then(threadMessageId => res.json({ message: 'created new thread', threadMessageId, }))
        .catch(err => console.log(err))
})

app.listen(8080, () => console.log('Server is running on PORT 8080'))