# How to use DevKit Routing:
- Make a file called `DKRoute.json` in the directory you want to use (or use `dkpm make dkroute` if installed)
- Format:
```jsonc
// this is an example
{
  "$": { // metadata
    "useHttps": false, // controls if https is used
    "httpsConfig": {
      "key": "relative_path.key", // relative path to key
      "cert": "relative_path.crt" // relative path to cert
    },
    "port": 8080 // the port to use
  },
  "/": [ // the route (/ = http://localhost:8080/)
    {
      "requestType": "GET", // the HTTP verb
      "file": "index.html", // relative path to data file
      "contentType": "html", // datatype
      "externalFunction": false // if it uses an external function
    },
    {
      "requestType": "POST",
      "file": "test.js", // relative path to function file (expects [statusCode:int, headers:Object, content:string])
      "externalFunction": true // set to `true` when there is an external function
    }
  ]
}
// the real file would not use any comments
```

---

Creation attributed to [u1terior](https://portfolio.u1t.dev/)