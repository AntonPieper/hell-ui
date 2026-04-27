import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'projects/hell-docs/src/app';
const FIX = process.argv.includes('--fix');

const RULES = [
  rule('hellButton', 'HellButton'),
  rule('hellTag', 'HellTag'),
  rule('hellBadge', 'HellBadge'),
  rule('hellKbd', 'HellKbd'),
  rule('hellInput', 'HellInput'),
  rule('hellSelect', 'HellSelect'),
  rule('hellTextarea', 'HellTextarea'),
  rule('hellCheckbox', 'HellCheckbox'),
  rule('hellSwitch', 'HellSwitch'),
  rule('hellRadioGroup', 'HellRadioGroup'),
  rule('hellRadio', 'HellRadio'),
  rule('ngpRadioIndicator', 'HellRadioIndicator'),
  rule('hellToggle', 'HellToggle'),
  rule('hellToggleGroup', 'HellToggleGroup'),
  rule('hellToggleGroupItem', 'HellToggleGroupItem'),
  rule('hellSkeleton', 'HellSkeleton'),
  rule('hellSpinner', 'HellSpinner'),
  rule('hellSeparator', 'HellSeparator'),
  rule('hellProgress', 'HellProgress'),
  rule('hellProgressBar', 'HellProgressBar'),
  rule('hellDropzone', 'HellDropZone'),
  rule('hellFlyoutTrigger', 'HellFlyoutTrigger'),
  rule('hellFlyout', 'HellFlyout'),
  rule('hellPopoverTrigger', 'HellPopoverTrigger'),
  rule('hellPopover', 'HellPopover'),
  rule('hellTooltipTrigger', 'HellTooltipTrigger'),
  rule('hellTooltip', 'HellTooltip'),
  groupRule('hellAccordion', 'HELL_ACCORDION_DIRECTIVES'),
  groupRule('hellAccordionItem', 'HELL_ACCORDION_DIRECTIVES'),
  groupRule('hellAccordionTrigger', 'HELL_ACCORDION_DIRECTIVES'),
  groupRule('hellAccordionContent', 'HELL_ACCORDION_DIRECTIVES'),
  groupRule('hellAppShell', 'HELL_APP_SHELL_DIRECTIVES'),
  groupRule('hellAppTopbar', 'HELL_APP_SHELL_DIRECTIVES'),
  groupRule('hellAppSidenav', 'HELL_APP_SHELL_DIRECTIVES'),
  groupRule('hellAppContent', 'HELL_APP_SHELL_DIRECTIVES'),
  groupRule('hellSidenavToggle', 'HELL_APP_SHELL_DIRECTIVES'),
  groupRule('hellSecondaryToggle', 'HELL_APP_SHELL_DIRECTIVES'),
  groupRule('hellAppSecondary', 'HELL_APP_SHELL_DIRECTIVES'),
  groupRule('hellAppSecondaryBody', 'HELL_APP_SHELL_DIRECTIVES'),
  groupRule('hellAvatarGroup', 'HELL_AVATAR_GROUP_DIRECTIVES'),
  groupRule('hellAvatarGroupItem', 'HELL_AVATAR_GROUP_DIRECTIVES'),
  groupRule('hellAvatarGroupOverflow', 'HELL_AVATAR_GROUP_DIRECTIVES'),
  groupRule('hellBreadcrumbs', 'HELL_BREADCRUMBS_DIRECTIVES'),
  groupRule('hellBreadcrumbList', 'HELL_BREADCRUMBS_DIRECTIVES'),
  groupRule('hellBreadcrumbItem', 'HELL_BREADCRUMBS_DIRECTIVES'),
  groupRule('hellBreadcrumbLink', 'HELL_BREADCRUMBS_DIRECTIVES'),
  groupRule('hellBreadcrumbPage', 'HELL_BREADCRUMBS_DIRECTIVES'),
  groupRule('hellBreadcrumbSeparator', 'HELL_BREADCRUMBS_DIRECTIVES'),
  groupRule('hellBreadcrumbEllipsis', 'HELL_BREADCRUMBS_DIRECTIVES'),
  groupRule('hellCard', 'HELL_CARD_DIRECTIVES'),
  groupRule('hellCardHeader', 'HELL_CARD_DIRECTIVES'),
  groupRule('hellCardBody', 'HELL_CARD_DIRECTIVES'),
  groupRule('hellCardFooter', 'HELL_CARD_DIRECTIVES'),
  groupRule('hellDialogTrigger', 'HELL_DIALOG_DIRECTIVES'),
  groupRule('hellDialogOverlay', 'HELL_DIALOG_DIRECTIVES'),
  groupRule('hellDialogScope', 'HELL_DIALOG_DIRECTIVES'),
  groupRule('hellDialog', 'HELL_DIALOG_DIRECTIVES'),
  groupRule('hellDialogTitle', 'HELL_DIALOG_DIRECTIVES'),
  groupRule('hellDialogDescription', 'HELL_DIALOG_DIRECTIVES'),
  groupRule('hellField', 'HELL_FIELD_DIRECTIVES'),
  groupRule('hellFieldLabel', 'HELL_FIELD_DIRECTIVES'),
  groupRule('hellFieldDescription', 'HELL_FIELD_DIRECTIVES'),
  groupRule('hellFieldError', 'HELL_FIELD_DIRECTIVES'),
  groupRule('hellMenuTrigger', 'HELL_MENU_DIRECTIVES'),
  groupRule('hellSubmenuTrigger', 'HELL_MENU_DIRECTIVES'),
  groupRule('hellMenu', 'HELL_MENU_DIRECTIVES'),
  groupRule('hellMenuItem', 'HELL_MENU_DIRECTIVES'),
  groupRule('hellMenuSeparator', 'HELL_MENU_DIRECTIVES'),
  groupRule('hellMenuSection', 'HELL_MENU_DIRECTIVES'),
  groupRule('hellMenuLabel', 'HELL_MENU_DIRECTIVES'),
  groupRule('hellMenuItemIcon', 'HELL_MENU_DIRECTIVES'),
  groupRule('hellMenuItemTrailing', 'HELL_MENU_DIRECTIVES'),
  groupRule('hellResizable', 'HELL_RESIZABLE_DIRECTIVES'),
  groupRule('hellResizablePane', 'HELL_RESIZABLE_DIRECTIVES'),
  groupRule('hellResizableHandle', 'HELL_RESIZABLE_DIRECTIVES'),
  groupRule('hellTabset', 'HELL_TABS_DIRECTIVES'),
  groupRule('hellTabList', 'HELL_TABS_DIRECTIVES'),
  groupRule('hellTab', 'HELL_TABS_DIRECTIVES'),
  groupRule('hellTabPanel', 'HELL_TABS_DIRECTIVES'),
];

