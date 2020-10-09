const { ApolloServer } = require('apollo-server');

const typeDefs = require('./schema');
const { createStore } = require('./utils/db');

const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');

const store = createStore();

const server = new ApolloServer({
  typeDefs,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }),
  }),
});

if (process.env.NODE_ENV !== 'test') {
  server
    .listen({ port: process.env.PORT || 4000 })
    .then(() => {
      console.log(`🚀`);
    })
}
