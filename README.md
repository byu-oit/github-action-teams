# ![BYU logo](https://www.hscripts.com/freeimages/logos/university-logos/byu/byu-logo-clipart-128.gif) github-action-teams
A GitHub Action for sending Microsoft Teams notifications

## Usage
- [Create an Incoming Webhook in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook#create-an-incoming-webhook) and copy the URL
- [Create a GitHub secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository), `MS_TEAMS_WEBHOOK_URL`, using the copied URL
- At the end of a job that runs on `push` or `pull_request`, add the following step

```yaml
- name: Teams Notification
  uses: byu-oit/github-action-teams@v3
  if: always()
  with:
    status: ${{ job.status }}
    webhook-url: ${{ secrets.MS_TEAMS_WEBHOOK_URL }}
```

## Example

<img src="https://github.com/byu-oit/github-action-teams/raw/staging/images/example.png" width="500">
