module.exports = {
    "settings": {
      "import/resolver": "webpack"
    },
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:jest/recommended",
      "plugin:import/errors",
      "plugin:import/warnings"
    ],
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        },
        "allowImportExportEverywhere": true,
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "jest",
        "import"
    ],
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "never"
        ],
        "no-unused-vars": [
            2, {"args": "all", "argsIgnorePattern": "^_"}
        ],
        "react/prop-types": ["off"],
        "no-debugger": "off",
        "no-console": "off"
    }
};
