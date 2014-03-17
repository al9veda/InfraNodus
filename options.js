var fs = require('fs');

var configPath = './config.json';

// General program-wide settings

exports.settings = {

    // 1 - Connect all the #words within a 4-word gap in the statement to each other
    // 0 - Connect only the words that are next to each other
    fullscan: 1,

    // 1 - Graph shows connections between both the words that are next to each and also within the 4-word gap
    // 0 - Graph shows only words that are next to each other
    fullview: 1,

    // 1 - #hashtags and words are automatically converted to their morphemes (#cats = #cat, #taken = #take)
    // 0 - #hashtags stay like they are
    morphemes: 0,

    // Max number of contexts in one statement
    max_contexts: 5,

    // Max length of a statement text
    max_text_length: 2000,

    // Max number of tags in one statement
    max_hashtags: 60

}

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