function rule(attribute, symbol) {
  return {
    attribute,
    preferred: symbol,
    allowed: [symbol],
    regex: attributeRegex(attribute),
  };
}

function groupRule(attribute, symbol) {
  return {
    attribute,
    preferred: `...${symbol}`,
    allowed: [`...${symbol}`, symbol],
    regex: attributeRegex(attribute),
  };
}

function attributeRegex(attribute) {
  return new RegExp(`<[^>]*(?:\\s|\\[)${attribute}(?:\\]|\\s|=|>)`, 'm');
}

function allTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return allTsFiles(filePath);
    return entry.name.endsWith('.ts') ? [filePath] : [];
  });
}

function findMatching(source, start, open, close) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === '`' || char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  throw new Error(`No closing ${close} found`);
}

function splitTopLevelArray(arraySource) {
  const body = arraySource.slice(1, -1);
  const items = [];
  let start = 0;
  let parens = 0;
  let brackets = 0;
  let braces = 0;
  let quote = null;
  let escaped = false;

  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === '`' || char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '(') parens += 1;
    else if (char === ')') parens -= 1;
    else if (char === '[') brackets += 1;
    else if (char === ']') brackets -= 1;
    else if (char === '{') braces += 1;
    else if (char === '}') braces -= 1;
    else if (char === ',' && parens === 0 && brackets === 0 && braces === 0) {
      const item = body.slice(start, i).trim();
      if (item) items.push(item);
      start = i + 1;
    }
  }

  const item = body.slice(start).trim();
  if (item) items.push(item);
  return items;
}

