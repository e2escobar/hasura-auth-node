Example SignUp and Login using Hasura ations and express server. 


## Start Hasura and Postgres

```
$ docker-compose up -d
```

## Apply Migrations
Go to hasura directory : 
```
$ cd hasura
$ hasura migrate apply
$ hasura metadata apply
```

## Run Express Function
Go to server directory : 
```
$ cd server
$ npm install
$ npm start
```
Explore graphql, and try SignUp and Login, 
remeber to uncomment admin secret and jwt_secret form docker-compose.yaml 