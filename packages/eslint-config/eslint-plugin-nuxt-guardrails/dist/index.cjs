'use strict';

var fs = require('fs');
var path = require('path');
var url = require('url');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
// src/utils/spec-loader.ts
function getDirname() {
  try {
    return path.dirname(url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href))));
  } catch {
    try {
      return __dirname$1;
    } catch {
      return process.cwd();
    }
  }
}
var __dirname$1 = getDirname();
var cachedSpec = null;
function loadSpec(specPath) {
  if (cachedSpec) {
    return cachedSpec;
  }
  const possiblePaths = [
    specPath,
    path.join(__dirname$1, "../spec/nuxt4-spec.json"),
    // dist/spec (after build)
    path.join(__dirname$1, "../../src/spec/nuxt4-spec.json"),
    // src/spec (dev)
    path.join(process.cwd(), "eslint-plugin-nuxt-guardrails/src/spec/nuxt4-spec.json"),
    // from project root
    path.join(process.cwd(), "eslint-plugin-nuxt-guardrails/dist/spec/nuxt4-spec.json")
    // from project root dist
  ].filter(Boolean);
  let path$1 = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      path$1 = p;
      break;
    }
  }
  if (!path$1) {
    return {
      version: "4.2.2",
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      apis: {},
      deprecations: {}
    };
  }
  const content = fs.readFileSync(path$1, "utf-8");
  cachedSpec = JSON.parse(content);
  return cachedSpec;
}
function getApiSpec(apiName, specPath) {
  const spec = loadSpec(specPath);
  return spec.apis[apiName] || null;
}

// src/rules/no-legacy-head.ts
var no_legacy_head_default = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow legacy Options API head() method or head option",
      category: "Best Practices",
      recommended: true
    },
    fixable: "code",
    schema: [],
    messages: {
      legacyHeadMethod: "Use useHead() composable instead of head() method. See: {{docUrl}}",
      legacyHeadOption: "Use useHead() composable instead of head option. See: {{docUrl}}"
    }
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices;
    if (!parserServices || !parserServices.defineTemplateBodyVisitor) {
      return {};
    }
    const useHeadSpec = getApiSpec("useHead");
    const docUrl = useHeadSpec?.docUrl || "https://nuxt.com/docs/api/composables/use-head";
    return parserServices.defineTemplateBodyVisitor(
      {},
      {
        // Check script block for Options API patterns
        "Program:exit"(node) {
          for (const statement of node.body) {
            if (statement.type === "ExportDefaultDeclaration" && statement.declaration && statement.declaration.type === "ObjectExpression") {
              const obj = statement.declaration;
              for (const prop of obj.properties) {
                if (prop.type === "Property" && prop.key && (prop.key.type === "Identifier" && prop.key.name === "head" || prop.key.type === "Literal" && prop.key.value === "head")) {
                  if (prop.method) continue;
                  context.report({
                    node: prop,
                    messageId: "legacyHeadOption",
                    data: { docUrl }
                  });
                }
              }
            }
          }
        },
        // Check for head() method
        'Property[key.name="head"]'(node) {
          if (node.method && node.parent?.type === "ObjectExpression" && node.parent.parent?.type === "ExportDefaultDeclaration") {
            context.report({
              node,
              messageId: "legacyHeadMethod",
              data: { docUrl }
            });
          }
        }
      }
    );
  }
};

// src/rules/no-legacy-fetch-hook.ts
var no_legacy_fetch_hook_default = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow legacy Nuxt 2 fetch() hook",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      legacyFetch: "Use useFetch() or useAsyncData() instead of fetch() hook. See: {{docUrl}}"
    }
  },
  create(context) {
    const parserServices = context.sourceCode?.parserServices;
    if (!parserServices || !parserServices.defineTemplateBodyVisitor) {
      return {};
    }
    const useFetchSpec = getApiSpec("useFetch");
    const useAsyncDataSpec = getApiSpec("useAsyncData");
    const docUrl = useFetchSpec?.docUrl || useAsyncDataSpec?.docUrl || "https://nuxt.com/docs/api/composables/use-fetch";
    return parserServices.defineTemplateBodyVisitor(
      {},
      {
        // Check for fetch() method in Options API
        'Property[key.name="fetch"]'(node) {
          if (node.method && node.parent?.type === "ObjectExpression" && node.parent.parent?.type === "ExportDefaultDeclaration") {
            context.report({
              node,
              messageId: "legacyFetch",
              data: { docUrl }
            });
          }
        }
      }
    );
  }
};

