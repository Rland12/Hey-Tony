const express = require('express')
const app = express()

const bodyParser =  require('body-parser')

app.use(bodyParser.json())

const axios = require('axios')

const store =  require('./store')
const Store = new store('/board') 
const SMS = require('./SMS.js')

const url = 'https://data.cityofnewyork.us/resource/fhrw-4uyv.json'


async function fetchOpenData(cat, region, compliantType) {
    const { data } = await axios.get(url)

    const collection = await data.map(i => Object.assign({}, {
        title: i.complaint_type,
        "unique-id": i.unique_key || '',
        created: i.created_date || '',
        closed: i.due_date ? i.due_date : false,
        updated: i.resolution_action_updated_date || '',
        "complaint-type": [i.complaint_type, i.location_type, i.address_type].filter(i => ![undefined, null, false].includes(i)),
        agency: {
            name: i.agency_name || '',
            abrv: i.agency || '',
        },
        "description-compliant": i.descriptor || '',
        "description-resolution": i.resolution_description || '',
        thread: [],
        subscribers: [],
        location: {
            lat: i.latitude || '',
            lng: i.longitude || '',
            city: i.city || '',
            borough: i.borough || '',
            address: i.incident_address || '',
            "street-name": i.street_name || '',
            "street-coordinates": [i.cross_street_1, i.cross_street_2].filter(i => ![undefined, null, false].includes(i)),
            status: i.status || '',
            board: i.community_board || ''
        }
    }))

    return await collection
}

app.get('/', (req, res) => {
    
    async function fetch_and_save() {
        const collections = await fetchOpenData()
        collections.forEach(async i => {
            const title = i.title.split('-').join(' ').split(' ').join('-')
            const db_path = `${i.location.borough}/${title}/${i['unique-id']}`

            i.db_path = db_path

            await Store.set(`${i.location.borough}/${title}/${i['unique-id']}`, i)
        })
        return collections
    }

    fetch_and_save()
        .then(data => res.json(data))
        .catch(err => res.json(err))
})

app.post('/subscribe', (req, res) => {
    const { title, db_path, number } = req.body

    SMS.subscribe({
        title,
    }, db_path, [ number ])
        .then(res => console.log(res))
        .catch(err => console.log(err))
})


app.post('/create-thread', (req, res) => {
    const { db_path, body } = req.body
    
    async function createThread(db_path, content) {
        await Store.set(`${db_path}/threads`, [ content ])
        const thread = Object.values( await Store.getCollection(`${db_path}/threads`) )
        await SMS.sendMessage({
            thread_id: thread.length,
            title: thread.slice(-1).title,
            db_path,
        }, content)
    }

    createThread(db_path, body).then(() => res.json({ message: 'created new thread' })).catch(err => console.log(err))
})

app.listen(8080, () => console.log('Server is running on PORT 8080'))