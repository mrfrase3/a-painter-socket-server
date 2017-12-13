# A-Painter Socket Server Demo #
A socket based multiplayer server example for a-painter

We recently had the privledge to exhibit multipalyer A-Painter in the VR Showcase at SIGGRAPH Asia 2017. As a part of this we got in some local artists to try it out, you can see their paintings, and others, [here](https://mrfrase3.github.io/a-painterSA17/).

**Note:**
This is a proof of concept only, **this should not be used in production**. There are serious vulnerabilities which would not fly in production.

----------
## Installation ##
Pretty simple!

 1. Download the repo to your test directory
 2. Run `npm install`
 3. Run `git clone https://github.com/aframevr/a-painter.git` 
 4. Run `node server`

----------
## How it Works ##

This server uses a-painter's main repo, except instead of using a cli webpack server, it hosts its own express server with webpack implemented and then runs a socket.io server on top. It also injects the multiplayer layer into the client application.

This serves as a basic example and the method can easily be modified to support different communication types, like mongo, firebase, webRTC, etc... 