// src/rules/no-raw-fetch.ts
var DOC_URL = "https://nuxt.com/docs/api/composables/use-fetch";
var no_raw_fetch_default = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow raw $fetch in script \u2014 use useAsyncData or useFetch for SSR-safe data fetching",
      category: "Best Practices",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          /** When true, run the rule regardless of filename (for testing). */
          testMode: { type: "boolean", default: false }
        },
        additionalProperties: false
      }
    ],
    messages: {
      rawFetch: "Raw $fetch causes double-fetch and hydration issues. Use useAsyncData() or useFetch() instead. See: " + DOC_URL
    }
  },
  create(context) {
    const options = context.options[0];
    const testMode = options?.testMode === true;
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!testMode && normalized) {
      const inPages = normalized.includes("/app/pages/");
      const inComponents = normalized.includes("/app/components/");
      if (!inPages && !inComponents) return {};
      if (normalized.includes("e2e/") || normalized.includes(".spec.") || normalized.includes(".test.")) return {};
    }
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee) return;
        const name = callee.type === "Identifier" ? callee.name : callee.type === "MemberExpression" && callee.property?.type === "Identifier" ? callee.property.name : null;
        if (name !== "$fetch") return;
        context.report({
          node: callee,
          messageId: "rawFetch"
        });
      }
    };
  }
};

// src/utils/ast-utils.ts
function isInClientContext(node, _context) {
  let current = node.parent;
  while (current) {
    if (current.type === "IfStatement" && current.test && (isImportMetaClient(current.test) || isImportMetaServer(current.test))) {
      return isImportMetaClient(current.test);
    }
    if (current.type === "IfStatement" && current.test && current.test.type === "UnaryExpression" && current.test.operator === "!" && isImportMetaClient(current.test.argument)) {
      return true;
    }
    if (current.type === "CallExpression" && current.callee && (current.callee.name === "onMounted" || current.callee.name === "onUnmounted" || current.callee.name === "onBeforeUnmount" || current.callee.name === "onUpdated" || current.callee.name === "onBeforeUpdate")) {
      return true;
    }
    current = current.parent;
  }
  return false;
}
function isImportMetaClient(node) {
  return node.type === "MemberExpression" && node.object && node.object.type === "MetaProperty" && node.object.meta && node.object.meta.name === "import" && node.object.property && node.object.property.name === "meta" && node.property && node.property.name === "client";
}
function isImportMetaServer(node) {
  return node.type === "MemberExpression" && node.object && node.object.type === "MetaProperty" && node.object.meta && node.object.meta.name === "import" && node.object.property && node.object.property.name === "meta" && node.property && node.property.name === "server";
}
function isProcessClient(node) {
  return node.type === "MemberExpression" && node.object && node.object.type === "Identifier" && node.object.name === "process" && node.property && node.property.name === "client";
}
function isProcessServer(node) {
  return node.type === "MemberExpression" && node.object && node.object.type === "Identifier" && node.object.name === "process" && node.property && node.property.name === "server";
}
function isDomAccess(node) {
  if (node.type !== "MemberExpression") {
    return { type: null, member: null };
  }
  if (node.object && node.object.type === "Identifier" && node.object.name === "window") {
    return {
      type: "window",
      member: node.property && node.property.name ? node.property.name : null
    };
  }
  if (node.object && node.object.type === "Identifier" && node.object.name === "document") {
    return {
      type: "document",
      member: node.property && node.property.name ? node.property.name : null
    };
  }
  if (node.object && node.object.type === "Identifier" && node.object.name === "localStorage") {
    return {
      type: "localStorage",
      member: node.property && node.property.name ? node.property.name : null
    };
  }
  return { type: null, member: null };
}
function isLiteral(node) {
  return node.type === "Literal" || node.type === "TemplateLiteral";
}

// src/rules/prefer-import-meta-client.ts
var prefer_import_meta_client_default = {
  meta: {
    type: "suggestion",
    docs: {
      description: "prefer import.meta.client/server over process.client/server",
      category: "Best Practices",
      recommended: true
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          allowProcessClientServer: {
            type: "boolean",
            default: false
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      preferImportMetaClient: "Use import.meta.client instead of process.client. See: https://nuxt.com/docs/4.x/guide/concepts/rendering",
      preferImportMetaServer: "Use import.meta.server instead of process.server. See: https://nuxt.com/docs/4.x/guide/concepts/rendering"
    }
  },
  create(context) {
    const options = context.options[0] || {};
    const allowProcessClientServer = options.allowProcessClientServer || false;
    if (allowProcessClientServer) {
      return {};
    }
    return {
      MemberExpression(node) {
        if (isProcessClient(node)) {
          context.report({
            node,
            messageId: "preferImportMetaClient",
            fix(fixer) {
              return fixer.replaceText(node, "import.meta.client");
            }
          });
        } else if (isProcessServer(node)) {
          context.report({
            node,
            messageId: "preferImportMetaServer",
            fix(fixer) {
              return fixer.replaceText(node, "import.meta.server");
            }
          });
        }
      }
    };
  }
};

// src/rules/prefer-import-meta-dev.ts
var prefer_import_meta_dev_default = {
  meta: {
    type: "suggestion",
    docs: {
      description: "prefer import.meta.dev over process.env.NODE_ENV for Vite/Nitro and Cloudflare Workers",
      category: "Best Practices",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          /** When true, run the rule regardless of filename (for testing). */
          testMode: { type: "boolean", default: false }
        },
        additionalProperties: false
      }
    ],
    messages: {
      useImportMetaDev: "Use import.meta.dev instead of process.env.NODE_ENV (reliable in Workers/Vite)."
    }
  },
  create(context) {
    const options = context.options[0];
    const testMode = options?.testMode === true;
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!testMode && normalized && !normalized.includes("/server/") && !normalized.includes("/app/")) {
      return {};
    }
    return {
      MemberExpression(node) {
        const obj = node.object;
        const prop = node.property;
        if (obj?.type === "MemberExpression" && obj.object?.type === "Identifier" && obj.object.name === "process" && obj.property?.type === "Identifier" && obj.property.name === "env" && prop?.type === "Identifier" && prop.name === "NODE_ENV") {
          context.report({
            node,
            messageId: "useImportMetaDev"
          });
        }
      }
    };
  }
};

