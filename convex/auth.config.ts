// Convex Auth configuration
// This tells Convex how to validate JWTs issued by Convex Auth

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
