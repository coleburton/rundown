#!/usr/bin/env node

/**
 * Pre-commit security scanner
 * Scans staged changes for security issues
 */

const { execSync } = require('child_process');
const fs = require('fs');

// ANSI color codes
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Get staged files
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

// Get diff for staged changes
function getStagedDiff() {
  try {
    return execSync('git diff --cached', { encoding: 'utf8' });
  } catch (error) {
    return '';
  }
}

// Security checks
const SENSITIVE_FILES = [
  /\.env$/,
  /\.env\.local$/,
  /\.env\.production$/,
  /\.env\.development$/,
  /credentials\.json$/i,
  /secrets\.json$/i,
  /\.pem$/,
  /\.key$/,
  /\.p12$/,
  /\.pfx$/,
  /id_rsa$/,
  /id_dsa$/,
];

const SECRET_PATTERNS = [
  { pattern: /(api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"][^'"]{10,}['"]/gi, name: 'API Key' },
  { pattern: /(password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi, name: 'Password' },
  { pattern: /(bearer|token|auth[_-]?token)\s*[:=]\s*['"][^'"]{10,}['"]/gi, name: 'Auth Token' },
  { pattern: /(sk_live|pk_live|sk_test|pk_test)_[a-zA-Z0-9]{20,}/g, name: 'Stripe Key' },
  { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
  { pattern: /(re_[a-zA-Z0-9]{32,})/g, name: 'Resend API Key' },
  { pattern: /(postgresql|mysql):\/\/[^:]+:[^@]+@/gi, name: 'Database URL with credentials' },
  { pattern: /-----BEGIN (RSA )?PRIVATE KEY-----/g, name: 'Private Key' },
  { pattern: /(client[_-]?secret|refresh[_-]?token)\s*[:=]\s*['"][^'"]+['"]/gi, name: 'OAuth Secret' },
];

const ANTI_PATTERNS = [
  { pattern: /verify\s*[:=]\s*false/gi, name: 'SSL Verification Disabled' },
  { pattern: /rejectUnauthorized\s*[:=]\s*false/gi, name: 'SSL Verification Disabled' },
  { pattern: /NODE_ENV\s*[:=]\s*['"]development['"]/g, name: 'Development mode in production code' },
  { pattern: /TODO.*security/gi, name: 'Security TODO comment' },
  { pattern: /FIXME.*security/gi, name: 'Security FIXME comment' },
];

// Main security scan
function runSecurityScan() {
  console.log(`\n${BOLD}🔒 Security Audit Report${RESET}`);
  console.log('========================\n');

  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    console.log(`${GREEN}✅ No staged files to scan${RESET}`);
    return true;
  }

  console.log(`Scanning ${stagedFiles.length} staged file(s)...\n`);

  const issues = [];

  // Check 1: Sensitive files
  stagedFiles.forEach(file => {
    SENSITIVE_FILES.forEach(pattern => {
      if (pattern.test(file)) {
        issues.push({
          severity: 'CRITICAL',
          file: file,
          issue: `Sensitive file being committed`,
          fix: `Add ${file} to .gitignore and remove from staging: git rm --cached ${file}`
        });
      }
    });
  });

  // Check 2: Hardcoded secrets in diff
  const diff = getStagedDiff();
  const diffLines = diff.split('\n');

  diffLines.forEach((line, index) => {
    // Only check added lines (starting with +)
    if (!line.startsWith('+')) return;

    SECRET_PATTERNS.forEach(({ pattern, name }) => {
      const matches = line.match(pattern);
      if (matches) {
        // Find the file this line belongs to
        let currentFile = '';
        for (let i = index; i >= 0; i--) {
          if (diffLines[i].startsWith('+++')) {
            currentFile = diffLines[i].substring(6); // Remove '+++ b/'
            break;
          }
        }

        issues.push({
          severity: 'HIGH',
          file: currentFile,
          issue: `Hardcoded ${name} detected`,
          code: line.substring(1, Math.min(line.length, 80)).trim() + (line.length > 80 ? '...' : ''),
          fix: `Move to environment variables or secure secret management`
        });
      }
    });

    // Check for anti-patterns
    ANTI_PATTERNS.forEach(({ pattern, name }) => {
      if (pattern.test(line)) {
        let currentFile = '';
        for (let i = index; i >= 0; i--) {
          if (diffLines[i].startsWith('+++')) {
            currentFile = diffLines[i].substring(6);
            break;
          }
        }

        issues.push({
          severity: 'MEDIUM',
          file: currentFile,
          issue: name,
          code: line.substring(1, Math.min(line.length, 80)).trim(),
          fix: `Review and fix security anti-pattern`
        });
      }
    });
  });

  // Report issues
  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
  const highCount = issues.filter(i => i.severity === 'HIGH').length;
  const mediumCount = issues.filter(i => i.severity === 'MEDIUM').length;

  if (issues.length > 0) {
    issues.forEach(issue => {
      const color = issue.severity === 'CRITICAL' ? RED : issue.severity === 'HIGH' ? RED : YELLOW;
      console.log(`${color}⚠️  ${issue.severity}: ${issue.issue}${RESET}`);
      console.log(`${BLUE}📄 File:${RESET} ${issue.file}`);
      if (issue.code) {
        console.log(`${BLUE}🔍 Code:${RESET} ${issue.code}`);
      }
      console.log(`${BLUE}💡 Fix:${RESET} ${issue.fix}`);
      console.log('');
    });

    console.log('---');
    console.log(`${BOLD}Summary:${RESET}`);
    if (criticalCount > 0) console.log(`${RED}❌ CRITICAL: ${criticalCount}${RESET}`);
    if (highCount > 0) console.log(`${RED}❌ HIGH: ${highCount}${RESET}`);
    if (mediumCount > 0) console.log(`${YELLOW}⚠️  MEDIUM: ${mediumCount}${RESET}`);
    console.log('');

    if (criticalCount > 0 || highCount > 0) {
      console.log(`${RED}${BOLD}🚫 COMMIT BLOCKED - Fix critical/high severity issues before committing${RESET}\n`);
      return false;
    } else {
      console.log(`${YELLOW}⚠️  Warning: Medium severity issues found. Review before committing.${RESET}\n`);
      return true; // Allow commit with warnings
    }
  } else {
    console.log(`${GREEN}✅ No security issues detected${RESET}`);
    console.log(`${GREEN}✅ Safe to commit${RESET}\n`);
    return true;
  }
}

// Run scan
const passed = runSecurityScan();
process.exit(passed ? 0 : 1);