// src/rules/no-ssr-dom-access.ts
var no_ssr_dom_access_default = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow unguarded DOM access in server context",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      unguardedDomAccess: "Unguarded {{type}} access may cause SSR errors. Use onMounted() or guard with import.meta.client. See: https://nuxt.com/docs/4.x/guide/concepts/rendering"
    }
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const parserServices = context.sourceCode?.parserServices ?? context.parserServices;
    if (filename.includes(".client.") || filename.includes(".client/")) {
      return {};
    }
    if (filename.includes("e2e/") || filename.includes(".spec.ts") || filename.includes(".test.ts")) {
      return {};
    }
    const isVueFile = filename.endsWith(".vue");
    return {
      MemberExpression(node) {
        if (isVueFile && parserServices && parserServices.getTemplateBodyTokenStore) {
          let current2 = node.parent;
          while (current2) {
            if (current2.type && current2.type.startsWith("V")) {
              return;
            }
            current2 = current2.parent;
          }
        }
        const domInfo = isDomAccess(node);
        if (!domInfo.type) {
          return;
        }
        if (isInClientContext(node)) {
          return;
        }
        let checkNode = node;
        while (checkNode) {
          if (checkNode.type === "BlockStatement" && checkNode.body) {
            const nodePos = node.range ? node.range[0] : null;
            if (nodePos) {
              for (const stmt of checkNode.body) {
                if (!stmt.range) continue;
                if (stmt.range[0] > nodePos) break;
                if (stmt.type === "IfStatement" && stmt.test && stmt.test.type === "UnaryExpression" && stmt.test.operator === "!" && isImportMetaClient(stmt.test.argument) && (stmt.consequent.type === "ReturnStatement" || stmt.consequent.type === "BlockStatement" && stmt.consequent.body.some((s) => s.type === "ReturnStatement"))) {
                  return;
                }
                if (stmt.type === "IfStatement" && stmt.test && stmt.test.type === "LogicalExpression" && (stmt.test.left && stmt.test.left.type === "UnaryExpression" && stmt.test.left.operator === "!" && isImportMetaClient(stmt.test.left.argument) || stmt.test.right && stmt.test.right.type === "UnaryExpression" && stmt.test.right.operator === "!" && isImportMetaClient(stmt.test.right.argument)) && (stmt.consequent.type === "ReturnStatement" || stmt.consequent.type === "BlockStatement" && stmt.consequent.body.some((s) => s.type === "ReturnStatement"))) {
                  return;
                }
              }
            }
            break;
          }
          if (checkNode.type === "FunctionDeclaration" || checkNode.type === "FunctionExpression" || checkNode.type === "ArrowFunctionExpression") {
            const body = checkNode.body;
            if (body && body.type === "BlockStatement" && body.body) {
              const nodePos = node.range ? node.range[0] : null;
              if (nodePos) {
                for (const stmt of body.body) {
                  if (!stmt.range) continue;
                  if (stmt.range[0] > nodePos) break;
                  if (stmt.type === "IfStatement" && stmt.test && stmt.test.type === "UnaryExpression" && stmt.test.operator === "!" && isImportMetaClient(stmt.test.argument) && (stmt.consequent.type === "ReturnStatement" || stmt.consequent.type === "BlockStatement" && stmt.consequent.body.some((s) => s.type === "ReturnStatement"))) {
                    return;
                  }
                  if (stmt.type === "IfStatement" && stmt.test && stmt.test.type === "LogicalExpression" && (stmt.test.left && stmt.test.left.type === "UnaryExpression" && stmt.test.left.operator === "!" && isImportMetaClient(stmt.test.left.argument) || stmt.test.right && stmt.test.right.type === "UnaryExpression" && stmt.test.right.operator === "!" && isImportMetaClient(stmt.test.right.argument)) && (stmt.consequent.type === "ReturnStatement" || stmt.consequent.type === "BlockStatement" && stmt.consequent.body.some((s) => s.type === "ReturnStatement"))) {
                    return;
                  }
                }
              }
              break;
            }
          }
          checkNode = checkNode.parent;
        }
        let current = node.parent;
        while (current) {
          if (current.type === "ArrowFunctionExpression") {
            const body = current.body;
            if (body && body.type === "BlockStatement") {
              for (const stmt of body.body) {
                if (stmt.range && node.range && stmt.range[0] <= node.range[0] && stmt.range[1] >= node.range[1]) {
                  break;
                }
                if (stmt.type === "IfStatement" && stmt.test && stmt.test.type === "UnaryExpression" && stmt.test.operator === "!" && isImportMetaClient(stmt.test.argument) && (stmt.consequent.type === "ReturnStatement" || stmt.consequent.type === "BlockStatement" && stmt.consequent.body.some((s) => s.type === "ReturnStatement"))) {
                  return;
                }
              }
            } else if (body && body.type === "ConditionalExpression") {
              if (body.test && body.test.type === "UnaryExpression" && body.test.operator === "!" && isImportMetaClient(body.test.argument)) {
                return;
              }
            }
          }
          if (current.type === "CallExpression" && current.callee && current.callee.name === "computed") {
            const arg = current.arguments && current.arguments[0];
            if (arg && arg.type === "ArrowFunctionExpression") {
              const body = arg.body;
              if (body && body.type === "BlockStatement") {
                for (const stmt of body.body) {
                  if (stmt.range && node.range && stmt.range[0] <= node.range[0] && stmt.range[1] >= node.range[1]) {
                    break;
                  }
                  if (stmt.type === "IfStatement" && stmt.test && stmt.test.type === "UnaryExpression" && stmt.test.operator === "!" && isImportMetaClient(stmt.test.argument) && (stmt.consequent.type === "ReturnStatement" || stmt.consequent.type === "BlockStatement" && stmt.consequent.body.some((s) => s.type === "ReturnStatement"))) {
                    return;
                  }
                }
              }
            }
          }
          if (current.type === "IfStatement" && current.test) {
            if (isImportMetaClient(current.test)) {
              return;
            }
            if (current.test.type === "LogicalExpression" && (isImportMetaClient(current.test.left) || isImportMetaClient(current.test.right))) {
              return;
            }
          }
          current = current.parent;
        }
        context.report({
          node,
          messageId: "unguardedDomAccess",
          data: { type: domInfo.type }
        });
      }
    };
  }
};

