# Teams Notification
This GitHub Action sends a notification to Teams saying if the pipeline was successful or not.
This GitHub action can be part of existing GitHub action pipelines.

# Usage
Checkout the "usage.yml" file to see exactly how you would use this action.
This action has 2 formats, the "v1" tag and the "test" tag. The "v1" tag results in a message with
links to the repository and a page comparing the changes in the most recent commit.
The "test" tag results in a message with information about the repo but no links

# Results
This is what the "v1" tag message looks like
![v1 results](v1.png)

This is what the "test" tag message looks like
![test results](test.png)