import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import type { Express } from 'express'

const typeDefs = `#graphql
  type Portfolio { id: ID!, name: String!, owner: String!, totalValue: Float!, return12m: Float!, benchmark12m: Float!, fictional: Boolean! }
  type Query { portfolio(id: ID!): Portfolio, portfolios: [Portfolio!]! }
`
const portfolios = [{ id: 'northstar-growth', name: 'Northstar Growth', owner: 'Kingsly Bose', totalValue: 232540, return12m: 21.4, benchmark12m: 11.2, fictional: true }]
const resolvers = { Query: { portfolios: () => portfolios, portfolio: (_: unknown, { id }: { id: string }) => portfolios.find(p => p.id === id) ?? null } }

export async function mountGraphql(app: Express) {
  const server = new ApolloServer({ typeDefs, resolvers })
  await server.start()
  app.use('/graphql', expressMiddleware(server))
}