// src/rules/valid-useAsyncData.ts
function isValidAsyncDataKey(node) {
  if (isLiteral(node)) {
    return true;
  }
  if (node.type === "ArrowFunctionExpression") {
    const body = node.body;
    if (body && (body.type === "Literal" || body.type === "TemplateLiteral")) {
      return true;
    }
    if (body && body.type === "BlockStatement" && body.body) {
      for (const stmt of body.body) {
        if (stmt.type === "ReturnStatement" && stmt.argument) {
          if (stmt.argument.type === "Literal" || stmt.argument.type === "TemplateLiteral") {
            return true;
          }
        }
      }
    }
    return false;
  }
  if (node.type === "FunctionExpression") {
    const body = node.body;
    if (body && body.type === "BlockStatement" && body.body) {
      for (const stmt of body.body) {
        if (stmt.type === "ReturnStatement" && stmt.argument) {
          if (stmt.argument.type === "Literal" || stmt.argument.type === "TemplateLiteral") {
            return true;
          }
        }
      }
    }
    return false;
  }
  if (node.type === "Identifier") {
    return false;
  }
  return false;
}
var valid_useAsyncData_default = {
  meta: {
    type: "problem",
    docs: {
      description: "enforce valid useAsyncData usage",
      category: "Best Practices",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          requireStableAsyncDataKeys: {
            type: "boolean",
            default: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingCallback: "useAsyncData requires a callback function as second argument. See: {{docUrl}}",
      missingKey: "useAsyncData requires a key as first argument. See: {{docUrl}}",
      keyNotLiteral: "useAsyncData key should be a string literal for stable caching. See: {{docUrl}}",
      callbackReturnsNothing: "useAsyncData callback should return a value. See: {{docUrl}}"
    }
  },
  create(context) {
    const options = context.options[0] || {};
    const requireStableKeys = options.requireStableAsyncDataKeys !== false;
    const useAsyncDataSpec = getApiSpec("useAsyncData");
    const docUrl = useAsyncDataSpec?.docUrl || "https://nuxt.com/docs/api/composables/use-async-data";
    return {
      CallExpression(node) {
        if (!node.callee || node.callee.type !== "Identifier" && node.callee.type !== "MemberExpression" || node.callee.type === "Identifier" && node.callee.name !== "useAsyncData" || node.callee.type === "MemberExpression" && node.callee.property && node.callee.property.name !== "useAsyncData") {
          return;
        }
        const args = node.arguments || [];
        if (args.length === 0) {
          context.report({
            node,
            messageId: "missingKey",
            data: { docUrl }
          });
          return;
        }
        if (requireStableKeys && !isValidAsyncDataKey(args[0])) {
          context.report({
            node: args[0],
            messageId: "keyNotLiteral",
            data: { docUrl }
          });
        }
        if (args.length < 2) {
          context.report({
            node,
            messageId: "missingCallback",
            data: { docUrl }
          });
          return;
        }
        const callback = args[1];
        if (callback.type !== "ArrowFunctionExpression" && callback.type !== "FunctionExpression") {
          context.report({
            node: callback,
            messageId: "missingCallback",
            data: { docUrl }
          });
          return;
        }
        if (callback.body) {
          const hasReturn = (body) => {
            if (body.type === "BlockStatement") {
              for (const stmt of body.body) {
                if (stmt.type === "ReturnStatement") {
                  return true;
                }
                if (stmt.type === "IfStatement" && stmt.consequent) {
                  if (hasReturn(stmt.consequent)) return true;
                  if (stmt.alternate && hasReturn(stmt.alternate)) return true;
                }
              }
              return false;
            }
            return body.type !== "BlockStatement";
          };
          if (callback.body.type === "BlockStatement" && !hasReturn(callback.body)) ;
        }
      }
    };
  }
};

// src/rules/valid-useFetch.ts
var valid_useFetch_default = {
  meta: {
    type: "problem",
    docs: {
      description: "enforce valid useFetch usage",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      missingUrl: "useFetch requires a URL as first argument. See: {{docUrl}}",
      invalidOptions: "useFetch options may be invalid. See: {{docUrl}}"
    }
  },
  create(context) {
    const useFetchSpec = getApiSpec("useFetch");
    const docUrl = useFetchSpec?.docUrl || "https://nuxt.com/docs/api/composables/use-fetch";
    return {
      CallExpression(node) {
        if (!node.callee || node.callee.type !== "Identifier" && node.callee.type !== "MemberExpression" || node.callee.type === "Identifier" && node.callee.name !== "useFetch" || node.callee.type === "MemberExpression" && node.callee.property && node.callee.property.name !== "useFetch") {
          return;
        }
        const args = node.arguments || [];
        if (args.length === 0) {
          context.report({
            node,
            messageId: "missingUrl",
            data: { docUrl }
          });
          return;
        }
        const urlArg = args[0];
        if (urlArg.type !== "Literal" && urlArg.type !== "TemplateLiteral" && urlArg.type !== "ArrowFunctionExpression" && urlArg.type !== "FunctionExpression") ;
        if (args.length > 1 && args[1].type === "ObjectExpression" && useFetchSpec?.options) {
          const options = args[1];
          const validOptionKeys = new Set(Object.keys(useFetchSpec.options));
          for (const prop of options.properties) {
            if (prop.type === "Property" && prop.key && prop.key.type === "Identifier") {
              const key = prop.key.name;
              const commonOptions = /* @__PURE__ */ new Set(["server", "default", "key", "lazy", "immediate", "watch", "getCachedData", "pick", "transform"]);
              if (!validOptionKeys.has(key) && !commonOptions.has(key)) ;
            }
          }
        }
      }
    };
  }
};
var app_structure_consistency_default = {
  meta: {
    type: "suggestion",
    docs: {
      description: "enforce consistent directory structure",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          projectStyle: {
            type: "string",
            enum: ["app-dir", "mixed", "legacy", "auto"],
            default: "auto"
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      conflictingStructure: "Found both app/pages/ and pages/ directories. This may cause routing conflicts. Prefer app/ structure for Nuxt 4. See: https://nuxt.com/docs/4.x/guide/directory-structure/app"
    }
  },
  create(context) {
    const options = context.options[0] || {};
    const projectStyle = options.projectStyle || "auto";
    let hasChecked = false;
    return {
      "Program:exit"(node) {
        if (hasChecked || projectStyle === "legacy") {
          return;
        }
        hasChecked = true;
        const cwd = context.getCwd ? context.getCwd() : process.cwd();
        const appPagesExists = fs.existsSync(path.join(cwd, "app/pages"));
        const rootPagesExists = fs.existsSync(path.join(cwd, "pages"));
        if (appPagesExists && rootPagesExists && projectStyle !== "mixed") {
          context.report({
            node,
            messageId: "conflictingStructure"
          });
        }
      }
    };
  }
};

// src/rules/require-use-seo-on-pages.ts
var require_use_seo_on_pages_default = {
  meta: {
    type: "problem",
    docs: {
      description: "require useSeo() in app/pages/*.vue for consistent SEO",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      missingUseSeo: "Page must call useSeo() for title, description, and OG image. See template SEO docs."
    }
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!normalized.includes("/app/pages/") || !normalized.endsWith(".vue")) return {};
    let hasUseSeo = false;
    return {
      CallExpression(node) {
        const name = node.callee?.type === "Identifier" ? node.callee.name : null;
        if (name === "useSeo") hasUseSeo = true;
      },
      "Program:exit"(node) {
        if (!hasUseSeo) {
          context.report({
            node,
            messageId: "missingUseSeo"
          });
        }
      }
    };
  }
};

// src/rules/prefer-use-seo-over-bare-meta.ts
var BARE_META = /* @__PURE__ */ new Set(["useSeoMeta", "useHead"]);
var prefer_use_seo_over_bare_meta_default = {
  meta: {
    type: "suggestion",
    docs: {
      description: "prefer useSeo() over bare useSeoMeta/useHead in pages",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      preferUseSeo: "Use useSeo() instead of {{ name }}() for consistent SEO. See template SEO docs."
    }
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!normalized.includes("/app/pages/") || !normalized.endsWith(".vue")) return {};
    return {
      CallExpression(node) {
        const name = node.callee?.type === "Identifier" ? node.callee.name : null;
        if (name && BARE_META.has(name)) {
          context.report({
            node: node.callee,
            messageId: "preferUseSeo",
            data: { name }
          });
        }
      }
    };
  }
};

