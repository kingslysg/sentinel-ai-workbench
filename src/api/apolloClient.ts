import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

/** Optional GraphQL client for portfolio/report queries. The demo chat currently uses the REST AI endpoint. */
export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:8787/graphql' }),
  cache: new InMemoryCache({ typePolicies: { Portfolio: { keyFields: ['id'] } } }),
})
