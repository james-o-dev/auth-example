# Tests for Auth Example

## Table Of Contents

* [Overview](#overview)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
  * [API](#api)
  * [Client](#client)
* [Running Tests](#running-tests)
  * [API](#api)
  * [Client](#client)
* [Project Structure](#project-structure)
* [Writing Tests](#writing-tests)
  * [API](#api)
  * [Client](#client)

## Overview

This directory contains written tests for the Auth Example project.

These include:

- Unit tests for the API, using [Jest](https://jestjs.io).
- End-to-end (E2E) tests for the Client, using [Cypress](https://www.cypress.io).

## Prerequisites

Before running either of the tests, make sure you have the following:

- The [AWS resources](../aws/cdk/) have been deployed successfully.
  - Note: The tests will use the deployed API. Mock local testing is currently not available.

## Installation

For both, run `npm install` to install dependencies.

Take a look at the `.env.template` files. Make a copy and rename it `.env` and set the values approriately.

### API

```bash
# API domain host.
API_HOST="https://xxxx.lambda-url.ap-southeast-2.on.aws"
# Use this email for users.
# Must additionally add '{+}' before the @ symbol, to ensure uniqueness.
API_TEST_EMAIL="test{+}@gmail.com"
# Dev client host. Required for 'test' endpoints.
DEV_CLIENT_HOST="http://localhost:5173"
```

### Client

```bash
# Domain of the dev client. e.g. "http://localhost:3000"
DEV_CLIENT_HOST=""
# Use this email for users.
# Must additionally add '{+}' before the @ symbol, to ensure uniqueness.
# e.g. test{+}@gmail.com
API_TEST_EMAIL=""
# API domain host.
API_HOST=""
```

## Running Tests

### API

Run `npm run test`.

Jest will run all the test cases and provide you with a detailed report.

### Client

Run `npm run cypress:open` to open the Cypress interface, where you can run tests individually.

Run `npm run cypress:run` to run all tests in headless mode.

## Project Structure

`api-tests/`: Contains the Jest project.

`client-e2e/`: Contains the Jest project.

## Writing Tests

### API

You can extend the existing test files or create new ones in the `api-tests/tests/` directory. Follow the Jest testing syntax and assertions to validate the functionality of your API.

Note that the file must end with either `.spec.js` or `.test.js` in order to be detected by Jest.

#### Example Test File (tests/health.spec.js)

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

### Client

You can extend the existing test files or create new ones in the `client-e2e/cypress/e2e` directory. Follow the Cypress testing syntax and assertions to validate the functionality of your API.

```javascript
describe('Check health', () => {
  it('passes', () => {
    cy.visit('/')

    cy.get('h2').should('contain', 'Hello World!')
    cy.get('p').should('contain', 'API health: I am healthy! ❤❤❤')
  })
})
```