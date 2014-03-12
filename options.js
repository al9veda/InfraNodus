var fs = require('fs');

var configPath = './config.json';

// Config file exists?

if (fs.existsSync(configPath)) {

    var parsed = JSON.parse(fs.readFileSync(configPath, 'UTF-8'));

    // Create Neo4J access URL
    exports.neo4jlink = "http://" + parsed['neo4j']['username'] +
                        ":" + parsed['neo4j']['password'] +
                        "@" + parsed['neo4j']['host'];

    exports.invite = parsed['secrets']['invitation'];


}

else {

    console.log("Neo4J config file doesn't exist. Using default settings.");

    exports.neo4jlink = "http://localhost:7474";
    exports.invite = '';
}




