import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/kit/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@base-ui/react",
                "@base-ui/react/*",
                "@base-ui-components/react",
                "@base-ui-components/react/*",
                "@radix-ui/*",
                "radix-ui",
              ],
              message: "Import interactive primitives from src/components/kit. Base UI stays inside the kit.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='button']",
          message: "Use Button, IconButton, or Toggle from the kit.",
        },
        {
          selector: "JSXOpeningElement[name.name='input']",
          message: "Use Input, Checkbox, Switch, or a kit uploader.",
        },
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: "Use Select or SelectField from the kit.",
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message: "Use Textarea from the kit.",
        },
      ],
    },
  },
]);

export default eslintConfig;
