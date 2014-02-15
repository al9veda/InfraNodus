##InfraNodus is a lightweight interface to graph databases (User - Node.Js - Neo4J).
 
=================

![](/public/images/infranodus.png "InfraNodus Interface")
[Watch a Video Demo - 2 Mins](https://vimeo.com/deemeetree/review/86794258/e51e15db50)

=================


###The basic ideas are:
- Make it easy to add nodes into a graph through a simple web interface.
- Work with what people already know and use well: #hashtags, not nodes and edges.
- Move from binary edges (e.g. A < - > B) to hyperedges in one statement (e.g. A and B and C or D)
- Make it as lightweight, portable, and standalone as possible;
- Make it as fast as possible;
- Enable people to use collaboratively, both locally and over the internet (TODO);
- Your suggestions? (TODO: open an issue)

=================

####We rely, heavily use, and totally indebted to this amazing software:####
* [Sigma.Js](http://github.com/jacomyal/sigma.js) for graph visualization;
* [Neo4J](http://neo4j.org) for graph database storage (TODO: add support for OrientDB and Titanium);
* Node.Js
* Express Node.Js library;
* [Node-Neo4J layer](http://github.com/philippkueng/node-neo4j);
* [Redis](http://redis.io) for simple local user storage management (may be changed later);

=================


####Installation Guide:####
To use this software you should install Neo4J 2.0 and Redis on your local computer.
To install Neo4J on a Mac use homebrew (see [Neo4J instructions here](http://www.neo4j.org/download)).
To install Redis on a Mac, check out [this nice installation guide](http://jasdeep.ca/2012/05/installing-redis-on-mac-os-x/)

You will also need to have npm Node.Js package manager on your computer and run
`npm install` 
in node_modules folder of the project to install all the dependencies.

=================


####MIT License####

*Note that the code was written by a complete novice, so some things are not perfect.
But I'm learning and you are very welcome to join, branch, fork, contact me, and open issues!
 
 
This open source, free software is available under MIT license.
It is provided as is, with no guarantees and no liabilities.
You can re-use it as long as you keep this notice inside the code

**You are very welcome to join the project!**

Created by [Nodus Labs](http://www.noduslabs.com), conceptualized via [Polysingularity](http://polysingularity.com), inspired from [ThisIsLike.Com](http://thisislike.com), and [KnowNodes (now Rhizi)](http://rhizi.org) co-developed at [Center for Interdisciplinary Research](http://cri-paris.org). 

Written by [Dmitry Paranyushkin](http://github.com/deemeetree) | [Nodus Labs](http://www.noduslabs.com) and hopefully you also!
(http://www.noduslabs.com) | info AT noduslabs DOT com
 
In some parts the code from the book ["Node.js in Action"](http://www.manning.com/cantelon/) is used (highly recommended, btw!)
(c) 2014 Manning Publications Co.
Any source code files provided as a supplement to the book are freely available to the public for download. Reuse of the code is permitted, in whole or in part, including the creation of derivative works, provided that you acknowledge that you are using it and identify the source: title, publisher and year.*


