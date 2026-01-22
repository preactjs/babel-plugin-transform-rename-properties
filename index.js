/** @import { PluginObj, NodePath } from '@babel/core' */
/** @import { Node, Property, Method, MemberExpression, TemplateLiteral } from '@babel/types' */
/** @import { Visitor } from '@babel/traverse' */
/** @typedef {typeof import('@babel/types')} BabelTypes */

/**
 * @typedef {Object} PluginOptions
 * @property {Record<string, string>} [rename] - A map of property names to rename
 */

/**
 * Check if node is a template literal with no expressions (e.g., `foo`)
 * @param {BabelTypes} t - The Babel types object
 * @param {Node} node - The AST node to check
 * @returns {boolean} True if the node is a constant template literal
 */
function isConstantTemplateLiteral(t, node) {
  return (
    t.isTemplateLiteral(node) &&
    node.expressions.length === 0 &&
    node.quasis.length === 1
  );
}

/**
 * Create a template literal node with no expressions (e.g., `foo`)
 * @param {BabelTypes} t - The Babel types object
 * @param {string} value - The string value for the template literal
 * @returns {TemplateLiteral} The template literal node
 */
function constantTemplateLiteral(t, value) {
  return t.templateLiteral(
    [t.templateElement({ raw: value, cooked: value }, true)],
    []
  );
}

/**
 * Babel plugin that renames properties, methods, and member expressions.
 * @param {{ types: BabelTypes }} babel - The Babel object
 * @param {PluginOptions} [options] - Plugin options
 * @returns {PluginObj} The Babel plugin object
 */
module.exports = function ({ types: t }, options = {}) {
  const rename = options.rename || {};

  /** @type {Map<string, string>} */
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

  /**
   * Visitor for Property and Method nodes that renames keys.
   * @type {Visitor}
   */
  const replacePropertyOrMethod = {
    /** @param {NodePath<Property | Method>} path */
    exit(path) {
      const node = path.node;

      /** @type {string | undefined} */
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
        /** @param {NodePath<MemberExpression>} path */
        exit(path) {
          const node = path.node;

          /** @type {string | undefined} */
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

          /** @type {MemberExpression} */
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
      BinaryExpression: {
        exit(path) {
          const node = path.node;
          if (node.operator !== "in") {
            return;
          }

          let oldName;
          let isTemplateLiteral = false;

          if (t.isStringLiteral(node.left)) {
            oldName = node.left.value;
          } else if (isConstantTemplateLiteral(t, node.left)) {
            oldName = node.left.quasis[0].value.cooked;
            isTemplateLiteral = true;
          } else {
            return;
          }

          const newName = nameMap.get(oldName);
          if (newName === undefined) {
            return;
          }

          const newNode = isTemplateLiteral
            ? constantTemplateLiteral(t, newName)
            : t.stringLiteral(newName);

          const replacedNode = t.binaryExpression("in", newNode, node.right);
          path.replaceWith(replacedNode);
          path.skip();
        },
      },
    },
  };
};
