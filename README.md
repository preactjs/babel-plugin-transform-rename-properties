# babel-plugin-transform-rename-properties ![](https://github.com/preactjs/babel-plugin-transform-rename-properties/workflows/tests/badge.svg) [![npm](https://img.shields.io/npm/v/babel-plugin-transform-rename-properties.svg)](https://www.npmjs.com/package/babel-plugin-transform-rename-properties)

Rename JavaScript properties.

## Installation

```
$ yarn add --dev babel-plugin-transform-rename-properties
```

## Example

Input file:

```js
const obj = {
  foo: {
    bar: 1
  },
  quux() {
    return 2;
  }
};

const { foo } = obj;

function quux(obj) {
  return obj.foo.bar + obj.quux();
}
```

`.babelrc`:

```json
{
  "plugins": [
    [
      "babel-plugin-transform-rename-properties",
      {
        "rename": {
          "foo": "__FOO__",
          "quux": "I HAVE SPACES"
        }
      }
    ]
  ]
}
```

Output:

```js
const obj = {
  __FOO__: {
    bar: 1
  },
  "I HAVE SPACES"() {
    return 2;
  }
};

const { __FOO__: foo } = obj;

function quux(obj) {
  return obj.__FOO__.bar + obj["I HAVE SPACES"]();
}
```

## License

This plugin is licensed under the MIT license. See [LICENSE](./LICENSE).
