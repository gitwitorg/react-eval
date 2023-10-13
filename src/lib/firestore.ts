import { v4 as uuidv4 } from 'uuid';
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

// Initialise env variables
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Approach that uses a json. Not good in production.
// const serviceAccount = require('../credentials/firestore-credentials.json');
// Approach that uses env variables. Can be good enough in production but not great on VMs. Need to ssh and export the env variables to ~/.bashrc or ~/.profile.
// TODO Use smth like AWS EC2 Parameter Store and the AWS SDK to make it fully production ready.
const serviceAccount = JSON.parse(process.env.FIRESTORE_CREDENTIALS!);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();


type ErrorData = {
    prompt: string;
    error: Array<string>;
    appDotJs: string;
    packageDotJson: string;
}

export async function saveErrorInfo(errorData: ErrorData): Promise<void> {
    const docRef = db.collection('appErrors').doc(uuidv4());

    try {
        await docRef.set({
            error: errorData.error,
            prompt: errorData.prompt,
            appDotJs: errorData.appDotJs,
            packageDotJson: errorData.packageDotJson
        });
    } catch (error: any) {
        throw new Error(`Unable to save react app error info to DB: ${error}`)
    }
}

export async function getSpecificAppErrorEntry(uuid: string): Promise<ErrorData | null> {
    const docRef = db.collection('appErrors').doc(uuid);

    try {
        const docSnapshot = await docRef.get(uuid);

        return docSnapshot.exists ? docSnapshot.data() : null;
    } catch (error: any) {
        throw new Error(`Unable to retrieve data for doc ${uuid}: ${error}`)
    }
}
