// HTTP request module
const axios = require('axios')

// the firebase API wrapper
const store = require('./store')
const Store = new store('/board') 

module.exports = () => {

    // region, compliantType
    async function fetchOpenData() {
        const { data } = await axios.get('https://data.cityofnewyork.us/resource/fhrw-4uyv.json')
        
        const collection = await data.map(i => Object.assign({}, {
            title: i.complaint_type,
            uniqueKey: i.unique_key || '',
            created: i.created_date || '',
            closed: i.due_date ? i.due_date : false,
            updated: i.resolution_action_updated_date || '',
            "complaint-type": [
                i.complaint_type, i.location_type, i.address_type
            ].filter(i => ![undefined, null, false].includes(i)),
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
                "street-coordinates": [
                    i.cross_street_1, i.cross_street_2
                ].filter(i => ![undefined, null, false].includes(i)),
                status: i.status || '',
                communityBoardId: i.community_board || ''
            }
        }))

        return await collection
    }

    async function fetchAndSave() {
        const collection = await fetchOpenData()
        const currentBoardData = await Store.getCollection('/')

        const newBoardData = {}
        collection.forEach(async i => {
            /*
                Creating dashes between the words the title there is a issue
                firebase makes a branc on each word in the title.
                
                ex: 'hello-world are you there' => 'hello-world-are-you-there'
            */
            const title = i.title.split('-').map(i => i.indexOf(' ') !== -1 ? i.split(' ').join('-') : i).join('-')
            // This creates a firebase database path to use on the front end of the application
            // this is great for targeting specfic threads/resolutions
            i.dbPath = `${i.location.borough}/${title}/${i['unique-id']}`

            newBoardData[i.dbPath] = i
        })

        // this stores the data into the firebase database
        await Store.set('/', Object.assign(currentBoardData || {}, newBoardData))
        return await true
    }

    return fetchAndSave()
}