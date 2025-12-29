
import fs from 'node:fs';
import path from 'node:path';

const API_URL = "http://192.168.1.14:8001/ocr";
const IMAGE_PATH = "tests/e2e/fixtures/sample.jpg";

async function testOcr() {
    try {
        const filePath = path.resolve(process.cwd(), IMAGE_PATH);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
        }

        console.log(`Reading file from ${filePath}`);
        const fileBuffer = fs.readFileSync(filePath);

        // Node.js v18+ supports global Blob and FormData
        const blob = new Blob([fileBuffer], { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', blob, 'sample.jpg');
        formData.append('prompt_type', 'document');

        console.log(`Sending POST request to ${API_URL}...`);
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);

        const responseText = await response.text();
        try {
            const json = JSON.parse(responseText);
            console.log('Response Body (JSON):', JSON.stringify(json, null, 2));
        } catch {
            console.log('Response Body (Text):', responseText);
        }

    } catch (error) {
        console.error('Error occurred:', error);
    }
}

testOcr();
