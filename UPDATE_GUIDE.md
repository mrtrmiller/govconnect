# GovConnect Daily: Weekly Update Guide

## Weekly routine

1. Come back to ChatGPT and ask:
   `Update GovConnect Daily for next week for Unit __ content. Keep summaries factual only. Give me the updated news.json file.`

2. Download the new `news.json` file.

3. Go to your GitHub repository for GovConnect.

4. Open the existing `news.json` file.

5. Click the pencil/edit button or upload/replace the file.

6. Paste the new JSON or drag the replacement file into GitHub.

7. Commit the change.

8. Open your Google Site and refresh the embedded GovConnect page.

## What usually changes weekly

Only this file changes:

`news.json`

These files should usually stay the same:

- `index.html`
- `style.css`
- `script.js`

## Required format

The weekly file must keep this structure:

```json
{
  "weekTitle": "Unit 1: Foundations of American Democracy",
  "updated": "2026-06-26",
  "rotationMode": "weekday",
  "days": [
    {
      "date": "2026-06-29",
      "weekday": "Monday",
      "title": "Article title",
      "source": "News source",
      "link": "https://source-link.com/article",
      "summary": "Factual summary only.",
      "keyPeople": "People or groups involved.",
      "coreIssue": "Central disagreement or issue.",
      "unit": "Unit 1: Foundations of American Democracy",
      "topic": "Topic label",
      "vocabMatch": [
        {"term":"Federalism", "clue":"Article detail that matches the term."}
      ],
      "visualSteps": ["Step 1", "Step 2", "Step 3"],
      "timeline": ["Timeline item 1", "Timeline item 2"],
      "questions": {
        "q3":"Question 3 text",
        "q5":"Question 5 text",
        "q7":"Question 7 text",
        "q9":"Question 9 text"
      },
      "mcq": {
        "question":"Multiple choice question",
        "choices":["A", "B", "C", "D"],
        "answer":"A"
      }
    }
  ]
}
```

## Troubleshooting

- If the page looks unchanged, wait a minute and refresh.
- If the page breaks, check that the JSON file has no missing commas or quotation marks.
- If you open the folder directly from your computer, `news.json` may not load. Test it through GitHub Pages.
