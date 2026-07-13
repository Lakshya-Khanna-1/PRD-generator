/** Legal page content, kept as markdown so it renders through the same MarkdownDoc component as everything else. */

export const LEGAL_LAST_UPDATED = "July 12, 2026";

export const TERMS_MD = `*Last updated: ${LEGAL_LAST_UPDATED}*

## Who operates SpecForge

SpecForge is operated by Lakshya Khanna. Questions about these terms can be sent to [lakshya1khanna@gmail.com](mailto:lakshya1khanna@gmail.com).

## What SpecForge does

SpecForge takes an app idea you describe and uses AI models to generate a set of specification documents (spec.md, tasks.md, agents.md) for you to download and use. It's provided as a free tool.

## Your content

You own what you type in and what SpecForge generates for you. You're responsible for how you use the generated documents — SpecForge doesn't review or endorse the accuracy of any generated content.

## Acceptable use

Don't use SpecForge to generate content for illegal purposes, to abuse the generation endpoints beyond normal use (automated scraping, bulk requests designed to bypass rate limits), or to attempt to extract or reverse-engineer the underlying prompts or models in a way that disrupts the service for others.

## No warranty

SpecForge is provided "as is," without warranty of any kind. AI-generated content can be wrong, incomplete, or inconsistent — always review generated specs before relying on them. SpecForge is not liable for decisions made based on generated content.

## Availability

SpecForge is a free tool with no uptime guarantee. Features, rate limits, and available models may change without notice.

## Governing law

These terms are governed by the applicable law of your jurisdiction of residence, to the extent your jurisdiction's law requires that protection.

## Changes to these terms

If these terms change materially, the "Last updated" date above will change. Continued use after an update means you accept the revised terms.
`;

export const PRIVACY_MD = `*Last updated: ${LEGAL_LAST_UPDATED}*

## What SpecForge collects

- **The idea you type and your answers to clarification questions** — sent to generate your documents (see "Who processes your data" below). Not stored persistently by SpecForge after your session ends; there's currently no account system or database.
- **Your IP address** — used only for short-lived, in-memory rate limiting to prevent abuse. Not logged to persistent storage or shared with anyone.

SpecForge does not currently have user accounts, sign-in, or any way to save your generations across sessions — closing or refreshing the tab clears everything.

## Who processes your data

Your idea, clarification answers, and any regeneration requests are sent to [OpenRouter](https://openrouter.ai) and, through it, to whichever underlying AI model provider SpecForge is currently configured to use for generation. Refer to \`.env.example\` in the project for the exact models in use at any given time; as of this writing that includes providers such as DeepSeek, Z.AI (GLM), and Google (Gemini, used only as an automatic fallback if the primary provider is unavailable). These providers process your submitted text to generate a response; SpecForge does not control their data retention practices beyond what's disclosed in their own policies.

## What SpecForge does not do

- Does not sell your data.
- Does not use your submitted ideas for advertising or profiling.
- Does not run third-party analytics or ad trackers.

## Cookies

SpecForge does not use tracking or advertising cookies.

## Changes to this policy

If this policy changes materially, the "Last updated" date above will change.

## Contact

Questions about this policy can be sent to [lakshya1khanna@gmail.com](mailto:lakshya1khanna@gmail.com).
`;
