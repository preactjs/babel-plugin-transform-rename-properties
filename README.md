# babel-plugin-transform-rename-properties

Rename JavaScript properties.

## Installation

```
$ yarn add --dev babel-plugin-transform-rename-properties
```

## Example

Input file:

```js
function foo(obj) {
  return obj.foo.bar + obj.quux;
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
function foo(obj) {
  return obj.__FOO__.bar + obj["I HAVE SPACES"];
}
```

## License

This plugin is licensed under the MIT license. See [LICENSE](./LICENSE).
