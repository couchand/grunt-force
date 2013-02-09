# grunt-force

> A Grunt plugin to make development on Salesforce.com not quite so difficult.

## Getting Started
_If you haven't used [grunt][] before, be sure to check out the [Getting Started][] guide._

Not yet on NPM.  When it is you'll be able to install it easily.  For now, fork.

From the same directory as your project's [Gruntfile][Getting Started] and [package.json][], install this plugin with the following command:

```bash
# won't work! not on npm yet!
npm install grunt-force --save-dev
```

Once that's done, add this line to your project's Gruntfile:

```js
grunt.loadNpmTasks('grunt-force');
```

If the plugin has been installed correctly, running `grunt --help` at the command line should list the newly-installed plugin's task or tasks. In addition, the plugin should be listed in package.json as a `devDependency`, which ensures that it will be installed whenever the `npm install` command is run.

[grunt]: http://gruntjs.com/
[Getting Started]: https://github.com/gruntjs/grunt/blob/devel/docs/getting_started.md
[package.json]: https://npmjs.org/doc/json.html

## The "force" task

### Overview
In your project's Gruntfile, add a section named `force` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  force: {
    options: {
      // General options go here
    },
    some_environment: {
      src: ['path/to/files/*.cls']
      options: {
        credentials: 'credentials_file.json'
      }
    },
  },
})
```

### Options

#### options.credentials
Type: `File`

The JSON file holding OAuth and user credentials.

#### options.isCheck
Type: `Boolean`
Default value: task-dependent

Validate only, do not deploy.

#### options.resource
Type: `String`

The resource to fetch with the get task.

### Usage Examples

The basic targets available are `deploy`, `validate`, and `test`.  There is also a `get` utility target.  Assuming you have set up your configuration for `some_environment` as above and created the relevant credentials file, you should be able to invoke targets like this:

```bash
grunt force:some_environment:validate
grunt force:some_environment:deploy
grunt force:some_environment:test
grunt force:some_environment:get:sobjects:account:describe
```

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  force: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
})
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  force: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][].

## Release History
_(Nothing yet)_
