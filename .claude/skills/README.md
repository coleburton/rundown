# Claude Skills

This directory contains custom Claude Code skills that can be invoked during development.

## Available Skills

### `/security-audit` - Pre-Commit Security Scanner

Scans staged changes for security vulnerabilities before committing.

**Usage:**
```bash
# Stage your changes
git add .

# Run security audit
/security-audit
```

**What it checks:**
- ✅ Sensitive files being committed (`.env`, credentials, private keys)
- ✅ Hardcoded secrets in code (API keys, passwords, tokens)
- ✅ Security anti-patterns (disabled SSL, debug mode in production)

**Example output:**
```
🔒 Security Audit Report
========================

⚠️ CRITICAL: Sensitive file being committed
📄 File: .env
🔍 Issue: Environment file contains secrets
💡 Fix: Add .env to .gitignore and remove from staging

---
Summary:
❌ CRITICAL: 1
🚫 UNSAFE TO COMMIT
```

## Integration with Git Hooks (Optional)

You can add the security audit to your pre-commit hook to run automatically.

See `.husky/pre-commit` for the current hook configuration.

## Creating New Skills

Skills are markdown files with frontmatter:

```markdown
---
name: my-skill
description: What this skill does
userInvocable: true
---

Instructions for Claude on how to execute this skill...
```

Place new skills in `.claude/skills/` and add them to `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Skill(my-skill)"
    ]
  }
}
```
