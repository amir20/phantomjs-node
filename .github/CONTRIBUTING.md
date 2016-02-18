# Contribution Guide

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This page describes how to contribute to `phantom` npm package.

Do not create a pull request or issue without reading this first.

## Issues
Do not create issues to ask questions. Issues are not a question and answer forum. Issue are to be created when expected outcome is different than actual. Provide example code, expected behavior and actual behavior.

Explain the problem and include additional details to help maintainers reproduce the problem:

* Use a clear descriptive title
* Describe the exact steps to reproduce the problem. Provide as much as detail as possible.
* Provide short code examples.
* Describe the behavior you observed after following the steps.
* Explain which behavior you expected to see instead and why.
* Provide an example of execution with `DEBUG=true`. An example, `DEBUG=true node path/to/file.js`

For feature requests, provide all the same detail except steps to reproduce if not applicable.

## Pull Requests
Pull request are welcomed. Please make sure the following has been done:

* Create a new branch by doing `git checkout -b new_feature master`
* Add new test cases to test new functionality
* Make sure that your tests pass with `npm test`
* Commit with a clear message that explains what the commit does
* Issue a pull request and make sure that TravisCI is green
