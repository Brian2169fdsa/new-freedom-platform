module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "vitest.config.ts",
    "/coverage/**/*",
    "/src/maintenance/**/*",
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "max-lines": ["error", 100],
  },
  overrides: [
    {
      files: ["**/*.test.*"],
      env: {
        mocha: true,
      },
      rules: {
        "require-jsdoc": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-throw-literal": "off",
        "max-lines": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
  ],
};
