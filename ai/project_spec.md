# Project Specification

## Objective
Simple web application that, given a markdown file, will display a test suite and let the user go through each test and mark them as passed or failed. 

## Technology stack
- Frontend: Vanilla JS + tailwind

## Workflow
1. The user uploads a document:
   - Only `.md` files are allowed.
   - MD should contains all metadata such as name, author, version, date, description of the test suite.
2. The application parse the doc and displays all metadata in the top.
3. The application parse the doc and displays all test cases in a list.
4. For each test case the user can:
   - Mark as passed or failed or feedback
5. The user should be able to see the progress based on the number of test cases passed, failed or feedback.
6. Each test should be displayed in a card with the test name, description, status and feedback.
7. The user should be able to export the test results as a excel, md or excel file. The exported file will contains all test cases and their statuses.
8. Users should be able to save the test results and retrieve them later.