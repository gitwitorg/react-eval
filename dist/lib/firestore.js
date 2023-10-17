"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpecificAppErrorEntry = exports.saveErrorInfo = void 0;
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
// Initialise env variables
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
// Approach that uses a json. Not good in production:
// const serviceAccount = require('../credentials/firestore-credentials.json');
// Approach that uses env variables. Can be good enough in production but not great on VMs. Need to ssh and export the env variables to ~/.bashrc or ~/.profile.
// TODO Use smth like AWS EC2 Parameter Store and the AWS SDK to make it fully production ready.
const serviceAccount = JSON.parse(process.env.FIRESTORE_CREDENTIALS);
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();
async function saveErrorInfo(errorData) {
    const docRef = db.collection('appErrors').doc(errorData.projectID);
    try {
        await docRef.set({
            errors: errorData.errors,
            prompt: errorData.prompt,
            appDotJs: errorData.appDotJs,
            packageDotJson: errorData.packageDotJson,
        });
    }
    catch (error) {
        throw new Error(`Unable to save react app error info to DB: ${error}`);
    }
}
exports.saveErrorInfo = saveErrorInfo;
async function getSpecificAppErrorEntry(uuid) {
    const docRef = db.collection('appErrors').doc(uuid);
    try {
        const docSnapshot = await docRef.get(uuid);
        return docSnapshot.exists ? docSnapshot.data() : null;
    }
    catch (error) {
        throw new Error(`Unable to retrieve data for doc ${uuid}: ${error}`);
    }
}
exports.getSpecificAppErrorEntry = getSpecificAppErrorEntry;
