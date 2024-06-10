import fetch from 'node-fetch';
import { FormData, File } from 'formdata-node';

const blobToFile = (theBlob, fileName) => {
    theBlob.lastModifiedDate = new Date();
    theBlob.name = fileName;
    return theBlob;
}

const graphqlUrl = "https://api.bettermode.com";
const accessToken = "YOUR_ACCESS_TOKEN";

const uploadFromUrl = async (fileUrl, fileName) => {
    const remoteFileResponse = await fetch(fileUrl);
    const blob = await remoteFileResponse.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

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

uploadFromUrl('https://drive.google.com/drive/folders/1Cq5uia8dYFdKZ22BVDywzCu4cKWB0Uu0', 'jacob-test1.png');



