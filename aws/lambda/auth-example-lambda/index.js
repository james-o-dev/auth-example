// index.js
exports.handler = async (event, context) => {
  try {
    // Your Lambda function logic goes here
    const response = {
      statusCode: 200,
      body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
  } catch (error) {
    console.error('Error:', error);
    const response = {
      statusCode: 500,
      body: JSON.stringify('Internal Server Error'),
    };
    return response;
  }
};
