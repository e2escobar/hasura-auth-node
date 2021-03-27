const fetch = require("node-fetch")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HASURA_GRAPHQL_ADMIN_SECRET = {"x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET};

// HASURA_JWT_SECRET and HASURA_URL from .env file
const HASURA_JWT_SECRET = JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET);
const HASURA_URL = process.env.HASURA_URL;

const HASURA_OPERATION = `
query GetUserByEmail ($email: String!) {
  users(where: {email: {_eq: $email}}) {
    password
    email
    id
    role
  }
}
`;

// Generate JWT Token
const generateToken = (user) => {

  // Define roles 
  const user_roles = ["user"];
  const admin_roles = ["admin"];

  // Boolean validation for admin user role
  const is_admin = user.role === 'admin';

  // JWT payload
  const payload = {
    "https://hasura.io/jwt/claims": {
        "x-hasura-allowed-roles": is_admin ? admin_roles : user_roles,
        "x-hasura-default-role": is_admin ? "admin" : "user",
        "x-hasura-user-id": user.id,
    }
  }

  // Token Signature
  const token = jwt.sign(payload, HASURA_JWT_SECRET.key, { algorithm: HASURA_JWT_SECRET.type}); 

  return token;

}

// Password match function 
const comparePassword = async (password, hash) => {
  try {
      // Compare password
      return await bcrypt.compare(password, hash);
  } catch (error) {
      console.log(error);
  }

  // Return false if error
  return false;
};

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
  const {email, password } = req.body.input;

  // execute the Hasura operation
  const { data, errors } = await execute({ email }, req.headers);

  // if Hasura operation errors, then throw error
  if (errors) {
    return res.status(400).json({
      message: errors.message
    })
  }

  // Get user information fromt first data array result
  const user = data.users[0];

  // Checking password
  const match = await comparePassword(password, user.password);

  if (!match) {
    return res.status(400).json({
      message: "Wrong password"
    })
  } 

  // Generating Token
  const token = generateToken(user)
  // success
  return res.json({
    accessToken: token
  })
  
}

module.exports = handler;