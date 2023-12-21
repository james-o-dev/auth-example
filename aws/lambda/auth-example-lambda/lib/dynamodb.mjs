import { randomUUID } from 'crypto'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DeleteCommand, GetCommand, PutCommand, DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

// DynamoDB client.
const dynamoDBClient = new DynamoDBClient({})
// DynamoDB document client.
const docClient = DynamoDBDocumentClient.from(dynamoDBClient)

/**
 * Given an object, returns the first key/value pair, as an array.
 * * First element is the key; Second element is the value
 *
 * @param {*} objectValue
 */
const getObjectFirstKeyValue = (objectValue) => {
  const key = Object.keys(objectValue)[0]
  const value = objectValue[key]
  return [key, value]
}

/**
 * Execute a put command on the DynamoDB table, to insert a new item(/document/row/etc).
 * * It will generate a UUID for the partition key automatically, if it was not provided.
 *
 * @param {string} tableName
 * @param {*} partitionKey Take an object with a single property; The key is the partition key and the value is the value of the partition key.
 * * Leave the value empty to generate a UUID for it by default
 * @param {*} body Other values to insert into the item
 */
export const putCommand = async (tableName, partitionKey, body) => {
  const [partitionKeyName, partitionKeyValue] = getObjectFirstKeyValue(partitionKey)
  const partitionKeyValueToUse = partitionKeyValue || randomUUID()

  const newPutCommand = new PutCommand({
    TableName: tableName,
    Item: {
      ...body,
      [partitionKeyName]: partitionKeyValueToUse,
    }
  })

  const result = await docClient.send(newPutCommand)
  return {
    ...result,
    [partitionKeyName]: partitionKeyValueToUse,
  }
}

/**
 * Execute a get command on the DynamoDB table to get an existing item, via its partition key
 *
 * @param {string} tableName
 * @param {*} partitionKey Take an object with a single property; The key is the partition key and the value is the value of the partition key.
 */
export const getCommand = async (tableName, partitionKey) => {
  const [partitionKeyName, partitionKeyValue] = getObjectFirstKeyValue(partitionKey)

  const newGetCommand = new GetCommand({
    TableName: tableName,
    Key: {
      [partitionKeyName]: partitionKeyValue,
    }
  })

  return docClient.send(newGetCommand)
}

/**
 * Execute a scan command on the DynamoDB table
 * * TODO: additional parameters for filtering
 *
 * @param {string} tableName
 */
export const scanCommand = async (tableName) => {
  const newScanCommand = new ScanCommand({
    TableName: tableName,
  })
  return docClient.send(newScanCommand)
}

/**
 * Execute a delete command on the DynamoDB table to delete an existing item, via its partition key
 *
 * @param {string} tableName
 * @param {*} partitionKey Take an object with a single property; The key is the partition key and the value is the value of the partition key.
 */
export const deleteCommand = async (tableName, partitionKey) => {
  const [partitionKeyName, partitionKeyValue] = getObjectFirstKeyValue(partitionKey)

  const newDeleteCommand = new DeleteCommand({
    TableName: tableName,
    Key: {
      [partitionKeyName]: partitionKeyValue,
    }
  })

  return docClient.send(newDeleteCommand)
}

/**
 * Execute an update command on the DynamoDB table to update/patch a single value of an existing item, via its partition key
 * * It will throw an error 'ConditionalCheckFailedException' if the item was not found
 *
 * @param {string} tableName
 * @param {*} partitionKey Take an object with a single property; The key is the partition key and the value is the value of the partition key.
 * @param {*} updateValue Take an object with a single property; The key is the field name and the value is the value of the field to update.
 */
export const updateCommand = async (tableName, partitionKey, updateValue) => {
  const [partitionKeyName, partitionKeyValue] = getObjectFirstKeyValue(partitionKey)
  const [field, value] = getObjectFirstKeyValue(updateValue)

  const newUpdateCommand = new UpdateCommand({
    TableName: tableName,
    Key: {
      [partitionKeyName]: partitionKeyValue,
    },
    UpdateExpression: `set ${field} = :value`,
    ConditionExpression: `attribute_exists(${partitionKeyName})`, // Only update, do not create. @see https://stackoverflow.com/a/41874889
    ExpressionAttributeValues: {
      ":value": value,
    },
    ReturnValues: "UPDATED_NEW",
  })
  return docClient.send(newUpdateCommand)
}