// src/rules/require-schema-on-pages.ts
var SCHEMA_COMPOSABLES = /* @__PURE__ */ new Set([
  "useWebPageSchema",
  "useArticleSchema",
  "useProductSchema",
  "useOrganizationSchema",
  "usePersonSchema",
  "useBreadcrumbSchema",
  "useFAQSchema",
  "useLocalBusinessSchema",
  "useSchemaOrg"
  // raw nuxt-schema-org composable
]);
var require_schema_on_pages_default = {
  meta: {
    type: "problem",
    docs: {
      description: "require a Schema.org composable in app/pages/*.vue",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      missingSchema: "Page should call a Schema.org composable (e.g. useWebPageSchema, useArticleSchema). See template SEO docs."
    }
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!normalized.includes("/app/pages/") || !normalized.endsWith(".vue")) return {};
    let hasSchema = false;
    return {
      CallExpression(node) {
        const name = node.callee?.type === "Identifier" ? node.callee.name : null;
        if (name && SCHEMA_COMPOSABLES.has(name)) hasSchema = true;
      },
      "Program:exit"(node) {
        if (!hasSchema) {
          context.report({
            node,
            messageId: "missingSchema"
          });
        }
      }
    };
  }
};

// src/rules/no-map-async-in-server.ts
var no_map_async_in_server_default = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow .map(async in server code \u2014 use batched queries to avoid N+1",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      mapAsync: '.map(async ...) in server code often causes N+1 queries. Prefer batched queries (e.g. .in("id", ids)).'
    }
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!normalized.includes("/server/")) return {};
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== "MemberExpression") return;
        const prop = callee.property;
        if (prop?.type !== "Identifier" || prop.name !== "map") return;
        const args = node.arguments;
        if (args.length === 0) return;
        const first = args[0];
        if (!first || first.type !== "ArrowFunctionExpression" && first.type !== "FunctionExpression") return;
        if (first.async) {
          context.report({
            node: callee.property,
            messageId: "mapAsync"
          });
        }
      }
    };
  }
};

