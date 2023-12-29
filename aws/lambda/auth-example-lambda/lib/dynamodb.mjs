import { randomUUID } from 'crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DeleteCommand, GetCommand, PutCommand, DynamoDBDocumentClient, ScanCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

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
 * Execute an update command on the DynamoDB table to update/patch values of an existing record, via its partition key
 * * It will throw an error 'ConditionalCheckFailedException' if the item was not found (it only updats, it does not create)
 *
 * @param {string} tableName
 * @param {*} partitionKey Take an object with a single property; The key is the partition key and the value is the value of the partition key.
 * @param {*} updateValues Take an object with properties; The keys are the field names and the values are the values of the field to update.
 */
export const updateCommand = async (tableName, partitionKey, updateValues) => {
  const [partitionKeyName, partitionKeyValue] = getObjectFirstKeyValue(partitionKey)

  const updateExpression = []
  const expressionAttributeNames = {}
  const expressionAttributeValues = {}

  // Build the update expression and attribute values
  Object.keys(updateValues).forEach((key, index) => {
    const attributeName = `#attr${index}`
    const attributeValue = `:value${index}`

    updateExpression.push(`${attributeName} = ${attributeValue}`)
    expressionAttributeNames[attributeName] = key
    expressionAttributeValues[attributeValue] = updateValues[key]
  })

  const newUpdateCommand = new UpdateCommand({
    TableName: tableName,
    Key: {
      [partitionKeyName]: partitionKeyValue,
    },
    UpdateExpression: `set ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: `attribute_exists(${partitionKeyName})`, // Only update, do not create. @see https://stackoverflow.com/a/41874889
    ReturnValues: 'UPDATED_NEW',
  })
  return docClient.send(newUpdateCommand)
}

/**
 * Executes a query command on a specified table using the provided query options.
 *
 * @param {string} tableName - The name of the table to execute the query on.
 * @param {QueryOptions} queryOptions - The options for the query. See {@link queryCommandBuilder} for details.
 */
export const queryCommand = async (tableName, queryOptions) => {
  const queryParams = queryCommandBuilder(queryOptions)

  const newQueryCommand = new QueryCommand({
    TableName: tableName,
    ...queryParams
  })

  return docClient.send(newQueryCommand)
}

/**
 * Represents options for a query.
 *
 * @typedef {Object} QueryOptions
 * @property {string} indexName - The name of the index.
 * @property {Object} attributeValues - The attribute values for the query.
 *   You can add more attributes as needed.
 */

/**
 * Builds a query command based on the provided query options.
 *
 * @param {QueryOptions} queryOptions - The options for the query.
 *
 * @returns {Object} The query command with the following properties:
 *   - IndexName: The name of the index.
 *   - KeyConditionExpression: The key condition expression for the query.
 *   - ExpressionAttributeNames: The expression attribute names for the query.
 *   - ExpressionAttributeValues: The expression attribute values for the query.
 */
const queryCommandBuilder = (queryOptions) => {
  const attributeValues = queryOptions.attributeValues

  const keyConditionExpression = Object.keys(attributeValues)
    .map((attributeName, index) => `#attr${index} = :val${index}`)
    .join(' AND ')

  const expressionAttributeNames = Object.keys(attributeValues).reduce(
    (acc, attributeName, index) => ({
      ...acc,
      [`#attr${index}`]: attributeName,
    }),
    {}
  )

  const expressionAttributeValues = Object.keys(attributeValues).reduce(
    (acc, attributeName, index) => ({
      ...acc,
      [`:val${index}`]: attributeValues[attributeName],
    }),
    {}
  )

  return {
    IndexName: queryOptions.indexName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  }
}