function componentObject(source) {
  const componentIndex = source.indexOf('@Component');
  if (componentIndex === -1) return null;
  const objectStart = source.indexOf('{', source.indexOf('(', componentIndex));
  const objectEnd = findMatching(source, objectStart, '{', '}');
  return { start: objectStart, end: objectEnd, text: source.slice(objectStart, objectEnd + 1) };
}

function arrayProperty(objectSource, property) {
  const match = new RegExp(`${property}\\s*:\\s*\\[`).exec(objectSource);
  if (!match) return null;
  const start = objectSource.indexOf('[', match.index);
  const end = findMatching(objectSource, start, '[', ']');
  return { start, end, text: objectSource.slice(start, end + 1) };
}

function templateText(objectSource) {
  const templateIndex = objectSource.indexOf('template: `');
  if (templateIndex === -1) return null;
  const start = objectSource.indexOf('`', templateIndex);
  let escaped = false;

  for (let i = start + 1; i < objectSource.length; i += 1) {
    const char = objectSource[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '`') return objectSource.slice(start + 1, i);
  }

  return null;
}

function namedHellImports(source) {
  const imports = new Set();
  for (const match of source.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]hell['"]/g)) {
    for (const rawName of match[1].split(',')) {
      const name = rawName
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) imports.add(name);
    }
  }
  return imports;
}

function ensureHellImport(source, symbol) {
  if (namedHellImports(source).has(symbol)) return source;

  const hellImport = /import\s+\{([^}]+)\}\s+from\s+['"]hell['"];/.exec(source);
  if (hellImport) {
    const next = `import { ${hellImport[1].trim()}, ${symbol} } from 'hell';`;
    return (
      source.slice(0, hellImport.index) +
      next +
      source.slice(hellImport.index + hellImport[0].length)
    );
  }

  return source.replace(/(@Component\s*\()/, `import { ${symbol} } from 'hell';\n\n$1`);
}

const failures = [];
let fixed = 0;

for (const file of allTsFiles(ROOT)) {
  let source = fs.readFileSync(file, 'utf8');
  const component = componentObject(source);
  if (!component) continue;

  const template = templateText(component.text);
  if (template === null) continue;

  const importsArray = arrayProperty(component.text, 'imports');
  if (!importsArray) continue;

  const importItems = splitTopLevelArray(importsArray.text);
  const missing = RULES.filter((item) => {
    if (!item.regex.test(template)) return false;
    return !item.allowed.some((allowed) => importItems.includes(allowed));
  });

  if (!missing.length) continue;

  if (!FIX) {
    for (const item of missing) {
      failures.push(`${file}: missing ${item.preferred} for ${item.attribute}`);
    }
    continue;
  }

  for (const item of missing) {
    importItems.push(item.preferred);
    const symbol = item.preferred.startsWith('...') ? item.preferred.slice(3) : item.preferred;
    source = ensureHellImport(source, symbol);
  }

  const refreshedComponent = componentObject(source);
  const refreshedImportsArray = arrayProperty(refreshedComponent.text, 'imports');
  const nextArray = `[${[...new Set(importItems)].join(', ')}]`;
  source =
    source.slice(0, refreshedComponent.start + refreshedImportsArray.start) +
    nextArray +
    source.slice(refreshedComponent.start + refreshedImportsArray.end + 1);

  fs.writeFileSync(file, source);
  fixed += missing.length;
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

if (FIX) console.log(`Fixed ${fixed} missing docs imports.`);
else console.log('Docs imports verified.');
