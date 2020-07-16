# D&D Dynamic Maps

Players and DMs connect to share a set of dynamic maps and character tokens in realtime.

## Setup

You have two applications to run on your server:

### React application

Just build the application, then put its static assets into a webserver and serve them up. Have your players connect to `http(s)://yourdomain.com/?room=YOURROOM`. The DM should include an additional `host=1` paramter in the query string.

```bash
cd react-app
npm start # run local server
npm run build # build for deploy
```

In development, start the development server with `npm start`.

### Node.JS application

Put the `socket-app` directory on your server and start up the application with `npm start`. This will run a small websockets server which just relays messages between players. (Messages only go to players in the same room as whoever send the message.)

```bash
cd socket-app
npm run daemon # run on server using nohup
npm start # run locally
```

## Storage

The images for maps and character tokens are just provided as URLs and get loaded from whatever server is hosting them.

The configuration of maps and tokens is stored as a JSON string of nested objects in your browser's `localStorage`. The `localStorage` key is the name of the "room" to which you and your party are connected. (Set the `room` parameter of your URL to any arbitrary string you choose.)

## Third-party resources

### Maps resources

- https://dysonlogos.blog/maps/
- https://www.wistedt.net/category/map/

### Unicode symbols

- http://www.alanwood.net/demos/wingdings.html
- https://www.w3schools.com/charsets/ref_utf_misc_symbols.asp
