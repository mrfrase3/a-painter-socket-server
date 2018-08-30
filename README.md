# A-Painter Socket Server Demo #
A socket based multiplayer server example for a-painter

We recently had the privilege to exhibit multipalyer A-Painter in the VR Showcase at SIGGRAPH Asia 2017. As a part of this we got in some local artists to try it out, you can see their paintings, and others, [here](https://mrfrase3.github.io/a-painterSA17/).

**Note:**
This is a proof of concept only, **this should not be used in production**. There are serious vulnerabilities which would not fly in production.

----------
## Installation ##
Pretty simple!  Install [Node.js](https://nodejs.org/en/download/) then...

 1. Copy the URL for this code (`Clone or Download` button above)
 1. Paste the URL at the end of this command: `git clone --recursive `
 1. Run `npm install` in the resulting directory.
 1. Run `node server`

Done!  A line like this in the output tells you which port to connect to:

    Server running on port 3002

Remember to adjust your firewall settings for that port (TCP).

----------
## How it Works ##

This server uses A-Painter's main repo, except instead of using a CLI Webpack server, it hosts its own Express server with Webpack implemented and then runs a Socket.io server on top. It also injects the multiplayer layer into the client application.

This serves as a basic example and the method can easily be modified to support different communication types, like Mongo, Firebase, webRTC, etc... 
