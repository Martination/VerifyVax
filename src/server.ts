// ----------------------------------------------------------------------
// Simple test server for SMART Health Card operations
// ----------------------------------------------------------------------

import express from 'express';
import { Config } from './config';
import http from 'http';
import got from 'got';
import { validate, ValidationProfiles } from 'health-cards-validation-sdk/js/src/api';
import * as issuer from './issuer';


const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.static('./public')); // issuer public key set


validate.profile = ValidationProfiles.any;

app.post(Config.VALIDATE_FHIR_BUNDLE, async (req, res) => {
    console.log('Received POST for', Config.VALIDATE_FHIR_BUNDLE);
    const fhir = req.body.data;
    validate.profile = ValidationProfiles[fhir.profile || 'any'];
    const errors = await validate.fhirbundle(fhir.data);
    validate.profile = ValidationProfiles.any;
    res.type('json');
    res.send({ success: errors.length === 0, errors: errors });
});


app.post(Config.VALIDATE_QR_NUMERIC, async (req, res) => {
    console.log('Received POST for', Config.VALIDATE_QR_NUMERIC);
    const shc = req.body.data;
    const errors = await validate.qrnumeric(shc);
    res.type('json');
    res.send({ success: errors.length === 0, errors: errors });
});


app.post(Config.VALIDATE_PAYLOAD, async (req, res) => {
    console.log('Received POST for', Config.VALIDATE_PAYLOAD);
    const payload = req.body.data;
    const errors = await validate.jwspayload(payload);
    res.type('json');
    res.send({ success: errors.length === 0, errors: errors });
});


app.post(Config.VALIDATE_KEYSET, async (req, res) => {
    console.log('Received POST for', Config.VALIDATE_KEYSET);
    const keyset = req.body.data;
    const errors = await validate.keyset(keyset);
    res.type('json');
    res.send({ success: errors.length === 0, errors: errors });
});


app.post(Config.INFLATE_PAYLOAD, async (req, res) => {
    console.log('Received POST for', Config.INFLATE_PAYLOAD);
    const payload = JSON.stringify(req.body.payload);
    const result = issuer.inflate(payload);
    res.send(result);
});


app.post(Config.DOWNLOAD_PUBLIC_KEY, async (req, res) => {

    console.log('Received POST for', Config.DOWNLOAD_PUBLIC_KEY);

    const publicKeyUrl = req.body.keyUrl;

    let result: { keySet: string, error: string[] } = { keySet: "", error: [] };
    let response;

    try {
        response = await got(publicKeyUrl, { https: { rejectUnauthorized: false } });
    } catch (err) {
        result.error = ["Can't download issuer key from : " + publicKeyUrl + " : " + err];
        res.send(result);
        return;
    }

    try {
        result.keySet = JSON.parse(response.body);
    } catch (err) {
        result.error = ["Can't parse key set as JSON : " + response.body + " : " + err];
        res.send(result);
        return;
    }

    res.send(result);
});


http.createServer(app).listen(Config.SERVICE_PORT, () => {
    const url = Config.SERVER_BASE;
    console.log("Service listening at " + url);
});
