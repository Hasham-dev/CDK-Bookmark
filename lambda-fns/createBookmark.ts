
// lambda-fns/createNote.ts
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
type Bookmark = {
    id: String
    name: String
    url: String
}
async function createBookmark(bookmark: Bookmark) {
    const params = {
        TableName: process.env.NOTES_TABLE,
        Item: bookmark
    }
    try {
        await docClient.put(params).promise();
        return bookmark;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createBookmark;