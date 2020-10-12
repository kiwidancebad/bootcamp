const { ApolloServer } = require('apollo-server');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { createStore } = require('./utils/db');

const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');

const isEmail = require('isemail');

const store = createStore();

const dataSources = () => ({
  launchAPI: new LaunchAPI(),
  userAPI: new UserAPI({ store }),
});

const context = async ({ req }) => {
  const auth = req.headers?.authorization || '';
  const email = new Buffer(auth, 'base64').toString('ascii');

  if (!isEmail.validate(email)) {
    return { user: null };
  }

  const users = await store.users.findOrCreate({ where: { email }});
  const user = users && users[0] ? users[0] : null;

  return { user };
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  context,
  playground: true,
  introspection: true,
});

if (process.env.NODE_ENV !== 'test') {
  server
    .listen({ port: process.env.PORT || 4000 })
    .then(() => {
      console.log(`🚀`);
    })
}
