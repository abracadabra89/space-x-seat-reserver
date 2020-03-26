const { ApolloServer } = require("apollo-server");
const typeDefs = require("./schema");
const { createStore } = require("./utils");
const resolvers = require("./resolvers");
const isEmail = require("isemail");


const LaunchAPI = require("./datasources/launch");
const UserAPI = require("./datasources/user");

const store = createStore();

const dataSources = () => ({
  launchAPI: new LaunchAPI(),
  userAPI: new UserAPI({ store })
});



const server = new ApolloServer({
  context: async ({ req }) => {
    // simple auth check on every request
    const auth = (req.headers && req.headers.authorization) || "";
    const email = Buffer.from(auth, "base64").toString("ascii");
    if (!isEmail.validate(email)) return { user: null };
    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } });
    const user = (users && users[0]) || null;

    return { user: { ...user.dataValues } };
  },
  typeDefs,
  resolvers,
  dataSources,
  introspection: true,
  playground: true,
  engine: {
    apiKey: process.env.ENGINE_API_KEY
  }
});
if (process.env.NODE_ENV !== "test") {
  server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀 app running at ${url}`);
  });
}

module.exports = {
  dataSources,
  typeDefs,
  resolvers,
  ApolloServer,
  LaunchAPI,
  UserAPI,
  store,
  server
};
