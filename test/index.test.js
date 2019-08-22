const t = require("@babel/types");
const { transform } = require("@babel/core");
const { parse } = require("@babel/parser");
const { expect } = require("chai");
const plugin = require("../index.js");

function replace(input, options = {}) {
  return transform(input, {
    babelrc: false,
    configFile: false,
    plugins: [[plugin, options]]
  }).code;
}

function compare(input, output, options = {}) {
  const transformed = replace(input, options);

  if (!t.isNodesEquivalent(parse(transformed), parse(output))) {
    expect(transformed).to.equal(output);
  }
}

describe("babel-plugin-transform-rename-properties", () => {
  it("renames only properties", () => {
    compare(
      `
      function foo(obj) {
        return obj.foo + obj.bar
      }
      `,
      `
      function foo(obj) {
        return obj.__FOO__ + obj.__BAR__
      }
      `,
      {
        rename: {
          foo: "__FOO__",
          bar: "__BAR__"
        }
      }
    );
  });

  it("renames properties from the middle", () => {
    compare("obj.foo.bar", "obj.__FOO__.bar", {
      rename: { foo: "__FOO__" }
    });
  });

  it("turns bad identifiers to computed props", () => {
    compare("obj.foo", "obj['bad identifier']", {
      rename: { foo: "bad identifier" }
    });
  });

  it("does not rename already renamed properties", () => {
    compare("obj.foo", "obj.__FOO__", {
      rename: { foo: "__FOO__", __FOO__: "foo" }
    });
  });
});
