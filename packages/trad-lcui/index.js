const JSXParser = require('./src/jsx')
const BaseParser = require('./src/base')
const AppClassParser = require('./src/app')
const WidgetClassParser = require('./src/widget')
const StateBindingParser = require('./src/state')
const PropsBindingParser = require('./src/props')
const EventBindingParser = require('./src/event')
const ComputedPropertyParser = require('./src/computed')

function mixin(base, ...plugins) {
  let cls = base

  plugins.forEach((plugin) => {
    cls = plugin.install(cls)
  })
  return cls
}

function install(Compiler) {
  return mixin(
    Compiler,
    JSXParser,
    WidgetClassParser,
    AppClassParser,
    ComputedPropertyParser,
    EventBindingParser,
    StateBindingParser,
    PropsBindingParser,
    BaseParser
  )
}

module.exports = { install }
