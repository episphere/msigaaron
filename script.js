var maxLevels = 2;
var maxNodes = 5;
var maxValue = 100;

var data = {
    name: "Root",
    children: []
  }
  generateLevel(data, "", 0);
  
  function generateLevel(data, name, level) {
    for (var i = 0; i < Math.ceil(maxNodes * Math.random()) + 1; i++) {
      var nodeName = name + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i];
      var child;
      if (level < maxLevels) {
        child = {
          name: nodeName + level
        }
  
        if (level > 0 && Math.random() < 0.5) {
          child.value = Math.round(Math.random() * maxValue);
        }
        else {
          child.children = [];
          generateLevel(child, nodeName + i, level + 1)
        }
      }
      else {
        child = {
          name: name + i,
          value: Math.round(Math.random() * maxValue)
        }
      }
      data.children.push(child);
    }
  
    level++;
    return data;
  }