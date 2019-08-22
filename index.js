module.exports = function({ types: t }, options = {}) {
  const rename = options.rename || {};

  const nameMap = new Map();
  Object.keys(rename).forEach(key => {
    const value = rename[key];
    if (typeof value !== "string") {
      throw new Error(
        `New name for property ${JSON.stringify(key)} should be a string`
      );
    }
    nameMap.set(key, value);
  });

  return {
    name: "transform-rename-properties",
    visitor: {
      MemberExpression: {
        exit(path) {
          const node = path.node;
          const prop = node.property;
          if (prop.computed) {
            return;
          }
          const newName = nameMap.get(prop.name);
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
        }
      }
    }
  };
};
