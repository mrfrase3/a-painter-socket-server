# A-Painter Socket Server Demo #
A socket based multiplayer server example for a-painter

We recently had the privilege to exhibit our [multiuser A-Painter](https://dl.acm.org/citation.cfm?id=3148451) project [in the VR Showcase at SIGGRAPH Asia 2017](https://sa2017.siggraph.org/attendees/vr-showcase?view=event&eid=145).  A selection of local artists (plus exhibition visitors) created VR artworks you can see [here](https://mrfrase3.github.io/a-painterSA17/).

**Note:**
This is a proof of concept only, **this should not be used in production**. There are serious vulnerabilities which would not fly in production.

----------
## Installation ##
Pretty simple!  Install [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/en/download/) then...

 1. Copy the URL for this repository (`Clone or Download` button above)
 1. Paste that URL at the end of this command &amp; hit Enter: `git clone --recursive `
 1. Run `npm install` in the resulting directory.
 1. Run `node server`

Done!  A line like this in the output tells you which port to point your browser at (for example http://localhost:3002):

    Server running on port 3002

Painters on other computers will need to use your server's IP address or hostname instead of "localhost" in the example URL above.  Remember to adjust your firewall settings for that port (TCP) so they have access (carefully!).

You'll probably want to specify a "room" id in the URL, or each participant's browser will be randomly assigned a new, empty room (so lonely!).  We often use the date / time or a random fruit / vegetable (for example, "Let's all meet here: http://your.server:3002?room=tomato").

----------
## How it Works ##

This server uses A-Painter's main repo, except instead of using a CLI Webpack server, it hosts its own Express server with Webpack implemented and then runs a Socket.io server on top. It also injects the multiplayer layer into the client application.

This serves as a basic example and the method can easily be modified to support different communication types, like Mongo, Firebase, webRTC, etc... 
