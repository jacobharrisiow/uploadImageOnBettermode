import fetch from 'node-fetch';
import { FormData, File } from 'formdata-node';
import fs from 'fs';
import path from 'path';

const graphqlUrl = "https://api.bettermode.com";
const accessToken = "YOUR_ACCESS_TOKEN";

const uploadFromLocalFile = async (filePath) => {
    const fileName = path.basename(filePath);
    const buffer = fs.readFileSync(filePath);

    const urlsResponse = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            query: `
            mutation {
                createImages(input: [{contentType: "image/png"}]) {
                    signedUrl
                    mediaId
                    fields
                    urls {
                        full
                        large
                        medium,
                        small,
                        thumb
                    }
                }
            }
            `
        })
    });

    const { data: { createImages: signedUrls } } = await urlsResponse.json();
    const signedUrl = signedUrls[0];

    const form = new FormData();
    const fields = JSON.parse(signedUrl.fields);
    for (const [key, value] of Object.entries(fields)) {
        form.append(key, String(value));
    }

    form.append('Content-Type', 'image/png');
    form.append('file', new File([buffer], fileName));

    const s3Result = await fetch(signedUrl.signedUrl, {
        method: 'POST',
        body: form
    });

    if (s3Result.status === 204) {
        console.log(`\nThe media ID is [use this for post attachments]: ${signedUrl.mediaId}`);
        console.log('Here are the links to your asset:');
        console.table(signedUrl.urls);
    }
}

// Replace the path with the path to your local file
uploadFromLocalFile('');
