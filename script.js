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

  function limitDepth(data, maxDepth) {
    if (maxDepth === 0 || !Array.isArray(data.children)) {
        // Base case: If max depth is reached or there are no more children, return data
        return data;
    }

    // Recursively limit the depth of each child
    data.children = data.children.map(child => limitDepth(child, maxDepth - 1));

    if (maxDepth === 1) {
        // If we've reached the maximum depth, merge all children and return the result
        const mergedChildren = data.children.reduce((acc, curr) => {
            if (Array.isArray(curr.children)) {
                return [...acc, ...curr.children];
            } else {
                return [...acc, curr];
            }
        }, []);
        return {...data, children: mergedChildren};
    } else {
        // Otherwise, return the data with its children intact
        return data;
    }
}
