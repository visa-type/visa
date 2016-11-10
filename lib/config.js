module.exports = {
  EmailURL:"verify",
  TOKEN_SECRET: 'e50e648ea65507461107a15503daae21' || 'A hard to guess string',
  MONGO_URI: process.env.MONGO_URI || 'localhost',
  FACEBOOK_SECRET: 'e50e648ea65507461107a15503daae21' || 'Facebook App Secret',
  FOURSQUARE_SECRET: process.env.FOURSQUARE_SECRET || 'Foursquare Client Secret',
  GOOGLE_SECRET: 'Gr2mSi5oEaiQxA1tc4GL_NKB',
  GITHUB_SECRET: 'c6286c993282c968619cf03473b3cb88e127ac18' || 'GitHub Client Secret',
  LINKEDIN_SECRET: 'RuVQtzT81YJqFnxn' || 'LinkedIn Client Secret',
  WINDOWS_LIVE_SECRET: process.env.WINDOWS_LIVE_SECRET || 'Windows Live Secret',
  TWITTER_KEY: process.env.TWITTER_KEY || 'Twitter Consumer Key',
  TWITTER_SECRET: process.env.TWITTER_SECRET || 'Twitter Consumer Secret',
  TWITTER_CALLBACK: process.env.TWITTER_CALLBACK || 'Twitter Callback Url',
  YAHOO_SECRET: process.env.YAHOO_SECRET || 'Yahoo Client Secret',
  type: 'mongodb',
  hostname: 'localhost',
  port: 27017,
  database: 'collaborative'
};