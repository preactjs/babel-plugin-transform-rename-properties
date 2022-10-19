const path = require('path');

module.exports = function ({ types: t }, options = {}) {
  let rename = options.rename || {};
  if (typeof rename === 'string') {
    try {
      rename = require(path.resolve(options.cwd || process.cwd(), rename)) || {};
    } catch (e) {
      throw new Error(
        `Unable to load rename file '${rename}': ${e.message}`  
      );
    }
  }

  const nameMap = new Map();
  Object.keys(rename).forEach((key) => {
    const value = rename[key];
    if (typeof value !== "string") {
      throw new Error(
        `New name for property ${JSON.stringify(key)} should be a string`
      );
    }
    nameMap.set(key, value);
  });

  const replacePropertyOrMethod = {
    exit(path) {
      const node = path.node;

      let name;
      if (t.isIdentifier(node.key) && !node.computed) {
        name = node.key.name;
      } else if (t.isStringLiteral(node.key)) {
        name = node.key.value;
      } else {
        return;
      }

      const newName = nameMap.get(name);
      if (newName === undefined) {
        return;
      }

      const newNode = t.cloneNode(node, false);
      if (t.isIdentifier(node.key) && t.isValidIdentifier(newName)) {
        newNode.key = t.identifier(newName);
      } else {
        newNode.key = t.stringLiteral(newName);
      }
      path.replaceWith(newNode);
      path.skip();
    },
  };

  return {
    name: "transform-rename-properties",
    visitor: {
      Property: replacePropertyOrMethod,
      Method: replacePropertyOrMethod,
      MemberExpression: {
        exit(path) {
          const node = path.node;

          let name;
          if (t.isIdentifier(node.property) && !node.computed) {
            name = node.property.name;
          } else if (t.isStringLiteral(node.property)) {
            name = node.property.value;
          } else {
            return;
          }

          const newName = nameMap.get(name);
          if (newName === undefined) {
            return;
          }

          let newNode;
          if (t.isValidIdentifier(newName)) {
            newNode = t.memberExpression(node.object, t.identifier(newName));
          } else {
            newNode = t.memberExpression(
              node.object,
              t.stringLiteral(newName),
              true
            );
          }
          path.replaceWith(newNode);
          path.skip();
        },
      },
    },
  };
};
