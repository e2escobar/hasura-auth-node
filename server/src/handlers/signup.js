const fetch = require("node-fetch")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Hasura Mutation
const HASURA_OPERATION = `
mutation ($email: String!, $password: String!, $username: String!) {
  insert_users_one(object: {
    email: $email
    password: $password
    username: $username
  }) {
    username
    id
  }
}
`;

// HASURA_JWT_SECRET, HASURA_GRAPHQL_ADMIN_SECRET  and HASURA_URL from .env file
const HASURA_GRAPHQL_ADMIN_SECRET = {"x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET};
const HASURA_GRAPHQL_JWT_SECRET = process.env.HASURA_GRAPHQL_JWT_SECRET;
const HASURA_URL = process.env.HASURA_URL;

// execute the parent mutation in Hasura
const execute = async (variables, reqHeaders) => {
  const fetchResponse = await fetch(
    HASURA_URL,
    {
      method: 'POST',
      headers: { ...reqHeaders, ...HASURA_GRAPHQL_ADMIN_SECRET } || {},
      body: JSON.stringify({
        query: HASURA_OPERATION,
        variables
      })
    }
  );
  return await fetchResponse.json();
};


// Request Handler
const handler = async (req, res) => {

  // get request input
  const { email, password } = req.body.input;

  // run some business logic
  let hashedPassword = await bcrypt.hash(password, 10);

  const username = email.split('@')[0];

  // execute the Hasura operation
  const { data, errors } = await execute({ email,password: hashedPassword, username }, req.headers);

  // if Hasura operation errors, then throw error
  if (errors) {
    return res.status(400).json({
      message: errors[0].message
    })
  }

  // success
  return res.json({
    ...data.insert_users_one
  })

}

module.exports = handler;