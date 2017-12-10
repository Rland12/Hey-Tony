const dotenv = require('dotenv')
dotenv.load()

const messageBird = require('messagebird')(process.env.message_bird_key)

const store = require('./store')

class SMS {
    constructor() {
        this.message_bird_URI = 'https://rest.messagebird.com'
        this.store = new store('/board')
    }
    
    sendMessage(thread, content) {

        async function _sendMessage({ title, thread_id, db_path }, content) {
            const collection = await this.store.getCollection(db_path)
            const { subscribers } = await collection

            const params = {
                'originator': 'MessageBird',
                'recipients': await subscribers,
                'body': `There is new compliant posted for ${title} issue ${thread_id} check it out check it out.`
            };

            messageBird.messages.create(params, async (err, response) => {
                if (err) return new Error(err);

                return await this.store.set(`${id}/${thread_id}/messageId`, response.id)
            });
        }

        return new Promise((resolve, reejct) => {

            _sendMessage.call(this, thread, content)
                .then(resp => resolve(resp))
                .catch(err => reject(err))
        })
    }

    subscribe({ title, thread_id }, db_path, number) {
        return new Promise(resolve => {

            return this.store.set(`${db_path}/subscribers`, [ number ])
                .then(() => {
                    const params = {
                        'originator': 'MessageBird',
                        'recipients': number,
                        'body': `Thank you for subscribing for to borough board,
                        you are now subscribed to thread ${title} issue ${db_path.split('/').slice(-1)}.
                        Here is link to the thread to foloow more details in your community.`
                    };

                    messageBird.messages.create(params, (err, response) => {
                        if (err) console.log( new Error(err) );

                        return resolve(response.id)
                    });
                })
                .catch(err => console.log(err))
        })
    }

}

module.exports = new SMS()