// src/rules/no-raw-fetch-in-stores.ts
var no_raw_fetch_in_stores_default = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow $fetch/useFetch in app/stores \u2014 use useAppFetch or useRequestFetch",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      rawFetchInStore: "Stores must use useAppFetch() or useRequestFetch() for SSR cookie/auth proxying. Avoid $fetch/useFetch in app/stores/."
    }
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!normalized.includes("/app/stores/") || !normalized.endsWith(".ts")) return {};
    return {
      CallExpression(node) {
        const callee = node.callee;
        const name = callee?.type === "Identifier" ? callee.name : callee?.type === "MemberExpression" && callee.property?.type === "Identifier" ? callee.property.name : null;
        if (name !== "$fetch" && name !== "useFetch") return;
        context.report({
          node: callee,
          messageId: "rawFetchInStore"
        });
      }
    };
  }
};

// src/rules/plugin-suffix-for-browser-apis.ts
var BROWSER_GLOBALS = /* @__PURE__ */ new Set([
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator"
]);
function referencesBrowserApi(node) {
  if (node.type === "MemberExpression") {
    const name = node.object?.type === "Identifier" ? node.object.name : null;
    if (name && BROWSER_GLOBALS.has(name)) return true;
  }
  return false;
}
var plugin_suffix_for_browser_apis_default = {
  meta: {
    type: "problem",
    docs: {
      description: "plugins using browser APIs must use .client.ts suffix",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      useClientSuffix: "This plugin uses browser APIs (window/document/storage/navigator). Use a .client.ts suffix so it only runs on the client."
    }
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!normalized.includes("/app/plugins/") || !normalized.endsWith(".ts")) return {};
    if (normalized.includes(".client.") || normalized.includes(".server.")) return {};
    let hasBrowserApi = false;
    return {
      MemberExpression(node) {
        if (referencesBrowserApi(node)) hasBrowserApi = true;
      },
      "Program:exit"(node) {
        if (hasBrowserApi) {
          context.report({
            node,
            messageId: "useClientSuffix"
          });
        }
      }
    };
  }
};

