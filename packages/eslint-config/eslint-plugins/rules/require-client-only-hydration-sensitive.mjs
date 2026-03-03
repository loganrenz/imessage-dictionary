/**
 * atx/require-client-only-hydration-sensitive
 *
 * UNavigationMenu, UColorModeButton, UColorModeSelect (and similar) depend on
 * localStorage or matchMedia and must be wrapped in <ClientOnly> to prevent
 * SSR/client mismatch. See: check-ssr-hydration-safety workflow.
 */

import { defineTemplateBodyVisitor } from '../utils.mjs'

const HYDRATION_SENSITIVE = [
  'UNavigationMenu',
  'u-navigation-menu',
  'UColorModeButton',
  'u-color-mode-button',
  'UColorModeSelect',
  'u-color-mode-select',
]

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require hydration-sensitive UI (UNavigationMenu, UColorMode*) to be wrapped in <ClientOnly>',
      category: 'ATX Design System',
    },
    messages: {
      requireClientOnly:
        '{{ name }} should be wrapped in <ClientOnly> to avoid SSR/hydration mismatch. Add <ClientOnly> with a #fallback slot.',
    },
    schema: [],
  },

  create(context) {
    if (!context.filename.endsWith('.vue')) return {}

    const visitor = {}
    const fn = (node) => {
      let parent = node.parent
      while (parent) {
        if (
          parent.type === 'VElement' &&
          (parent.name === 'ClientOnly' || parent.name === 'client-only')
        ) {
          return
        }
        parent = parent.parent
      }
      const name = node.name || 'Component'
      context.report({
        node: node.startTag,
        messageId: 'requireClientOnly',
        data: { name },
      })
    }
    for (const name of HYDRATION_SENSITIVE) {
      visitor[`VElement[name="${name}"]`] = fn
    }

    return defineTemplateBodyVisitor(context, visitor)
  },
}
