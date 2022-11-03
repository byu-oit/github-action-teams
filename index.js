const { getInput, setFailed, info } = require('@actions/core')
const github = require('@actions/github')

// Polyfill fetch for Node.js 16
if (!global.fetch) {
  const nodeFetch = require('node-fetch')
  global.fetch = nodeFetch
  global.Headers = nodeFetch.Headers
  global.Request = nodeFetch.Request
  global.Response = nodeFetch.Response
}

// TODO: Use GitHub's icons (primer/octicons), which will require converting and colorizing the SVGs
function getImageUrl (status) {
  switch (status) {
    case 'success': return 'https://github.com/byu-oit/github-action-teams/raw/staging/images/checkmark-circle.png'
    case 'failure': return 'https://github.com/byu-oit/github-action-teams/raw/staging/images/x-circle.png'
    case 'neutral': return 'https://github.com/primer/octicons/blob/main/icons/square-fill-24.svg'
    case 'cancelled': return 'https://raw.githubusercontent.com/primer/octicons/main/icons/stop-24.svg'
    case 'skipped': return 'https://raw.githubusercontent.com/primer/octicons/main/icons/skip-24.svg'
    case 'timed_out': return 'https://github.com/byu-oit/github-action-teams/raw/staging/images/x-circle.png'
    case 'action_required': return 'https://github.com/byu-oit/github-action-teams/raw/staging/images/alert-outline.png'
    default: return 'https://raw.githubusercontent.com/primer/octicons/main/icons/question-24.svg'
  }
}

function getImageAltText (status) {
  switch (status) {
    case 'success': return 'Success'
    case 'failure': return 'Failure'
    case 'neutral': return 'Neutral'
    case 'cancelled': return 'Cancelled'
    case 'skipped': return 'Skipped'
    case 'timed_out': return 'Timed Out'
    case 'action_required': return 'Action Required'
    default: return 'Finished'
  }
}

function getStatusText (status) {
  switch (status) {
    case 'success': return 'was **successful**!'
    case 'failure': return '**failed**!'
    case 'neutral': return 'finished.'
    case 'cancelled': return 'was **cancelled**!'
    case 'skipped': return 'was **skipped**!'
    case 'timed_out': return '**timed out**!'
    case 'action_required': return '**requires action**!'
    default: return 'finished.'
  }
}

async function getFullName (githubUsername) {
  try {
    const response = await fetch(`https://api.github.com/users/${githubUsername}`, {
      method: 'GET',
      headers: { 'User-Agent': 'byu-oit/github-action-teams' } // GitHub requires a User-Agent, even if it's bogus
    })
    if (!response.ok) return '?'
    const { name } = await response.json()
    return name || '?'
  } catch (e) {
    return '?'
  }
}

const asteriskRegex = /\*/g
function removeAsterisks (string) {
  return string.replace(asteriskRegex, '')
}

async function run () {
  try {
    const { context: { eventName } } = github
    if (eventName !== 'push' && eventName !== 'pull_request') {
      setFailed('Events other than `push` and `pull_request` are not supported.')
      return
    }

    const status = getInput('status', { required: true })
    const webhookUrl = getInput('webhook-url', { required: true })

    const {
      context: {
        sha,
        workflow,
        actor: githubUsername,
        runId,
        runNumber,
        payload: {
          action, // Activity Type from https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request
          ref,
          head_commit: {
            message: headCommitMessage
          } = {},
          repository: {
            full_name: repoName
          },
          pull_request: {
            number: pullRequestNumber,
            title
          } = {}
        }
      }
    } = github
    const branch = (eventName === 'push')
      ? ref.slice('refs/heads/'.length) // ref = 'refs/heads/main'
      : github.context.payload.pull_request.head.ref // 'main'

    const message = (eventName === 'push')
      ? headCommitMessage.split('\n')[0]
      : title

    const fullName = await getFullName(githubUsername)

    const eventMessage = (eventName === 'push')
      ? `Commit [**${sha.substring(0, 8)}**](https://github.com/${repoName}/commit/${sha}) pushed`
      : `Pull request [**#${pullRequestNumber}**](https://github.com/${repoName}/pull/${pullRequestNumber}) ${action}`

    // Markdown links, with bolded text
    const workflowLink = `[**${removeAsterisks(workflow)}**](https://github.com/${repoName}/actions?query=workflow%3A"${encodeURIComponent(workflow)}")`
    const branchLink = `[**${removeAsterisks(branch)}**](https://github.com/${repoName}/tree/${branch})`
    const repoLink = `[**${removeAsterisks(repoName)}**](https://github.com/${repoName})`
    const githubUsernameLink = `[**${githubUsername}**](https://github.com/${githubUsername})`

    const body = JSON.stringify({
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.4',
            msteams: {
              width: 'Full'
            },
            fallbackText: eventMessage,
            body: [
              {
                type: 'ColumnSet',
                bleed: true,
                spacing: 'None',
                columns: [
                  {
                    type: 'Column',
                    items: [
                      {
                        type: 'TextBlock',
                        text: `The ${workflowLink} workflow on the ${branchLink} branch of ${repoLink} ${getStatusText(status)}`,
                        wrap: true
                      }
                    ],
                    width: 'stretch'
                  },
                  {
                    type: 'Column',
                    items: [
                      {
                        type: 'ActionSet',
                        actions: [
                          {
                            type: 'Action.OpenUrl',
                            title: 'View Run',
                            url: `https://github.com/${repoName}/actions/runs/${runId}`
                          }
                        ]
                      }
                    ],
                    width: 'auto'
                  }
                ]
              },
              {
                type: 'ColumnSet',
                separator: true,
                columns: [
                  {
                    type: 'Column',
                    width: '18px',
                    items: [
                      {
                        type: 'Image',
                        url: getImageUrl(status),
                        altText: getImageAltText(status)
                      }
                    ]
                  },
                  {
                    type: 'Column',
                    width: 'stretch',
                    items: [
                      {
                        type: 'TextBlock',
                        text: message,
                        wrap: true,
                        weight: 'Bolder',
                        size: 'Medium'
                      },
                      {
                        type: 'TextBlock',
                        text: `${workflowLink} #${runNumber}: ${eventMessage} by ${githubUsernameLink} (${fullName})`,
                        wrap: true,
                        size: 'Small'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    })

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })

    if (response.ok) {
      info('Teams notification sent!') // There's no obvious way to get a link to the notification, otherwise we'd include a link.
    } else {
      // TODO: Error handling?
      setFailed('There was an issue sending the notification!')
    }
  } catch (e) {
    setFailed(e.message || e)
  }
}

run()
