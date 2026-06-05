---
name: gsd-manual-url
description: "Capture a URL screenshot and generate a functional user manual. Run scripts/generate-url-manual.cjs <url> and document all features found."
---

<objective>
Given a URL, automatically generate a complete user manual with:
1. A full-page screenshot saved to MANUAIS_DE_TELA/screenshots/
2. A Markdown manual saved to MANUAIS_DE_TELA/ documenting all functions, buttons, links and sections found on the page
</objective>

<process>

## Step 1: Run the extraction script

```bash
node scripts/generate-url-manual.cjs "<URL>"
```

This will:
- Navigate to the URL using a headless Playwright browser
- Save a full-page screenshot to `MANUAIS_DE_TELA/screenshots/<safe_url_name>.png`
- Save extracted page data (title, headings, buttons, links) to `MANUAIS_DE_TELA/<safe_url_name>.json`

## Step 2: Read extracted data

Read the generated `.json` file from `MANUAIS_DE_TELA/`.

## Step 3: Generate manual

Using the extracted data and your knowledge of the page, write a comprehensive Markdown manual at:
`MANUAIS_DE_TELA/<descriptive_name>.md`

The manual must include:
- **Título e Propósito da Página** — O que esta página faz
- **Screenshot** — Embed the generated screenshot `![screenshot](./screenshots/<safe_url_name>.png)`
- **Funcionalidades Disponíveis** — List all buttons/actions and what they do
- **Navegação e Links** — All links found and where they go
- **Fluxo de Uso** — Step-by-step user journey for the main use case
- **Observações Técnicas** — Any notable behaviors, modals, forms

## Step 4: Report to user

Show a summary with:
- Path to the manual
- Path to the screenshot
- Count of features documented

</process>

<success_criteria>
- [ ] Screenshot exists in MANUAIS_DE_TELA/screenshots/
- [ ] JSON extraction file exists
- [ ] Markdown manual written with all sections
- [ ] Screenshot embedded in manual
- [ ] All major features documented
</success_criteria>
