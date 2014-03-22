##InfraNodus is a web / mobile interface to Neo4J made using Node.Js and Sigma.Js.
 
=================

![](/public/images/infranodus.gif "InfraNodus Interface")

=================


[Watch a Video Demo](https://vimeo.com/89807920)
[Try it Online](http://infranodus.com) - request invitation code through [Nodus Labs](http://noduslabs.com/contact/)


=================


### Introduction

The basic ideas behind InfraNodus are:
– Graph DB model that can suit any purpose.
- Works on desktop and mobile.
- Make it easy to add nodes into a graph through a simple web interface.
- Work with what people already know and use well: #hashtags and @mentions, not nodes and edges.
- Move away from binary edges (e.g. A < - > B) to hyperedges in one statement (e.g. A and B and C or D)
- API and JSON export of all data;
- Make it as lightweight, portable, and standalone as possible;
- Make it as fast as possible;
- Enable people to use ше collaboratively, both locally and over the internet (TODO);
- Your suggestions? (open an issue)


=================


### Technology

InfraNodus is built on

* [Sigma.Js](http://github.com/jacomyal/sigma.js) for graph visualization;
* [Neo4J](http://neo4j.org) for graph database storage (TODO: add support for OrientDB and Titanium);
* Node.Js
* Express Node.Js library;
* [Node-Neo4J layer](http://github.com/philippkueng/node-neo4j);
* [Textexture](http://textexture.com) algorithm for text network visualization;
* Help from the people on StackOverflow and Neo4J community;


=================


###Installation Guide
To use this software you should install Neo4J 2.0 and Redis on your local computer.
To install Neo4J on a Mac use homebrew (see [Neo4J instructions here](http://www.neo4j.org/download)).
To install Redis on a Mac, check out [this nice installation guide](http://jasdeep.ca/2012/05/installing-redis-on-mac-os-x/)

You will also need to have npm Node.Js package manager on your computer and run
`npm install` 
in node_modules folder of the project to install all the dependencies.

You might need to manually install ejs rending Node.Js module
`npm install ejs`


=================


###Data Model

The general rationale for the data model used in InfraNodus is outlined in
* [Cognitive Network Protocol](http://noduslabs.com/research/cognitive-network-protocol/) article (more specific)
* [From Cognitive Interfaces to Transcendental Protocols](http://noduslabs.com/research/cognitive-interfaces-transcendental-protocols/) article (more general)
* [Graph Database Model Draft](https://github.com/deemeetree/graphdbmodel) detailed description

The main properties of this model are

- There are 5 labels (types) for nodes: Concepts, Statements, Contexts, Users, and Narratives
- Every expression of a user into the system is a Statement
- Example: "#antibiotics can fight #bacteria which are #dangerous for #health" is the user's input. The system creates 4 :Concept nodes from the hashtags inside the :Statement, which is linked to the :Context (by default, "@private") and all those are attached to the :User.
- Types of connections: :TO (between Concepts), :AT (Concepts to Context), :OF (Concepts to Statement), :IN (Statement to Context), :BY (to User)
- Narrative is implemented through creating a :Narrative node, which is linked to from Statements and Concepts by :INTO type of connection (think of :Narrative as another :Context)
- Narrative elements are linked to each other via :THRU type of connection.

This data model enables to create custom views for any kind of data and introduce the idea of narrative into holistic graph views.

This data model is derived from the [Cognitive Graph DB Model](http://noduslabs.com/cases/graph-database-structure-specification/) draft created by Nodus Labs.

The current data model description utilized in InfraNodus app is available in https://github.com/noduslabs/graphdbmodel repository.


=================


###Mobile Interface

InfraNodus can also be used on a mobile.

![](/public/images/infranodus-mobile.png "InfraNodus Mobile Interface")



=================


####MIT License####

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


