# Landscaper

> Apply code mods to projects

```sh
npm install --global landscaper
```

[![npm](https://img.shields.io/npm/v/landscaper.svg)](https://www.npmjs.com/package/landscaper)

Landscaper is a command-line tool for making sweeping changes to any number of projects using code mods.

## Features

- Combine any number of code mods into a single transformation
- Run code mods on any number of directories at once
- Run code mods on any number of Github repositories at once
- Use code mods published on NPM
- Use code mods saved as Github gists
- Apply [JSCodeShift](https://github.com/facebook/jscodeshift) code mods without any modification
- Automatically submit pull requests to Github repositories

## Use cases

> "I need to upgrade my current codebase with code mods and want to run them all together."

Landscaper can run code mods in a series back to back, no problem.

> "I need to fix a typo in the README of every personal project I ever published on Github, ever."

Landscaper can take your update script and run it against the master branch of each of your repositories. Once finished, it will push the branch with changes and create a pull request.

> "I want to update pre-release version dependencies in the package.json of every project in my Github organization."

Sure, we have a [code mod](https://gist.githubusercontent.com/phillipskevin/75a3626b00dd32709b13132706cb7f30/raw/bbda2496be6a7f97032ef6f60266172fad7309a7/remove-pre-release-deps.js) for that already.

> "I want to switch from tabs|spaces to spaces|tabs in all my diary entries in my `Desktop` folder"

Notice how I did not take a side here.

## Super Mod

The [JSCodeShift](https://github.com/facebook/jscodeshift) code mods take a file and transform it based on its contents. Landscaper supports those mods without any configuration, but in some cases you may want more power. This power lies in a **Super Mod**.

A Super Mod:
- Accepts any number of configuration options, allowing transformations to take user input and be dynamic to use cases.
- Access the entire working directory, have access to the project, and create, delete, and rename files and folders.

Essentially, a Super Mod can do anything. Below is a simple example of a Super Mod that creates a file with the content entered by the user when configuring the code mod.

```js
var fs = require('fs')
var path = require('path')

module.exports = {
  getOptions: function () {
    return [{
      name: 'content',
      type: 'input',
      default: 'Some text I made',
      message: 'Text to write'
    }]
  },

  run: function (directory, options) {
    var text = options.content
    var filepath = path.join(directory, 'foo.txt')
    return new Promise(function (resolve, reject) {
      fs.writeFile(filepath, text, function (error) {
        error ? reject(error) : resolve()
      })
    })
  }
}
```

Note: Configuration options go through [`inquirer.prompt()`](https://github.com/SBoudrias/Inquirer.js/#question).


---

[![Bitovi](assets/bitovi.svg)](https://www.bitovi.com/)

Built and maintained by the open source team at [Bitovi](https://www.bitovi.com/).