// src/rules/no-non-serializable-store-state.ts
var no_non_serializable_store_state_default = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow ref<Map>/ref<Set>/new Map()/new Set() in app/stores for SSR serialization",
      category: "Best Practices",
      recommended: true
    },
    schema: [],
    messages: {
      nonSerializable: "Store state must be serializable for SSR. Avoid Map, Set, Date, or class instances. Use plain objects/arrays or shallowRef + skipHydrate if needed."
    }
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!normalized.includes("/app/stores/") || !normalized.endsWith(".ts")) return {};
    function isMapOrSetType(node) {
      if (node?.type === "TSTypeReference" && node.typeName?.type === "Identifier") {
        const n = node.typeName.name;
        return n === "Map" || n === "Set";
      }
      return false;
    }
    return {
      // ref<Map>, ref<Set> — ref() call with type args
      CallExpression(node) {
        const callee = node.callee;
        const name = callee?.type === "Identifier" ? callee.name : null;
        if (name !== "ref" && name !== "shallowRef") return {};
        const typeArgs = node.typeArguments?.params ?? node.typeParameters?.params ?? [];
        for (const t of typeArgs) {
          if (isMapOrSetType(t)) {
            context.report({ node: callee, messageId: "nonSerializable" });
            return;
          }
        }
      },
      // new Map(), new Set()
      NewExpression(node) {
        const name = node.callee?.type === "Identifier" ? node.callee.name : null;
        if (name === "Map" || name === "Set") {
          context.report({ node: node.callee, messageId: "nonSerializable" });
        }
      }
    };
  }
};

// src/rules/require-csrf-header-on-mutations.ts
var MUTATION_METHODS = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH", "DELETE"]);
function isMutationMethod(node) {
  if (!node) return false;
  if (node.type === "Literal" && typeof node.value === "string") {
    return MUTATION_METHODS.has(node.value.toUpperCase());
  }
  if (node.type === "TemplateLiteral" && node.expressions.length === 0 && node.quasis.length === 1) {
    return MUTATION_METHODS.has(node.quasis[0].value.raw.toUpperCase());
  }
  return false;
}
function hasXRequestedWithHeader(headersNode) {
  if (!headersNode) return false;
  if (headersNode.type === "ObjectExpression") {
    return headersNode.properties.some((prop) => {
      if (prop.type !== "Property") return false;
      const key = prop.key;
      const keyName = key.type === "Identifier" ? key.name : key.type === "Literal" ? key.value : null;
      return keyName === "X-Requested-With";
    });
  }
  if (headersNode.type === "Identifier") return true;
  if (headersNode.type === "ObjectExpression") {
    return headersNode.properties.some((p) => p.type === "SpreadElement");
  }
  return false;
}
var require_csrf_header_on_mutations_default = {
  meta: {
    type: "problem",
    docs: {
      description: "mutation $fetch calls in composables must include X-Requested-With header for CSRF protection",
      category: "Security",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          testMode: { type: "boolean", default: false }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingCsrf: "Mutation $fetch calls in composables must include { headers: { 'X-Requested-With': 'XMLHttpRequest' } } for CSRF protection, or use useNuxtApp().$csrfFetch."
    }
  },
  create(context) {
    const options = context.options[0];
    const testMode = options?.testMode === true;
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!testMode && normalized) {
      if (!normalized.includes("/app/composables/")) return {};
      if (!normalized.endsWith(".ts")) return {};
    }
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee) return;
        const name = callee.type === "Identifier" ? callee.name : null;
        if (name !== "$fetch") return;
        if (node.arguments.length < 2) return;
        const optionsArg = node.arguments[1];
        if (!optionsArg || optionsArg.type !== "ObjectExpression") return;
        const methodProp = optionsArg.properties.find(
          (p) => p.type === "Property" && (p.key.type === "Identifier" && p.key.name === "method" || p.key.type === "Literal" && p.key.value === "method")
        );
        if (!methodProp) return;
        if (!isMutationMethod(methodProp.value)) return;
        const headersProp = optionsArg.properties.find(
          (p) => p.type === "Property" && (p.key.type === "Identifier" && p.key.name === "headers" || p.key.type === "Literal" && p.key.value === "headers")
        );
        if (!headersProp || !hasXRequestedWithHeader(headersProp.value)) {
          context.report({
            node: callee,
            messageId: "missingCsrf"
          });
        }
      }
    };
  }
};

// src/rules/no-csrf-exempt-route-misuse.ts
var EXEMPT_PREFIXES = ["/api/webhooks/", "/api/cron/", "/api/callbacks/"];
function matchesExemptPrefix(filepath) {
  const normalized = filepath.replace(/\\/g, "/");
  return EXEMPT_PREFIXES.some((prefix) => {
    const serverPrefix = `server${prefix}`;
    return normalized.includes(serverPrefix);
  });
}
var no_csrf_exempt_route_misuse_default = {
  meta: {
    type: "suggestion",
    docs: {
      description: "routes under CSRF-exempt prefixes should validate a shared secret or signature",
      category: "Security",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          testMode: { type: "boolean", default: false }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingSecretValidation: "Routes under /api/webhooks/, /api/cron/, or /api/callbacks/ bypass CSRF protection. Ensure this route validates a shared secret or signature via getHeader(). If this is user-facing, move it outside the exempt prefix."
    }
  },
  create(context) {
    const options = context.options[0];
    const testMode = options?.testMode === true;
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!testMode && !matchesExemptPrefix(normalized)) return {};
    let hasReadBody = false;
    let hasGetHeader = false;
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee) return;
        const name = callee.type === "Identifier" ? callee.name : null;
        if (name === "readBody") hasReadBody = true;
        if (name === "getHeader") hasGetHeader = true;
      },
      "Program:exit"(node) {
        if (hasReadBody && !hasGetHeader) {
          context.report({
            node,
            messageId: "missingSecretValidation"
          });
        }
      }
    };
  }
};

