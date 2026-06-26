# Teacher Update Guide

## What you edit each week

Edit only this file unless you are changing weeks:

```text
civics-daily/news/week01.json
```

## What each day needs

Each weekday story needs:

- `headline`
- `image`
- `quickFacts`
- `summary`
- `vocabulary` with 3 terms
- `question` with 4 answer choices
- `reflection`
- `connections`
- `takeaway`

## Recommended reading level

Aim for:

- 8th–10th grade reading level
- 2–3 short paragraphs
- 3 quick facts
- 3 vocabulary words
- 1 simple multiple-choice question
- 1 civic reflection question

## Weekly theme examples

- How Government Affects Daily Life
- Rights and Responsibilities
- How Laws Are Made
- Federal vs. State Government
- Elections and Voting
- The Courts and the Constitution
- Public Policy in Our Community

## Simple story template

```json
{
  "day": "Monday",
  "date": "September 9, 2026",
  "focus": "Congress",
  "focusIcon": "🏛",
  "headline": "Headline Here",
  "image": "image-url-here",
  "imageAlt": "Describe the image",
  "quickFacts": [
    "Fact one.",
    "Fact two.",
    "Fact three."
  ],
  "summary": [
    "Short paragraph one.",
    "Short paragraph two.",
    "Short paragraph three."
  ],
  "vocabulary": [
    {"term":"Word One", "match":"Student-friendly meaning."},
    {"term":"Word Two", "match":"Student-friendly meaning."},
    {"term":"Word Three", "match":"Student-friendly meaning."}
  ],
  "question": {
    "prompt": "Question here?",
    "options": ["Correct answer", "Wrong answer", "Wrong answer", "Wrong answer"],
    "answerIndex": 0,
    "correctFeedback": "Correct explanation.",
    "incorrectFeedback": "Helpful correction."
  },
  "reflection": {
    "prompt": "Why does this matter?",
    "keywords": ["citizens", "law", "community"],
    "shortFeedback": "Add one more sentence.",
    "strongFeedback": "Strong civic connection.",
    "coachingFeedback": "Try using one vocabulary word."
  },
  "connections": ["Rights", "Laws", "Citizenship"],
  "takeaway": "One-sentence civic takeaway."
}
```
