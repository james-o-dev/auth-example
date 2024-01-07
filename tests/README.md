# Tests for Auth Example

## Overview

This directory contains written tests for the Auth Example project.

These include:

- Unit tests for the API, using Jest

## Prerequisites

Before running the tests, make sure you have the following:

- The [AWS resources](../aws/cdk/) have been deployed successfully.
  - Note: The tests will use the deployed API. Mock local testing is currently not available.

## Installation

Run `npm install` to install dependencies.

Take a look at the `.env.template` file. Make a copy and rename it `.env` and set the values approriately.

```bash
# API domain host.
API_HOST="https://xxxx.lambda-url.ap-southeast-2.on.aws"
# Use this email for users.
# Must additionally add '{+}' before the @ symbol, to ensure uniqueness.
API_TEST_EMAIL="test{+}@gmail.com"
# Dev client host. Required for 'test' endpoints.
DEV_CLIENT_HOST="http://localhost:5173"
```

## Running Tests

Run `npm run test`.

Jest will run all the test cases and provide you with a detailed report.

## Project Structure

`api-tests/`: Contains the Jest project.

## Writing Tests

You can extend the existing test files or create new ones in the `api-tests/tests/` directory. Follow the Jest testing syntax and assertions to validate the functionality of your API.

Note that the file must end with either `.spec.js` or `.test.js` in order to be detected by Jest.

### Example Test File (tests/health.spec.js)

```javascript
describe("General API test", () => {
  test("health test", async () => {
    const response = await fetch(`${process.env.API_HOST}/health`);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(await response.json()).toBe("I am healthy! ❤❤❤");
  });
});
```
