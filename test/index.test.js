import t from "@babel/types";
import { transform } from "@babel/core";
import { parse } from "@babel/parser";
import { expect } from "chai";
import plugin from "../index.js";
import { describe, it } from "vitest";

function replace(input, options = {}) {
  return transform(input, {
    babelrc: false,
    configFile: false,
    plugins: [[plugin, options]],
  }).code;
}

function compare(input, output, options = {}) {
  const transformed = replace(input, options);

  if (!t.isNodesEquivalent(parse(transformed), parse(output))) {
    expect(transformed).to.equal(output);
  }
}

describe("babel-plugin-transform-rename-properties", () => {
  describe("for object member access", () => {
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
            bar: "__BAR__",
          },
        }
      );
    });

    it("renames properties from the middle", () => {
      compare("obj.foo.bar", "obj.__FOO__.bar", {
        rename: { foo: "__FOO__" },
      });
    });

    it("turns bad identifiers to computed props", () => {
      compare("obj.foo", "obj['bad identifier']", {
        rename: { foo: "bad identifier" },
      });
    });

    it("does not rename already renamed properties", () => {
      compare("obj.foo", "obj.__FOO__", {
        rename: { foo: "__FOO__", __FOO__: "foo" },
      });
    });

    it("does rename computed properties that are simple string literals", () => {
      compare("obj['foo']", "obj.__FOO__", {
        rename: { foo: "__FOO__" },
      });
    });

    it("does not rename computed properties that aren't simple string literals", () => {
      compare("obj[foo]", "obj[foo]", {
        rename: { foo: "__FOO__" },
      });
    });
  });

  describe("for object pattern properties", () => {
    it("replaces identifiers with identifiers when possible", () => {
      compare("const { foo: bar } = {}", "const { __FOO__: bar } = {}", {
        rename: { foo: "__FOO__" },
      });
    });
    it("replaces identifiers with string literals when necessary", () => {
      compare(
        "const { foo: bar } = {}",
        "const { 'I HAVE SPACES': bar } = {}",
        {
          rename: { foo: "I HAVE SPACES" },
        }
      );
    });
    it("replaces string literals with string literals", () => {
      compare("const { 'foo': bar } = {}", "const { '__FOO__': bar } = {}", {
        rename: { foo: "__FOO__" },
      });
    });
    it("preserves local variable names", () => {
      compare("const { foo } = {}", "const { __FOO__: foo } = {}", {
        rename: { foo: "__FOO__" },
      });
    });
    it("replaces computed properties that are simple string literals", () => {
      compare(
        "const { ['foo']: bar } = {}",
        "const { ['__FOO__']: bar } = {}",
        {
          rename: { foo: "__FOO__" },
        }
      );
    });
    it("preserves computed properties that are not simple string literals", () => {
      compare("const { [foo]: bar } = {}", "const { [foo]: bar } = {}", {
        rename: { foo: "__FOO__" },
      });
    });
  });

  describe("for object expressions", () => {
    it("replaces identifiers with identifiers when possible", () => {
      compare("const a = { foo: bar }", "const a = { __FOO__: bar }", {
        rename: { foo: "__FOO__" },
      });
    });
    it("replaces identifiers with string literals when necessary", () => {
      compare("const a = { foo: bar }", "const a = { 'I HAVE SPACES': bar }", {
        rename: { foo: "I HAVE SPACES" },
      });
    });
    it("replaces string literals with string literals", () => {
      compare("const a = { 'foo': bar }", "const a = { '__FOO__': bar }", {
        rename: { foo: "__FOO__" },
      });
    });
    it("replaces methods", () => {
      compare("const a = { foo() {} }", "const a = { __FOO__() {} }", {
        rename: { foo: "__FOO__" },
      });
    });
    it("replaces getters", () => {
      compare("const a = { get foo() {} }", "const a = { get __FOO__() {} }", {
        rename: { foo: "__FOO__" },
      });
    });
    it("replaces setters", () => {
      compare(
        "const a = { set foo(value) {} }",
        "const a = { set __FOO__(value) {} }",
        {
          rename: { foo: "__FOO__" },
        }
      );
    });
    it("replaces computed properties that are simple string literals", () => {
      compare("const a = { ['foo']: bar }", "const a = { ['__FOO__']: bar }", {
        rename: { foo: "__FOO__" },
      });
    });
    it("preserves computed properties that are not simple string literals", () => {
      compare("const a = { [foo]: bar }", "const a = { [foo]: bar }", {
        rename: { foo: "__FOO__" },
      });
    });
  });

  describe("for classes", () => {
    it("replaces methods", () => {
      compare("class A { foo() {} }", "class A { __FOO__() {} }", {
        rename: { foo: "__FOO__" },
      });
    });
    it("replaces getters", () => {
      compare("class A { get foo() {} }", "class A { get __FOO__() {} }", {
        rename: { foo: "__FOO__" },
      });
    });
    it("replaces setters", () => {
      compare(
        "class A { set foo(value) {} }",
        "class A { set __FOO__(value) {} }",
        {
          rename: { foo: "__FOO__" },
        }
      );
    });
    it("replaces computed method names that are simple string literals", () => {
      compare("class A { ['foo']() {} }", "class A { ['__FOO__']() {} }", {
        rename: { foo: "__FOO__" },
      });
    });
    it("preserves computed properties that are not simple string literals", () => {
      compare("class A { [foo]() {} }", "class A { [foo]() {} }", {
        rename: { foo: "__FOO__" },
      });
    });
  });
});
