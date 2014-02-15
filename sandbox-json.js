var Instruments = require('./lib/tools/instruments.js');


var myObj = [
    [ 'b7145841-962f-11e3-8b8e-abca0f9fdedd',
        'painquotidien',
        'b7145842-962f-11e3-8b8e-abca0f9fdedd',
        'cafeamour',
        'b7145843-962f-11e3-8b8e-abca0f9fdedd' ],
    ['cce97c91-962f-11e3-8b8e-abca0f9fdedd',
        'hotelamour',
        'b7145842-962f-11e3-8b8e-abca0f9fdedd',
        'cafeamour',
        '19fe2713-9630-11e3-8b8e-abca0f9fdedd' ]
];




/*console.log(myObj);

console.log(myObj[0]);


console.log(myObj[0][1]);  */

/*
var nodes = {id:[],label:[]};

var edges = [];

nodes["id"].push = "orange";

nodes["id"].push = "banana"; */

var g = {
    nodes: [],
    edges: []
};


for (var i = 0; i < myObj.length; i++) {

    g.nodes.push({
        id: myObj[i][0],
        label: myObj[i][1]
    });

    g.nodes.push({
        id: myObj[i][2],
        label: myObj[i][3]
    });

    g.edges.push({
        source: myObj[i][0],
        target: myObj[i][2],
        id: myObj[i][4]
    });

};




g.nodes = Instruments.uniqualizeArray(g.nodes, JSON.stringify);
g.edges = Instruments.uniqualizeArray(g.edges, JSON.stringify);

console.log(g);


/*

for (var i = 0; i < myObj.length; i++) {

    nodes['id'] = (myObj[i][0]);
    nodes['label'].push(myObj[i][1]);
    nodes['id'].push(myObj[i][2]);
    nodes['label'].push(myObj[i][3]);
    edges['source'].push(myObj[i][0]);
    edges['target'].push(myObj[i][2]);
    edges['id'].push(myObj[i][4]);

}     */

// console.log(myObj2);


/*myObj.forEach(function(item){
    entries.push(JSON.parse(item));
});*/


