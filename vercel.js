{
    "version": 2,
    "public": true,
    "builds": [
      { "src": "index.html", "use": "@vercel/static" }
    ],
    "routes": [
      { "src": "/(.*)", "dest": "/" }
    ]
  }
  