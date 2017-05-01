# Code Mods as a Service

## BOT API

### GET /mods

__Params__

- url {String} url of the mod

__Response__

- isValid {Boolean} whether the mod is valid
- name {String} name of the mod
- description {String} description of the mod

```js
{
    "isValid": true,
    "name": "Add License",
    "description": "Add a LICENSE file to the root of a project"
}
```

### POST /jobs

__Body__

- repos {Array}
    - repoOwner {String}
    - repoName {String}
    - repoBaseBranch: {String}
    - mods {Array}
        - url {String}
        - options {Object}

```js
{
    "repos": [{
        "repoOwner": "canjs",
        "repoName": "can-util",
        "repoBaseBranch": "master",
        "mods": {
            "url": "https://github.com/canjs/can-migrate-codemods/tree/master/lib/transforms/can-addClass.js",
            "options": {
                "glob": "**/*.js"
            }
        }
    }]
}
```

__Response__

- jobID 

```js
{
    "jobID": 1234
}
```

### GET /jobs/{jobId}

__Params__

- jobId {String} id of the job

__Response__

- repos {Array}
    - repoOwner {String}
    - repoName {String}
    - repoBaseBranch: {String}
    - status {ENUM (waiting, working, done, error)}
    - mods {Array}
        - name {String}
        - description {String}
        - status {ENUM (waiting, done, error)}
```js
{
    "repos": [{
        "repoOwner": "canjs",
        "repoName": "can-util",
        "repoBaseBranch": "master",
        "status": "working",
        "mods": {           
            "name": "Con 3.0: Replace can.addClass",
            "description": "Change can.addClass to can-util addClass"
            "options": {
                "glob": "**/*.js"
            }
        }
    }]
}
```
