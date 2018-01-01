const firebase = require('firebase')

firebase.initializeApp({
    apiKey: "AIzaSyAYy-0Z5P-9_Vx1hnlzjhZkfNJPamBBizA",
    authDomain: "borough-board.firebaseapp.com",
    databaseURL: "https://borough-board.firebaseio.com",
    projectId: "borough-board",
    storageBucket: "",
    messagingSenderId: "359046300703"
})


class store {
    constructor(main_db_path) {

        this.main_db_path = main_db_path
    }

    set(db_path, data) {
        if (Array.isArray(data)) {
            return firebase.database().ref(`${this.main_db_path}/${db_path}`).push(data)
        } else {
            return firebase.database().ref(`${this.main_db_path}/${db_path}/`).set(data)
        }
    }

    getCollection(db_path) {
        return new Promise(resolve => {
            firebase.database().ref(`${this.main_db_path}/${db_path}`).on('value', collection => {
                collection = collection.val()
                return resolve(collection)
            })
        })
    }

}

module.exports = store