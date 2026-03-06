/**
 * Rule: nuxt-guardrails/require-schema-on-pages
 *
 * Every public page should call a Schema.org composable (useWebPageSchema, useArticleSchema, etc.).
 * See: check-seo-compliance workflow.
 */

import type { Rule } from 'eslint'

const SCHEMA_COMPOSABLES = new Set([
  'useWebPageSchema',
  'useArticleSchema',
  'useProductSchema',
  'useOrganizationSchema',
  'usePersonSchema',
  'useBreadcrumbSchema',
  'useFAQSchema',
  'useLocalBusinessSchema',
  'useSchemaOrg', // raw nuxt-schema-org composable
])

export default {
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'require a Schema.org composable in app/pages/*.vue',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      missingSchema:
        'Page should call a Schema.org composable (e.g. useWebPageSchema, useArticleSchema). See template SEO docs.',
    },
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const filename = context.filename ?? (context as any).getFilename?.() ?? ''
    const normalized = filename.replace(/\\/g, '/')
    if (!normalized.includes('/app/pages/') || !normalized.endsWith('.vue')) return {}

    let hasSchema = false

    return {
      CallExpression(node: any) {
        const name = node.callee?.type === 'Identifier' ? node.callee.name : null
        if (name && SCHEMA_COMPOSABLES.has(name)) hasSchema = true
      },
      'Program:exit'(node: any) {
        if (!hasSchema) {
          context.report({
            node,
            messageId: 'missingSchema',
          })
        }
      },
    }
  },
}
