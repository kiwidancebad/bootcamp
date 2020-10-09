const { ApolloServer } = require('apollo-server');

const typeDefs = require('./schema');

const server = new ApolloServer({
  typeDefs
});

if (process.env.NODE_ENV !== 'test') {
  server
    .listen({ port: process.env.PORT || 4000 })
    .then(() => {
      console.log(`🚀`);
    })
}
