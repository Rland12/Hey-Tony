const firebase = require('firebase')

const dotenv = require('dotenv')
dotenv.load()

firebase.initializeApp({
    apiKey: "AIzaSyCf8vSpeSU6HBmvVi5wSVilATJnKlWbXgM",
    authDomain: "heytony-188521.firebaseapp.com",
    databaseURL: "https://heytony-188521.firebaseio.com",
    projectId: "heytony-188521",
    storageBucket: "heytony-188521.appspot.com",
    messagingSenderId: "1063533574405"
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