// src/rules/no-fetch-create-bypass.ts
var no_fetch_create_bypass_default = {
  meta: {
    type: "problem",
    docs: {
      description: "$fetch.create() bypasses the layer CSRF header injection \u2014 use $csrfFetch instead",
      category: "Security",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          testMode: { type: "boolean", default: false }
        },
        additionalProperties: false
      }
    ],
    messages: {
      fetchCreateBypass: "$fetch.create() bypasses the layer's CSRF header injection. Use useNuxtApp().$csrfFetch or the globally patched $fetch instead."
    }
  },
  create(context) {
    const options = context.options[0];
    const testMode = options?.testMode === true;
    const filename = context.filename ?? context.getFilename?.() ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (!testMode) {
      if (!normalized.includes("/app/")) return {};
      if (normalized.includes("plugins/fetch.client.")) return {};
      if (normalized.includes(".test.") || normalized.includes(".spec.") || normalized.includes("e2e/")) return {};
    }
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== "MemberExpression") return;
        const obj = callee.object;
        const prop = callee.property;
        if (obj?.type === "Identifier" && obj.name === "$fetch" && prop?.type === "Identifier" && prop.name === "create") {
          context.report({
            node: callee,
            messageId: "fetchCreateBypass"
          });
        }
      }
    };
  }
};

// src/index.ts
var index_default = {
  meta: {
    name: "eslint-plugin-nuxt-guardrails",
    version: "1.0.0"
  },
  rules: {
    "no-legacy-head": no_legacy_head_default,
    "no-legacy-fetch-hook": no_legacy_fetch_hook_default,
    "no-raw-fetch": no_raw_fetch_default,
    "prefer-import-meta-client": prefer_import_meta_client_default,
    "prefer-import-meta-dev": prefer_import_meta_dev_default,
    "no-ssr-dom-access": no_ssr_dom_access_default,
    "valid-useAsyncData": valid_useAsyncData_default,
    "valid-useFetch": valid_useFetch_default,
    "app-structure-consistency": app_structure_consistency_default,
    "require-use-seo-on-pages": require_use_seo_on_pages_default,
    "prefer-use-seo-over-bare-meta": prefer_use_seo_over_bare_meta_default,
    "require-schema-on-pages": require_schema_on_pages_default,
    "no-map-async-in-server": no_map_async_in_server_default,
    "no-raw-fetch-in-stores": no_raw_fetch_in_stores_default,
    "plugin-suffix-for-browser-apis": plugin_suffix_for_browser_apis_default,
    "no-non-serializable-store-state": no_non_serializable_store_state_default,
    "require-csrf-header-on-mutations": require_csrf_header_on_mutations_default,
    "no-csrf-exempt-route-misuse": no_csrf_exempt_route_misuse_default,
    "no-fetch-create-bypass": no_fetch_create_bypass_default
  },
  configs: {
    recommended: {
      plugins: ["nuxt-guardrails"],
      rules: {
        "nuxt-guardrails/no-legacy-head": "warn",
        "nuxt-guardrails/no-legacy-fetch-hook": "error",
        "nuxt-guardrails/no-raw-fetch": "error",
        "nuxt-guardrails/prefer-import-meta-client": "warn",
        "nuxt-guardrails/prefer-import-meta-dev": "warn",
        "nuxt-guardrails/no-ssr-dom-access": "error",
        "nuxt-guardrails/valid-useAsyncData": "warn",
        "nuxt-guardrails/valid-useFetch": "warn",
        "nuxt-guardrails/app-structure-consistency": "warn",
        "nuxt-guardrails/require-use-seo-on-pages": "warn",
        "nuxt-guardrails/prefer-use-seo-over-bare-meta": "warn",
        "nuxt-guardrails/require-schema-on-pages": "warn",
        "nuxt-guardrails/no-map-async-in-server": "warn",
        "nuxt-guardrails/no-raw-fetch-in-stores": "error",
        "nuxt-guardrails/plugin-suffix-for-browser-apis": "error",
        "nuxt-guardrails/no-non-serializable-store-state": "warn",
        "nuxt-guardrails/require-csrf-header-on-mutations": "error",
        "nuxt-guardrails/no-csrf-exempt-route-misuse": "warn",
        "nuxt-guardrails/no-fetch-create-bypass": "error"
      }
    }
  }
};

module.exports = index_default;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map